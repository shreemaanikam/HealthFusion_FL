import { DEMO_MODE } from "@/lib/demo-mode";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div
      role="region"
      aria-label="Demo mode notice"
      className="border-b border-line bg-amber-soft px-4 py-1.5 text-center text-xs font-medium text-amber sm:px-6"
    >
      Demo mode — showing controlled demo datasets, not a live hospital network.
    </div>
  );
}
