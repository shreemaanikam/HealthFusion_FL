import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import type { FeatureStatus } from "@/types/federated";

const stack: { layer: string; detail: string; status: FeatureStatus }[] = [
  { layer: "Modeling", detail: "TensorFlow for the local and global diabetes-risk models, served by FastAPI.", status: "active" },
  { layer: "Explainability", detail: "SHAP feature attribution, computed per prediction.", status: "active" },
  { layer: "Federated learning", detail: "Flower-based FedAvg, with an adaptive reliability-weighted aggregation strategy.", status: "simulation" },
  { layer: "Differential privacy", detail: "Noise calibration applied in a controlled simulation, not yet on real hospital infrastructure.", status: "simulation" },
  { layer: "Secure aggregation", detail: "Cryptographic aggregation so the coordinator never sees one hospital's raw update in isolation.", status: "planned" },
  { layer: "Narrative layer", detail: "OpenRouter turns a structured prediction into clinician-readable text, server-side only — the API key never reaches this frontend.", status: "active" },
  { layer: "Deployment", detail: "Containerized services behind a coordination server; this frontend runs independently in demo mode with no backend at all.", status: "active" },
];

export default function TechnologyPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Technology</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          The stack behind the federation.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          Seven layers, from model architecture to deployment. Each is labeled by what's actually running today.
        </p>
      </section>
      <section className="hf-rule">
        <div className="mx-auto max-w-4xl divide-y divide-line px-6">
          {stack.map((s) => (
            <div key={s.layer} className="grid gap-2 py-6 sm:grid-cols-[200px_1fr_auto] sm:items-start sm:gap-6">
              <h2 className="font-display text-base font-semibold text-ink">{s.layer}</h2>
              <p className="text-sm text-slate">{s.detail}</p>
              <FeatureStatusBadge status={s.status} className="sm:mt-0.5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
