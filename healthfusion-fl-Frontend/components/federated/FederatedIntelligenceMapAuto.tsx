"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useShould3DRender, useWebGLSupport } from "@/lib/three/device";
import { FederatedIntelligenceMap } from "./FederatedIntelligenceMap";
import { NetworkLegend } from "./NetworkLegend";
import { DataStaysLocalBadge } from "./DataStaysLocalBadge";
import { NodeDetailDrawer, type NodeDetailContent } from "./NodeDetailDrawer";
import type { FederatedIntelligenceMap3DProps } from "./FederatedIntelligenceMap3D";
import type { HospitalNodeData } from "@/types/federated";

const FederatedIntelligenceMap3D = dynamic(
  () => import("./FederatedIntelligenceMap3D").then((m) => m.FederatedIntelligenceMap3D),
  { ssr: false }
);

type Detail2D = "compact" | "standard" | "full";
type ViewPreference = "auto" | "2d" | "3d";

export interface FederatedIntelligenceMapAutoProps extends FederatedIntelligenceMap3DProps {
  hospitals: HospitalNodeData[];
  /** Show the legend / pause / 2D-3D toggle / detail drawer. Defaults to on
   * for everything but the compact variant; the How It Works story turns
   * it off because the step text is doing the explaining there. */
  chrome?: boolean;
}

function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="hf-focus flex items-center gap-1.5 rounded border border-line bg-surface px-2 py-1 text-xs text-slate hover:border-navy"
    >
      {paused ? (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 0l8 5-8 5z" /></svg>
          Resume
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="1" y="0" width="3" height="10" /><rect x="6" y="0" width="3" height="10" />
          </svg>
          Pause
        </>
      )}
    </button>
  );
}

function ViewToggle({ value, onChange, webglSupported }: { value: ViewPreference; onChange: (v: ViewPreference) => void; webglSupported: boolean | null }) {
  const effective = value === "auto" ? "3d" : value; // display state assumes auto resolves to 3D when possible
  return (
    <div className="flex items-center rounded border border-line bg-surface p-0.5 text-xs">
      <button
        onClick={() => onChange("3d")}
        disabled={webglSupported === false}
        className={`hf-focus rounded px-2 py-0.5 disabled:opacity-40 ${effective === "3d" ? "bg-navy text-white" : "text-slate"}`}
      >
        3D
      </button>
      <button
        onClick={() => onChange("2d")}
        className={`hf-focus rounded px-2 py-0.5 ${effective === "2d" ? "bg-navy text-white" : "text-slate"}`}
      >
        2D
      </button>
    </div>
  );
}

/**
 * Drop-in replacement for <FederatedIntelligenceMap /> (the 2D version).
 * Same props, plus the Section F controls: a legend, a "patient data
 * stays local" indicator, pause/resume for the ambient rotation, a manual
 * 2D/3D toggle on top of the automatic WebGL/reduced-motion fallback, and
 * a side drawer for node details instead of navigating straight away.
 * None of this shows on the compact (decorative/hero) variant.
 */
export function FederatedIntelligenceMapAuto(props: FederatedIntelligenceMapAutoProps) {
  const { ready, render3D: autoRender3D } = useShould3DRender();
  const webglSupported = useWebGLSupport();
  const [viewPreference, setViewPreference] = useState<ViewPreference>("auto");
  const [paused, setPaused] = useState(false);
  const [drawerContent, setDrawerContent] = useState<NodeDetailContent | null>(null);

  const detail2D: Detail2D = props.detail === "full" ? "full" : props.detail === "compact" ? "compact" : "standard";
  const showControls = props.chrome ?? props.detail !== "compact";

  const render3D = viewPreference === "auto" ? autoRender3D : viewPreference === "3d" && webglSupported !== false;

  const handleSelectHospital = (id: string) => {
    const hospital = props.hospitals.find((h) => h.id === id);
    if (hospital) setDrawerContent({ kind: "hospital", hospital });
  };
  const handleSelectGlobalModel = () => {
    setDrawerContent({ kind: "global", version: props.globalModelVersion, round: props.currentRound, f1: props.globalF1 });
  };

  const controls = showControls && (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <NetworkLegend />
        <DataStaysLocalBadge />
      </div>
      <div className="flex items-center gap-2">
        <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} />
        <ViewToggle value={viewPreference} onChange={setViewPreference} webglSupported={webglSupported} />
      </div>
    </div>
  );

  if (!ready) {
    // First paint / capability check in flight -- show the 2D map immediately
    // rather than a blank canvas. If 3D turns out to be available it swaps
    // in on the next render with no layout jump (heights match by detail level).
    return (
      <div className={props.className}>
        {controls}
        <FederatedIntelligenceMap
          hospitals={props.hospitals}
          globalModelVersion={props.globalModelVersion}
          currentRound={props.currentRound}
          roundInProgress={props.roundInProgress}
          focus={props.focus}
          detail={detail2D}
        />
      </div>
    );
  }

  return (
    <div className={props.className}>
      {controls}
      {render3D ? (
        <FederatedIntelligenceMap3D
          {...props}
          paused={paused}
          onSelectHospital={showControls ? handleSelectHospital : props.onSelectHospital}
          onSelectGlobalModel={showControls ? handleSelectGlobalModel : props.onSelectGlobalModel}
        />
      ) : (
        <>
          <FederatedIntelligenceMap
            hospitals={props.hospitals}
            globalModelVersion={props.globalModelVersion}
            currentRound={props.currentRound}
            roundInProgress={props.roundInProgress}
            focus={props.focus}
            detail={detail2D}
            paused={paused}
            onSelectHospital={showControls ? handleSelectHospital : undefined}
            onSelectGlobalModel={showControls ? handleSelectGlobalModel : undefined}
          />
          <p className="mt-2 text-center text-xs text-mist">
            {viewPreference === "2d" && webglSupported
              ? "2D view selected"
              : "2D low-power view — WebGL unavailable or reduced motion is on"}
          </p>
        </>
      )}
      {showControls && <NodeDetailDrawer content={drawerContent} onClose={() => setDrawerContent(null)} />}
    </div>
  );
}
