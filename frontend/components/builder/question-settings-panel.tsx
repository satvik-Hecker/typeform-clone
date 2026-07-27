"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelpIcon, ImageIcon, PlusIcon, StarIcon, XIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteQuestion, useUpdateQuestion } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { comingSoon } from "@/lib/coming-soon";
import { QUESTION_TYPE_ICONS } from "@/lib/question-type-icons";
import { QUESTION_TYPE_COLORS } from "@/lib/question-type-color";
import {
  CHOICE_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type Question,
  type QuestionType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];
const RATING_SCALES = [3, 4, 5, 6, 7, 8, 9, 10];
const DEFAULT_MAX_CHARACTERS = "100";

interface DraftOption {
  key: string;
  label: string;
}

function toDraftOptions(question: Question): DraftOption[] {
  return question.options.map((o) => ({ key: `${o.id}`, label: o.label }));
}

function TypeOption({ type }: { type: QuestionType }) {
  const Icon = QUESTION_TYPE_ICONS[type];
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", QUESTION_TYPE_COLORS[type])}>
        <Icon className="size-3.5" />
      </span>
      {QUESTION_TYPE_LABELS[type]}
    </span>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-sm">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger render={<CircleHelpIcon className="size-3.5 text-muted-foreground" />} />
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        )}
      </span>
      {children}
    </div>
  );
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
  const [placeholderEnabled, setPlaceholderEnabled] = useState((question.placeholder ?? "").trim() !== "");
  const [minValue, setMinValue] = useState(question.min_value?.toString() ?? "");
  const [maxValue, setMaxValue] = useState(question.max_value?.toString() ?? "");
  const [options, setOptions] = useState<DraftOption[]>(() => toDraftOptions(question));

  const isFreeText = question.type === "short_text" || question.type === "long_text";
  const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);
  const hasPlaceholder = ["short_text", "long_text", "email", "number"].includes(question.type);
  const hasValidation = ["short_text", "long_text", "email"].includes(question.type);

  const skipNextSave = useRef(true);

  useEffect(() => {
    setPlaceholder(question.placeholder ?? "");
    setPlaceholderEnabled((question.placeholder ?? "").trim() !== "");
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
    <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-foreground">Answer</Label>
        <Select value={question.type} onValueChange={(v) => handleTypeChange(v as QuestionType)}>
          <SelectTrigger className="h-11 w-full rounded-md px-3">
            <SelectValue>{(value: QuestionType) => <TypeOption type={value} />}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                <TypeOption type={type} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-4">
        <SettingRow label="Required">
          <Switch checked={question.required} onCheckedChange={handleRequiredChange} />
        </SettingRow>

        {isFreeText && (
          <>
            <SettingRow label="Max characters">
              <Switch
                checked={maxValue.trim() !== ""}
                onCheckedChange={(checked) => setMaxValue(checked ? DEFAULT_MAX_CHARACTERS : "")}
              />
            </SettingRow>
            {maxValue.trim() !== "" && (
              <Input type="number" min={1} value={maxValue} onChange={(e) => setMaxValue(e.target.value)} />
            )}
          </>
        )}

       

        {hasPlaceholder && (
          <>
            <SettingRow label="Custom placeholder text" hint="Example text shown inside the empty answer field">
              <Switch
                checked={placeholderEnabled}
                onCheckedChange={(checked) => {
                  setPlaceholderEnabled(checked);
                  if (!checked) setPlaceholder("");
                }}
              />
            </SettingRow>
            {placeholderEnabled && (
              <Input
                placeholder="Shown inside the answer field"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                autoFocus
              />
            )}
          </>
        )}

        {question.type === "number" && (
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

        {question.type === "rating" && (
          <div className="grid grid-cols-2 gap-3">
            <Select value={maxValue || "5"} onValueChange={(v) => setMaxValue(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATING_SCALES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Select value="star" onValueChange={() => comingSoon("More rating icons", StarIcon)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <span className="flex items-center gap-1.5">
                          <StarIcon className="size-4" /> Star
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="star">
                        <StarIcon className="size-4" /> Star
                      </SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
              <TooltipContent>More icon shapes coming soon</TooltipContent>
            </Tooltip>
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
      </div>

      <Separator />

      <div className="space-y-4">

         {hasValidation && (
          <SettingRow label="Answer validation" hint="Restrict answers to a specific format — coming soon">
            <Switch checked={false} onCheckedChange={() => comingSoon("Answer validation", CircleHelpIcon)} />
          </SettingRow>
        )}
        
        <SettingRow label="Map to contacts" hint="Link this answer to a contact property — coming soon">
          <Switch checked={false} onCheckedChange={() => comingSoon("Mapping answers to contacts", CircleHelpIcon)} />
        </SettingRow>

        <SettingRow label="Image or video">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => comingSoon("Adding images & video to questions", ImageIcon)}
            aria-label="Add image or video"
          >
            <PlusIcon />
          </Button>
        </SettingRow>
      </div>

      <div className="mt-auto border-t pt-4">
        <Button variant="destructive" size="sm" className="w-full" onClick={handleDelete}>
          Delete question
        </Button>
      </div>
    </div>
  );
}
