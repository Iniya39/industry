"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

export function notify(title: string, description?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cubeai-toast", { detail: { title, description } }));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; description?: string }>).detail;
      const toast = { id: Date.now(), ...detail };
      setToasts((items) => [...items.slice(-2), toast]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== toast.id));
      }, 3200);
    };
    window.addEventListener("cubeai-toast", handler);
    return () => window.removeEventListener("cubeai-toast", handler);
  }, []);

  return (
    <div className="fixed right-5 top-5 z-[70] grid gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            className="flex w-[320px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-extrabold text-slate-950">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-xs font-medium text-slate-500">{toast.description}</p> : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
