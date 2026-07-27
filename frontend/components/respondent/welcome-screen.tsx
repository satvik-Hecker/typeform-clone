"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  title: string;
  description: string | null;
  onStart: () => void;
  accentColor?: string;
}

export function WelcomeScreen({ title, description, onStart, accentColor }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
      {description && <p className="max-w-lg text-base text-muted-foreground">{description}</p>}
      <Button
        size="lg"
        onClick={onStart}
        className="mt-3 gap-2"
        style={accentColor ? { backgroundColor: accentColor, color: "white" } : undefined}
      >
        Let&apos;s go <ArrowRightIcon className="size-4" />
      </Button>
      <p className="hidden text-xs text-muted-foreground [@media(hover:hover)]:block">Press Enter ↵</p>
    </motion.div>
  );
}
