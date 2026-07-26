import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePublicFormQuery(slug: string) {
  return useQuery({
    queryKey: ["public-forms", slug] as const,
    queryFn: () => api.public.getForm(slug),
    retry: false,
  });
}
