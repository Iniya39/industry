import { Link, useLocation } from "wouter";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { usePredictions } from "@/context/prediction-context";
import { MACHINE_CONFIGS } from "@/lib/machine-config";
import { cn } from "@/lib/utils";

const alertTone: Record<string, { badge: "red" | "orange"; circle: string; icon: string }> = {
  Critical: { badge: "red", circle: "bg-rose-50", icon: "text-rose-600" },
  High: { badge: "orange", circle: "bg-orange-50", icon: "text-orange-500" },
  Medium: { badge: "orange", circle: "bg-amber-50", icon: "text-amber-500" },
  Good: { badge: "orange", circle: "bg-emerald-50", icon: "text-emerald-500" } // Fallback
};

export function PriorityAlerts() {
  const [, navigate] = useLocation();
  const { predictions } = usePredictions();

  const alerts = predictions
    .flatMap((p) =>
      p.alerts.map((msg, i) => {
        const severity = p.status === "Critical" ? "Critical" : p.status === "Warning" ? "High" : "Medium";
        return {
          machine: MACHINE_CONFIGS.find((c) => c.machineId === p.machineId)?.machineName ?? p.machineId,
          severity,
          description: msg,
          time: "Just now",
          id: `${p.machineId}-${severity}-${i}`,
          sortScore: p.status === "Critical" ? 3 : p.status === "Warning" ? 2 : 1
        };
      })
    )
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 4);

  return (
    <DashCard className="min-h-[360px] p-6">
      <DashCardHeader>
        <DashCardTitle>Priority Alerts</DashCardTitle>
        <Link href="/alerts" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </DashCardHeader>
      <div className="mt-5 space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => {
            const tone = alertTone[alert.severity] || alertTone.Medium;
            return (
              <motion.button
                key={alert.id}
                onClick={() => navigate("/alerts")}
                className="group grid w-full grid-cols-[58px_1fr_auto_20px] items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <span className={cn("grid h-[52px] w-[52px] place-items-center rounded-full", tone.circle)}>
                  <AlertTriangle className={cn("h-6 w-6", tone.icon)} fill="currentColor" fillOpacity={0.08} />
                </span>
                <span>
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="text-base font-extrabold text-slate-950">{alert.machine}</span>
                    <DashBadge tone={tone.badge}>{alert.severity as string}</DashBadge>
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-600">{alert.description}</span>
                </span>
                <span className="text-sm font-medium text-slate-500">{alert.time}</span>
                <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </motion.button>
            );
          })
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm font-medium text-slate-400">
            No active alerts
          </div>
        )}
      </div>
    </DashCard>
  );
}
