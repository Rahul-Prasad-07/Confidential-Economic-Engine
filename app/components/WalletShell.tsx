"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

const SafeConnectionProvider = ConnectionProvider as unknown as React.ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;

const SafeWalletProvider = WalletProvider as unknown as React.ComponentType<{
  wallets: Array<PhantomWalletAdapter | SolflareWalletAdapter>;
  autoConnect?: boolean;
  children: ReactNode;
}>;

const SafeWalletModalProvider = WalletModalProvider as unknown as React.ComponentType<{
  children: ReactNode;
}>;

export function WalletShell({ endpoint, children }: { endpoint: string; children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <SafeConnectionProvider endpoint={endpoint}>
      <SafeWalletProvider wallets={wallets} autoConnect>
        <SafeWalletModalProvider>{children}</SafeWalletModalProvider>
      </SafeWalletProvider>
    </SafeConnectionProvider>
  );
}

export function WalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <button className="cta">Connect Wallet</button>;
  }

  return (
    <WalletMultiButton className="!rounded-full !bg-slate-950 !text-white hover:!bg-slate-800" />
  );
}
