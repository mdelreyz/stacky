import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

interface SetInputRowProps {
  setNumber: number;
  onLog: (data: { set_number: number; reps: number; weight: number; rpe?: number; is_warmup: boolean }) => void;
  previousSet?: { reps: number | null; weight: number | null };
}

export function SetInputRow({ setNumber, onLog, previousSet }: SetInputRowProps) {
  const [weight, setWeight] = useState(previousSet?.weight?.toString() ?? "");
  const [reps, setReps] = useState(previousSet?.reps?.toString() ?? "");
  const [isWarmup, setIsWarmup] = useState(false);

  const handleLog = () => {
    if (!reps) return;
    onLog({
      set_number: setNumber,
      reps: Number(reps),
      weight: Number(weight) || 0,
      is_warmup: isWarmup,
    });
    // Clear for next set
    setWeight("");
    setReps("");
    setIsWarmup(false);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.setNum}>{setNumber}</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="kg"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={reps}
        onChangeText={setReps}
        placeholder="reps"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="numeric"
      />
      <Pressable
        style={[styles.warmupBtn, isWarmup && styles.warmupBtnActive]}
        onPress={() => setIsWarmup(!isWarmup)}
      >
        <Text style={[styles.warmupText, isWarmup && styles.warmupTextActive]}>W</Text>
      </Pressable>
      <Pressable style={styles.logBtn} onPress={handleLog}>
        <FontAwesome name="check" size={14} color={colors.textWhite} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  setNum: {
    width: 22,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
  },
  warmupBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  warmupBtnActive: { backgroundColor: colors.primaryLight },
  warmupText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  warmupTextActive: { color: colors.primary },
  logBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
  },
});
