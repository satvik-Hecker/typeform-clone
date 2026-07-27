"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { QuestionInput } from "@/components/respondent/question-input";
import { useUpdateQuestion } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { parseFormTheme, themeFontStyle } from "@/lib/theme";
import { CHOICE_QUESTION_TYPES } from "@/lib/types";
import { previewValidate } from "@/lib/validate-answer";
import { cn } from "@/lib/utils";
import type { AnswerSubmitPayload, Question } from "@/lib/types";

interface QuestionCanvasProps {
  formId: number;
  question: Question;
  index: number;
  device: "desktop" | "mobile";
  theme: string | null;
}

export function QuestionCanvas({ formId, question, index, device, theme }: QuestionCanvasProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description ?? "");
  const [previewValue, setPreviewValue] = useState<AnswerSubmitPayload>({});
  const [previewError, setPreviewError] = useState<string | null>(null);

  const skipNextSave = useRef(true);

  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description ?? "");
    setPreviewValue({});
    setPreviewError(null);
    skipNextSave.current = true;
  }, [question.id]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const handle = setTimeout(() => {
      updateQuestion.mutate({
        questionId: question.id,
        payload: { title: title.trim() || "Untitled question", description: description.trim() || null },
      });
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  function handleAddChoice() {
    const nextIndex = question.options.length;
    updateQuestion.mutate(
      {
        questionId: question.id,
        payload: {
          options: [
            ...question.options.map((o) => ({ label: o.label, order_index: o.order_index })),
            { label: `Option ${nextIndex + 1}`, order_index: nextIndex },
          ],
        },
      },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't add an option") }
    );
  }

  const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-10">
      <div
        className={cn(
          "w-full rounded-2xl bg-background p-10 shadow-sm ring-1 ring-border transition-[max-width] duration-200 font-sans",
          device === "mobile" ? "max-w-sm" : "max-w-2xl"
        )}
        style={themeFontStyle(parseFormTheme(theme))}
      >
        <div className="flex items-start gap-2">
          <span className="mt-1.5 shrink-0 font-heading text-lg text-muted-foreground">{index + 1} →</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-0.5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Question title"
                className="min-w-[2ch] max-w-full bg-transparent font-heading text-2xl font-bold outline-none placeholder:text-muted-foreground/40 [field-sizing:content]"
              />
              {question.required && (
                <span className="shrink-0 align-super text-base" aria-hidden>
                  *
                </span>
              )}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={1}
              className="mt-1 w-full resize-none bg-transparent text-sm italic text-muted-foreground outline-none placeholder:italic placeholder:text-muted-foreground/50"
            />

            <div
              className="mt-8"
              onBlur={() => setPreviewError(previewValidate(question, previewValue))}
            >
              <QuestionInput
                question={question}
                value={previewValue}
                onChange={(v) => {
                  setPreviewValue(v);
                  setPreviewError(null);
                }}
                onAdvance={() => {}}
              />
            </div>

            {previewError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircleIcon className="size-4 shrink-0" />
                {previewError}
              </p>
            )}

            {isChoice && (
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                <button
                  type="button"
                  onClick={handleAddChoice}
                  disabled={updateQuestion.isPending}
                  className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/70"
                >
                  Add choices
                </button>
                <span className="text-muted-foreground">
                  {question.options.length} option{question.options.length === 1 ? "" : "s"} in list
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
