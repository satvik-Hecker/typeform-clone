"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.map((r, i) => (
          <TableRow key={r.id} className="cursor-pointer" onClick={() => onSelect(r.id)}>
            <TableCell className="text-muted-foreground">{responses.length - i}</TableCell>
            <TableCell>{format(new Date(r.started_at), "MMM d, yyyy h:mm a")}</TableCell>
            <TableCell>{r.submitted_at ? format(new Date(r.submitted_at), "MMM d, yyyy h:mm a") : "—"}</TableCell>
            <TableCell>
              {r.is_complete ? (
                <Badge className="border-emerald-600/30 bg-emerald-50 text-emerald-700" variant="outline">
                  Complete
                </Badge>
              ) : (
                <Badge variant="outline">Partial</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
