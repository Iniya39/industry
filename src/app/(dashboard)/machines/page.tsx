"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/dashboard/search-field";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HealthRing } from "@/components/dashboard/health-ring";
import { MiniTrend } from "@/components/dashboard/mini-trend";
import { machines, machineHealthRows, type MachineStatus } from "@/data/dashboard-data";
import { useRealtimeData, transformMachineToLegacyFormat } from "@/lib/real-time-data-provider";
import { notify } from "@/components/dashboard/toast-host";

const statusTone: Record<MachineStatus, "green" | "orange" | "red" | "slate"> = {
  Good: "green",
  Warning: "orange",
  Critical: "red",
  Moderate: "orange"
};

export default function MachinesPage() {
  const { machines: realtimeMachines } = useRealtimeData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);

  // Transform real-time machines to legacy format
  const legacyMachines = realtimeMachines.map(machine => transformMachineToLegacyFormat(machine));

  const filtered = useMemo(() => {
    return legacyMachines.filter((machine) => {
      const matchesQuery = `${machine.id} ${machine.name} ${machine.area}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "All" || machine.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, legacyMachines]);

  return (
    <div className="mt-7 space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Machines</CardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">Search assets, review health, and open machine-level diagnostics.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:min-w-[580px]">
            <SearchField value={query} onChange={setQuery} placeholder="Search machines..." />
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {["All", "Good", "Warning", "Critical"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`h-12 rounded-2xl border px-4 text-sm font-bold transition ${
                    status === item ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((machine) => (
            <motion.button
              key={machine.id}
              whileHover={{ y: -3 }}
              onClick={() => setSelected(machine)}
              className="rounded-[22px] text-left"
            >
              <Card className="h-full p-5 hover:border-blue-100 hover:shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-500">{machine.id}</p>
                    <h2 className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-slate-950">{machine.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{machine.area}</p>
                  </div>
                  <HealthRing value={machine.health} size={86} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">RUL</p>
                    <p className="mt-1 font-extrabold text-slate-950">{machine.rul}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">Load</p>
                    <p className="mt-1 font-extrabold text-slate-950">{machine.load}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="font-semibold text-slate-500">Vib.</p>
                    <p className="mt-1 font-extrabold text-slate-950">{machine.vibration}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Badge tone={statusTone[machine.status]}>{machine.status}</Badge>
                  <span className="text-xs font-bold text-slate-500">Owner: {machine.engineer}</span>
                </div>
              </Card>
            </motion.button>
          ))}
        </div>
      ) : (
        <EmptyState title="No machines found" description="Adjust the search or status filter to reveal matching assets." />
      )}

      <Card className="p-5">
        <CardHeader className="mb-5">
          <CardTitle>Machine Registry</CardTitle>
          <Button variant="outline" size="sm" onClick={() => notify("Filters synchronized", "Machine registry filters are up to date.")}>
            <SlidersHorizontal className="h-4 w-4" />
            Refine
          </Button>
        </CardHeader>
        <div className="overflow-x-auto scrollbar-none">
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
                <tr key={machine.id} className="font-semibold text-slate-800">
                  <td className="py-3">{machine.id}</td>
                  <td className="py-3">{machine.area}</td>
                  <td className="py-3">{machine.health}/100</td>
                  <td className="py-3"><Badge tone={statusTone[machine.status]}>{machine.status}</Badge></td>
                  <td className="py-3"><MiniTrend values={machineHealthRows[0].trend} color={machine.health >= 80 ? "#16A34A" : machine.health >= 60 ? "#F59E0B" : "#E11D48"} /></td>
                  <td className="py-3">{machine.engineer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selected ? (
          <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl" initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-blue-700">{selected.id}</p>
                  <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{selected.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{selected.area} • Owner {selected.engineer}</p>
                </div>
                <button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
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
              <Button className="mt-6 w-full" onClick={() => notify("Work order created", `${selected.id} diagnostics were added to maintenance queue.`)}>
                <Filter className="h-4 w-4" />
                Create Maintenance Work Order
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
