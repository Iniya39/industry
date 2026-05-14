import { ChevronDown } from "lucide-react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";

export function SelectControl({
  icon: Icon,
  value,
  options,
  className
}: {
  icon?: ElementType;
  value: string;
  options: string[];
  className?: string;
}) {
  return (
    <label className={cn("relative flex h-14 min-w-0 items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition hover:border-blue-200 sm:min-w-[170px]", className)}>
      {Icon ? <Icon className="mr-3 h-5 w-5 text-blue-600" strokeWidth={1.9} /> : null}
      <select
        defaultValue={value}
        className="h-full flex-1 appearance-none bg-transparent pr-8 text-sm font-semibold text-slate-800 outline-none"
        aria-label={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-500" />
    </label>
  );
}
