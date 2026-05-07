import { cn } from "@/lib/utils";

const toneClass = {
  blue: "bg-blue-600",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-600"
};

export function Progress({
  value,
  tone = "blue",
  className
}: {
  value: number;
  tone?: keyof typeof toneClass;
  className?: string;
}) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", toneClass[tone])}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
