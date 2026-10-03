import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/protected-routes";

/**
 * Edge middleware for HealthFusion_FL.
 *
 * Auth model: the backend uses JWT Bearer tokens returned in the login
 * response body and stored in sessionStorage client-side. Middleware runs
 * on the server/edge and cannot access sessionStorage, so it cannot perform
 * meaningful token validation here.
 *
 * The real auth gate is AppShell's AuthGate component (client-side), which
 * calls GET /api/users/me on mount and redirects to /login if the response
 * is null or 401. That is the authoritative check.
 *
 * What this middleware DOES provide:
 * - In DEMO mode: pass all requests through (simulated auth is in localStorage).
 * - In LIVE mode: pass all requests through — AppShell's AuthGate handles
 *   unauthenticated users client-side after first render.
 *
 * Future improvement: if the backend is updated to also set an httpOnly
 * cookie alongside the JWT (e.g. for server-side rendering), add cookie
 * inspection here as a fast pre-render redirect for protected paths.
 */

export function middleware(_request: NextRequest) {
  // No edge-level blocking — auth is handled client-side by AuthGate.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/assessment/:path*", "/explainability/:path*", "/insights/:path*",
    "/models/:path*", "/federated/:path*", "/privacy-center/:path*", "/audit/:path*",
    "/system/:path*", "/settings/:path*", "/notifications/:path*", "/help/:path*", "/reports/:path*",
  ],
};
