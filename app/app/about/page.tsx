import { SiteShell } from "../../components/SiteShell";

const pillars = [
  ["Private by default", "Execution details remain private while maintaining verifiable state transitions."],
  ["Policy first", "Risk boundaries are encoded before automation runs in production."],
  ["Operator clarity", "The product UI is optimized for decision confidence and lifecycle observability."],
];

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="surface mt-6 p-7 lg:p-10">
        <p className="muted-label">About</p>
        <h1 className="display-title mt-2">
          Building the default operating layer for private autonomous finance
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          MagicBlock Agentic Privacy Desk is focused on making private execution understandable,
          controllable, and deployable for serious organizations.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pillars.map(([title, text]) => (
            <article key={title} className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article id="privacy" className="rounded-panel border border-black/5 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Operational and user data handling should follow your organization’s governance,
              compliance, and jurisdiction-specific requirements.
            </p>
          </article>
          <article id="terms" className="rounded-panel border border-black/5 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Terms</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This interface is provided as a product foundation for private workflow operations.
              Final legal terms should be reviewed and approved by your organization.
            </p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
