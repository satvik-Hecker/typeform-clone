"use client";

import { useEffect, useState } from "react";
import { LaptopIcon } from "lucide-react";

/** The builder's 3-column layout (question list, live canvas, settings) genuinely needs room to work. */
const BREAKPOINT_PX = 1024;

interface DesktopRequiredGateProps {
  children: React.ReactNode;
}

export function DesktopRequiredGate({ children }: DesktopRequiredGateProps) {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${BREAKPOINT_PX - 1}px)`);
    const update = () => setIsSmallScreen(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Avoid a flash of the (broken) builder before the viewport check has run once.
  if (isSmallScreen === null) return null;
  if (!isSmallScreen) return <>{children}</>;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <LaptopIcon className="size-7 text-foreground" />
      </div>
      <h1 className="font-heading text-xl font-bold">Let&apos;s continue on a bigger screen</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The form builder — your question list, live preview, and settings side by side — needs more
        room than this screen can give it. Switch to a laptop or desktop to keep editing.
      </p>
      <p className="max-w-sm text-xs text-muted-foreground/70">
        Filling out a published form, on the other hand, works great on mobile — that part of Typeform
        (and this clone) is fully responsive.
      </p>
      <p className="mt-2 max-w-sm text-[0.7rem] text-muted-foreground/50">
        Typeform&apos;s own builder gates small screens the same way — this mirrors their real UX, not a shortcut.
      </p>
    </div>
  );
}
