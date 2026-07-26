"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CreateFormDialog({ triggerClassName }: { triggerClassName?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const router = useRouter();
  const createForm = useCreateForm();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createForm.mutate(
      { title: trimmed },
      {
        onSuccess: (form) => {
          setOpen(false);
          setTitle("");
          toast.success("Form created");
          router.push(`/forms/${form.id}`);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Couldn't create the form");
        },
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTitle("");
      }}
    >
      <DialogTrigger
        render={
          <Button className={cn(triggerClassName)}>
            <PlusIcon />
            Create form
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new form</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5 py-4">
            <Label htmlFor="form-title">Title</Label>
            <Input
              id="form-title"
              autoFocus
              placeholder="Customer Feedback Survey"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || createForm.isPending}>
              {createForm.isPending ? "Creating…" : "Create form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
