import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/stats-card";
import { EquipmentHealth } from "@/components/dashboard/equipment-health";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { MachineHealthTable } from "@/components/dashboard/machine-health-table";
import { RulTrendChart } from "@/components/dashboard/rul-trend-chart";
import { FailurePredictions } from "@/components/dashboard/failure-predictions";
import { usePredictions } from "@/context/prediction-context";
import type { Accent, MachineStatus } from "@/data/dashboard-data";
import { MACHINE_CONFIGS } from "@/lib/machine-config";

function machineDisplayName(machineId: string): string {
  return MACHINE_CONFIGS.find((c) => c.machineId === machineId)?.machineName ?? machineId;
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const SPARKLINE_LEN = 15;

function buildSparkline(history: number[], current: number, len = SPARKLINE_LEN): number[] {
  const all = [...history, current];
  return all.length >= len ? all.slice(-len) : [
    ...Array(len - all.length).fill(all[0] ?? current),
    ...all
  ];
}

function formatChange(prev: number | undefined, curr: number, unit = ""): { label: string; trend: string } {
  if (prev === undefined) return { label: `vs last update`, trend: "up" };
  const delta = curr - prev;
  const pct = prev !== 0 ? Math.abs((delta / prev) * 100).toFixed(0) : "0";
  return {
    label: `${pct}% vs last update`,
    trend: delta >= 0 ? "up" : "down"
  };
}

function anomalyTone(count: number): Accent {
  return count > 3 ? "red" : count > 1 ? "orange" : "blue";
}

function rulTone(rul: number): Accent {
  return rul < 10 ? "red" : rul < 18 ? "orange" : "green";
}

function failureTone(conf: number): Accent {
  return conf > 75 ? "red" : conf > 50 ? "orange" : "green";
}

function etaFromRul(rul: number): string {
  if (rul < 4) return "< 4 Hours";
  if (rul < 8) return `${Math.round(rul)} Hours`;
  if (rul < 20) return `${Math.round(rul)} Hours`;
  return `${Math.round(rul)} Hours`;
}

function codeFromMachineId(id: string, i: number): string {
  const codes = ["ML-13", "ML-07", "ML-11", "ML-02", "ML-05", "ML-09"];
  return codes[i % codes.length];
}

const TREND_LEN = 20;

export default function OverviewPage() {
  const { aggregates, predictions, history } = usePredictions();

  const rulTrend = (() => {
    const now = Date.now();
    const pts = history.map((h, i) => ({
      date: new Date(now - (history.length - 1 - i) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      hours: h.avgRul
    }));
    if (pts.length === 0) return [{ date: "--", hours: aggregates.avgRul }];
    if (pts.length < TREND_LEN) {
      const pad = Array(TREND_LEN - pts.length).fill({ date: pts[0].date, hours: pts[0].hours });
      return [...pad, ...pts];
    }
    return pts.slice(-TREND_LEN);
  })();

  const anomalyHist   = useRef<number[]>([]);
  const rulHist       = useRef<number[]>([]);
  const lossHist      = useRef<number[]>([]);
  const alertHist     = useRef<number[]>([]);
  const healthHist    = useRef<Map<string, number[]>>(new Map());

  const [prevAgg, setPrevAgg] = useState<typeof aggregates | null>(null);

  useEffect(() => {
    if (history.length === 0) return;
    anomalyHist.current = history.map((h) => h.anomalyCount);
    rulHist.current     = history.map((h) => h.avgRul);
    lossHist.current    = history.map((h) => h.avgProductionLoss);
    alertHist.current   = history.map((h) => h.totalAlerts);
    setPrevAgg(history.length > 1 ? { ...history[history.length - 2], anomalyCount: history[history.length - 2].anomalyCount, avgRul: history[history.length - 2].avgRul, totalAlerts: history[history.length - 2].totalAlerts, avgProductionLoss: history[history.length - 2].avgProductionLoss } : null);
  }, [history]);

  useEffect(() => {
    predictions.forEach((p) => {
      const prev = healthHist.current.get(p.machineId) ?? [];
      healthHist.current.set(p.machineId, [...prev.slice(-5), p.health]);
    });
  }, [predictions]);

  const anom = formatChange(prevAgg?.anomalyCount, aggregates.anomalyCount);
  const rul  = formatChange(prevAgg?.avgRul, aggregates.avgRul);
  const loss = formatChange(prevAgg?.avgProductionLoss, aggregates.avgProductionLoss);
  const alrt = formatChange(prevAgg?.totalAlerts, aggregates.totalAlerts);

  const statCards = [
    {
      title: "Anomalies Detected",
      value: String(aggregates.anomalyCount),
      change: anom.label,
      trend: anom.trend,
      accent: anomalyTone(aggregates.anomalyCount),
      series: buildSparkline(anomalyHist.current, aggregates.anomalyCount)
    },
    {
      title: "Average RUL (Hours)",
      value: `${aggregates.avgRul.toFixed(1)} h`,
      change: rul.label,
      trend: rul.trend,
      accent: rulTone(aggregates.avgRul),
      series: buildSparkline(rulHist.current, aggregates.avgRul)
    },
    {
      title: "Production Loss",
      value: `${aggregates.avgProductionLoss.toFixed(1)}%`,
      change: loss.label,
      trend: loss.trend === "up" ? "down" : "up",
      accent: "orange" as Accent,
      series: buildSparkline(lossHist.current, aggregates.avgProductionLoss)
    },
    {
      title: "Alerts Generated",
      value: String(aggregates.totalAlerts),
      change: alrt.label,
      trend: alrt.trend,
      accent: "red" as Accent,
      series: buildSparkline(alertHist.current, aggregates.totalAlerts)
    }
  ];

  const machineHealthRows = predictions.map((p) => {
    const trendData = healthHist.current.get(p.machineId) ?? [p.health];
    const trend = trendData.length < 6
      ? [...Array(6 - trendData.length).fill(trendData[0]), ...trendData]
      : trendData.slice(-6);
    return {
      id: machineDisplayName(p.machineId),
      score: `${p.health}/100`,
      status: p.status as MachineStatus,
      trend
    };
  });

  const failurePredictions = predictions
    .filter((p) => p.confidence > 40)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
    .map((p, i) => ({
      time: new Date(Date.now() - i * 3 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      machine: machineDisplayName(p.machineId),
      code: codeFromMachineId(p.machineId, i),
      eta: etaFromRul(p.rul),
      confidence: p.confidence,
      tone: failureTone(p.confidence)
    }));

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      <motion.div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" variants={fadeUp}>
        {statCards.map((card) => (
          <StatsCard key={card.title} card={card} />
        ))}
      </motion.div>

      <motion.div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.42fr_1fr]" variants={fadeUp}>
        <EquipmentHealth />
        <PriorityAlerts />
      </motion.div>

      <motion.div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.38fr_1.48fr]" variants={fadeUp}>
        <MachineHealthTable rows={machineHealthRows.length > 0 ? machineHealthRows : []} />
        <RulTrendChart data={rulTrend} />
        <FailurePredictions predictions={failurePredictions.length > 0 ? failurePredictions : []} />
      </motion.div>
    </motion.div>
  );
}
