import { cn, formatDateTime } from "@/lib/utils";
import type { FederatedRound } from "@/types/federated";

export function RoundTimeline({ rounds }: { rounds: FederatedRound[] }) {
  const reversed = [...rounds].reverse();
  const maxAcc = Math.max(...rounds.map((r) => r.globalAccuracy));
  const minAcc = Math.min(...rounds.map((r) => r.globalAccuracy));

  return (
    <div className="divide-y divide-line">
      {reversed.map((r) => {
        const accPct = maxAcc === minAcc ? 100 : ((r.globalAccuracy - minAcc) / (maxAcc - minAcc)) * 100;
        return (
          <div key={r.round} className="flex items-center gap-4 py-3">
            <div className="w-14 shrink-0">
              <p className="font-display text-sm font-semibold text-ink">R{String(r.round).padStart(2, "0")}</p>
              <p
                className={cn(
                  "text-[11px] font-medium",
                  r.status === "completed" ? "text-green" : r.status === "in_progress" ? "text-teal" : "text-mist"
                )}
              >
                {r.status === "in_progress" ? "In progress" : r.status === "completed" ? "Completed" : "Scheduled"}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs text-mist">
                <span>
                  {r.participants}/{r.totalHospitals} hospitals · {r.aggregationStrategy}
                </span>
                <span className="hf-metric text-ink">{(r.globalAccuracy * 100).toFixed(1)}% acc</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-paper">
                <div
                  className={cn("h-full rounded-full", r.status === "in_progress" ? "bg-teal" : "bg-navy")}
                  style={{ width: `${Math.max(6, accPct)}%` }}
                />
              </div>
            </div>
            <p className="hidden w-32 shrink-0 text-right text-xs text-mist sm:block">
              {r.completedAt ? formatDateTime(r.completedAt) : formatDateTime(r.startedAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
