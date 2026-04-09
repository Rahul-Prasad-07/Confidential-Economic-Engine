import { SiteShell } from "../../components/SiteShell";
import { UseCases } from "../../components/UseCases";

const solutionRows = [
  {
    title: "Treasury teams",
    description:
      "Execute rebalancing and strategic capital shifts with private intent handling and clear policy boundaries.",
  },
  {
    title: "Trading desks",
    description:
      "Run private quote workflows and settlement traces while controlling slippage and daily notional exposure.",
  },
  {
    title: "Agent marketplaces",
    description:
      "Enable machine-to-machine commercial flows that require private state and deterministic execution outcomes.",
  },
];

export default function SolutionsPage() {
  return (
    <SiteShell>
      <section className="surface mt-6 p-7 lg:p-10">
        <p className="muted-label">Solutions</p>
        <h1 className="display-title mt-2">
          Production use-cases for private-by-default operations
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {solutionRows.map((row) => (
            <article key={row.title} className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{row.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{row.description}</p>
            </article>
          ))}
        </div>
      </section>

      <UseCases />
    </SiteShell>
  );
}
