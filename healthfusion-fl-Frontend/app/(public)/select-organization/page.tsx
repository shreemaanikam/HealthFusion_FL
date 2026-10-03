"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Organization } from "@/types/organization";
import { listOrganizations } from "@/services/api/organization";
import { Button } from "@/components/ui/Button";

function SelectOrganizationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    listOrganizations().then(setOrgs);
  }, []);

  return (
    <>
      <div className="mt-8 space-y-2">
        {orgs.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o.id)}
            className={`hf-focus flex w-full items-center justify-between rounded border px-4 py-3 text-left text-sm ${
              selected === o.id ? "border-navy bg-paper" : "border-line bg-surface"
            }`}
          >
            <span>
              <span className="block font-medium text-ink">{o.name}</span>
              <span className="block text-xs text-mist">
                {o.city} · {o.kind.replace("_", " ")}
              </span>
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full border ${
                selected === o.id ? "border-navy bg-navy" : "border-line"
              }`}
            />
          </button>
        ))}
      </div>

      <Button className="mt-8" onClick={() => selected && router.push(next || "/dashboard")}>
        Enter platform
      </Button>
    </>
  );
}

export default function SelectOrganizationPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-teal">Organization</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Choose your organization</h1>
      <p className="mt-2 text-sm text-mist">HealthFusion_FL scopes data and navigation to the organization you select.</p>
      <Suspense fallback={null}>
        <SelectOrganizationForm />
      </Suspense>
    </div>
  );
}
