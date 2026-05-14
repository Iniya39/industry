import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, ChevronDown, MapPin, Menu, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectControl } from "@/components/dashboard/select-control";

const avatarSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23f3d8c4'/%3E%3Ccircle cx='48' cy='38' r='18' fill='%232f1f1b'/%3E%3Cpath d='M24 90c5-21 16-32 24-32s19 11 24 32' fill='%231e293b'/%3E%3Ccircle cx='39' cy='43' r='3' fill='%23111827'/%3E%3Ccircle cx='57' cy='43' r='3' fill='%23111827'/%3E%3Cpath d='M40 56c6 4 11 4 17 0' stroke='%23111827' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E";

const notifications = [
  { title: "Machine 03 critical", body: "High vibration exceeded learned threshold" },
  { title: "RUL warning", body: "Machine 12 projected below target in 24h" },
  { title: "Report ready", body: "Weekly maintenance report exported" }
];

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-start gap-3 xl:max-w-[460px]">
        <button
          className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 sm:text-[32px]">
            AI Predictive Maintenance
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
            Predict failures. Prevent downtime. Maximize performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:flex xl:flex-nowrap xl:justify-end xl:gap-3">
        <SelectControl icon={MapPin} value="Plant A" options={["Plant A", "Plant B", "Plant C"]} />
        <SelectControl icon={Package} value="All Machines" options={["All Machines", "Machine 03", "Machine 07"]} />
        <button className="flex h-14 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 sm:min-w-[228px]">
          <CalendarDays className="h-5 w-5 text-slate-600" />
          May 11 - May 17, 2024
        </button>
        <div className="hidden h-10 w-px bg-slate-200 xl:block" />
        <div className="relative">
          <button
            className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-blue-600 hover:ring-blue-200"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
              3
            </span>
          </button>
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 top-14 z-30 w-[310px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="px-2 pb-2 text-sm font-extrabold text-slate-950">Notifications</div>
                <div className="space-y-2">
                  {notifications.map((item) => (
                    <button key={item.title} className="w-full rounded-xl p-3 text-left transition hover:bg-slate-50">
                      <span className="block text-sm font-bold text-slate-900">{item.title}</span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">{item.body}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <button className="flex min-w-0 items-center gap-3 rounded-2xl bg-transparent py-1 pl-1 pr-2 transition hover:bg-white hover:shadow-sm sm:min-w-[185px]">
          <Avatar>
            <AvatarImage src={avatarSvg} alt="Arjun Mehta" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-extrabold text-slate-950">Arjun Mehta</span>
            <span className="block truncate text-xs font-medium text-slate-500">Plant Manager</span>
          </span>
          <ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
