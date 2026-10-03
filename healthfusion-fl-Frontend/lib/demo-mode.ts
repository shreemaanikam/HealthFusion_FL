/**
 * Single source of truth for whether the app is running against the
 * typed demo datasets (/data/demo) or a real HealthFusion_FL backend.
 *
 * Every function in /services/api reads this flag. The UI never blends
 * demo and real data in the same view -- see <DemoBanner /> and the
 * `source` field returned alongside every service call.
 */
export const DEMO_MODE: boolean =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase() !== "false";

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type DataSource = "demo" | "live";

export function currentSource(): DataSource {
  return DEMO_MODE ? "demo" : "live";
}
