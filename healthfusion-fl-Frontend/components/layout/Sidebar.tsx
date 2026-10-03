"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { navGroups } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
      <div className="flex h-14 items-center gap-2 border-b border-line px-5">
        <span className="h-2 w-2 rounded-sm bg-teal" />
        <span className="font-display text-sm font-bold tracking-tight text-navy">HealthFusion_FL</span>
      </div>
      <nav className="px-3 py-4">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => item.roles.includes(role));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              <p className="px-2 text-xs font-medium text-mist">{group.label}</p>
              <div className="mt-1 space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "hf-focus block rounded px-2 py-1.5 text-sm transition-colors",
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
    </aside>
  );
}
