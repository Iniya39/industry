import { useEffect, useRef, useState } from "react";
import {
  statCards as baseStatCards,
  machineHealthRows as baseMachineHealthRows,
  rulTrend as baseRulTrend,
  priorityAlerts as basePriorityAlerts,
  failurePredictions as baseFailurePredictions,
  healthMetrics as baseHealthMetrics,
  machines as baseMachines
} from "@/data/dashboard-data";

function jitter(value: number, range: number, min = 0, max = Infinity) {
  const delta = (Math.random() - 0.5) * 2 * range;
  return Math.min(max, Math.max(min, value + delta));
}

function jitterInt(value: number, range: number, min = 0, max = Infinity) {
  return Math.round(jitter(value, range, min, max));
}

function formatValue(original: string, delta: number): string {
  if (original.endsWith(" h")) return `${jitter(parseFloat(original), delta, 1).toFixed(1)} h`;
  if (original.endsWith("%")) return `${jitter(parseFloat(original), delta, 0.1, 99.9).toFixed(1)}%`;
  return String(jitterInt(parseInt(original, 10), delta, 0));
}

export function useLiveStatCards(interval = 4000) {
  const [cards, setCards] = useState(baseStatCards);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCards((prev) =>
        prev.map((card) => {
          const newSeries = [...card.series.slice(1), jitter(card.series[card.series.length - 1], 3, 0)];
          const newValue = formatValue(card.value, 1.2);
          return { ...card, series: newSeries, value: newValue };
        })
      );
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return cards;
}

export function useLiveMachineHealth(interval = 5000) {
  const [rows, setRows] = useState(baseMachineHealthRows);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((row) => {
          const scoreNum = parseInt(row.score, 10);
          const newScore = jitterInt(scoreNum, 1.5, 10, 100);
          const newTrend = [...row.trend.slice(1), jitter(row.trend[row.trend.length - 1], 2, 0)];
          return { ...row, score: `${newScore}/100`, trend: newTrend };
        })
      );
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return rows;
}

export function useLiveRulTrend(interval = 6000) {
  const lastHours = useRef(baseRulTrend[baseRulTrend.length - 1].hours);
  const [trend, setTrend] = useState(baseRulTrend);

  useEffect(() => {
    const id = window.setInterval(() => {
      const newHours = jitter(lastHours.current, 0.6, 1, 24);
      lastHours.current = newHours;
      setTrend((prev) => [...prev.slice(1), { date: prev[prev.length - 1].date, hours: parseFloat(newHours.toFixed(1)) }]);
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return trend;
}

export function useLiveHealthMetrics(interval = 3500) {
  const [metrics, setMetrics] = useState(baseHealthMetrics);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          if (m.label === "Vibration") {
            const v = jitter(parseFloat(m.value), 0.15, 0.5, 9).toFixed(1);
            const status = parseFloat(v) > 3.5 ? ("Warning" as const) : ("Good" as const);
            return { ...m, value: `${v} mm/s`, status };
          }
          if (m.label === "Temperature") {
            const v = jitterInt(parseInt(m.value), 1.5, 40, 120);
            const status = v > 85 ? ("Warning" as const) : ("Good" as const);
            return { ...m, value: `${v} C`, status };
          }
          if (m.label === "Pressure") {
            const v = jitter(parseFloat(m.value), 0.08, 0.5, 3).toFixed(1);
            return { ...m, value: `${v} bar` };
          }
          if (m.label === "Load") {
            const v = jitterInt(parseInt(m.value), 2, 20, 100);
            const status = v > 80 ? ("Warning" as const) : ("Moderate" as const);
            return { ...m, value: `${v} %`, status };
          }
          return m;
        })
      );
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return metrics;
}

export function useLiveFailurePredictions(interval = 8000) {
  const [predictions, setPredictions] = useState(baseFailurePredictions);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPredictions((prev) =>
        prev.map((p) => ({
          ...p,
          confidence: jitterInt(p.confidence, 1.5, 30, 99)
        }))
      );
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return predictions;
}

export function useLiveMachines(interval = 1000) {
  const [liveM, setLiveM] = useState(baseMachines);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveM((prev) =>
        prev.map((m) => {
          const health = jitterInt(m.health, 1, 5, 100);
          const status =
            health >= 80 ? ("Good" as const) :
            health >= 55 ? ("Warning" as const) :
            ("Critical" as const);
          const rul = `${jitter(parseFloat(m.rul), 0.5, 1).toFixed(0)} h`;
          const load = `${jitterInt(parseInt(m.load), 2, 10, 100)}%`;
          const vib = `${jitter(parseFloat(m.vibration), 0.15, 0.3).toFixed(1)} mm/s`;
          return { ...m, health, status, rul, load, vibration: vib };
        })
      );
    }, interval);
    return () => clearInterval(id);
  }, [interval]);

  return liveM;
}
