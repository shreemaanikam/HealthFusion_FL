"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import { Html, QuadraticBezierLine, Icosahedron, Octahedron, Ring, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "@/components/three/Scene";
import { useIsCompactViewport } from "@/lib/three/device";
import { layerAlpha, type MapFocus } from "./map-focus";
import { three3DTheme, hospitalNodeColor, hospitalNodeOpacity, type HospitalTone3D } from "@/lib/three/theme";
import { relativeTime } from "@/lib/utils";
import type { HospitalNodeData } from "@/types/federated";

type Detail = "compact" | "standard" | "full";

const statusLabel: Record<HospitalTone3D, string> = {
  connected: "Online",
  syncing: "Syncing",
  degraded: "Degraded",
  offline: "Offline",
};

function hospitalPositions(n: number, radius: number): [number, number, number][] {
  return Array.from({ length: n }, (_, i) => {
    // Start at the back and sweep forward so the front-most nodes face the camera.
    const angle = Math.PI / 2 + (i - (n - 1) / 2) * (Math.min(2.1, n) / n) * 1.15;
    return [Math.sin(angle) * radius, 0, Math.cos(angle) * radius - radius * 0.35] as [number, number, number];
  });
}

function GlobalModel({
  position,
  version,
  round,
  f1,
  pulsing,
  hovered,
  onHover,
  onLeave,
  onClick,
  showLabel,
  alpha,
}: {
  alpha: number;
  position: [number, number, number];
  version: string;
  round: number;
  f1?: number;
  pulsing: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  showLabel: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      const breathe = pulsing ? 1 + Math.sin(t.current * 2.4) * 0.06 : 1;
      const hoverScale = hovered ? 1.08 : 1;
      meshRef.current.scale.setScalar(breathe * hoverScale);
    }
  });

  return (
    <group position={position}>
      <Icosahedron
        ref={meshRef}
        args={[0.52, 1]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={onLeave}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <meshStandardMaterial
          transparent
          opacity={alpha}
          color={three3DTheme.navy}
          emissive={three3DTheme.teal}
          emissiveIntensity={pulsing ? 0.55 : 0.3}
          roughness={0.35}
          metalness={0.1}
        />
      </Icosahedron>
      {pulsing && (
        <Ring args={[0.62, 0.68, 48]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={three3DTheme.teal} transparent opacity={0.5 * alpha} side={THREE.DoubleSide} />
        </Ring>
      )}
      {showLabel && !hovered && (
        <Html position={[0, -0.85, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap text-center">
            <p className="font-display text-[11px] font-semibold text-ink">Global Model</p>
            <p className="hf-metric text-[9px] text-mist">{version} · round {round}</p>
          </div>
        </Html>
      )}
      {hovered && (
        <Html position={[0.75, 0.3, 0]} distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="w-40 rounded border border-teal bg-surface px-3 py-2 shadow-panel">
            <p className="font-display text-xs font-semibold text-ink">Global Model</p>
            <p className="hf-metric mt-1 text-[11px] text-slate">Version {version}</p>
            <p className="hf-metric text-[11px] text-slate">Current round {round}</p>
            {f1 !== undefined && <p className="hf-metric text-[11px] text-slate">F1 score {f1.toFixed(2)}</p>}
          </div>
        </Html>
      )}
    </group>
  );
}

function HospitalNode({
  hospital,
  position,
  hovered,
  onHover,
  onLeave,
  onClick,
  showLabel,
  alpha,
}: {
  alpha: number;
  hospital: HospitalNodeData;
  position: [number, number, number];
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  showLabel: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = hospitalNodeColor[hospital.status];
  const opacity = hospitalNodeOpacity[hospital.status];
  const active = hospital.status === "connected" || hospital.status === "syncing";

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = hovered ? 1.25 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), delta * 6);
    }
  });

  return (
    <group position={position}>
      <Octahedron
        ref={meshRef}
        args={[0.28, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={onLeave}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <meshStandardMaterial color={color} transparent opacity={opacity * alpha} roughness={0.4} metalness={0.05} />
      </Octahedron>
      {active && (
        <Ring args={[0.36, 0.4, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.35 * alpha} side={THREE.DoubleSide} />
        </Ring>
      )}
      {showLabel && !hovered && (
        <Html position={[0, -0.5, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <p className="whitespace-nowrap text-center text-[10px] font-medium text-ink">{hospital.name.split(" ")[0]}</p>
        </Html>
      )}
      {hovered && (
        <Html position={[0.55, 0.25, 0]} distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="w-44 rounded border bg-surface px-3 py-2 shadow-panel" style={{ borderColor: color }}>
            <p className="font-display text-xs font-semibold text-ink">{hospital.name}</p>
            <p className="hf-metric mt-1 text-[11px] text-slate">Status: {statusLabel[hospital.status]}</p>
            <p className="hf-metric text-[11px] text-slate">Model: {hospital.modelVersion}</p>
            <p className="hf-metric text-[11px] text-slate">Reliability: {Math.round(hospital.reliabilityScore * 100)}%</p>
            <p className="hf-metric text-[11px] text-slate">Round: {hospital.currentRound}</p>
            <p className="mt-1 text-[10px] text-mist">Synced {relativeTime(hospital.lastCommunication)}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

function FlowParticles({ start, end, control, alpha }: { start: THREE.Vector3; end: THREE.Vector3; control: THREE.Vector3; alpha: number }) {
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(start, control, end), [start, control, end]);
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  const offsets = [0, 0.33, 0.66];

  useFrame((state) => {
    const speed = 0.18;
    refs.forEach((ref, i) => {
      if (!ref.current) return;
      const t = (state.clock.elapsedTime * speed + (offsets[i] ?? 0)) % 1;
      const p = curve.getPointAt(t);
      ref.current.position.copy(p);
      const mat = ref.current.material as unknown as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI) * alpha; // fade in/out along the path
    });
  });

  return (
    <>
      {refs.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={three3DTheme.teal} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
}

function ConnectionBeam({
  start,
  end,
  status,
  alpha,
}: {
  alpha: number;
  start: [number, number, number];
  end: [number, number, number];
  status: HospitalTone3D;
}) {
  const startV = useMemo(() => new THREE.Vector3(...start), [start]);
  const endV = useMemo(() => new THREE.Vector3(...end), [end]);
  const controlV = useMemo(
    () => new THREE.Vector3((start[0] + end[0]) / 2, 1.55, (start[2] + end[2]) / 2),
    [start, end]
  );
  const active = status === "connected" || status === "syncing";
  const color = hospitalNodeColor[status];

  return (
    <>
      <QuadraticBezierLine
        start={startV}
        end={endV}
        mid={controlV}
        color={color}
        lineWidth={active ? 1.4 : 0.9}
        transparent
        opacity={(active ? 0.45 : 0.18) * alpha}
      />
      {active && <FlowParticles start={startV} end={endV} control={controlV} alpha={alpha} />}
    </>
  );
}

function PrivacyBoundary({ radius, alpha }: { radius: number; alpha: number }) {
  return (
    <group position={[0, 1.2, -radius * 0.18]}>
      <Ring args={[radius * 0.05, radius * 1.35, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={three3DTheme.teal} transparent opacity={0.06 * alpha} side={THREE.DoubleSide} />
      </Ring>
      <Ring args={[radius * 1.33, radius * 1.37, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={three3DTheme.teal} transparent opacity={0.4 * alpha} side={THREE.DoubleSide} />
      </Ring>
      <Html position={[-radius * 1.2, 0, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <p className="whitespace-nowrap rounded-sm border border-line bg-paper px-1.5 py-0.5 text-[9px] font-medium text-mist">
          Privacy boundary
        </p>
      </Html>
    </group>
  );
}

export interface FederatedIntelligenceMap3DProps {
  hospitals: HospitalNodeData[];
  globalModelVersion: string;
  currentRound: number;
  roundInProgress?: boolean;
  /** Stops ambient/auto-rotation and the round-in-progress pulse -- driven
   * by the pause/resume control in FederatedIntelligenceMapAuto. */
  paused?: boolean;
  /** Emphasize one layer and dim the rest -- see map-focus.ts. */
  focus?: MapFocus;
  globalF1?: number;
  detail?: Detail;
  interactive?: boolean;
  onSelectHospital?: (id: string) => void;
  onSelectGlobalModel?: () => void;
  className?: string;
}

function SceneContent({
  hospitals,
  globalModelVersion,
  currentRound,
  roundInProgress,
  paused,
  focus,
  globalF1,
  detail,
  interactive,
  onSelectHospital,
  onSelectGlobalModel,
}: FederatedIntelligenceMap3DProps) {
  const router = useRouter();
  const compactViewport = useIsCompactViewport();
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);
  const [hoveredGlobal, setHoveredGlobal] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const radius = hospitals.length <= 3 ? 2.1 : 2.5;
  const positions = useMemo(() => hospitalPositions(hospitals.length, radius), [hospitals.length, radius]);
  const globalPosition: [number, number, number] = [0, 2.65, -radius * 0.55];

  useFrame((_, delta) => {
    // Compact previews (marketing/decorative use) and any instance viewed on
    // a touch-primary phone get a slow ambient drift instead of drag
    // controls -- OrbitControls on a phone would fight the page's own
    // vertical scroll, so it's not mounted at all in that case (below).
    if (paused) return;
    if (groupRef.current && (detail === "compact" || compactViewport) && !hoveredHospital && !hoveredGlobal) {
      groupRef.current.rotation.y += delta * 0.06;
    }
  });

  const handleHospitalClick = (id: string) => {
    if (onSelectHospital) return onSelectHospital(id);
    if (interactive && detail === "full") router.push(`/federated/hospitals/${id}`);
  };

  const handleGlobalClick = () => {
    if (onSelectGlobalModel) return onSelectGlobalModel();
    if (interactive && detail === "full") router.push("/models");
  };

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <PrivacyBoundary radius={radius} alpha={layerAlpha(focus, "boundary")} />
      {hospitals.map((h, i) => (
        <ConnectionBeam key={h.id} start={positions[i] ?? [0, 0, 0]} end={globalPosition} status={h.status} alpha={layerAlpha(focus, "exchange")} />
      ))}
      {hospitals.map((h, i) => (
        <HospitalNode
          key={h.id}
          hospital={h}
          position={positions[i] ?? [0, 0, 0]}
          hovered={hoveredHospital === h.id}
          onHover={() => setHoveredHospital(h.id)}
          onLeave={() => setHoveredHospital((cur) => (cur === h.id ? null : cur))}
          onClick={() => handleHospitalClick(h.id)}
          showLabel={detail !== "compact"}
          alpha={layerAlpha(focus, "hospitals")}
        />
      ))}
      <GlobalModel
        position={globalPosition}
        version={globalModelVersion}
        round={currentRound}
        f1={globalF1}
        pulsing={Boolean(roundInProgress) && !paused}
        hovered={hoveredGlobal}
        onHover={() => setHoveredGlobal(true)}
        onLeave={() => setHoveredGlobal(false)}
        onClick={handleGlobalClick}
        showLabel={detail !== "compact"}
        alpha={layerAlpha(focus, "global")}
      />
    </group>
  );
}

export function FederatedIntelligenceMap3D({
  detail = "standard",
  interactive = true,
  paused = false,
  className,
  ...rest
}: FederatedIntelligenceMap3DProps) {
  const compactViewport = useIsCompactViewport();
  const heightClass =
    detail === "compact" ? "h-[260px] sm:h-[300px]" : detail === "full" ? "h-[420px] sm:h-[480px]" : "h-[320px] sm:h-[360px]";

  return (
    <div className={className}>
      <Scene className={heightClass} cameraPosition={[0, 2.2, 6.6]} fov={detail === "compact" ? 42 : 36}>
        <SceneContent detail={detail} interactive={interactive} paused={paused} {...rest} />
        {detail !== "compact" && !compactViewport && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={interactive}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate={!paused}
            autoRotateSpeed={0.6}
            dampingFactor={0.08}
          />
        )}
      </Scene>
      <p className="mt-2 text-center text-xs text-mist">
        {detail === "full" && !compactViewport
          ? "Drag to rotate · hover a node · click to open details"
          : "Model updates only — no patient data moves"}
      </p>
    </div>
  );
}
