import { CapabilityGrid } from "../../components/CapabilityGrid";
import { HeroSection } from "../../components/HeroSection";
import { SiteShell } from "../../components/SiteShell";

export default function PlatformPage() {
  return (
    <SiteShell>
      <section className="surface mt-6 p-7 lg:p-10">
        <p className="muted-label">Platform</p>
        <h1 className="display-title mt-2">
          Private execution infrastructure for autonomous systems
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          The platform unifies private intent coordination, policy-constrained state transitions,
          and verifiable settlement outcomes on Solana.
        </p>
      </section>

      <HeroSection endpoint="Solana Devnet / Localnet configurable" primaryHref="/console" secondaryHref="/solutions" />
      <CapabilityGrid />
    </SiteShell>
  );
}
