export function readProfileString(profile: Record<string, unknown> | null, key: string): string | null {
  const value = profile?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function readProfileNumber(profile: Record<string, unknown> | null, key: string): number | null {
  const value = profile?.[key];
  return typeof value === "number" ? value : null;
}

export function readProfileStringArray(profile: Record<string, unknown> | null, key: string): string[] {
  const value = profile?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
