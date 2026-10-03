import { apiFetch } from "./client";
import type { InsightsGenerateResponse, ReportResponse } from "@/types/insights";
import type { AssessmentResult } from "@/types/prediction";

/**
 * POST /api/insights/generate
 *
 * Sends the full prediction context — risk level, probability, and top
 * contributing features — rather than just an assessmentId, because the
 * backend has no persistent assessment store: it needs the context inline.
 *
 * Live mode only; demo mode uses the structured template in the Insights
 * page itself.
 */
export async function generateInsights(result: AssessmentResult): Promise<InsightsGenerateResponse> {
  return apiFetch<InsightsGenerateResponse>("/api/insights/generate", {
    method: "POST",
    body: JSON.stringify({
      assessment_id:   result.id,
      risk_level:      result.riskLevel,
      probability:     result.probability,
      model_version:   result.modelVersion,
      feature_contributions: result.featureContributions.map((f) => ({
        feature:      f.feature,
        impact:       f.direction === "increases_risk" ? "positive" : "negative",
        contribution: f.contribution,
        value:        parseFloat(f.value) || 0,
      })),
    }),
  });
}

/**
 * POST /api/insights/report
 *
 * Same full-context approach as generateInsights.
 */
export async function generateReport(result: AssessmentResult): Promise<ReportResponse> {
  return apiFetch<ReportResponse>("/api/insights/report", {
    method: "POST",
    body: JSON.stringify({
      assessment_id:   result.id,
      risk_level:      result.riskLevel,
      probability:     result.probability,
      model_version:   result.modelVersion,
      feature_contributions: result.featureContributions.map((f) => ({
        feature:      f.feature,
        impact:       f.direction === "increases_risk" ? "positive" : "negative",
        contribution: f.contribution,
        value:        parseFloat(f.value) || 0,
      })),
    }),
  });
}
