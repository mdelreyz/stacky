import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router, useLocalSearchParams } from "expo-router";

import { supplements as supplementsApi, userSupplements as userSupplementsApi } from "@/lib/api";
import type { Supplement } from "@/lib/api";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "three_times_daily", label: "3x Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "every_other_day", label: "Every Other Day" },
] as const;

const TAKE_WINDOWS = [
  { value: "morning_fasted", label: "Morning Fasted" },
  { value: "morning_with_food", label: "Morning With Food" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "bedtime", label: "Bedtime" },
] as const;

type FrequencyValue = (typeof FREQUENCIES)[number]["value"];
type TakeWindowValue = (typeof TAKE_WINDOWS)[number]["value"];

export default function ScheduleSupplementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<Supplement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dosageAmount, setDosageAmount] = useState("");
  const [dosageUnit, setDosageUnit] = useState("capsule");
  const [frequency, setFrequency] = useState<FrequencyValue>("daily");
  const [takeWindow, setTakeWindow] = useState<TakeWindowValue>("morning_with_food");
  const [withFood, setWithFood] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    supplementsApi
      .get(id)
      .then((nextSupplement) => {
        if (cancelled) return;
        setSupplement(nextSupplement);

        const ai = nextSupplement.ai_profile as Record<string, any> | null;
        const firstDosage = ai?.typical_dosages?.[0];
        const aiFrequency = firstDosage?.frequency;
        const aiWindow = ai?.timing_recommendations?.preferred_windows?.[0];
        const aiWithFood = Boolean(ai?.timing_recommendations?.with_food);

        setDosageAmount(firstDosage?.amount ? String(firstDosage.amount) : "1");
        setDosageUnit(firstDosage?.unit || nextSupplement.form || "capsule");
        setFrequency(
          FREQUENCIES.some((option) => option.value === aiFrequency) ? aiFrequency : "daily"
        );
        setTakeWindow(
          TAKE_WINDOWS.some((option) => option.value === aiWindow) ? aiWindow : "morning_with_food"
        );
        setWithFood(aiWithFood);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!supplement) return;
    const parsedAmount = Number(dosageAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError("Enter a valid dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await userSupplementsApi.add({
        supplement_id: supplement.id,
        dosage_amount: parsedAmount,
        dosage_unit: dosageUnit.trim() || "capsule",
        frequency,
        take_window: takeWindow,
        with_food: withFood,
        notes: notes.trim() || undefined,
        started_at: new Date().toISOString().slice(0, 10),
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to add supplement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!supplement) {
    return (
      <View style={styles.centered}>
        <Text>Supplement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color="#495057" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Start Taking</Text>
          <Text style={styles.subtitle}>{supplement.name}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dosage</Text>
        <View style={styles.dosageRow}>
          <TextInput
            style={[styles.input, styles.amountInput]}
            keyboardType="decimal-pad"
            value={dosageAmount}
            onChangeText={setDosageAmount}
            placeholder="1"
          />
          <TextInput
            style={[styles.input, styles.unitInput]}
            value={dosageUnit}
            onChangeText={setDosageUnit}
            placeholder="capsule"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Frequency</Text>
        <OptionGrid
          options={FREQUENCIES}
          selected={frequency}
          onSelect={(value) => setFrequency(value as FrequencyValue)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Take Window</Text>
        <OptionGrid
          options={TAKE_WINDOWS}
          selected={takeWindow}
          onSelect={(value) => setTakeWindow(value as TakeWindowValue)}
        />

        <Pressable
          style={[styles.toggleRow, withFood && styles.toggleRowActive]}
          onPress={() => setWithFood((current) => !current)}
        >
          <FontAwesome
            name={withFood ? "check-square-o" : "square-o"}
            size={18}
            color={withFood ? "#2b8a3e" : "#868e96"}
          />
          <Text style={styles.toggleText}>Take with food</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional reminders or notes"
          placeholderTextColor="#adb5bd"
        />
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="check" size={16} color="#fff" />
            <Text style={styles.saveButtonText}>Add to My Protocol</Text>
          </>
        )}
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionGrid}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.optionChip,
            selected === option.value && styles.optionChipSelected,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.optionChipText,
              selected === option.value && styles.optionChipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function showError(message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert("Error", message);
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#212529" },
  subtitle: { fontSize: 14, color: "#868e96", marginTop: 2 },
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
  dosageRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    fontSize: 16,
    color: "#212529",
  },
  amountInput: { flex: 0.8 },
  unitInput: { flex: 1.2 },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f1f3f5",
  },
  optionChipSelected: {
    backgroundColor: "#d0ebff",
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  optionChipTextSelected: {
    color: "#1864ab",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  toggleRowActive: {
    backgroundColor: "#ebfbee",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343a40",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    backgroundColor: "#228be6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
