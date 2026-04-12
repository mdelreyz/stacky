import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { WeeklyDigest } from "@/lib/api";

import { formatExerciseVolume } from "./format";
import { WeeklyDigestStatBox } from "./WeeklyDigestStatBox";
import { styles } from "./styles";

export function WeeklyDigestExerciseCard({
  exercise,
}: {
  exercise: WeeklyDigest["exercise"];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="heartbeat" size={15} color={colors.danger} />
        <Text style={styles.cardTitle}>Exercise</Text>
      </View>
      {exercise.session_count === 0 ? (
        <Text style={styles.emptyText}>No workout sessions this week.</Text>
      ) : (
        <View style={styles.statsRow}>
          <WeeklyDigestStatBox label="Sessions" value={String(exercise.session_count)} color={colors.primaryDark} />
          <WeeklyDigestStatBox label="Sets" value={String(exercise.total_sets)} color={colors.success} />
          <WeeklyDigestStatBox label="Volume" value={formatExerciseVolume(exercise.total_volume)} color={colors.warning} />
        </View>
      )}
    </View>
  );
}
