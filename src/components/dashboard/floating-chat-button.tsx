"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { machines, priorityAlerts, failurePredictions, maintenanceSchedule } from "@/data/dashboard-data";
import { cn } from "@/lib/utils";
import { notify } from "@/components/dashboard/toast-host";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const quickPrompts = [
  "Plant summary",
  "Machine 03 issue",
  "Current alerts",
  "Next maintenance"
];

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "Welcome to CubeAI Copilot. I can help with machine health, alerts, RUL predictions, failure codes, and maintenance actions."
  }
];

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((items) => [
      ...items,
      {
        id: Date.now(),
        role: "user",
        text: trimmed
      }
    ]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
      setMessages((items) => [
        ...items,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: buildAnswer(trimmed)
        }
      ]);
    }, 520);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(input);
  }

  function handleReport() {
    notify("Copilot report generated", "A plant health summary was prepared from the current dashboard data.");
    submitQuestion("Generate report");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[55] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.section
            className="mb-4 flex h-[min(640px,calc(100vh-108px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:w-[420px]"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            role="dialog"
            aria-label="CubeAI Copilot"
          >
            <div className="h-1.5 bg-gradient-to-r from-[#1F5BFF] via-[#24A7FF] to-[#56D6FF]" />

            <header className="border-b border-slate-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Bot className="h-7 w-7" />
                    <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-[-0.02em] text-slate-950">CubeAI Copilot</h2>
                    <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Online maintenance intelligence
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-blue-700"
                    onClick={() => setMessages(initialMessages)}
                    aria-label="Reset chat"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm font-bold text-blue-800 transition hover:border-blue-200 hover:bg-blue-100"
                onClick={handleReport}
              >
                <span className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4" />
                  Generate maintenance report
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] px-4 py-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" ? (
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                      <Bot className="h-4 w-4" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[82%] px-4 py-3 text-sm font-medium leading-6 shadow-sm",
                      message.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-blue-600 text-white"
                        : "rounded-2xl rounded-tl-md border border-slate-200 bg-white text-slate-700"
                    )}
                  >
                    {message.text}
                  </div>
                  {message.role === "user" ? (
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600">
                      <UserRound className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
              ))}
              {typing ? (
                <div className="flex gap-3">
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="border-t border-slate-200 bg-white p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => submitQuestion(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about machines, alerts, RUL..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                Responses are generated from current dashboard data.
              </p>
            </footer>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <div className="flex justify-end">
        <motion.button
          className="group flex min-h-[64px] items-center gap-3 rounded-full border border-blue-200 bg-white px-3 py-2 text-slate-950 shadow-[0_18px_45px_rgba(37,99,235,0.25)] ring-4 ring-white/95 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_24px_60px_rgba(37,99,235,0.32)] focus:outline-none focus:ring-4 focus:ring-blue-200 sm:min-w-[228px] sm:px-4"
          animate={open ? { y: 0 } : { y: [0, -3, 0] }}
          transition={open ? { duration: 0.2 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close CubeAI Copilot" : "Open CubeAI Copilot"}
          aria-expanded={open}
        >
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4B7CFF] to-[#2755E8] text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)]">
            <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
            {!open ? <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white" /> : null}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-extrabold leading-4 text-slate-950">CubeAI Copilot</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500">Maintenance assistant</span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function buildAnswer(question: string) {
  const text = question.toLowerCase();
  const machine = findMachine(text);

  if (text.includes("report") || text.includes("summary") || text.includes("plant")) {
    const critical = machines.filter((item) => item.status === "Critical");
    const warning = machines.filter((item) => item.status === "Warning");
    return `Plant summary: ${machines.length} machines monitored. ${critical.length} critical, ${warning.length} warning, and ${machines.length - critical.length - warning.length} good. Highest priority is ${critical[0]?.id || "none"} because of vibration and low RUL. Recommended action: inspect bearings, reduce load, and keep the next maintenance slot active.`;
  }

  if (text.includes("alert")) {
    return priorityAlerts
      .map((alert) => `${alert.severity}: ${alert.machine} - ${alert.description} (${alert.time})`)
      .join("\n");
  }

  if (text.includes("maintenance") || text.includes("schedule") || text.includes("next")) {
    const next = maintenanceSchedule[0];
    return `Next maintenance: ${next.machine}, ${next.type}, ${next.date} ${next.window}. Assigned engineer: ${next.engineer}. I recommend keeping this slot because current predictions show the shortest RUL on Machine 03.`;
  }

  if (text.includes("rul") || text.includes("failure") || text.includes("prediction")) {
    const prediction = machine
      ? failurePredictions.find((item) => item.machine === machine.id)
      : failurePredictions[0];
    if (!prediction) return "No failure prediction is currently active for that machine. Continue monitoring RUL trend and alert thresholds.";
    return `${prediction.machine} has predicted failure code ${prediction.code}, estimated time ${prediction.eta}, and ${prediction.confidence}% confidence. Suggested action: schedule inspection before the ETA and verify vibration, temperature, and load signals.`;
  }

  if (text.includes("critical") || text.includes("why") || text.includes("issue") || text.includes("machine")) {
    const target = machine || [...machines].sort((a, b) => a.health - b.health)[0];
    const cause = target.status === "Critical" ? "high vibration, elevated load, and short remaining useful life" : "moderate degradation trend versus learned baseline";
    return `${target.id} is at ${target.health}/100 health with ${target.rul} RUL. Main reason: ${cause}. Recommended action: reduce load, inspect rotating components, validate sensor readings, and assign ${target.engineer} for follow-up.`;
  }

  if (text.includes("energy") || text.includes("loss")) {
    return "Production loss is 8.2%, down 15% versus the last 7 days. The biggest avoidable energy risk is running machines in warning or critical state; prioritize Machine 03 and Machine 07 to reduce load-related waste.";
  }

  return "I can help with machine health, current alerts, RUL predictions, maintenance schedules, failure codes, and plant summaries. Try asking: Why is Machine 03 critical?";
}

function findMachine(text: string) {
  const idMatch = text.match(/machine\s*0?(\d+)|m\s*0?(\d+)/);
  if (!idMatch) return null;
  const id = idMatch[1] || idMatch[2];
  return machines.find((machine) => machine.id.endsWith(id.padStart(2, "0"))) || null;
}
