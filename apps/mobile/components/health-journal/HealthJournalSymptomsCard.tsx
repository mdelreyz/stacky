import { Pressable, Text, View } from "react-native";

import { COMMON_SYMPTOMS } from "./config";
import { styles } from "./styles";

export function HealthJournalSymptomsCard({
  onToggleSymptom,
  symptoms,
}: {
  onToggleSymptom: (symptom: string) => void;
  symptoms: string[];
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Symptoms</Text>
      <View style={styles.chipGrid}>
        {COMMON_SYMPTOMS.map((symptom) => {
          const active = symptoms.includes(symptom);
          return (
            <Pressable
              key={symptom}
              style={[styles.symptomChip, active && styles.symptomChipActive]}
              onPress={() => onToggleSymptom(symptom)}
              accessibilityRole="checkbox"
              accessibilityLabel={symptom}
              accessibilityState={{ checked: active }}
            >
              <Text style={[styles.symptomText, active && styles.symptomTextActive]}>{symptom}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
