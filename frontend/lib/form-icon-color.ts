const PALETTE = [
  "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  "bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
];

/** Deterministic color per form (by id), purely decorative — matches the same form every render. */
export function formIconColor(id: number): string {
  return PALETTE[id % PALETTE.length];
}
