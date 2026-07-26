"use client";

import { BookTypeIcon, PlugZapIcon } from "lucide-react";

import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { comingSoon } from "@/lib/coming-soon";

export function DashboardTopBar() {
  return (
    <header className="mx-auto flex h-14 w-full max-w-[1600px] shrink-0 items-center justify-between rounded-2xl border bg-background px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <BookTypeIcon className="size-6" />
        <span className="font-heading text-sm font-semibold">TypeForm</span>
      </div>

      <nav className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => comingSoon("Integrations", PlugZapIcon)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PlugZapIcon className="size-4" /> Integrations
        </button>
        <ThemeToggle />
        <UserMenu />
      </nav>
    </header>
  );
}
