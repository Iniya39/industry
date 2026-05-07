import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <Inbox className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-extrabold text-slate-900">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
    </div>
  );
}
