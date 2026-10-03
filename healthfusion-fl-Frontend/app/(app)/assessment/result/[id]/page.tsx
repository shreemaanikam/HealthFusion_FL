"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getAssessmentResult } from "@/services/api/prediction";
import { DEMO_MODE } from "@/lib/demo-mode";
import { formatPercent, formatDateTime } from "@/lib/utils";
import type { AssessmentResult } from "@/types/prediction";

export default function AssessmentResultPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<AssessmentResult | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getAssessmentResult(params.id).then((r) => {
      if (!cancelled) setResult(r ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (result === undefined) {
    return (
      <div>
        <PageHeader eyebrow="Patient care" title="Assessment result" />
        <LoadingState label="Loading result" />
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <PageHeader eyebrow="Patient care" title="Assessment result" />
        <EmptyState
          title="This result isn't available"
          description={
            DEMO_MODE
              ? "No demo assessment matches this ID."
              : "HealthFusion_FL's current API doesn't persist predictions for later retrieval by link — results are only available in the tab that ran them, immediately after scoring."
          }
        />
        <div className="flex justify-center pb-8">
          <Button href="/assessment" variant="secondary">Run a new assessment</Button>
        </div>
      </div>
    );
  }

  const topFactors = result.featureContributions.slice(0, 3);

  return (
    <div>
      <PageHeader
        eyebrow="Patient care"
        title={`Assessment result — ${result.patientRef}`}
        description={`Scored ${formatDateTime(result.createdAt)} · ${result.modelVersion}`}
        action={<FeatureStatusBadge status={DEMO_MODE ? "demo" : "active"} />}
      />

      <div className="grid gap-px bg-line md:grid-cols-[1.2fr_1fr]">
        <section className="bg-surface p-8">
          <p className="text-xs text-mist">Model-predicted diabetes risk</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <RiskBadge level={result.riskLevel} className="text-base" />
            <span className="hf-metric font-display text-4xl font-bold text-ink">{formatPercent(result.probability)}</span>
          </div>
          <p className="mt-2 text-sm text-mist">Model confidence: {formatPercent(result.confidence)}</p>
          <p className="mt-6 max-w-md rounded border border-amber bg-amber-soft px-4 py-3 text-sm text-amber">
            Clinical decision support — not a diagnosis. Confirm with standard diagnostic criteria before acting.
          </p>
        </section>

        <section className="bg-surface p-8">
          <h2 className="font-display text-base font-semibold text-ink">Key contributing factors</h2>
          <ul className="mt-4 space-y-3">
            {topFactors.map((f) => (
              <li key={f.feature} className="flex items-center justify-between text-sm">
                <span className="text-slate">{f.label} <span className="text-mist">({f.value})</span></span>
                <span className={`hf-metric font-medium ${f.direction === "increases_risk" ? "text-red" : "text-teal"}`}>
                  {f.contribution > 0 ? "+" : ""}
                  {f.contribution.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3 p-6">
        <Button href="/explainability">View explanation</Button>
        <Button href={`/reports/${result.id}`} variant="secondary">Generate report</Button>
        <Button href="/insights" variant="secondary">View insights</Button>
      </div>
    </div>
  );
}
