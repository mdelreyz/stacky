import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { HealthJournalMetricsCard } from "@/components/health-journal/HealthJournalMetricsCard";
import { HealthJournalNotesCard } from "@/components/health-journal/HealthJournalNotesCard";
import { HealthJournalRecentEntriesCard } from "@/components/health-journal/HealthJournalRecentEntriesCard";
import { HealthJournalSummaryCard } from "@/components/health-journal/HealthJournalSummaryCard";
import { HealthJournalSymptomsCard } from "@/components/health-journal/HealthJournalSymptomsCard";
import { styles } from "@/components/health-journal/styles";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";
import { formatIsoDate } from "@/lib/date";
import { useHealthJournalScreen } from "@/lib/useHealthJournalScreen";

export default function HealthJournalScreen() {
  const {
    energy,
    handleSave,
    loading,
    mood,
    notes,
    recentEntries,
    saving,
    setMetric,
    setNotes,
    sleep,
    stress,
    summary,
    symptoms,
    today,
    todayEntry,
    toggleSymptom,
  } = useHealthJournalScreen();

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
        <FlowScreenHeader title="Health Journal" subtitle={formatIsoDate(today)} />
        <HealthJournalMetricsCard
          energy={energy}
          mood={mood}
          onSetMetric={setMetric}
          sleep={sleep}
          stress={stress}
        />
        <HealthJournalSymptomsCard onToggleSymptom={toggleSymptom} symptoms={symptoms} />
        <HealthJournalNotesCard notes={notes} setNotes={setNotes} />
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
              <Text style={styles.saveButtonText}>{todayEntry ? "Update Entry" : "Save Entry"}</Text>
            </>
          )}
        </Pressable>
        <HealthJournalSummaryCard summary={summary} />
        <HealthJournalRecentEntriesCard recentEntries={recentEntries} />
      </FadeInView>

      <View style={styles.spacer} />
    </ScrollView>
  );
}
