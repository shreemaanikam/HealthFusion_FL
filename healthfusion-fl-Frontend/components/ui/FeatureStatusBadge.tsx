import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/types/federated";

const styles: Record<FeatureStatus, string> = {
  active: "bg-green-soft text-green",
  simulation: "bg-teal-soft text-teal",
  demo: "bg-amber-soft text-amber",
  planned: "bg-paper text-mist",
};

const labels: Record<FeatureStatus, string> = {
  active: "Active",
  simulation: "Simulation",
  demo: "Demo",
  planned: "Planned",
};

export function FeatureStatusBadge({ status, className }: { status: FeatureStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium",
        status === "planned" ? "border-line" : "border-transparent",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
