/**
 * Which layer of the federation a scene should emphasize. Used by the
 * How It Works step explorer so the visualization changes with the
 * selected step (Step 10 of the 3D spec) instead of being a static
 * picture next to a text list. `null` means no emphasis -- everything
 * renders normally, which is what every other page wants.
 */
export type MapFocus = "hospitals" | "boundary" | "exchange" | "global" | null;

const DIMMED = 0.18;

/** 1 when this layer is emphasized (or nothing is focused), dimmed otherwise. */
export function layerAlpha(focus: MapFocus | undefined, layer: Exclude<MapFocus, null>): number {
  return !focus || focus === layer ? 1 : DIMMED;
}
