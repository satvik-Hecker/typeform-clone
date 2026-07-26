"use client";

import { motion } from "framer-motion";

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-x-0 top-0 z-10 h-1 bg-muted">
      <motion.div
        className="h-full bg-foreground"
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
