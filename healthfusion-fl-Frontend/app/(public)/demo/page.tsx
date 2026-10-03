import { Button } from "@/components/ui/Button";

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium text-teal">Demo</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">See HealthFusion_FL in action.</h1>
      <p className="mt-4 text-slate">
        Launch the interactive demo directly, or request a guided pilot for your own organization.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/login">Launch interactive demo</Button>
        <Button href="/request-pilot" variant="secondary">Request a pilot</Button>
      </div>

      <div className="mt-10 rounded border border-line bg-surface p-5">
        <p className="text-xs font-semibold text-navy">What the interactive demo actually is</p>
        <ul className="mt-3 space-y-2 text-sm text-slate">
          <li>• Every screen — dashboard, federated network, explainability, reports — runs against a fixed, typed demo dataset of four hospitals and eighteen federated rounds.</li>
          <li>• Sign in with any of the four simulated roles; no real credentials needed.</li>
          <li>• A demo banner stays visible throughout so demo and live data are never mistaken for one another.</li>
        </ul>
      </div>
    </div>
  );
}
