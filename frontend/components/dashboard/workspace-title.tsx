"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceTitleProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  /** Size the input to its text content (used for the large page title). Sidebar rows use w-full instead. */
  autoWidth?: boolean;
}

/** Inline-editable workspace name field — reused at large size (page title) and small size (sidebar row). */
export function WorkspaceTitle({ value, onCommit, className, autoWidth = true }: WorkspaceTitleProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onCommit(draft);
  }

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={cn(
        "min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 outline-none hover:border-border focus:border-border focus:bg-muted/50",
        className
      )}
      style={autoWidth ? { width: `${Math.max(draft.length + 1, 8)}ch` } : undefined}
      aria-label="Workspace name"
    />
  );
}
