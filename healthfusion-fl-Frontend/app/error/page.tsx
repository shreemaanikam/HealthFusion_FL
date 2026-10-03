import Link from "next/link";

export default function ErrorStatusPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="hf-metric font-display text-6xl font-bold text-line">Error</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Something went wrong.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">
        This is the static error status page. Runtime errors are caught by the app's error boundary and offer a retry.
      </p>
      <Link href="/" className="hf-focus mt-6 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-ink">
        Return home
      </Link>
    </main>
  );
}
