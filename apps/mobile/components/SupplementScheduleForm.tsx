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

export interface DoseScheduleState {
  dosageAmount: string;
  dosageUnit: string;
  frequency: ScheduleFrequency;
  takeWindow: ScheduleTakeWindow;
  withFood: boolean;
  notes: string;
}

export function DoseScheduleForm({
  state,
  setState,
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  secondaryVariant = "danger",
  onSecondaryAction,
}: {
  state: DoseScheduleState;
  setState: Dispatch<SetStateAction<DoseScheduleState>>;
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
        <Text style={styles.sectionTitle}>Dosage</Text>
        <View style={styles.dosageRow}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            keyboardType="decimal-pad"
            value={state.dosageAmount}
            onChangeText={(value) => setState((current) => ({ ...current, dosageAmount: value }))}
            placeholder="1"
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            value={state.dosageUnit}
            onChangeText={(value) => setState((current) => ({ ...current, dosageUnit: value }))}
            placeholder="capsule"
          />
        </View>
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
        <Text style={styles.sectionTitle}>Take Window</Text>
        <OptionGrid
          options={TAKE_WINDOW_OPTIONS.filter((option) =>
            AVAILABLE_SCHEDULE_WINDOWS.includes(option.value)
          )}
          selected={state.takeWindow}
          onSelect={(value) =>
            setState((current) => ({ ...current, takeWindow: value as ScheduleTakeWindow }))
          }
        />

        <Pressable
          style={[styles.toggleRow, state.withFood && styles.toggleRowActive]}
          onPress={() => setState((current) => ({ ...current, withFood: !current.withFood }))}
        >
          <FontAwesome
            name={state.withFood ? "check-square-o" : "square-o"}
            size={18}
            color={state.withFood ? "#2b8a3e" : "#868e96"}
          />
          <Text style={styles.toggleText}>Take with food</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.notes}
          onChangeText={(value) => setState((current) => ({ ...current, notes: value }))}
          placeholder="Optional reminders or notes"
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

export type SupplementScheduleState = DoseScheduleState;
export const SupplementScheduleForm = DoseScheduleForm;

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
  dosageRow: {
    flexDirection: "row",
    gap: 12,
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
  amountInput: { flex: 0.8 },
  unitInput: { flex: 1.2 },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  toggleRowActive: {
    backgroundColor: "#ebfbee",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343a40",
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
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryDanger: {
    backgroundColor: "#fff5f5",
  },
  secondaryDangerText: {
    color: "#c92a2a",
  },
  secondaryNeutral: {
    backgroundColor: "#f1f3f5",
  },
  secondaryNeutralText: {
    color: "#495057",
  },
  buttonDisabled: { opacity: 0.6 },
});
