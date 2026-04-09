"use client";

import { clusterApiUrl } from "@solana/web3.js";
import { useState } from "react";

import { CapabilityGrid } from "../components/CapabilityGrid";
import { ConsoleSection } from "../components/ConsoleSection";
import { HeroSection } from "../components/HeroSection";
import { SiteShell } from "../components/SiteShell";
import { UseCases } from "../components/UseCases";
import { WalletShell } from "../components/WalletShell";

export default function HomePage() {
  const [network, setNetwork] = useState<"devnet" | "localnet">("devnet");
  const endpoint = network === "devnet" ? clusterApiUrl("devnet") : "http://127.0.0.1:8899";

  return (
    <WalletShell endpoint={endpoint}>
      <SiteShell>
        <div id="platform">
          <HeroSection endpoint={endpoint} />
        </div>

        <div className="mt-4 flex items-center gap-3">
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

        <CapabilityGrid />
        <UseCases />
        <ConsoleSection />
      </SiteShell>
    </WalletShell>
  );
}
