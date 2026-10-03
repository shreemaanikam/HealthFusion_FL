import { PageHeader } from "@/components/layout/PageHeader";

const faqs = [
  { q: "Is this a real diagnosis?", a: "No. Every prediction is labeled clinical decision support and must be confirmed with standard diagnostic criteria." },
  { q: "What data does a hospital share?", a: "Only encrypted model updates. See the Privacy Center for exactly which controls are active today." },
  { q: "How do I switch roles?", a: "Use the role selector in the top bar — Doctor, Hospital Administrator, and Researcher each see a different navigation set." },
  { q: "Can I connect a real backend?", a: "Yes — set NEXT_PUBLIC_DEMO_MODE=false and NEXT_PUBLIC_API_BASE_URL to your HealthFusion_FL API. No UI changes required." },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader eyebrow="System" title="Help" description="Product documentation and frequently asked questions." />
      <div className="mx-auto max-w-2xl divide-y divide-line px-6 py-8">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <h2 className="font-display text-sm font-semibold text-ink">{f.q}</h2>
            <p className="mt-1.5 text-sm text-slate">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
