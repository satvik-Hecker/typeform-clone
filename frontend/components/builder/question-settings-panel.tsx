"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDeleteQuestion, useUpdateQuestion } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type Question,
  type QuestionType,
} from "@/lib/types";

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

interface DraftOption {
  key: string;
  label: string;
}

function toDraftOptions(question: Question): DraftOption[] {
  return question.options.map((o) => ({ key: `${o.id}`, label: o.label }));
}

interface QuestionSettingsPanelProps {
  formId: number;
  question: Question;
  onDeleted: () => void;
}

export function QuestionSettingsPanel({ formId, question, onDeleted }: QuestionSettingsPanelProps) {
  const updateQuestion = useUpdateQuestion(formId);
  const deleteQuestion = useDeleteQuestion(formId);

  const [placeholder, setPlaceholder] = useState(question.placeholder ?? "");
  const [minValue, setMinValue] = useState(question.min_value?.toString() ?? "");
  const [maxValue, setMaxValue] = useState(question.max_value?.toString() ?? "");
  const [options, setOptions] = useState<DraftOption[]>(() => toDraftOptions(question));

  const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);
  const isNumeric = question.type === "number" || question.type === "rating";
  const isSimpleText = ["short_text", "long_text", "email", "number"].includes(question.type);

  const skipNextSave = useRef(true);

  useEffect(() => {
    setPlaceholder(question.placeholder ?? "");
    setMinValue(question.min_value?.toString() ?? "");
    setMaxValue(question.max_value?.toString() ?? "");
    setOptions(toDraftOptions(question));
    skipNextSave.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const handle = setTimeout(() => {
      updateQuestion.mutate(
        {
          questionId: question.id,
          payload: {
            placeholder: placeholder.trim() || null,
            min_value: minValue.trim() === "" ? null : Number(minValue),
            max_value: maxValue.trim() === "" ? null : Number(maxValue),
            ...(isChoice
              ? {
                  options: options
                    .map((o) => o.label.trim())
                    .filter((label) => label.length > 0)
                    .map((label, index) => ({ label, order_index: index })),
                }
              : {}),
          },
        },
        { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save changes") }
      );
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, minValue, maxValue, options]);

  function handleRequiredChange(checked: boolean) {
    updateQuestion.mutate(
      { questionId: question.id, payload: { required: checked } },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save changes") }
    );
  }

  function handleTypeChange(type: QuestionType) {
    if (type === question.type) return;
    updateQuestion.mutate(
      { questionId: question.id, payload: { type } },
      { onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't change type") }
    );
  }

  function handleDelete() {
    deleteQuestion.mutate(question.id, {
      onSuccess: onDeleted,
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't delete the question"),
    });
  }

  function addOption() {
    setOptions((prev) => [...prev, { key: `new-${Date.now()}`, label: "" }]);
  }

  function updateOption(key: string, label: string) {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, label } : o)));
  }

  function removeOption(key: string) {
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  return (
    <div className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l p-4">
      <div>
        <Label className="mb-1.5 block text-xs text-muted-foreground">Question type</Label>
        <Select value={question.type} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(value: QuestionType) => QUESTION_TYPE_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="required-toggle" className="text-sm">
          Required
        </Label>
        <Switch id="required-toggle" checked={question.required} onCheckedChange={handleRequiredChange} />
      </div>

      {isSimpleText && (
        <div className="space-y-1.5">
          <Label htmlFor="question-placeholder" className="text-xs text-muted-foreground">
            Placeholder
          </Label>
          <Input
            id="question-placeholder"
            placeholder="Shown inside the answer field"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
          />
        </div>
      )}

      {isNumeric && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min-value" className="text-xs text-muted-foreground">
              Min
            </Label>
            <Input id="min-value" type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-value" className="text-xs text-muted-foreground">
              Max
            </Label>
            <Input id="max-value" type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
          </div>
        </div>
      )}

      {isChoice && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Options</Label>
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <Input
                  value={option.label}
                  placeholder="Option label"
                  onChange={(e) => updateOption(option.key, e.target.value)}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => removeOption(option.key)}>
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addOption}>
            <PlusIcon /> Add option
          </Button>
        </div>
      )}

      <div className="mt-auto border-t pt-4">
        <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
          Delete question
        </Button>
      </div>
    </div>
  );
}
