"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getModelValidationReport } from "@/services/api/models";
import { formatPercent } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";
import { useRole } from "@/lib/role-context";

export default function ModelValidationPage() {
  const { role } = useRole();
  const state = useClientData(getModelValidationReport);

  // Do not expose research/admin controls to DOCTOR unnecessarily.
  if (role === "doctor") {
    return (
      <div>
        <PageHeader eyebrow="AI intelligence" title="Model Validation" />
        <div className="p-6 text-center text-slate">
          Model validation details are restricted to Research and Administrative roles.
        </div>
      </div>
    );
  }

  if (state.status === "loading") return <LoadingState label="Loading validation report" />;
  if (state.status === "error") return <ErrorState description={state.message} />;
  if (state.status === "forbidden") return <ErrorState description={state.message} />;

  const data = state.data;
  if (!data || !data.model) return <ErrorState description="No validation report available." />;

  return (
    <div>
      <PageHeader
        eyebrow="AI intelligence"
        title="Model Validation Report"
        description={`Detailed internal and external validation metrics for ${data.model.version}.`}
      />

      <div className="p-6 space-y-8 max-w-5xl">
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Internal Validation (Test Set)</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-mist">Accuracy</p>
              <p className="font-display text-xl text-ink">{formatPercent(data.test_metrics.accuracy)}</p>
            </div>
            <div>
              <p className="text-xs text-mist">Precision</p>
              <p className="font-display text-xl text-ink">{formatPercent(data.test_metrics.precision)}</p>
            </div>
            <div>
              <p className="text-xs text-mist">Recall</p>
              <p className="font-display text-xl text-ink">{formatPercent(data.test_metrics.recall)}</p>
            </div>
            <div>
              <p className="text-xs text-mist">F1 Score</p>
              <p className="font-display text-xl text-ink">{formatPercent(data.test_metrics.f1)}</p>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Advanced Metrics</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate mb-2">Calibration</h3>
              <p className="text-xs text-mist">Decision: {data.calibration.decision}</p>
              <p className="text-xs text-mist">Calibrated Brier Score: {data.calibration.test_platt_calibrated?.brier?.toFixed(4)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate mb-2">Threshold Analysis</h3>
              <p className="text-xs text-mist">Operational Threshold: {data.threshold.operational_threshold}</p>
              <p className="text-xs text-mist">Best F1 Threshold: {data.threshold.best_threshold_by_validation_f1}</p>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Subgroup Performance</h2>
          {data.subgroups_flagged?.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-slate">
              {data.subgroups_flagged.map((sg: any, idx: number) => (
                <li key={idx}>
                  <strong>{sg.group} - {sg.level}:</strong> {sg.flag} (n={sg.n})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate">No subgroups flagged for insufficient performance.</p>
          )}
        </section>

        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">External Validation</h2>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded font-medium ${data.external_validation.status === 'PENDING' ? 'bg-amber-soft text-amber' : 'bg-green-soft text-green'}`}>
              {data.external_validation.status}
            </span>
            <span className="text-sm text-slate">{data.external_validation.reason}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
