"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAnswer } from "@/lib/format-answer";
import { QUESTION_TYPE_COLORS } from "@/lib/question-type-color";
import { QUESTION_TYPE_ICONS } from "@/lib/question-type-icons";
import { cn } from "@/lib/utils";
import type { ResponseListItem } from "@/lib/types";

interface ResponseTableProps {
  responses: ResponseListItem[];
  onSelect: (responseId: number) => void;
}

export function ResponseTable({ responses, onSelect }: ResponseTableProps) {
  if (responses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No responses yet — share the published link to start collecting them.
      </p>
    );
  }

  // Every response was answered against the same question set, so the first row's answers
  // (in question order) double as the column list. Guard against an older cached shape (or a
  // stale backend) that doesn't have `answers` yet, rather than crashing the whole page.
  const columns = responses[0]?.answers ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap align-top">Response</TableHead>
            <TableHead className="whitespace-nowrap align-top">Status</TableHead>
            {columns.map((col) => {
              const Icon = QUESTION_TYPE_ICONS[col.question_type];
              return (
                <TableHead key={col.question_id} className="min-w-[170px] max-w-[260px] align-top">
                  <div className="flex items-start gap-2 font-medium text-foreground">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md",
                        QUESTION_TYPE_COLORS[col.question_type]
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="line-clamp-2 whitespace-normal">{col.question_title}</span>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => onSelect(r.id)}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {format(new Date(r.submitted_at ?? r.started_at), "d MMM yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {r.is_complete ? (
                  <Badge className="border-emerald-600/30 bg-emerald-50 text-emerald-700" variant="outline">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline">Partial</Badge>
                )}
              </TableCell>
              {(r.answers ?? []).map((answer) => (
                <TableCell key={answer.question_id} className="max-w-[260px] truncate">
                  {formatAnswer(answer)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
