"use client";

import { use, useMemo, useState } from "react";
import {
  CalendarIcon,
  Columns3Icon,
  DownloadIcon,
  ListFilterIcon,
  MailWarningIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponseDetailSheet } from "@/components/results/response-detail-sheet";
import { ResponseTable } from "@/components/results/response-table";
import { SummaryStats } from "@/components/results/summary-stats";
import { useFormQuery } from "@/hooks/use-form";
import { useGenerateTestResponse, useResponsesQuery, useSummaryQuery } from "@/hooks/use-results";
import { api, ApiError } from "@/lib/api";
import { comingSoon } from "@/lib/coming-soon";
import { formatAnswer } from "@/lib/format-answer";
import { cn } from "@/lib/utils";

export default function ResultsPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const id = Number(formId);
  const { data: form } = useFormQuery(id);
  const { data: responses, isLoading: loadingResponses } = useResponsesQuery(id);
  const { data: summary, isLoading: loadingSummary } = useSummaryQuery(id);
  const generateTestResponse = useGenerateTestResponse(id);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredResponses = useMemo(() => {
    if (!responses) return responses;
    const query = search.trim().toLowerCase();
    if (!query) return responses;
    return responses.filter((r) => (r.answers ?? []).some((a) => formatAnswer(a).toLowerCase().includes(query)));
  }, [responses, search]);

  function handleGenerateTestResponse() {
    if (!form) return;
    generateTestResponse.mutate(form, {
      onSuccess: () => toast.success("Test response added"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't generate a test response"),
    });
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <Tabs defaultValue="responses" className="flex h-full flex-col">
        <div className="flex items-center gap-6 border-b px-6 text-sm">
          <SubNavTab icon={ShieldCheckIcon} label="Smart Insights" badge />
          <SubNavTab icon={SparklesIcon} label="Insights" />
          <TabsList className="h-auto gap-6 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="summary"
              className="rounded-none border-0 border-b-2 border-transparent px-0 py-3 text-muted-foreground shadow-none data-active:border-foreground data-active:bg-transparent data-active:text-foreground data-active:shadow-none"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="rounded-none border-0 border-b-2 border-transparent px-0 py-3 text-muted-foreground shadow-none data-active:border-foreground data-active:bg-transparent data-active:text-foreground data-active:shadow-none"
            >
              Responses [{responses?.length ?? 0}]
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="responses" className="mt-0 flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b px-6 py-3">
            <div className="flex items-center rounded-lg border p-0.5 text-sm">
              <span className="rounded-md bg-muted px-3 py-1 font-medium">Responses</span>
              <button
                type="button"
                onClick={() => comingSoon("Spam detection", MailWarningIcon)}
                className="flex items-center gap-1.5 px-3 py-1 text-muted-foreground hover:text-foreground"
              >
                Spam [0]
              </button>
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search responses"
              className="h-8 w-52"
            />

            <Button variant="outline" size="sm" onClick={() => comingSoon("Date range filtering", CalendarIcon)}>
              <CalendarIcon /> All time
            </Button>
            <Button variant="outline" size="sm" onClick={() => comingSoon("Advanced filters", ListFilterIcon)}>
              <ListFilterIcon /> Filters
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => comingSoon("Choosing visible columns", Columns3Icon)}
                      aria-label="Columns"
                    >
                      <Columns3Icon />
                    </Button>
                  }
                />
                <TooltipContent>Choose columns</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => comingSoon("Display settings", SlidersHorizontalIcon)}
                      aria-label="Display settings"
                    >
                      <SlidersHorizontalIcon />
                    </Button>
                  }
                />
                <TooltipContent>Display settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={<a href={api.responses.exportCsvUrl(id)} download aria-label="Export CSV" />}
                    >
                      <DownloadIcon />
                    </Button>
                  }
                />
                <TooltipContent>Export CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTestResponse}
                      disabled={!form || form.status !== "published" || generateTestResponse.isPending}
                    >
                      <WandSparklesIcon />
                      {generateTestResponse.isPending ? "Generating…" : "Generate test response"}
                    </Button>
                  }
                />
                <TooltipContent>
                  {form && form.status !== "published" ? "Publish this form first" : "Fill it out with random answers"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4">
            {loadingResponses ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponseTable responses={filteredResponses ?? []} onSelect={setSelectedResponseId} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-0 flex-1 overflow-auto px-6 py-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-6">
                <Stat label="Responses" value={summary?.total_responses ?? "—"} />
                <Stat label="Completed" value={summary?.completed_responses ?? "—"} />
                <Stat
                  label="Completion rate"
                  value={
                    summary && summary.total_responses > 0
                      ? `${Math.round((summary.completed_responses / summary.total_responses) * 100)}%`
                      : "—"
                  }
                />
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

            {loadingSummary ? (
              <Skeleton className="h-48 w-full" />
            ) : summary ? (
              <SummaryStats summary={summary} />
            ) : null}
          </div>
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

function SubNavTab({
  icon: Icon,
  label,
  badge,
}: {
  icon: typeof ShieldCheckIcon;
  label: string;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => comingSoon(label, Icon)}
      className={cn(
        "flex items-center gap-1.5 py-3 text-muted-foreground hover:text-foreground",
        badge && "text-foreground"
      )}
    >
      {label}
      <Icon className="size-3.5" />
    </button>
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
