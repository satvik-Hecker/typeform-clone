export interface FormTheme {
  primaryColor?: string;
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
