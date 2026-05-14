import * as React from "react";
import { cn } from "@/lib/utils";

export const DashCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[22px] border border-slate-200/80 bg-white shadow-card transition-all duration-300",
        className
      )}
      {...props}
    />
  )
);
DashCard.displayName = "DashCard";

export const DashCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between gap-4", className)} {...props} />
  )
);
DashCardHeader.displayName = "DashCardHeader";

export const DashCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-[17px] font-extrabold tracking-[-0.01em] text-slate-950", className)} {...props} />
  )
);
DashCardTitle.displayName = "DashCardTitle";
