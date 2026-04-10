import { Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

export function CatalogSearchInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.iconWrap}>
        <FontAwesome name="search" size={14} color={colors.primaryDark} />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search catalogs, compounds, or modalities"
        placeholderTextColor={colors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Clear catalog search"
          style={styles.clearButton}
        >
          <FontAwesome name="times-circle" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  clearButton: {
    marginLeft: 10,
  },
});
