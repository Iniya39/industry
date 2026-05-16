"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  FileText,
  Gauge,
  Grid2X2,
  Settings,
  ShieldCheck,
  Wrench
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: Grid2X2, href: "/overview" },
  { label: "Machines", icon: Gauge, href: "/machines" },
  { label: "Sensors", icon: Cpu, href: "/sensors" },
  { label: "Alerts", icon: AlertTriangle, href: "/alerts" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Maintenance", icon: Wrench, href: "/maintenance" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Settings", icon: Settings, href: "/settings" }
];

function SidebarPanel({ onClose, mobile = false }: { onClose?: () => void; mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col bg-white/95 px-4 py-6 backdrop-blur", mobile ? "w-[292px]" : "w-[218px]")}>
      <Link
        href="/overview"
        onClick={onClose}
        className="flex h-[96px] items-center rounded-2xl px-1 transition hover:bg-slate-50"
        aria-label="CubeAI Solutions home"
      >
        <Image
          src="/assets/cubeai-logo.png"
          alt="CubeAI Solutions"
          width={320}
          height={96}
          priority
          className="h-[80px] w-[190px] object-contain object-left"
          sizes={mobile ? "192px" : "190px"}
        />
      </Link>

      <nav className="mt-9 space-y-2.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (pathname === "/" && item.href === "/overview");
          return (
            <motion.div key={item.label} whileHover={{ x: active ? 0 : 3 }}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex h-[52px] w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-[#1F2B78] to-[#263C95] text-white shadow-[0_14px_24px_rgba(37,57,146,0.22)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", active ? "text-white" : "text-slate-500 group-hover:text-blue-600")}
                  strokeWidth={2}
                />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-indigo-50/70 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-sm font-extrabold text-slate-800">System Status</span>
        </div>
        <div className="mt-8 flex items-start gap-2">
          <Activity className="mt-0.5 h-4 w-4 text-emerald-600" />
          <p className="text-[20px] font-semibold leading-snug text-emerald-700">All Systems Operational</p>
        </div>
        <p className="mt-8 text-xs font-medium leading-5 text-slate-500">
          Last updated
          <br />
          <span className="font-bold text-slate-700">10:30 AM, May 17</span>
        </p>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200/80 shadow-[8px_0_30px_rgba(15,23,42,0.03)] lg:block">
        <SidebarPanel />
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
              aria-label="Close navigation"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 overflow-y-auto shadow-2xl lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              <SidebarPanel mobile onClose={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
