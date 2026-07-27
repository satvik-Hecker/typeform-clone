import type { AnswerOut } from "./types";

type AnswerLike = Pick<AnswerOut, "value_text" | "value_number" | "value_bool" | "selected_option_label">;

export function formatAnswer(answer: AnswerLike, emptyLabel = "—"): string {
  if (answer.selected_option_label != null) return answer.selected_option_label;
  if (answer.value_bool != null) return answer.value_bool ? "Yes" : "No";
  if (answer.value_number != null) return String(answer.value_number);
  if (answer.value_text) return answer.value_text;
  return emptyLabel;
}
