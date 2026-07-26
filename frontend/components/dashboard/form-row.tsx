"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FileTextIcon } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/status-pill";
import { FormActionsMenu } from "@/components/dashboard/form-actions-menu";
import { formIconColor } from "@/lib/form-icon-color";
import { cn } from "@/lib/utils";
import type { FormListItem } from "@/lib/types";

export function FormRow({ form }: { form: FormListItem }) {
  const router = useRouter();

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(`/forms/${form.id}`)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", formIconColor(form.id))}>
            <FileTextIcon className="size-4" />
          </div>
          <span className="font-medium">{form.title}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusPill status={form.status} />
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">{form.response_count}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDistanceToNow(new Date(form.updated_at), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right">
        <FormActionsMenu form={form} />
      </TableCell>
    </TableRow>
  );
}
