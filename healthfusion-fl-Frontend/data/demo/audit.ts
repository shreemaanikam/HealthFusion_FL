import type { AuditEvent } from "@/types/audit";

export const demoAuditEvents: AuditEvent[] = [
  { id: "ev-9001", timestamp: new Date(Date.now() - 2 * 60e3).toISOString(), actor: "Dr. S. Anand", event: "prediction_generated", label: "Assessment ax-100234 scored", component: "Prediction Service", status: "success", modelVersion: "v4.2.1" },
  { id: "ev-9000", timestamp: new Date(Date.now() - 26 * 60e3).toISOString(), actor: "Federated Coordinator", event: "federated_round_completed", label: "Round 18 aggregation completed", component: "Federated Server", status: "success", modelVersion: "v4.2.1" },
  { id: "ev-8998", timestamp: new Date(Date.now() - 52 * 60e3).toISOString(), actor: "Lakeshore Diabetes & Endocrine Institute", event: "hospital_disconnected", label: "Client dropped mid-round (timeout)", component: "Federated Server", status: "warning", modelVersion: "v4.1.8" },
  { id: "ev-8990", timestamp: new Date(Date.now() - 3 * 3600e3).toISOString(), actor: "System", event: "model_updated", label: "Global model promoted to v4.2.1", component: "Model Registry", status: "success", modelVersion: "v4.2.1" },
  { id: "ev-8971", timestamp: new Date(Date.now() - 6 * 3600e3).toISOString(), actor: "Meridian Regional Medical Center", event: "hospital_connected", label: "Client reconnected after maintenance window", component: "Federated Server", status: "success", modelVersion: "v4.2.0" },
  { id: "ev-8944", timestamp: new Date(Date.now() - 9 * 3600e3).toISOString(), actor: "R. Kapoor (Researcher)", event: "user_action", label: "Exported model comparison report", component: "Model Registry", status: "success", modelVersion: null },
  { id: "ev-8900", timestamp: new Date(Date.now() - 14 * 3600e3).toISOString(), actor: "System", event: "privacy_event", label: "Encryption certificate rotated", component: "Privacy Center", status: "success", modelVersion: null },
];
