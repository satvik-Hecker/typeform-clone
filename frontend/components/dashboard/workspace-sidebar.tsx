"use client";

import { FolderKanbanIcon, PlusIcon, TrendingUpIcon } from "lucide-react";

import { CreateFormDialog } from "@/components/dashboard/create-form-dialog";
import { Button } from "@/components/ui/button";
import { comingSoon } from "@/lib/coming-soon";

const RESPONSE_SOFT_CAP = 50;

export function WorkspaceSidebar({ totalResponses }: { totalResponses: number }) {
  const progress = Math.min(100, (totalResponses / RESPONSE_SOFT_CAP) * 100);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r p-4">
      <CreateFormDialog triggerClassName="w-full justify-center" />

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted-foreground">Workspaces</span>
          <button
            type="button"
            onClick={() => comingSoon("Multiple workspaces", FolderKanbanIcon)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Add workspace"
          >
            <PlusIcon className="size-3.5" />
          </button>
        </div>
        <div className="rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium">My workspace</div>
      </div>

      <div className="mt-auto space-y-2 border-t pt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <TrendingUpIcon className="size-3.5" />
          Responses collected
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{totalResponses} collected</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => comingSoon("Increasing your response limit", TrendingUpIcon)}
        >
          Increase response limit
        </Button>
      </div>
    </aside>
  );
}
