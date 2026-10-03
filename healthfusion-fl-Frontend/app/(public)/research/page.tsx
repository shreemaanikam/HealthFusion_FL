const sections = [
  {
    title: "Motivation",
    body: "Diabetes risk models improve with more data, but healthcare data is fragmented across institutions by design — regulation, competition, and patient trust all argue against centralizing it. Federated learning lets the model travel instead of the data.",
  },
  {
    title: "Research direction",
    body: "The project studies whether adaptive, reliability-weighted aggregation outperforms plain FedAvg when hospitals contribute unevenly sized and unevenly distributed cohorts — the realistic case, not the textbook one.",
  },
  {
    title: "Methodology",
    body: "Four simulated hospital clients train local models on partitioned splits of a combined diabetes dataset, aggregated over federated rounds and evaluated against a held-out global test set.",
  },
  {
    title: "Current experiments",
    body: "Comparing Logistic Regression, Decision Tree, Random Forest, and Neural Network baselines against the federated and adaptive-federated variants — see Model Comparison inside the platform.",
  },
  {
    title: "Future publication",
    body: "Findings are being written up for the MLOps course (AD4V71) review cycle, with the platform itself serving as the demonstration artifact.",
  },
];

export default function ResearchPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <p className="text-sm font-medium text-teal">Research</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
          Why federated, and what we're testing.
        </h1>
      </section>
      <section className="hf-rule">
        <div className="mx-auto max-w-3xl divide-y divide-line px-6">
          {sections.map((s) => (
            <div key={s.title} className="py-8">
              <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
              <p className="mt-2 max-w-prose text-slate">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
