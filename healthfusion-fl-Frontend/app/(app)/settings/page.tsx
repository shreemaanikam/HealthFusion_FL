import { PageHeader } from "@/components/layout/PageHeader";

const sections = [
  { title: "Profile", body: "Name, email, and clinical role — editable by the signed-in user." },
  { title: "Organization", body: "Hospital or research institute this account is scoped to." },
  { title: "Notifications", body: "Which audit and federated-round events trigger a notification." },
  { title: "Security", body: "Password, session, and (planned) multi-factor authentication." },
  { title: "Privacy", body: "Links to the Privacy Center — this account's data-sharing posture." },
  { title: "Environment", body: "Demo mode toggle and API base URL — set via environment variables, read-only here." },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="System" title="Settings" description="Prototype settings surface — non-destructive, nothing here writes to a real backend yet." />
      <div className="grid gap-px bg-line sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="bg-surface p-6">
            <h2 className="font-display text-sm font-semibold text-ink">{s.title}</h2>
            <p className="mt-1.5 text-sm text-slate">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
