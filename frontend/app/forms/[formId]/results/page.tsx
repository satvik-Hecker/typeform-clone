"use client";

import { use, useState } from "react";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseDetailSheet } from "@/components/results/response-detail-sheet";
import { ResponseTable } from "@/components/results/response-table";
import { SummaryStats } from "@/components/results/summary-stats";
import { useResponsesQuery, useSummaryQuery } from "@/hooks/use-results";
import { api } from "@/lib/api";

export default function ResultsPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const id = Number(formId);
  const { data: responses, isLoading: loadingResponses } = useResponsesQuery(id);
  const { data: summary, isLoading: loadingSummary } = useSummaryQuery(id);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);

  const completionRate =
    summary && summary.total_responses > 0
      ? Math.round((summary.completed_responses / summary.total_responses) * 100)
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          <Stat label="Responses" value={summary?.total_responses ?? "—"} />
          <Stat label="Completed" value={summary?.completed_responses ?? "—"} />
          <Stat label="Completion rate" value={completionRate != null ? `${completionRate}%` : "—"} />
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={api.responses.exportCsvUrl(id)} download />}
        >
          <DownloadIcon /> Export CSV
        </Button>
      </div>

      <Tabs defaultValue="responses">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="mt-4">
          {loadingResponses ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponseTable responses={responses ?? []} onSelect={setSelectedResponseId} />
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          {loadingSummary ? (
            <Skeleton className="h-48 w-full" />
          ) : summary ? (
            <SummaryStats summary={summary} />
          ) : null}
        </TabsContent>
      </Tabs>

      <ResponseDetailSheet
        formId={id}
        responseId={selectedResponseId}
        onOpenChange={(open) => !open && setSelectedResponseId(null)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
