import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formKey } from "./use-form";

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
