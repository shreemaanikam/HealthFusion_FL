import { FeatureStatusBadge } from "./FeatureStatusBadge";
import type { FeatureStatus } from "@/types/federated";

/**
 * Shared shell for routes in the spec that are structurally real (correct
 * layout, nav, typed status) but not yet built out to flagship depth in
 * this pass. Used instead of an empty placeholder page.
 */
export function SectionStatusPage({
  eyebrow,
  title,
  status,
  description,
  points,
}: {
  eyebrow: string;
  title: string;
  status: FeatureStatus;
  description: string;
  points: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium text-teal">{eyebrow}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        <FeatureStatusBadge status={status} />
      </div>
      <p className="mt-4 max-w-prose text-slate">{description}</p>
      <div className="hf-rule mt-8 pt-6">
        <ul className="space-y-3">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-sm text-slate">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
