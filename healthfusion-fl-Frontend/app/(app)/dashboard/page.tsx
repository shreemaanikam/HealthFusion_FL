"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { FederatedIntelligenceMapAuto } from "@/components/federated/FederatedIntelligenceMapAuto";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { StatusIndicator, hospitalStatusTone } from "@/components/ui/StatusIndicator";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getFederatedSnapshot } from "@/services/api/federated";
import { getModelRegistry } from "@/services/api/models";
import { getPrivacySnapshot } from "@/services/api/privacy";
import { relativeTime } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";

const insights = [
  "HbA1c and blood glucose remain the two strongest predictors across the last 5 rounds — consistent with clinical literature.",
  "Northgate Community Health's smaller cohort is producing higher-variance local updates; adaptive weighting is compensating.",
  "Global AUC has improved 0.011 since switching to Adaptive FedAvg at round 10.",
];

function useDashboardData() {
  const federated = useClientData(getFederatedSnapshot);
  const models = useClientData(getModelRegistry);
  const privacy = useClientData(getPrivacySnapshot);

  if (federated.status === "error") return { status: "error" as const, message: federated.message };
  if (models.status === "error") return { status: "error" as const, message: models.message };
  if (privacy.status === "error") return { status: "error" as const, message: privacy.message };

  if (federated.status === "loading" || models.status === "loading" || privacy.status === "loading") {
    return { status: "loading" as const };
  }

  // Gracefully degrade for DOCTOR (403 forbidden)
  const isDoctor = federated.status === "forbidden" || models.status === "forbidden" || privacy.status === "forbidden";

  if (isDoctor) {
      return { status: "doctor_dashboard" as const };
  }

  return { 
      status: "ok" as const, 
      federated: federated.status === "ok" ? federated.data : null, 
      models: models.status === "ok" ? models.data : null, 
      privacy: privacy.status === "ok" ? privacy.data : null 
  };
}

export default function DashboardPage() {
  const state = useDashboardData();

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="HealthFusion Command Center"
        description="A single view of model health, network state, and privacy posture."
      />

      {state.status === "loading" && <LoadingState label="Loading dashboard" />}
      {state.status === "error" && <ErrorState description={state.message} />}
      {state.status === "doctor_dashboard" && (
          <div className="p-6 max-w-4xl">
             <div className="bg-surface border border-line rounded-lg p-8 text-center space-y-4">
                 <h2 className="text-xl font-semibold text-ink">Welcome to HealthFusion</h2>
                 <p className="text-slate max-w-lg mx-auto">
                    You are logged in as a Doctor. From the left navigation menu, you can perform new clinical assessments, review your assessment history, and access clinical insights.
                 </p>
                 <div className="flex justify-center gap-4 mt-6">
                     <Link href="/assessment" className="px-4 py-2 bg-teal text-white rounded font-medium hover:bg-teal/90">
                         New Assessment
                     </Link>
                     <Link href="/assessment/history" className="px-4 py-2 bg-surface text-ink border border-line rounded font-medium hover:bg-line/50">
                         View History
                     </Link>
                 </div>
             </div>
          </div>
      )}

      {state.status === "ok" && (() => {
        const { federated, models, privacy } = state;
        if (!federated || !models || !privacy) return null;
        const currentModel = models.versions.find((v) => v.version === models.currentModelVersion);
        const networkTone = federated.networkHealth === "healthy" ? "green" : federated.networkHealth === "attention" ? "amber" : "red";
        const activeControls = privacy.controls.filter((c) => c.status === "active").length;

        return (
          <>
            <div className="grid gap-px bg-line lg:grid-cols-[1.5fr_1fr]">
              <section className="bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">Federated Intelligence Pulse</h2>
                  <StatusIndicator label={`Network ${federated.networkHealth}`} tone={networkTone} pulse={federated.networkHealth === "healthy"} />
                </div>
                <FederatedIntelligenceMapAuto
                  hospitals={federated.hospitals}
                  globalModelVersion={federated.globalModelVersion}
                  currentRound={federated.currentRound}
                  roundInProgress={federated.rounds.at(-1)?.status === "in_progress"}
                  globalF1={currentModel?.metrics.f1}
                  detail="standard"
                  className="mt-4"
                />
                <Link href="/federated" className="hf-focus mt-3 inline-block text-sm text-teal hover:underline">
                  Open full network map →
                </Link>
              </section>

              <section className="bg-surface p-6">
                <h2 className="font-display text-base font-semibold text-ink">Current round</h2>
                {(() => {
                  const round = federated.rounds.at(-1);
                  if (!round) return null;
                  return (
                    <div className="mt-4 space-y-3">
                      <p className="hf-metric font-display text-3xl font-bold text-navy">Round {round.round}</p>
                      <p className="text-sm text-slate">
                        {round.participants}/{round.totalHospitals} hospitals participating · {round.aggregationStrategy}
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-paper">
                        <div className="h-full rounded-full bg-teal" style={{ width: `${(round.participants / round.totalHospitals) * 100}%` }} />
                      </div>
                      <p className="hf-metric text-sm text-ink">{(round.globalAccuracy * 100).toFixed(1)}% global accuracy</p>
                    </div>
                  );
                })()}
              </section>
            </div>

            <div className="grid gap-px bg-line lg:grid-cols-3">
              <section className="bg-surface p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">Model health</h2>
                  <FeatureStatusBadge status="demo" />
                </div>
                {currentModel && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-mist">Version</p>
                      <p className="hf-metric mt-0.5 text-sm font-semibold text-ink">{currentModel.version}</p>
                    </div>
                    <div>
                      <p className="text-xs text-mist">Accuracy</p>
                      <p className="hf-metric mt-0.5 text-sm font-semibold text-ink">{(currentModel.metrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-mist">ROC-AUC</p>
                      <p className="hf-metric mt-0.5 text-sm font-semibold text-ink">{currentModel.metrics.rocAuc?.toFixed(3) ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-mist">Deployment</p>
                      <p className="mt-0.5 text-sm font-semibold capitalize text-ink">{models.deploymentState}</p>
                    </div>
                  </div>
                )}
                <Link href="/models" className="hf-focus mt-4 inline-block text-sm text-teal hover:underline">
                  View model registry →
                </Link>
              </section>

              <section className="bg-surface p-6">
                <h2 className="font-display text-base font-semibold text-ink">Privacy state</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Raw data sharing</span>
                    <span className="font-medium text-red">Off</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Federated exchange</span>
                    <span className="font-medium text-green">On</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Active controls</span>
                    <span className="hf-metric font-medium text-ink">{activeControls}/{privacy.controls.length}</span>
                  </div>
                </div>
                <Link href="/privacy-center" className="hf-focus mt-4 inline-block text-sm text-teal hover:underline">
                  Open privacy center →
                </Link>
              </section>
            </div>

            <div className="grid gap-px bg-line lg:grid-cols-[1fr_1.3fr]">
              <section className="bg-surface p-6">
                <h2 className="font-display text-base font-semibold text-ink">Network health</h2>
                <div className="mt-4 divide-y divide-line">
                  {federated.hospitals.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-ink">{h.name}</p>
                        <p className="text-xs text-mist">Synced {relativeTime(h.lastCommunication)}</p>
                      </div>
                      <StatusIndicator label={h.status} tone={hospitalStatusTone(h.status)} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-ink">AI insights</h2>
                  <FeatureStatusBadge status="demo" />
                </div>
                <ul className="mt-4 space-y-3">
                  {insights.map((insight) => (
                    <li key={insight} className="flex gap-3 text-sm text-slate">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                      {insight}
                    </li>
                  ))}
                </ul>
                <Link href="/insights" className="hf-focus mt-4 inline-block text-sm text-teal hover:underline">
                  Open clinical insights →
                </Link>
              </section>
            </div>
          </>
        );
      })()}
    </div>
  );
}
