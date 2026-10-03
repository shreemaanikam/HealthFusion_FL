import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getModelRegistry } from "@/services/api/models";
import { formatPercent, formatDate } from "@/lib/utils";

export default async function ModelsPage() {
  const registry = await getModelRegistry();

  return (
    <div>
      <PageHeader
        eyebrow="AI intelligence"
        title="Model Registry"
        description={`Current: ${registry.currentModelVersion} · training ${registry.trainingState} · deployment ${registry.deploymentState}`}
        action={
          <Link href="/models/comparison" className="hf-focus text-sm text-teal hover:underline">
            Compare model types →
          </Link>
        }
      />
      <div className="p-6">
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-paper">
              <tr className="text-xs text-mist">
                <th className="px-4 py-2 font-medium">Version</th>
                <th className="px-4 py-2 font-medium">Kind</th>
                <th className="px-4 py-2 font-medium">Released</th>
                <th className="px-4 py-2 font-medium">Accuracy</th>
                <th className="px-4 py-2 font-medium">F1</th>
                <th className="px-4 py-2 font-medium">ROC-AUC</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {[...registry.versions].reverse().map((v) => (
                <tr key={v.version}>
                  <td className="hf-metric px-4 py-3 font-medium text-ink">{v.version}</td>
                  <td className="px-4 py-3 text-slate">{v.kind}</td>
                  <td className="px-4 py-3 text-mist">{formatDate(v.releasedAt)}</td>
                  <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.accuracy)}</td>
                  <td className="hf-metric px-4 py-3 text-ink">{formatPercent(v.metrics.f1)}</td>
                  <td className="hf-metric px-4 py-3 text-ink">{v.metrics.rocAuc?.toFixed(3) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        v.status === "active"
                          ? "rounded bg-green-soft px-2 py-0.5 text-xs font-medium text-green"
                          : "text-xs text-mist"
                      }
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Fetches live backend data per request; must not be prerendered at build time.
export const dynamic = "force-dynamic";
