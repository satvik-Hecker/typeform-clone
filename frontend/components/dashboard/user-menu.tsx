"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEMO_USER = { name: "Demo User", email: "demo@email.com" };

export function UserMenu() {
  const initials = DEMO_USER.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
            aria-label="Account menu"
          >
            {initials}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5 px-1 py-1">
          <span className="text-sm font-medium text-foreground">{DEMO_USER.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{DEMO_USER.email}</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
