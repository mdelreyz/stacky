import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import type { WeeklyDigest } from "@/lib/api";

import { WeeklyDigestStatBox } from "./WeeklyDigestStatBox";
import { styles } from "./styles";

export function WeeklyDigestJournalCard({
  journal,
}: {
  journal: WeeklyDigest["journal"];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="book" size={15} color={colors.accent} />
        <Text style={styles.cardTitle}>Journal</Text>
      </View>
      {journal.entry_count === 0 ? (
        <Text style={styles.emptyText}>No journal entries this week.</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            {journal.avg_energy != null ? (
              <WeeklyDigestStatBox label="Energy" value={String(journal.avg_energy)} color={colors.warning} />
            ) : null}
            {journal.avg_mood != null ? (
              <WeeklyDigestStatBox label="Mood" value={String(journal.avg_mood)} color={colors.primary} />
            ) : null}
            {journal.avg_sleep != null ? (
              <WeeklyDigestStatBox label="Sleep" value={String(journal.avg_sleep)} color={colors.accent} />
            ) : null}
            {journal.avg_stress != null ? (
              <WeeklyDigestStatBox label="Stress" value={String(journal.avg_stress)} color={colors.danger} />
            ) : null}
          </View>
          <Text style={styles.metaText}>{journal.entry_count} entries this week</Text>

          {Object.keys(journal.symptom_frequency).length > 0 ? (
            <View style={styles.symptomRow}>
              {Object.entries(journal.symptom_frequency)
                .slice(0, 4)
                .map(([symptom, count]) => (
                  <View key={symptom} style={styles.symptomChip}>
                    <Text style={styles.symptomText}>
                      {symptom} ({count})
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
