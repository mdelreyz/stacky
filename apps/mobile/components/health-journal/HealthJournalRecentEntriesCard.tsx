import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { formatIsoDate } from "@/lib/date";
import type { HealthJournalEntry } from "@/lib/api";

import { METRIC_CONFIG } from "./config";
import { styles } from "./styles";

export function HealthJournalRecentEntriesCard({
  recentEntries,
}: {
  recentEntries: HealthJournalEntry[];
}) {
  if (recentEntries.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Recent Entries</Text>
      {recentEntries.map((entry) => (
        <View key={entry.id} style={styles.historyRow}>
          <Text style={styles.historyDate}>{formatIsoDate(entry.entry_date)}</Text>
          <View style={styles.historyMetrics}>
            {entry.energy_level != null ? (
              <MiniMetric icon="bolt" value={entry.energy_level} color={METRIC_CONFIG.energy.color} />
            ) : null}
            {entry.mood_level != null ? (
              <MiniMetric icon="smile-o" value={entry.mood_level} color={METRIC_CONFIG.mood.color} />
            ) : null}
            {entry.sleep_quality != null ? (
              <MiniMetric icon="moon-o" value={entry.sleep_quality} color={METRIC_CONFIG.sleep.color} />
            ) : null}
            {entry.stress_level != null ? (
              <MiniMetric icon="heartbeat" value={entry.stress_level} color={METRIC_CONFIG.stress.color} />
            ) : null}
          </View>
          {entry.symptoms && entry.symptoms.length > 0 ? (
            <Text style={styles.historySymptoms}>{entry.symptoms.join(", ")}</Text>
          ) : null}
          {entry.notes ? (
            <Text style={styles.historyNotes} numberOfLines={2}>
              {entry.notes}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function MiniMetric({
  color,
  icon,
  value,
}: {
  color: string;
  icon: string;
  value: number;
}) {
  return (
    <View style={styles.miniMetric}>
      <FontAwesome name={icon as any} size={10} color={color} />
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
    </View>
  );
}
