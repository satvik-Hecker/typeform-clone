"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FileTextIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/status-pill";
import { FormActionsMenu } from "@/components/dashboard/form-actions-menu";
import { formIconColor } from "@/lib/form-icon-color";
import { cn } from "@/lib/utils";
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
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", formIconColor(form.id))}>
          <FileTextIcon className="size-4" />
        </div>
        <div className="-mr-1.5 -mt-1.5">
          <FormActionsMenu form={form} />
        </div>
      </div>

      <div>
        <StatusPill status={form.status} />
        <h3 className="mt-1.5 line-clamp-2 font-heading text-lg font-semibold leading-snug">{form.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        {form.response_count} {form.response_count === 1 ? "response" : "responses"} · Updated{" "}
        {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
      </p>
    </Card>
  );
}
