import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { formatIsoDate } from "@/lib/date";
import type { WeeklyDigest } from "@/lib/api";

import { WeeklyDigestStatBox } from "./WeeklyDigestStatBox";
import { styles } from "./styles";

export function WeeklyDigestAdherenceCard({
  adherence,
  completionPct,
}: {
  adherence: WeeklyDigest["adherence"];
  completionPct: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="check-circle" size={15} color={colors.success} />
        <Text style={styles.cardTitle}>Adherence</Text>
      </View>
      <View style={styles.statsRow}>
        <WeeklyDigestStatBox label="Completion" value={`${completionPct}%`} color={colors.primaryDark} />
        <WeeklyDigestStatBox label="Taken" value={String(adherence.taken_count)} color={colors.success} />
        <WeeklyDigestStatBox label="Skipped" value={String(adherence.skipped_count)} color={colors.danger} />
      </View>

      <View style={styles.barChart}>
        {adherence.daily_rates.map((day) => {
          const height = day.rate != null ? Math.max(day.rate * 60, 4) : 4;
          const isBest = day.date === adherence.best_day;
          const isWorst = day.date === adherence.worst_day;
          const barColor = isBest ? colors.success : isWorst ? colors.danger : colors.primary;
          const dayLabel = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "narrow",
          });

          return (
            <View key={day.date} style={styles.barCol}>
              <View style={[styles.bar, { height, backgroundColor: barColor }]} />
              <Text style={styles.barLabel}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>

      {adherence.best_day ? (
        <Text style={styles.metaText}>
          Best: {formatIsoDate(adherence.best_day)}
          {adherence.worst_day ? ` · Worst: ${formatIsoDate(adherence.worst_day)}` : ""}
        </Text>
      ) : null}
    </View>
  );
}
