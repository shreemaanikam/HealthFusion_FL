import { PageHeader } from "@/components/layout/PageHeader";
import { FederatedIntelligenceMapAuto } from "@/components/federated/FederatedIntelligenceMapAuto";
import { StatusIndicator, hospitalStatusTone } from "@/components/ui/StatusIndicator";
import { getFederatedSnapshot } from "@/services/api/federated";
import { getModelRegistry } from "@/services/api/models";
import { relativeTime, formatPercent } from "@/lib/utils";
import Link from "next/link";

export default async function FederatedNetworkPage() {
  const [snapshot, models] = await Promise.all([getFederatedSnapshot(), getModelRegistry()]);
  const currentModel = models.versions.find((v) => v.version === models.currentModelVersion);

  return (
    <div>
      <PageHeader
        eyebrow="Federated network"
        title="Federated Intelligence Map"
        description="Every hospital contributing to the current global model. Click a node for its status, model version, and contribution."
      />

      <div className="border-b border-line bg-surface p-6">
        <FederatedIntelligenceMapAuto
          hospitals={snapshot.hospitals}
          globalModelVersion={snapshot.globalModelVersion}
          currentRound={snapshot.currentRound}
          roundInProgress={snapshot.rounds.at(-1)?.status === "in_progress"}
          globalF1={currentModel?.metrics.f1}
          detail="full"
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Participating hospitals</h2>
          <Link href="/federated/rounds" className="hf-focus text-sm text-teal hover:underline">
            View round history →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="hf-rule text-xs text-mist">
                <th className="py-2 pr-4 font-medium">Hospital</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Model version</th>
                <th className="py-2 pr-4 font-medium">Reliability</th>
                <th className="py-2 pr-4 font-medium">Contribution</th>
                <th className="py-2 pr-4 font-medium">Last sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {snapshot.hospitals.map((h) => (
                <tr key={h.id}>
                  <td className="py-3 pr-4">
                    <Link href={`/federated/hospitals/${h.id}`} className="hf-focus font-medium text-ink hover:text-teal">
                      {h.name}
                    </Link>
                    <p className="text-xs text-mist">{h.city}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusIndicator label={h.status} tone={hospitalStatusTone(h.status)} />
                  </td>
                  <td className="hf-metric py-3 pr-4 text-ink">{h.modelVersion}</td>
                  <td className="hf-metric py-3 pr-4 text-ink">{formatPercent(h.reliabilityScore, 0)}</td>
                  <td className="hf-metric py-3 pr-4 text-ink">{formatPercent(h.contributionWeight, 0)}</td>
                  <td className="py-3 pr-4 text-mist">{relativeTime(h.lastCommunication)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Fetches live backend data per request; must not be prerendered at build time.
export const dynamic = "force-dynamic";
