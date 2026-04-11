import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
import { colors } from "@/constants/Colors";

import { catalogDetailStyles as styles } from "./catalogDetailStyles";

type CatalogDetailAction = {
  href: Href;
  label: string;
  accessibilityLabel: string;
  icon: ComponentProps<typeof FontAwesome>["name"];
};

type CatalogDetailScaffoldProps = {
  loading: boolean;
  missing: boolean;
  missingMessage: string;
  title?: string;
  subtitle?: string;
  backdropHeight?: number;
  action?: CatalogDetailAction;
  children?: ReactNode;
};

export function CatalogDetailScaffold({
  loading,
  missing,
  missingMessage,
  title,
  subtitle,
  backdropHeight = 1240,
  action,
  children,
}: CatalogDetailScaffoldProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (missing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missingText}>{missingMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AmbientBackdrop canvasStyle={[styles.backdrop, { height: backdropHeight }]} />
      <FadeInView>
        <FlowScreenHeader title={title ?? ""} subtitle={subtitle ?? ""} />

        {children}

        {action ? (
          <View style={styles.section}>
            <Link href={action.href} asChild>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
              >
                <FontAwesome name={action.icon} size={16} color={colors.white} />
                <Text style={styles.primaryButtonText}>{action.label}</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}
      </FadeInView>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
