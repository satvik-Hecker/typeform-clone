"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDownIcon, ChevronUpIcon, CornerDownLeftIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "./progress-bar";
import { QuestionSlide } from "./question-slide";
import { ThankYouScreen } from "./thank-you-screen";
import { WelcomeScreen } from "./welcome-screen";
import { ApiError, api } from "@/lib/api";
import { parseFormTheme, themeFontStyle } from "@/lib/theme";
import { isAnswerEmpty, validateAnswer } from "@/lib/validate-answer";
import type { AnswerSubmitPayload, Form } from "@/lib/types";

interface RespondentFlowProps {
  form: Form;
  mode: "live" | "preview";
  onClose?: () => void;
}

export function RespondentFlow({ form, mode, onClose }: RespondentFlowProps) {
  const questions = form.questions;
  const [responseId, setResponseId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<number, AnswerSubmitPayload>>({});
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState(form.thank_you_message);
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!!form.welcome_title);

  const startedRef = useRef(false);

  useEffect(() => {
    if (mode !== "live" || startedRef.current) return;
    startedRef.current = true;
    api.public
      .startResponse(form.slug)
      .then((res) => setResponseId(res.response_id))
      .catch(() => toast.error("Couldn't start this form. Please refresh and try again."));
  }, [mode, form.slug]);

  const question = questions[currentIndex];
  const value = useMemo(() => answers[question?.id] ?? {}, [answers, question?.id]);

  const setValue = useCallback(
    (v: AnswerSubmitPayload) => {
      setAnswers((prev) => ({ ...prev, [question.id]: v }));
      setError(null);
    },
    [question?.id]
  );

  const goPrev = useCallback(() => {
    if (currentIndex === 0) return;
    setDirection(-1);
    setError(null);
    setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const goNext = useCallback(async () => {
    const q = questions[currentIndex];
    const v = answers[q.id] ?? {};
    const validationError = validateAnswer(q, v);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (mode === "live" && responseId && !isAnswerEmpty(q, v)) {
      try {
        await api.public.upsertAnswer(responseId, q.id, v);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't save your answer");
        return;
      }
    }

    if (currentIndex === questions.length - 1) {
      if (mode === "live" && responseId) {
        setSubmitting(true);
        try {
          const res = await api.public.submit(responseId);
          setThankYouMessage(res.thank_you_message);
          setCompleted(true);
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : "Couldn't submit your response");
        } finally {
          setSubmitting(false);
        }
      } else {
        setThankYouMessage(form.thank_you_message);
        setCompleted(true);
      }
      return;
    }

    setDirection(1);
    setCurrentIndex((i) => i + 1);
  }, [answers, currentIndex, mode, questions, responseId, form.thank_you_message]);

  // QuestionInput schedules auto-advance via setTimeout right after calling onChange.
  // Since onChange triggers a state update, `goNext` (which depends on `answers`) is
  // rebuilt on the next render — but the timer already captured whichever `goNext`
  // closure existed at click-time, which still has the *old* (pre-selection) answers.
  // Routing the call through a ref that's kept fresh every render means the timer
  // always invokes the latest `goNext`, so it sees the answer that was just set.
  const goNextRef = useRef(goNext);
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);
  const advance = useCallback(() => {
    goNextRef.current();
  }, []);

  // Keyboard navigation: Enter/ArrowDown advance, ArrowUp goes back.
  // Shift+Enter inside a textarea inserts a newline instead of advancing.
  useEffect(() => {
    if (completed) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (showWelcome) {
        if (e.key === "Enter" || e.key === "ArrowDown") {
          e.preventDefault();
          setShowWelcome(false);
        }
        return;
      }

      const target = e.target as HTMLElement;
      const isTextarea = target.tagName === "TEXTAREA";

      if (e.key === "Enter") {
        if (isTextarea && e.shiftKey) return;
        e.preventDefault();
        goNext();
        return;
      }

      const isTypingField = target.tagName === "INPUT" || isTextarea;
      if (e.key === "ArrowDown" && !isTypingField) {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp" && !isTypingField) {
        e.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, completed, showWelcome]);

  if (!question && !completed) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        This form has no questions yet.
      </div>
    );
  }

  const progress = completed ? 1 : currentIndex / questions.length;
  const theme = parseFormTheme(form.theme);
  const accentColor = theme.primaryColor;

  return (
    <div className="relative flex h-full min-h-screen flex-col bg-background font-sans" style={themeFontStyle(theme)}>
      {!showWelcome && <ProgressBar progress={progress} color={accentColor} />}

      {mode === "preview" && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="fixed right-4 top-4 z-20 rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      )}

      <div className="flex flex-1 items-center py-20">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {showWelcome ? (
            <WelcomeScreen
              key="welcome"
              title={form.welcome_title as string}
              description={form.welcome_description}
              onStart={() => setShowWelcome(false)}
              accentColor={accentColor}
            />
          ) : completed ? (
            <ThankYouScreen key="thank-you" message={thankYouMessage} />
          ) : (
            <QuestionSlide
              key={question.id}
              question={question}
              index={currentIndex}
              direction={direction}
              value={value}
              error={error}
              onChange={setValue}
              onAdvance={advance}
              accentColor={accentColor}
            />
          )}
        </AnimatePresence>
      </div>

      {!completed && !showWelcome && (
        <div className="fixed bottom-6 right-6 z-10 flex items-center gap-3">
          <div className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronUpIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="border-t p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronDownIcon className="size-4" />
            </button>
          </div>

          <Button
            onClick={goNext}
            disabled={submitting}
            className="gap-2"
            style={accentColor ? { backgroundColor: accentColor, color: "white" } : undefined}
          >
            {submitting ? "Submitting…" : currentIndex === questions.length - 1 ? "Submit" : "OK"}
            {!submitting && <CornerDownLeftIcon className="size-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
