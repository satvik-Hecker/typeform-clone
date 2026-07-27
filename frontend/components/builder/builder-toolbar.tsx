"use client";

import { useState } from "react";
import { LanguagesIcon, MonitorIcon, PaletteIcon, PlayIcon, SettingsIcon, SmartphoneIcon } from "lucide-react";

import { AddQuestionMenu } from "@/components/builder/add-question-menu";
import { DesignDialog } from "@/components/builder/design-dialog";
import { FormSettingsDialog } from "@/components/builder/form-settings-dialog";
import { LivePreviewModal } from "@/components/builder/live-preview-modal";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { comingSoon } from "@/lib/coming-soon";
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
  const [designOpen, setDesignOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
      <AddQuestionMenu formId={form.id} onCreated={onQuestionCreated} />

      <Separator orientation="vertical" className="mt-2 h-8" />

      <Button variant="ghost" size="sm" onClick={() => setDesignOpen(true)}>
        <PaletteIcon /> Design
      </Button>

      <Separator orientation="vertical" className="mt-2 h-8" />

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border p-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onDeviceChange("desktop")}
                  className={cn(
                    "rounded-md p-1.5",
                    device === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground"
                  )}
                  aria-label="Desktop preview"
                >
                  <MonitorIcon className="size-4" />
                </button>
              }
            />
            <TooltipContent>Desktop preview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onDeviceChange("mobile")}
                  className={cn(
                    "rounded-md p-1.5",
                    device === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground"
                  )}
                  aria-label="Mobile preview"
                >
                  <SmartphoneIcon className="size-4" />
                </button>
              }
            />
            <TooltipContent>Mobile preview</TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={() => setPreviewOpen(true)} aria-label="Preview">
                <PlayIcon />
              </Button>
            }
          />
          <TooltipContent>Preview</TooltipContent>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Separator orientation="vertical" className="h-8" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => comingSoon("Translations", LanguagesIcon)}
                aria-label="Translations"
              >
                <LanguagesIcon />
              </Button>
            }
          />
          <TooltipContent>Translations — coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)} aria-label="Form settings">
                <SettingsIcon />
              </Button>
            }
          />
          <TooltipContent>Form settings</TooltipContent>
        </Tooltip>
      </div>

      <LivePreviewModal form={form} open={previewOpen} onOpenChange={setPreviewOpen} />
      <DesignDialog form={form} open={designOpen} onOpenChange={setDesignOpen} />
      <FormSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
