import { DEMO_MODE } from "@/lib/demo-mode";
import { demoGlobalFeatureImportance } from "@/data/demo/predictions";
import type {
  AssessmentInput,
  ExplainabilityResponse,
  FeatureContribution,
  GlobalFeatureImportance,
} from "@/types/prediction";
import { apiFetch } from "./client";

/**
 * Convert frontend AssessmentInput to the snake_case fields the backend
 * ExplainRequest schema expects. Same mapping as prediction.ts.
 */
function toBackendFields(input: AssessmentInput): Record<string, unknown> {
  const genderMap: Record<string, string> = {
    female: "Female", male: "Male", other: "Other",
  };
  const smokingMap: Record<string, string> = {
    never: "never", former: "former", current: "current",
    not_current: "not current", ever: "ever", no_info: "No Info",
  };
  return {
    gender:              genderMap[input.gender] ?? input.gender,
    age:                 input.age,
    hypertension:        input.hypertension ? 1 : 0,
    heart_disease:       input.heartDisease  ? 1 : 0,
    smoking_history:     smokingMap[input.smokingHistory] ?? input.smokingHistory,
    bmi:                 input.bmi,
    HbA1c_level:         input.hba1cLevel,
    blood_glucose_level: input.bloodGlucoseLevel,
  };
}

/**
 * POST /api/explainability
 *
 * The backend ExplainRequest wraps the clinical input under an "input" key:
 *   { input: { ...snake_case_fields }, prediction_id?: string }
 *
 * The response's top_features list is normalized to the frontend
 * FeatureContribution shape. The backend returns:
 *   { feature, impact, contribution, value }
 * The frontend expects:
 *   { feature, label, value, contribution, direction }
 */
export async function explainPrediction(
  input: AssessmentInput,
  predictionId?: string
): Promise<FeatureContribution[]> {
  const res = await apiFetch<{
    topFeatures: Array<{
      feature: string;
      impact: string;          // "positive" | "negative"
      contribution: number;
      value: number;
    }>;
  }>("/api/explainability", {
    method: "POST",
    body: JSON.stringify({
      input: toBackendFields(input),
      prediction_id: predictionId ?? null,
    }),
  });

  // Normalize backend shape → frontend FeatureContribution type
  return (res.topFeatures ?? []).map((f) => ({
    feature:     f.feature,
    label:       formatFeatureLabel(f.feature),
    value:       String(f.value),
    contribution: f.contribution,
    direction:   f.impact === "positive" ? "increases_risk" : "decreases_risk",
  }));
}

/** GET /api/explainability/global-importance */
export async function getGlobalFeatureImportance(): Promise<GlobalFeatureImportance[]> {
  if (DEMO_MODE) return demoGlobalFeatureImportance;
  const res = await apiFetch<Array<{ feature: string; importance: number }>>("/api/explainability/global-importance");
  // Normalize backend shape → frontend GlobalFeatureImportance type
  return res.map((f) => ({
    label:  formatFeatureLabel(f.feature),
    weight: f.importance,
  }));
}

/** Map snake_case feature names to human-readable labels. */
function formatFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    age:                 "Age",
    bmi:                 "BMI",
    gender:              "Gender",
    hypertension:        "Hypertension",
    heart_disease:       "Heart Disease",
    smoking_history:     "Smoking History",
    HbA1c_level:         "HbA1c Level",
    blood_glucose_level: "Blood Glucose",
  };
  return labels[feature] ?? feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
