import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "blue" | "green" | "orange" | "red" | "slate";

const toneClass: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600"
};

export function DashBadge({
  className,
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold",
        toneClass[tone],
        className
      )}
      {...props}
    />
  );
}
