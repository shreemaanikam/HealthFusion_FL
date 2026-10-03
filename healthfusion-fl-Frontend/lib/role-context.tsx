"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthUser, UserRole } from "@/types/user";
import { demoUserForRole } from "@/services/api/users";
import { getMe, clearLocalSession } from "@/services/api/auth";
import { DEMO_MODE } from "@/lib/demo-mode";
import { ApiError } from "@/services/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface RoleContextValue {
  role: UserRole;
  /** Only meaningful in demo mode — live mode's role comes from the backend. */
  setRole: (role: UserRole) => void;
  authStatus: AuthStatus;
  authUser: AuthUser | null;
  /** Sign out — clears token and marks session as unauthenticated. */
  signOut: () => void;
  /** Called after a successful login to refresh the user profile. */
  refreshUser: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "healthfusion.simulated-role";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("doctor");
  const [authStatus, setAuthStatus] = useState<AuthStatus>(DEMO_MODE ? "authenticated" : "loading");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Demo mode: restore the simulated role picked on the login screen.
  useEffect(() => {
    if (!DEMO_MODE) return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (
      stored === "doctor" ||
      stored === "hospital_admin" ||
      stored === "researcher" ||
      stored === "system_admin"
    ) {
      setRoleState(stored);
    }
  }, []);

  // Live mode: check GET /api/users/me to restore an existing session.
  // This runs once on mount and whenever refreshUser() is called.
  const loadUser = useCallback(async () => {
    if (DEMO_MODE) return;
    try {
      const user = await getMe();
      if (user) {
        setAuthUser(user);
        setRoleState(user.role);
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("unauthenticated");
      }
    } catch (err) {
      // If the backend is offline, stay in "loading" would be confusing.
      // Show "unauthenticated" so the AuthGate redirects to /login with
      // a proper error message rather than spinning forever.
      if (err instanceof ApiError && err.status === 503) {
        setAuthStatus("unauthenticated");
      } else {
        setAuthStatus("unauthenticated");
      }
    }
  }, []);

  useEffect(() => {
    if (!DEMO_MODE) {
      loadUser();
    }
  }, [loadUser]);

  const setRole = (next: UserRole) => {
    if (!DEMO_MODE) return; // live mode: role is not user-switchable
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const signOut = useCallback(() => {
    clearLocalSession();
    setAuthUser(null);
    setAuthStatus("unauthenticated");
    setRoleState("doctor");
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <RoleContext.Provider value={{ role, setRole, authStatus, authUser, signOut, refreshUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function useCurrentUser(): AuthUser {
  const { role, authUser } = useRole();
  if (!DEMO_MODE && authUser) return authUser;
  return demoUserForRole(role);
}

export const roleLabels: Record<UserRole, string> = {
  doctor: "Doctor",
  hospital_admin: "Hospital Administrator",
  researcher: "Researcher / ML Admin",
  system_admin: "System Administrator",
};
