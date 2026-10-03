"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn, relativeTime, formatPercent } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { StatusIndicator, hospitalStatusTone } from "@/components/ui/StatusIndicator";
import type { HospitalNodeData } from "@/types/federated";

export type NodeDetailContent =
  | { kind: "hospital"; hospital: HospitalNodeData }
  | { kind: "global"; version: string; round: number; f1?: number };

export function NodeDetailDrawer({ content, onClose }: { content: NodeDetailContent | null; onClose: () => void }) {
  const open = content !== null;
  const panelRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-40 transition-[visibility] duration-0", open ? "pointer-events-auto visible" : "pointer-events-none invisible delay-200")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/30 transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Node details"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[86vw] max-w-sm flex-col bg-surface shadow-panel transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <span className="font-display text-sm font-semibold text-ink">
            {content?.kind === "hospital" ? "Hospital" : "Global model"}
          </span>
          <button onClick={onClose} aria-label="Close" className="hf-focus rounded p-1 text-mist hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 2l14 14M16 2L2 16" />
            </svg>
          </button>
        </div>

        {content?.kind === "hospital" && (
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="font-display text-lg font-semibold text-ink">{content.hospital.name}</h2>
            <p className="text-sm text-mist">{content.hospital.city}</p>
            <div className="mt-4">
              <StatusIndicator label={content.hospital.status} tone={hospitalStatusTone(content.hospital.status)} pulse={content.hospital.status === "connected"} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Model version</dt>
                <dd className="hf-metric font-medium text-ink">{content.hospital.modelVersion}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Current round</dt>
                <dd className="hf-metric font-medium text-ink">{content.hospital.currentRound}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Reliability</dt>
                <dd className="hf-metric font-medium text-ink">{formatPercent(content.hospital.reliabilityScore, 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Contribution weight</dt>
                <dd className="hf-metric font-medium text-ink">{formatPercent(content.hospital.contributionWeight, 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Last communication</dt>
                <dd className="text-mist">{relativeTime(content.hospital.lastCommunication)}</dd>
              </div>
            </dl>
            <Link
              href={`/federated/hospitals/${content.hospital.id}`}
              onClick={onClose}
              className="hf-focus mt-6 inline-block text-sm text-teal hover:underline"
            >
              View full hospital page →
            </Link>
          </div>
        )}

        {content?.kind === "global" && (
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Global Model</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Version</dt>
                <dd className="hf-metric font-medium text-ink">{content.version}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Current round</dt>
                <dd className="hf-metric font-medium text-ink">{content.round}</dd>
              </div>
              {content.f1 !== undefined && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate">F1 score</dt>
                  <dd className="hf-metric font-medium text-ink">{content.f1.toFixed(2)}</dd>
                </div>
              )}
            </dl>
            <Link href="/models" onClick={onClose} className="hf-focus mt-6 inline-block text-sm text-teal hover:underline">
              View model registry →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
