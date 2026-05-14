import { Link } from "wouter";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { CustomProgress } from "@/components/dashboard/custom-progress";
import type { Accent } from "@/data/dashboard-data";

type Prediction = {
  time: string;
  machine: string;
  code: string;
  eta: string;
  confidence: number;
  tone: Accent;
};

export function FailurePredictions({ predictions }: { predictions: Prediction[] }) {
  return (
    <DashCard className="min-h-[286px] p-4">
      <DashCardHeader className="mb-4">
        <DashCardTitle className="text-base">Failure Predictions</DashCardTitle>
        <Link href="/analytics" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </DashCardHeader>
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="text-xs font-semibold text-slate-500">
              <th className="pb-3">Time</th>
              <th className="pb-3">Machine</th>
              <th className="pb-3">Failure Code</th>
              <th className="pb-3">Est. Time</th>
              <th className="pb-3">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {predictions.map((p) => (
              <tr key={`${p.machine}-${p.code}`} className="text-sm font-semibold text-slate-800">
                <td className="py-2.5">{p.time}</td>
                <td className="py-2.5">{p.machine}</td>
                <td className="py-2.5">
                  <DashBadge tone={p.tone === "red" ? "red" : p.tone === "green" ? "green" : "orange"}>
                    {p.code}
                  </DashBadge>
                </td>
                <td className="py-2.5">{p.eta}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs font-extrabold text-slate-700">{p.confidence}%</span>
                    <CustomProgress
                      value={p.confidence}
                      tone={p.tone === "red" ? "red" : p.tone === "green" ? "green" : "orange"}
                      className="w-24"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}
