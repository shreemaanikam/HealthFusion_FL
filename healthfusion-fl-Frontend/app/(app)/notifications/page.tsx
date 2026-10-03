"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAuditEvents } from "@/services/api/audit";
import { relativeTime } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";

export default function NotificationsPage() {
  const state = useClientData(getAuditEvents);

  return (
    <div>
      <PageHeader eyebrow="System" title="Notifications" description="Derived from the audit timeline — federated rounds, hospital connectivity, and prediction activity." />
      <div className="p-6">
        {state.status === "loading" && <LoadingState label="Loading notifications" />}
        {state.status === "error" && <ErrorState description={state.message} />}
        {state.status === "ok" && (
          <ul className="divide-y divide-line rounded border border-line bg-surface">
            {state.data.slice(0, 5).map((n) => (
              <li key={n.id} className="px-5 py-4">
                <p className="text-sm text-ink">{n.label}</p>
                <p className="mt-0.5 text-xs text-mist">{relativeTime(n.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
