import { describe, it, expect } from "vitest";
import { layerAlpha } from "@/components/federated/map-focus";

describe("layerAlpha", () => {
  it("renders every layer at full strength when nothing is focused", () => {
    for (const layer of ["hospitals", "boundary", "exchange", "global"] as const) {
      expect(layerAlpha(null, layer)).toBe(1);
      expect(layerAlpha(undefined, layer)).toBe(1);
    }
  });

  it("emphasizes only the focused layer and dims the others", () => {
    expect(layerAlpha("boundary", "boundary")).toBe(1);
    expect(layerAlpha("boundary", "hospitals")).toBeLessThan(0.5);
    expect(layerAlpha("boundary", "global")).toBeLessThan(0.5);
  });

  it("dimmed layers stay faintly visible -- context isn't erased", () => {
    expect(layerAlpha("global", "hospitals")).toBeGreaterThan(0);
  });
});
