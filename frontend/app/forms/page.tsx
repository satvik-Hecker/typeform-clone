"use client";

import { useState } from "react";
import { FileTextIcon, LayoutGridIcon, ListIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";

import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { FormCard } from "@/components/dashboard/form-card";
import { FormRow } from "@/components/dashboard/form-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFormsQuery } from "@/hooks/use-forms";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "grid";

export default function FormsDashboardPage() {
  const { data: forms, isLoading, isError } = useFormsQuery();
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopBar />

      <nav className="flex items-center gap-6 border-b px-6 text-sm sm:px-8">
        <span className="border-b-2 border-foreground py-3 font-medium">Forms</span>
        <button
          type="button"
          onClick={() => toast.message("Contacts — coming soon")}
          className="py-3 text-muted-foreground hover:text-foreground"
        >
          Contacts
        </button>
        <button
          type="button"
          onClick={() => toast.message("Automations — coming soon")}
          className="py-3 text-muted-foreground hover:text-foreground"
        >
          Automations
        </button>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold tracking-tight">My workspace</h1>
            <Button variant="outline" size="sm" onClick={() => toast.message("Invite teammates — coming soon")}>
              <UserPlusIcon /> Invite
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="List view"
                className={cn(
                  "rounded-md px-2.5 py-1",
                  view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <ListIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={cn(
                  "rounded-md px-2.5 py-1",
                  view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <LayoutGridIcon className="size-4" />
              </button>
            </div>
            <CreateFormDialog />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
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

        {forms &&
          forms.length > 0 &&
          (view === "list" ? (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => (
                    <FormRow key={form.id} form={form} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ))}
      </main>
    </div>
  );
}
