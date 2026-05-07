"use client";

import { CalendarCheck, Clock, UserRoundCheck, Wrench } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { engineers, maintenanceSchedule } from "@/data/dashboard-data";
import { notify } from "@/components/dashboard/toast-host";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MaintenancePage() {
  return (
    <div className="mt-7 space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { label: "Open Work Orders", value: "18", icon: Wrench },
          { label: "Scheduled Today", value: "4", icon: CalendarCheck },
          { label: "Avg. Response Time", value: "32m", icon: Clock }
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>Upcoming Maintenance</CardTitle>
            <Button size="sm" variant="outline" onClick={() => notify("Maintenance scheduled", "A new preventive maintenance slot is ready to assign.")}>
              Add Schedule
            </Button>
          </CardHeader>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs font-semibold text-slate-500">
                <tr>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Window</th>
                  <th className="pb-3">Machine</th>
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Engineer</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceSchedule.map((item) => (
                  <tr key={`${item.date}-${item.machine}`} className="font-semibold text-slate-800">
                    <td className="py-3">{item.date}</td>
                    <td className="py-3">{item.window}</td>
                    <td className="py-3">{item.machine}</td>
                    <td className="py-3">{item.type}</td>
                    <td className="py-3">{item.engineer}</td>
                    <td className="py-3"><Badge tone={item.status === "Scheduled" ? "green" : "blue"}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader className="mb-5">
            <CardTitle>Assigned Engineers</CardTitle>
            <UserRoundCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <div className="space-y-4">
            {engineers.map((engineer) => (
              <div key={engineer.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-950">{engineer.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{engineer.role}</p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-700">{engineer.load}%</span>
                </div>
                <Progress value={engineer.load} tone={engineer.load > 75 ? "orange" : "blue"} className="mt-3" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader className="mb-5">
          <CardTitle>Calendar View</CardTitle>
          <Badge tone="blue">May 2024</Badge>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day, index) => (
            <div key={day} className="min-h-[128px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-extrabold text-slate-950">{day}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">May {18 + index}</p>
              {index === 0 || index === 1 || index === 3 ? (
                <div className="mt-5 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">
                  {index === 0 ? "M03 Bearing" : index === 1 ? "M07 Thermal" : "M12 RUL"}
                </div>
              ) : (
                <p className="mt-5 text-xs font-semibold text-slate-400">No planned work</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
