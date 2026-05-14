import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingChatButton } from "@/components/dashboard/floating-chat-button";
import { ToastHost } from "@/components/dashboard/toast-host";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pathname] = useLocation();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-950">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <motion.section
        className="min-h-screen px-4 py-4 transition-[padding] duration-300 sm:px-5 lg:ml-[218px] lg:px-5 xl:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <TopNavbar onMenuClick={() => setMenuOpen(true)} />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.section>
      <FloatingChatButton />
      <ToastHost />
    </main>
  );
}
