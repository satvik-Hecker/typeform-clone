"use client";

import { FileTextIcon } from "lucide-react";

import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import { FormCard } from "@/components/dashboard/form-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormsQuery } from "@/hooks/use-forms";

export default function FormsDashboardPage() {
  const { data: forms, isLoading, isError } = useFormsQuery();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Your forms</h1>
          <p className="text-sm text-muted-foreground">Create, publish, and track your typeforms.</p>
        </div>
        <CreateFormDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load your forms. Is the backend running at{" "}
          {process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"}?
        </p>
      )}

      {forms && forms.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-24 text-center">
          <FileTextIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No forms yet</p>
            <p className="text-sm text-muted-foreground">Create your first form to get started.</p>
          </div>
          <CreateFormDialog />
        </div>
      )}

      {forms && forms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </main>
  );
}
