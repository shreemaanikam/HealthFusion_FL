"use client";

import Link from "next/link";
import { useRole, roleLabels, useCurrentUser } from "@/lib/role-context";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { UserRole } from "@/types/user";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { role, setRole, authStatus } = useRole();
  const user = useCurrentUser();

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="hf-focus -ml-1 rounded p-1.5 text-ink hover:bg-paper"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/dashboard" className="hf-focus flex min-w-0 items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-sm bg-teal" />
          <span className="truncate font-display text-sm font-bold text-navy">HealthFusion_FL</span>
        </Link>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {DEMO_MODE ? (
          <>
            <label className="sr-only" htmlFor="role-switch">
              Simulated role
            </label>
            <select
              id="role-switch"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="hf-focus max-w-[9.5rem] rounded border border-line bg-paper px-2 py-1 text-xs text-slate sm:max-w-none"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </>
        ) : (
          // Live mode: the role comes from the backend session and isn't
          // switchable here -- shown read-only instead of a <select>.
          <span className="rounded border border-line bg-paper px-2 py-1 text-xs text-slate">
            {authStatus === "loading" ? "Signing in…" : roleLabels[role]}
          </span>
        )}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink">{user.name}</p>
          <p className="text-xs text-mist">{roleLabels[user.role]}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
          {user.name
            .split(" ")
            .map((p) => p[0])
            .slice(-2)
            .join("")}
        </div>
      </div>
    </header>
  );
}
