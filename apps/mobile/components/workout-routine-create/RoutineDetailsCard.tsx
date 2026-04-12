import { Text, TextInput, View } from "react-native";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function RoutineDetailsCard({
  description,
  duration,
  name,
  setDescription,
  setDuration,
  setName,
}: {
  description: string;
  duration: string;
  name: string;
  setDescription: (value: string) => void;
  setDuration: (value: string) => void;
  setName: (value: string) => void;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Push Day, Upper Body, Leg Day"
        placeholderTextColor={colors.textPlaceholder}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe this routine..."
        placeholderTextColor={colors.textPlaceholder}
        multiline
      />

      <Text style={styles.label}>Estimated Duration (min)</Text>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        placeholder="e.g. 60"
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="numeric"
      />
    </View>
  );
}
