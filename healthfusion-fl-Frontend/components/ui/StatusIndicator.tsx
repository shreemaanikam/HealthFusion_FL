import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "teal" | "mist";

const toneDot: Record<Tone, string> = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
  teal: "bg-teal",
  mist: "bg-mist",
};

export function StatusIndicator({
  label,
  tone,
  pulse = false,
  className,
}: {
  label: string;
  tone: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-slate", className)}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", toneDot[tone])} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", toneDot[tone])} />
      </span>
      {label}
    </span>
  );
}

export function hospitalStatusTone(status: "connected" | "syncing" | "degraded" | "offline"): Tone {
  switch (status) {
    case "connected":
      return "green";
    case "syncing":
      return "teal";
    case "degraded":
      return "amber";
    case "offline":
      return "red";
  }
}
