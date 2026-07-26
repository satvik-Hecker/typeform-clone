"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateForm } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";

interface RenameFormDialogProps {
  formId: number;
  currentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameFormDialog({ formId, currentTitle, open, onOpenChange }: RenameFormDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const updateForm = useUpdateForm(formId);

  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || trimmed === currentTitle) {
      onOpenChange(false);
      return;
    }

    updateForm.mutate(
      { title: trimmed },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success("Form renamed");
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Couldn't rename the form");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename form</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5 py-4">
            <Label htmlFor="rename-title">Title</Label>
            <Input id="rename-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || updateForm.isPending}>
              {updateForm.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
