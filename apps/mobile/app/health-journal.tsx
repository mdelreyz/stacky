import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { colors } from "@/constants/Colors";
import { healthJournal as journalApi } from "@/lib/api";
import { formatIsoDate, getTodayIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import type { HealthJournalEntry, HealthJournalSummary } from "@/lib/api";

const METRIC_LABELS = ["energy", "mood", "sleep", "stress"] as const;
type MetricKey = (typeof METRIC_LABELS)[number];

const METRIC_CONFIG: Record<MetricKey, { icon: string; label: string; color: string }> = {
  energy: { icon: "bolt", label: "Energy", color: colors.warning },
  mood: { icon: "smile-o", label: "Mood", color: colors.primary },
  sleep: { icon: "moon-o", label: "Sleep", color: colors.accent },
  stress: { icon: "heartbeat", label: "Stress", color: colors.danger },
};

const COMMON_SYMPTOMS = [
  "Headache",
  "Fatigue",
  "Brain fog",
  "Nausea",
  "Joint pain",
  "Muscle soreness",
  "Bloating",
  "Anxiety",
  "Insomnia",
  "Low appetite",
];

export default function HealthJournalScreen() {
  const today = getTodayIsoDate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<HealthJournalEntry | null>(null);
  const [summary, setSummary] = useState<HealthJournalSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<HealthJournalEntry[]>([]);

  // Form state
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [entryResult, summaryResult, recentResult] = await Promise.allSettled([
        journalApi.getByDate(today).catch(() => null),
        journalApi.summary(),
        journalApi.list({ limit: 7 }),
      ]);

      const entry = entryResult.status === "fulfilled" ? entryResult.value : null;
      if (entry) {
        setTodayEntry(entry);
        setEnergy(entry.energy_level);
        setMood(entry.mood_level);
        setSleep(entry.sleep_quality);
        setStress(entry.stress_level);
        setSymptoms(entry.symptoms ?? []);
        setNotes(entry.notes ?? "");
      }

      if (summaryResult.status === "fulfilled" && summaryResult.value) {
        setSummary(summaryResult.value);
      }
      if (recentResult.status === "fulfilled" && recentResult.value) {
        setRecentEntries(recentResult.value);
      }
    } catch (error: any) {
      showError(error.message || "Failed to load journal");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        entry_date: today,
        energy_level: energy,
        mood_level: mood,
        sleep_quality: sleep,
        stress_level: stress,
        symptoms: symptoms.length > 0 ? symptoms : null,
        notes: notes.trim() || null,
      };
      const saved = await journalApi.create(data);
      setTodayEntry(saved);
      // Refresh recent + summary
      const [summaryResult, recentResult] = await Promise.allSettled([
        journalApi.summary(),
        journalApi.list({ limit: 7 }),
      ]);
      if (summaryResult.status === "fulfilled" && summaryResult.value) setSummary(summaryResult.value);
      if (recentResult.status === "fulfilled" && recentResult.value) setRecentEntries(recentResult.value);
    } catch (error: any) {
      showError(error.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView>
        <FlowScreenHeader
          title="Health Journal"
          subtitle={formatIsoDate(today)}
        />

        {/* Today's entry form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>

          {METRIC_LABELS.map((key) => {
            const config = METRIC_CONFIG[key];
            const value =
              key === "energy" ? energy : key === "mood" ? mood : key === "sleep" ? sleep : stress;
            const setter =
              key === "energy" ? setEnergy : key === "mood" ? setMood : key === "sleep" ? setSleep : setStress;
            return (
              <View key={key} style={styles.metricRow}>
                <View style={[styles.metricIcon, { backgroundColor: config.color + "14" }]}>
                  <FontAwesome name={config.icon as any} size={14} color={config.color} />
                </View>
                <Text style={styles.metricLabel}>{config.label}</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <Pressable
                      key={n}
                      style={[
                        styles.ratingDot,
                        value !== null && n <= value && { backgroundColor: config.color },
                      ]}
                      onPress={() => setter(n === value ? null : n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${config.label} ${n}`}
                    />
                  ))}
                </View>
                <Text style={styles.ratingValue}>{value ?? "-"}</Text>
              </View>
            );
          })}
        </View>

        {/* Symptoms */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <View style={styles.chipGrid}>
            {COMMON_SYMPTOMS.map((symptom) => {
              const active = symptoms.includes(symptom);
              return (
                <Pressable
                  key={symptom}
                  style={[styles.symptomChip, active && styles.symptomChipActive]}
                  onPress={() => toggleSymptom(symptom)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={symptom}
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.symptomText, active && styles.symptomTextActive]}>
                    {symptom}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How's your day going? Any side effects, observations..."
            placeholderTextColor={colors.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
            accessibilityLabel="Journal notes"
          />
        </View>

        {/* Save */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            saving && styles.saveButtonDisabled,
            pressed && !saving && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={todayEntry ? "Update journal entry" : "Save journal entry"}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <FontAwesome name={todayEntry ? "check" : "pencil"} size={16} color={colors.white} />
              <Text style={styles.saveButtonText}>
                {todayEntry ? "Update Entry" : "Save Entry"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Summary card */}
        {summary && summary.entry_count > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>30-Day Averages</Text>
            <View style={styles.avgGrid}>
              {summary.avg_energy !== null && (
                <AvgBadge label="Energy" value={summary.avg_energy} color={METRIC_CONFIG.energy.color} />
              )}
              {summary.avg_mood !== null && (
                <AvgBadge label="Mood" value={summary.avg_mood} color={METRIC_CONFIG.mood.color} />
              )}
              {summary.avg_sleep !== null && (
                <AvgBadge label="Sleep" value={summary.avg_sleep} color={METRIC_CONFIG.sleep.color} />
              )}
              {summary.avg_stress !== null && (
                <AvgBadge label="Stress" value={summary.avg_stress} color={METRIC_CONFIG.stress.color} />
              )}
            </View>
            {Object.keys(summary.symptom_frequency).length > 0 && (
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
            )}
            <Text style={styles.entryCount}>{summary.entry_count} entries logged</Text>
          </View>
        )}

        {/* Recent entries */}
        {recentEntries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {recentEntries.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatIsoDate(entry.entry_date)}</Text>
                <View style={styles.historyMetrics}>
                  {entry.energy_level != null && (
                    <MiniMetric icon="bolt" value={entry.energy_level} color={METRIC_CONFIG.energy.color} />
                  )}
                  {entry.mood_level != null && (
                    <MiniMetric icon="smile-o" value={entry.mood_level} color={METRIC_CONFIG.mood.color} />
                  )}
                  {entry.sleep_quality != null && (
                    <MiniMetric icon="moon-o" value={entry.sleep_quality} color={METRIC_CONFIG.sleep.color} />
                  )}
                  {entry.stress_level != null && (
                    <MiniMetric icon="heartbeat" value={entry.stress_level} color={METRIC_CONFIG.stress.color} />
                  )}
                </View>
                {entry.symptoms && entry.symptoms.length > 0 && (
                  <Text style={styles.historySymptoms}>{entry.symptoms.join(", ")}</Text>
                )}
                {entry.notes && <Text style={styles.historyNotes} numberOfLines={2}>{entry.notes}</Text>}
              </View>
            ))}
          </View>
        )}
      </FadeInView>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function AvgBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.avgBadge}>
      <Text style={[styles.avgValue, { color }]}>{value}</Text>
      <Text style={styles.avgLabel}>{label}</Text>
    </View>
  );
}

function MiniMetric({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <View style={styles.miniMetric}>
      <FontAwesome name={icon as any} size={10} color={color} />
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  content: { paddingBottom: 24, position: "relative" },
  backdrop: { top: -48, height: 1200 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 52,
  },
  ratingRow: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  ratingDot: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(230,236,242,0.8)",
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    width: 22,
    textAlign: "right",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(243,247,251,0.9)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  symptomChipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  symptomText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  symptomTextActive: {
    color: colors.accent,
  },
  notesInput: {
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  saveButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  avgGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  avgBadge: {
    flexBasis: "22%",
    alignItems: "center",
    backgroundColor: "rgba(248,251,255,0.84)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  avgValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  avgLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  entryCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
  freqChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(243,247,251,0.9)",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  freqText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  historyRow: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(248,251,255,0.72)",
    marginTop: 10,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  historyMetrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  miniMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  historySymptoms: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  historyNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
