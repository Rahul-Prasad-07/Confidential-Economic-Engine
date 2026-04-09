const useCases = [
  {
    title: "Treasury Rebalancing",
    body: "Move large positions without revealing strategy or leaking signals before execution finality.",
    tag: "DAO",
  },
  {
    title: "Private RFQ Desk",
    body: "Collect quote commitments from counterparties privately and execute under explicit policy constraints.",
    tag: "Trading",
  },
  {
    title: "Agent Commerce",
    body: "Enable machine-to-machine value exchange with bounded risk controls and receipt-grade settlement trails.",
    tag: "Agentic",
  },
  {
    title: "Institutional Operations",
    body: "Retain auditability while preserving sensitive execution metadata for compliance-aware deployment.",
    tag: "Enterprise",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="surface mt-6 scroll-mt-24 p-7 lg:p-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="muted-label">Use Cases</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Built for teams moving real capital
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {useCases.map((item) => (
          <article key={item.title} className="rounded-panel border border-black/5 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <span className="info-chip">{item.tag}</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
