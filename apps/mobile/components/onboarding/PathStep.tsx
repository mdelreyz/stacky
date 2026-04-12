import { ActivityIndicator, Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { colors } from "@/constants/Colors";
import { styles } from "./styles";

export function PathStep({
  saving,
  onBack,
  onChoose,
}: {
  saving: boolean;
  onBack: () => void;
  onChoose: (destination: "wizard" | "browse" | "templates" | "home") => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Step 3 of 3</Text>
        <Text style={styles.cardTitle}>How do you want to start?</Text>
        <Text style={styles.cardSubtitle}>Choose how to build your first protocol stack.</Text>

        <View style={styles.pathGrid}>
          <Pressable
            style={({ pressed }) => [styles.pathCard, styles.pathCardPrimary, pressed && styles.chipPressed]}
            onPress={() => onChoose("wizard")}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="AI guided wizard"
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <FontAwesome name="comments" size={24} color={colors.white} />
                <Text style={styles.pathCardPrimaryTitle}>AI Wizard</Text>
                <Text style={styles.pathCardPrimaryDesc}>
                  Answer a few questions and we&apos;ll build a personalized protocol stack for you
                </Text>
              </>
            )}
          </Pressable>

          <PathChoiceCard
            disabled={saving}
            icon="search"
            label="Browse Catalog"
            description="Explore supplements, medications, therapies, and peptides on your own"
            onPress={() => onChoose("browse")}
          />

          <PathChoiceCard
            disabled={saving}
            icon="book"
            label="Protocol Library"
            description="Start from curated stacks and adopt a ready-made protocol"
            onPress={() => onChoose("templates")}
          />

          <PathChoiceCard
            disabled={saving}
            icon="home"
            label="Go to Home"
            description="Set up your stack later from the Protocols tab"
            onPress={() => onChoose("home")}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <FontAwesome name="arrow-left" size={14} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

function PathChoiceCard({
  description,
  disabled,
  icon,
  label,
  onPress,
}: {
  description: string;
  disabled: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pathCard, pressed && styles.chipPressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {disabled ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <FontAwesome name={icon as any} size={22} color={colors.primary} />
          <Text style={styles.pathCardTitle}>{label}</Text>
          <Text style={styles.pathCardDesc}>{description}</Text>
        </>
      )}
    </Pressable>
  );
}
