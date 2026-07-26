"use client";

import { use, useEffect, useState } from "react";
import { QuestionEditor } from "@/components/builder/question-editor";
import { QuestionSidebar } from "@/components/builder/question-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormQuery } from "@/hooks/use-form";

export default function BuilderEditPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const id = Number(formId);
  const { data: form, isLoading, isError } = useFormQuery(id);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  useEffect(() => {
    if (form && form.questions.length > 0 && selectedQuestionId === null) {
      setSelectedQuestionId(form.questions[0].id);
    }
  }, [form, selectedQuestionId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Couldn&apos;t load this form.
      </div>
    );
  }

  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) ?? null;

  return (
    <>
      <QuestionSidebar
        formId={id}
        questions={form.questions}
        selectedQuestionId={selectedQuestionId}
        onSelect={setSelectedQuestionId}
      />
      <div className="flex-1 overflow-y-auto bg-background">
        {selectedQuestion ? (
          <QuestionEditor key={selectedQuestion.id} formId={id} question={selectedQuestion} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Add a question to get started.
          </div>
        )}
      </div>
    </>
  );
}
