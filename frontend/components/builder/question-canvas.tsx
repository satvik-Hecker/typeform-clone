"use client";

import { useEffect, useRef, useState } from "react";

import { QuestionInput } from "@/components/respondent/question-input";
import { useUpdateQuestion } from "@/hooks/use-form";
import { parseFormTheme, themeFontStyle } from "@/lib/theme";
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

  const skipNextSave = useRef(true);

  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description ?? "");
    setPreviewValue({});
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
            <div className="flex items-center gap-1.5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Question title"
                className="min-w-0 flex-1 bg-transparent font-heading text-2xl font-bold outline-none placeholder:text-muted-foreground/40"
              />
              {question.required && (
                <span className="shrink-0 align-super text-base text-destructive" aria-hidden>
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

            <div className="mt-8">
              <QuestionInput question={question} value={previewValue} onChange={setPreviewValue} onAdvance={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
