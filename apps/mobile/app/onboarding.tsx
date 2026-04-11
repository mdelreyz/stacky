import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, Stack } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { NumberField } from "@/components/profile/NumberField";
import { colors } from "@/constants/Colors";
import { ProtocolsLogo } from "@/components/ProtocolsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { HealthGoal, InteractionMode } from "@/lib/api";

const STEPS = ["welcome", "goals", "constraints", "path"] as const;
type Step = (typeof STEPS)[number];

const GOAL_OPTIONS: Array<{ value: HealthGoal; label: string; icon: string }> = [
  { value: "longevity", label: "Longevity", icon: "heart" },
  { value: "cognitive", label: "Cognitive", icon: "lightbulb-o" },
  { value: "sleep", label: "Sleep", icon: "moon-o" },
  { value: "stress", label: "Stress Relief", icon: "leaf" },
  { value: "energy", label: "Energy", icon: "bolt" },
  { value: "immunity", label: "Immunity", icon: "shield" },
  { value: "skin", label: "Skin", icon: "star" },
  { value: "hair", label: "Hair", icon: "magic" },
  { value: "joint_health", label: "Joint Health", icon: "hand-rock-o" },
  { value: "gut_health", label: "Gut Health", icon: "circle-o" },
  { value: "weight_management", label: "Weight", icon: "balance-scale" },
  { value: "muscle_recovery", label: "Recovery", icon: "refresh" },
  { value: "cardiovascular", label: "Cardiovascular", icon: "heartbeat" },
  { value: "hormonal_balance", label: "Hormonal", icon: "sliders" },
];

const MODE_OPTIONS: Array<{
  value: InteractionMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "guided",
    label: "Guided",
    description: "AI asks questions and builds your stack",
    icon: "comments",
  },
  {
    value: "automated",
    label: "Automated",
    description: "AI proposes a complete protocol for you",
    icon: "magic",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "AI assists, you drive selection",
    icon: "sliders",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Full manual control",
    icon: "cogs",
  },
];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedGoals, setSelectedGoals] = useState<HealthGoal[]>([]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("guided");
  const [maxSupplements, setMaxSupplements] = useState("");
  const [age, setAge] = useState("");
  const [biologicalSex, setBiologicalSex] = useState<"male" | "female" | "other" | null>(null);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const toggleGoal = (goal: HealthGoal) => {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((g) => g !== goal)
        : current.length < 5
          ? [...current, goal]
          : current,
    );
  };

  const saveAndContinue = async (destination: "wizard" | "browse" | "home") => {
    setSaving(true);
    try {
      await prefsApi.upsert({
        interaction_mode: interactionMode,
        primary_goals: selectedGoals.length > 0 ? selectedGoals : null,
        max_supplements_per_day: maxSupplements ? Number(maxSupplements) : null,
        age: age ? Number(age) : null,
        biological_sex: biologicalSex,
      });

      if (destination === "wizard") {
        router.replace("/wizard");
      } else if (destination === "browse") {
        router.replace("/(tabs)/protocols");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      showError(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <AmbientBackdrop canvasStyle={styles.backdrop} />

      <View style={styles.header}>
        <ProtocolsLogo size={36} />
        <View style={styles.stepIndicator}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}
            />
          ))}
        </View>
      </View>

      <FadeInView key={step}>
        {step === "welcome" && (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <View style={styles.heroGlowLarge} />
              <View style={styles.heroGlowSmall} />
              <Text style={styles.heroEyebrow}>Welcome</Text>
              <Text style={styles.heroTitle}>
                Hi, {user?.first_name ?? "there"}
              </Text>
              <Text style={styles.heroSubtitle}>
                Let's set up your personal health command center. This takes about
                a minute and helps us tailor everything to your goals.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => setStep("goals")}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <FontAwesome name="arrow-right" size={14} color={colors.white} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        )}

        {step === "goals" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>Step 1 of 3</Text>
              <Text style={styles.cardTitle}>What are your health goals?</Text>
              <Text style={styles.cardSubtitle}>
                Select up to 5 goals. These drive AI recommendations, protocol
                scoring, and your daily plan.
              </Text>

              <View style={styles.goalGrid}>
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.value);
                  return (
                    <Pressable
                      key={goal.value}
                      style={({ pressed }) => [
                        styles.goalChip,
                        isSelected && styles.goalChipSelected,
                        pressed && styles.chipPressed,
                      ]}
                      onPress={() => toggleGoal(goal.value)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={goal.label}
                      accessibilityState={{ checked: isSelected }}
                    >
                      <FontAwesome
                        name={goal.icon as any}
                        size={14}
                        color={isSelected ? colors.primaryDarker : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.goalChipText,
                          isSelected && styles.goalChipTextSelected,
                        ]}
                      >
                        {goal.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                {selectedGoals.length}/5 selected
              </Text>
            </View>

            <View style={styles.navRow}>
              <Pressable
                style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
                onPress={() => setStep("welcome")}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <FontAwesome name="arrow-left" size={14} color={colors.textSecondary} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.navButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setStep("constraints")}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <FontAwesome name="arrow-right" size={14} color={colors.white} />
              </Pressable>
            </View>
          </View>
        )}

        {step === "constraints" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>Step 2 of 3</Text>
              <Text style={styles.cardTitle}>Quick preferences</Text>
              <Text style={styles.cardSubtitle}>
                Optional — helps us calibrate recommendations. You can always
                change these later.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Interaction mode</Text>
                <View style={styles.modeGrid}>
                  {MODE_OPTIONS.map((mode) => {
                    const isSelected = interactionMode === mode.value;
                    return (
                      <Pressable
                        key={mode.value}
                        style={({ pressed }) => [
                          styles.modeCard,
                          isSelected && styles.modeCardSelected,
                          pressed && styles.chipPressed,
                        ]}
                        onPress={() => setInteractionMode(mode.value)}
                        accessibilityRole="radio"
                        accessibilityLabel={mode.label}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <FontAwesome
                          name={mode.icon as any}
                          size={16}
                          color={isSelected ? colors.primaryDarker : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.modeLabel,
                            isSelected && styles.modeLabelSelected,
                          ]}
                        >
                          {mode.label}
                        </Text>
                        <Text style={styles.modeDescription}>
                          {mode.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <NumberField
                  label="Max supplements per day"
                  value={maxSupplements}
                  onChangeText={setMaxSupplements}
                />
              </View>

              <View style={styles.inlineRow}>
                <View style={styles.inlineField}>
                  <NumberField
                    label="Age"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
                <View style={styles.inlineField}>
                  <Text style={styles.fieldLabel}>Biological sex</Text>
                  <View style={styles.sexRow}>
                    {(["male", "female", "other"] as const).map((s) => (
                      <Pressable
                        key={s}
                        style={({ pressed }) => [
                          styles.sexChip,
                          biologicalSex === s && styles.sexChipSelected,
                          pressed && styles.chipPressed,
                        ]}
                        onPress={() => setBiologicalSex(biologicalSex === s ? null : s)}
                        accessibilityRole="radio"
                        accessibilityLabel={s}
                        accessibilityState={{ selected: biologicalSex === s }}
                      >
                        <Text
                          style={[
                            styles.sexChipText,
                            biologicalSex === s && styles.sexChipTextSelected,
                          ]}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable
                style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
                onPress={() => setStep("goals")}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <FontAwesome name="arrow-left" size={14} color={colors.textSecondary} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.navButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setStep("path")}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <FontAwesome name="arrow-right" size={14} color={colors.white} />
              </Pressable>
            </View>
          </View>
        )}

        {step === "path" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>Step 3 of 3</Text>
              <Text style={styles.cardTitle}>How do you want to start?</Text>
              <Text style={styles.cardSubtitle}>
                Choose how to build your first protocol stack.
              </Text>

              <View style={styles.pathGrid}>
                <Pressable
                  style={({ pressed }) => [
                    styles.pathCard,
                    styles.pathCardPrimary,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => saveAndContinue("wizard")}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="AI guided wizard"
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <FontAwesome name="comments" size={24} color={colors.white} />
                      <Text style={styles.pathCardPrimaryTitle}>AI Wizard</Text>
                      <Text style={styles.pathCardPrimaryDesc}>
                        Answer a few questions and we'll build a personalized
                        protocol stack for you
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.pathCard, pressed && styles.chipPressed]}
                  onPress={() => saveAndContinue("browse")}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Browse catalog"
                >
                  {saving ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <FontAwesome name="search" size={22} color={colors.primary} />
                      <Text style={styles.pathCardTitle}>Browse Catalog</Text>
                      <Text style={styles.pathCardDesc}>
                        Explore supplements, medications, therapies, and peptides
                        on your own
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.pathCard, pressed && styles.chipPressed]}
                  onPress={() => saveAndContinue("home")}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Skip to home"
                >
                  {saving ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <FontAwesome name="home" size={22} color={colors.primary} />
                      <Text style={styles.pathCardTitle}>Go to Home</Text>
                      <Text style={styles.pathCardDesc}>
                        Set up your stack later from the Protocols tab
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => setStep("constraints")}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <FontAwesome name="arrow-left" size={14} color={colors.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          </View>
        )}
      </FadeInView>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 32, position: "relative" },
  backdrop: { top: -48, height: 1400 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },

  section: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // ── Hero card (welcome step) ──────────────
  heroCard: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -60,
    right: -14,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.14)",
    left: -12,
    bottom: -26,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.74)",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.textWhite,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 23,
  },

  // ── Glass card ────────────────────────────
  card: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
    padding: 20,
    marginTop: 8,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.grayDark,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },

  // ── Goal chips ────────────────────────────
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  goalChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  goalChipTextSelected: {
    color: colors.primaryDarker,
  },
  chipPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: "right",
  },

  // ── Interaction mode ──────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modeGrid: {
    gap: 10,
  },
  modeCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    gap: 2,
  },
  modeCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 4,
  },
  modeLabelSelected: {
    color: colors.primaryDarker,
  },
  modeDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  // ── Inline fields ─────────────────────────
  inlineRow: {
    flexDirection: "row",
    gap: 14,
  },
  inlineField: {
    flex: 1,
  },
  sexRow: {
    flexDirection: "row",
    gap: 8,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  sexChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  sexChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sexChipTextSelected: {
    color: colors.primaryDarker,
  },

  // ── Path cards ────────────────────────────
  pathGrid: {
    gap: 12,
  },
  pathCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "rgba(248,251,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    gap: 6,
    alignItems: "center",
  },
  pathCardPrimary: {
    backgroundColor: "rgba(54,94,130,0.94)",
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 22,
  },
  pathCardPrimaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textWhite,
  },
  pathCardPrimaryDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    lineHeight: 19,
  },
  pathCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.grayDark,
  },
  pathCardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },

  // ── Buttons ───────────────────────────────
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    flex: 1,
    marginLeft: 16,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
