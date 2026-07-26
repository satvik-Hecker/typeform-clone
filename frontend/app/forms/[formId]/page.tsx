"use client";

import { use, useEffect, useState } from "react";
import { BuilderToolbar } from "@/components/builder/builder-toolbar";
import { QuestionCanvas } from "@/components/builder/question-canvas";
import { QuestionSettingsPanel } from "@/components/builder/question-settings-panel";
import { QuestionSidebar } from "@/components/builder/question-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormQuery } from "@/hooks/use-form";

export default function BuilderEditPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const id = Number(formId);
  const { data: form, isLoading, isError } = useFormQuery(id);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

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

  const selectedIndex = form.questions.findIndex((q) => q.id === selectedQuestionId);
  const selectedQuestion = selectedIndex >= 0 ? form.questions[selectedIndex] : null;

  return (
    <>
      <QuestionSidebar
        formId={id}
        questions={form.questions}
        selectedQuestionId={selectedQuestionId}
        onSelect={setSelectedQuestionId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BuilderToolbar
          form={form}
          device={device}
          onDeviceChange={setDevice}
          onQuestionCreated={setSelectedQuestionId}
        />
        {selectedQuestion ? (
          <QuestionCanvas formId={id} question={selectedQuestion} index={selectedIndex} device={device} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Add a question to get started.
          </div>
        )}
      </div>
      {selectedQuestion && (
        <QuestionSettingsPanel
          formId={id}
          question={selectedQuestion}
          onDeleted={() => setSelectedQuestionId(null)}
        />
      )}
    </>
  );
}
