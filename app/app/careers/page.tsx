import { SiteShell } from "../../components/SiteShell";

const roles = [
  {
    title: "Frontend Product Engineer",
    location: "Remote",
    summary: "Build polished operator experiences for private-by-default on-chain systems.",
  },
  {
    title: "Protocol Integrations Engineer",
    location: "Remote",
    summary: "Integrate private workflow APIs and stateful settlement rails with production reliability.",
  },
  {
    title: "Security & Reliability Engineer",
    location: "Remote",
    summary: "Design safeguards, observability, and incident workflows for autonomous finance operations.",
  },
];

export default function CareersPage() {
  return (
    <SiteShell>
      <section className="surface mt-6 p-7 lg:p-10">
        <p className="muted-label">Careers</p>
        <h1 className="display-title mt-2">Join us in shaping private autonomous finance</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          We are building the operational layer where privacy, policy, and verifiability meet.
          If you care about rigorous systems and excellent product design, we should talk.
        </p>

        <div className="mt-6 grid gap-4">
          {roles.map((role) => (
            <article key={role.title} className="rounded-panel border border-black/5 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{role.title}</h2>
                <span className="info-chip">{role.location}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{role.summary}</p>
              <a href="mailto:hello@magicblock.gg" className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
                Apply via email
              </a>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
