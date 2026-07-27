import { CHOICE_QUESTION_TYPES, type AnswerSubmitPayload, type Question } from "./types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isAnswerEmpty(question: Question, value: AnswerSubmitPayload): boolean {
  if (CHOICE_QUESTION_TYPES.includes(question.type)) return value.selected_option_id == null;
  if (question.type === "yes_no") return value.value_bool == null;
  if (question.type === "number" || question.type === "rating") return value.value_number == null;
  return !value.value_text || value.value_text.trim() === "";
}

/** Mirrors backend/app/validation.py so the respondent gets the same feedback instantly. */
export function validateAnswer(question: Question, value: AnswerSubmitPayload): string | null {
  if (isAnswerEmpty(question, value)) {
    return question.required ? "This question is required" : null;
  }

  if (question.type === "email" && !EMAIL_RE.test(value.value_text ?? "")) {
    return "Please enter a valid email address";
  }

  if (question.type === "number" || question.type === "rating") {
    const v = value.value_number as number;
    if (question.min_value != null && v < question.min_value) {
      return `Value must be at least ${question.min_value}`;
    }
    if (question.max_value != null && v > question.max_value) {
      return `Value must be at most ${question.max_value}`;
    }
  }

  return null;
}

/** Format-only validation for the builder canvas preview — skips the "required" nag since nothing's being submitted. */
export function previewValidate(question: Question, value: AnswerSubmitPayload): string | null {
  if (isAnswerEmpty(question, value)) return null;
  return validateAnswer(question, value);
}
