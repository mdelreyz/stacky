import type { Dispatch, SetStateAction } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { ProtocolScheduleSection } from "@/components/protocols/ProtocolScheduleSection";
import type { UserMedication, UserSupplement, UserTherapy } from "@/lib/api";
import type { ProtocolFormState } from "@/lib/protocol-schedule";
import { getFrequencyLabel, getTakeWindowLabel } from "@/lib/schedule";
import { readTherapySettings } from "@/lib/therapy-settings";

export type { ProtocolFormState } from "@/lib/protocol-schedule";

export function ProtocolForm({
  state,
  setState,
  supplements,
  medications,
  therapies,
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
  saving: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stack Details</Text>
        <TextInput
          style={styles.input}
          value={state.name}
          onChangeText={(value) => setState((current) => ({ ...current, name: value }))}
          placeholder="Morning Stack"
          placeholderTextColor="#adb5bd"
        />
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={state.description}
          onChangeText={(value) => setState((current) => ({ ...current, description: value }))}
          placeholder="Optional context or goal for this stack"
          placeholderTextColor="#adb5bd"
        />
      </View>

      <ProtocolScheduleSection state={state} setState={setState} />

      <View style={styles.card}>
        <View style={styles.selectionHeader}>
          <Text style={styles.sectionTitle}>Included Supplements</Text>
          <Text style={styles.selectionCount}>{state.selectedUserSupplementIds.length} selected</Text>
        </View>
        <Text style={styles.helperText}>
          Inactive supplements stay visible here so older stacks can be cleaned up without losing context.
        </Text>

        <View style={styles.optionList}>
          {supplements.map((supplement) => {
            const selected = state.selectedUserSupplementIds.includes(supplement.id);
            const lockedInactive = !supplement.is_active && !selected;
            return (
              <Pressable
                key={supplement.id}
                style={[
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  lockedInactive && styles.optionRowDisabled,
                ]}
                onPress={() => {
                  if (lockedInactive) return;
                  setState((current) => ({
                    ...current,
                    selectedUserSupplementIds: selected
                      ? current.selectedUserSupplementIds.filter((itemId) => itemId !== supplement.id)
                      : [...current.selectedUserSupplementIds, supplement.id],
                  }));
                }}
              >
                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{supplement.supplement.name}</Text>
                    {!supplement.is_active ? (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inactive</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.optionMeta}>
                    {supplement.dosage_amount}
                    {supplement.dosage_unit} · {getFrequencyLabel(supplement.frequency)} ·{" "}
                    {getTakeWindowLabel(supplement.take_window)}
                  </Text>
                </View>
                <FontAwesome
                  name={selected ? "check-square-o" : "square-o"}
                  size={20}
                  color={selected ? "#228be6" : "#adb5bd"}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.selectionHeader}>
          <Text style={styles.sectionTitle}>Included Medications</Text>
          <Text style={styles.selectionCount}>{state.selectedUserMedicationIds.length} selected</Text>
        </View>
        <Text style={styles.helperText}>
          Keep medications separate from supplements while still allowing them in the same named stack.
        </Text>

        <View style={styles.optionList}>
          {medications.map((medication) => {
            const selected = state.selectedUserMedicationIds.includes(medication.id);
            const lockedInactive = !medication.is_active && !selected;
            return (
              <Pressable
                key={medication.id}
                style={[
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  lockedInactive && styles.optionRowDisabled,
                ]}
                onPress={() => {
                  if (lockedInactive) return;
                  setState((current) => ({
                    ...current,
                    selectedUserMedicationIds: selected
                      ? current.selectedUserMedicationIds.filter((itemId) => itemId !== medication.id)
                      : [...current.selectedUserMedicationIds, medication.id],
                  }));
                }}
              >
                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{medication.medication.name}</Text>
                    {!medication.is_active ? (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inactive</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.optionMeta}>
                    {medication.dosage_amount}
                    {medication.dosage_unit} · {getFrequencyLabel(medication.frequency)} ·{" "}
                    {getTakeWindowLabel(medication.take_window)}
                  </Text>
                </View>
                <FontAwesome
                  name={selected ? "check-square-o" : "square-o"}
                  size={20}
                  color={selected ? "#228be6" : "#adb5bd"}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.selectionHeader}>
          <Text style={styles.sectionTitle}>Included Modalities</Text>
          <Text style={styles.selectionCount}>{state.selectedUserTherapyIds.length} selected</Text>
        </View>
        <Text style={styles.helperText}>
          Use this for therapies, devices, meditation, training, recovery, or other scheduled protocols.
        </Text>

        <View style={styles.optionList}>
          {therapies.map((therapy) => {
            const selected = state.selectedUserTherapyIds.includes(therapy.id);
            const lockedInactive = !therapy.is_active && !selected;
            const settingsState = readTherapySettings(therapy.settings);
            const detail = settingsState.sessionDetails || settingsState.lastSessionDetails;
            return (
              <Pressable
                key={therapy.id}
                style={[
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  lockedInactive && styles.optionRowDisabled,
                ]}
                onPress={() => {
                  if (lockedInactive) return;
                  setState((current) => ({
                    ...current,
                    selectedUserTherapyIds: selected
                      ? current.selectedUserTherapyIds.filter((itemId) => itemId !== therapy.id)
                      : [...current.selectedUserTherapyIds, therapy.id],
                  }));
                }}
              >
                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{therapy.therapy.name}</Text>
                    {!therapy.is_active ? (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inactive</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.optionMeta}>
                    {therapy.duration_minutes ? `${therapy.duration_minutes} min · ` : ""}
                    {getFrequencyLabel(therapy.frequency)} · {getTakeWindowLabel(therapy.take_window)}
                  </Text>
                  {detail ? <Text style={styles.optionSubmeta}>{detail}</Text> : null}
                </View>
                <FontAwesome
                  name={selected ? "check-square-o" : "square-o"}
                  size={20}
                  color={selected ? "#228be6" : "#adb5bd"}
                />
              </Pressable>
            );
          })}
        </View>
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
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
    marginBottom: 0,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#868e96",
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6c757d",
    marginBottom: 12,
  },
  optionList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f8f9fa",
  },
  optionRowSelected: {
    borderColor: "#74c0fc",
    backgroundColor: "#e7f5ff",
  },
  optionRowDisabled: {
    opacity: 0.55,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
  },
  optionMeta: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  optionSubmeta: {
    fontSize: 12,
    color: "#495057",
    marginTop: 4,
  },
  inactiveBadge: {
    backgroundColor: "#fff3bf",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8f5b00",
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
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#c92a2a",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
