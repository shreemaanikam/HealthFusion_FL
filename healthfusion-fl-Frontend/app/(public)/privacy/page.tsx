import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { demoPrivacySnapshot } from "@/data/demo/privacy";

export default function PrivacyMarketingPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Privacy</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          What stays inside a hospital, technically.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          Not a privacy policy — a description of what crosses the boundary and what doesn't. The same statuses shown
          here drive the Privacy Center inside the platform, so they can never drift apart.
        </p>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded border border-line bg-surface p-6">
              <p className="text-xs font-semibold text-navy">Inside the hospital environment</p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">Raw patient data</p>
              <p className="mt-1 text-sm text-slate">Records, labs, identifiers — processed locally, stored locally, never exported.</p>
            </div>
            <div className="rounded border border-teal bg-teal-soft p-6">
              <p className="text-xs font-semibold text-teal">Crosses the boundary</p>
              <p className="mt-1 font-display text-lg font-semibold text-navy">Encrypted model updates</p>
              <p className="mt-1 text-sm text-slate">Gradients only — aggregated with other hospitals' updates before reaching the global model.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="font-display text-xl font-semibold text-ink">Every control, honestly labeled</h2>
          <p className="mt-2 max-w-prose text-sm text-slate">
            We don't mark a mechanism active until it's implemented. Simulation means the interface and data contract
            exist and behave correctly against demo data; planned means it's designed but not built.
          </p>
          <div className="mt-6 divide-y divide-line">
            {demoPrivacySnapshot.controls.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{c.label}</p>
                  <p className="text-xs text-mist">{c.description}</p>
                </div>
                <FeatureStatusBadge status={c.status as "active" | "simulation" | "demo" | "planned"} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
