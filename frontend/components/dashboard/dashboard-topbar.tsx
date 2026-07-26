"use client";

import { HelpCircleIcon, PlugZapIcon, SwatchBookIcon } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/shared/theme-toggle";

const CREATOR_NAME = "Mehul Sharma";

function comingSoon(feature: string) {
  toast.message(`${feature} — coming soon`);
}

export function DashboardTopBar() {
  const initials = CREATOR_NAME.split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
          T
        </div>
        <span className="font-heading text-sm font-semibold">Typeform Clone</span>
      </div>

      <nav className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => comingSoon("Integrations")}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PlugZapIcon className="size-4" /> Integrations
        </button>
        <button
          type="button"
          onClick={() => comingSoon("Brand kit")}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <SwatchBookIcon className="size-4" /> Brand kit
        </button>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => comingSoon("Help center")}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <HelpCircleIcon className="size-4" />
        </button>
        <div
          className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          title={CREATOR_NAME}
        >
          {initials}
        </div>
      </nav>
    </header>
  );
}
