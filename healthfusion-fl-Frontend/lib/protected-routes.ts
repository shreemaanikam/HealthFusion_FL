/**
 * Pure prefix-matching logic, kept separate from middleware.ts so it's
 * unit-testable without mocking Next's edge request/response objects.
 */
export const PROTECTED_PREFIXES = [
  "/dashboard", "/assessment", "/explainability", "/insights", "/models",
  "/federated", "/privacy-center", "/audit", "/system", "/settings",
  "/notifications", "/help", "/reports",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
