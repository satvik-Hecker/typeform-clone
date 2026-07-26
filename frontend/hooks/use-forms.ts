import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FormCreatePayload } from "@/lib/types";

export const formsKey = ["forms"] as const;

export function useFormsQuery() {
  return useQuery({
    queryKey: formsKey,
    queryFn: api.forms.list,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormCreatePayload) => api.forms.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formsKey }),
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.forms.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formsKey }),
  });
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.forms.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: formsKey }),
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.forms.publish(id),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: formsKey });
      queryClient.invalidateQueries({ queryKey: [...formsKey, form.id] });
    },
  });
}

export function useUnpublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.forms.unpublish(id),
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: formsKey });
      queryClient.invalidateQueries({ queryKey: [...formsKey, form.id] });
    },
  });
}
