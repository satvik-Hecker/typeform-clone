"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "workspace-name";
const DEFAULT_NAME = "My workspace";

export function WorkspaceTitle() {
  const [name, setName] = useState(DEFAULT_NAME);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setName(stored);
  }, []);

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(DEFAULT_NAME);
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_NAME);
      return;
    }
    setName(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  }

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-heading text-xl font-bold tracking-tight outline-none hover:border-border focus:border-border focus:bg-muted/50"
      style={{ width: `${Math.max(name.length, 8)}ch` }}
      aria-label="Workspace name"
    />
  );
}
