"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookTypeIcon, ChevronDownIcon, ChevronRightIcon, EyeOffIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserMenu } from "@/components/dashboard/user-menu";
import { useFormQuery, useUpdateForm } from "@/hooks/use-form";
import { usePublishForm, useUnpublishForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../shared/theme-toggle";

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

  function handlePublish() {
    publishForm.mutate(formId, {
      onSuccess: () => toast.success(form!.status === "published" ? "Edits published" : "Form published — share link is live"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't publish"),
    });
  }

  function handleUnpublish() {
    unpublishForm.mutate(formId, {
      onSuccess: () => toast.success("Form unpublished"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't unpublish"),
    });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/f/${form!.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  const tabs = [
    { href: `/forms/${formId}`, label: "Content" },
    { href: `/forms/${formId}/share`, label: "Share" },
    { href: `/forms/${formId}/results`, label: "Results" },
  ];

  const published = form.status === "published";

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-stretch gap-2 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-1.5 self-center">
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
      </div>

      <nav className="flex items-stretch gap-6 text-sm">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center px-1 font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && <span className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-primary" />}
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-end gap-2 self-center">
        <ThemeToggle />
        {published && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" onClick={handleCopyLink} aria-label="Copy share link">
                  <LinkIcon />
                </Button>
              }
            />
            <TooltipContent>Copy share link</TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="h-5" />

        {published ? (
          <div className="flex items-center">
            <Button
              size="sm"
              className="rounded-r-none"
              onClick={handlePublish}
              disabled={publishForm.isPending}
            >
              Publish edits
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="sm"
                    className="rounded-l-none border-l border-l-primary-foreground/20 px-1.5"
                    aria-label="More publish options"
                    disabled={unpublishForm.isPending}
                  >
                    <ChevronDownIcon />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={handleUnpublish}>
                  <EyeOffIcon /> Unpublish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button size="sm" onClick={handlePublish} disabled={publishForm.isPending}>
            Publish
          </Button>
        )}

        <UserMenu />
      </div>
    </header>
  );
}
