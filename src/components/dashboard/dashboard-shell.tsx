"use client";

import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EquipmentHealth } from "@/components/dashboard/equipment-health";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { MachineHealthTable } from "@/components/dashboard/machine-health-table";
import { RulTrendChart } from "@/components/dashboard/rul-trend-chart";
import { FailurePredictions } from "@/components/dashboard/failure-predictions";
import { useAggregatedStats, transformMachineToLegacyFormat, transformPredictionToAlertFormat } from "@/lib/real-time-data-provider";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export function DashboardShell() {
  const { stats, machines, predictions, criticalAlerts, highPriorityAlerts } = useAggregatedStats();

  // Transform real-time data to legacy format for components
  const realtimeStatCards = [
    {
      title: "Anomalies Detected",
      value: stats.totalAnomalies.toString(),
      change: "Live monitoring",
      trend: "up" as const,
      accent: "blue" as const,
      series: Array.from({ length: 15 }, () => Math.random() * 30)
    },
    {
      title: "Average RUL (Hours)",
      value: `${stats.averageRUL.toFixed(1)} h`,
      change: "Real-time prediction",
      trend: "up" as const,
      accent: "green" as const,
      series: Array.from({ length: 15 }, () => Math.random() * 25 + 10)
    },
    {
      title: "Production Loss",
      value: `${((100 - stats.averageEfficiency).toFixed(1))}%`,
      change: "Live efficiency",
      trend: "down" as const,
      accent: "orange" as const,
      series: Array.from({ length: 15 }, () => Math.random() * 20 + 5)
    },
    {
      title: "Active Alerts",
      value: (stats.criticalAlertsCount + stats.highPriorityAlertsCount).toString(),
      change: "Real-time alerts",
      trend: "up" as const,
      accent: "red" as const,
      series: Array.from({ length: 15 }, () => Math.random() * 20 + 10)
    }
  ];

  const legacyMachines = machines.map(machine => 
    transformMachineToLegacyFormat(machine, predictions.find(p => p.machineId === machine.id))
  );

  const legacyAlerts = [...criticalAlerts, ...highPriorityAlerts].map(transformPredictionToAlertFormat);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07 } }
      }}
    >
        <motion.div
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          variants={fadeUp}
        >
          {realtimeStatCards.map((card: any) => (
            <StatsCard key={card.title} card={card} />
          ))}
        </motion.div>

        <motion.div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.42fr_1fr]" variants={fadeUp}>
          <EquipmentHealth machines={legacyMachines} />
          <PriorityAlerts alerts={legacyAlerts} />
        </motion.div>

        <motion.div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.38fr_1.48fr]" variants={fadeUp}>
          <MachineHealthTable machines={legacyMachines} />
          <RulTrendChart predictions={predictions} />
          <FailurePredictions predictions={predictions} />
        </motion.div>
    </motion.div>
  );
}
