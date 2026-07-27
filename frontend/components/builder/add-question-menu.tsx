"use client";

import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateQuestion } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { QUESTION_TYPE_ICONS } from "@/lib/question-type-icons";
import { ANSWERABLE_QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/types";

interface AddQuestionMenuProps {
  formId: number;
  onCreated?: (questionId: number) => void;
}

export function AddQuestionMenu({ formId, onCreated }: AddQuestionMenuProps) {
  const createQuestion = useCreateQuestion(formId);

  function handleAdd(type: QuestionType) {
    createQuestion.mutate(
      { type, title: "", required: false },
      {
        onSuccess: (question) => {
          onCreated?.(question.id);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Couldn't add the question");
        },
      }
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="default" size="sm" disabled={createQuestion.isPending}>
            <PlusIcon />
            Add content
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        {ANSWERABLE_QUESTION_TYPES.map((type) => {
          const Icon = QUESTION_TYPE_ICONS[type];
          return (
            <DropdownMenuItem key={type} onClick={() => handleAdd(type)}>
              <Icon /> {QUESTION_TYPE_LABELS[type]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
