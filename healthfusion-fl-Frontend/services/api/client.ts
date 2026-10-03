import { API_BASE_URL } from "@/lib/demo-mode";
import { snakeToCamelDeep } from "@/lib/wire";
import { getToken } from "@/lib/token";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Live-mode fetch wrapper.
 *
 * Auth model (matches the real backend contract):
 *   POST /api/users/login → {access_token, token_type: "bearer"}
 *   Subsequent requests    → Authorization: Bearer <token>
 *
 * The token is stored in sessionStorage by lib/token.ts and attached here.
 * The frontend never reads, logs, or forwards the raw token string except
 * through this function and lib/token.ts.
 *
 * Response normalization: every JSON response is converted from snake_case
 * to camelCase before it reaches application code, so the rest of the app
 * can use camelCase types regardless of the wire format.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  // Attach Bearer token if present (live mode)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }

    // Provide meaningful error messages per status code
    const message = (() => {
      switch (res.status) {
        case 401: return "Your session has expired. Please sign in again.";
        case 403: return "You do not have permission to access this resource.";
        case 404: return `Resource not found: ${path}`;
        case 422: return "The request data was invalid. Please check your inputs.";
        case 429: return "Too many requests. Please try again in a moment.";
        case 500: return "HealthFusion backend encountered an internal error.";
        case 503: return "HealthFusion backend is currently unavailable.";
        default:  return `HealthFusion API error on ${path} (${res.status})`;
      }
    })();

    throw new ApiError(message, res.status, body);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;

  const body = (await res.json()) as unknown;
  return snakeToCamelDeep<T>(body);
}

/** Same as apiFetch, but a 401 resolves to null instead of throwing --
 * for endpoints like GET /api/users/me where "not logged in" is a normal,
 * expected outcome rather than an error. */
export async function apiFetchOrNull<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    return await apiFetch<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}
