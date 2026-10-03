import { PageHeader } from "@/components/layout/PageHeader";
import { getAuditEvents } from "@/services/api/audit";
import { relativeTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const events = await getAuditEvents();
  const notifications = events.slice(0, 5);

  return (
    <div>
      <PageHeader eyebrow="System" title="Notifications" description="Derived from the audit timeline — federated rounds, hospital connectivity, and prediction activity." />
      <div className="p-6">
        <ul className="divide-y divide-line rounded border border-line bg-surface">
          {notifications.map((n) => (
            <li key={n.id} className="px-5 py-4">
              <p className="text-sm text-ink">{n.label}</p>
              <p className="mt-0.5 text-xs text-mist">{relativeTime(n.timestamp)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
