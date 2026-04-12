import type { ComponentProps } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import type { Supplement } from "@/lib/api";

export type SupplementAddIconName = ComponentProps<typeof FontAwesome>["name"];

export const FEATURE_ITEMS: Array<{ icon: SupplementAddIconName; label: string }> = [
  { icon: "bolt", label: "Mechanism of action" },
  { icon: "clock-o", label: "Timing and dosage" },
  { icon: "exchange", label: "Interactions and synergies" },
  { icon: "shield", label: "Safety and contraindications" },
  { icon: "line-chart", label: "Cycling guidance" },
  { icon: "tint", label: "Absorption and bioavailability" },
];

export function formatSupplementCategory(category: Supplement["category"]) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function sourceLabel(item: Supplement) {
  return item.source === "catalog" ? "Catalog" : "User-Created";
}

export function aiBadgeLabel(item: Supplement) {
  if (item.ai_profile) return "AI Ready";
  if (item.ai_status === "generating") return "Generating";
  if (item.ai_status === "failed") return "Needs Retry";
  return "Profile Pending";
}
