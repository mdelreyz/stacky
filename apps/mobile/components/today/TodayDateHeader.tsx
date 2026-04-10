import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { formatIsoDate, isTodayIsoDate } from "@/lib/date";

export function TodayDateHeader({
  selectedDate,
  onChangeDay,
  onJumpToToday,
}: {
  selectedDate: string;
  onChangeDay: (delta: number) => void;
  onJumpToToday: () => void;
}) {
  const isToday = isTodayIsoDate(selectedDate);

  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>Your Protocol</Text>
      <Text style={styles.title}>{formatIsoDate(selectedDate)}</Text>

      <View style={styles.controls}>
        <Pressable style={styles.arrowButton} onPress={() => onChangeDay(-1)} accessibilityRole="button" accessibilityLabel="Previous day">
          <FontAwesome name="chevron-left" size={14} color={colors.textSecondary} />
        </Pressable>
        {isToday ? (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        ) : (
          <Pressable style={styles.todayButton} onPress={onJumpToToday} accessibilityRole="button" accessibilityLabel="Jump to today">
            <Text style={styles.todayButtonText}>Jump to Today</Text>
          </Pressable>
        )}
        <Pressable style={styles.arrowButton} onPress={() => onChangeDay(1)} accessibilityRole="button" accessibilityLabel="Next day">
          <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 10,
  },
  eyebrow: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDarker,
  },
  todayBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.successLight,
  },
  todayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.success,
  },
});
