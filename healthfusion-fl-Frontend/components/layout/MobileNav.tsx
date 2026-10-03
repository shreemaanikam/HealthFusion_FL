"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { navGroups } from "./nav-config";

/**
 * Mobile replacement for <Sidebar />, which is hidden below md. Same nav
 * data, same role filtering -- this is the only way to navigate the
 * secure app on a phone or small tablet, so it has to carry everything
 * Sidebar carries, not a trimmed subset.
 */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { role } = useRole();
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50 transition-[visibility] duration-0 md:hidden", open ? "pointer-events-auto visible" : "pointer-events-none invisible delay-200")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[82vw] max-w-72 flex-col bg-surface shadow-panel transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-teal" />
            <span className="font-display text-sm font-bold text-navy">HealthFusion_FL</span>
          </span>
          <button onClick={onClose} aria-label="Close menu" className="hf-focus rounded p-1 text-mist hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 2l14 14M16 2L2 16" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="mb-5">
                <p className="px-2 text-xs font-semibold text-navy">{group.label}</p>
                <div className="mt-1 space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "hf-focus block rounded px-2 py-2 text-sm transition-colors",
                          active ? "bg-navy text-white" : "text-slate hover:bg-paper hover:text-ink"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
