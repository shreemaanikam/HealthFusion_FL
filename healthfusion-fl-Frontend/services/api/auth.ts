import { DEMO_MODE } from "@/lib/demo-mode";
import { apiFetch, apiFetchOrNull, ApiError } from "./client";
import { setToken, clearToken } from "@/lib/token";
import type { AuthUser, LoginRequest } from "@/types/user";
import { toUserRole } from "@/types/user";

/**
 * POST /api/users/login
 *
 * The backend returns {access_token, token_type: "bearer"}.
 * We store the token in sessionStorage via lib/token.ts, then fetch
 * the user profile from GET /api/users/me to get role and identity.
 *
 * The raw token is NEVER returned to callers — only the AuthUser profile.
 */
export async function login(input: LoginRequest): Promise<AuthUser> {
  if (DEMO_MODE) throw new Error("login() is a live-mode-only call; demo mode uses the simulated role selector.");

  // Step 1: get the JWT
  const tokenRes = await apiFetch<{ accessToken: string; tokenType: string }>("/api/users/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  // Step 2: persist it (token.ts is the only place the raw string is stored)
  if (tokenRes.accessToken) {
    setToken(tokenRes.accessToken);
  }

  // Step 3: fetch the real user profile
  const me = await getMe();
  if (!me) throw new ApiError("Authentication succeeded but user profile could not be loaded.", 401);
  return me;
}

/** GET /api/users/me — returns null when there's no active session. */
export async function getMe(): Promise<AuthUser | null> {
  if (DEMO_MODE) return null;
  const user = await apiFetchOrNull<AuthUser & { role: string; fullName?: string; name?: string }>("/api/users/me");
  if (!user) return null;
  // Normalize: backend sends full_name → wire.ts converts to fullName.
  // Alias to name so existing UI code using authUser.name keeps working.
  const name = user.name || user.fullName || user.email;
  return { ...user, name, role: toUserRole(user.role) };
}

/**
 * Clear the client-side session.
 * The backend has no logout endpoint yet — this only removes the local token.
 * Add a real POST /api/users/logout call here once the backend exposes one.
 */
export function clearLocalSession(): void {
  clearToken();
}

export { ApiError };
