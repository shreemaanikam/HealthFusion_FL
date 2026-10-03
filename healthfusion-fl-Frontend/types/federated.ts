export type HospitalStatus = "connected" | "syncing" | "degraded" | "offline";
export type FeatureStatus = "active" | "simulation" | "demo" | "planned";

export interface HospitalNodeData {
  id: string;
  name: string;
  city: string;
  status: HospitalStatus;
  modelVersion: string;
  reliabilityScore: number; // 0-1
  contributionWeight: number; // 0-1
  lastCommunication: string; // ISO timestamp
  currentRound: number;
  validation: {
    accuracy: number;
    loss: number;
    auc: number;
  };
  dataDistributionSummary: {
    recordCount: number;
    positiveRate: number;
    note: string;
  };
  participationHistory: Array<{
    round: number;
    participated: boolean;
    localAccuracy: number;
  }>;
}

export interface FederatedRound {
  round: number;
  startedAt: string;
  completedAt: string | null;
  participants: number;
  totalHospitals: number;
  aggregationStrategy: "FedAvg" | "Adaptive FedAvg";
  globalAccuracy: number;
  globalLoss: number;
  status: "completed" | "in_progress" | "scheduled";
}

export interface FederatedNetworkSnapshot {
  globalModelVersion: string;
  currentRound: number;
  networkHealth: "healthy" | "attention" | "critical";
  hospitals: HospitalNodeData[];
  rounds: FederatedRound[];
  source: "demo" | "live";
}

/** GET /api/federated/status -- the network-level slice of the snapshot,
 * without the per-hospital list (that's GET /api/federated/clients). */
export interface FederatedStatus {
  globalModelVersion: string;
  currentRound: number;
  networkHealth: "healthy" | "attention" | "critical";
}

/** GET /api/federated/metrics */
export interface FederatedMetrics {
  globalAccuracy: number;
  globalLoss: number;
  participationRate: number; // 0-1, across the current round
  activeClients: number;
  totalClients: number;
}
