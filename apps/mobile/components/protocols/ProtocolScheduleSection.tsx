import type { Dispatch, SetStateAction } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
              style={[styles.optionChip, selected && styles.optionChipSelected]}
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
          style={[styles.toggleRow, schedule.manualIsActive && styles.toggleRowActive]}
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
            color={schedule.manualIsActive ? "#2b8a3e" : "#868e96"}
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
              placeholderTextColor="#adb5bd"
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
              placeholderTextColor="#adb5bd"
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
                  style={[styles.optionChip, selected && styles.optionChipSelected]}
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
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#343a40",
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#868e96",
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
    backgroundColor: "#f1f3f5",
  },
  optionChipSelected: {
    backgroundColor: "#e7f5ff",
  },
  optionChipText: {
    color: "#495057",
    fontSize: 13,
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#1c7ed6",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    marginTop: 14,
  },
  toggleRowActive: {
    backgroundColor: "#ebfbee",
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#343a40",
  },
  toggleHint: {
    fontSize: 12,
    color: "#6c757d",
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
    color: "#6c757d",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    fontSize: 15,
    color: "#212529",
  },
  weekSection: {
    marginTop: 14,
  },
});
