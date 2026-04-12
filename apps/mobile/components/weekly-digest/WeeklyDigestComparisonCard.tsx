import { Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import {
  comparisonTone,
  formatPercentDelta,
  formatSignedCount,
  formatVolumeDelta,
  type WeeklyDigestIconName,
} from "./format";
import { WeeklyDigestStatBox } from "./WeeklyDigestStatBox";
import { styles } from "./styles";

export function WeeklyDigestComparisonCard({
  completionDelta,
  currentRange,
  exerciseDelta,
  icon,
  iconColor,
  journalDelta,
  previousRange,
  title,
  volumeDelta,
}: {
  completionDelta: number | null;
  currentRange: string;
  exerciseDelta: number | null;
  icon: WeeklyDigestIconName;
  iconColor: string;
  journalDelta: number | null;
  previousRange: string;
  title: string;
  volumeDelta: number | null;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name={icon} size={15} color={iconColor} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.metaText}>{currentRange}</Text>
      <Text style={styles.metaText}>Compared with {previousRange}</Text>
      <View style={styles.statsRow}>
        <ComparisonDeltaBox
          label="Completion"
          value={formatPercentDelta(completionDelta)}
          tone={comparisonTone(completionDelta)}
        />
        <ComparisonDeltaBox
          label="Journal"
          value={formatSignedCount(journalDelta)}
          tone={comparisonTone(journalDelta)}
        />
        <ComparisonDeltaBox
          label="Sessions"
          value={formatSignedCount(exerciseDelta)}
          tone={comparisonTone(exerciseDelta)}
        />
      </View>
      <Text style={styles.metaText}>Volume: {formatVolumeDelta(volumeDelta)}</Text>
    </View>
  );
}

function ComparisonDeltaBox({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "positive" | "negative" | "neutral";
  value: string;
}) {
  return (
    <WeeklyDigestStatBox
      label={label}
      value={value}
      color={
        tone === "positive"
          ? colors.success
          : tone === "negative"
            ? colors.danger
            : colors.textSecondary
      }
    />
  );
}
