import { Pressable, ScrollView, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { RoutineDetailsCard } from "@/components/workout-routine-create/RoutineDetailsCard";
import { RoutineExerciseListSection } from "@/components/workout-routine-create/RoutineExerciseListSection";
import { RoutineExercisePicker } from "@/components/workout-routine-create/RoutineExercisePicker";
import { RoutineOverviewCard } from "@/components/workout-routine-create/RoutineOverviewCard";
import { styles } from "@/components/workout-routine-create/styles";
import { colors } from "@/constants/Colors";
import { useCreateWorkoutRoutineScreen } from "@/lib/useCreateWorkoutRoutineScreen";

export default function CreateRoutineScreen() {
  const {
    description,
    duration,
    exercises,
    handleSave,
    handleSelectExercise,
    moveExercise,
    name,
    removeExercise,
    saving,
    setDescription,
    setDuration,
    setName,
    setShowPicker,
    showPicker,
    updateExercise,
  } = useCreateWorkoutRoutineScreen();

  if (showPicker) {
    return (
      <RoutineExercisePicker
        exerciseCount={exercises.length}
        onClose={() => setShowPicker(false)}
        onSelectExercise={handleSelectExercise}
        selectedIds={exercises.map((entry) => entry.exercise.id)}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader title="New Routine" subtitle="Build a workout template with target exercises" />

        <View style={styles.form}>
          <RoutineOverviewCard duration={duration} exerciseCount={exercises.length} />
          <RoutineDetailsCard
            description={description}
            duration={duration}
            name={name}
            setDescription={setDescription}
            setDuration={setDuration}
            setName={setName}
          />
          <RoutineExerciseListSection
            exercises={exercises}
            moveExercise={moveExercise}
            openPicker={() => setShowPicker(true)}
            removeExercise={removeExercise}
            updateExercise={updateExercise}
          />
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              saving && styles.saveBtnDisabled,
              pressed && !saving && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Create Routine"
          >
            <FontAwesome name="check-circle" size={16} color={colors.textWhite} />
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Routine"}</Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}
