import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { machineHealthRows, type MachineStatus } from "@/data/dashboard-data";
import { MiniTrend } from "@/components/dashboard/mini-trend";

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

interface MachineHealthTableProps {
  machines?: any[];
}

export function MachineHealthTable({ machines = [] }: MachineHealthTableProps) {
  // Transform machines to table format or use defaults
  const tableData = machines.length > 0 
    ? machines.slice(0, 5).map(machine => ({
        id: machine.id,
        score: `${machine.health}/100`,
        status: machine.status as MachineStatus,
        trend: Array.from({ length: 6 }, () => Math.random() * 10 + 5)
      }))
    : machineHealthRows;
  return (
    <Card className="min-h-[286px] p-4">
      <CardHeader className="mb-4">
        <CardTitle className="text-base">Machine Health</CardTitle>
        <Link href="/machines" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </CardHeader>
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full min-w-[380px] text-left">
          <thead>
            <tr className="text-xs font-semibold text-slate-500">
              <th className="pb-3">Machine ID</th>
              <th className="pb-3">Health Score</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.map((row) => (
              <tr key={row.id} className="text-sm font-semibold text-slate-800">
                <td className="py-2">{row.id}</td>
                <td className="py-2">{row.score}</td>
                <td className="py-2">
                  <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                </td>
                <td className="py-2">
                  <MiniTrend values={row.trend} color={trendColor[row.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
