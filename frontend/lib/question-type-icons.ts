import {
  AlignLeftIcon,
  CaseSensitiveIcon,
  ChevronDownSquareIcon,
  CircleCheckIcon,
  HashIcon,
  MailIcon,
  StarIcon,
  ToggleLeftIcon,
  type LucideIcon,
} from "lucide-react";
import type { QuestionType } from "./types";

export const QUESTION_TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  short_text: CaseSensitiveIcon,
  long_text: AlignLeftIcon,
  multiple_choice: CircleCheckIcon,
  dropdown: ChevronDownSquareIcon,
  email: MailIcon,
  number: HashIcon,
  yes_no: ToggleLeftIcon,
  rating: StarIcon,
};
