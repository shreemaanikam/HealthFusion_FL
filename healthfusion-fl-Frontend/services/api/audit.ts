import { DEMO_MODE } from "@/lib/demo-mode";
import { demoAuditEvents } from "@/data/demo/audit";
import type { AuditEvent } from "@/types/audit";
import { apiFetch } from "./client";

/** GET /api/audit/events */
export async function getAuditEvents(): Promise<AuditEvent[]> {
  if (DEMO_MODE) return demoAuditEvents;
  return apiFetch<AuditEvent[]>("/api/audit/events");
}

/** GET /api/audit/events/:event_id */
export async function getAuditEvent(eventId: string): Promise<AuditEvent | undefined> {
  if (DEMO_MODE) return demoAuditEvents.find((e) => e.id === eventId);
  return apiFetch<AuditEvent>(`/api/audit/events/${eventId}`);
}
