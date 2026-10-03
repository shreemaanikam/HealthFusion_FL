"use client";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusIndicator, hospitalStatusTone } from "@/components/ui/StatusIndicator";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getHospital } from "@/services/api/federated";
import { formatPercent, relativeTime } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";

export default function HospitalDetailPage({ params }: { params: { id: string } }) {
  const state = useClientData(() => getHospital(params.id));

  if (state.status === "loading") return <LoadingState label="Loading hospital" />;
  if (state.status === "error") return <ErrorState description={state.message} />;
  if (!state.data) return notFound();

  const hospital = state.data;
  const recentParticipation = hospital.participationHistory.slice(-10);

  return (
    <div>
      <PageHeader
        eyebrow="Federated network"
        title={hospital.name}
        description={`${hospital.city} · connected to round ${hospital.currentRound}`}
        action={<StatusIndicator label={hospital.status} tone={hospitalStatusTone(hospital.status)} pulse={hospital.status === "connected"} />}
      />

      <div className="grid gap-px bg-line sm:grid-cols-4">
        {[
          { label: "Model version", value: hospital.modelVersion },
          { label: "Reliability score", value: formatPercent(hospital.reliabilityScore, 0) },
          { label: "Contribution weight", value: formatPercent(hospital.contributionWeight, 0) },
          { label: "Last communication", value: relativeTime(hospital.lastCommunication) },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface p-6">
            <p className="text-xs text-mist">{stat.label}</p>
            <p className="hf-metric mt-1 font-display text-xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-px bg-line lg:grid-cols-2">
        <section className="bg-surface p-6">
          <h2 className="font-display text-base font-semibold text-ink">Validation metrics</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate">Local accuracy</span>
              <span className="hf-metric font-medium text-ink">{formatPercent(hospital.validation.accuracy)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Local loss</span>
              <span className="hf-metric font-medium text-ink">{hospital.validation.loss.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Local AUC</span>
              <span className="hf-metric font-medium text-ink">{hospital.validation.auc.toFixed(3)}</span>
            </div>
          </div>
        </section>

        <section className="bg-surface p-6">
          <h2 className="font-display text-base font-semibold text-ink">Data distribution summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate">Local record count</span>
              <span className="hf-metric font-medium text-ink">{hospital.dataDistributionSummary.recordCount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Positive rate</span>
              <span className="hf-metric font-medium text-ink">{formatPercent(hospital.dataDistributionSummary.positiveRate)}</span>
            </div>
            <p className="pt-2 text-xs text-mist">{hospital.dataDistributionSummary.note}</p>
            <p className="pt-1 text-xs text-mist">Aggregate statistics only — no individual patient record is ever exposed here.</p>
          </div>
        </section>
      </div>

      <section className="bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-ink">Recent participation</h2>
        <div className="mt-4 flex items-end gap-1.5">
          {recentParticipation.map((p) => (
            <div key={p.round} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-sm ${p.participated ? "bg-teal" : "bg-line"}`}
                style={{ height: `${Math.max(8, p.localAccuracy * 60)}px` }}
                title={`Round ${p.round}: ${p.participated ? "participated" : "skipped"}`}
              />
              <span className="text-[10px] text-mist">R{p.round}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
