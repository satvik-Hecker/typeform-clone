"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { FormActionsMenu } from "@/components/dashboard/form-actions-menu";
import type { FormListItem } from "@/lib/types";

export function FormCard({ form }: { form: FormListItem }) {
  const router = useRouter();

  function goToBuilder() {
    router.push(`/forms/${form.id}`);
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goToBuilder}
      onKeyDown={(e) => {
        if (e.key === "Enter") goToBuilder();
      }}
      className="group relative cursor-pointer gap-3 p-4 transition-colors hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusPill status={form.status} />
        <div className="-mr-1.5 -mt-1.5">
          <FormActionsMenu form={form} />
        </div>
      </div>

      <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug">{form.title}</h3>

      <p className="text-sm text-muted-foreground">
        {form.response_count} {form.response_count === 1 ? "response" : "responses"} · Updated{" "}
        {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
      </p>
    </Card>
  );
}
