"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FederatedIntelligenceMapAuto } from "./FederatedIntelligenceMapAuto";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import type { MapFocus } from "./map-focus";
import type { FeatureStatus, HospitalNodeData } from "@/types/federated";

export interface Step {
  n: string;
  title: string;
  body: string;
  focus: MapFocus;
  status: FeatureStatus;
  note?: string;
}

/**
 * Interactive version of the six-stage story: pick a step and the map
 * emphasizes the layer that step is about, dimming the rest. Built as a
 * real tablist (roving tabindex, arrow keys) so it's fully usable without
 * a mouse, and it works identically on the 2D fallback since `focus` is
 * implemented in both renderers.
 */
export function StepExplorer({
  steps,
  hospitals,
  globalModelVersion,
  currentRound,
}: {
  steps: Step[];
  hospitals: HospitalNodeData[];
  globalModelVersion: string;
  currentRound: number;
}) {
  const [index, setIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = steps[index] ?? steps[0]!;

  const go = (next: number) => {
    const clamped = (next + steps.length) % steps.length;
    setIndex(clamped);
    tabRefs.current[clamped]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(steps.length - 1); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <div>
        <div role="tablist" aria-label="How HealthFusion works, step by step" aria-orientation="vertical" onKeyDown={onKeyDown} className="divide-y divide-line rounded border border-line bg-surface">
          {steps.map((s, i) => (
            <button
              key={s.n}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`step-tab-${i}`}
              aria-selected={i === index}
              aria-controls="step-panel"
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
              className={cn(
                "hf-focus flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
                i === index ? "bg-navy text-white" : "text-ink hover:bg-paper"
              )}
            >
              <span className={cn("hf-metric w-6 shrink-0 text-sm", i === index ? "text-white/70" : "text-mist")}>{s.n}</span>
              <span className="text-sm font-medium">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button onClick={() => go(index - 1)} className="hf-focus rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-navy">
            ← Previous
          </button>
          <span className="hf-metric text-xs text-mist" aria-live="polite">Step {index + 1} of {steps.length}</span>
          <button onClick={() => go(index + 1)} className="hf-focus rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-navy">
            Next →
          </button>
        </div>
      </div>

      <div>
        <div className="rounded border border-line bg-surface p-4 sm:p-6">
          <p className="mb-2 text-xs font-semibold text-navy">Demo federation — simulated network</p>
          <FederatedIntelligenceMapAuto
            hospitals={hospitals}
            globalModelVersion={globalModelVersion}
            currentRound={currentRound}
            detail="standard"
            interactive={false}
            chrome={false}
            focus={step.focus}
          />
        </div>

        <div id="step-panel" role="tabpanel" aria-labelledby={`step-tab-${index}`} className="mt-4 rounded border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">{step.title}</h2>
            <FeatureStatusBadge status={step.status} />
          </div>
          <p className="mt-2 text-sm text-slate">{step.body}</p>
          {step.note && <p className="mt-2 text-xs text-mist">{step.note}</p>}
          {index === steps.length - 1 && (
            <Link href="/demo" className="hf-focus mt-3 inline-block text-sm text-teal hover:underline">
              See an explanation in the interactive demo →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
