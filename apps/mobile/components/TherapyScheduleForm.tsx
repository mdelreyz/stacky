import type { Dispatch, SetStateAction } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/Colors";
import { FormButtons } from "@/components/forms/FormButtons";
import { OptionGrid } from "@/components/forms/OptionGrid";
import {
  AVAILABLE_SCHEDULE_FREQUENCIES,
  AVAILABLE_SCHEDULE_WINDOWS,
  FREQUENCY_OPTIONS,
  TAKE_WINDOW_OPTIONS,
  type ScheduleFrequency,
  type ScheduleTakeWindow,
} from "@/lib/schedule";

export interface TherapyScheduleState {
  durationMinutes: string;
  frequency: ScheduleFrequency;
  takeWindow: ScheduleTakeWindow;
  sessionDetails: string;
  lastSessionDetails: string;
  lastSessionPattern: string;
  lastSessionVolume: string;
  lastSessionResponse: string;
  lastCompletedAt: string;
  notes: string;
}

export function TherapyScheduleForm({
  state,
  setState,
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  secondaryVariant = "danger",
  onSecondaryAction,
}: {
  state: TherapyScheduleState;
  setState: Dispatch<SetStateAction<TherapyScheduleState>>;
  saving: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  secondaryLabel?: string;
  secondaryVariant?: "neutral" | "danger";
  onSecondaryAction?: () => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Session Timing</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={state.durationMinutes}
          onChangeText={(value) => setState((current) => ({ ...current, durationMinutes: value }))}
          placeholder="Duration in minutes"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Frequency</Text>
        <OptionGrid
          options={FREQUENCY_OPTIONS.filter((o) => AVAILABLE_SCHEDULE_FREQUENCIES.includes(o.value))}
          selected={state.frequency}
          onSelect={(value) => setState((current) => ({ ...current, frequency: value as ScheduleFrequency }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferred Window</Text>
        <OptionGrid
          options={TAKE_WINDOW_OPTIONS.filter((o) => AVAILABLE_SCHEDULE_WINDOWS.includes(o.value))}
          selected={state.takeWindow}
          onSelect={(value) => setState((current) => ({ ...current, takeWindow: value as ScheduleTakeWindow }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Planned Session</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.sessionDetails}
          onChangeText={(value) => setState((current) => ({ ...current, sessionDetails: value }))}
          placeholder="Protocol details, routine, intervals, devices, sides, exercises, or target dose"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Last Session</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.lastSessionDetails}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionDetails: value }))}
          placeholder="Last volume, response, pattern followed, or notes from the previous session"
          placeholderTextColor={colors.textPlaceholder}
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionPattern}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionPattern: value }))}
          placeholder="Pattern followed, routine version, splits, intervals, or progression"
          placeholderTextColor={colors.textPlaceholder}
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionVolume}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionVolume: value }))}
          placeholder="Volume, load, reps, minutes, distance, or dose used"
          placeholderTextColor={colors.textPlaceholder}
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionResponse}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionResponse: value }))}
          placeholder="Response, perceived effort, soreness, HRV note, or observed effect"
          placeholderTextColor={colors.textPlaceholder}
        />
        {state.lastCompletedAt ? (
          <View style={styles.readonlyCard}>
            <Text style={styles.readonlyLabel}>Last completed</Text>
            <Text style={styles.readonlyValue}>{state.lastCompletedAt}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.notes}
          onChangeText={(value) => setState((current) => ({ ...current, notes: value }))}
          placeholder="Optional reminders or broader context"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <FormButtons
        saving={saving}
        primaryLabel={primaryLabel}
        onSubmit={onSubmit}
        secondaryLabel={secondaryLabel}
        secondaryVariant={secondaryVariant}
        onSecondaryAction={onSecondaryAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(240,244,248,0.82)",
    fontSize: 16,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  spacedInput: {
    marginTop: 12,
  },
  readonlyCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(240,244,248,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  readonlyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray,
    marginBottom: 6,
  },
  readonlyValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
