/**
 * JWT token management for live mode.
 *
 * Strategy: store the Bearer token in sessionStorage (survives page reloads
 * within the same tab, cleared when the tab closes, not accessible to other
 * origins). This is appropriate for a clinical prototype where the trade-off
 * between convenience and strict security has been explicitly discussed.
 *
 * This module is the ONLY place the raw token string is handled. Nothing
 * else in the frontend reads, logs, or forwards it.
 */

const TOKEN_KEY = "healthfusion.live.token";

/** Store a token received from POST /api/users/login. */
export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage may be unavailable in restricted environments.
  }
}

/** Retrieve the stored Bearer token, or null if not signed in. */
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored token on logout or auth failure. */
export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** True when a token is present (does NOT validate expiry or signature). */
export function hasToken(): boolean {
  return getToken() !== null;
}
