import { PageHeader } from "@/components/layout/PageHeader";
import { RoundTimeline } from "@/components/charts/RoundTimeline";
import { getFederatedSnapshot } from "@/services/api/federated";

export default async function FederatedRoundsPage() {
  const snapshot = await getFederatedSnapshot();
  const completed = snapshot.rounds.filter((r) => r.status === "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow="Federated network"
        title="Federated Rounds"
        description={`${completed} completed rounds · aggregation strategy switched from FedAvg to Adaptive FedAvg at round 10.`}
      />
      <div className="p-6">
        <div className="rounded border border-line bg-surface px-4">
          <RoundTimeline rounds={snapshot.rounds} />
        </div>
      </div>
    </div>
  );
}

// Fetches live backend data per request; must not be prerendered at build time.
export const dynamic = "force-dynamic";
