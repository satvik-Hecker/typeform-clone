"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircleIcon, ArrowRightIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { QuestionInput } from "@/components/respondent/question-input";
import { usePatchQuestionCache, useUpdateQuestion } from "@/hooks/use-form";
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

export function QuestionCanvas({ formId, question, index, device, theme: rawTheme }: QuestionCanvasProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const patchQuestionCache = usePatchQuestionCache(formId);
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
        payload: { title: title.trim(), description: description.trim() || null },
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

  function handleTitleChange(value: string) {
    setTitle(value);
    patchQuestionCache(question.id, { title: value });
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);
    patchQuestionCache(question.id, { description: value || null });
  }

  function blurOnEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);
  const theme = parseFormTheme(rawTheme);
  const accentColor = theme.primaryColor;

  const cardClassName = cn(
    "w-full rounded-2xl bg-background p-10 shadow-sm ring-1 ring-border transition-[max-width] duration-200 font-sans",
    device === "mobile" ? "max-w-sm" : "max-w-2xl"
  );
  const cardStyle = themeFontStyle(theme);

  // Welcome/thank-you are shown exactly like the real respondent screens (centered, no page
  // number, with the same button/icon) rather than the left-aligned question layout below —
  // the canvas should be a true preview of what a respondent actually sees.
  if (question.type === "welcome") {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/30 p-10">
        <div className={cardClassName} style={cardStyle}>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <textarea
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={blurOnEnter}
              placeholder="Welcome title"
              rows={1}
              className="w-full resize-none bg-transparent text-center font-heading text-3xl font-bold leading-tight outline-none placeholder:text-muted-foreground/40 [field-sizing:content]"
            />
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Description (optional)"
              rows={1}
              className="w-full max-w-lg resize-none bg-transparent text-center text-base text-muted-foreground outline-none placeholder:text-muted-foreground/40 [field-sizing:content]"
            />
            <Button
              size="lg"
              className="mt-3 gap-2"
              style={accentColor ? { backgroundColor: accentColor, color: "white" } : undefined}
            >
              Let&apos;s go <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (question.type === "thank_you") {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/30 p-10">
        <div className={cardClassName} style={cardStyle}>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2Icon className="size-14 text-foreground" />
            <textarea
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={blurOnEnter}
              placeholder="Thank-you message"
              rows={1}
              className="w-full max-w-md resize-none bg-transparent text-center font-heading text-2xl font-bold outline-none placeholder:text-muted-foreground/40 [field-sizing:content]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/30 p-10">
      <div className={cardClassName} style={cardStyle}>
        <div className="flex items-start gap-2">
          <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground font-heading text-xs font-semibold text-background">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              {/* A plain <input> can't wrap, so a long title just scrolls out of view instead of
                  staying visible — a <textarea> wraps naturally within the card's width, same as
                  any other text, with no measuring/sizing tricks needed. */}
              <textarea
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={blurOnEnter}
                placeholder="Question title"
                rows={1}
                className="min-w-0 flex-1 resize-none bg-transparent font-heading text-2xl font-bold outline-none placeholder:text-muted-foreground/40 [field-sizing:content]"
              />
              {question.required && (
                <span className="mt-1.5 shrink-0 text-lg" aria-hidden>
                  *
                </span>
              )}
            </div>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
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
