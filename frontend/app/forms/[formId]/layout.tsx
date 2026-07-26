"use client";

import { use } from "react";
import { BuilderTopBar } from "@/components/builder/builder-topbar";

export default function BuilderLayout(props: {
  children: React.ReactNode;
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(props.params);
  const id = Number(formId);

  return (
    <div className="flex h-screen flex-col">
      <BuilderTopBar formId={id} />
      <div className="flex flex-1 overflow-hidden">{props.children}</div>
    </div>
  );
}
