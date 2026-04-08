import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
        <Pressable style={styles.arrowButton} onPress={() => onChangeDay(-1)}>
          <FontAwesome name="chevron-left" size={14} color="#495057" />
        </Pressable>
        {isToday ? (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        ) : (
          <Pressable style={styles.todayButton} onPress={onJumpToToday}>
            <Text style={styles.todayButtonText}>Jump to Today</Text>
          </Pressable>
        )}
        <Pressable style={styles.arrowButton} onPress={() => onChangeDay(1)}>
          <FontAwesome name="chevron-right" size={14} color="#495057" />
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
    color: "#6c757d",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212529",
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
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#e7f5ff",
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1864ab",
  },
  todayBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ebfbee",
  },
  todayBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2b8a3e",
  },
});
