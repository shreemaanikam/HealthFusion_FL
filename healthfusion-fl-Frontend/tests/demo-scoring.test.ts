import { describe, it, expect } from "vitest";
import { scoreDemoAssessment } from "@/data/demo/predictions";
import type { AssessmentInput } from "@/types/prediction";

const healthy: AssessmentInput = {
  gender: "female", age: 28, hypertension: false, heartDisease: false,
  smokingHistory: "never", bmi: 22, hba1cLevel: 5.0, bloodGlucoseLevel: 90,
};
const highRisk: AssessmentInput = {
  gender: "male", age: 62, hypertension: true, heartDisease: true,
  smokingHistory: "current", bmi: 34, hba1cLevel: 8.2, bloodGlucoseLevel: 220,
};

describe("scoreDemoAssessment", () => {
  it("scores a healthy profile as low risk and a high-risk profile as high", () => {
    expect(scoreDemoAssessment(healthy).riskLevel).toBe("low");
    expect(scoreDemoAssessment(highRisk).riskLevel).toBe("high");
  });

  it("keeps probability inside (0, 1)", () => {
    for (const input of [healthy, highRisk]) {
      const { probability } = scoreDemoAssessment(input);
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThan(1);
    }
  });

  it("orders contributions by absolute magnitude", () => {
    const { featureContributions } = scoreDemoAssessment(highRisk);
    const mags = featureContributions.map((c) => Math.abs(c.contribution));
    expect([...mags].sort((a, b) => b - a)).toEqual(mags);
  });

  it("marks the result as demo data", () => {
    expect(scoreDemoAssessment(healthy).source).toBe("demo");
  });

  it("raising HbA1c never lowers predicted probability", () => {
    const low = scoreDemoAssessment({ ...healthy, hba1cLevel: 5.0 }).probability;
    const high = scoreDemoAssessment({ ...healthy, hba1cLevel: 8.0 }).probability;
    expect(high).toBeGreaterThanOrEqual(low);
  });
});
