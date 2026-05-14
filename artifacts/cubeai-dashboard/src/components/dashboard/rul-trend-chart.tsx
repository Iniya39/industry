import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";

type DataPoint = { date: string; hours: number };

export function RulTrendChart({ data }: { data: DataPoint[] }) {
  return (
    <DashCard className="min-h-[286px] p-4">
      <DashCardHeader>
        <DashCardTitle className="text-base">RUL Trend (Average)</DashCardTitle>
        <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
          Daily
          <ChevronDown className="h-4 w-4" />
        </button>
      </DashCardHeader>
      <div className="mt-3 h-[218px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 16, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="rulFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 24]}
              ticks={[0, 6, 12, 18, 24]}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
              label={{
                value: "Hours",
                position: "insideTopLeft",
                offset: -5,
                fill: "#64748B",
                fontSize: 12,
                fontWeight: 600
              }}
            />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                    <div className="text-xs font-extrabold text-slate-800">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">{payload[0].value} h</div>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#2563EB"
              strokeWidth={2.4}
              fill="url(#rulFill)"
              dot={{ r: 4, fill: "#2563EB", stroke: "#EFF6FF", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#2563EB", stroke: "#DBEAFE", strokeWidth: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}
