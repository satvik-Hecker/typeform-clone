import type { CSSProperties } from "react";

export interface FormTheme {
  primaryColor?: string;
  preset?: string;
}

export function parseFormTheme(theme: string | null): FormTheme {
  if (!theme) return {};
  try {
    const parsed = JSON.parse(theme);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export interface ThemePreset {
  id: string;
  name: string;
  vibe: string;
  headingLabel: string;
  bodyLabel: string;
  headingFont: string;
  /** Omitted when the preset keeps the app's default body font (Inter) — avoids a self-referencing --font-sans override. */
  bodyFont?: string;
  accent: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    vibe: "Premium, modern, sleek, startup",
    headingLabel: "Geist",
    bodyLabel: "Inter",
    headingFont: "var(--font-geist)",
    accent: "#171717",
  },
  {
    id: "minimal-editorial",
    name: "Minimal Editorial",
    vibe: "Elegant, clean, timeless",
    headingLabel: "Instrument Serif",
    bodyLabel: "Inter",
    headingFont: "var(--font-instrument-serif)",
    accent: "#57534e",
  },
  {
    id: "swiss-design",
    name: "Swiss Design",
    vibe: "Professional, grid-based, minimalist",
    headingLabel: "Geist",
    bodyLabel: "Geist",
    headingFont: "var(--font-geist)",
    bodyFont: "var(--font-geist)",
    accent: "#dc2626",
  },
  {
    id: "futuristic-ai",
    name: "Futuristic AI",
    vibe: "AI, futuristic, vibrant",
    headingLabel: "Clash Display",
    bodyLabel: "General Sans",
    headingFont: "'Clash Display', sans-serif",
    bodyFont: "'General Sans', sans-serif",
    accent: "#7c3aed",
  },
  {
    id: "bento-modern",
    name: "Bento Modern",
    vibe: "Friendly, modern, dashboard-style",
    headingLabel: "Manrope",
    bodyLabel: "Inter",
    headingFont: "var(--font-manrope)",
    accent: "#059669",
  },
];

export function getThemePreset(id: string | undefined): ThemePreset | undefined {
  return id ? THEME_PRESETS.find((preset) => preset.id === id) : undefined;
}

/** CSS custom-property overrides that scope a form's chosen preset fonts to a subtree (respondent view, canvas preview). */
export function themeFontStyle(theme: FormTheme): CSSProperties {
  const preset = getThemePreset(theme.preset);
  if (!preset) return {};
  const style: Record<string, string> = { "--font-heading": preset.headingFont };
  // Setting --font-sans to a value that falls back to var(--font-sans) is self-referential (CSS invalidates
  // the whole declaration), so presets that keep the default body font simply don't set this key at all.
  if (preset.bodyFont) style["--font-sans"] = preset.bodyFont;
  return style as CSSProperties;
}
