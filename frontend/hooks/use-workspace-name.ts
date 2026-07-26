import { useEffect, useState } from "react";

const STORAGE_KEY = "workspace-name";
const DEFAULT_NAME = "My workspace";

/**
 * There's no backend "workspace" entity (single-tenant, per the assignment's
 * placeholder allowance for multi-workspace/team features), so the name is
 * just persisted to localStorage. Lifted into a hook so every place that
 * displays/edits it (the page title, the sidebar) stays in sync.
 */
export function useWorkspaceName() {
  const [name, setNameState] = useState(DEFAULT_NAME);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setNameState(stored);
  }, []);

  function setName(next: string) {
    const trimmed = next.trim() || DEFAULT_NAME;
    setNameState(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  }

  return { name, setName };
}
