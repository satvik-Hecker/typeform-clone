"use client";

import { useEffect, useRef } from "react";
import { StarIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnswerSubmitPayload, Question } from "@/lib/types";

interface QuestionInputProps {
  question: Question;
  value: AnswerSubmitPayload;
  onChange: (value: AnswerSubmitPayload) => void;
  onAdvance: () => void;
  accentColor?: string;
}

const AUTO_ADVANCE_DELAY = 350;

export function QuestionInput({ question, value, onChange, onAdvance, accentColor }: QuestionInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [question.id]);

  switch (question.type) {
    case "short_text":
    case "email":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={question.type === "email" ? "email" : "text"}
          value={value.value_text ?? ""}
          placeholder={question.placeholder ?? "Type your answer here…"}
          onChange={(e) => onChange({ value_text: e.target.value })}
          className="w-full border-b-2 border-foreground/20 bg-transparent pb-3 font-heading text-2xl outline-none placeholder:text-muted-foreground/40 focus:border-foreground sm:text-3xl"
        />
      );

    case "long_text":
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value.value_text ?? ""}
          placeholder={question.placeholder ?? "Type your answer here…"}
          onChange={(e) => onChange({ value_text: e.target.value })}
          rows={3}
          className="w-full resize-none border-b-2 border-foreground/20 bg-transparent pb-3 font-heading text-2xl outline-none placeholder:text-muted-foreground/40 focus:border-foreground sm:text-3xl"
        />
      );

    case "number":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={value.value_number ?? ""}
          placeholder={question.placeholder ?? "Type your answer here…"}
          onChange={(e) => onChange({ value_number: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="w-full border-b-2 border-foreground/20 bg-transparent pb-3 font-heading text-2xl outline-none placeholder:text-muted-foreground/40 focus:border-foreground sm:text-3xl"
        />
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { label: "Yes", val: true },
            { label: "No", val: false },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onChange({ value_bool: opt.val });
                setTimeout(onAdvance, AUTO_ADVANCE_DELAY);
              }}
              style={
                value.value_bool === opt.val && accentColor
                  ? { borderColor: accentColor, backgroundColor: accentColor, color: "white" }
                  : undefined
              }
              className={cn(
                "rounded-xl border-2 px-8 py-4 text-lg font-medium transition-colors",
                value.value_bool === opt.val
                  ? !accentColor && "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "rating": {
      const max = question.max_value ?? 5;
      const current = value.value_number ?? 0;
      return (
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange({ value_number: n });
                setTimeout(onAdvance, AUTO_ADVANCE_DELAY);
              }}
              aria-label={`${n} out of ${max}`}
              className="transition-transform hover:scale-110"
            >
              <StarIcon
                style={n <= current && accentColor ? { color: accentColor, fill: accentColor } : undefined}
                className={cn(
                  "size-8 sm:size-10",
                  n <= current
                    ? !accentColor && "fill-foreground text-foreground"
                    : "fill-none text-muted-foreground/40"
                )}
              />
            </button>
          ))}
        </div>
      );
    }

    case "multiple_choice":
      return (
        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange({ selected_option_id: option.id });
                setTimeout(onAdvance, AUTO_ADVANCE_DELAY);
              }}
              style={
                value.selected_option_id === option.id && accentColor
                  ? { borderColor: accentColor, backgroundColor: accentColor, color: "white" }
                  : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-lg transition-colors",
                value.selected_option_id === option.id
                  ? !accentColor && "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md border text-sm font-medium",
                  value.selected_option_id === option.id ? "border-background/40" : "border-border"
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <Select
          value={value.selected_option_id ? String(value.selected_option_id) : undefined}
          onValueChange={(v) => {
            onChange({ selected_option_id: Number(v) });
            setTimeout(onAdvance, AUTO_ADVANCE_DELAY);
          }}
        >
          <SelectTrigger className="h-auto w-full border-0 border-b-2 border-foreground/20 py-3 text-2xl focus-visible:ring-0">
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)} className="text-base">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
}
