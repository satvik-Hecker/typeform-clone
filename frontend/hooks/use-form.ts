import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FormUpdatePayload, QuestionCreatePayload, QuestionUpdatePayload } from "@/lib/types";
import { formsKey } from "./use-forms";

export function formKey(formId: number) {
  return [...formsKey, formId] as const;
}

export function useFormQuery(formId: number) {
  return useQuery({
    queryKey: formKey(formId),
    queryFn: () => api.forms.get(formId),
    enabled: Number.isFinite(formId),
  });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  });
}

export function useUpdateQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: number; payload: QuestionUpdatePayload }) =>
      api.questions.update(formId, questionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  });
}

export function useDeleteQuestion(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: number) => api.questions.remove(formId, questionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  });
}

export function useReorderQuestions(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => api.questions.reorder(formId, orderedIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formKey(formId) }),
  });
}
