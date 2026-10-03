export type RiskLevel = "low" | "moderate" | "high";

export interface AssessmentInput {
  gender: "female" | "male" | "other";
  age: number;
  hypertension: boolean;
  heartDisease: boolean;
  smokingHistory:
    | "never"
    | "former"
    | "current"
    | "not_current"
    | "ever"
    | "no_info";
  bmi: number;
  hba1cLevel: number;
  bloodGlucoseLevel: number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: string;
  contribution: number; // signed, SHAP-style
  direction: "increases_risk" | "decreases_risk";
}

export interface AssessmentResult {
  id: string;
  createdAt: string;
  patientRef: string;
  input: AssessmentInput;
  riskLevel: RiskLevel;
  probability: number; // 0-1
  confidence: number;  // 0-1 (defaults to probability when not provided by backend)
  modelVersion: string;
  featureContributions: FeatureContribution[];
  status: "completed" | "failed";
  source: "demo" | "live";
}

export interface AssessmentHistoryItem {
  id: string;
  createdAt: string;
  patientRef: string;
  modelVersion: string;
  riskLevel: RiskLevel;
  confidence: number;
  status: "completed" | "failed";
}

// ---------------------------------------------------------------------------
// Live-mode backend contract shapes
// ---------------------------------------------------------------------------

/**
 * POST /api/prediction response.
 * Backend schema (PredictionResponse):
 *   prediction: int (0 or 1)
 *   probability: float
 *   risk_level: str ("low" | "moderate" | "high")
 *   model_version: str
 *   timestamp: str
 *   explanation_available: bool
 *   disclaimer: str
 *
 * After snake→camelCase normalization by wire.ts these become:
 *   prediction, probability, riskLevel, modelVersion, timestamp,
 *   explanationAvailable, disclaimer
 */
export interface PredictionResponse {
  id?: string;
  prediction: number;       // 0 or 1
  probability: number;
  riskLevel: RiskLevel;
  modelVersion: string;
  timestamp?: string;
  explanationAvailable?: boolean;
  disclaimer?: string;
  confidence?: number;      // not currently in backend schema; optional
}

/**
 * POST /api/explainability request body.
 * Sent as: { input: {snake_case_fields}, prediction_id?: string }
 * — see services/api/explainability.ts for the actual serialization.
 */
export interface ExplainabilityRequest {
  input: AssessmentInput;
  predictionId?: string;
}

/**
 * POST /api/explainability response.
 * Backend ExplainResponse after camelCase normalization:
 *   prediction, probability, topFeatures: [{feature, impact, contribution, value}]
 */
export interface ExplainabilityResponse {
  prediction?: number;
  probability?: number;
  topFeatures: Array<{
    feature: string;
    impact: string;
    contribution: number;
    value: number;
  }>;
}

/** GET /api/explainability/global-importance */
export interface GlobalFeatureImportance {
  label: string;
  weight: number;
}
