"use client";

import { use, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  LinkIcon,
  MailIcon,
  QrCodeIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormQuery } from "@/hooks/use-form";
import { usePublishForm } from "@/hooks/use-forms";
import { ApiError } from "@/lib/api";
import { comingSoon } from "@/lib/coming-soon";

export default function SharePage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const id = Number(formId);
  const { data: form, isLoading } = useFormQuery(id);
  const publishForm = usePublishForm();
  const [copied, setCopied] = useState(false);

  if (isLoading || !form) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/f/${form.slug}`;
  const published = form.status === "published";

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  function handlePublish() {
    publishForm.mutate(form!.id, {
      onSuccess: () => toast.success("Form published — share link is live"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't publish"),
    });
  }

  const shareText = encodeURIComponent(`Fill out "${form.title}"`);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8">
      <h1 className="font-heading text-xl font-bold">Share this form</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone with this link can fill out your form — no account required.
      </p>

      {!published && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <span>This form is still a draft — publish it to activate the link below.</span>
          <Button size="sm" onClick={handlePublish} disabled={publishForm.isPending}>
            Publish
          </Button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg border p-2">
        <LinkIcon className="ml-1 size-4 shrink-0 text-muted-foreground" />
        <input
          readOnly
          value={url}
          className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={!published ? "pointer-events-none opacity-50" : undefined}
          nativeButton={false}
          render={<a href={published ? url : undefined} target="_blank" rel="noreferrer" />}
        >
          <ExternalLinkIcon /> Open
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Share to</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={!published ? "pointer-events-none opacity-50" : undefined}
          nativeButton={false}
            render={
              <a
                href={published ? `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}` : undefined}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            X / Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={!published ? "pointer-events-none opacity-50" : undefined}
          nativeButton={false}
            render={
              <a
                href={published ? `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` : undefined}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={!published ? "pointer-events-none opacity-50" : undefined}
          nativeButton={false}
            render={<a href={published ? `mailto:?subject=${shareText}&body=${shareUrl}` : undefined} />}
          >
            <MailIcon /> Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => comingSoon("QR code", QrCodeIcon)}>
            <QrCodeIcon /> QR code
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium">Embed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Embed this form directly on your website —{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => comingSoon("Embed codes", LinkIcon)}
          >
            coming soon
          </button>
          .
        </p>
      </div>
    </div>
  );
}
