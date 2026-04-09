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

  // Danger (red)
  danger: "#e03131",
  dangerDark: "#c92a2a",
  dangerLight: "#fff5f5",
  dangerAccent: "#ef4444",

  // Neutral grays
  gray: "#6c757d",
  grayDark: "#343a40",
  black: "#000000",
  white: "#ffffff",
} as const;

export type ColorKey = keyof typeof colors;
