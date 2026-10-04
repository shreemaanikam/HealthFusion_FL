"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAssessmentHistory } from "@/services/api/prediction";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { AssessmentHistoryItem } from "@/types/prediction";
import { formatDateTime, formatPercent } from "@/lib/utils";

export default function AssessmentHistoryPage() {
  const [items, setItems] = useState<AssessmentHistoryItem[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAssessmentHistory().then(setItems);
  }, []);

  const filtered = items?.filter((i) => i.patientRef.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <PageHeader
        eyebrow="Patient care"
        title="Assessment history"
        description={
          DEMO_MODE
            ? "Every assessment run in this organization, most recent first."
            : "Every clinical assessment associated with your account, most recent first."
        }
      />
      <div className="p-6">
        <input
          placeholder="Search by patient reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="hf-focus mb-4 w-full max-w-sm rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
        />

        {items === null && <LoadingState label="Loading assessment history" />}
        {items !== null && items.length === 0 && (
          <EmptyState
            title="No assessments yet"
            description={DEMO_MODE ? undefined : "Run one from New Assessment — it'll show up here immediately."}
          />
        )}
        {items !== null && items.length > 0 && filtered?.length === 0 && (
          <EmptyState title="No assessments match" description="Try a different patient reference." />
        )}
        {filtered && filtered.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper">
                <tr className="text-xs text-mist">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Patient</th>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Risk</th>
                  <th className="px-4 py-2 font-medium">Confidence</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-mist">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/assessment/result/${item.id}`} className="hf-focus font-medium text-ink hover:text-teal">
                        {item.patientRef}
                      </Link>
                    </td>
                    <td className="hf-metric px-4 py-3 text-ink">{item.modelVersion}</td>
                    <td className="px-4 py-3"><RiskBadge level={item.riskLevel} /></td>
                    <td className="hf-metric px-4 py-3 text-ink">{formatPercent(item.confidence)}</td>
                    <td className="px-4 py-3">
                      <span className={item.status === "completed" ? "text-green" : "text-red"}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
