import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Form, FormUpdatePayload, Question, QuestionCreatePayload, QuestionUpdatePayload } from "@/lib/types";
import { formsKey } from "./use-forms";

export function formKey(formId: number) {
  return [...formsKey, formId] as const;
}

function patchQuestionsInCache(
  old: Form | undefined,
  questionId: number,
  updater: (question: Question) => Question
): Form | undefined {
  if (!old) return old;
  return { ...old, questions: old.questions.map((q) => (q.id === questionId ? updater(q) : q)) };
}

export function useFormQuery(formId: number) {
  return useQuery({
    queryKey: formKey(formId),
    queryFn: () => api.forms.get(formId),
    enabled: Number.isFinite(formId),
  });
}

/**
 * Writes a local-only patch straight into the cached form so every consumer (settings panel, canvas,
 * sidebar) reflects an edit the instant it happens, without waiting on the debounced network save.
 * The eventual mutation response (or a background refetch) reconciles the cache with the server.
 */
export function usePatchQuestionCache(formId: number) {
  const queryClient = useQueryClient();
  return useCallback(
    (questionId: number, patch: Partial<Question>) => {
      queryClient.setQueryData(formKey(formId), (old: Form | undefined) =>
        patchQuestionsInCache(old, questionId, (q) => ({ ...q, ...patch }))
      );
    },
    [formId, queryClient]
  );
}

export function useUpdateForm(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormUpdatePayload) => api.forms.update(formId, payload),
    onSuccess: (form) => {
      queryClient.setQueryData(formKey(formId), form);
      queryClient.invalidateQueries({ queryKey: formsKey });
    },
  });
}

export function useCreateQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuestionCreatePayload) => api.questions.create(formId, payload),
    onSuccess: (question) => {
      queryClient.setQueryData(formKey(formId), (old: Form | undefined) =>
        old ? { ...old, questions: [...old.questions, question] } : old
      );
      queryClient.invalidateQueries({ queryKey: formKey(formId) });
    },
  });
}

export function useUpdateQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: number; payload: QuestionUpdatePayload }) =>
      api.questions.update(formId, questionId, payload),
    onSuccess: (question) => {
      queryClient.setQueryData(formKey(formId), (old: Form | undefined) =>
        patchQuestionsInCache(old, question.id, () => question)
      );
      queryClient.invalidateQueries({ queryKey: formKey(formId) });
    },
  });
}

export function useDeleteQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => api.questions.remove(formId, questionId),
    onSuccess: (_data, questionId) => {
      queryClient.setQueryData(formKey(formId), (old: Form | undefined) =>
        old ? { ...old, questions: old.questions.filter((q) => q.id !== questionId) } : old
      );
      queryClient.invalidateQueries({ queryKey: formKey(formId) });
    },
  });
}

export function useReorderQuestions(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => api.questions.reorder(formId, orderedIds),
    onSuccess: (questions) => {
      queryClient.setQueryData(formKey(formId), (old: Form | undefined) => (old ? { ...old, questions } : old));
      queryClient.invalidateQueries({ queryKey: formKey(formId) });
    },
  });
}
