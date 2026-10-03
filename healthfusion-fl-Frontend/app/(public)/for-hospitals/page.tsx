import { Button } from "@/components/ui/Button";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";

const reasons = [
  { title: "Local data processing", body: "Patient records stay inside your own environment. HealthFusion_FL never asks you to export a record to train." },
  { title: "Collaborative intelligence", body: "Your model improves using patterns learned across every participating hospital — not just your own patient volume." },
  { title: "Explainability by default", body: "Every prediction ships with the feature contributions behind it, in language a clinician can act on." },
  { title: "Privacy architecture, not a policy", body: "The privacy boundary is a structural property of the system — what crosses it is auditable, not a promise on a page." },
  { title: "Federated model improvement", body: "Rounds run on a schedule; your hospital's contribution weight reflects your data volume and reliability, tracked transparently." },
];

const steps = [
  { title: "Request a pilot", body: "Tell us about your organization and use case.", status: "active" as const },
  { title: "Organization verification", body: "We confirm your organization and intended use before provisioning access.", status: "active" as const },
  { title: "Configure HealthFusion", body: "Set up roles, users, and the diabetes-risk assessment workflow for your team.", status: "active" as const },
  { title: "Install local connector", body: "A lightweight connector runs inside your environment and talks to the coordination server.", status: "planned" as const },
  { title: "Connect to federation", body: "Your hospital joins the next scheduled federated round.", status: "simulation" as const },
  { title: "Invite authorized users", body: "Add doctors, administrators, and researchers under your organization.", status: "active" as const },
  { title: "Begin assessments", body: "Run your first patient assessment and see the explanation behind it.", status: "active" as const },
];

export default function ForHospitalsPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">For hospitals</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          Join a federation without exporting a single patient record.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          HealthFusion_FL is built for hospitals that want the benefit of a larger, shared model without the risk of
          centralizing data to get it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/request-pilot">Request a pilot</Button>
          <Button href="/how-it-works" variant="secondary">See how it works</Button>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2">
            {reasons.map((r) => (
              <div key={r.title} className="rounded border border-line bg-surface p-5">
                <h2 className="font-display text-sm font-semibold text-ink">{r.title}</h2>
                <p className="mt-1.5 text-sm text-slate">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="font-display text-lg font-semibold text-ink">How a hospital gets started</h2>
          <p className="mt-2 max-w-prose text-sm text-slate">
            Steps marked planned or simulation aren't implemented yet — shown here so there's no surprise about what
            "onboarding" currently means in practice.
          </p>
          <ol className="mt-6 divide-y divide-line rounded border border-line bg-surface">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-start gap-4 px-5 py-4">
                <span className="hf-metric mt-0.5 w-6 shrink-0 text-sm text-mist">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <FeatureStatusBadge status={s.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <Button href="/request-pilot">Request a pilot</Button>
        </div>
      </section>
    </div>
  );
}
