import { Card } from "@/components/ui/card";
import { QUESTION_TYPE_ICONS } from "@/lib/question-type-icons";
import type { FormSummary, QuestionSummary } from "@/lib/types";

export function SummaryStats({ summary }: { summary: FormSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {summary.questions.map((q) => (
        <QuestionSummaryCard key={q.question_id} question={q} />
      ))}
    </div>
  );
}

function QuestionSummaryCard({ question }: { question: QuestionSummary }) {
  const Icon = QUESTION_TYPE_ICONS[question.type];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <h3 className="font-heading text-sm font-semibold leading-snug">{question.title}</h3>
          <p className="text-xs text-muted-foreground">{question.answered_count} answered</p>
        </div>
      </div>

      {question.choice_counts && (
        <div className="space-y-2">
          {question.choice_counts.map((c) => {
            const max = Math.max(1, ...question.choice_counts!.map((x) => x.count));
            const pct = (c.count / max) * 100;
            return (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 truncate text-muted-foreground">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums">{c.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {question.type === "yes_no" && (
        <div className="space-y-2">
          {[
            { label: "Yes", count: question.true_count ?? 0 },
            { label: "No", count: question.false_count ?? 0 },
          ].map((c) => {
            const max = Math.max(1, question.true_count ?? 0, question.false_count ?? 0);
            const pct = (c.count / max) * 100;
            return (
              <div key={c.label} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 text-muted-foreground">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums">{c.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {(question.type === "number" || question.type === "rating") && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatTile label="Average" value={question.average != null ? question.average.toFixed(1) : "—"} />
          <StatTile label="Min" value={question.min_value ?? "—"} />
          <StatTile label="Max" value={question.max_value ?? "—"} />
        </div>
      )}

      {["short_text", "long_text", "email"].includes(question.type) && (
        <p className="text-sm text-muted-foreground">
          Free-text responses — view individual answers in the Responses tab.
        </p>
      )}
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
