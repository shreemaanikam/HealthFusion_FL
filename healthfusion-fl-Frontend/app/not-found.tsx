import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="hf-metric font-display text-6xl font-bold text-line">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">This page doesn't exist.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">
        The route you followed isn't part of HealthFusion_FL, or it moved.
      </p>
      <Link href="/" className="hf-focus mt-6 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-ink">
        Return home
      </Link>
    </main>
  );
}
