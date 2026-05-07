"use client";

import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EquipmentHealth } from "@/components/dashboard/equipment-health";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { MachineHealthTable } from "@/components/dashboard/machine-health-table";
import { RulTrendChart } from "@/components/dashboard/rul-trend-chart";
import { FailurePredictions } from "@/components/dashboard/failure-predictions";
import { statCards } from "@/data/dashboard-data";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export function DashboardShell() {
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
          {statCards.map((card) => (
            <StatsCard key={card.title} card={card} />
          ))}
        </motion.div>

        <motion.div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.42fr_1fr]" variants={fadeUp}>
          <EquipmentHealth />
          <PriorityAlerts />
        </motion.div>

        <motion.div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.38fr_1.48fr]" variants={fadeUp}>
          <MachineHealthTable />
          <RulTrendChart />
          <FailurePredictions />
        </motion.div>
    </motion.div>
  );
}
