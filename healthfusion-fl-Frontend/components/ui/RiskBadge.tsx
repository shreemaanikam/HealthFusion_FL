import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/prediction";

const styles: Record<RiskLevel, string> = {
  low: "bg-green-soft text-green",
  moderate: "bg-amber-soft text-amber",
  high: "bg-red-soft text-red",
};

const labels: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-sm font-medium", styles[level], className)}>
      {labels[level]}
    </span>
  );
}
