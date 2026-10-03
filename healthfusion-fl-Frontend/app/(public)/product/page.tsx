import { Button } from "@/components/ui/Button";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import type { FeatureStatus } from "@/types/federated";

const capabilities: { title: string; body: string; status: FeatureStatus }[] = [
  {
    title: "Prediction",
    body: "A binary diabetes-risk model scores a patient assessment in seconds, served by a real TensorFlow model behind FastAPI.",
    status: "active",
  },
  {
    title: "Explainability",
    body: "Every prediction returns per-feature SHAP contributions — which measurements pushed risk up, which pulled it down.",
    status: "active",
  },
  {
    title: "Federated learning",
    body: "FedAvg and an adaptive variant, built on Flower, aggregate updates from participating hospitals into one shared model.",
    status: "simulation",
  },
  {
    title: "Adaptive intelligence",
    body: "Aggregation weights adjust per hospital based on reliability score and data volume, rather than a flat average.",
    status: "simulation",
  },
  {
    title: "Privacy",
    body: "Raw patient records never leave a hospital's own environment by architecture. Only model updates cross the coordination boundary.",
    status: "active",
  },
  {
    title: "Monitoring",
    body: "Federated rounds, hospital health, and model versions are tracked on an append-only audit timeline.",
    status: "active",
  },
];

export default function ProductPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Product</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          One platform, six capabilities, one shared privacy boundary.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          HealthFusion_FL is not a hospital management system. It's the layer that lets hospitals train together
          without handing patient records to anyone.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/how-it-works" variant="secondary">See the data flow</Button>
          <Button href="/for-hospitals" variant="secondary">For hospitals</Button>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded border border-line bg-line px-0 py-0 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div key={c.title} className="bg-surface p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-ink">{c.title}</h2>
                <FeatureStatusBadge status={c.status} className="shrink-0" />
              </div>
              <p className="mt-2 text-sm text-slate">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
