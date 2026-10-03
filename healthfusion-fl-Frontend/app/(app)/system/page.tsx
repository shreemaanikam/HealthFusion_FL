import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { DEMO_MODE } from "@/lib/demo-mode";

const services = [
  { name: "Prediction service", status: "connected" as const, latency: "142ms" },
  { name: "Federated server", status: "connected" as const, latency: "88ms" },
  { name: "Model registry", status: "connected" as const, latency: "61ms" },
  { name: "Database", status: DEMO_MODE ? ("syncing" as const) : ("connected" as const), latency: DEMO_MODE ? "n/a (demo)" : "34ms" },
];

export default function SystemPage() {
  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="System Health"
        description="Backend service status. In demo mode this reflects the demo data layer, not a live backend."
        action={<FeatureStatusBadge status={DEMO_MODE ? "demo" : "active"} />}
      />
      <div className="p-6">
        <div className="divide-y divide-line rounded border border-line bg-surface">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <div className="flex items-center gap-4">
                <span className="hf-metric text-xs text-mist">{s.latency}</span>
                <StatusIndicator
                  label={s.status}
                  tone={s.status === "connected" ? "green" : s.status === "syncing" ? "teal" : "red"}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mist">
          Last successful federated job: round 18, completed 26 minutes ago. No warnings in the last hour.
        </p>
      </div>
    </div>
  );
}
