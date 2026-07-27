import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { generateTestAnswer } from "@/lib/generate-test-answer";
import { formKey } from "./use-form";
import type { Form } from "@/lib/types";

export function useResponsesQuery(formId: number) {
  return useQuery({
    queryKey: [...formKey(formId), "responses"] as const,
    queryFn: () => api.responses.list(formId),
    enabled: Number.isFinite(formId),
  });
}

export function useResponseQuery(formId: number, responseId: number | null) {
  return useQuery({
    queryKey: [...formKey(formId), "responses", responseId] as const,
    queryFn: () => api.responses.get(formId, responseId as number),
    enabled: Number.isFinite(formId) && responseId !== null,
  });
}

export function useSummaryQuery(formId: number) {
  return useQuery({
    queryKey: [...formKey(formId), "summary"] as const,
    queryFn: () => api.responses.summary(formId),
    enabled: Number.isFinite(formId),
  });
}

/** Fills out and submits a form exactly like a respondent would, via the public API, with
 * plausible random answers — so a creator can see what results look like before sharing. */
export function useGenerateTestResponse(formId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: Form) => {
      const { response_id } = await api.public.startResponse(form.slug);
      const answerable = form.questions.filter((q) => q.type !== "welcome" && q.type !== "thank_you");
      for (const question of answerable) {
        const payload = generateTestAnswer(question);
        if (Object.keys(payload).length === 0) continue;
        await api.public.upsertAnswer(response_id, question.id, payload);
      }
      await api.public.submit(response_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...formKey(formId), "responses"] });
      queryClient.invalidateQueries({ queryKey: [...formKey(formId), "summary"] });
    },
  });
}
