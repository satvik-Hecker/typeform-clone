import { createElement, type ComponentProps } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

/** Consistent "X is coming soon" toast used across placeholder features (Integrations, Contacts, Automations, Invite, ...). */
export function comingSoon(feature: string, icon: LucideIcon, iconProps?: ComponentProps<LucideIcon>) {
  toast.info(`${feature} is coming soon`, {
    icon: createElement(icon, { className: "size-4", ...iconProps }),
  });
}
