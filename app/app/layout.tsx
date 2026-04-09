import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MagicBlock Agentic Privacy Desk",
  description: "Private intent, quote, and settlement operations for autonomous finance on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-ink bg-mist">
        <div className="site-noise" />
        {children}
      </body>
    </html>
  );
}
