import type { ModelRegistrySnapshot } from "@/types/model";

export const demoModelRegistry: ModelRegistrySnapshot = {
  currentModelVersion: "v4.2.1",
  trainingState: "idle",
  deploymentState: "deployed",
  source: "demo",
  versions: [
    {
      version: "v1.0.0",
      releasedAt: "2026-02-10T09:00:00Z",
      kind: "Logistic Regression",
      status: "archived",
      metrics: { accuracy: 0.812, precision: 0.744, recall: 0.701, f1: 0.722, rocAuc: 0.84, calibration: "planned" },
    },
    {
      version: "v1.4.0",
      releasedAt: "2026-03-02T09:00:00Z",
      kind: "Decision Tree",
      status: "archived",
      metrics: { accuracy: 0.836, precision: 0.769, recall: 0.733, f1: 0.751, rocAuc: 0.861, calibration: "planned" },
    },
    {
      version: "v2.1.0",
      releasedAt: "2026-04-18T09:00:00Z",
      kind: "Random Forest",
      status: "archived",
      metrics: { accuracy: 0.874, precision: 0.812, recall: 0.79, f1: 0.801, rocAuc: 0.902, calibration: "planned" },
    },
    {
      version: "v3.0.0",
      releasedAt: "2026-06-05T09:00:00Z",
      kind: "Neural Network",
      status: "archived",
      metrics: { accuracy: 0.891, precision: 0.834, recall: 0.812, f1: 0.823, rocAuc: 0.921, calibration: "implemented" },
    },
    {
      version: "v3.8.0",
      releasedAt: "2026-07-22T09:00:00Z",
      kind: "Federated Model",
      status: "archived",
      metrics: { accuracy: 0.907, precision: 0.86, recall: 0.831, f1: 0.845, rocAuc: 0.934, calibration: "implemented" },
    },
    {
      version: "v4.2.1",
      releasedAt: "2026-09-20T09:00:00Z",
      kind: "Adaptive Federated Model",
      status: "active",
      metrics: { accuracy: 0.923, precision: 0.881, recall: 0.858, f1: 0.869, rocAuc: 0.951, calibration: "implemented" },
    },
  ],
};
