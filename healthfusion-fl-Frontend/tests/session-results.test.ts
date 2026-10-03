import { describe, it, expect, beforeEach, vi } from "vitest";
import type { AssessmentResult } from "@/types/prediction";

function installFakeSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  });
  return store;
}

function makeResult(id: string): AssessmentResult {
  return {
    id,
    createdAt: new Date().toISOString(),
    patientRef: `PT-${id}`,
    input: {
      gender: "female", age: 40, hypertension: false, heartDisease: false,
      smokingHistory: "never", bmi: 24, hba1cLevel: 5.4, bloodGlucoseLevel: 100,
    },
    riskLevel: "low",
    probability: 0.2,
    confidence: 0.9,
    modelVersion: "v1",
    featureContributions: [],
    status: "completed",
    source: "live",
  };
}

describe("session results log", () => {
  beforeEach(() => {
    vi.resetModules();
    installFakeSessionStorage();
  });

  it("stores and retrieves a result by id", async () => {
    const { saveSessionResult, getSessionResult } = await import("@/lib/session-results");
    saveSessionResult(makeResult("a"));
    expect(getSessionResult("a")?.patientRef).toBe("PT-a");
    expect(getSessionResult("missing")).toBeUndefined();
  });

  it("returns the most recent result first", async () => {
    const { saveSessionResult, getMostRecentSessionResult } = await import("@/lib/session-results");
    saveSessionResult(makeResult("a"));
    saveSessionResult(makeResult("b"));
    expect(getMostRecentSessionResult()?.id).toBe("b");
  });

  it("re-saving the same id replaces it instead of duplicating", async () => {
    const { saveSessionResult, getSessionResultsAsHistory } = await import("@/lib/session-results");
    saveSessionResult(makeResult("a"));
    saveSessionResult(makeResult("a"));
    expect(getSessionResultsAsHistory()).toHaveLength(1);
  });

  it("caps the log so a long session can't grow unbounded", async () => {
    const { saveSessionResult, getSessionResultsAsHistory } = await import("@/lib/session-results");
    for (let i = 0; i < 60; i++) saveSessionResult(makeResult(String(i)));
    expect(getSessionResultsAsHistory()).toHaveLength(50);
  });

  it("history summaries never leak the raw clinical input", async () => {
    const { saveSessionResult, getSessionResultsAsHistory } = await import("@/lib/session-results");
    saveSessionResult(makeResult("a"));
    expect(getSessionResultsAsHistory()[0]).not.toHaveProperty("input");
  });
});

describe("session results log without a browser", () => {
  it("degrades to empty instead of throwing on the server", async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    const { getMostRecentSessionResult, getSessionResultsAsHistory } = await import("@/lib/session-results");
    expect(getMostRecentSessionResult()).toBeUndefined();
    expect(getSessionResultsAsHistory()).toEqual([]);
  });
});
