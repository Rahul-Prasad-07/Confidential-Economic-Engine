import { SiteShell } from "../../components/SiteShell";

const controls = [
  {
    title: "Policy Constraints",
    body: "Maximum notional, slippage thresholds, daily limits, and halt controls are configurable before execution.",
  },
  {
    title: "Deterministic Lifecycle",
    body: "Sessions follow a strict state transition path: intent → quote → checks → settlement.",
  },
  {
    title: "Private + Verifiable",
    body: "Sensitive execution attributes remain private while receipts and status remain auditable.",
  },
  {
    title: "Operational Visibility",
    body: "Operator logs, scenario presets, and status indicators support fast, informed intervention.",
  },
];

export default function SecurityPage() {
  return (
    <SiteShell>
      <section className="surface mt-6 p-7 lg:p-10">
        <p className="muted-label">Security</p>
        <h1 className="display-title mt-2">Controls-first architecture for private execution</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Security in this system is operational by design: policy boundaries are encoded first,
          private workflow steps are explicit, and settlement traces remain verifiable.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {controls.map((item) => (
            <article key={item.title} className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
