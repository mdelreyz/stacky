import { Text, View } from "react-native";

import { styles } from "./styles";

export function RoutineOverviewCard({
  duration,
  exerciseCount,
}: {
  duration: string;
  exerciseCount: number;
}) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewGlow} />
      <Text style={styles.overviewEyebrow}>Workout Template</Text>
      <Text style={styles.overviewTitle}>Shape a polished routine before you train.</Text>
      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewStatValue}>{exerciseCount}</Text>
          <Text style={styles.overviewStatLabel}>Exercises</Text>
        </View>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewStatValue}>{duration || "--"}</Text>
          <Text style={styles.overviewStatLabel}>Minutes</Text>
        </View>
      </View>
    </View>
  );
}
