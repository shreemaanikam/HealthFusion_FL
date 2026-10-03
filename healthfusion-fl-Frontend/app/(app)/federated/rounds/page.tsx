"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { RoundTimeline } from "@/components/charts/RoundTimeline";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getFederatedSnapshot } from "@/services/api/federated";
import { useClientData } from "@/lib/useClientData";

export default function FederatedRoundsPage() {
  const state = useClientData(getFederatedSnapshot);

  const completed = state.status === "ok"
    ? state.data.rounds.filter((r) => r.status === "completed").length
    : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Federated network"
        title="Federated Rounds"
        description={
          state.status === "ok"
            ? `${completed} completed rounds · aggregation strategy switched from FedAvg to Adaptive FedAvg at round 10.`
            : "Federated round history"
        }
      />
      <div className="p-6">
        {state.status === "loading" && <LoadingState label="Loading rounds" />}
        {state.status === "error" && <ErrorState description={state.message} />}
        {state.status === "ok" && (
          <div className="rounded border border-line bg-surface px-4">
            <RoundTimeline rounds={state.data.rounds} />
          </div>
        )}
      </div>
    </div>
  );
}
