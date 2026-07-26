"use client";

import { motion } from "framer-motion";
import { CheckCircle2Icon } from "lucide-react";

export function ThankYouScreen({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <CheckCircle2Icon className="size-14 text-foreground" />
      </motion.div>
      <p className="max-w-md font-heading text-2xl font-bold sm:text-3xl">{message}</p>
    </motion.div>
  );
}
