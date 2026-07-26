// Mirrors backend/app/schemas.py and models.py. Keep in sync with the API.

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export type FormStatus = "draft" | "published";

export interface QuestionOption {
  id: number;
  label: string;
  order_index: number;
}

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order_index: number;
  placeholder: string | null;
  min_value: number | null;
  max_value: number | null;
  options: QuestionOption[];
}

export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
}

export interface Form {
  id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  slug: string;
  thank_you_message: string;
  theme: string | null; // JSON-encoded FormTheme
  created_at: string;
  updated_at: string;
  published_at: string | null;
  questions: Question[];
}

export interface FormListItem {
  id: number;
  title: string;
  status: FormStatus;
  slug: string;
  response_count: number;
  created_at: string;
  updated_at: string;
}

// ---- Mutation payloads ----

export interface FormCreatePayload {
  title: string;
  description?: string | null;
}

export interface FormUpdatePayload {
  title?: string;
  description?: string | null;
  thank_you_message?: string;
  theme?: string | null;
}

export interface QuestionOptionInPayload {
  label: string;
  order_index: number;
}

export interface QuestionCreatePayload {
  type: QuestionType;
  title: string;
  description?: string | null;
  required?: boolean;
  order_index?: number | null;
  placeholder?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  options?: QuestionOptionInPayload[];
}

export interface QuestionUpdatePayload {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  required?: boolean;
  placeholder?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  options?: QuestionOptionInPayload[];
}

// ---- Respondent flow ----

export interface ResponseStartOut {
  response_id: number;
}

export interface AnswerSubmitPayload {
  value_text?: string | null;
  value_number?: number | null;
  value_bool?: boolean | null;
  selected_option_id?: number | null;
}

export interface AnswerOut {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  selected_option_label: string | null;
}

export interface ResponseListItem {
  id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
}

export interface ResponseDetail {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
  answers: AnswerOut[];
}

// ---- Summary stats ----

export interface ChoiceCount {
  label: string;
  count: number;
}

export interface QuestionSummary {
  question_id: number;
  title: string;
  type: QuestionType;
  answered_count: number;
  choice_counts: ChoiceCount[] | null;
  true_count: number | null;
  false_count: number | null;
  average: number | null;
  min_value: number | null;
  max_value: number | null;
}

export interface FormSummary {
  form_id: number;
  total_responses: number;
  completed_responses: number;
  questions: QuestionSummary[];
}

// ---- UI metadata for question types (not from backend) ----

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  multiple_choice: "Multiple choice",
  dropdown: "Dropdown",
  email: "Email",
  number: "Number",
  yes_no: "Yes / No",
  rating: "Rating",
};

export const CHOICE_QUESTION_TYPES: QuestionType[] = ["multiple_choice", "dropdown"];
