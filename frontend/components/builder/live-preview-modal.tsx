"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RespondentFlow } from "@/components/respondent/respondent-flow";
import type { Form } from "@/lib/types";

interface LivePreviewModalProps {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LivePreviewModal({ form, open, onOpenChange }: LivePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="h-[85vh] max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
        {open && <RespondentFlow form={form} mode="preview" onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
