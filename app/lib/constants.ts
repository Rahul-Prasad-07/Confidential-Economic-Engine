import { PublicKey } from "@solana/web3.js";

export const CEE_PROGRAM_ID = new PublicKey(
  "BpZDexTuoFCrLyxEkD7tv2jRotJGVtCpyuhDReeWvEN4"
);

export const MAGICBLOCK_API_BASE =
  process.env.NEXT_PUBLIC_MAGICBLOCK_API_BASE ?? "https://api.magicblock.gg";

export const MAGICBLOCK_API_KEY =
  process.env.NEXT_PUBLIC_MAGICBLOCK_API_KEY ?? "";

export const MAGICBLOCK_REQUIRE_LIVE =
  process.env.NEXT_PUBLIC_MAGICBLOCK_REQUIRE_LIVE === "true";

export const MAGICBLOCK_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_MAGICBLOCK_TIMEOUT_MS ?? "12000"
);

export const MAGICBLOCK_PRIVATE_PAYMENTS_PATH =
  process.env.NEXT_PUBLIC_MAGICBLOCK_PRIVATE_PAYMENTS_PATH ??
  "/v1/private-payments/settle";

export const MAGICBLOCK_PER_PATH =
  process.env.NEXT_PUBLIC_MAGICBLOCK_PER_PATH ?? "/v1/per/intents";

export const MAGICBLOCK_QUOTE_PATH =
  process.env.NEXT_PUBLIC_MAGICBLOCK_QUOTE_PATH ?? "/v1/per/quotes";
