"use client";

import { useMemo, useState } from "react";
import {
  FileTextIcon,
  LayoutGridIcon,
  ListIcon,
  UserPlusIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";

import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import { DashboardTopBar } from "@/components/dashboard/dashboard-topbar";
import { FormCard } from "@/components/dashboard/form-card";
import { FormRow } from "@/components/dashboard/form-row";
import { WorkspaceSidebar } from "@/components/dashboard/workspace-sidebar";
import { WorkspaceTitle } from "@/components/dashboard/workspace-title";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFormsQuery } from "@/hooks/use-forms";
import { useWorkspaceName } from "@/hooks/use-workspace-name";
import { comingSoon } from "@/lib/coming-soon";
import { cn } from "@/lib/utils";
import type { FormListItem } from "@/lib/types";

type ViewMode = "list" | "grid";
type SortBy = "updated_at" | "created_at" | "title";

const SORT_OPTIONS: Record<SortBy, string> = {
  updated_at: "Last updated",
  created_at: "Date created",
  title: "Name",
};

function sortForms(forms: FormListItem[], sortBy: SortBy): FormListItem[] {
  const sorted = [...forms];
  if (sortBy === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    sorted.sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());
  }
  return sorted;
}

export default function FormsDashboardPage() {
  const { data: forms, isLoading, isError } = useFormsQuery();
  const [view, setView] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("updated_at");
  const { name: workspaceName, setName: setWorkspaceName } = useWorkspaceName();

  const sortedForms = useMemo(() => (forms ? sortForms(forms, sortBy) : []), [forms, sortBy]);
  const totalResponses = useMemo(
    () => (forms ? forms.reduce((sum, f) => sum + f.response_count, 0) : 0),
    [forms]
  );

  return (
    <div className="flex h-screen flex-col bg-muted/40 p-2 sm:gap-4 sm:p-4">
      <DashboardTopBar />
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">

        <nav className="flex items-center gap-6 border-b px-6 text-sm sm:px-8">
          <span className="flex items-center gap-1.5 border-b-2 border-foreground py-3 font-medium">
            <FileTextIcon className="size-4" /> Forms
          </span>
          <button
            type="button"
            onClick={() => comingSoon("Contacts", UsersIcon)}
            className="flex items-center gap-1.5 py-3 text-muted-foreground hover:text-foreground"
          >
            <UsersIcon className="size-4" /> Contacts
          </button>
          <button
            type="button"
            onClick={() => comingSoon("Automations", WorkflowIcon)}
            className="flex items-center gap-1.5 py-3 text-muted-foreground hover:text-foreground"
          >
            <WorkflowIcon className="size-4" /> Automations
          </button>
        </nav>

        <div className="flex flex-1 overflow-hidden">
          <WorkspaceSidebar
            totalResponses={totalResponses}
            workspaceName={workspaceName}
            onRenameWorkspace={setWorkspaceName}
          />

          <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <WorkspaceTitle
                  value={workspaceName}
                  onCommit={setWorkspaceName}
                  className="font-heading text-xl font-bold tracking-tight"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => comingSoon("Inviting teammates", UserPlusIcon)}
                >
                  <UserPlusIcon /> Invite
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-40">
                    <SelectValue>{(value: SortBy) => SORT_OPTIONS[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SORT_OPTIONS) as SortBy[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {SORT_OPTIONS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex rounded-lg border p-0.5">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm",
                      view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <ListIcon className="size-4" /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm",
                      view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <LayoutGridIcon className="size-4" /> Grid
                  </button>
                </div>
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
                      {sortedForms.map((form) => (
                        <FormRow key={form.id} form={form} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedForms.map((form) => (
                    <FormCard key={form.id} form={form} />
                  ))}
                </div>
              ))}
          </main>
        </div>
      </div>
    </div>
  );
}
