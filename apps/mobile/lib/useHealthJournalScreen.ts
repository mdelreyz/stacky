import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { healthJournal as journalApi, type HealthJournalEntry, type HealthJournalSummary } from "@/lib/api";
import { getTodayIsoDate } from "@/lib/date";
import { showError } from "@/lib/errors";
import type { MetricKey } from "@/components/health-journal/config";

function resetFormState(setters: {
  setEnergy: (value: number | null) => void;
  setMood: (value: number | null) => void;
  setSleep: (value: number | null) => void;
  setStress: (value: number | null) => void;
  setSymptoms: (value: string[]) => void;
  setNotes: (value: string) => void;
}) {
  setters.setEnergy(null);
  setters.setMood(null);
  setters.setSleep(null);
  setters.setStress(null);
  setters.setSymptoms([]);
  setters.setNotes("");
}

export function useHealthJournalScreen() {
  const today = getTodayIsoDate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<HealthJournalEntry | null>(null);
  const [summary, setSummary] = useState<HealthJournalSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<HealthJournalEntry[]>([]);

  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
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
      } else {
        setTodayEntry(null);
        resetFormState({ setEnergy, setMood, setSleep, setStress, setSymptoms, setNotes });
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

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await journalApi.create({
        entry_date: today,
        energy_level: energy,
        mood_level: mood,
        sleep_quality: sleep,
        stress_level: stress,
        symptoms: symptoms.length > 0 ? symptoms : null,
        notes: notes.trim() || null,
      });
      setTodayEntry(saved);
      const [summaryResult, recentResult] = await Promise.allSettled([
        journalApi.summary(),
        journalApi.list({ limit: 7 }),
      ]);
      if (summaryResult.status === "fulfilled" && summaryResult.value) {
        setSummary(summaryResult.value);
      }
      if (recentResult.status === "fulfilled" && recentResult.value) {
        setRecentEntries(recentResult.value);
      }
    } catch (error: any) {
      showError(error.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  function setMetric(key: MetricKey, value: number | null) {
    if (key === "energy") setEnergy(value);
    else if (key === "mood") setMood(value);
    else if (key === "sleep") setSleep(value);
    else setStress(value);
  }

  function toggleSymptom(symptom: string) {
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((item) => item !== symptom) : [...prev, symptom]));
  }

  return {
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
  };
}
