import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="hf-metric font-display text-6xl font-bold text-line">403</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">You don't have access to this page.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">
        Your current simulated role doesn't include this section. Switch roles from the top bar, or return to the
        command center.
      </p>
      <Link href="/dashboard" className="hf-focus mt-6 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-ink">
        Back to dashboard
      </Link>
    </main>
  );
}
