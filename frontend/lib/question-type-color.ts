import type { QuestionType } from "./types";

/** Every question type gets a fixed, distinct color — used for its icon badge everywhere it appears. */
export const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  short_text: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  long_text: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  multiple_choice: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  dropdown: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  email: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  number: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  yes_no: "bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  rating: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
};
