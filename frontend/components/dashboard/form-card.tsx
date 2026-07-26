"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3Icon,
  CopyIcon,
  LinkIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusPill } from "@/components/shared/status-pill";
import { RenameFormDialog } from "@/components/dashboard/rename-form-dialog";
import { useDeleteForm, useDuplicateForm, usePublishForm, useUnpublishForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import type { FormListItem } from "@/lib/types";

export function FormCard({ form }: { form: FormListItem }) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const duplicateForm = useDuplicateForm();
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const deleteForm = useDeleteForm();

  const published = form.status === "published";

  function goToBuilder() {
    router.push(`/forms/${form.id}`);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  function handleTogglePublish() {
    if (published) {
      unpublishForm.mutate(form.id, {
        onSuccess: () => toast.success("Form unpublished"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't unpublish"),
      });
    } else {
      publishForm.mutate(form.id, {
        onSuccess: () => toast.success("Form published"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't publish"),
      });
    }
  }

  function handleDuplicate() {
    duplicateForm.mutate(form.id, {
      onSuccess: (copy) => {
        toast.success("Form duplicated");
        router.push(`/forms/${copy.id}`);
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't duplicate"),
    });
  }

  function handleDelete() {
    deleteForm.mutate(form.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("Form deleted");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Couldn't delete the form");
      },
    });
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={goToBuilder}
        onKeyDown={(e) => {
          if (e.key === "Enter") goToBuilder();
        }}
        className="group relative cursor-pointer gap-3 p-4 transition-colors hover:border-foreground/20 hover:shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <StatusPill status={form.status} />
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="-mr-1.5 -mt-1.5">
                    <MoreVerticalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}`)}>
                  <PencilIcon /> Open builder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/results`)}>
                  <BarChart3Icon /> View results
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <PencilIcon /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <CopyIcon /> Duplicate
                </DropdownMenuItem>
                {published && (
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <LinkIcon /> Copy share link
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleTogglePublish}>
                  {published ? "Unpublish" : "Publish"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2Icon /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug">{form.title}</h3>

        <p className="text-sm text-muted-foreground">
          {form.response_count} {form.response_count === 1 ? "response" : "responses"} · Updated{" "}
          {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
        </p>
      </Card>

      <RenameFormDialog
        formId={form.id}
        currentTitle={form.title}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this form?"
        description={`"${form.title}" and all of its responses will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteForm.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
