export type UserRole = "doctor" | "hospital_admin" | "researcher" | "system_admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

/** Roles as the backend contract sends them (uppercase). */
export type BackendUserRole = "DOCTOR" | "HOSPITAL_ADMIN" | "RESEARCHER" | "SYSTEM_ADMIN";

export function toUserRole(raw: string): UserRole {
  const normalized = raw.trim().toLowerCase();
  if (
    normalized === "doctor" ||
    normalized === "hospital_admin" ||
    normalized === "researcher" ||
    normalized === "system_admin"
  ) {
    return normalized;
  }
  // Unknown role from the live backend: fail toward least-privileged view.
  return "doctor";
}

/**
 * GET /api/users/me response shape after wire.ts snake→camelCase conversion.
 *
 * Backend UserResponse schema:
 *   id: int
 *   email: str
 *   full_name: str   → fullName after normalization
 *   role: str
 *   is_active: bool  → isActive after normalization
 *   created_at: str  → createdAt after normalization
 *
 * We keep both `name` (app-internal alias) and `fullName` (wire format)
 * so existing UI code using `authUser.name` continues to work.
 */
export interface AuthUser {
  id: string | number;
  /** The user's display name. Populated from fullName (wire) or name. */
  name: string;
  /** Exact wire field from backend (GET /api/users/me → full_name → fullName) */
  fullName?: string;
  email: string;
  role: UserRole;
  organizationId?: string | number;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
  organization_id?: number;
}
