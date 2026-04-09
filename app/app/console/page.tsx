"use client";

import { clusterApiUrl } from "@solana/web3.js";
import { useState } from "react";

import { ConsoleSection } from "../../components/ConsoleSection";
import { SiteShell } from "../../components/SiteShell";
import { WalletShell } from "../../components/WalletShell";

export default function ConsolePage() {
  const [network, setNetwork] = useState<"devnet" | "localnet">("devnet");
  const endpoint = network === "devnet" ? clusterApiUrl("devnet") : "http://127.0.0.1:8899";

  return (
    <WalletShell endpoint={endpoint}>
      <SiteShell>
        <section className="surface mt-6 p-7 lg:p-10">
          <p className="muted-label">Console</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Live private workflow operations
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Manage policy, session inputs, and lifecycle actions from one command center.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="muted-label">Network</span>
            <select
              className="form-input max-w-48"
              value={network}
              onChange={(event) => setNetwork(event.target.value as "devnet" | "localnet")}
            >
              <option value="devnet">Devnet</option>
              <option value="localnet">Localnet</option>
            </select>
          </div>
        </section>

        <ConsoleSection compactHeader />
      </SiteShell>
    </WalletShell>
  );
}
