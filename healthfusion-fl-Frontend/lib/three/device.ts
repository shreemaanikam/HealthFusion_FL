"use client";

import { useEffect, useState } from "react";

/**
 * Feature-detects WebGL once on mount. Returns null while unknown (server
 * render / first paint) so callers can render a neutral loading state
 * instead of flashing the wrong variant.
 */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(Boolean(gl));
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/** True on small / touch-primary viewports -- used to trim geometry and cap dpr. */
export function useIsCompactViewport(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    setCompact(query.matches);
    const listener = (e: MediaQueryListEvent) => setCompact(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return compact;
}

/**
 * Single decision point: should a scene render the real 3D canvas, or the
 * 2D fallback? Reduced-motion users and devices without WebGL both get the
 * fallback -- this mirrors the "2D low-power view" pattern used elsewhere
 * in the industry for exactly this situation, rather than inventing a
 * third, undertested code path.
 */
export function useShould3DRender(): { ready: boolean; render3D: boolean } {
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const ready = webgl !== null;
  return { ready, render3D: ready && webgl === true && !reducedMotion };
}
