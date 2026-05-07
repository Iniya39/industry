"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { priorityAlerts, type Severity } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";

const alertTone: Record<Severity, { badge: "red" | "orange"; circle: string; icon: string }> = {
  Critical: { badge: "red", circle: "bg-rose-50", icon: "text-rose-600" },
  High: { badge: "orange", circle: "bg-orange-50", icon: "text-orange-500" },
  Medium: { badge: "orange", circle: "bg-amber-50", icon: "text-amber-500" }
};

export function PriorityAlerts() {
  const router = useRouter();

  return (
    <Card className="min-h-[360px] p-6">
      <CardHeader>
        <CardTitle>Priority Alerts</CardTitle>
        <Link href="/alerts" className="text-sm font-bold text-blue-700 transition hover:text-blue-900">
          View all
        </Link>
      </CardHeader>
      <div className="mt-5 space-y-3">
        {priorityAlerts.map((alert, index) => {
          const tone = alertTone[alert.severity];
          return (
            <motion.button
              key={alert.machine}
              onClick={() => router.push("/alerts")}
              className="group grid w-full grid-cols-[58px_1fr_auto_20px] items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-card"
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
                  <Badge tone={tone.badge}>{alert.severity}</Badge>
                </span>
                <span className="mt-2 block text-sm font-medium text-slate-600">{alert.description}</span>
              </span>
              <span className="text-sm font-medium text-slate-500">{alert.time}</span>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}
