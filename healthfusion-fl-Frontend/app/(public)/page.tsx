import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FederatedIntelligenceMapAuto } from "@/components/federated/FederatedIntelligenceMapAuto";
import { demoFederatedSnapshot } from "@/data/demo/federated";

const principles = [
  {
    title: "Local intelligence",
    body: "Each hospital trains on its own patients. Nothing raw ever leaves the building.",
  },
  {
    title: "Federated exchange",
    body: "Only model updates cross the privacy boundary — encrypted, aggregated, never individually attributable.",
  },
  {
    title: "Explainable output",
    body: "Every prediction ships with the feature contributions that produced it, in clinician-readable form.",
  },
];

const stats = [
  { value: "4", label: "hospitals in this demo federation" },
  { value: "18", label: "simulated federated rounds" },
  { value: "0", label: "patient records ever centralized" },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-medium text-teal">Federated clinical intelligence</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Collaborative healthcare intelligence, without centralizing patient data.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate">
              HealthFusion_FL trains a shared diabetes-risk model across independent hospitals. Raw records stay inside
              each hospital's own environment; only encrypted model updates cross the boundary.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/for-hospitals">Explore platform</Button>
              <Button href="/request-pilot" variant="secondary">Request a pilot</Button>
            </div>
            <p className="mt-8 max-w-sm border-l-2 border-teal pl-4 text-sm text-slate">
              Privacy-preserving clinical intelligence for distributed healthcare environments.
            </p>
          </div>
          <div className="rounded border border-line bg-surface p-4 shadow-panel sm:p-6">
            <p className="text-xs font-semibold text-navy">Demo federation — simulated network</p>
            <FederatedIntelligenceMapAuto
              hospitals={demoFederatedSnapshot.hospitals}
              globalModelVersion={demoFederatedSnapshot.globalModelVersion}
              currentRound={demoFederatedSnapshot.currentRound}
              detail="compact"
              interactive={false}
              className="mt-3"
            />
            <p className="mt-3 text-center text-xs text-mist">
              Illustrative data, not a live production network — see the real network map after signing in.
            </p>
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs font-semibold text-navy">Demo federation — for illustration only</p>
          <div className="mt-4 grid gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="hf-metric font-display text-4xl font-bold text-navy">{s.value}</p>
                <p className="mt-1 text-sm text-slate">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Intelligence moves. Identity doesn't.
            </h2>
            <p className="mt-3 text-slate">
              Every part of the product is built around one boundary: what a hospital keeps, and what the network shares.
            </p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-3">
            {principles.map((p) => (
              <div key={p.title} className="bg-surface p-6">
                <h3 className="font-display text-base font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-slate">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">See the full data flow</h2>
              <p className="mt-3 max-w-md text-slate">
                From a hospital's own EHR to a clinician-readable prediction — walk the path intelligence takes through
                HealthFusion_FL, and exactly where the privacy boundary sits.
              </p>
              <Button href="/how-it-works" variant="secondary" className="mt-6">
                Walk through how it works
              </Button>
            </div>
            <ol className="space-y-0">
              {["Patient data", "Local intelligence", "Privacy boundary", "Federated exchange", "Global intelligence", "Explainable prediction"].map(
                (step, i) => (
                  <li key={step} className="flex items-center gap-4 border-t border-line py-3 first:border-t-0">
                    <span className="hf-metric w-6 text-sm text-mist">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-ink">{step}</span>
                  </li>
                )
              )}
            </ol>
          </div>
        </div>
      </section>

      <section className="hf-rule bg-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">What's real, what's simulated</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
            TensorFlow prediction, SHAP explainability, and the FastAPI backend are active today. Flower-based
            federated learning, adaptive aggregation, and differential privacy currently run as controlled
            simulations. Secure aggregation is designed but not yet built.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/security" variant="secondary" className="border-white/20 bg-transparent text-white hover:border-white">
              Read the security page
            </Button>
            <Link href="/for-hospitals" className="hf-focus inline-flex items-center px-4 py-2 text-sm text-white/80 hover:text-white">
              For hospitals →
            </Link>
            <Link href="/login" className="hf-focus inline-flex items-center px-4 py-2 text-sm text-white/80 hover:text-white">
              Sign in to the platform →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
