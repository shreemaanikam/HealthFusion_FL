const items: { tone: "green" | "teal" | "amber" | "red"; label: string }[] = [
  { tone: "green", label: "Connected" },
  { tone: "teal", label: "Syncing" },
  { tone: "amber", label: "Degraded" },
  { tone: "red", label: "Offline" },
];

const dotClass: Record<(typeof items)[number]["tone"], string> = {
  green: "bg-green",
  teal: "bg-teal",
  amber: "bg-amber",
  red: "bg-red",
};

export function NetworkLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${dotClass[item.tone]}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
