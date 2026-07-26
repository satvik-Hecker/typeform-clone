import { Badge } from "@/components/ui/badge";
import type { FormStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: FormStatus }) {
  const published = status === "published";
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        published
          ? "border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "border-muted-foreground/20 bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", published ? "bg-emerald-600" : "bg-muted-foreground/50")}
      />
      {status}
    </Badge>
  );
}
