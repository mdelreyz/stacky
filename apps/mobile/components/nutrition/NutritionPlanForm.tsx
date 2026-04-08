import type { Dispatch, SetStateAction } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { MACRO_LEVEL_OPTIONS, NUTRITION_CYCLE_TYPE_OPTIONS } from "@/lib/nutrition";
import type { MacroLevel, NutritionCycleType, NutritionPhase } from "@/lib/api";

export interface NutritionPlanFormState {
  name: string;
  cycleType: NutritionCycleType;
  phaseName: string;
  durationDays: string;
  useMacroProfile: boolean;
  carbs: MacroLevel;
  protein: MacroLevel;
  fat: MacroLevel;
  pattern: string;
  restrictionsText: string;
  notes: string;
}

export function createDefaultNutritionPlanState(): NutritionPlanFormState {
  return {
    name: "",
    cycleType: "macro_profile",
    phaseName: "Primary Phase",
    durationDays: "7",
    useMacroProfile: true,
    carbs: "medium",
    protein: "medium",
    fat: "medium",
    pattern: "",
    restrictionsText: "",
    notes: "",
  };
}

export function buildNutritionPhase(state: NutritionPlanFormState): NutritionPhase {
  return {
    name: state.phaseName.trim() || "Primary Phase",
    duration_days: Number(state.durationDays) || 1,
    macro_profile: state.useMacroProfile
      ? {
          carbs: state.carbs,
          protein: state.protein,
          fat: state.fat,
        }
      : null,
    pattern: state.pattern.trim() || null,
    restrictions: state.restrictionsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    notes: state.notes.trim() || null,
  };
}

export function NutritionPlanForm({
  state,
  setState,
  saving,
  primaryLabel,
  onSubmit,
  secondaryLabel,
  onSecondaryAction,
}: {
  state: NutritionPlanFormState;
  setState: Dispatch<SetStateAction<NutritionPlanFormState>>;
  saving: boolean;
  primaryLabel: string;
  onSubmit: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan</Text>
        <TextInput
          style={styles.input}
          value={state.name}
          onChangeText={(value) => setState((current) => ({ ...current, name: value }))}
          placeholder="Low FODMAP Reset"
        />
        <Text style={styles.helperText}>Use one active nutrition plan at a time.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plan Type</Text>
        <OptionGrid
          options={NUTRITION_CYCLE_TYPE_OPTIONS}
          selected={state.cycleType}
          onSelect={(value) =>
            setState((current) => ({
              ...current,
              cycleType: value as NutritionCycleType,
              useMacroProfile: value === "macro_profile" ? true : current.useMacroProfile,
            }))
          }
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Current Phase</Text>
        <TextInput
          style={styles.input}
          value={state.phaseName}
          onChangeText={(value) => setState((current) => ({ ...current, phaseName: value }))}
          placeholder="Primary Phase"
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          keyboardType="number-pad"
          value={state.durationDays}
          onChangeText={(value) => setState((current) => ({ ...current, durationDays: value }))}
          placeholder="7"
        />
        <Text style={styles.helperText}>Phase length in days before the cycle repeats or transitions.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleHeader}>
          <Text style={styles.sectionTitle}>Macro Profile</Text>
          <Pressable
            style={[styles.toggleRow, state.useMacroProfile && styles.toggleRowActive]}
            onPress={() => setState((current) => ({ ...current, useMacroProfile: !current.useMacroProfile }))}
          >
            <FontAwesome
              name={state.useMacroProfile ? "check-square-o" : "square-o"}
              size={18}
              color={state.useMacroProfile ? "#2b8a3e" : "#868e96"}
            />
            <Text style={styles.toggleText}>Track macros</Text>
          </Pressable>
        </View>

        {state.useMacroProfile ? (
          <View style={styles.macroGrid}>
            <MacroSelector
              label="Carbs"
              selected={state.carbs}
              onSelect={(value) => setState((current) => ({ ...current, carbs: value }))}
            />
            <MacroSelector
              label="Protein"
              selected={state.protein}
              onSelect={(value) => setState((current) => ({ ...current, protein: value }))}
            />
            <MacroSelector
              label="Fat"
              selected={state.fat}
              onSelect={(value) => setState((current) => ({ ...current, fat: value }))}
            />
          </View>
        ) : (
          <Text style={styles.helperText}>Leave macro emphasis off for diet-only or restriction-led plans.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{state.cycleType === "named_diet" ? "Diet Name" : "Pattern"}</Text>
        <TextInput
          style={styles.input}
          value={state.pattern}
          onChangeText={(value) => setState((current) => ({ ...current, pattern: value }))}
          placeholder={patternPlaceholder(state.cycleType)}
        />
        <TextInput
          style={[styles.input, styles.spacedInput]}
          value={state.restrictionsText}
          onChangeText={(value) => setState((current) => ({ ...current, restrictionsText: value }))}
          placeholder="Restrictions, separated by commas"
        />
        <TextInput
          style={[styles.input, styles.spacedInput, styles.notesInput]}
          multiline
          value={state.notes}
          onChangeText={(value) => setState((current) => ({ ...current, notes: value }))}
          placeholder="Optional notes"
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

function MacroSelector({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: MacroLevel;
  onSelect: (value: MacroLevel) => void;
}) {
  return (
    <View style={styles.macroSection}>
      <Text style={styles.macroLabel}>{label}</Text>
      <OptionGrid
        options={MACRO_LEVEL_OPTIONS}
        selected={selected}
        onSelect={(value) => onSelect(value as MacroLevel)}
      />
    </View>
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
          style={[styles.optionChip, option.value === selected && styles.optionChipSelected]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[styles.optionChipText, option.value === selected && styles.optionChipTextSelected]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function patternPlaceholder(cycleType: NutritionCycleType): string {
  switch (cycleType) {
    case "named_diet":
      return "Low FODMAP, Atkins, SCD";
    case "elimination":
      return "Elimination, reintroduction, limit-dish";
    case "custom":
      return "Custom eating pattern";
    default:
      return "Optional pattern or focus";
  }
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
  spacedInput: {
    marginTop: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#868e96",
    marginTop: 8,
    lineHeight: 18,
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
  toggleHeader: {
    gap: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    color: "#495057",
  },
  macroGrid: {
    gap: 16,
  },
  macroSection: {
    gap: 8,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#495057",
  },
  primaryButton: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#228be6",
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#fff5f5",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#c92a2a",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
