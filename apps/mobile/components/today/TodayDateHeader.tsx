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
      <View style={styles.heroGlowLarge} />
      <View style={styles.heroGlowSmall} />
      <Text style={styles.eyebrow}>Your Protocol</Text>
      <Text style={styles.title}>{formatIsoDate(selectedDate)}</Text>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          onPress={() => onChangeDay(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
        >
          <FontAwesome name="chevron-left" size={14} color={colors.textSecondary} />
        </Pressable>
        {isToday ? (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}
            onPress={onJumpToToday}
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
          >
            <Text style={styles.todayButtonText}>Jump to Today</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
          onPress={() => onChangeDay(1)}
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    margin: 16,
    marginTop: 10,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "rgba(54,94,130,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
    overflow: "hidden",
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
    top: -50,
    right: -18,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -20,
    left: -12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textWhite,
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
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textWhite,
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
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
});
