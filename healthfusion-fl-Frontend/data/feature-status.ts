import type { FeatureStatus } from "@/types/federated";

export interface FeatureStatusEntry {
  name: string;
  status: FeatureStatus;
  note?: string;
}

/**
 * Single source of truth for what's actually true about HealthFusion_FL
 * today (Section I). Every public and in-app page that makes a claim
 * about a capability reads from this list rather than writing its own
 * copy, so the claims can't drift out of sync with each other.
 */
export const featureStatus: FeatureStatusEntry[] = [
  { name: "TensorFlow prediction", status: "active", note: "Serves POST /api/prediction." },
  { name: "SHAP explainability", status: "active", note: "Serves POST /api/explainability." },
  { name: "FastAPI backend", status: "active" },
  { name: "Flower federated learning", status: "simulation", note: "Aggregation logic runs; not yet across real hospital infrastructure." },
  { name: "Adaptive aggregation", status: "simulation" },
  { name: "Differential privacy", status: "simulation" },
  { name: "Secure aggregation", status: "planned" },
  { name: "OpenRouter narrative layer", status: "active", note: "Active only when an OpenRouter key is configured server-side; never exposed to the frontend." },
];

export function statusOf(name: string): FeatureStatus {
  return featureStatus.find((f) => f.name === name)?.status ?? "planned";
}
