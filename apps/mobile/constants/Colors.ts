export const colors = {
  // Text
  textPrimary: "#212529",
  textSecondary: "#495057",
  textMuted: "#868e96",
  textPlaceholder: "#adb5bd",
  textWhite: "#ffffff",

  // Backgrounds
  background: "#ffffff",
  backgroundSecondary: "#f8f9fa",
  surface: "#f1f3f5",

  // Borders
  border: "#dee2e6",
  borderLight: "#e9ecef",

  // Primary (blue)
  primary: "#228be6",
  primaryDark: "#1c7ed6",
  primaryDarker: "#1864ab",
  primaryLight: "#e7f5ff",

  // Success (green)
  success: "#2b8a3e",
  successLight: "#ebfbee",
  successBadge: "#d3f9d8",

  // Danger (red)
  danger: "#e03131",
  dangerDark: "#c92a2a",
  dangerLight: "#fff5f5",
  dangerAccent: "#ef4444",

  // Warning (amber)
  warning: "#e67700",
  warningDark: "#8f5b00",
  warningLight: "#fff4e6",
  warningBorder: "#ffd8a8",
  warningAmber: "#ffa94d",
  warningSkincare: "#f08c00",
  warningBrown: "#9a3412",
  warningBrownDark: "#7c2d12",

  // Info (blue tint)
  info: "#1c3d5a",
  infoSecondary: "#5c7c94",
  infoLight: "#eef7ff",
  infoLighter: "#fafcff",
  infoBorder: "#d0ebff",
  infoSelect: "#74c0fc",

  // Accent (purple)
  accent: "#5f3dc4",
  accentDark: "#6741d9",
  accentIcon: "#7048e8",
  accentLight: "#f3f0ff",
  accentBorder: "#e5dbff",

  // Badge (yellow)
  badgeYellow: "#fff3bf",
  badgeYellowLight: "#fff9db",
  badgeYellowBorder: "#ffe8a1",

  // Safety severity
  safetyCriticalBg: "#ffe3e3",
  safetyModerateBg: "#f4fce3",
  safetyModerateText: "#5c940d",

  // Muscle group chart palette
  muscleChest: "#ef4444",
  muscleBack: "#3b82f6",
  muscleShoulders: "#f59e0b",
  muscleBiceps: "#10b981",
  muscleTriceps: "#8b5cf6",
  muscleForearms: "#ec4899",
  muscleQuadriceps: "#06b6d4",
  muscleHamstrings: "#f97316",
  muscleGlutes: "#14b8a6",
  muscleCalves: "#6366f1",
  muscleCore: "#84cc16",
  muscleFullBody: "#78716c",
  muscleCardio: "#e11d48",

  // Neutral grays
  gray: "#6c757d",
  grayDark: "#343a40",
  black: "#000000",
  white: "#ffffff",
} as const;

export type ColorKey = keyof typeof colors;
