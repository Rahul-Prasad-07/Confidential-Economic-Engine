"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "./WalletShell";

type RunStatus = "idle" | "running";

type DeskPolicy = {
  maxNotional: number;
  maxSlippageBps: number;
  dailyCap: number;
};

function currentTime() {
  return new Date().toLocaleTimeString();
}

export function ConsoleSection({ compactHeader = false }: { compactHeader?: boolean }) {
  const wallet = useWallet();

  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(1001);
  const [intent, setIntent] = useState("rebalance:SOL-USDC:private");
  const [quote, setQuote] = useState("makerA:mid+4bps:ttl30s");
  const [policy, setPolicy] = useState<DeskPolicy>({
    maxNotional: 1_000_000,
    maxSlippageBps: 250,
    dailyCap: 5_000_000,
  });

  const walletLabel = useMemo(() => {
    const pubkey = wallet.publicKey?.toBase58();
    if (!pubkey) return "Not connected";
    return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
  }, [wallet.publicKey]);

  const addLog = (line: string) => {
    setLogs((previous) => [`[${currentTime()}] ${line}`, ...previous].slice(0, 80));
  };

  const runStep = async (label: string, nextStep: number) => {
    if (runStatus === "running") return;
    setRunStatus("running");
    addLog(`Starting ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setStep((previous) => Math.max(previous, nextStep));
    addLog(`Completed ${label}`);
    setRunStatus("idle");
  };

  const progress = Math.min(100, Math.max(0, (step / 4) * 100));

  const applyScenario = (scenario: "rebalance" | "market-maker" | "payments") => {
    if (scenario === "rebalance") {
      setIntent("rebalance:SOL-USDC:private");
      setQuote("makerA:mid+4bps:ttl30s");
      setPolicy({ maxNotional: 1_000_000, maxSlippageBps: 250, dailyCap: 5_000_000 });
      setSessionId(1001);
      addLog("Scenario loaded: Treasury rebalance");
      return;
    }

    if (scenario === "market-maker") {
      setIntent("rfq:SOL-USDC:block:private");
      setQuote("makerB:mid+2bps:ttl20s");
      setPolicy({ maxNotional: 2_500_000, maxSlippageBps: 120, dailyCap: 12_000_000 });
      setSessionId(2107);
      addLog("Scenario loaded: Market maker quote flow");
      return;
    }

    setIntent("a2a:service-payment:private");
    setQuote("agent-node:fixed+1bps:ttl60s");
    setPolicy({ maxNotional: 120_000, maxSlippageBps: 80, dailyCap: 1_500_000 });
    setSessionId(3302);
    addLog("Scenario loaded: Agentic payment flow");
  };

  return (
    <section id="console" className="surface mt-6 scroll-mt-24 p-7 lg:p-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {!compactHeader ? (
            <>
              <p className="muted-label">Live Product Console</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Operate private workflows with clarity
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Fresh UX for demos and operations. Wire each action to your on-chain and API calls as needed.
              </p>
            </>
          ) : (
            <>
              <p className="muted-label">Console Engine</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                Policy and session operations
              </h2>
            </>
          )}
        </div>
        <WalletButton />
      </div>

      <div className="mt-5 rounded-2xl border border-black/5 bg-slate-50/80 px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold uppercase tracking-calm">Execution Progress</span>
          <span>Step {step} / 4</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="cta-secondary" onClick={() => applyScenario("rebalance")} disabled={runStatus === "running"}>Treasury Rebalance</button>
        <button className="cta-secondary" onClick={() => applyScenario("market-maker")} disabled={runStatus === "running"}>Market Maker</button>
        <button className="cta-secondary" onClick={() => applyScenario("payments")} disabled={runStatus === "running"}>Agentic Payments</button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
            <p className="muted-label">Session Inputs</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Session ID</label>
                <input className="form-input" type="number" value={sessionId} onChange={(event) => setSessionId(Number(event.target.value))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Max Notional</label>
                <input
                  className="form-input"
                  type="number"
                  value={policy.maxNotional}
                  onChange={(event) => setPolicy((prev) => ({ ...prev, maxNotional: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Max Slippage (bps)</label>
                <input
                  className="form-input"
                  type="number"
                  value={policy.maxSlippageBps}
                  onChange={(event) => setPolicy((prev) => ({ ...prev, maxSlippageBps: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Daily Cap</label>
                <input
                  className="form-input"
                  type="number"
                  value={policy.dailyCap}
                  onChange={(event) => setPolicy((prev) => ({ ...prev, dailyCap: Number(event.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Intent</label>
                <input className="form-input" value={intent} onChange={(event) => setIntent(event.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-calm text-slate-500">Quote</label>
                <input className="form-input" value={quote} onChange={(event) => setQuote(event.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-panel border border-black/5 bg-white p-5">
            <p className="muted-label">Actions</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <button className="cta" onClick={() => runStep("Initialize Desk", 1)} disabled={runStatus === "running"}>Initialize Desk</button>
              <button className="cta-secondary" onClick={() => runStep("Update Policy", 1)} disabled={runStatus === "running"}>Update Policy</button>
              <button className="cta-secondary" onClick={() => runStep("Open Intent", 2)} disabled={runStatus === "running"}>Open Intent</button>
              <button className="cta-secondary" onClick={() => runStep("Submit Quote", 3)} disabled={runStatus === "running"}>Submit Quote</button>
              <button className="cta-secondary" onClick={() => runStep("Settle Execution", 4)} disabled={runStatus === "running"}>Settle Execution</button>
              <button className="cta-secondary" onClick={() => runStep("Cancel Session", 2)} disabled={runStatus === "running"}>Cancel Session</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-panel border border-black/5 bg-white p-5">
            <p className="muted-label">Current State</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">Wallet:</span> {walletLabel}</p>
              <p className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">Session:</span> {sessionId}</p>
              <p className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">Progress:</span> Step {step} / 4</p>
              <p className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">Intent:</span> {intent}</p>
              <p className="rounded-2xl border border-black/5 bg-slate-50 px-3 py-2"><span className="font-semibold text-slate-900">Quote:</span> {quote}</p>
            </div>
          </div>

          <div className="rounded-panel border border-black/5 bg-white p-5">
            <p className="muted-label">Operator Logs</p>
            <div className="mt-3 h-72 overflow-y-auto rounded-2xl border border-black/5 bg-slate-50 p-3 text-xs text-slate-600">
              {logs.length === 0 ? <p>No actions yet.</p> : logs.map((line, index) => <p key={`${line}-${index}`} className="mb-1 break-all">{line}</p>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
