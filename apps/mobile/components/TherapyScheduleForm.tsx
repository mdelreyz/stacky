import type { Dispatch, SetStateAction } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
          placeholderTextColor="#adb5bd"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Frequency</Text>
        <OptionGrid
          options={FREQUENCY_OPTIONS.filter((option) =>
            AVAILABLE_SCHEDULE_FREQUENCIES.includes(option.value)
          )}
          selected={state.frequency}
          onSelect={(value) => setState((current) => ({ ...current, frequency: value as ScheduleFrequency }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferred Window</Text>
        <OptionGrid
          options={TAKE_WINDOW_OPTIONS.filter((option) =>
            AVAILABLE_SCHEDULE_WINDOWS.includes(option.value)
          )}
          selected={state.takeWindow}
          onSelect={(value) =>
            setState((current) => ({ ...current, takeWindow: value as ScheduleTakeWindow }))
          }
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
          placeholderTextColor="#adb5bd"
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
          placeholderTextColor="#adb5bd"
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionPattern}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionPattern: value }))}
          placeholder="Pattern followed, routine version, splits, intervals, or progression"
          placeholderTextColor="#adb5bd"
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionVolume}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionVolume: value }))}
          placeholder="Volume, load, reps, minutes, distance, or dose used"
          placeholderTextColor="#adb5bd"
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.lastSessionResponse}
          onChangeText={(value) => setState((current) => ({ ...current, lastSessionResponse: value }))}
          placeholder="Response, perceived effort, soreness, HRV note, or observed effect"
          placeholderTextColor="#adb5bd"
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
          placeholderTextColor="#adb5bd"
        />
      </View>

      <Pressable
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="check" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </>
        )}
      </Pressable>

      {secondaryLabel && onSecondaryAction ? (
        <Pressable
          style={[
            styles.secondaryButton,
            secondaryVariant === "danger" ? styles.secondaryDanger : styles.secondaryNeutral,
            saving && styles.buttonDisabled,
          ]}
          onPress={onSecondaryAction}
          disabled={saving}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              secondaryVariant === "danger" ? styles.secondaryDangerText : styles.secondaryNeutralText,
            ]}
          >
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionGrid}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.optionChip,
            selected === option.value && styles.optionChipSelected,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.optionChipText,
              selected === option.value && styles.optionChipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#343a40",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    fontSize: 16,
    color: "#212529",
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
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  readonlyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6c757d",
    marginBottom: 6,
  },
  readonlyValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f3f5",
  },
  optionChipSelected: {
    backgroundColor: "#d0ebff",
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  optionChipTextSelected: {
    color: "#1864ab",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: "#228be6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff5f5",
  },
  secondaryDanger: {
    backgroundColor: "#fff5f5",
  },
  secondaryNeutral: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryDangerText: {
    color: "#c92a2a",
  },
  secondaryNeutralText: {
    color: "#495057",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
