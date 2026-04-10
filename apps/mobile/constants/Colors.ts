export const colors = {
  // Text — deep slate, never pure black
  textPrimary: "#1a2332",
  textSecondary: "#4b5c72",
  textMuted: "#8c99a8",
  textPlaceholder: "#b8c4d0",
  textWhite: "#ffffff",

  // Backgrounds — cloud white with cool undertone
  background: "#f9fafb",
  backgroundSecondary: "#f0f4f8",
  surface: "#e6ecf2",

  // Borders — frost lines
  border: "#d8e0e8",
  borderLight: "#e8eef4",

  // Primary — nordic steel blue
  primary: "#5a8ab5",
  primaryDark: "#4878a0",
  primaryDarker: "#365e82",
  primaryLight: "#eaf2f8",

  // Success — scandinavian sage
  success: "#4a8a6a",
  successLight: "#eaf5ef",
  successBadge: "#d0e8da",

  // Danger — dusty rose
  danger: "#c45858",
  dangerDark: "#a84848",
  dangerLight: "#f8eded",
  dangerAccent: "#d06565",

  // Warning — nordic gold
  warning: "#b88a35",
  warningDark: "#856328",
  warningLight: "#f8f3e8",
  warningBorder: "#e2d4b0",
  warningAmber: "#cca040",
  warningSkincare: "#a88030",
  warningBrown: "#785530",
  warningBrownDark: "#5a3e22",

  // Info — fjord blue
  info: "#3a5570",
  infoSecondary: "#688aa0",
  infoLight: "#ecf2f8",
  infoLighter: "#f6f9fc",
  infoBorder: "#c8d8e5",
  infoSelect: "#78aed0",

  // Accent — twilight lavender
  accent: "#6858a5",
  accentDark: "#7565b2",
  accentIcon: "#8272c0",
  accentLight: "#f0eef8",
  accentBorder: "#d8d2ea",

  // Badge — soft cream
  badgeYellow: "#f2ebd5",
  badgeYellowLight: "#f8f5ec",
  badgeYellowBorder: "#e5dcc5",

  // Safety severity — muted diagnostic
  safetyCriticalBg: "#f5e5e5",
  safetyModerateBg: "#ecf2e5",
  safetyModerateText: "#557838",

  // Muscle group chart — desaturated, elegant spectrum
  muscleChest: "#c45858",
  muscleBack: "#5a8ab5",
  muscleShoulders: "#c8a040",
  muscleBiceps: "#4a8a6a",
  muscleTriceps: "#8272c0",
  muscleForearms: "#b56888",
  muscleQuadriceps: "#52a0b2",
  muscleHamstrings: "#c07845",
  muscleGlutes: "#48958a",
  muscleCalves: "#686cc0",
  muscleCore: "#72a040",
  muscleFullBody: "#788090",
  muscleCardio: "#b04868",

  // Neutral — cool-toned slate
  gray: "#6a7888",
  grayDark: "#384450",
  black: "#101820",
  white: "#ffffff",
} as const;

export type ColorKey = keyof typeof colors;
