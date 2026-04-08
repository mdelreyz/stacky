export interface TherapySettingsState {
  sessionDetails: string;
  lastSessionDetails: string;
}

const SESSION_DETAILS_KEY = "session_details";
const LAST_SESSION_DETAILS_KEY = "last_session_details";

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

  return Object.keys(nextSettings).length > 0 ? nextSettings : undefined;
}
