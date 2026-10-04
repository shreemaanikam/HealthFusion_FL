"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeatureStatusBadge } from "@/components/ui/FeatureStatusBadge";
import { Button } from "@/components/ui/Button";
import { submitAssessment } from "@/services/api/prediction";
import { ApiError } from "@/services/api/client";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { AssessmentInput } from "@/types/prediction";

type SubmitState = "idle" | "validating" | "submitting" | "success" | "error";

const initial: AssessmentInput = {
  gender: "female",
  age: 45,
  hypertension: false,
  heartDisease: false,
  smokingHistory: "never",
  bmi: 24,
  hba1cLevel: 5.4,
  bloodGlucoseLevel: 100,
};

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

const inputClass = "hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink";

export default function AssessmentPage() {
  const router = useRouter();
  const [form, setForm] = useState<AssessmentInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (form.age < 1 || form.age > 120) next.age = "Enter an age between 1 and 120.";
    if (form.bmi < 10 || form.bmi > 80) next.bmi = "Enter a BMI between 10 and 80.";
    if (form.hba1cLevel < 3 || form.hba1cLevel > 15) next.hba1cLevel = "Enter an HbA1c between 3% and 15%.";
    if (form.bloodGlucoseLevel < 40 || form.bloodGlucoseLevel > 400) next.bloodGlucoseLevel = "Enter a glucose reading between 40 and 400 mg/dL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("validating");
    setErrorMessage(null);
    if (!validate()) {
      setState("idle");
      return;
    }
    setState("submitting");
    try {
      const result = await submitAssessment(form);
      setState("success");
      router.push(`/assessment/result/${result.id}`);
    } catch (err) {
      setState("error");
      if (err instanceof ApiError && err.status >= 500) {
        setErrorMessage("The prediction service is temporarily unavailable. Try again in a moment.");
      } else if (err instanceof ApiError) {
        setErrorMessage("The assessment couldn't be scored — check the values above and try again.");
      } else {
        setErrorMessage(
          DEMO_MODE
            ? "Something went wrong scoring this assessment."
            : "Couldn't reach HealthFusion_FL's backend. Check your connection and try again."
        );
      }
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Patient care"
        title="New assessment — evaluated by the trained model"
        description="This input does not need to have been part of model training. It applies the exact same preprocessing used during training (scaling, encoding) and performs a forward pass to generate a prediction."
        action={<FeatureStatusBadge status={DEMO_MODE ? "demo" : "active"} />}
      />

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
        <fieldset>
          <legend className="font-display text-base font-semibold text-ink">Patient profile</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Gender" htmlFor="gender">
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as AssessmentInput["gender"] })}
                className={inputClass}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Age" htmlFor="age" hint={errors.age}>
              <input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-base font-semibold text-ink">Medical history</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="hf-focus flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.hypertension}
                onChange={(e) => setForm({ ...form, hypertension: e.target.checked })}
                className="accent-navy"
              />
              Hypertension
            </label>
            <label className="hf-focus flex items-center gap-2 rounded border border-line px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.heartDisease}
                onChange={(e) => setForm({ ...form, heartDisease: e.target.checked })}
                className="accent-navy"
              />
              Heart disease
            </label>
            <Field label="Smoking history" htmlFor="smoking">
              <select
                id="smoking"
                value={form.smokingHistory}
                onChange={(e) => setForm({ ...form, smokingHistory: e.target.value as AssessmentInput["smokingHistory"] })}
                className={inputClass}
              >
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
                <option value="not_current">Not current</option>
                <option value="ever">Ever</option>
                <option value="no_info">No information</option>
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-base font-semibold text-ink">Clinical measurements</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <Field label="BMI" htmlFor="bmi" hint={errors.bmi}>
              <input
                id="bmi"
                type="number"
                step="0.1"
                value={form.bmi}
                onChange={(e) => setForm({ ...form, bmi: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="HbA1c level (%)" htmlFor="hba1c" hint={errors.hba1cLevel}>
              <input
                id="hba1c"
                type="number"
                step="0.1"
                value={form.hba1cLevel}
                onChange={(e) => setForm({ ...form, hba1cLevel: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Blood glucose (mg/dL)" htmlFor="glucose" hint={errors.bloodGlucoseLevel}>
              <input
                id="glucose"
                type="number"
                value={form.bloodGlucoseLevel}
                onChange={(e) => setForm({ ...form, bloodGlucoseLevel: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        {state === "error" && errorMessage && (
          <p role="alert" className="rounded border border-red bg-red-soft px-4 py-3 text-sm text-red">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? "Scoring…" : state === "error" ? "Try again" : "Run assessment"}
          </Button>
          <p className="text-xs text-mist">Runs against the current global model, version 4.2.1.</p>
        </div>
      </form>
    </div>
  );
}
