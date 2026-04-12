import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";

import { styles } from "./styles";

export function SupplementAddHero() {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <View style={styles.heroOrbWarm} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.iconButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="arrow-left" size={18} color={colors.textWhite} />
        </Pressable>
        <Text style={styles.title}>Add Supplement</Text>
      </View>
      <Text style={styles.heroHeadline}>Search first, then create only when you need something new.</Text>
      <Text style={styles.heroCopy}>
        Live catalog matches appear while you type. Tap a suggestion to jump straight into an existing profile, or
        keep your wording and we&apos;ll create a private user-created supplement for you.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.catalogButton, pressed && styles.softPressed]}
        onPress={() => router.push("/(tabs)/protocols")}
        accessibilityRole="button"
        accessibilityLabel="Visit supplement catalog"
      >
        <FontAwesome name="compass" size={14} color={colors.textWhite} />
        <Text style={styles.catalogButtonText}>Visit Catalog</Text>
      </Pressable>
    </View>
  );
}
