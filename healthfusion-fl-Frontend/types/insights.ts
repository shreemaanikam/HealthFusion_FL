import type { AssessmentResult } from "./prediction";

/**
 * POST /api/insights/generate response.
 * Backend InsightResponse after snake→camelCase:
 *   riskLevel, keyFactors, followUpContext, aiExplanation?,
 *   modelVersion, timestamp, disclaimer
 *
 * Frontend-friendly shape:
 */
export interface InsightsGenerateResponse {
  riskLevel?: string;
  /** Human-readable key risk factors */
  keyFactors?: string[];
  /** Follow-up clinical considerations */
  followUpContext?: string[];
  /** Optional LLM-generated plain language summary */
  aiExplanation?: string | null;
  modelVersion?: string;
  timestamp?: string;
  disclaimer?: string;
  /** Legacy field name mapping */
  summary?: string;
  majorRiskFactors?: string[];
  followUpConsiderations?: string[];
}

/**
 * POST /api/insights/report response.
 * Backend ReportResponse after camelCase normalization.
 */
export interface ReportResponse {
  assessmentId?: string;
  modelVersion?: string;
  prediction?: number;
  probability?: number;
  riskLevel?: string;
  featureContributions?: unknown[];
  insight?: InsightsGenerateResponse;
  timestamp?: string;
  disclaimer?: string;
  /** Legacy URL field if backend ever returns a PDF link */
  url?: string;
}

/**
 * The full payload sent to both /api/insights/generate and
 * /api/insights/report. Constructed from a completed AssessmentResult.
 */
export type InsightsRequestPayload = Pick<
  AssessmentResult,
  "id" | "riskLevel" | "probability" | "modelVersion" | "featureContributions"
>;
