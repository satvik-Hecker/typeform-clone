"use client";

import { CreditCardIcon, GitBranchIcon, PlugZapIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FormSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormSettingsDialog({ open, onOpenChange }: FormSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Form settings</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          The welcome and thank-you screens are now pages in your question list (left panel) — edit their text
          right in the canvas like any other page.
        </p>

        <div className="space-y-2 py-2">
          <ComingSoonRow icon={GitBranchIcon} label="Logic jumps / branching" />
          <ComingSoonRow icon={PlugZapIcon} label="Integrations & webhooks" />
          <ComingSoonRow icon={UsersIcon} label="Team collaboration & sharing" />
          <ComingSoonRow icon={CreditCardIcon} label="Payment & file-upload questions" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComingSoonRow({ icon: Icon, label }: { icon: typeof GitBranchIcon; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <Badge variant="outline">Coming soon</Badge>
    </div>
  );
}
