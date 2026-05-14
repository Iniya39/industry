import { Activity, AlertTriangle, BarChart3, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { Accent } from "@/data/dashboard-data";
import { DashCard } from "@/components/dashboard/card";
import { cn } from "@/lib/utils";

type StatCardModel = {
  title: string;
  value: string;
  change: string;
  trend: string;
  accent: Accent;
  series: number[];
};

const accentMap = {
  blue: {
    icon: Activity,
    iconBg: "bg-blue-50 text-blue-600",
    color: "#2563EB",
    gradient: "statBlue",
    delta: "text-blue-600"
  },
  green: {
    icon: Clock3,
    iconBg: "bg-emerald-50 text-emerald-600",
    color: "#16A34A",
    gradient: "statGreen",
    delta: "text-emerald-600"
  },
  orange: {
    icon: BarChart3,
    iconBg: "bg-orange-50 text-orange-500",
    color: "#F59E0B",
    gradient: "statOrange",
    delta: "text-orange-500"
  },
  red: {
    icon: AlertTriangle,
    iconBg: "bg-rose-50 text-rose-600",
    color: "#E11D48",
    gradient: "statRed",
    delta: "text-rose-600"
  }
};

export function StatsCard({ card }: { card: StatCardModel }) {
  const accent = accentMap[card.accent];
  const Icon = accent.icon;
  const TrendIcon = card.trend === "down" ? TrendingDown : TrendingUp;
  const chartData = card.series.map((value, index) => ({ index, value }));

  return (
    <motion.div whileHover={{ y: -3, scale: 1.006 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <DashCard className="h-[166px] overflow-hidden p-6">
        <div className="flex items-start gap-5">
          <div className={cn("grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full", accent.iconBg)}>
            <Icon className="h-8 w-8" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">{card.title}</p>
            <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em] text-slate-950">
              {card.value}
            </p>
            <div className={cn("mt-3 flex items-center gap-1 text-sm font-semibold", accent.delta)}>
              <TrendIcon className="h-4 w-4" />
              <span>{card.change}</span>
            </div>
          </div>
        </div>
        <div className="mt-1 h-[46px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={accent.gradient} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={accent.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={accent.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accent.color}
                strokeWidth={2.2}
                fill={`url(#${accent.gradient})`}
                dot={{ r: 1.8, fill: accent.color, strokeWidth: 0 }}
                activeDot={false}
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashCard>
    </motion.div>
  );
}
