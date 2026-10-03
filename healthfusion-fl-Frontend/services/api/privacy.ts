import { DEMO_MODE } from "@/lib/demo-mode";
import { demoPrivacySnapshot } from "@/data/demo/privacy";
import type { PrivacyCenterSnapshot, PrivacyStatus, PrivacyConfig } from "@/types/privacy";
import { apiFetch } from "./client";

/** GET /api/privacy/status */
export async function getPrivacyStatus(): Promise<PrivacyStatus> {
  return apiFetch<PrivacyStatus>("/api/privacy/status");
}

/** GET /api/privacy/config */
export async function getPrivacyConfig(): Promise<PrivacyConfig> {
  return apiFetch<PrivacyConfig>("/api/privacy/config");
}

export async function getPrivacySnapshot(): Promise<PrivacyCenterSnapshot> {
  if (DEMO_MODE) return demoPrivacySnapshot;
  const [status, config] = await Promise.all([getPrivacyStatus(), getPrivacyConfig()]);
  return { ...status, ...config, source: "live" };
}
