"use client";

import { motion } from "framer-motion";

export function ProgressBar({ progress, color }: { progress: number; color?: string }) {
  return (
    <div className="fixed inset-x-0 top-0 z-10 h-1 bg-muted">
      <motion.div
        className={color ? undefined : "h-full bg-foreground"}
        style={color ? { height: "100%", backgroundColor: color } : undefined}
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
