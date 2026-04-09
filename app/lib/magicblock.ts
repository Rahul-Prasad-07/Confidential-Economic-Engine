import {
  MAGICBLOCK_API_BASE,
  MAGICBLOCK_API_KEY,
  MAGICBLOCK_PER_PATH,
  MAGICBLOCK_PRIVATE_PAYMENTS_PATH,
  MAGICBLOCK_QUOTE_PATH,
  MAGICBLOCK_REQUIRE_LIVE,
  MAGICBLOCK_TIMEOUT_MS,
} from "./constants";

export type PrivateIntentPayload = {
  sessionId: number;
  intentText: string;
  notionalCap: number;
  slippageBps: number;
};

export type PrivateQuotePayload = {
  sessionId: number;
  quoteText: string;
};

export type PrivateSettlementPayload = {
  sessionId: number;
  amount: number;
  slippageBps: number;
};

export type MagicBlockResult = {
  commitmentHex: string;
  receiptId: string;
  mode: "live" | "simulated";
};

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((valueByte) => valueByte.toString(16).padStart(2, "0"))
    .join("");
}

function randomReceiptId(prefix: string) {
  const random = Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, "0");
  return `${prefix}-${Date.now()}-${random}`;
}

async function tryPost(path: string, payload: object): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAGICBLOCK_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };

    if (MAGICBLOCK_API_KEY) {
      headers.authorization = `Bearer ${MAGICBLOCK_API_KEY}`;
    }

    const response = await fetch(`${MAGICBLOCK_API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackIfAllowed(commitmentHex: string, receiptPrefix: string): MagicBlockResult {
  if (MAGICBLOCK_REQUIRE_LIVE) {
    throw new Error("MagicBlock live integration required, but live API call failed");
  }

  return {
    commitmentHex,
    receiptId: randomReceiptId(`${receiptPrefix}-sim`),
    mode: "simulated",
  };
}

export async function createPrivateIntent(
  payload: PrivateIntentPayload
): Promise<MagicBlockResult> {
  const commitmentHex = await sha256Hex(
    `${payload.sessionId}|${payload.intentText}|${payload.notionalCap}|${payload.slippageBps}`
  );

  const body = {
    session_id: payload.sessionId,
    intent: payload.intentText,
    notional_cap: payload.notionalCap,
    slippage_bps: payload.slippageBps,
    commitment: commitmentHex,
  };

  const liveResponse = await tryPost(MAGICBLOCK_PER_PATH, body);
  if (liveResponse) {
    return {
      commitmentHex,
      receiptId: randomReceiptId("per-intent-live"),
      mode: "live",
    };
  }

  return fallbackIfAllowed(commitmentHex, "per-intent");
}

export async function createPrivateQuote(
  payload: PrivateQuotePayload
): Promise<MagicBlockResult> {
  const commitmentHex = await sha256Hex(
    `${payload.sessionId}|${payload.quoteText}`
  );

  const body = {
    session_id: payload.sessionId,
    quote: payload.quoteText,
    commitment: commitmentHex,
  };

  const liveResponse = await tryPost(MAGICBLOCK_QUOTE_PATH, body);
  if (liveResponse) {
    return {
      commitmentHex,
      receiptId: randomReceiptId("per-quote-live"),
      mode: "live",
    };
  }

  return fallbackIfAllowed(commitmentHex, "per-quote");
}

export async function settlePrivatePayment(
  payload: PrivateSettlementPayload
): Promise<MagicBlockResult> {
  const settlementText = `${payload.sessionId}|${payload.amount}|${payload.slippageBps}`;
  const commitmentHex = await sha256Hex(settlementText);

  const body = {
    session_id: payload.sessionId,
    amount: payload.amount,
    slippage_bps: payload.slippageBps,
    settlement_ref: commitmentHex,
  };

  const liveResponse = await tryPost(MAGICBLOCK_PRIVATE_PAYMENTS_PATH, body);
  if (liveResponse) {
    return {
      commitmentHex,
      receiptId: randomReceiptId("private-payment-live"),
      mode: "live",
    };
  }

  return fallbackIfAllowed(commitmentHex, "private-payment");
}

export function hexToBytes32(hex: string): number[] {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  const output = new Array(32).fill(0);
  for (let index = 0; index < 32; index += 1) {
    const start = index * 2;
    const pair = normalized.slice(start, start + 2);
    output[index] = pair ? parseInt(pair, 16) : 0;
  }
  return output;
}
