import { describe, it, expect } from "vitest";
import { toUserRole } from "@/types/user";
import { navGroups } from "@/components/layout/nav-config";
import type { UserRole } from "@/types/user";

function hrefsFor(role: UserRole): string[] {
  return navGroups.flatMap((g) => g.items.filter((i) => i.roles.includes(role)).map((i) => i.href));
}

describe("toUserRole", () => {
  it("normalizes backend uppercase roles", () => {
    expect(toUserRole("DOCTOR")).toBe("doctor");
    expect(toUserRole("HOSPITAL_ADMIN")).toBe("hospital_admin");
    expect(toUserRole("RESEARCHER")).toBe("researcher");
    expect(toUserRole("SYSTEM_ADMIN")).toBe("system_admin");
  });

  it("fails toward least privilege on an unknown role", () => {
    expect(toUserRole("SUPERUSER")).toBe("doctor");
    expect(toUserRole("")).toBe("doctor");
  });
});

describe("role-based navigation", () => {
  it("every role can reach the dashboard and help", () => {
    for (const role of ["doctor", "hospital_admin", "researcher", "system_admin"] as UserRole[]) {
      expect(hrefsFor(role)).toContain("/dashboard");
      expect(hrefsFor(role)).toContain("/help");
    }
  });

  it("doctors get patient care but not privacy/audit administration", () => {
    const doctor = hrefsFor("doctor");
    expect(doctor).toContain("/assessment");
    expect(doctor).not.toContain("/privacy-center");
    expect(doctor).not.toContain("/audit");
    expect(doctor).not.toContain("/system");
  });

  it("only admins see the privacy center and audit", () => {
    for (const role of ["hospital_admin", "system_admin"] as UserRole[]) {
      expect(hrefsFor(role)).toContain("/privacy-center");
      expect(hrefsFor(role)).toContain("/audit");
    }
    expect(hrefsFor("researcher")).not.toContain("/audit");
  });

  it("nobody but doctors can run assessments", () => {
    for (const role of ["hospital_admin", "researcher", "system_admin"] as UserRole[]) {
      expect(hrefsFor(role)).not.toContain("/assessment");
    }
  });

  it("has no duplicate hrefs", () => {
    const all = navGroups.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(all).size).toBe(all.length);
  });
});
