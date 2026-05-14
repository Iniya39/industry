import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { SearchField } from "@/components/dashboard/search-field";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HealthRing } from "@/components/dashboard/health-ring";
import { MiniTrend } from "@/components/dashboard/mini-trend";
import { type MachineStatus } from "@/data/dashboard-data";
import { usePredictions } from "@/context/prediction-context";
import { MACHINE_CONFIGS } from "@/lib/machine-config";
import { notify } from "@/components/dashboard/toast-host";

const statusTone: Record<MachineStatus, "green" | "orange" | "red" | "slate"> = {
  Good: "green",
  Warning: "orange",
  Critical: "red",
  Moderate: "orange"
};

const ENGINEER_MAP: Record<string, string> = {
  "Machine 01":     "Priya Shah",
  "Machine 02":     "Rohan Iyer",
  "Machine 03":     "Neha Rao",
  "Machine 14":     "Sara Khan",
  "Machine 07":     "Karan Gill",
  "Machine 12":     "Arjun Mehta",
  "Cooling System": "Priya Shah"
};

const LOAD_KEY: Record<string, string> = {
  hydrapulper:     "motor_current_a",
  digester:        "steam_flow_kghr",
  pressure_screen: "motor_current_a",
  paper_machine:   "web_tension_n",
  dryer:           "condensate_level_pct",
  calender:        "load_tons",
  cooling:         "pump_current_a"
};

function getVibration(sensors: Record<string, number>): string {
  const v = sensors["vibration_mms"];
  return v !== undefined ? `${v.toFixed(1)} mm/s` : "—";
}

function getLoad(machineType: string, sensors: Record<string, number>): string {
  const key = LOAD_KEY[machineType];
  if (!key) return "—";
  const val = sensors[key];
  if (val === undefined) return "—";
  const cfg = MACHINE_CONFIGS.find((c) => c.machineType === machineType);
  const meta = cfg?.sensors[key];
  if (!meta) return `${Math.round(val)}`;
  const pct = Math.round(((val - meta.min) / (meta.max - meta.min)) * 100);
  return `${Math.min(100, Math.max(1, pct))}%`;
}

const TREND_LEN = 6;

export default function MachinesPage() {
  const { predictions, machines: sensorStates } = usePredictions();
  const [query, setQuery]   = useState("");
  const [status, setStatus] = useState("All");

  const healthHistRef = useRef<Map<string, number[]>>(new Map());

  const machines = useMemo(() => {
    return MACHINE_CONFIGS
      .filter((cfg) => cfg.machineType !== "cooling")
      .map((cfg) => {
        const pred   = predictions.find((p) => p.machineId === cfg.machineId);
        const sensor = sensorStates.find((s) => s.machineId === cfg.machineId);

        const health = pred?.health ?? 75;
        const machineStatus: MachineStatus =
          health >= 80 ? "Good" : health >= 55 ? "Warning" : "Critical";
        const rul = pred ? `${pred.rul.toFixed(0)} h` : "—";

        const prev = healthHistRef.current.get(cfg.machineId) ?? [];
        const next = [...prev.slice(-(TREND_LEN - 1)), health];
        healthHistRef.current.set(cfg.machineId, next);
        const trend = next.length < TREND_LEN
          ? [...Array(TREND_LEN - next.length).fill(next[0] ?? health), ...next]
          : next;

        return {
          id:        cfg.machineId,
          name:      cfg.machineName,
          area:      cfg.area,
          health,
          status:    machineStatus,
          rul,
          load:      sensor ? getLoad(cfg.machineType, sensor.sensors) : "—",
          vibration: sensor ? getVibration(sensor.sensors) : "—",
          engineer:  ENGINEER_MAP[cfg.machineId] ?? "—",
          trend
        };
      });
  }, [predictions, sensorStates]);

  type Machine = typeof machines[0];
  const [selected, setSelected] = useState<Machine | null>(null);

  const filtered = useMemo(() => {
    return machines.filter((m) => {
      const matchesQuery  = `${m.name} ${m.area}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "All" || m.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, machines]);

  return (
    <div className="mt-7 space-y-5">
      <DashCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <DashCardTitle>Machines</DashCardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">Search assets, review health, and open machine-level diagnostics.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:min-w-[580px]">
            <SearchField value={query} onChange={setQuery} placeholder="Search machines..." />
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {["All", "Good", "Warning", "Critical"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`h-12 rounded-2xl border px-4 text-sm font-bold transition ${
                    status === item
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashCard>

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((machine) => (
            <motion.button
              key={machine.id}
              whileHover={{ y: -3 }}
              onClick={() => setSelected(machine)}
              className="rounded-[22px] text-left"
            >
              <DashCard className="h-full p-5 hover:border-blue-100 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-[-0.02em] text-slate-950">{machine.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{machine.area}</p>
                  </div>
                  <HealthRing value={machine.health} size={86} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">RUL</p>
                    <motion.p
                      key={machine.rul}
                      initial={{ color: "#2563EB" }}
                      animate={{ color: "#0f172a" }}
                      transition={{ duration: 0.8 }}
                      className="mt-1 font-extrabold"
                    >
                      {machine.rul}
                    </motion.p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">Load</p>
                    <motion.p
                      key={machine.load}
                      initial={{ color: "#2563EB" }}
                      animate={{ color: "#0f172a" }}
                      transition={{ duration: 0.8 }}
                      className="mt-1 font-extrabold"
                    >
                      {machine.load}
                    </motion.p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">Vib.</p>
                    <motion.p
                      key={machine.vibration}
                      initial={{ color: "#2563EB" }}
                      animate={{ color: "#0f172a" }}
                      transition={{ duration: 0.8 }}
                      className="mt-1 font-extrabold"
                    >
                      {machine.vibration}
                    </motion.p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <DashBadge tone={statusTone[machine.status]}>{machine.status}</DashBadge>
                  <span className="text-xs font-bold text-slate-500">Owner: {machine.engineer}</span>
                </div>
              </DashCard>
            </motion.button>
          ))}
        </div>
      ) : (
        <EmptyState title="No machines found" description="Adjust the search or status filter to reveal matching assets." />
      )}

      <DashCard className="p-5">
        <DashCardHeader className="mb-5">
          <DashCardTitle>Machine Registry</DashCardTitle>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => notify("Filters synchronized", "Machine registry filters are up to date.")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Refine
          </button>
        </DashCardHeader>
        <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs font-semibold text-slate-500">
              <tr>
                <th className="pb-3">Machine</th>
                <th className="pb-3">Area</th>
                <th className="pb-3">Health</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Trend</th>
                <th className="pb-3">Engineer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((machine) => (
                <tr key={machine.name} className="font-semibold text-slate-800">
                  <td className="py-3">{machine.name}</td>
                  <td className="py-3">{machine.area}</td>
                  <td className="py-3">
                    <motion.span
                      key={machine.health}
                      initial={{ color: "#2563EB" }}
                      animate={{ color: "#1e293b" }}
                      transition={{ duration: 0.8 }}
                    >
                      {machine.health}/100
                    </motion.span>
                  </td>
                  <td className="py-3">
                    <DashBadge tone={statusTone[machine.status]}>{machine.status}</DashBadge>
                  </td>
                  <td className="py-3">
                    <MiniTrend
                      values={machine.trend}
                      color={machine.health >= 80 ? "#16A34A" : machine.health >= 55 ? "#F59E0B" : "#E11D48"}
                    />
                  </td>
                  <td className="py-3">{machine.engineer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashCard>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl"
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{selected.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selected.area} • Owner {selected.engineer}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-[130px_1fr]">
                <HealthRing value={selected.health} size={126} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Health", `${selected.health}/100`],
                    ["RUL", selected.rul],
                    ["Load", selected.load],
                    ["Vibration", selected.vibration]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
                      <p className="mt-2 text-lg font-extrabold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <DashBadge tone={statusTone[selected.status]} className="text-sm px-3 py-1">{selected.status}</DashBadge>
                <span className="text-sm font-semibold text-slate-500">Machine Status</span>
              </div>
              <button
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => notify("Work order created", `${selected.name} diagnostics were added to maintenance queue.`)}
              >
                <Filter className="h-4 w-4" />
                Create Maintenance Work Order
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
