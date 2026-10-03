import { describe, it, expect } from "vitest";
import { featureStatus, statusOf } from "@/data/feature-status";
import { demoPrivacySnapshot } from "@/data/demo/privacy";

/**
 * These guard the exact drift bug found during the honesty pass:
 * differential privacy was "planned" in the Privacy Center data but
 * "simulation" everywhere else. If two places disagree about what's
 * implemented, that's a false claim on one of them.
 */
describe("feature status honesty", () => {
  it("matches the agreed classification", () => {
    expect(statusOf("TensorFlow prediction")).toBe("active");
    expect(statusOf("SHAP explainability")).toBe("active");
    expect(statusOf("Flower federated learning")).toBe("simulation");
    expect(statusOf("Adaptive aggregation")).toBe("simulation");
    expect(statusOf("Differential privacy")).toBe("simulation");
    expect(statusOf("Secure aggregation")).toBe("planned");
  });

  it("Privacy Center data agrees with the canonical status list", () => {
    const control = (id: string) => demoPrivacySnapshot.controls.find((c) => c.id === id)?.status;
    expect(control("diff-privacy")).toBe(statusOf("Differential privacy"));
    expect(control("secure-agg")).toBe(statusOf("Secure aggregation"));
  });

  it("never marks raw data sharing as anything but off", () => {
    expect(demoPrivacySnapshot.rawDataSharing).toBe("off");
  });

  it("has unique feature names", () => {
    const names = featureStatus.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("unknown features default to planned, never active", () => {
    expect(statusOf("Some feature nobody built")).toBe("planned");
  });
});
