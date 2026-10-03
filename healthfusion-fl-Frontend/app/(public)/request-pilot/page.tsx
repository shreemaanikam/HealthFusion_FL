"use client";

import { useState } from "react";
import { DEMO_MODE } from "@/lib/demo-mode";
import { Button } from "@/components/ui/Button";

const inputClass = "hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist";

export default function RequestPilotPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    if (DEMO_MODE) {
      // No backend endpoint exists for this in either mode's contract --
      // demo mode says so plainly instead of pretending an email went out.
      await new Promise((r) => setTimeout(r, 500));
      setStatus("submitted");
      return;
    }
    // Live mode: no pilot-request endpoint is defined in the API contract
    // either. Rather than invent one, this is left as a real gap -- wire
    // it to whatever intake endpoint the backend eventually exposes.
    setStatus("error");
  };

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-sm font-medium text-teal">Request received</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          Pilot request submitted in demonstration mode.
        </h1>
        <p className="mt-3 text-sm text-slate">
          Nothing was actually sent — HealthFusion_FL doesn't yet have a live pilot-intake backend. In live mode this
          form will hand off to that endpoint once it exists.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <p className="text-sm font-medium text-teal">Request a pilot</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Tell us about your organization</h1>
      <p className="mt-2 text-sm text-mist">
        {DEMO_MODE
          ? "This is a demonstration form — submitting it doesn't send a real request."
          : "There's currently no live intake endpoint wired up for this form."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="orgName" className="mb-1 block text-sm font-medium text-ink">Organization name</label>
          <input id="orgName" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="orgType" className="mb-1 block text-sm font-medium text-ink">Organization type</label>
          <select id="orgType" required className={inputClass} defaultValue="">
            <option value="" disabled>Select one</option>
            <option>Hospital</option>
            <option>Clinic network</option>
            <option>Research institute</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className="mb-1 block text-sm font-medium text-ink">Contact name</label>
            <input id="contactName" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="workEmail" className="mb-1 block text-sm font-medium text-ink">Work email</label>
            <input id="workEmail" type="email" required className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="sites" className="mb-1 block text-sm font-medium text-ink">Number of sites</label>
          <input id="sites" type="number" min={1} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="useCase" className="mb-1 block text-sm font-medium text-ink">Primary use case</label>
          <input id="useCase" placeholder="e.g. Diabetes risk screening" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-ink">Message</label>
          <textarea id="message" rows={4} className={inputClass} />
        </div>

        {status === "error" && (
          <p role="alert" className="rounded border border-red bg-red-soft px-3 py-2 text-sm text-red">
            There's no live pilot-request endpoint yet, so this can't actually be submitted outside demo mode.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit request"}
        </Button>
      </form>
    </div>
  );
}
