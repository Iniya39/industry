import { Link } from "wouter";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { type MachineStatus } from "@/data/dashboard-data";
import { MiniTrend } from "@/components/dashboard/mini-trend";

type Row = {
  id: string;
  score: string;
  status: MachineStatus;
  trend: number[];
};

const statusTone: Record<MachineStatus, "green" | "orange" | "red" | "slate"> = {
  Good: "green",
  Warning: "orange",
  Critical: "red",
  Moderate: "orange"
};

const trendColor: Record<MachineStatus, string> = {
  Good: "#16A34A",
  Warning: "#F59E0B",
  Critical: "#E11D48",
  Moderate: "#F59E0B"
};

export function MachineHealthTable({ rows }: { rows: Row[] }) {
  return (
    <DashCard className="min-h-[286px] p-4">
      <DashCardHeader className="mb-4">
        <DashCardTitle className="text-base">Machine Health</DashCardTitle>
        <Link href="/machines" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </DashCardHeader>
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <table className="w-full min-w-[380px] text-left">
          <thead>
            <tr className="text-xs font-semibold text-slate-500">
              <th className="pb-3">Machine</th>
              <th className="pb-3">Health Score</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="text-sm font-semibold text-slate-800">
                <td className="py-2">{row.id}</td>
                <td className="py-2">{row.score}</td>
                <td className="py-2">
                  <DashBadge tone={statusTone[row.status]}>{row.status}</DashBadge>
                </td>
                <td className="py-2">
                  <MiniTrend values={row.trend} color={trendColor[row.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}
