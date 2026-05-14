import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, CircleGauge, Gauge, Thermometer, Vibrate } from "lucide-react";
import { DashCard, DashCardHeader, DashCardTitle } from "@/components/dashboard/card";
import { DashBadge } from "@/components/dashboard/badge";
import { usePredictions } from "@/context/prediction-context";
import { MACHINE_CONFIGS, getSensorStatus, fmtSensor } from "@/lib/machine-config";
import type { SensorStatus } from "@/lib/machine-config";

const METRIC_KEYS: Record<string, { vib?: string; temp?: string; pres?: string; load?: string }> = {
  hydrapulper:     { vib: "vibration_mms", temp: "temperature_c",     pres: undefined,                   load: "motor_current_a"      },
  digester:        { vib: undefined,       temp: "bottom_temp_c",     pres: "pressure_bar",              load: "steam_flow_kghr"      },
  pressure_screen: { vib: "vibration_mms", temp: undefined,           pres: "differential_pressure_bar", load: "motor_current_a"      },
  paper_machine:   { vib: "vibration_mms", temp: "temperature_c",     pres: "headbox_pressure_bar",      load: "web_tension_n"        },
  dryer:           { vib: "vibration_mms", temp: "cyl1_temp_c",       pres: "steam_pressure_bar",        load: "condensate_level_pct" },
  calender:        { vib: "vibration_mms", temp: "roll_temp_c",       pres: "nip_pressure_knpm",         load: "load_tons"            },
  cooling:         { vib: undefined,       temp: "coolant_in_temp_c", pres: "coolant_pressure_bar",      load: "pump_current_a"       },
};

const CATEGORY_LABELS = { vib: "Vibration", temp: "Temperature", pres: "Pressure", load: "Load" } as const;
const CATEGORY_ICONS  = { vib: Vibrate, temp: Thermometer, pres: Gauge, load: CircleGauge } as const;

const STATUS_STYLE: Record<string, { ring: string; dot: string; text: string }> = {
  Good:     { ring: "#22A85B", dot: "bg-emerald-500", text: "text-emerald-700" },
  Warning:  { ring: "#F59E0B", dot: "bg-amber-400",   text: "text-amber-600"   },
  Critical: { ring: "#E11D48", dot: "bg-rose-500",    text: "text-rose-600"    },
};

const circumference = 2 * Math.PI * 43;

const slideVariants = {
  enter:  (d: number) => ({ x: d > 0 ? 72 : -72, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -72 : 72, opacity: 0 }),
};
const t = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] };

export function EquipmentHealth() {
  const { machines, predictions } = usePredictions();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [images, setImages] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cubeai-machine-images");
      if (raw) setImages(JSON.parse(raw));
    } catch {}
  }, []);

  const total = MACHINE_CONFIGS.length;

  const navigate = (step: number) => {
    setDir(step);
    setIdx((prev) => (prev + step + total) % total);
  };

  const goTo = (i: number) => {
    if (i === idx) return;
    setDir(i > idx ? 1 : -1);
    setIdx(i);
  };

  const cfg = MACHINE_CONFIGS[idx];
  const machineState = machines.find((m) => m.machineId === cfg.machineId);
  const pred = predictions.find((p) => p.machineId === cfg.machineId);

  const health = pred?.health ?? 75;
  const rul    = pred?.rul    ?? 0;
  const status: "Good" | "Warning" | "Critical" = pred?.status ?? "Good";
  const sc = STATUS_STYLE[status];
  const badgeTone = status === "Good" ? "green" as const
                  : status === "Warning" ? "orange" as const
                  : "red" as const;

  const keys = METRIC_KEYS[cfg.machineType] ?? {};
  const metrics = (["vib", "temp", "pres", "load"] as const).map((cat) => {
    const sKey = keys[cat];
    const Icon = CATEGORY_ICONS[cat];
    if (!sKey || !machineState) {
      return { Icon, label: CATEGORY_LABELS[cat], value: "—", status: "Good" as SensorStatus, tone: "slate" as const, hasData: false };
    }
    const meta   = cfg.sensors[sKey];
    const val    = machineState.sensors[sKey] ?? meta.nominal;
    const sStatus = getSensorStatus(meta, val);
    const tone   = sStatus === "Good" ? "green" as const : sStatus === "Warning" ? "orange" as const : "red" as const;
    return { Icon, label: meta.label, value: fmtSensor(meta, val), status: sStatus, tone, hasData: true };
  });

  const imgSrc = images[cfg.machineId] ?? "/machine.png";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setImages((prev) => {
        const next = { ...prev, [cfg.machineId]: url };
        try { localStorage.setItem("cubeai-machine-images", JSON.stringify(next)); } catch {}
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <DashCard className="min-h-[360px] p-6">
      <DashCardHeader>
        <div className="min-w-0">
          <DashCardTitle>Equipment Health Snapshot</DashCardTitle>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.p
              key={cfg.machineId + "-area"}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={t}
              className="mt-0.5 truncate text-[11px] font-semibold text-slate-400"
            >
              {cfg.area} · {idx + 1} / {total}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => navigate(-1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Previous machine"
            >
              <ArrowLeft className="h-[15px] w-[15px]" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              aria-label="Next machine"
            >
              <ArrowRight className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>
      </DashCardHeader>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.h3
          key={cfg.machineId + "-name"}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={t}
          className="mt-2 text-sm font-extrabold tracking-[-0.02em] text-slate-900"
        >
          {cfg.machineName}
        </motion.h3>
      </AnimatePresence>

      <div className="mt-3 grid items-center gap-6 lg:grid-cols-[1.15fr_0.9fr]">

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={cfg.machineId + "-img"}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={t}
            className="relative mx-auto flex w-full max-w-[493px] flex-col items-center"
          >
            <div className="relative flex h-[195px] w-full items-center justify-center sm:h-[222px]">
              <div className="absolute inset-x-10 bottom-6 h-8 rounded-[50%] bg-slate-900/10 blur-xl" />
              <motion.img
                src={imgSrc}
                alt={cfg.machineName}
                className="relative z-10 h-auto max-h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.12)]"
                whileHover={{ y: -4, scale: 1.012 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full px-1">
              <div className="flex justify-center gap-1.5 flex-1">
                {MACHINE_CONFIGS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Machine ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === idx
                        ? "w-5 bg-blue-600"
                        : "w-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                title="Change machine image"
              >
                <Camera className="h-3.5 w-3.5" />
                Change Image
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={cfg.machineId + "-metrics"}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={t}
            className="space-y-4"
          >
            <div className="flex items-center gap-5">
              <div className="relative h-[108px] w-[108px] shrink-0">
                <svg className="-rotate-90" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="43" fill="none" stroke="#E5E7EB" strokeWidth="9" />
                  <motion.circle
                    cx="55" cy="55" r="43"
                    fill="none"
                    stroke={sc.ring}
                    strokeLinecap="round"
                    strokeWidth="9"
                    animate={{ strokeDashoffset: circumference - (health / 100) * circumference }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    strokeDasharray={circumference}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <motion.div
                      key={health}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-950"
                    >
                      {health}
                    </motion.div>
                    <div className="-mt-1 text-xs font-semibold text-slate-500">/100</div>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700">Overall Health Score</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${sc.dot}`} />
                  <span className={`text-xl font-semibold ${sc.text}`}>{status}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <DashBadge tone={badgeTone} className="text-[10px]">RUL</DashBadge>
                  <span className="text-sm font-bold text-slate-700">{rul.toFixed(1)} h</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {metrics.map((m) => (
                <div key={m.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm">
                  <div className="flex items-center gap-2.5 font-semibold text-slate-700">
                    <m.Icon className="h-4 w-4 shrink-0 text-blue-600" />
                    {m.label}
                  </div>
                  <motion.span
                    key={m.value}
                    initial={{ color: "#2563EB" }}
                    animate={{ color: "#1e293b" }}
                    transition={{ duration: 0.7 }}
                    className="font-bold tabular-nums"
                  >
                    {m.value}
                  </motion.span>
                  {m.hasData ? (
                    <DashBadge tone={m.tone} className="min-w-[72px] justify-center">
                      {m.status}
                    </DashBadge>
                  ) : (
                    <span className="min-w-[72px] text-center text-xs text-slate-400">N/A</span>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/machines"
              className="inline-flex h-10 min-w-[200px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              View Machine Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashCard>
  );
}
