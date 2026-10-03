import { cn } from "@/lib/utils";
import type { FeatureContribution } from "@/types/prediction";

export function FeatureContributionChart({ contributions }: { contributions: FeatureContribution[] }) {
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.01);

  return (
    <div className="space-y-3">
      {contributions.map((c) => {
        const widthPct = (Math.abs(c.contribution) / maxAbs) * 100;
        const positive = c.direction === "increases_risk";
        return (
          <div key={c.feature} className="grid grid-cols-[minmax(0,1fr)_2.2fr] items-center gap-3 sm:grid-cols-[160px_1fr]">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{c.label}</p>
              <p className="hf-metric truncate text-xs text-mist">{c.value}</p>
            </div>
            <div className="relative h-5">
              <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
              <div
                className={cn(
                  "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm",
                  positive ? "bg-red" : "bg-teal"
                )}
                style={
                  positive
                    ? { left: "50%", width: `${widthPct / 2}%` }
                    : { right: "50%", width: `${widthPct / 2}%` }
                }
              />
              <span
                className={cn(
                  "hf-metric absolute top-1/2 -translate-y-1/2 text-xs font-medium",
                  positive ? "text-red" : "text-teal"
                )}
                style={positive ? { left: `calc(50% + ${widthPct / 2}% + 6px)` } : { right: `calc(50% + ${widthPct / 2}% + 6px)` }}
              >
                {positive ? "+" : ""}
                {c.contribution.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-2 text-xs text-mist">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-red" /> increases predicted risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-teal" /> decreases predicted risk
        </span>
      </div>
    </div>
  );
}
