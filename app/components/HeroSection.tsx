import Link from "next/link";

export function HeroSection({
  endpoint,
  primaryHref = "/console",
  secondaryHref = "/platform",
}: {
  endpoint: string;
  primaryHref?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="surface mt-6 grid gap-8 p-7 lg:grid-cols-[1.3fr_0.95fr] lg:p-10">
      <div>
        <p className="muted-label">Private finance, redesigned</p>
        <h1 className="display-title mt-3 max-w-5xl md:text-7xl">
          Every execution opens a private market lane.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
          A modern operations experience for intent, quote, and settlement workflows — built for
          teams running autonomous capital on Solana.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={primaryHref} className="cta">
            Open Live Console
          </Link>
          <Link href={secondaryHref} className="cta-secondary">
            Explore Capabilities
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <span className="info-chip">PER-aligned commitments</span>
          <span className="info-chip">Private payments settlement</span>
          <span className="info-chip">Policy-driven control</span>
        </div>
      </div>

      <div className="rounded-panel border border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f5efe4_100%)] p-5">
        <p className="muted-label">System Snapshot</p>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
            <p className="font-semibold text-slate-900">Execution Model</p>
            <p className="mt-1">Private Intent → Private Quote → Policy Check → Settlement</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
            <p className="font-semibold text-slate-900">Operating Network</p>
            <p className="mt-1 break-all">{endpoint}</p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
            <p className="font-semibold text-slate-900">Design Principle</p>
            <p className="mt-1">Private-by-default, verifiable-by-design.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
