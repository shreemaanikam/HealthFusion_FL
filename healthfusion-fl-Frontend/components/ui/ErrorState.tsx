export function ErrorState({
  title = "Something went wrong",
  description = "The request failed. Try again, or check the System page for backend status.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded border border-line bg-red-soft/40 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold text-red">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="hf-focus mt-4 rounded border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-red"
        >
          Retry
        </button>
      )}
    </div>
  );
}
