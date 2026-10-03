import Link from "next/link";
import { cn, relativeTime } from "@/lib/utils";
import { hospitalStatusTone } from "@/components/ui/StatusIndicator";
import type { HospitalNodeData } from "@/types/federated";
import { layerAlpha, type MapFocus } from "./map-focus";

type Detail = "compact" | "standard" | "full";

const statusLine: Record<HospitalNodeData["status"], string> = {
  connected: "stroke-green",
  syncing: "stroke-teal",
  degraded: "stroke-amber",
  offline: "stroke-red",
};

const statusDash: Record<HospitalNodeData["status"], boolean> = {
  connected: true,
  syncing: true,
  degraded: false,
  offline: false,
};

export interface FederatedIntelligenceMap2DProps {
  hospitals: HospitalNodeData[];
  globalModelVersion: string;
  currentRound: number;
  roundInProgress?: boolean;
  detail?: Detail;
  /** Stops the flow animation and the round-in-progress pulse -- driven by
   * the pause/resume control in FederatedIntelligenceMapAuto. */
  paused?: boolean;
  /** Emphasize one layer and dim the rest -- see map-focus.ts. */
  focus?: MapFocus;
  /** When provided, clicking a node calls these instead of navigating
   * directly -- lets the wrapper open a detail drawer in place. Falls back
   * to a direct Link when omitted, so this component still works stand-alone. */
  onSelectHospital?: (id: string) => void;
  onSelectGlobalModel?: () => void;
  className?: string;
}

export function FederatedIntelligenceMap({
  hospitals,
  globalModelVersion,
  currentRound,
  roundInProgress = false,
  detail = "standard",
  paused = false,
  focus,
  onSelectHospital,
  onSelectGlobalModel,
  className,
}: FederatedIntelligenceMap2DProps) {
  const n = hospitals.length;
  const hospitalX = (i: number) => ((i + 1) * 100) / (n + 1);
  const boundaryY = 21;
  const hospitalY = 35;
  const globalY = 7;
  const pulsing = roundInProgress && !paused;
  const heightClass =
    detail === "compact" ? "h-[220px] sm:h-[260px]" : detail === "full" ? "h-[340px] sm:h-[400px]" : "h-[260px] sm:h-[300px]";

  return (
    <div className={cn("relative w-full", heightClass, className)}>
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {/* privacy boundary */}
        <line x1="3" y1={boundaryY} x2="97" y2={boundaryY} stroke={focus === "boundary" ? "var(--color-teal)" : "var(--color-line)"} strokeWidth={focus === "boundary" ? 0.7 : 0.35} strokeDasharray="1.4 1.2" opacity={layerAlpha(focus, "boundary")} />
        {hospitals.map((h, i) => {
          const x = hospitalX(i);
          const active = (h.status === "connected" || h.status === "syncing") && !paused;
          return (
            <path
              key={h.id}
              d={`M ${x} ${hospitalY} L ${x} ${boundaryY} L 50 ${globalY}`}
              fill="none"
              className={cn(statusLine[h.status], active && "animate-pulse-flow")}
              strokeWidth={active ? 0.55 : 0.4}
              strokeDasharray={statusDash[h.status] ? "2.2 1.6" : undefined}
              strokeLinecap="round"
              opacity={(h.status === "offline" ? 0.35 : h.status === "degraded" ? 0.55 : 0.85) * layerAlpha(focus, "exchange")}
            />
          );
        })}
      </svg>

      {/* privacy boundary label */}
      <span
        className="absolute -translate-y-1/2 rounded-sm border border-line bg-paper px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mist"
        style={{ left: "3%", top: `${(boundaryY / 50) * 100}%`, opacity: layerAlpha(focus, "boundary") }}
      >
        Privacy boundary
      </span>

      {/* global model node */}
      {(() => {
        const globalContent = (
          <>
            <div
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-panel sm:h-14 sm:w-14",
                pulsing && "ring-2 ring-teal ring-offset-2 ring-offset-paper"
              )}
            >
              {pulsing && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-30" />}
              <span className="relative font-display text-[10px] font-bold sm:text-xs">GM</span>
            </div>
            <p className="mt-1 text-center text-xs font-semibold text-ink">Global Model</p>
            <p className="hf-metric text-[11px] text-mist">{globalModelVersion} · round {currentRound}</p>
          </>
        );
        const wrapperClass = "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center";
        const style = { left: "50%", top: `${(globalY / 50) * 100}%`, opacity: layerAlpha(focus, "global") };
        return onSelectGlobalModel ? (
          <button onClick={onSelectGlobalModel} className={cn(wrapperClass, "hf-focus rounded")} style={style}>
            {globalContent}
          </button>
        ) : (
          <div className={wrapperClass} style={style}>
            {globalContent}
          </div>
        );
      })()}

      {/* hospital nodes */}
      {hospitals.map((h, i) => {
        const x = hospitalX(i);
        const tone = hospitalStatusTone(h.status);
        const content = (
          <>
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded border bg-surface text-[10px] font-semibold text-ink shadow-panel sm:h-10 sm:w-10",
                tone === "green" && "border-green",
                tone === "teal" && "border-teal",
                tone === "amber" && "border-amber",
                tone === "red" && "border-red"
              )}
            >
              {h.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            {detail !== "compact" && (
              <div className="mt-1 max-w-[92px] text-center">
                <p className="truncate text-[11px] font-medium text-ink">{h.name.split(" ")[0]}</p>
                {detail === "full" && <p className="hf-metric text-[10px] text-mist">{Math.round(h.reliabilityScore * 100)}% reliable</p>}
              </div>
            )}
          </>
        );
        const wrapperClass = "absolute flex -translate-x-1/2 flex-col items-center";
        const style = { left: `${x}%`, top: `${(hospitalY / 50) * 100}%`, opacity: layerAlpha(focus, "hospitals") };
        const title = `${h.name} — last sync ${relativeTime(h.lastCommunication)}`;

        if (onSelectHospital) {
          return (
            <button
              key={h.id}
              onClick={() => onSelectHospital(h.id)}
              className={cn(wrapperClass, "hf-focus rounded transition-opacity hover:opacity-80")}
              style={style}
              title={title}
            >
              {content}
            </button>
          );
        }
        return detail === "full" ? (
          <Link
            key={h.id}
            href={`/federated/hospitals/${h.id}`}
            className={cn(wrapperClass, "hf-focus rounded transition-opacity hover:opacity-80")}
            style={style}
          >
            {content}
          </Link>
        ) : (
          <div key={h.id} className={wrapperClass} style={style} title={title}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
