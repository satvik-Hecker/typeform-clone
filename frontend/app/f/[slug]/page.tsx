"use client";

import { use } from "react";
import { FileQuestionIcon, Loader2Icon } from "lucide-react";

import { RespondentFlow } from "@/components/respondent/respondent-flow";
import { usePublicFormQuery } from "@/hooks/use-public-form";

export default function PublicFormPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = use(props.params);
  const { data: form, isLoading, isError } = usePublicFormQuery(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <FileQuestionIcon className="size-10 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">This form isn&apos;t available</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may have been unpublished or the link might be incorrect.
        </p>
      </div>
    );
  }

  return <RespondentFlow form={form} mode="live" />;
}
