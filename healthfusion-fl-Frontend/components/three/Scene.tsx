"use client";

import { Canvas } from "@react-three/fiber";
import { useIsCompactViewport } from "@/lib/three/device";
import { three3DTheme } from "@/lib/three/theme";

/**
 * Shared Canvas shell for every HealthFusion 3D scene. Owns performance
 * defaults (capped device-pixel-ratio, no antialias on compact viewports)
 * and a restrained lighting rig -- a soft key light plus ambient fill, no
 * neon rim lights or bloom. Individual scenes bring their own geometry as
 * children.
 */
export function Scene({
  children,
  cameraPosition = [0, 2.6, 7.2],
  fov = 38,
  className,
}: {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  className?: string;
}) {
  const compact = useIsCompactViewport();

  return (
    <Canvas
      className={className}
      dpr={compact ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !compact, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: cameraPosition, fov }}
      shadows={false}
      style={{ touchAction: "pan-y" }}
    >
      <color attach="background" args={[three3DTheme.paper]} />
      <fog attach="fog" args={[three3DTheme.paper, 9, 16]} />
      <ambientLight intensity={0.65} color={three3DTheme.paper} />
      <directionalLight position={[4, 6, 4]} intensity={0.9} color="#ffffff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.25} color={three3DTheme.teal} />
      {children}
    </Canvas>
  );
}
