"use client";

import { useState } from "react";
import { EyeIcon, MonitorIcon, PaletteIcon, SettingsIcon, SmartphoneIcon } from "lucide-react";

import { AddQuestionMenu } from "@/components/builder/add-question-menu";
import { FormSettingsDialog } from "@/components/builder/form-settings-dialog";
import { LivePreviewModal } from "@/components/builder/live-preview-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Form } from "@/lib/types";

interface BuilderToolbarProps {
  form: Form;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  onQuestionCreated: (questionId: number) => void;
}

export function BuilderToolbar({ form, device, onDeviceChange, onQuestionCreated }: BuilderToolbarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"general" | "welcome" | "theme" | "coming-soon" | null>(null);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
      <AddQuestionMenu formId={form.id} onCreated={onQuestionCreated} />

      <Button variant="ghost" size="sm" onClick={() => setSettingsTab("theme")}>
        <PaletteIcon /> Design
      </Button>

      <div className="mx-1 flex items-center rounded-lg border p-0.5">
        <button
          type="button"
          onClick={() => onDeviceChange("desktop")}
          className={cn("rounded-md p-1.5", device === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground")}
          aria-label="Desktop preview"
        >
          <MonitorIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDeviceChange("mobile")}
          className={cn("rounded-md p-1.5", device === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground")}
          aria-label="Mobile preview"
        >
          <SmartphoneIcon className="size-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
          <EyeIcon /> Preview
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setSettingsTab("general")} aria-label="Form settings">
          <SettingsIcon />
        </Button>
      </div>

      <LivePreviewModal form={form} open={previewOpen} onOpenChange={setPreviewOpen} />
      {settingsTab && (
        <FormSettingsDialog
          form={form}
          open
          onOpenChange={(open) => !open && setSettingsTab(null)}
          defaultTab={settingsTab}
        />
      )}
    </div>
  );
}
