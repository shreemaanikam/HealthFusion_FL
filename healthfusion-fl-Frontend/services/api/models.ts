import { DEMO_MODE } from "@/lib/demo-mode";
import { demoModelRegistry } from "@/data/demo/models";
import type { ModelRegistrySnapshot, ModelVersion } from "@/types/model";
import { apiFetch } from "./client";

/** GET /api/models */
export async function getModels(): Promise<ModelVersion[]> {
  return apiFetch<ModelVersion[]>("/api/models");
}

/** GET /api/models/:model_id */
export async function getModel(modelId: string): Promise<ModelVersion> {
  return apiFetch<ModelVersion>(`/api/models/${modelId}`);
}

/** GET /api/models/active */
export async function getActiveModel(): Promise<ModelVersion> {
  return apiFetch<ModelVersion>("/api/models/active");
}

/**
 * The Models and Model Comparison pages want one registry object.
 * trainingState isn't provided by any endpoint in the contract -- rather
 * than invent a number, live mode reports "idle" unless the active
 * model's own status says otherwise. Tighten this once the contract
 * exposes real training-job state.
 */
export async function getModelRegistry(): Promise<ModelRegistrySnapshot> {
  if (DEMO_MODE) return demoModelRegistry;
  const [versions, active] = await Promise.all([getModels(), getActiveModel()]);
  return {
    currentModelVersion: active.version,
    trainingState: active.status === "training" ? "training" : "idle",
    deploymentState: active.status === "deployed" || active.status === "active" ? "deployed" : "staged",
    versions,
    source: "live",
  };
}

export async function getModelValidationReport(): Promise<any> {
  if (DEMO_MODE) {
    // Return mock for demo
    return { status_labels: { external_validation: "PENDING" }, test_metrics: { accuracy: 0.95 } };
  }
  return apiFetch<any>("/api/models/validation_report");
}
