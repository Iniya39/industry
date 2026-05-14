import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HealthRing({
  value,
  size = 96,
  className
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const color = value >= 80 ? "#16A34A" : value >= 60 ? "#F59E0B" : "#E11D48";

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (value / 100) * circumference }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-lg font-extrabold tracking-[-0.04em] text-slate-950">{value}</span>
    </div>
  );
}
