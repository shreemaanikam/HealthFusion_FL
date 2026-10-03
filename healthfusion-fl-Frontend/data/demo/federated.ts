import type { FederatedNetworkSnapshot, HospitalNodeData, FederatedRound, FederatedMetrics } from "@/types/federated";

const hospitals: HospitalNodeData[] = [
  {
    id: "hosp-a",
    name: "Chennai General Hospital",
    city: "Chennai, IN",
    status: "connected",
    modelVersion: "v4.2.1",
    reliabilityScore: 0.94,
    contributionWeight: 0.36,
    lastCommunication: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    currentRound: 18,
    validation: { accuracy: 0.912, loss: 0.211, auc: 0.947 },
    dataDistributionSummary: {
      recordCount: 18420,
      positiveRate: 0.132,
      note: "Skews older, higher hypertension prevalence than network average.",
    },
    participationHistory: Array.from({ length: 18 }, (_, i) => ({
      round: i + 1,
      participated: i !== 6,
      localAccuracy: 0.83 + i * 0.005,
    })),
  },
  {
    id: "hosp-b",
    name: "Meridian Regional Medical Center",
    city: "Bengaluru, IN",
    status: "connected",
    modelVersion: "v4.2.1",
    reliabilityScore: 0.98,
    contributionWeight: 0.41,
    lastCommunication: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    currentRound: 18,
    validation: { accuracy: 0.928, loss: 0.189, auc: 0.958 },
    dataDistributionSummary: {
      recordCount: 24110,
      positiveRate: 0.118,
      note: "Largest cohort; drives most of the current global gradient.",
    },
    participationHistory: Array.from({ length: 18 }, (_, i) => ({
      round: i + 1,
      participated: true,
      localAccuracy: 0.85 + i * 0.0045,
    })),
  },
  {
    id: "hosp-c",
    name: "Northgate Community Health",
    city: "Pune, IN",
    status: "syncing",
    modelVersion: "v4.2.0",
    reliabilityScore: 0.81,
    contributionWeight: 0.14,
    lastCommunication: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    currentRound: 17,
    validation: { accuracy: 0.887, loss: 0.257, auc: 0.921 },
    dataDistributionSummary: {
      recordCount: 6210,
      positiveRate: 0.146,
      note: "Smallest cohort; higher variance across rounds.",
    },
    participationHistory: Array.from({ length: 18 }, (_, i) => ({
      round: i + 1,
      participated: i % 3 !== 0,
      localAccuracy: 0.78 + i * 0.004,
    })),
  },
  {
    id: "hosp-d",
    name: "Lakeshore Diabetes & Endocrine Institute",
    city: "Hyderabad, IN",
    status: "degraded",
    modelVersion: "v4.1.8",
    reliabilityScore: 0.63,
    contributionWeight: 0.09,
    lastCommunication: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    currentRound: 16,
    validation: { accuracy: 0.861, loss: 0.312, auc: 0.889 },
    dataDistributionSummary: {
      recordCount: 4380,
      positiveRate: 0.211,
      note: "Specialty cohort; elevated positive rate skews local gradient.",
    },
    participationHistory: Array.from({ length: 18 }, (_, i) => ({
      round: i + 1,
      participated: i < 16,
      localAccuracy: 0.79 + i * 0.003,
    })),
  },
];

const rounds: FederatedRound[] = Array.from({ length: 18 }, (_, i) => {
  const round = i + 1;
  const inProgress = round === 18;
  return {
    round,
    startedAt: new Date(Date.now() - (18 - round) * 3 * 60 * 60 * 1000).toISOString(),
    completedAt: inProgress
      ? null
      : new Date(Date.now() - (18 - round) * 3 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    participants: round < 3 ? 2 : round < 8 ? 3 : 4,
    totalHospitals: 4,
    aggregationStrategy: round < 10 ? "FedAvg" : "Adaptive FedAvg",
    globalAccuracy: Math.min(0.94, 0.812 + round * 0.0068),
    globalLoss: Math.max(0.18, 0.41 - round * 0.011),
    status: inProgress ? "in_progress" : "completed",
  };
});

export const demoFederatedSnapshot: FederatedNetworkSnapshot = {
  globalModelVersion: "v4.2.1",
  currentRound: 18,
  networkHealth: "healthy",
  hospitals,
  rounds,
  source: "demo",
};

export function getDemoHospital(id: string): HospitalNodeData | undefined {
  return hospitals.find((h) => h.id === id);
}

export const demoFederatedMetrics: FederatedMetrics = (() => {
  const lastRound = (rounds[rounds.length - 1] ?? rounds[0])!;
  return {
    globalAccuracy: lastRound.globalAccuracy,
    globalLoss: lastRound.globalLoss,
    participationRate: lastRound.participants / lastRound.totalHospitals,
    activeClients: hospitals.filter((h) => h.status === "connected" || h.status === "syncing").length,
    totalClients: hospitals.length,
  };
})();
