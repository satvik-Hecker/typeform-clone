"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookTypeIcon, ChevronRightIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/dashboard/user-menu";
import { StatusPill } from "@/components/shared/status-pill";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useFormQuery, useUpdateForm } from "@/hooks/use-form";
import { usePublishForm, useUnpublishForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BuilderTopBarProps {
  formId: number;
}

export function BuilderTopBar({ formId }: BuilderTopBarProps) {
  const { data: form } = useFormQuery(formId);
  const updateForm = useUpdateForm(formId);
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const pathname = usePathname();

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (form) setTitle(form.title);
  }, [form?.id, form?.title]);

  if (!form) {
    return <div className="h-14 shrink-0 border-b" />;
  }

  function commitTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === form!.title) {
      setTitle(form!.title);
      return;
    }
    updateForm.mutate({ title: trimmed });
  }

  function handleTogglePublish() {
    if (form!.status === "published") {
      unpublishForm.mutate(formId, {
        onSuccess: () => toast.success("Form unpublished"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't unpublish"),
      });
    } else {
      publishForm.mutate(formId, {
        onSuccess: () => toast.success("Form published — share link is live"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't publish"),
      });
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/f/${form!.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  const tabs = [
    { href: `/forms/${formId}`, label: "Edit form" },
    { href: `/forms/${formId}/share`, label: "Share" },
    { href: `/forms/${formId}/results`, label: "Results" },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Link href="/forms" className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <BookTypeIcon className="size-4" />
        Forms
      </Link>
      <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/50" />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="min-w-0 max-w-xs truncate rounded-md border border-transparent bg-transparent px-2 py-1 font-heading text-base font-semibold outline-none hover:border-border focus:border-border focus:bg-muted/50"
      />

      {updateForm.isPending && <span className="shrink-0 text-xs text-muted-foreground">Saving…</span>}

      <StatusPill status={form.status} />

      <nav className="ml-2 flex items-center gap-1 rounded-lg bg-muted p-0.5 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1",
              pathname === tab.href ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {form.status === "published" && (
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <LinkIcon /> Copy link
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleTogglePublish}
          disabled={publishForm.isPending || unpublishForm.isPending}
        >
          {form.status === "published" ? "Unpublish" : "Publish"}
        </Button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
