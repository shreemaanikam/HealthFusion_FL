"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeatureContributionChart } from "@/components/charts/FeatureContributionChart";
import { getAssessmentResult } from "@/services/api/prediction";
import { getGlobalFeatureImportance } from "@/services/api/explainability";
import { getMostRecentSessionResult } from "@/lib/session-results";
import { DEMO_MODE } from "@/lib/demo-mode";
import { formatPercent, formatDateTime } from "@/lib/utils";
import type { AssessmentResult, GlobalFeatureImportance } from "@/types/prediction";

export default function ExplainabilityPage() {
  const [result, setResult] = useState<AssessmentResult | null | undefined>(undefined);
  const [globalImportance, setGlobalImportance] = useState<GlobalFeatureImportance[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      DEMO_MODE ? getAssessmentResult("ax-100234") : Promise.resolve(getMostRecentSessionResult()),
      getGlobalFeatureImportance(),
    ]).then(([r, gi]) => {
      if (cancelled) return;
      setResult(r ?? null);
      setGlobalImportance(gi);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (result === undefined) {
    return (
      <div>
        <PageHeader eyebrow="AI intelligence" title="Why did the model make this prediction?" />
        <LoadingState label="Loading explanation" />
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <PageHeader eyebrow="AI intelligence" title="Why did the model make this prediction?" />
        <EmptyState
          title="No prediction to explain yet"
          description="Run a new assessment, then come back here — the explanation for your most recent prediction this session will show up automatically."
        />
        <div className="flex justify-center pb-8">
          <Link href="/assessment" className="hf-focus text-sm text-teal hover:underline">
            Go to New Assessment →
          </Link>
        </div>
      </div>
    );
  }

  const positive = result.featureContributions.filter((c) => c.direction === "increases_risk");
  const negative = result.featureContributions.filter((c) => c.direction === "decreases_risk");

  return (
    <div>
      <PageHeader
        eyebrow="AI intelligence"
        title="Why did the model make this prediction?"
        description={`Assessment ${result.patientRef} · scored ${formatDateTime(result.createdAt)} · ${result.modelVersion}`}
        action={<FeatureStatusBadge status={DEMO_MODE ? "demo" : "active"} />}
      />

      <div className="grid gap-px bg-line lg:grid-cols-3">
        <div className="bg-surface p-6">
          <p className="text-xs text-mist">Prediction</p>
          <div className="mt-1"><RiskBadge level={result.riskLevel} /></div>
        </div>
        <div className="bg-surface p-6">
          <p className="text-xs text-mist">Probability</p>
          <p className="hf-metric mt-1 font-display text-2xl font-semibold text-ink">{formatPercent(result.probability)}</p>
        </div>
        <div className="bg-surface p-6">
          <p className="text-xs text-mist">Model confidence</p>
          <p className="hf-metric mt-1 font-display text-2xl font-semibold text-ink">{formatPercent(result.confidence)}</p>
        </div>
      </div>

      <section className="border-b border-line bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-ink">Feature contribution — this patient</h2>
        <p className="mt-1 text-sm text-mist">
          SHAP-style attribution. Positive values pushed risk up; negative values pulled it down.
          {DEMO_MODE
            ? " Labeled demo data."
            : " Computed by POST /api/explainability against the input you submitted."}
        </p>
        <div className="mt-6">
          <FeatureContributionChart contributions={result.featureContributions} />
        </div>
      </section>

      <div className="grid gap-px bg-line lg:grid-cols-2">
        <section className="bg-surface p-6">
          <h2 className="font-display text-base font-semibold text-red">Positive contributors</h2>
          <ul className="mt-3 space-y-2">
            {positive.map((c) => (
              <li key={c.feature} className="flex items-center justify-between text-sm">
                <span className="text-slate">{c.label} <span className="text-mist">({c.value})</span></span>
                <span className="hf-metric font-medium text-red">+{c.contribution.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-surface p-6">
          <h2 className="font-display text-base font-semibold text-teal">Negative contributors</h2>
          <ul className="mt-3 space-y-2">
            {negative.map((c) => (
              <li key={c.feature} className="flex items-center justify-between text-sm">
                <span className="text-slate">{c.label} <span className="text-mist">({c.value})</span></span>
                <span className="hf-metric font-medium text-teal">{c.contribution.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-ink">Global model importance</h2>
        <p className="mt-1 text-sm text-mist">Average feature weight across the whole federation, not this one patient.</p>
        <div className="mt-4 space-y-2">
          {globalImportance.map((g) => (
            <div key={g.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-ink">{g.label}</span>
              <div className="h-2 flex-1 rounded-full bg-paper">
                <div className="h-full rounded-full bg-navy" style={{ width: `${g.weight * 100 * 3}%` }} />
              </div>
              <span className="hf-metric w-10 shrink-0 text-right text-xs text-mist">{formatPercent(g.weight, 0)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
