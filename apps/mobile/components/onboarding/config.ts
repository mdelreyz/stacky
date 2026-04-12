import type { HealthGoal, InteractionMode } from "@/lib/api";

export const STEPS = ["welcome", "goals", "constraints", "path"] as const;
export type Step = (typeof STEPS)[number];

export const GOAL_OPTIONS: Array<{ value: HealthGoal; label: string; icon: string }> = [
  { value: "longevity", label: "Longevity", icon: "heart" },
  { value: "cognitive", label: "Cognitive", icon: "lightbulb-o" },
  { value: "sleep", label: "Sleep", icon: "moon-o" },
  { value: "stress", label: "Stress Relief", icon: "leaf" },
  { value: "energy", label: "Energy", icon: "bolt" },
  { value: "immunity", label: "Immunity", icon: "shield" },
  { value: "skin", label: "Skin", icon: "star" },
  { value: "hair", label: "Hair", icon: "magic" },
  { value: "joint_health", label: "Joint Health", icon: "hand-rock-o" },
  { value: "gut_health", label: "Gut Health", icon: "circle-o" },
  { value: "weight_management", label: "Weight", icon: "balance-scale" },
  { value: "muscle_recovery", label: "Recovery", icon: "refresh" },
  { value: "cardiovascular", label: "Cardiovascular", icon: "heartbeat" },
  { value: "hormonal_balance", label: "Hormonal", icon: "sliders" },
];

export const MODE_OPTIONS: Array<{
  value: InteractionMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "guided",
    label: "Guided",
    description: "AI asks questions and builds your stack",
    icon: "comments",
  },
  {
    value: "automated",
    label: "Automated",
    description: "AI proposes a complete protocol for you",
    icon: "magic",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "AI assists, you drive selection",
    icon: "sliders",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Full manual control",
    icon: "cogs",
  },
];
