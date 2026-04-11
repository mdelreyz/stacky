import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, type Href } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { CatalogDetailScaffold } from "@/components/catalog-detail/CatalogDetailScaffold";
import { catalogDetailStyles as baseStyles } from "@/components/catalog-detail/catalogDetailStyles";
import { colors } from "@/constants/Colors";
import { therapies as therapiesApi } from "@/lib/api";
import { snakeCaseToLabel } from "@/lib/format";
import { readProfileNumber, readProfileString, readProfileStringArray } from "@/lib/ai-profile";
import { useCatalogItemDetail } from "@/lib/useCatalogItemDetail";
import type { Therapy } from "@/lib/api";

export default function TherapyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item: therapy, loading } = useCatalogItemDetail<Therapy>({
    id,
    fetchItem: therapiesApi.get,
    errorMessage: "Failed to load therapy",
  });

  const ai = (therapy?.ai_profile as Record<string, unknown> | null) ?? null;
  const tags = readProfileStringArray(ai, "tags");
  const sessionTemplate = readProfileString(ai, "session_template");
  const defaultDuration = readProfileNumber(ai, "default_duration_minutes");
  const defaultFrequency = readProfileString(ai, "default_frequency");
  const defaultWindow = readProfileString(ai, "default_take_window");

  return (
    <CatalogDetailScaffold
      loading={loading}
      missing={!therapy}
      missingMessage="Therapy not found"
      title={therapy?.name}
      subtitle={therapy ? snakeCaseToLabel(therapy.category) : undefined}
      backdropHeight={1220}
      action={
        therapy
          ? ({
              href: `/therapy/${therapy.id}/schedule`,
              label: "Start Protocol",
              accessibilityLabel: "Start Protocol",
              icon: "play",
            } satisfies { href: Href; label: string; accessibilityLabel: string; icon: "play" })
          : undefined
      }
    >
      {therapy ? (
        <>
          <View style={baseStyles.badgeRow}>
            <View style={[baseStyles.chip, baseStyles.chipSuccess]}>
              <Text style={baseStyles.chipSuccessText}>{snakeCaseToLabel(therapy.category)}</Text>
            </View>
            {ai ? (
              <View style={[baseStyles.chip, baseStyles.chipInfo]}>
                <FontAwesome name="bolt" size={10} color={colors.primaryDark} />
                <Text style={baseStyles.chipInfoText}>Profile</Text>
              </View>
            ) : null}
          </View>

          {therapy.description ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Overview</Text>
                <Text style={baseStyles.sectionTitle}>How It Works</Text>
                <Text style={baseStyles.bodyText}>{therapy.description}</Text>
              </View>
            </View>
          ) : null}

          {(defaultDuration || defaultFrequency || defaultWindow) && (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Defaults</Text>
                <Text style={baseStyles.sectionTitle}>Recommended Rhythm</Text>
                <View style={baseStyles.detailStack}>
                  {defaultDuration != null ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="clock-o" size={16} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Duration</Text>
                        <Text style={baseStyles.detailValue}>{defaultDuration} min</Text>
                      </View>
                    </View>
                  ) : null}
                  {defaultFrequency ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="repeat" size={14} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Frequency</Text>
                        <Text style={baseStyles.detailValue}>{snakeCaseToLabel(defaultFrequency)}</Text>
                      </View>
                    </View>
                  ) : null}
                  {defaultWindow ? (
                    <View style={baseStyles.detailItem}>
                      <FontAwesome name="sun-o" size={15} color={colors.primaryDark} />
                      <View style={baseStyles.detailContent}>
                        <Text style={baseStyles.detailLabel}>Time Window</Text>
                        <Text style={baseStyles.detailValue}>{snakeCaseToLabel(defaultWindow)}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )}

          {sessionTemplate ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Guidance</Text>
                <Text style={baseStyles.sectionTitle}>Session Template</Text>
                <View style={baseStyles.noteBox}>
                  <FontAwesome name="list-ol" size={14} color={colors.primaryDark} style={{ marginTop: 2 }} />
                  <Text style={baseStyles.noteText}>{sessionTemplate}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {tags.length > 0 ? (
            <View style={baseStyles.section}>
              <View style={baseStyles.card}>
                <Text style={baseStyles.sectionEyebrow}>Labels</Text>
                <Text style={baseStyles.sectionTitle}>Tags</Text>
                <View style={baseStyles.tagRow}>
                  {tags.map((tag) => (
                    <View key={tag} style={baseStyles.tag}>
                      <Text style={baseStyles.tagText}>{tag.replace(/_/g, " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </CatalogDetailScaffold>
  );
}

const styles = StyleSheet.create({});
