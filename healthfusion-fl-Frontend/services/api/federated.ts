import { DEMO_MODE } from "@/lib/demo-mode";
import { demoFederatedSnapshot, demoFederatedMetrics, getDemoHospital } from "@/data/demo/federated";
import type {
  FederatedNetworkSnapshot,
  FederatedStatus,
  HospitalNodeData,
  FederatedRound,
  FederatedMetrics,
} from "@/types/federated";
import { apiFetch } from "./client";

// --- Contract-exact primitives (Section A) --------------------------------

/** GET /api/federated/status */
export async function getFederatedStatus(): Promise<FederatedStatus> {
  return apiFetch<FederatedStatus>("/api/federated/status");
}

/** GET /api/federated/clients -- called "hospitals" everywhere in this UI,
 * since that's the clinically meaningful term; the wire endpoint is the
 * backend's "clients" naming. */
export async function getFederatedClients(): Promise<HospitalNodeData[]> {
  return apiFetch<HospitalNodeData[]>("/api/federated/clients");
}

/** GET /api/federated/clients/:id */
export async function getFederatedClient(id: string): Promise<HospitalNodeData> {
  return apiFetch<HospitalNodeData>(`/api/federated/clients/${id}`);
}

/** GET /api/federated/rounds */
export async function getFederatedRounds(): Promise<FederatedRound[]> {
  return apiFetch<FederatedRound[]>("/api/federated/rounds");
}

/** GET /api/federated/rounds/:id */
export async function getFederatedRound(id: string | number): Promise<FederatedRound> {
  return apiFetch<FederatedRound>(`/api/federated/rounds/${id}`);
}

/** GET /api/federated/metrics */
export async function getFederatedMetrics(): Promise<FederatedMetrics> {
  if (DEMO_MODE) return demoFederatedMetrics;
  return apiFetch<FederatedMetrics>("/api/federated/metrics");
}

// --- Composed calls the existing UI already depends on ---------------------

/**
 * The Dashboard and /federated pages want one object with status +
 * hospitals + rounds together. The real backend splits that across three
 * endpoints, so this composes them with one Promise.all rather than
 * changing every page that calls getFederatedSnapshot().
 */
export async function getFederatedSnapshot(): Promise<FederatedNetworkSnapshot> {
  if (DEMO_MODE) return demoFederatedSnapshot;
  const [status, hospitals, rounds] = await Promise.all([
    getFederatedStatus(),
    getFederatedClients(),
    getFederatedRounds(),
  ]);
  return { ...status, hospitals, rounds, source: "live" };
}

export async function getHospital(id: string): Promise<HospitalNodeData | undefined> {
  if (DEMO_MODE) return getDemoHospital(id);
  return getFederatedClient(id);
}
