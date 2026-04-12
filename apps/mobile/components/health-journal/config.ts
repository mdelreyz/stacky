import { colors } from "@/constants/Colors";

export const METRIC_LABELS = ["energy", "mood", "sleep", "stress"] as const;

export type MetricKey = (typeof METRIC_LABELS)[number];

export const METRIC_CONFIG: Record<MetricKey, { icon: string; label: string; color: string }> = {
  energy: { icon: "bolt", label: "Energy", color: colors.warning },
  mood: { icon: "smile-o", label: "Mood", color: colors.primary },
  sleep: { icon: "moon-o", label: "Sleep", color: colors.accent },
  stress: { icon: "heartbeat", label: "Stress", color: colors.danger },
};

export const COMMON_SYMPTOMS = [
  "Headache",
  "Fatigue",
  "Brain fog",
  "Nausea",
  "Joint pain",
  "Muscle soreness",
  "Bloating",
  "Anxiety",
  "Insomnia",
  "Low appetite",
];
