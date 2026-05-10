import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { failurePredictions } from "@/data/dashboard-data";

interface FailurePredictionsProps {
  predictions?: any[];
}

export function FailurePredictions({ predictions = [] }: FailurePredictionsProps) {
  // Transform AI predictions to table format or use defaults
  const tableData = predictions.length > 0 
    ? predictions.slice(0, 4).map(p => ({
        time: new Date(p.timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        machine: p.machineId.replace('MACHINE_', 'Machine '),
        code: p.predictedFailures[0]?.type?.toUpperCase().slice(0, 6) || 'ML-GEN',
        eta: `${Math.round(p.predictedFailures[0]?.estimatedTime || 0)} Hours`,
        confidence: p.predictedFailures[0]?.confidence || 0,
        tone: p.maintenanceUrgency === 'critical' ? 'red' : 
               p.maintenanceUrgency === 'high' ? 'orange' : 
               p.maintenanceUrgency === 'medium' ? 'orange' : 'green'
      }))
    : failurePredictions;
  return (
    <Card className="min-h-[286px] p-4">
      <CardHeader className="mb-4">
        <CardTitle className="text-base">Failure Predictions</CardTitle>
        <Link href="/analytics" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </CardHeader>
      <div className="overflow-x-auto scrollbar-none">
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
            {tableData.map((prediction) => (
              <tr key={`${prediction.machine}-${prediction.code}`} className="text-sm font-semibold text-slate-800">
                <td className="py-2.5">{prediction.time}</td>
                <td className="py-2.5">{prediction.machine}</td>
                <td className="py-2.5">
                  <Badge tone={prediction.tone === "red" ? "red" : prediction.tone === "green" ? "green" : "orange"}>
                    {prediction.code}
                  </Badge>
                </td>
                <td className="py-2.5">{prediction.eta}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs font-extrabold text-slate-700">{prediction.confidence}%</span>
                    <Progress value={prediction.confidence} tone={prediction.tone as "red" | "orange" | "green" | "blue"} className="w-24" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
