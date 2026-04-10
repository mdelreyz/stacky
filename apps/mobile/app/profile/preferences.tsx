import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { OptionGrid } from "@/components/forms/OptionGrid";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { HealthGoal, InteractionMode, UserPreferences } from "@/lib/api";

const INTERACTION_MODE_OPTIONS = [
  { value: "guided", label: "Guided" },
  { value: "automated", label: "Automated" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const GOAL_OPTIONS: Array<{ value: HealthGoal; label: string }> = [
  { value: "longevity", label: "Longevity" },
  { value: "cognitive", label: "Cognitive" },
  { value: "sleep", label: "Sleep" },
  { value: "stress", label: "Stress" },
  { value: "energy", label: "Energy" },
  { value: "immunity", label: "Immunity" },
  { value: "skin", label: "Skin" },
  { value: "hair", label: "Hair" },
  { value: "joint_health", label: "Joint Health" },
  { value: "gut_health", label: "Gut Health" },
  { value: "weight_management", label: "Weight" },
  { value: "muscle_recovery", label: "Recovery" },
  { value: "cardiovascular", label: "Cardiovascular" },
  { value: "hormonal_balance", label: "Hormonal" },
];

const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function PreferencesScreen() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("guided");
  const [maxSupplements, setMaxSupplements] = useState("");
  const [maxTablets, setMaxTablets] = useState("");
  const [maxMedications, setMaxMedications] = useState("");
  const [exerciseBlocks, setExerciseBlocks] = useState("");
  const [exerciseMinutes, setExerciseMinutes] = useState("");
  const [primaryGoals, setPrimaryGoals] = useState<HealthGoal[]>([]);
  const [focusConcerns, setFocusConcerns] = useState("");
  const [excludedIngredients, setExcludedIngredients] = useState("");
  const [age, setAge] = useState("");
  const [biologicalSex, setBiologicalSex] = useState<"male" | "female" | "other" | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    prefsApi
      .get()
      .then((result) => {
        if (cancelled) return;
        setPrefs(result);
        setInteractionMode(result.interaction_mode);
        setMaxSupplements(result.max_supplements_per_day != null ? String(result.max_supplements_per_day) : "");
        setMaxTablets(result.max_tablets_per_day != null ? String(result.max_tablets_per_day) : "");
        setMaxMedications(result.max_medications != null ? String(result.max_medications) : "");
        setExerciseBlocks(result.exercise_blocks_per_week != null ? String(result.exercise_blocks_per_week) : "");
        setExerciseMinutes(result.exercise_minutes_per_day != null ? String(result.exercise_minutes_per_day) : "");
        setPrimaryGoals(result.primary_goals ?? []);
        setFocusConcerns(result.focus_concerns?.join(", ") ?? "");
        setExcludedIngredients(result.excluded_ingredients?.join(", ") ?? "");
        setAge(result.age != null ? String(result.age) : "");
        setBiologicalSex(result.biological_sex ?? "");
        setNotes(result.notes ?? "");
      })
      .catch(() => {
        // No prefs yet — that's fine, user will create them
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const toggleGoal = (goal: HealthGoal) => {
    setPrimaryGoals((current) =>
      current.includes(goal)
        ? current.filter((g) => g !== goal)
        : current.length < 5
          ? [...current, goal]
          : current
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parseOptionalInt = (value: string) => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };

      const parseList = (value: string) => {
        const items = value.split(",").map((s) => s.trim()).filter(Boolean);
        return items.length > 0 ? items : null;
      };

      await prefsApi.upsert({
        interaction_mode: interactionMode,
        max_supplements_per_day: parseOptionalInt(maxSupplements),
        max_tablets_per_day: parseOptionalInt(maxTablets),
        max_medications: parseOptionalInt(maxMedications),
        exercise_blocks_per_week: parseOptionalInt(exerciseBlocks),
        exercise_minutes_per_day: parseOptionalInt(exerciseMinutes),
        primary_goals: primaryGoals.length > 0 ? primaryGoals : null,
        focus_concerns: parseList(focusConcerns),
        excluded_ingredients: parseList(excludedIngredients),
        age: parseOptionalInt(age),
        biological_sex: biologicalSex || null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (error: any) {
      showError(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlowScreenHeader
        title="Preferences"
        subtitle="Configure your protocol constraints and AI behavior"
      />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Interaction Mode</Text>
        <Text style={styles.hint}>
          Controls how much AI assistance you receive. Guided mode asks questions to build your stack. Expert mode gives you full manual control.
        </Text>
        <OptionGrid
          options={INTERACTION_MODE_OPTIONS}
          selected={interactionMode}
          onSelect={(value) => setInteractionMode(value as InteractionMode)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Health Goals</Text>
        <Text style={styles.hint}>Select up to 5 goals that drive your supplement recommendations.</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map((goal) => {
            const selected = primaryGoals.includes(goal.value);
            return (
              <Pressable
                key={goal.value}
                style={[styles.goalChip, selected && styles.goalChipSelected]}
                onPress={() => toggleGoal(goal.value)}
                accessibilityRole="checkbox"
                accessibilityLabel={goal.label}
                accessibilityState={{ checked: selected }}
              >
                <Text style={[styles.goalChipText, selected && styles.goalChipTextSelected]}>
                  {goal.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About You</Text>
        <View style={styles.row}>
          <View style={styles.ageField}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={[styles.input, styles.ageInput]}
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholder="—"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          <View style={styles.sexField}>
            <Text style={styles.fieldLabel}>Biological Sex</Text>
            <View style={styles.sexRow}>
              {SEX_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.sexChip, biologicalSex === opt.value && styles.sexChipSelected]}
                  onPress={() => setBiologicalSex(biologicalSex === opt.value ? "" : opt.value as typeof biologicalSex)}
                  accessibilityRole="radio"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ checked: biologicalSex === opt.value }}
                >
                  <Text style={[styles.sexChipText, biologicalSex === opt.value && styles.sexChipTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Slot Budgets</Text>
        <Text style={styles.hint}>Limits how many items the AI will recommend.</Text>
        <NumberField label="Max supplements per day" value={maxSupplements} onChangeText={setMaxSupplements} />
        <NumberField label="Max tablets per day" value={maxTablets} onChangeText={setMaxTablets} />
        <NumberField label="Max medications" value={maxMedications} onChangeText={setMaxMedications} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Exercise</Text>
        <NumberField label="Exercise blocks per week" value={exerciseBlocks} onChangeText={setExerciseBlocks} />
        <NumberField label="Exercise minutes per day" value={exerciseMinutes} onChangeText={setExerciseMinutes} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Focus Concerns</Text>
        <Text style={styles.hint}>Free-text concerns that shift AI picks (e.g., "brain fog, joint pain").</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          multiline
          value={focusConcerns}
          onChangeText={setFocusConcerns}
          placeholder="brain fog, joint pain, poor sleep"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Excluded Ingredients</Text>
        <Text style={styles.hint}>Allergy or preference exclusions, comma-separated.</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          multiline
          value={excludedIngredients}
          onChangeText={setExcludedIngredients}
          placeholder="shellfish, soy, gluten"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional context for AI recommendations"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Save preferences"
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <FontAwesome name="check" size={16} color={colors.white} />
            <Text style={styles.primaryButtonText}>Save Preferences</Text>
          </>
        )}
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.numberFieldRow}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <TextInput
        style={styles.numberFieldInput}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="—"
        placeholderTextColor={colors.textPlaceholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  ageField: {
    width: 112,
  },
  ageInput: {
    textAlign: "center",
  },
  sexField: {
    flex: 1,
    minWidth: 220,
  },
  sexRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sexChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  sexChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  sexChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sexChipTextSelected: {
    color: colors.primaryDark,
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  goalChipSelected: {
    backgroundColor: colors.primaryLight,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  goalChipTextSelected: {
    color: colors.primaryDark,
  },
  numberFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  numberFieldLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  numberFieldInput: {
    width: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
