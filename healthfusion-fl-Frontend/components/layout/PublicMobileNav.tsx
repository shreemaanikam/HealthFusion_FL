"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

const links = [
  { href: "/for-hospitals", label: "For hospitals" },
  { href: "/product", label: "Product" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/technology", label: "Technology" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/research", label: "Research" },
  { href: "/documentation", label: "Documentation" },
  { href: "/demo", label: "Demo" },
];

/**
 * Self-contained: owns its own open state so it can drop into the public
 * layout (a server component) without converting the whole layout to a
 * client component. Covers the same links the desktop nav shows at lg,
 * so nothing is reachable on desktop that isn't reachable on mobile.
 */
export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="hf-focus rounded p-1.5 text-ink hover:bg-paper"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
        </svg>
      </button>

      <div className={cn("fixed inset-0 z-50 transition-[visibility] duration-0", open ? "pointer-events-auto visible" : "pointer-events-none invisible delay-200")} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[82vw] max-w-72 flex-col bg-surface shadow-panel transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <span className="font-display text-sm font-bold text-navy">Menu</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="hf-focus rounded p-1 text-mist hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 2l14 14M16 2L2 16" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="hf-focus block rounded px-3 py-2.5 text-sm text-slate hover:bg-paper hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="hf-focus mt-3 block rounded border border-line px-3 py-2.5 text-center text-sm font-medium text-ink hover:border-navy"
            >
              Log in
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
