"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleGauge, Droplet, Gauge, Thermometer, Vibrate } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { healthMetrics } from "@/data/dashboard-data";

const metricIcon = {
  Vibration: Vibrate,
  Temperature: Thermometer,
  Pressure: Gauge,
  Load: CircleGauge
};

interface EquipmentHealthProps {
  machines?: any[];
}

export function EquipmentHealth({ machines = [] }: EquipmentHealthProps) {
  // Calculate real-time health score from machines
  const score = machines.length > 0 
    ? Math.round(machines.reduce((sum, m) => sum + m.health, 0) / machines.length)
    : 78;

  // Get real-time metrics from first machine or use defaults
  const primaryMachine = machines[0];
  const realtimeMetrics = primaryMachine ? [
    { label: "Vibration", value: primaryMachine.vibration || "2.1 mm/s", status: primaryMachine.health > 70 ? "Good" : "Warning" },
    { label: "Temperature", value: `${Math.round((primaryMachine.latestReading?.temperature || 65))}°C`, status: primaryMachine.health > 70 ? "Good" : "Warning" },
    { label: "Pressure", value: `${(primaryMachine.latestReading?.pressure || 1.2).toFixed(1)} bar`, status: primaryMachine.health > 70 ? "Good" : "Warning" },
    { label: "Load", value: primaryMachine.load || "65%", status: primaryMachine.load && parseInt(primaryMachine.load) > 80 ? "Warning" : "Good" }
  ] : healthMetrics;
  const circumference = 2 * Math.PI * 43;

  return (
    <Card className="min-h-[360px] p-6">
      <CardHeader>
        <CardTitle>Equipment Health Snapshot</CardTitle>
      </CardHeader>
      <div className="mt-4 grid items-center gap-6 lg:grid-cols-[1.15fr_0.9fr]">
        <motion.div
          className="relative mx-auto flex h-[210px] w-full max-w-[493px] items-center justify-center overflow-visible sm:h-[246px]"
          whileHover={{ y: -4, scale: 1.012 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <div className="absolute inset-x-10 bottom-4 h-8 rounded-[50%] bg-slate-900/10 blur-xl" />
          <Image
            src="/assets/machine.png"
            alt="Industrial Machine"
            width={583}
            height={307}
            priority
            className="relative z-10 h-auto w-full object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.12)]"
            sizes="(max-width: 768px) 88vw, (max-width: 1280px) 43vw, 493px"
          />
        </motion.div>
        <div className="space-y-5">
          <div className="flex items-center gap-6">
            <div className="relative h-[112px] w-[112px] shrink-0">
              <svg className="-rotate-90" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="43" fill="none" stroke="#E5E7EB" strokeWidth="9" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r="43"
                  fill="none"
                  stroke="#22A85B"
                  strokeLinecap="round"
                  strokeWidth="9"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  strokeDasharray={circumference}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-[27px] font-extrabold tracking-[-0.04em] text-slate-950">{score}</div>
                  <div className="-mt-1 text-xs font-semibold text-slate-500">/100</div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Overall Health Score</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-[22px] font-semibold text-emerald-700">Good</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {realtimeMetrics.map((metric) => {
              const Icon = metricIcon[metric.label as keyof typeof metricIcon] || Droplet;
              return (
                <div key={metric.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-5 text-sm">
                  <div className="flex items-center gap-3 font-semibold text-slate-700">
                    <Icon className="h-4 w-4 text-blue-600" />
                    {metric.label}
                  </div>
                  <span className="font-bold text-slate-800">{metric.value}</span>
                  <Badge tone={metric.status === "Good" ? "green" : "orange"} className="min-w-[74px] justify-center">
                    {metric.status}
                  </Badge>
                </div>
              );
            })}
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 min-w-[206px] rounded-xl text-blue-700"
          >
            <Link href="/machines">
              View Machine Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
