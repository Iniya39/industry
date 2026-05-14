import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap } from "lucide-react";
import { usePredictions } from "@/context/prediction-context";
import { MACHINE_CONFIGS, getSensorStatus, fmtSensor } from "@/lib/machine-config";
import { DashCard } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { cn } from "@/lib/utils";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const STATUS_DOT: Record<string, string> = {
  Good:     "bg-emerald-500",
  Warning:  "bg-amber-400",
  Critical: "bg-rose-500"
};

const STATUS_VALUE: Record<string, string> = {
  Good:     "text-slate-800",
  Warning:  "text-amber-600",
  Critical: "text-rose-600"
};

const BADGE_TONE: Record<string, "green" | "orange" | "red"> = {
  Good:     "green",
  Warning:  "orange",
  Critical: "red"
};

const RUL_COLOR = (rul: number) =>
  rul < 8 ? "text-rose-600" : rul < 15 ? "text-amber-600" : "text-emerald-700";

function LiveDot() {
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
    </span>
  );
}

function FlashValue({
  value,
  unit,
  statusClass,
}: {
  value: string;
  unit: string;
  statusClass: string;
}) {
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      <LiveDot />
      <motion.span
        key={value}
        initial={{ opacity: 0.5, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("text-xs font-extrabold tabular-nums", statusClass)}
      >
        {value}
        {unit && (
          <span className="ml-0.5 text-[10px] font-semibold text-slate-400">{unit}</span>
        )}
      </motion.span>
    </span>
  );
}

function MachineCard({ machineId }: { machineId: string }) {
  const { machines, predictions } = usePredictions();
  const cfg = MACHINE_CONFIGS.find((c) => c.machineId === machineId);
  const machineState = machines.find((m) => m.machineId === machineId);
  const pred = predictions.find((p) => p.machineId === machineId);

  if (!cfg || !machineState) return null;

  const overallStatus = pred?.status ?? "Good";
  const badgeTone = BADGE_TONE[overallStatus];

  return (
    <DashCard className="p-4 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cfg.area}</p>
          <h3 className="mt-0.5 text-sm font-extrabold text-slate-900 leading-tight">{cfg.machineName}</h3>
        </div>
        <DashBadge tone={badgeTone}>{overallStatus}</DashBadge>
      </div>

      <div className="flex-1 space-y-0.5 mb-3">
        {Object.entries(cfg.sensors).map(([key, meta]) => {
          const rawValue = machineState.sensors[key] ?? meta.nominal;
          const status = getSensorStatus(meta, rawValue);
          const formatted = fmtSensor(meta, rawValue);
          const valueStr = formatted.includes(" ") ? formatted.split(" ")[0] : formatted;

          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5",
                status === "Critical" ? "bg-rose-50" : status === "Warning" ? "bg-amber-50/70" : ""
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status])} />
                <span className="text-xs font-semibold text-slate-600 truncate">
                  {meta.label}
                  {meta.isCritical && (
                    <span className="ml-1.5 text-[9px] font-bold text-rose-500 uppercase tracking-wider">crit</span>
                  )}
                </span>
              </div>
              <FlashValue
                value={valueStr}
                unit={meta.unit}
                statusClass={STATUS_VALUE[status]}
              />
            </div>
          );
        })}
      </div>

      {pred && (
        <div className="border-t border-slate-100 pt-2.5 grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">RUL</p>
            <p className={cn("mt-0.5 text-sm font-extrabold", RUL_COLOR(pred.rul))}>
              {pred.rul} h
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Health</p>
            <p className={cn("mt-0.5 text-sm font-extrabold",
              pred.health < 55 ? "text-rose-600" : pred.health < 80 ? "text-amber-600" : "text-emerald-700"
            )}>
              {pred.health}/100
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Confidence</p>
            <p className={cn("mt-0.5 text-sm font-extrabold",
              pred.confidence > 75 ? "text-rose-600" : pred.confidence > 50 ? "text-amber-600" : "text-slate-600"
            )}>
              {pred.confidence}%
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {pred && pred.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 space-y-1"
          >
            {pred.alerts.slice(0, 2).map((alert) => (
              <div key={alert} className="flex items-start gap-1.5 rounded-md bg-rose-50 px-2 py-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" strokeWidth={2.5} />
                <span className="text-[10px] font-semibold leading-tight text-rose-700">{alert}</span>
              </div>
            ))}
            {pred.alerts.length > 2 && (
              <p className="text-[10px] font-bold text-slate-400 text-right pr-1">+{pred.alerts.length - 2} more</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {pred && pred.anomaly && pred.alerts.length === 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5">
          <Zap className="h-3 w-3 text-amber-500 shrink-0" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold text-amber-700">Model detected anomaly pattern</span>
        </div>
      )}
    </DashCard>
  );
}

export default function SensorsPage() {
  const { lastUpdated } = usePredictions();
  const timeStr = new Date(lastUpdated).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const processLine = MACHINE_CONFIGS.filter((c) => c.machineType !== "cooling");
  const cooling = MACHINE_CONFIGS.find((c) => c.machineType === "cooling");

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      <motion.div variants={fadeUp} className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">Live Sensor Feed</h1>
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-emerald-700">Live · {timeStr}</span>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {processLine.map((cfg) => (
          <motion.div key={cfg.machineId} variants={fadeUp}>
            <MachineCard machineId={cfg.machineId} />
          </motion.div>
        ))}
      </div>

      {cooling && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <motion.div variants={fadeUp}>
              <MachineCard machineId={cooling.machineId} />
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
