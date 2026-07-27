"use client";

import { useEffect, useState } from "react";
import { CreditCardIcon, GitBranchIcon, PlugZapIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateForm } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import type { Form } from "@/lib/types";

interface FormSettingsDialogProps {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "general" | "welcome" | "coming-soon";
}

export function FormSettingsDialog({ form, open, onOpenChange, defaultTab = "general" }: FormSettingsDialogProps) {
  const updateForm = useUpdateForm(form.id);
  const [thankYouMessage, setThankYouMessage] = useState(form.thank_you_message);
  const [welcomeTitle, setWelcomeTitle] = useState(form.welcome_title ?? "");
  const [welcomeDescription, setWelcomeDescription] = useState(form.welcome_description ?? "");

  useEffect(() => {
    if (open) {
      setThankYouMessage(form.thank_you_message);
      setWelcomeTitle(form.welcome_title ?? "");
      setWelcomeDescription(form.welcome_description ?? "");
    }
  }, [open, form.thank_you_message, form.welcome_title, form.welcome_description]);

  function handleSave() {
    updateForm.mutate(
      {
        thank_you_message: thankYouMessage.trim() || "Thanks for completing this form!",
        welcome_title: welcomeTitle.trim() || null,
        welcome_description: welcomeDescription.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save settings"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Form settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="welcome">Welcome screen</TabsTrigger>
            <TabsTrigger value="coming-soon">Coming soon</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-1.5 py-2">
            <Label htmlFor="thank-you-message">Thank-you message</Label>
            <Textarea
              id="thank-you-message"
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Shown after a respondent submits this form.</p>
          </TabsContent>

          <TabsContent value="welcome" className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="welcome-title">Welcome title</Label>
              <Input
                id="welcome-title"
                placeholder="Leave blank to skip straight to question 1"
                value={welcomeTitle}
                onChange={(e) => setWelcomeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="welcome-description">Welcome description</Label>
              <Textarea
                id="welcome-description"
                placeholder="Optional"
                value={welcomeDescription}
                onChange={(e) => setWelcomeDescription(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Shown before question 1, with a &ldquo;Let&apos;s go&rdquo; button. Leave the title empty to skip it.
            </p>
          </TabsContent>

          <TabsContent value="coming-soon" className="space-y-3 py-2">
            <ComingSoonRow icon={GitBranchIcon} label="Logic jumps / branching" />
            <ComingSoonRow icon={PlugZapIcon} label="Integrations & webhooks" />
            <ComingSoonRow icon={UsersIcon} label="Team collaboration & sharing" />
            <ComingSoonRow icon={CreditCardIcon} label="Payment & file-upload questions" />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave} disabled={updateForm.isPending}>
            {updateForm.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
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
