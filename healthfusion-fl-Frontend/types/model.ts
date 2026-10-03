export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number | null;
  calibration: "implemented" | "planned";
}

export interface ModelVersion {
  version: string;
  releasedAt: string;
  kind:
    | "Logistic Regression"
    | "Decision Tree"
    | "Random Forest"
    | "Neural Network"
    | "Federated Model"
    | "Adaptive Federated Model";
  metrics: ModelMetrics;
  status: "active" | "deployed" | "archived" | "training";
}

export interface ModelRegistrySnapshot {
  currentModelVersion: string;
  trainingState: "idle" | "training" | "aggregating";
  deploymentState: "deployed" | "staged" | "rolled_back";
  versions: ModelVersion[];
  source: "demo" | "live";
}
