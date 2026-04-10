import type { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import {
  PROTOCOL_SCHEDULE_TYPE_OPTIONS,
  PROTOCOL_WEEK_OPTIONS,
  type ProtocolFormState,
} from "@/lib/protocol-schedule";

export function ProtocolScheduleSection({
  state,
  setState,
}: {
  state: ProtocolFormState;
  setState: Dispatch<SetStateAction<ProtocolFormState>>;
}) {
  const schedule = state.schedule;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Regime Schedule</Text>
      <Text style={styles.helperText}>
        Keep stacks passive for simple grouping, or schedule them for vacation plans, rotating weeks, or manual on/off regimes.
      </Text>

      <View style={styles.optionGrid}>
        {PROTOCOL_SCHEDULE_TYPE_OPTIONS.map((option) => {
          const selected = option.value === schedule.type;
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.optionChip,
                selected && styles.optionChipSelected,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() =>
                setState((current) => ({
                  ...current,
                  schedule: {
                    ...current.schedule,
                    type: option.value,
                    manualIsActive: option.value === "manual" ? current.schedule.manualIsActive : true,
                  },
                }))
              }
            >
              <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {schedule.type === "manual" ? (
        <Pressable
          style={({ pressed }) => [
            styles.toggleRow,
            schedule.manualIsActive && styles.toggleRowActive,
            pressed && styles.pressed,
          ]}
          accessibilityRole="switch"
          accessibilityLabel="Manual regime active"
          accessibilityState={{ checked: schedule.manualIsActive }}
          onPress={() =>
            setState((current) => ({
              ...current,
              schedule: {
                ...current.schedule,
                manualIsActive: !current.schedule.manualIsActive,
              },
            }))
          }
        >
          <FontAwesome
            name={schedule.manualIsActive ? "check-square-o" : "square-o"}
            size={18}
            color={schedule.manualIsActive ? colors.success : colors.textMuted}
          />
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>{schedule.manualIsActive ? "Manual regime is active" : "Manual regime is paused"}</Text>
            <Text style={styles.toggleHint}>Use this for explicit plan switching, such as turning a vacation stack on or off.</Text>
          </View>
        </Pressable>
      ) : null}

      {schedule.type === "date_range" ? (
        <View style={styles.rangeGrid}>
          <View style={styles.rangeField}>
            <Text style={styles.fieldLabel}>Start</Text>
            <TextInput
              style={styles.input}
              value={schedule.startDate}
              onChangeText={(value) =>
                setState((current) => ({
                  ...current,
                  schedule: { ...current.schedule, startDate: value },
                }))
              }
              placeholder="2026-08-01"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.rangeField}>
            <Text style={styles.fieldLabel}>End</Text>
            <TextInput
              style={styles.input}
              value={schedule.endDate}
              onChangeText={(value) =>
                setState((current) => ({
                  ...current,
                  schedule: { ...current.schedule, endDate: value },
                }))
              }
              placeholder="2026-08-14"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
            />
          </View>
        </View>
      ) : null}

      {schedule.type === "week_of_month" ? (
        <View style={styles.weekSection}>
          <Text style={styles.fieldLabel}>Active Weeks</Text>
          <View style={styles.optionGrid}>
            {PROTOCOL_WEEK_OPTIONS.map((week) => {
              const selected = schedule.weeksOfMonth.includes(week);
              return (
                <Pressable
                  key={week}
                  style={({ pressed }) => [
                    styles.optionChip,
                    selected && styles.optionChipSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Week ${week}`}
                  accessibilityState={{ selected }}
                  onPress={() =>
                    setState((current) => ({
                      ...current,
                      schedule: {
                        ...current.schedule,
                        weeksOfMonth: selected
                          ? current.schedule.weeksOfMonth.filter((value) => value !== week)
                          : [...current.schedule.weeksOfMonth, week],
                      },
                    }))
                  }
                >
                  <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                    Week {week}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helperText}>Use this for patterns like “first week of each month only.”</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.grayDark,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  optionChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.infoBorder,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: colors.primaryDark,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 14,
    backgroundColor: "rgba(240,244,248,0.82)",
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  toggleRowActive: {
    backgroundColor: colors.successLight,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.grayDark,
  },
  toggleHint: {
    fontSize: 12,
    color: colors.gray,
    lineHeight: 18,
    marginTop: 4,
  },
  rangeGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  rangeField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(240,244,248,0.82)",
    fontSize: 15,
    color: colors.textPrimary,
  },
  weekSection: {
    marginTop: 14,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
});
