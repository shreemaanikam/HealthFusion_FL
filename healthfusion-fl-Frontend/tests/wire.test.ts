import { describe, it, expect } from "vitest";
import { snakeToCamelDeep } from "@/lib/wire";

describe("snakeToCamelDeep", () => {
  it("converts nested object keys", () => {
    const out = snakeToCamelDeep<{ modelVersion: string; featureContributions: { featureName: string }[] }>({
      model_version: "v1",
      feature_contributions: [{ feature_name: "bmi" }],
    });
    expect(out.modelVersion).toBe("v1");
    expect(out.featureContributions[0]?.featureName).toBe("bmi");
  });

  it("leaves values, including snake_case strings, untouched", () => {
    const out = snakeToCamelDeep<{ status: string }>({ status: "in_progress" });
    expect(out.status).toBe("in_progress");
  });

  it("handles primitives, null, and arrays of primitives", () => {
    expect(snakeToCamelDeep(null)).toBeNull();
    expect(snakeToCamelDeep(42)).toBe(42);
    expect(snakeToCamelDeep([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("converts keys containing digits", () => {
    const out = snakeToCamelDeep<{ hba1cLevel: number }>({ hba1c_level: 6.5 });
    expect(out.hba1cLevel).toBe(6.5);
  });
});
