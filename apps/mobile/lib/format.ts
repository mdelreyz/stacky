/** Convert a snake_case string to a human-readable label (e.g. "morning_fasted" → "morning fasted"). */
export function snakeCaseToLabel(value: string): string {
  return value.replace(/_/g, " ");
}
