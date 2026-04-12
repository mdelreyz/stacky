import { Text, TextInput, View } from "react-native";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function HealthJournalNotesCard({
  notes,
  setNotes,
}: {
  notes: string;
  setNotes: (value: string) => void;
}) {
  return (
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
  );
}
