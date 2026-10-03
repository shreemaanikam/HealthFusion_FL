import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { featureStatus } from "@/data/feature-status";

const baseline = [
  { title: "Data locality", body: "Patient records are processed and stored inside each hospital's own environment. Nothing raw is centralized." },
  { title: "TLS / encryption in transit", body: "Every request between a hospital connector and the coordination server is encrypted in transit." },
  { title: "Audit logging", body: "Federated rounds, hospital connections, model updates, and predictions are written to an append-only audit trail." },
  { title: "Role-based access", body: "Doctor, Hospital Administrator, Researcher, and System Administrator each see a different, narrower slice of the platform." },
];

const advanced = featureStatus.filter((f) =>
  ["Differential privacy", "Secure aggregation", "Adaptive aggregation", "Flower federated learning"].includes(f.name)
);

export default function SecurityPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Security</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          What protects a hospital's data, specifically.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          HealthFusion_FL has not undergone independent regulatory or clinical-compliance certification. What follows
          is a factual account of what's implemented today — not a compliance claim.
        </p>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="font-display text-lg font-semibold text-ink">In place today</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {baseline.map((b) => (
              <div key={b.title} className="rounded border border-line bg-surface p-5">
                <h3 className="font-display text-sm font-semibold text-ink">{b.title}</h3>
                <p className="mt-1.5 text-sm text-slate">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="font-display text-lg font-semibold text-ink">Advanced privacy mechanisms</h2>
          <p className="mt-2 max-w-prose text-sm text-slate">
            These are the mechanisms most often asked about by security-conscious hospitals. We label each honestly
            rather than implying it's active before it is.
          </p>
          <div className="mt-5 divide-y divide-line rounded border border-line bg-surface">
            {advanced.map((f) => (
              <div key={f.name} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink">{f.name}</p>
                  {f.note && <p className="mt-0.5 text-xs text-mist">{f.note}</p>}
                </div>
                <FeatureStatusBadge status={f.status} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded border border-amber bg-amber-soft p-5 text-sm text-amber">
            HealthFusion_FL does not claim HIPAA, SOC 2, or any other regulatory certification. Nothing on this page
            should be read as a compliance guarantee for any specific jurisdiction or use case.
          </div>
        </div>
      </section>
    </div>
  );
}
