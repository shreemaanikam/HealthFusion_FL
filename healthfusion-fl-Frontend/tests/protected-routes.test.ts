import { describe, it, expect } from "vitest";
import { isProtectedPath, PROTECTED_PREFIXES } from "@/lib/protected-routes";

describe("isProtectedPath", () => {
  it("protects every secure-app section and its sub-paths", () => {
    for (const prefix of PROTECTED_PREFIXES) {
      expect(isProtectedPath(prefix)).toBe(true);
      expect(isProtectedPath(`${prefix}/sub/path`)).toBe(true);
    }
  });

  it("leaves the public site and auth screens open", () => {
    for (const p of ["/", "/product", "/how-it-works", "/security", "/for-hospitals", "/request-pilot", "/login", "/select-organization", "/demo"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });

  it("does not false-positive on a prefix collision", () => {
    // "/helpdesk" starts with "/help" as a string but isn't the /help page.
    expect(isProtectedPath("/helpdesk")).toBe(false);
    expect(isProtectedPath("/systematic-review")).toBe(false);
  });

  it("status pages stay reachable even when signed out", () => {
    for (const p of ["/403", "/404", "/maintenance", "/error"]) {
      expect(isProtectedPath(p)).toBe(false);
    }
  });
});
