const capabilities = [
  {
    title: "Intent Privacy",
    body: "Commit intent metadata without exposing amount, route, or timing to public observers.",
  },
  {
    title: "On-Chain Policy Engine",
    body: "Apply strict controls for max notional, slippage, daily limits, and emergency halt behavior.",
  },
  {
    title: "Private Settlement",
    body: "Finalize trade/payment rails using MagicBlock-aligned private settlement integrations.",
  },
  {
    title: "Operational Observability",
    body: "Track lifecycle events and receipts in an operator-focused console built for production teams.",
  },
];

export function CapabilityGrid() {
  return (
    <section id="capabilities" className="surface mt-6 scroll-mt-24 p-7 lg:p-9">
      <div className="mb-5">
        <p className="muted-label">Capabilities</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          A full private execution stack for modern on-chain operators
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {capabilities.map((item) => (
          <article key={item.title} className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
