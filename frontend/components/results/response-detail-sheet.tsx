"use client";

import { format } from "date-fns";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useResponseQuery } from "@/hooks/use-results";

interface ResponseDetailSheetProps {
  formId: number;
  responseId: number | null;
  onOpenChange: (open: boolean) => void;
}

export function ResponseDetailSheet({ formId, responseId, onOpenChange }: ResponseDetailSheetProps) {
  const { data: response, isLoading } = useResponseQuery(formId, responseId);

  return (
    <Sheet open={responseId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Response detail</SheetTitle>
          {response && (
            <p className="text-xs text-muted-foreground">
              {response.is_complete ? "Submitted" : "Started"}{" "}
              {format(new Date(response.submitted_at ?? response.started_at), "MMM d, yyyy h:mm a")}
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 pb-6">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}

          {response?.answers.map((answer) => (
            <div key={answer.question_id}>
              <p className="text-sm font-medium">{answer.question_title}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                {formatAnswer(answer)}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatAnswer(answer: {
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  selected_option_label: string | null;
}): string {
  if (answer.selected_option_label != null) return answer.selected_option_label;
  if (answer.value_bool != null) return answer.value_bool ? "Yes" : "No";
  if (answer.value_number != null) return String(answer.value_number);
  if (answer.value_text) return answer.value_text;
  return "No answer";
}
