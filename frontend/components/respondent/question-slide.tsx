"use client";

import { motion } from "framer-motion";
import { AlertCircleIcon } from "lucide-react";

import { QuestionInput } from "./question-input";
import type { AnswerSubmitPayload, Question } from "@/lib/types";

const variants = {
  enter: (direction: number) => ({ y: direction >= 0 ? 32 : -32, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction >= 0 ? -32 : 32, opacity: 0 }),
};

interface QuestionSlideProps {
  question: Question;
  index: number;
  direction: number;
  value: AnswerSubmitPayload;
  error: string | null;
  onChange: (value: AnswerSubmitPayload) => void;
  onAdvance: () => void;
}

export function QuestionSlide({ question, index, direction, value, error, onChange, onAdvance }: QuestionSlideProps) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-2xl flex-col px-6"
    >
      <div className="flex items-start gap-2">
        <span className="mt-1.5 shrink-0 font-heading text-lg text-muted-foreground sm:text-xl">
          {index + 1} →
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">
            {question.title}
            {question.required && <span className="ml-1 align-super text-base text-destructive">*</span>}
          </h2>
          {question.description && (
            <p className="mt-2 text-base text-muted-foreground">{question.description}</p>
          )}

          <div className="mt-8">
            <QuestionInput question={question} value={value} onChange={onChange} onAdvance={onAdvance} />
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircleIcon className="size-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
