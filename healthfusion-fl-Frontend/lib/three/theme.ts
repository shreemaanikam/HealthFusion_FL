/**
 * HealthFusion 3D Intelligence System -- the same tokens as app/globals.css,
 * as hex values Three.js materials can consume directly. Keep these two
 * files in sync by hand; there are few enough values that a build-time
 * generator would be overkill.
 */
export const three3DTheme = {
  ink: "#10151b",
  navy: "#0e2438",
  navySurface: "#16324a",
  slate: "#3e4c59",
  mist: "#5f6d7a",
  paper: "#f4f6f7",
  line: "#dde3e7",
  surface: "#ffffff",

  teal: "#137574",
  tealSoft: "#e4f3f1",

  green: "#2a7549",
  greenSoft: "#e7f5ec",
  amber: "#95601a",
  amberSoft: "#fbf0dd",
  red: "#ab3a3a",
  redSoft: "#fbeaea",
} as const;

export type HospitalTone3D = "connected" | "syncing" | "degraded" | "offline";

export const hospitalNodeColor: Record<HospitalTone3D, string> = {
  connected: three3DTheme.green,
  syncing: three3DTheme.teal,
  degraded: three3DTheme.amber,
  offline: three3DTheme.mist,
};

export const hospitalNodeOpacity: Record<HospitalTone3D, number> = {
  connected: 1,
  syncing: 1,
  degraded: 0.85,
  offline: 0.4,
};
