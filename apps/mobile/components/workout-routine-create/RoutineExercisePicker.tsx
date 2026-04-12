import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { ExerciseSearchPicker } from "@/components/exercise/ExerciseSearchPicker";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function RoutineExercisePicker({
  exerciseCount,
  onClose,
  onSelectExercise,
  selectedIds,
}: {
  exerciseCount: number;
  onClose: () => void;
  onSelectExercise: (exercise: import("@protocols/domain").Exercise) => void;
  selectedIds: string[];
}) {
  return (
    <View style={styles.pickerScreen}>
      <AmbientBackdrop canvasStyle={styles.pickerBackdrop} />
      <FadeInView style={styles.pickerShell}>
        <View style={styles.pickerHeader}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.pickerIconButton, pressed && styles.softPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.pickerTitleWrap}>
            <Text style={styles.pickerEyebrow}>Routine Builder</Text>
            <Text style={styles.pickerTitle}>Add Exercises ({exerciseCount})</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.pickerDoneButton, pressed && styles.softPressed]}
            accessibilityRole="button"
            accessibilityLabel="Done adding exercises"
          >
            <Text style={styles.pickerDoneText}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.pickerBody}>
          <ExerciseSearchPicker onSelect={onSelectExercise} selectedIds={selectedIds} />
        </View>
      </FadeInView>
    </View>
  );
}
