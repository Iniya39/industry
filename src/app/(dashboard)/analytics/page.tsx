"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, Gauge, TrendingUp, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { performanceTrend, rulTrend, statCards } from "@/data/dashboard-data";

const metricCards = [
  { label: "Model Accuracy", value: "94.2%", icon: Gauge },
  { label: "Predicted Savings", value: "₹18.4L", icon: TrendingUp },
  { label: "Energy Index", value: "82", icon: Zap },
  { label: "Failure Events", value: "21", icon: Activity }
];

export default function AnalyticsPage() {
  return (
    <div className="mt-7 space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">{item.label}</p>
                <p className="mt-3 text-[34px] font-extrabold tracking-[-0.04em] text-slate-950">{item.value}</p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-600">
                <item.icon className="h-7 w-7" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>Predictive Performance Trends</CardTitle>
            <Badge tone="blue">Interactive</Badge>
          </CardHeader>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 18px 45px rgba(15,23,42,0.08)" }} />
                <Line type="monotone" dataKey="availability" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>Failure Trend</CardTitle>
            <Badge tone="red">Live</Badge>
          </CardHeader>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB" }} />
                <Bar dataKey="failures" fill="#E11D48" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>RUL Forecast Area</CardTitle>
            <Badge tone="green">Daily</Badge>
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rulTrend} margin={{ top: 10, right: 15, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="analyticsRul" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E5E7EB" }} />
                <Area type="monotone" dataKey="hours" stroke="#2563EB" strokeWidth={3} fill="url(#analyticsRul)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>AI Signal Contribution</CardTitle>
            <Badge tone="blue">Model</Badge>
          </CardHeader>
          <div className="grid gap-4">
            {statCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-700">{card.title}</span>
                  <span className="text-slate-950">{card.value}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${55 + card.series[0]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
