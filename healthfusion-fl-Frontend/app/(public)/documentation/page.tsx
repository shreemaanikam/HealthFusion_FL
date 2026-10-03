const commands = [
  { cmd: "npm install", note: "Install dependencies." },
  { cmd: "cp .env.example .env.local", note: "Set NEXT_PUBLIC_DEMO_MODE and the API base URL." },
  { cmd: "npm run dev", note: "Run the app at localhost:3000." },
  { cmd: "npm run typecheck", note: "Type-check the whole project." },
  { cmd: "npm run build", note: "Production build." },
];

export default function DocumentationPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Documentation</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          Setup and project structure.
        </h1>
      </section>
      <section className="hf-rule">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h2 className="font-display text-lg font-semibold text-ink">Setup commands</h2>
          <div className="mt-4 divide-y divide-line rounded border border-line">
            {commands.map((c) => (
              <div key={c.cmd} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="hf-metric text-sm text-navy">{c.cmd}</code>
                <span className="text-xs text-mist">{c.note}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate">
            Full architecture notes, environment variables, and the real-API integration contract are in the
            repository's README.
          </p>
        </div>
      </section>
    </div>
  );
}
