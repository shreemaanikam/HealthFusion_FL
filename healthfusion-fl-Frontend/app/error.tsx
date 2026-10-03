"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="hf-metric font-display text-6xl font-bold text-line">Error</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Something went wrong.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">
        The page hit an unexpected error. This has been logged to the audit timeline.
      </p>
      <button
        onClick={reset}
        className="hf-focus mt-6 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-ink"
      >
        Try again
      </button>
    </main>
  );
}
