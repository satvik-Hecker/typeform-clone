import type {
  AnswerSubmitPayload,
  Form,
  FormCreatePayload,
  FormListItem,
  FormSummary,
  FormUpdatePayload,
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  ResponseDetail,
  ResponseListItem,
  ResponseStartOut,
} from "./types";

// Falls back to the deployed backend when running anywhere other than localhost, so a missing
// (not just misconfigured) NEXT_PUBLIC_API_URL on Vercel doesn't silently point at 127.0.0.1.
// An explicit NEXT_PUBLIC_API_URL — local or on Vercel — always takes precedence over this.
function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (typeof window !== "undefined" && !isLocalhost) {
    return "https://typeform-clone-backend-sh77.onrender.com/api";
  }
  return "http://127.0.0.1:8000/api";
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // no JSON body to read the detail from — keep statusText
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  forms: {
    list: () => request<FormListItem[]>("/forms"),
    get: (id: number) => request<Form>(`/forms/${id}`),
    create: (payload: FormCreatePayload) =>
      request<Form>("/forms", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: FormUpdatePayload) =>
      request<Form>(`/forms/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    remove: (id: number) => request<void>(`/forms/${id}`, { method: "DELETE" }),
    duplicate: (id: number) => request<Form>(`/forms/${id}/duplicate`, { method: "POST" }),
    publish: (id: number) => request<Form>(`/forms/${id}/publish`, { method: "POST" }),
    unpublish: (id: number) => request<Form>(`/forms/${id}/unpublish`, { method: "POST" }),
  },

  questions: {
    create: (formId: number, payload: QuestionCreatePayload) =>
      request<Question>(`/forms/${formId}/questions`, { method: "POST", body: JSON.stringify(payload) }),
    update: (formId: number, questionId: number, payload: QuestionUpdatePayload) =>
      request<Question>(`/forms/${formId}/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    remove: (formId: number, questionId: number) =>
      request<void>(`/forms/${formId}/questions/${questionId}`, { method: "DELETE" }),
    reorder: (formId: number, orderedIds: number[]) =>
      request<Question[]>(`/forms/${formId}/questions/reorder`, {
        method: "PUT",
        body: JSON.stringify({ ordered_ids: orderedIds }),
      }),
  },

  responses: {
    list: (formId: number) => request<ResponseListItem[]>(`/forms/${formId}/responses`),
    get: (formId: number, responseId: number) =>
      request<ResponseDetail>(`/forms/${formId}/responses/${responseId}`),
    summary: (formId: number) => request<FormSummary>(`/forms/${formId}/summary`),
    exportCsvUrl: (formId: number) => `${API_URL}/forms/${formId}/responses/export`,
  },

  public: {
    getForm: (slug: string) => request<Form>(`/public/forms/${slug}`),
    startResponse: (slug: string) =>
      request<ResponseStartOut>(`/public/forms/${slug}/responses`, { method: "POST" }),
    upsertAnswer: (responseId: number, questionId: number, payload: AnswerSubmitPayload) =>
      request<void>(`/public/responses/${responseId}/answers/${questionId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    submit: (responseId: number) =>
      request<{ thank_you_message: string }>(`/public/responses/${responseId}/submit`, { method: "POST" }),
  },
};
