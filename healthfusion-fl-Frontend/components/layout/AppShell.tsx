"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleProvider, useRole } from "@/lib/role-context";
import { DEMO_MODE } from "@/lib/demo-mode";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { LoadingState } from "@/components/ui/LoadingState";

/**
 * Live-mode-only baseline: if GET /api/users/me comes back empty, bounce
 * to /login. This is a client-side check, not real route protection --
 * a proper guard belongs in Next middleware, inspecting the session
 * cookie server-side before the page ever renders. That's flagged as a
 * follow-up rather than done here, since it's meaningful security surface
 * that deserves its own pass against a real backend, not a guess.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { authStatus } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!DEMO_MODE && authStatus === "unauthenticated") router.replace("/login");
  }, [authStatus, router]);

  if (!DEMO_MODE && authStatus !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label={authStatus === "loading" ? "Checking your session" : "Redirecting to sign in"} />
      </div>
    );
  }

  return <>{children}</>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <RoleProvider>
      <AuthGate>
        <div className="flex min-h-screen flex-col">
          <a href="#main-content" className="hf-skip-link">Skip to content</a>
          <DemoBanner />
          <div className="flex flex-1">
            <Sidebar />
            <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar onOpenNav={() => setNavOpen(true)} />
              <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
            </div>
          </div>
        </div>
      </AuthGate>
    </RoleProvider>
  );
}
