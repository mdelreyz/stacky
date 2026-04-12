import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { METRIC_CONFIG, METRIC_LABELS, type MetricKey } from "./config";
import { styles } from "./styles";

export function HealthJournalMetricsCard({
  energy,
  mood,
  onSetMetric,
  sleep,
  stress,
}: {
  energy: number | null;
  mood: number | null;
  onSetMetric: (key: MetricKey, value: number | null) => void;
  sleep: number | null;
  stress: number | null;
}) {
  const metricValues = { energy, mood, sleep, stress };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>How are you feeling today?</Text>
      {METRIC_LABELS.map((key) => {
        const config = METRIC_CONFIG[key];
        const value = metricValues[key];
        return (
          <View key={key} style={styles.metricRow}>
            <View style={[styles.metricIcon, { backgroundColor: `${config.color}14` }]}>
              <FontAwesome name={config.icon as any} size={14} color={config.color} />
            </View>
            <Text style={styles.metricLabel}>{config.label}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <Pressable
                  key={score}
                  style={[
                    styles.ratingDot,
                    value !== null && score <= value && { backgroundColor: config.color },
                  ]}
                  onPress={() => onSetMetric(key, score === value ? null : score)}
                  accessibilityRole="button"
                  accessibilityLabel={`${config.label} ${score}`}
                />
              ))}
            </View>
            <Text style={styles.ratingValue}>{value ?? "-"}</Text>
          </View>
        );
      })}
    </View>
  );
}
