import type { AnswerSubmitPayload, Question } from "./types";

const SAMPLE_NAMES = ["Alex Rivera", "Priya Patel", "Sam Okafor", "Jordan Lee", "Morgan Chen"];
const SAMPLE_SENTENCES = [
  "This was a great experience overall.",
  "I really appreciate the attention to detail here.",
  "Looking forward to seeing what comes next!",
  "Everything worked smoothly for me.",
  "Nothing to add, it covered exactly what I needed.",
];

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/** A plausible random answer per question type, used by "Generate test response". */
export function generateTestAnswer(question: Question): AnswerSubmitPayload {
  switch (question.type) {
    case "short_text":
      return { value_text: randomFrom(SAMPLE_NAMES) };
    case "long_text":
      return { value_text: randomFrom(SAMPLE_SENTENCES) };
    case "email": {
      const slug = randomFrom(SAMPLE_NAMES).toLowerCase().replace(" ", ".");
      return { value_text: `${slug}@example.com` };
    }
    case "number":
      return { value_number: randomInt(question.min_value ?? 0, question.max_value ?? 100) };
    case "rating":
      return { value_number: randomInt(question.min_value ?? 1, question.max_value ?? 5) };
    case "yes_no":
      return { value_bool: Math.random() < 0.5 };
    case "multiple_choice":
    case "dropdown":
      return question.options.length > 0 ? { selected_option_id: randomFrom(question.options).id } : {};
    default:
      return {};
  }
}
