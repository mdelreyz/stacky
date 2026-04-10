import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/Colors";

interface SkipReasonModalProps {
  visible: boolean;
  itemName: string;
  onConfirm: (reason: string | undefined) => void;
  onCancel: () => void;
}

const QUICK_REASONS = [
  "Ran out",
  "Forgot",
  "Felt unwell",
  "Traveling",
  "Fasting",
  "Rest day",
];

export function SkipReasonModal({ visible, itemName, onConfirm, onCancel }: SkipReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = (value?: string) => {
    const trimmed = value?.trim() || reason.trim();
    onConfirm(trimmed || undefined);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel} accessibilityLabel="Close modal">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()} accessibilityRole="none">
          <View style={styles.glowLarge} />
          <View style={styles.glowSmall} />
          <Text style={styles.title}>Skip {itemName}?</Text>
          <Text style={styles.subtitle}>Add an optional reason for your records.</Text>

          <View style={styles.quickRow}>
            {QUICK_REASONS.map((qr) => (
              <Pressable
                key={qr}
                style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
                onPress={() => handleConfirm(qr)}
                accessibilityRole="button"
                accessibilityLabel={`Skip reason: ${qr}`}
              >
                <Text style={styles.quickChipText}>{qr}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Custom reason..."
            placeholderTextColor={colors.textPlaceholder}
            maxLength={500}
            multiline
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
              onPress={() => handleConfirm()}
              accessibilityRole="button"
              accessibilityLabel={reason.trim() ? "Skip with reason" : "Skip without reason"}
            >
              <Text style={styles.skipButtonText}>
                {reason.trim() ? "Skip with Reason" : "Skip Without Reason"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(28,40,56,0.24)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    overflow: "hidden",
  },
  glowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    top: -54,
    right: -12,
  },
  glowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -16,
    left: -10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  quickChip: {
    backgroundColor: "rgba(243,247,251,0.9)",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  quickChipPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(248,251,255,0.84)",
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 44,
    maxHeight: 80,
    marginBottom: 16,
  },
  buttonRow: {
    gap: 8,
  },
  skipButton: {
    backgroundColor: colors.dangerDark,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: colors.dangerDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  skipButtonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  skipButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 16,
  },
  cancelButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.44)",
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
