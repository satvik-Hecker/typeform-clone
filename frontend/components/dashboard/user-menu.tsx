"use client";

const DEMO_USER = { name: "Demo User", email: "demo@email.com" };

export function UserMenu() {
  const initials = DEMO_USER.name
    .split(" ")
    .map((p) => p[0])
    .join("");

  return (
    <div className="group relative ml-1">
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {/* pt-2 (not a margin on the panel) keeps the hover area continuous between the avatar and the panel */}
      <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
        <div className="flex flex-col gap-0.5 rounded-lg bg-popover p-3 shadow-md ring-1 ring-foreground/10">
          <span className="text-sm font-medium text-foreground">{DEMO_USER.name}</span>
          <span className="text-xs text-muted-foreground">{DEMO_USER.email}</span>
        </div>
      </div>
    </div>
  );
}
