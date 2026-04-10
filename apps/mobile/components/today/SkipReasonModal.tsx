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
          <Text style={styles.title}>Skip {itemName}?</Text>
          <Text style={styles.subtitle}>Add an optional reason for your records.</Text>

          <View style={styles.quickRow}>
            {QUICK_REASONS.map((qr) => (
              <Pressable
                key={qr}
                style={styles.quickChip}
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
            <Pressable style={styles.skipButton} onPress={() => handleConfirm()} accessibilityRole="button" accessibilityLabel={reason.trim() ? "Skip with reason" : "Skip without reason"}>
              <Text style={styles.skipButtonText}>
                {reason.trim() ? "Skip with Reason" : "Skip Without Reason"}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cancel">
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
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
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.dangerLight,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: colors.dangerDark,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
