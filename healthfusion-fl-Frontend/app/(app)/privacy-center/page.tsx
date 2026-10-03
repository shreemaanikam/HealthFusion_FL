import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { getPrivacySnapshot } from "@/services/api/privacy";

export default async function PrivacyCenterPage() {
  const snapshot = await getPrivacySnapshot();

  return (
    <div>
      <PageHeader
        eyebrow="Trust & privacy"
        title="Privacy Center"
        description="Every control that governs what leaves a hospital's boundary — labeled by what's actually implemented."
      />

      <div className="grid gap-px bg-line sm:grid-cols-2">
        <div className="bg-surface p-6">
          <p className="text-xs text-mist">Raw data sharing</p>
          <p className="mt-2 font-display text-2xl font-bold text-red">OFF</p>
          <p className="mt-1 text-sm text-slate">No patient record has ever left a hospital's own environment.</p>
        </div>
        <div className="bg-surface p-6">
          <p className="text-xs text-mist">Federated exchange</p>
          <p className="mt-2 font-display text-2xl font-bold text-green">ON</p>
          <p className="mt-1 text-sm text-slate">Encrypted model updates flow between hospitals and the coordination server.</p>
        </div>
      </div>

      <div className="p-6">
        <h2 className="font-display text-base font-semibold text-ink">Controls</h2>
        <div className="mt-4 divide-y divide-line rounded border border-line bg-surface">
          {snapshot.controls.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">{c.label}</p>
                <p className="mt-0.5 text-sm text-mist">{c.description}</p>
              </div>
              <FeatureStatusBadge status={c.status as "active" | "simulation" | "demo" | "planned"} className="shrink-0" />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mist">
          Status here always matches the public <a href="/privacy" className="hf-focus text-teal underline underline-offset-2">Privacy</a> page — one source of truth, two audiences.
        </p>
      </div>
    </div>
  );
}
