import type { ComponentProps } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { formatIsoDate } from "@/lib/date";

export type WeeklyDigestIconName = ComponentProps<typeof FontAwesome>["name"];

export function formatDateRange(start: string, end: string): string {
  return `${formatIsoDate(start)} — ${formatIsoDate(end)}`;
}

export function comparisonTone(value: number | null): "positive" | "negative" | "neutral" {
  if (value == null || value === 0) return "neutral";
  return value > 0 ? "positive" : "negative";
}

export function formatSignedCount(value: number | null): string {
  if (value == null) return "—";
  if (value === 0) return "0";
  return `${value > 0 ? "+" : ""}${Math.round(value)}`;
}

export function formatPercentDelta(value: number | null): string {
  if (value == null) return "—";
  const points = Math.round(value * 100);
  if (points === 0) return "0 pts";
  return `${points > 0 ? "+" : ""}${points} pts`;
}

export function formatVolumeDelta(value: number | null): string {
  if (value == null) return "—";
  const rounded = Math.round(value);
  if (Math.abs(value) >= 1000) {
    return `${value > 0 ? "+" : ""}${(value / 1000).toFixed(1)}k`;
  }
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

export function formatExerciseVolume(value: number): string {
  return value > 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}
