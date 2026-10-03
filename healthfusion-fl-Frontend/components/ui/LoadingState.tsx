export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-mist" role="status" aria-live="polite">
      <span className="h-3 w-3 animate-pulse rounded-full bg-teal" />
      {label}…
    </div>
  );
}
