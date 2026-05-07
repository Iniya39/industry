"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/dashboard/search-field";
import { EmptyState } from "@/components/dashboard/empty-state";
import { alertTimeline, priorityAlerts, type Severity } from "@/data/dashboard-data";
import { notify } from "@/components/dashboard/toast-host";
import { cn } from "@/lib/utils";

const severityTone: Record<Severity, "red" | "orange"> = {
  Critical: "red",
  High: "orange",
  Medium: "orange"
};

const iconBg: Record<Severity, string> = {
  Critical: "bg-rose-50 text-rose-600",
  High: "bg-orange-50 text-orange-500",
  Medium: "bg-amber-50 text-amber-500"
};

export default function AlertsPage() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");

  const alerts = useMemo(() => {
    const merged = [
      ...priorityAlerts.map((alert) => ({ ...alert, title: alert.description })),
      ...alertTimeline.map((alert) => ({
        machine: alert.machine,
        severity: alert.severity,
        description: alert.title,
        time: alert.time,
        title: alert.title
      }))
    ];
    return merged.filter((alert) => {
      const matchesQuery = `${alert.machine} ${alert.description}`.toLowerCase().includes(query.toLowerCase());
      const matchesSeverity = severity === "All" || alert.severity === severity;
      return matchesQuery && matchesSeverity;
    });
  }, [query, severity]);

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="p-5 xl:col-span-2">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Alerts</CardTitle>
            <p className="mt-1 text-sm font-medium text-slate-500">Filter active anomalies, review severity, and track alert chronology.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:min-w-[620px]">
            <SearchField value={query} onChange={setQuery} placeholder="Search alerts..." />
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {["All", "Critical", "High", "Medium"].map((item) => (
                <button
                  key={item}
                  onClick={() => setSeverity(item)}
                  className={`h-12 rounded-2xl border px-4 text-sm font-bold transition ${
                    severity === item ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader className="mb-5">
          <CardTitle>All Alerts</CardTitle>
          <Button variant="outline" size="sm" onClick={() => notify("Alert filter applied", "Visible alerts reflect your current search and severity settings.")}>
            <Filter className="h-4 w-4" />
            Apply
          </Button>
        </CardHeader>
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.button
                key={`${alert.machine}-${alert.description}-${index}`}
                className="grid w-full grid-cols-[54px_1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <span className={cn("grid h-12 w-12 place-items-center rounded-full", iconBg[alert.severity])}>
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-950">{alert.machine}</span>
                    <Badge tone={severityTone[alert.severity]}>{alert.severity}</Badge>
                  </span>
                  <span className="mt-1 block text-sm font-medium text-slate-500">{alert.description}</span>
                </span>
                <span className="text-sm font-semibold text-slate-500">{alert.time}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <EmptyState title="No alerts found" description="Try another search term or remove the severity filter." />
        )}
      </Card>

      <Card className="p-5">
        <CardHeader className="mb-5">
          <CardTitle>Alert Timeline</CardTitle>
          <Clock3 className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <div className="space-y-0">
          {alertTimeline.map((event, index) => (
            <div key={`${event.time}-${event.title}`} className="grid grid-cols-[74px_20px_1fr] gap-3">
              <div className="pt-1 text-sm font-extrabold text-slate-500">{event.time}</div>
              <div className="relative flex justify-center">
                <span className={cn("mt-1 h-3 w-3 rounded-full", event.severity === "Critical" ? "bg-rose-600" : "bg-amber-500")} />
                {index < alertTimeline.length - 1 ? <span className="absolute top-5 h-full w-px bg-slate-200" /> : null}
              </div>
              <div className="pb-6">
                <p className="font-extrabold text-slate-950">{event.title}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{event.machine}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
