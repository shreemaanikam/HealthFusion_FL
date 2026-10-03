"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getModelRegistry } from "@/services/api/models";
import { formatPercent } from "@/lib/utils";
import { useClientData } from "@/lib/useClientData";

export default function ModelComparisonPage() {
  const state = useClientData(getModelRegistry);

  const maxAcc = state.status === "ok"
    ? Math.max(...state.data.versions.map((v) => v.metrics.accuracy))
    : 1;

  return (
    <div>
      <PageHeader
        eyebrow="AI intelligence"
        title="Model Comparison"
        description="Every model type evaluated on the same held-out set, in the order they were tried."
      />

      <div className="p-6">
        {state.status === "loading" && <LoadingState label="Loading model comparison" />}
        {state.status === "error" && <ErrorState description={state.message} />}
        {state.status === "ok" && (
          <>
            <h2 className="font-display text-base font-semibold text-ink">Model evolution</h2>
            <div className="mt-4 flex items-end gap-3 overflow-x-auto pb-2">
              {state.data.versions.map((v) => (
                <div key={v.version} className="flex min-w-[64px] flex-col items-center gap-2">
                  <div
                    className={`w-10 rounded-t-sm ${v.status === "active" ? "bg-teal" : "bg-navy-2"}`}
                    style={{ height: `${(v.metrics.accuracy / maxAcc) * 160}px` }}
                    title={`${v.kind}: ${formatPercent(v.metrics.accuracy)}`}
                  />
                  <p className="text-center text-[11px] text-mist">{v.version}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-10 font-display text-base font-semibold text-ink">Metric comparison</h2>
            <div className="mt-4 overflow-x-auto rounded border border-line">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-paper">
                  <tr className="text-xs text-mist">
                    <th className="px-4 py-2 font-medium">Model type</th>
                    <th className="px-4 py-2 font-medium">Accuracy</th>
                    <th className="px-4 py-2 font-medium">Precision</th>
                    <th className="px-4 py-2 font-medium">Recall</th>
                    <th className="px-4 py-2 font-medium">F1</th>
                    <th className="px-4 py-2 font-medium">ROC-AUC</th>
                    <th className="px-4 py-2 font-medium">Calibration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {state.data.versions.map((v) => (
                    <tr key={v.version} className={v.status === "active" ? "bg-teal-soft/40" : undefined}>
                      <td className="px-4 py-3 font-medium text-ink">{v.kind}</td>
                      <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.accuracy)}</td>
                      <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.precision)}</td>
                      <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.recall)}</td>
                      <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.f1)}</td>
                      <td className="hf-metric px-4 py-3 text-ink">{v.metrics.rocAuc?.toFixed(3) ?? "—"}</td>
                      <td className="px-4 py-3 text-xs capitalize text-mist">{v.metrics.calibration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
