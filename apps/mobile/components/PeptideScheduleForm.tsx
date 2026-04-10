import type { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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

const ROUTE_OPTIONS = [
  { value: "subcutaneous", label: "Subcutaneous" },
  { value: "intramuscular", label: "Intramuscular" },
  { value: "topical", label: "Topical" },
  { value: "oral", label: "Oral" },
  { value: "nasal", label: "Nasal" },
];

export interface PeptideScheduleState {
  dosageAmount: string;
  dosageUnit: string;
  frequency: ScheduleFrequency;
  takeWindow: ScheduleTakeWindow;
  withFood: boolean;
  route: string;
  storageNotes: string;
  notes: string;
}

export function PeptideScheduleForm({
  state,
  setState,
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  secondaryVariant = "danger",
  onSecondaryAction,
}: {
  state: PeptideScheduleState;
  setState: Dispatch<SetStateAction<PeptideScheduleState>>;
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
            placeholder="250"
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            value={state.dosageUnit}
            onChangeText={(value) => setState((current) => ({ ...current, dosageUnit: value }))}
            placeholder="mcg"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>
        <OptionGrid
          options={ROUTE_OPTIONS}
          selected={state.route}
          onSelect={(value) => setState((current) => ({ ...current, route: value }))}
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
        <Text style={styles.sectionTitle}>Take Window</Text>
        <OptionGrid
          options={TAKE_WINDOW_OPTIONS.filter((o) => AVAILABLE_SCHEDULE_WINDOWS.includes(o.value))}
          selected={state.takeWindow}
          onSelect={(value) => setState((current) => ({ ...current, takeWindow: value as ScheduleTakeWindow }))}
        />

        <Pressable
          style={[styles.toggleRow, state.withFood && styles.toggleRowActive]}
          onPress={() => setState((current) => ({ ...current, withFood: !current.withFood }))}
          accessibilityRole="checkbox"
          accessibilityLabel="Take with food"
          accessibilityState={{ checked: state.withFood }}
        >
          <FontAwesome
            name={state.withFood ? "check-square-o" : "square-o"}
            size={18}
            color={state.withFood ? colors.success : colors.textMuted}
          />
          <Text style={styles.toggleText}>Take with food</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Storage Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.storageNotes}
          onChangeText={(value) => setState((current) => ({ ...current, storageNotes: value }))}
          placeholder="Temperature, light sensitivity, refrigeration requirements"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.notes}
          onChangeText={(value) => setState((current) => ({ ...current, notes: value }))}
          placeholder="Optional reminders or notes"
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
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  dosageRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    color: colors.textPrimary,
  },
  amountInput: { flex: 0.8 },
  unitInput: { flex: 1.2 },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
  },
  toggleRowActive: {
    backgroundColor: colors.successLight,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.grayDark,
  },
});
