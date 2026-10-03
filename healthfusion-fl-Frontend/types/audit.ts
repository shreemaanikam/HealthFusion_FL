export type AuditEventType =
  | "prediction_generated"
  | "federated_round_completed"
  | "hospital_connected"
  | "hospital_disconnected"
  | "model_updated"
  | "privacy_event"
  | "user_action";

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  event: AuditEventType;
  label: string;
  component: string;
  status: "success" | "warning" | "failure";
  modelVersion: string | null;
}
