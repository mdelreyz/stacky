import { Text, View } from "react-native";

import type { HealthJournalSummary } from "@/lib/api";

import { METRIC_CONFIG } from "./config";
import { styles } from "./styles";

export function HealthJournalSummaryCard({
  summary,
}: {
  summary: HealthJournalSummary | null;
}) {
  if (!summary || summary.entry_count === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>30-Day Averages</Text>
      <View style={styles.avgGrid}>
        {summary.avg_energy !== null ? (
          <AvgBadge label="Energy" value={summary.avg_energy} color={METRIC_CONFIG.energy.color} />
        ) : null}
        {summary.avg_mood !== null ? (
          <AvgBadge label="Mood" value={summary.avg_mood} color={METRIC_CONFIG.mood.color} />
        ) : null}
        {summary.avg_sleep !== null ? (
          <AvgBadge label="Sleep" value={summary.avg_sleep} color={METRIC_CONFIG.sleep.color} />
        ) : null}
        {summary.avg_stress !== null ? (
          <AvgBadge label="Stress" value={summary.avg_stress} color={METRIC_CONFIG.stress.color} />
        ) : null}
      </View>
      {Object.keys(summary.symptom_frequency).length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Top Symptoms</Text>
          <View style={styles.chipGrid}>
            {Object.entries(summary.symptom_frequency)
              .slice(0, 5)
              .map(([symptom, count]) => (
                <View key={symptom} style={styles.freqChip}>
                  <Text style={styles.freqText}>
                    {symptom} ({count})
                  </Text>
                </View>
              ))}
          </View>
        </>
      ) : null}
      <Text style={styles.entryCount}>{summary.entry_count} entries logged</Text>
    </View>
  );
}

function AvgBadge({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.avgBadge}>
      <Text style={[styles.avgValue, { color }]}>{value}</Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
}
