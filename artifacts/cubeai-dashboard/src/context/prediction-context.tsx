import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { MACHINE_CONFIGS } from "@/lib/machine-config";

export interface MachineSensorState {
  machineId: string;
  machineName: string;
  area: string;
  machineType: string;
  sensors: Record<string, number>;
}

export interface MachinePrediction {
  machineId: string;
  machineType: string;
  rul: number;
  health: number;
  status: "Good" | "Warning" | "Critical";
  productionLoss: number;
  anomaly: boolean;
  confidence: number;
  degradation: number;
  alerts: string[];
}

export interface PredictionAggregates {
  anomalyCount: number;
  avgRul: number;
  totalAlerts: number;
  avgProductionLoss: number;
}

interface HistoryEntry {
  anomalyCount: number;
  avgRul: number;
  totalAlerts: number;
  avgProductionLoss: number;
}

interface PredictionContextValue {
  machines: MachineSensorState[];
  predictions: MachinePrediction[];
  aggregates: PredictionAggregates;
  history: HistoryEntry[];
  lastUpdated: number;
}

function buildInitialMachines(): MachineSensorState[] {
  return MACHINE_CONFIGS.map((cfg) => ({
    machineId: cfg.machineId,
    machineName: cfg.machineName,
    area: cfg.area,
    machineType: cfg.machineType,
    sensors: { ...cfg.initial }
  }));
}

function applyJitter(state: MachineSensorState): MachineSensorState {
  const cfg = MACHINE_CONFIGS.find((c) => c.machineId === state.machineId);
  if (!cfg) return state;

  const next: Record<string, number> = {};
  for (const [key, meta] of Object.entries(cfg.sensors)) {
    const cur = state.sensors[key] ?? meta.nominal;
    const delta = (Math.random() - 0.5) * 2 * meta.jitter;
    const raw = cur + delta;
    const clamped = Math.min(meta.max, Math.max(meta.min, raw));
    const dec = meta.dec ?? 1;
    next[key] = dec === 0 ? Math.round(clamped) : parseFloat(clamped.toFixed(dec));
  }
  return { ...state, sensors: next };
}

const INITIAL_AGGREGATES: PredictionAggregates = {
  anomalyCount: 2,
  avgRul: 18.5,
  totalAlerts: 4,
  avgProductionLoss: 3.8
};

const HISTORY_LEN = 15;

const PredictionContext = createContext<PredictionContextValue>({
  machines: buildInitialMachines(),
  predictions: [],
  aggregates: INITIAL_AGGREGATES,
  history: [],
  lastUpdated: Date.now()
});

export function PredictionProvider({ children }: { children: React.ReactNode }) {
  const [machines, setMachines] = useState<MachineSensorState[]>(buildInitialMachines);
  const [predictions, setPredictions] = useState<MachinePrediction[]>([]);
  const [aggregates, setAggregates] = useState<PredictionAggregates>(INITIAL_AGGREGATES);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const machinesRef = useRef(machines);
  machinesRef.current = machines;
  const pendingRef = useRef(false);

  const runPrediction = useCallback(async (current: MachineSensorState[]) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machines: current.map((m) => ({
            machineId: m.machineId,
            machineType: m.machineType,
            sensors: m.sensors
          }))
        })
      });
      if (!res.ok) return;
      const data = await res.json() as {
        predictions: MachinePrediction[];
        aggregates: PredictionAggregates;
      };
      setPredictions(data.predictions);
      setAggregates(data.aggregates);
      setHistory((prev) => {
        const entry: HistoryEntry = {
          anomalyCount:      data.aggregates.anomalyCount,
          avgRul:            data.aggregates.avgRul,
          totalAlerts:       data.aggregates.totalAlerts,
          avgProductionLoss: data.aggregates.avgProductionLoss
        };
        return [...prev.slice(-(HISTORY_LEN - 1)), entry];
      });
      setLastUpdated(Date.now());
    } catch {
    } finally {
      pendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    runPrediction(machinesRef.current);
  }, [runPrediction]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMachines((prev) => {
        const next = prev.map(applyJitter);
        runPrediction(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [runPrediction]);

  return (
    <PredictionContext.Provider value={{ machines, predictions, aggregates, history, lastUpdated }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePredictions() {
  return useContext(PredictionContext);
}
