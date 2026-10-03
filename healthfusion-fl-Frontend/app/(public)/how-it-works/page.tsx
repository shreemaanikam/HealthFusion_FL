import Link from "next/link";
import { StepExplorer, type Step } from "@/components/federated/StepExplorer";
import { demoFederatedSnapshot } from "@/data/demo/federated";

const steps: Step[] = [
  {
    n: "01",
    title: "Hospital data",
    body: "A hospital's own electronic health records — labs, vitals, history — captured and stored entirely inside that hospital's environment. This is where patient identity lives, and where it stays.",
    focus: "hospitals",
    status: "active",
    note: "Data locality is a property of the architecture, not a setting.",
  },
  {
    n: "02",
    title: "Local AI",
    body: "A model trains on-site against that hospital's patients. Its parameters are shaped by local data; the data itself never moves.",
    focus: "hospitals",
    status: "simulation",
    note: "Local training currently runs as a Flower-based simulation, not on real hospital infrastructure.",
  },
  {
    n: "03",
    title: "Privacy boundary",
    body: "The line no raw record crosses. What passes through is a set of model updates — gradients, not patients. Encryption in transit protects them on the way.",
    focus: "boundary",
    status: "active",
    note: "Differential privacy is a simulation today. Secure aggregation is planned, not built.",
  },
  {
    n: "04",
    title: "Federated learning",
    body: "The coordination server combines updates from every participating hospital into one improved global model, weighted by data volume and reliability.",
    focus: "exchange",
    status: "simulation",
    note: "FedAvg and the adaptive variant run as a simulation; no real hospital-to-hospital training is active yet.",
  },
  {
    n: "05",
    title: "Global model",
    body: "The aggregated model is redistributed to every hospital in the network — each one benefits from patterns learned across all of them, without seeing anyone else's patients.",
    focus: "global",
    status: "simulation",
  },
  {
    n: "06",
    title: "Explainable prediction",
    body: "A clinician runs an assessment. The model scores it, and SHAP shows exactly which factors drove the prediction — decision support, never a diagnosis.",
    focus: "global",
    status: "active",
    note: "TensorFlow prediction and SHAP explainability are active.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">How it works</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          Intelligence flows through six stages. Patient identity never leaves stage one.
        </h1>
        <p className="mt-4 max-w-xl text-slate">
          Step through the story — the map highlights the part of the federation each stage is about.
        </p>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <StepExplorer
            steps={steps}
            hospitals={demoFederatedSnapshot.hospitals}
            globalModelVersion={demoFederatedSnapshot.globalModelVersion}
            currentRound={demoFederatedSnapshot.currentRound}
          />
        </div>
      </section>

      <section className="hf-rule">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="rounded border border-line bg-teal-soft p-6">
            <h2 className="font-display text-lg font-semibold text-navy">What's real today</h2>
            <p className="mt-2 max-w-prose text-sm text-slate">
              Prediction and explainability (stage 6) are active. The federated stages (2, 4, 5) run as a controlled
              simulation rather than across real hospitals. At the privacy boundary, differential privacy is a
              simulation and secure aggregation is planned. See the{" "}
              <Link href="/security" className="hf-focus text-teal underline underline-offset-2">Security page</Link>{" "}
              for every control's honest status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
