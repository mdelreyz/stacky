import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Stack, router } from "expo-router";

import { ProtocolsLogo } from "@/components/ProtocolsLogo";
import { ConstraintsStep } from "@/components/onboarding/ConstraintsStep";
import { GoalsStep } from "@/components/onboarding/GoalsStep";
import { PathStep } from "@/components/onboarding/PathStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { STEPS, type Step } from "@/components/onboarding/config";
import { styles } from "@/components/onboarding/styles";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { useAuth } from "@/contexts/AuthContext";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import type { HealthGoal, InteractionMode } from "@/lib/api";

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
        ? current.filter((item) => item !== goal)
        : current.length < 5
          ? [...current, goal]
          : current,
    );
  };

  const saveAndContinue = async (destination: "wizard" | "browse" | "templates" | "home") => {
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
      } else if (destination === "templates") {
        router.replace("/protocol-templates");
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
          {STEPS.map((currentStep, index) => (
            <View
              key={currentStep}
              style={[styles.stepDot, index <= stepIndex && styles.stepDotActive]}
            />
          ))}
        </View>
      </View>

      <FadeInView key={step}>
        {step === "welcome" ? (
          <WelcomeStep
            firstName={user?.first_name}
            onGetStarted={() => setStep("goals")}
            onSkip={() => router.replace("/")}
          />
        ) : null}

        {step === "goals" ? (
          <GoalsStep
            selectedGoals={selectedGoals}
            onToggleGoal={toggleGoal}
            onBack={() => setStep("welcome")}
            onContinue={() => setStep("constraints")}
          />
        ) : null}

        {step === "constraints" ? (
          <ConstraintsStep
            age={age}
            biologicalSex={biologicalSex}
            interactionMode={interactionMode}
            maxSupplements={maxSupplements}
            onBack={() => setStep("goals")}
            onContinue={() => setStep("path")}
            onSetAge={setAge}
            onSetBiologicalSex={setBiologicalSex}
            onSetInteractionMode={setInteractionMode}
            onSetMaxSupplements={setMaxSupplements}
          />
        ) : null}

        {step === "path" ? (
          <PathStep
            saving={saving}
            onBack={() => setStep("constraints")}
            onChoose={saveAndContinue}
          />
        ) : null}
      </FadeInView>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
