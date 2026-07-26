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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateForm } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { parseFormTheme } from "@/lib/theme";
import type { Form } from "@/lib/types";

const PRESET_COLORS = ["#171717", "#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706"];

interface FormSettingsDialogProps {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "general" | "theme" | "coming-soon";
}

export function FormSettingsDialog({ form, open, onOpenChange, defaultTab = "general" }: FormSettingsDialogProps) {
  const updateForm = useUpdateForm(form.id);
  const [thankYouMessage, setThankYouMessage] = useState(form.thank_you_message);
  const [primaryColor, setPrimaryColor] = useState(parseFormTheme(form.theme).primaryColor ?? "");

  useEffect(() => {
    if (open) {
      setThankYouMessage(form.thank_you_message);
      setPrimaryColor(parseFormTheme(form.theme).primaryColor ?? "");
    }
  }, [open, form.thank_you_message, form.theme]);

  function handleSave() {
    updateForm.mutate(
      {
        thank_you_message: thankYouMessage.trim() || "Thanks for completing this form!",
        theme: primaryColor ? JSON.stringify({ primaryColor }) : null,
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
            <TabsTrigger value="theme">Theme</TabsTrigger>
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

          <TabsContent value="theme" className="space-y-3 py-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPrimaryColor(color)}
                  className="size-8 rounded-full transition-transform hover:scale-105"
                  style={{
                    backgroundColor: color,
                    boxShadow: primaryColor === color ? `0 0 0 2px var(--background), 0 0 0 4px ${color}` : undefined,
                  }}
                  aria-label={color}
                />
              ))}
              <button
                type="button"
                onClick={() => setPrimaryColor("")}
                className="rounded-full border px-3 text-xs text-muted-foreground hover:bg-muted"
              >
                Default
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied to the progress bar and answer highlights in the respondent view.
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
