"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3Icon, CopyIcon, LinkIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RenameFormDialog } from "@/components/dashboard/rename-form-dialog";
import { useDeleteForm, useDuplicateForm, usePublishForm, useUnpublishForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import type { FormListItem } from "@/lib/types";

/** The kebab menu + its rename/delete dialogs, shared by the grid card and table row. */
export function FormActionsMenu({ form }: { form: FormListItem }) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const duplicateForm = useDuplicateForm();
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const deleteForm = useDeleteForm();

  const published = form.status === "published";

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
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
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
    </div>
  );
}
