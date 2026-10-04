import { DEMO_MODE } from "@/lib/demo-mode";
import { scoreDemoAssessment, demoAssessmentResult, demoAssessmentHistory } from "@/data/demo/predictions";
import { explainPrediction } from "./explainability";
import { saveSessionResult, getSessionResult, getSessionResultsAsHistory } from "@/lib/session-results";
import type { AssessmentInput, AssessmentResult, AssessmentHistoryItem, PredictionResponse } from "@/types/prediction";
import { apiFetch } from "./client";

/**
 * Convert the frontend camelCase AssessmentInput to the snake_case fields
 * the backend PredictionRequest schema expects.
 *
 * Backend field names:
 *   gender, age, hypertension, heart_disease, smoking_history,
 *   bmi, HbA1c_level, blood_glucose_level
 *
 * The backend also normalizes gender and smoking_history to the exact
 * strings expected by the preprocessing pipeline.
 */
function toBackendRequest(input: AssessmentInput): Record<string, unknown> {
  // Map frontend gender values → backend preprocessing map keys
  const genderMap: Record<string, string> = {
    female: "Female",
    male:   "Male",
    other:  "Other",
  };

  // Map frontend smoking values → backend preprocessing map keys
  const smokingMap: Record<string, string> = {
    never:       "never",
    former:      "former",
    current:     "current",
    not_current: "not current",
    ever:        "ever",
    no_info:     "No Info",
  };

  return {
    gender:               genderMap[input.gender] ?? input.gender,
    age:                  input.age,
    hypertension:         input.hypertension ? 1 : 0,
    heart_disease:        input.heartDisease  ? 1 : 0,
    smoking_history:      smokingMap[input.smokingHistory] ?? input.smokingHistory,
    bmi:                  input.bmi,
    HbA1c_level:          input.hba1cLevel,
    blood_glucose_level:  input.bloodGlucoseLevel,
  };
}

/** POST /api/prediction */
async function predict(input: AssessmentInput): Promise<PredictionResponse> {
  return apiFetch<PredictionResponse>("/api/prediction", {
    method: "POST",
    body: JSON.stringify(toBackendRequest(input)),
  });
}

/**
 * Composes POST /api/prediction + POST /api/explainability into the one
 * AssessmentResult shape the rest of the UI already expects, then stores
 * it in this session's client-side log (see lib/session-results.ts) --
 * the contract has no persistence endpoint, so that log is what makes
 * the result and history pages work in live mode at all.
 */
export async function submitAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  if (DEMO_MODE) return scoreDemoAssessment(input);

  const prediction = await predict(input);
  const featureContributions = await explainPrediction(input, prediction.id);
  const result: AssessmentResult = {
    id:         prediction.id ?? `ax-${Date.now()}`,
    createdAt:  new Date().toISOString(),
    patientRef: `PT-${Math.floor(Math.random() * 90000 + 10000)}`,
    input,
    riskLevel:            prediction.riskLevel,
    probability:          prediction.probability,
    confidence:           prediction.confidence ?? prediction.probability,
    modelVersion:         prediction.modelVersion,
    featureContributions,
    status: "completed",
    source: "live",
  };
  saveSessionResult(result);
  return result;
}

export async function getAssessmentResult(id: string): Promise<AssessmentResult | undefined> {
  if (DEMO_MODE) return { ...demoAssessmentResult, id };
  // No GET /api/assessment/:id in the contract -- this session's own log
  // is the only place a past result can come from in live mode.
  return getSessionResult(id);
}

export async function getAssessmentHistory(): Promise<AssessmentHistoryItem[]> {
  if (DEMO_MODE) return demoAssessmentHistory;
  
  try {
    const data = await apiFetch<any[]>("/api/assessments");
    return data.map(item => ({
      id: String(item.id),
      patientRef: `PT-${item.id}`,
      createdAt: item.createdAt,
      riskLevel: item.riskLevel,
      probability: item.probability,
      confidence: item.probability,
      modelVersion: "v1.0.0", // from DB or default
      status: "completed"
    }));
  } catch (err) {
    console.error("Failed to fetch assessment history", err);
    return [];
  }
}
