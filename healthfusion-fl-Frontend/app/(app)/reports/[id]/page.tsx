"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAssessmentResult } from "@/services/api/prediction";
import { generateReport } from "@/services/api/insights";
import { DEMO_MODE } from "@/lib/demo-mode";
import { formatPercent, formatDateTime } from "@/lib/utils";
import type { AssessmentResult } from "@/types/prediction";

function ReportActions({ result }: { result: AssessmentResult }) {
  const [exportState, setExportState] = useState<"idle" | "working" | "error" | "unavailable">("idle");

  const handleExport = async () => {
    if (DEMO_MODE) {
      setExportState("unavailable");
      return;
    }
    setExportState("working");
    try {
      const report = await generateReport(result);
      // Backend returns a structured report object, not a PDF URL.
      // Use the browser print dialog as the export mechanism until a
      // real PDF endpoint is wired up.
      if (report.url) {
        window.open(report.url, "_blank", "noopener,noreferrer");
      } else {
        // Fall back to print dialog
        window.print();
      }
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  };

  return (
    <div className="print:hidden">
      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="hf-focus rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-navy"
        >
          Print
        </button>
        <button
          onClick={handleExport}
          disabled={exportState === "working"}
          className="hf-focus rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-navy disabled:opacity-60"
        >
          {exportState === "working" ? "Generating…" : "Export PDF"}
        </button>
      </div>
      {exportState === "unavailable" && (
        <p className="mt-2 max-w-xs text-right text-xs text-mist">
          PDF export needs a live backend (POST /api/insights/report) — use Print in demo mode for now.
        </p>
      )}
      {exportState === "error" && (
        <p className="mt-2 max-w-xs text-right text-xs text-red">
          Couldn't generate the PDF. Try again, or use Print instead.
        </p>
      )}
    </div>
  );
}

export default function ReportPage({ params }: { params: { id: string } }) {
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
        <PageHeader eyebrow="Patient care" title="Clinical decision-support report" />
        <LoadingState label="Loading report" />
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <PageHeader eyebrow="Patient care" title="Clinical decision-support report" />
        <EmptyState
          title="This report isn't available"
          description={
            DEMO_MODE
              ? "No demo assessment matches this ID."
              : "Reports are generated from this session's own predictions — HealthFusion_FL's current API doesn't persist them for retrieval by link."
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Patient care"
        title="Clinical decision-support report"
        description={`${result.patientRef} · ${formatDateTime(result.createdAt)}`}
        action={<ReportActions result={result} />}
      />

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        <section>
          <h2 className="font-display text-base font-semibold text-ink">Assessment summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-mist">Prediction</p>
              <div className="mt-1"><RiskBadge level={result.riskLevel} /></div>
            </div>
            <div>
              <p className="text-xs text-mist">Probability</p>
              <p className="hf-metric mt-1 text-sm font-semibold text-ink">{formatPercent(result.probability)}</p>
            </div>
            <div>
              <p className="text-xs text-mist">Confidence</p>
              <p className="hf-metric mt-1 text-sm font-semibold text-ink">{formatPercent(result.confidence)}</p>
            </div>
            <div>
              <p className="text-xs text-mist">Model version</p>
              <p className="hf-metric mt-1 text-sm font-semibold text-ink">{result.modelVersion}</p>
            </div>
          </div>
        </section>

        <section className="hf-rule pt-6">
          <h2 className="font-display text-base font-semibold text-ink">Feature contributions</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs text-mist">
                  <th className="py-1.5 font-medium">Feature</th>
                  <th className="py-1.5 font-medium">Value</th>
                  <th className="py-1.5 font-medium">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.featureContributions.map((c) => (
                  <tr key={c.feature}>
                    <td className="py-2 text-ink">{c.label}</td>
                    <td className="hf-metric py-2 text-mist">{c.value}</td>
                    <td className={`hf-metric py-2 font-medium ${c.direction === "increases_risk" ? "text-red" : "text-teal"}`}>
                      {c.contribution > 0 ? "+" : ""}
                      {c.contribution.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="hf-rule pt-6">
          <h2 className="font-display text-base font-semibold text-ink">Interpretation</h2>
          <p className="mt-2 text-sm text-slate">
            {result.featureContributions[0]?.label} and {result.featureContributions[1]?.label} were the largest
            drivers of this prediction. This is model-generated decision support and reflects patterns learned across
            the federated network — it does not replace clinical judgment or standard diagnostic workup.
          </p>
        </section>

        <section className="hf-rule pt-6 text-xs text-mist">
          <p>Generated {formatDateTime(result.createdAt)} · Model {result.modelVersion} · Source: {result.source}</p>
          <p className="mt-1">
            Disclaimer: HealthFusion_FL is a research prototype (AD4V71). This report is AI-assisted decision support,
            not a medical diagnosis, and has not been clinically validated.
          </p>
        </section>
      </div>
    </div>
  );
}
