"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useDeleteQuestion, useReorderQuestions } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { QUESTION_TYPE_COLORS } from "@/lib/question-type-color";
import { QUESTION_TYPE_ICONS } from "@/lib/question-type-icons";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

interface QuestionSidebarProps {
  formId: number;
  questions: Question[];
  selectedQuestionId: number | null;
  onSelect: (id: number) => void;
}

export function QuestionSidebar({ formId, questions, selectedQuestionId, onSelect }: QuestionSidebarProps) {
  const [items, setItems] = useState(questions);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const reorder = useReorderQuestions(formId);
  const deleteQuestion = useDeleteQuestion(formId);

  useEffect(() => {
    setItems(questions);
  }, [questions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((q) => q.id === active.id);
    const newIndex = items.findIndex((q) => q.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(
      next.map((q) => q.id),
      {
        onError: (err) => {
          setItems(questions);
          toast.error(err instanceof ApiError ? err.message : "Couldn't reorder questions");
        },
      }
    );
  }

  const pendingDeleteQuestion = items.find((q) => q.id === pendingDeleteId) ?? null;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-3 border-r bg-muted/30 p-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</h2>
      <div className="flex-1 space-y-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {items.map((question, index) => (
              <SortableQuestionRow
                key={question.id}
                question={question}
                index={index}
                selected={question.id === selectedQuestionId}
                onSelect={() => onSelect(question.id)}
                onDelete={() => setPendingDeleteId(question.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {items.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No questions yet. Use &ldquo;Add content&rdquo; above to add one.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete this question?"
        description={
          pendingDeleteQuestion
            ? `"${pendingDeleteQuestion.title}" will be permanently removed from the form.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleteQuestion.isPending}
        onConfirm={() => {
          if (pendingDeleteId === null) return;
          deleteQuestion.mutate(pendingDeleteId, {
            onSuccess: () => setPendingDeleteId(null),
            onError: (err) => {
              toast.error(err instanceof ApiError ? err.message : "Couldn't delete the question");
            },
          });
        }}
      />
    </div>
  );
}

interface SortableQuestionRowProps {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableQuestionRow({ question, index, selected, onSelect, onDelete }: SortableQuestionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const Icon = QUESTION_TYPE_ICONS[question.type];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1.5 text-sm",
        selected ? "border-border bg-background shadow-sm" : "hover:bg-background/60",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 overflow-hidden text-left"
      >
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md", QUESTION_TYPE_COLORS[question.type])}>
          <Icon className="size-3.5" />
        </span>
        <span className="w-4 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
        <span className="truncate">{question.title || "Untitled question"}</span>
      </button>
      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={onDelete}>
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
