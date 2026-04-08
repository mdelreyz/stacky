export interface TherapySettingsState {
  sessionDetails: string;
  lastSessionDetails: string;
  lastSessionPattern: string;
  lastSessionVolume: string;
  lastSessionResponse: string;
  lastCompletedAt: string;
}

const SESSION_DETAILS_KEY = "session_details";
const LAST_SESSION_DETAILS_KEY = "last_session_details";
const LAST_SESSION_PATTERN_KEY = "last_session_pattern";
const LAST_SESSION_VOLUME_KEY = "last_session_volume";
const LAST_SESSION_RESPONSE_KEY = "last_session_response";
const LAST_COMPLETED_AT_KEY = "last_completed_at";

function readSetting(settings: Record<string, unknown> | null | undefined, key: string): string {
  const value = settings?.[key];
  return typeof value === "string" ? value : "";
}

export function readTherapySettings(
  settings: Record<string, unknown> | null | undefined
): TherapySettingsState {
  return {
    sessionDetails: readSetting(settings, SESSION_DETAILS_KEY),
    lastSessionDetails: readSetting(settings, LAST_SESSION_DETAILS_KEY),
    lastSessionPattern: readSetting(settings, LAST_SESSION_PATTERN_KEY),
    lastSessionVolume: readSetting(settings, LAST_SESSION_VOLUME_KEY),
    lastSessionResponse: readSetting(settings, LAST_SESSION_RESPONSE_KEY),
    lastCompletedAt: readSetting(settings, LAST_COMPLETED_AT_KEY),
  };
}

export function buildTherapySettings(state: TherapySettingsState): Record<string, string> | undefined {
  const nextSettings: Record<string, string> = {};

  if (state.sessionDetails.trim()) {
    nextSettings[SESSION_DETAILS_KEY] = state.sessionDetails.trim();
  }
  if (state.lastSessionDetails.trim()) {
    nextSettings[LAST_SESSION_DETAILS_KEY] = state.lastSessionDetails.trim();
  }
  if (state.lastSessionPattern.trim()) {
    nextSettings[LAST_SESSION_PATTERN_KEY] = state.lastSessionPattern.trim();
  }
  if (state.lastSessionVolume.trim()) {
    nextSettings[LAST_SESSION_VOLUME_KEY] = state.lastSessionVolume.trim();
  }
  if (state.lastSessionResponse.trim()) {
    nextSettings[LAST_SESSION_RESPONSE_KEY] = state.lastSessionResponse.trim();
  }
  if (state.lastCompletedAt.trim()) {
    nextSettings[LAST_COMPLETED_AT_KEY] = state.lastCompletedAt.trim();
  }

  return Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
}

export function describeTherapySettings(
  settings: Record<string, unknown> | null | undefined
): string | undefined {
  const state = readTherapySettings(settings);
  const highlights = [
    state.sessionDetails,
    state.lastSessionVolume ? `Last volume: ${state.lastSessionVolume}` : "",
    state.lastSessionPattern ? `Last pattern: ${state.lastSessionPattern}` : "",
    state.lastSessionDetails,
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return highlights[0] || undefined;
}

export function formatLastCompletedAt(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
