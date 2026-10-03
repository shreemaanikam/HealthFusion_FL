"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator, hospitalStatusTone } from "@/components/ui/StatusIndicator";
import { FederatedIntelligenceMapAuto } from "@/components/federated/FederatedIntelligenceMapAuto";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getFederatedSnapshot } from "@/services/api/federated";
import { formatPercent, relativeTime } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";

export default function FederatedPage() {
  const state = useClientData(getFederatedSnapshot);

  return (
    <div>
      <PageHeader
        eyebrow="Federated network"
        title="Network Map"
        description="Live state of every hospital participating in the federated learning network."
      />
      {state.status === "loading" && <LoadingState label="Loading network" />}
      {state.status === "error" && <ErrorState description={state.message} />}
      {state.status === "ok" && (() => {
        const snapshot = state.data;
        return (
          <div>
            <div className="p-6">
              <FederatedIntelligenceMapAuto
                hospitals={snapshot.hospitals}
                globalModelVersion={snapshot.globalModelVersion}
                currentRound={snapshot.currentRound}
                roundInProgress={snapshot.rounds.at(-1)?.status === "in_progress"}
                detail="full"
              />
            </div>

            <div className="p-6">
              <h2 className="font-display text-base font-semibold text-ink">Hospital nodes</h2>
              <div className="mt-4 overflow-x-auto rounded border border-line">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-paper">
                    <tr className="text-xs text-mist">
                      <th className="px-4 py-2 font-medium">Hospital</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Model</th>
                      <th className="px-4 py-2 font-medium">Reliability</th>
                      <th className="px-4 py-2 font-medium">Weight</th>
                      <th className="px-4 py-2 font-medium">Last seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface">
                    {snapshot.hospitals.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-3">
                          <Link href={`/federated/hospitals/${h.id}`} className="hf-focus font-medium text-teal hover:underline">
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
      })()}
    </div>
  );
}
