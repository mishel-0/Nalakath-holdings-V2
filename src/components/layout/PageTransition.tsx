"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Lightweight fade-only transition — no unmount/remount, no AnimatePresence "wait".
// This prevents Firebase listeners from being torn down on every page change.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0.9, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
