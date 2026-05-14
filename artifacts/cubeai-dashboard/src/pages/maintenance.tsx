import { CalendarCheck, Clock, UserRoundCheck, Wrench } from "lucide-react";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { CustomProgress } from "@/components/dashboard/custom-progress";
import { engineers, maintenanceSchedule } from "@/data/dashboard-data";
import { notify } from "@/components/dashboard/toast-host";

export default function MaintenancePage() {
  return (
    <div className="mt-7 space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          { label: "Open Work Orders", value: "18", icon: Wrench },
          { label: "Scheduled Today", value: "4", icon: CalendarCheck },
          { label: "Avg. Response Time", value: "32m", icon: Clock }
        ].map((item) => (
          <DashCard key={item.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">{item.label}</p>
                <p className="mt-3 text-[34px] font-extrabold tracking-[-0.04em] text-slate-950">{item.value}</p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-600">
                <item.icon className="h-7 w-7" />
              </div>
            </div>
          </DashCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <DashCard className="p-5">
          <DashCardHeader className="mb-5">
            <DashCardTitle>Upcoming Maintenance</DashCardTitle>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => notify("Maintenance scheduled", "A new preventive maintenance slot is ready to assign.")}
            >
              Add Schedule
            </button>
          </DashCardHeader>
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
                    <td className="py-3">
                      <DashBadge tone={item.status === "Scheduled" ? "green" : "blue"}>{item.status}</DashBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashCard>

        <DashCard className="p-5">
          <DashCardHeader className="mb-5">
            <DashCardTitle>Assigned Engineers</DashCardTitle>
            <UserRoundCheck className="h-5 w-5 text-blue-600" />
          </DashCardHeader>
          <div className="space-y-4">
            {engineers.map((engineer) => (
              <div key={engineer.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900">{engineer.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{engineer.role}</p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-700">{engineer.load}%</span>
                </div>
                <CustomProgress
                  value={engineer.load}
                  tone={engineer.load > 75 ? "orange" : "blue"}
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </DashCard>
      </div>
    </div>
  );
}
