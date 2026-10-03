import { PageHeader } from "@/components/layout/PageHeader";
import { getAuditEvents } from "@/services/api/audit";
import { formatDateTime } from "@/lib/utils";

const statusColor: Record<string, string> = {
  success: "bg-green",
  warning: "bg-amber",
  failure: "bg-red",
};

export default async function AuditPage() {
  const events = await getAuditEvents();

  return (
    <div>
      <PageHeader eyebrow="Trust & privacy" title="Audit Timeline" description="Append-only log of everything that touches the model, the network, or a prediction." />
      <div className="p-6">
        <div className="rounded border border-line bg-surface">
          <ul className="divide-y divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex gap-4 px-5 py-4">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColor[e.status]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-ink">{e.label}</p>
                    <p className="text-xs text-mist">{formatDateTime(e.timestamp)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-mist">
                    {e.actor} · {e.component}
                    {e.modelVersion && <> · <span className="hf-metric">{e.modelVersion}</span></>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
