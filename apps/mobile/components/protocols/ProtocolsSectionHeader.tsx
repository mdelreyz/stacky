import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link } from "expo-router";

export function ProtocolsSectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionHref && actionLabel ? (
        <Link href={actionHref} asChild>
          <Pressable style={styles.addButton}>
            <FontAwesome name="plus" size={14} color="#fff" />
            <Text style={styles.addButtonText}>{actionLabel}</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#495057" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#228be6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
