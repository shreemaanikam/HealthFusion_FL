"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getAssessmentResult } from "@/services/api/prediction";
import { getMostRecentSessionResult } from "@/lib/session-results";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { AssessmentResult } from "@/types/prediction";

export default function InsightsPage() {
  const [result, setResult] = useState<AssessmentResult | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (DEMO_MODE ? getAssessmentResult("ax-100234") : Promise.resolve(getMostRecentSessionResult())).then((r) => {
      if (!cancelled) setResult(r ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (result === undefined) {
    return (
      <div>
        <PageHeader eyebrow="AI intelligence" title="Clinical Insights" />
        <LoadingState label="Loading insights" />
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <PageHeader eyebrow="AI intelligence" title="Clinical Insights" />
        <EmptyState
          title="No assessment to reflect on yet"
          description="Insights are generated from your most recent prediction this session."
        />
        <div className="flex justify-center pb-8">
          <Button href="/assessment" variant="secondary">Go to New Assessment</Button>
        </div>
      </div>
    );
  }

  const topRisk = result.featureContributions.filter((c) => c.direction === "increases_risk").slice(0, 3);

  return (
    <div>
      <PageHeader
        eyebrow="AI intelligence"
        title="Clinical Insights"
        description={`Evidence-aware AI insights for ${result.patientRef}.`}
        action={<FeatureStatusBadge status={DEMO_MODE ? "demo" : "active"} />}
      />

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        <section className="rounded border border-line bg-surface p-6">
          <div className="flex items-center gap-3">
            <RiskBadge level={result.riskLevel} />
            <span className="hf-metric text-sm text-mist">{Math.round(result.probability * 100)}% predicted risk</span>
          </div>
          <p className="mt-3 text-sm text-slate">
            This patient's HbA1c and blood glucose readings sit above the network's typical range for a low-risk
            result, and are the primary drivers behind the {result.riskLevel} classification.
          </p>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-ink">Major risk factors</h2>
          <ul className="mt-3 space-y-2">
            {topRisk.map((f) => (
              <li key={f.feature} className="flex items-start gap-3 text-sm text-slate">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                <span>
                  <strong className="text-ink">{f.label}</strong> — {f.value}, contribution +{f.contribution.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-base font-semibold text-ink">Follow-up considerations</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate">
            <li>• Confirm with a fasting plasma glucose or oral glucose tolerance test before treatment decisions.</li>
            <li>• Elevated BMI and hypertension compound risk — consider joint management planning.</li>
            <li>• Re-run the assessment after any significant change in glucose control.</li>
          </ul>
        </section>

        <section className="rounded border border-amber bg-amber-soft p-4 text-sm text-amber">
          AI-assisted decision support. Clinical judgment is required.
        </section>

        <p className="text-xs text-mist">
          {DEMO_MODE ? (
            "Narrative shown here is fixed demo text."
          ) : (
            <>Generated narrative sits behind <code className="hf-metric">POST /api/insights/generate</code> — wire your OpenRouter-backed summary there when the endpoint is live; this page currently renders the same structured template with your real prediction's numbers.</>
          )}
        </p>
      </div>
    </div>
  );
}
