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

export type SupplementScheduleState = DoseScheduleState;
export const SupplementScheduleForm = DoseScheduleForm;

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
  dosageRow: {
    flexDirection: "row",
    gap: 12,
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
    borderRadius: 14,
    backgroundColor: "rgba(240,244,248,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
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
