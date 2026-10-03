import type { AssessmentResult, AssessmentHistoryItem } from "@/types/prediction";

/**
 * Live-mode-only. The real API contract (Section A) has no endpoint to
 * fetch a past prediction by ID or list assessment history -- only the
 * two synchronous scoring calls. Rather than invent GET /api/assessment/:id
 * or GET /api/assessment/history, results are held here, in this browser
 * tab's sessionStorage, for the duration of the session. That's an honest
 * capability (results just scored, still on screen or one click back) and
 * not a substitute for real server-side persistence -- the History page
 * says so explicitly in live mode.
 *
 * Demo mode never touches this; it has its own fixed dataset.
 */
const KEY = "healthfusion.session-results";

function readAll(): AssessmentResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AssessmentResult[]) : [];
  } catch {
    return [];
  }
}

function writeAll(results: AssessmentResult[]): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(results));
  } catch {
    // sessionStorage unavailable (private browsing, quota) -- degrade to
    // "this session has no history" rather than throwing.
  }
}

export function saveSessionResult(result: AssessmentResult): void {
  const all = readAll().filter((r) => r.id !== result.id);
  all.unshift(result);
  writeAll(all.slice(0, 50)); // cap so one long session can't grow unbounded
}

export function getSessionResult(id: string): AssessmentResult | undefined {
  return readAll().find((r) => r.id === id);
}

export function getMostRecentSessionResult(): AssessmentResult | undefined {
  return readAll()[0];
}

export function getSessionResultsAsHistory(): AssessmentHistoryItem[] {
  return readAll().map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    patientRef: r.patientRef,
    modelVersion: r.modelVersion,
    riskLevel: r.riskLevel,
    confidence: r.confidence,
    status: r.status,
  }));
}
