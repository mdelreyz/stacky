import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { ItemSelectionList, type SelectableItem } from "@/components/protocols/ItemSelectionList";
import { ProtocolScheduleSection } from "@/components/protocols/ProtocolScheduleSection";
import type { UserMedication, UserPeptide, UserSupplement, UserTherapy } from "@/lib/api";
import type { ProtocolFormState } from "@/lib/protocol-schedule";
import { getFrequencyLabel, getTakeWindowLabel } from "@/lib/schedule";
import { describeTherapySettings } from "@/lib/therapy-settings";

export type { ProtocolFormState } from "@/lib/protocol-schedule";

function toSupplementItem(s: UserSupplement): SelectableItem {
  return {
    id: s.id,
    title: s.supplement.name,
    meta: `${s.dosage_amount}${s.dosage_unit} \u00b7 ${getFrequencyLabel(s.frequency)} \u00b7 ${getTakeWindowLabel(s.take_window)}`,
    is_active: s.is_active,
  };
}

function toMedicationItem(m: UserMedication): SelectableItem {
  return {
    id: m.id,
    title: m.medication.name,
    meta: `${m.dosage_amount}${m.dosage_unit} \u00b7 ${getFrequencyLabel(m.frequency)} \u00b7 ${getTakeWindowLabel(m.take_window)}`,
    is_active: m.is_active,
  };
}

function toTherapyItem(t: UserTherapy): SelectableItem {
  const detail = describeTherapySettings(t.settings);
  return {
    id: t.id,
    title: t.therapy.name,
    meta: `${t.duration_minutes ? `${t.duration_minutes} min \u00b7 ` : ""}${getFrequencyLabel(t.frequency)} \u00b7 ${getTakeWindowLabel(t.take_window)}`,
    submeta: detail || undefined,
    is_active: t.is_active,
  };
}

function toPeptideItem(p: UserPeptide): SelectableItem {
  return {
    id: p.id,
    title: p.peptide.name,
    meta: `${p.dosage_amount}${p.dosage_unit}${p.route ? ` \u00b7 ${p.route}` : ""} \u00b7 ${getFrequencyLabel(p.frequency)} \u00b7 ${getTakeWindowLabel(p.take_window)}`,
    is_active: p.is_active,
  };
}

export function ProtocolForm({
  state,
  setState,
  supplements,
  medications,
  therapies,
  peptides,
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  onSecondaryAction,
}: {
  state: ProtocolFormState;
  setState: Dispatch<SetStateAction<ProtocolFormState>>;
  supplements: UserSupplement[];
  medications: UserMedication[];
  therapies: UserTherapy[];
  peptides: UserPeptide[];
  saving: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const supplementItems = useMemo(() => supplements.map(toSupplementItem), [supplements]);
  const medicationItems = useMemo(() => medications.map(toMedicationItem), [medications]);
  const therapyItems = useMemo(() => therapies.map(toTherapyItem), [therapies]);
  const peptideItems = useMemo(() => peptides.map(toPeptideItem), [peptides]);

  const toggleId = useCallback(
    (key: "selectedUserSupplementIds" | "selectedUserMedicationIds" | "selectedUserTherapyIds" | "selectedUserPeptideIds", id: string) => {
      setState((current) => ({
        ...current,
        [key]: current[key].includes(id)
          ? current[key].filter((x) => x !== id)
          : [...current[key], id],
      }));
    },
    [setState],
  );

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stack Details</Text>
        <TextInput
          style={styles.input}
          value={state.name}
          onChangeText={(value) => setState((current) => ({ ...current, name: value }))}
          placeholder="Morning Stack"
          placeholderTextColor={colors.textPlaceholder}
        />
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.description}
          onChangeText={(value) => setState((current) => ({ ...current, description: value }))}
          placeholder="Optional context or goal for this stack"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <ProtocolScheduleSection state={state} setState={setState} />

      <ItemSelectionList
        title="Included Supplements"
        helperText="Inactive supplements stay visible here so older stacks can be cleaned up without losing context."
        items={supplementItems}
        selectedIds={state.selectedUserSupplementIds}
        onToggle={(id) => toggleId("selectedUserSupplementIds", id)}
      />

      <ItemSelectionList
        title="Included Medications"
        helperText="Keep medications separate from supplements while still allowing them in the same named stack."
        items={medicationItems}
        selectedIds={state.selectedUserMedicationIds}
        onToggle={(id) => toggleId("selectedUserMedicationIds", id)}
      />

      <ItemSelectionList
        title="Included Modalities"
        helperText="Use this for therapies, devices, meditation, training, recovery, or other scheduled protocols."
        items={therapyItems}
        selectedIds={state.selectedUserTherapyIds}
        onToggle={(id) => toggleId("selectedUserTherapyIds", id)}
      />

      <ItemSelectionList
        title="Included Peptides"
        helperText="Research, therapeutic, or performance peptides with injection schedules and cycling."
        items={peptideItems}
        selectedIds={state.selectedUserPeptideIds}
        onToggle={(id) => toggleId("selectedUserPeptideIds", id)}
      />

      <Pressable
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="check" size={16} color={colors.white} />
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </>
        )}
      </Pressable>

      {secondaryLabel && onSecondaryAction ? (
        <Pressable
          style={[styles.secondaryButton, saving && styles.buttonDisabled]}
          onPress={onSecondaryAction}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
    marginBottom: 0,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.dangerLight,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dangerDark,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
