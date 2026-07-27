"use client";

import { useEffect, useState } from "react";
import { CheckIcon, SparklesIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateForm } from "@/hooks/use-form";
import { ApiError } from "@/lib/api";
import { parseFormTheme, THEME_PRESETS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Form } from "@/lib/types";

interface DesignDialogProps {
  form: Form;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignDialog({ form, open, onOpenChange }: DesignDialogProps) {
  const updateForm = useUpdateForm(form.id);
  const [presetId, setPresetId] = useState(() => parseFormTheme(form.theme).preset ?? "");

  useEffect(() => {
    if (open) setPresetId(parseFormTheme(form.theme).preset ?? "");
  }, [open, form.theme]);

  function handleSave() {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    updateForm.mutate(
      {
        theme: preset ? JSON.stringify({ preset: preset.id, primaryColor: preset.accent }) : null,
      },
      {
        onSuccess: () => {
          toast.success("Design saved");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't save design"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Design</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="theme">
          <TabsList>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="brand-kit">Brand kit</TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="py-2">
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const active = presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetId(active ? "" : preset.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors hover:border-foreground/30",
                      active ? "border-foreground ring-1 ring-foreground" : "border-border"
                    )}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                    <span
                      className="size-6 rounded-full"
                      style={{ backgroundColor: preset.accent }}
                      aria-hidden
                    />
                    <span className="font-heading text-sm font-semibold">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">{preset.vibe}</span>
                    <span className="text-[0.7rem] text-muted-foreground/70">
                      {preset.headingLabel === preset.bodyLabel
                        ? preset.headingLabel
                        : `${preset.headingLabel} / ${preset.bodyLabel}`}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Applied to headings, body text, and the progress bar / answer highlights in the respondent view.
            </p>
          </TabsContent>

          <TabsContent value="brand-kit" className="py-2">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SparklesIcon className="size-4" />
                Logo, brand colors & custom fonts
              </div>
              <Badge variant="outline">Coming soon</Badge>
            </div>
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
