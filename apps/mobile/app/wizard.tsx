import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

import { colors } from "@/constants/Colors";
import { FlowScreenHeader } from "@/components/FlowScreenHeader";
import { preferences as prefsApi } from "@/lib/api";
import { showError } from "@/lib/errors";
import { snakeCaseToLabel } from "@/lib/format";
import type { WizardRecommendedItem, WizardTurn } from "@/lib/api";

function isCompletionPayloadMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return Boolean(parsed?.wizard_complete);
  } catch {
    return false;
  }
}

function parseSuggestedDosage(suggestedDosage: string | null | undefined): {
  dosage_amount?: number;
  dosage_unit?: string;
} {
  if (!suggestedDosage) {
    return {};
  }

  const match = suggestedDosage.match(/^\s*(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s*([a-zA-ZmcguIU]+)/);
  if (!match) {
    return {};
  }

  const dosageAmount = Number.parseFloat(match[1]);
  if (!Number.isFinite(dosageAmount)) {
    return {};
  }

  return {
    dosage_amount: dosageAmount,
    dosage_unit: match[2] || undefined,
  };
}

export default function WizardScreen() {
  const [conversation, setConversation] = useState<WizardTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<{
    items: WizardRecommendedItem[];
    protocolName: string | null;
    summary: string | null;
  } | null>(null);
  const [applying, setApplying] = useState(false);
  const listRef = useRef<FlatList>(null);
  const visibleConversation = conversation.filter(
    (turn) => !(turn.role === "assistant" && isCompletionPayloadMessage(turn.content)),
  );

  const handleSend = async () => {
    const message = input.trim();
    if (!message || sending) return;

    const previousConversation = conversation;
    setInput("");
    setSending(true);
    setConversation([...previousConversation, { role: "user", content: message }]);

    try {
      const response = await prefsApi.wizardTurn({
        message,
        conversation: previousConversation,
      });

      setConversation(response.conversation);
      setIsComplete(response.is_complete);

      if (response.is_complete && response.recommended_items) {
        setResult({
          items: response.recommended_items,
          protocolName: response.protocol_name,
          summary: response.summary,
        });
      }
    } catch (error: any) {
      showError(error.message || "Failed to get wizard response");
      // Remove the user message if the request failed
      setConversation(previousConversation);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleApply = async () => {
    if (!result || result.items.length === 0) return;
    setApplying(true);

    try {
      await prefsApi.applyRecommendations({
        items: result.items.map((item) => ({
          catalog_id: item.catalog_id,
          item_type: item.item_type,
          ...parseSuggestedDosage(item.suggested_dosage),
          ...(item.suggested_window ? { take_window: item.suggested_window } : {}),
        })),
        protocol_name: result.protocolName ?? undefined,
      });
      router.replace("/(tabs)/protocols");
    } catch (error: any) {
      showError(error.message || "Failed to apply wizard recommendations");
    } finally {
      setApplying(false);
    }
  };

  const startOver = () => {
    setConversation([]);
    setIsComplete(false);
    setResult(null);
    setInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlowScreenHeader
        title="Protocol Wizard"
        subtitle="AI-guided protocol building"
      />

      {conversation.length === 0 && !sending && (
        <View style={styles.welcomeCard}>
          <FontAwesome name="magic" size={28} color={colors.primary} />
          <Text style={styles.welcomeTitle}>Build Your Protocol</Text>
          <Text style={styles.welcomeText}>
            Tell me about your health goals, concerns, or what you're looking to optimize.
            I'll ask follow-up questions and build a personalized protocol for you.
          </Text>
          <View style={styles.promptGrid}>
            {[
              "I want to optimize for longevity and cognitive performance",
              "I'm dealing with poor sleep and high stress",
              "Help me build a recovery stack for training",
              "I want to improve my skin and hair health",
            ].map((prompt) => (
              <Pressable
                key={prompt}
                style={styles.promptChip}
                onPress={() => {
                  setInput(prompt);
                }}
                accessibilityRole="button"
                accessibilityLabel={prompt}
              >
                <Text style={styles.promptChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={visibleConversation}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item: turn }) => (
          <View
            style={[
              styles.messageBubble,
              turn.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {turn.role === "assistant" && (
              <FontAwesome name="bolt" size={12} color={colors.primary} style={{ marginBottom: 4 }} />
            )}
            <Text
              style={[
                styles.messageText,
                turn.role === "user" ? styles.userText : styles.assistantText,
              ]}
            >
              {turn.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <>
            {sending && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            )}

            {result && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Recommended Protocol</Text>
                {result.protocolName && (
                  <Text style={styles.resultProtocolName}>{result.protocolName}</Text>
                )}
                {result.summary && (
                  <Text style={styles.resultSummary}>{result.summary}</Text>
                )}
                {result.items.map((item, i) => (
                  <View key={item.catalog_id || `${item.name}-${i}`} style={styles.resultItem}>
                    <Text style={styles.resultItemName}>{item.name}</Text>
                    <View style={styles.resultItemMeta}>
                      <Text style={styles.resultItemType}>{snakeCaseToLabel(item.item_type)}</Text>
                      {item.suggested_dosage && (
                        <Text style={styles.resultItemDosage}>{item.suggested_dosage}</Text>
                      )}
                      {item.suggested_window && (
                        <Text style={styles.resultItemWindow}>{snakeCaseToLabel(item.suggested_window)}</Text>
                      )}
                    </View>
                    <Text style={styles.resultItemReason}>{item.reason}</Text>
                  </View>
                ))}

                <Pressable
                  style={[styles.applyButton, applying && styles.buttonDisabled]}
                  onPress={handleApply}
                  disabled={applying}
                  accessibilityRole="button"
                  accessibilityLabel="Add all to my protocol"
                >
                  {applying ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <FontAwesome name="check" size={16} color={colors.white} />
                      <Text style={styles.applyButtonText}>Add All to My Protocol</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={styles.startOverButton}
                  onPress={startOver}
                  accessibilityRole="button"
                  accessibilityLabel="Start over"
                >
                  <Text style={styles.startOverText}>Start Over</Text>
                </Pressable>
              </View>
            )}
          </>
        }
      />

      {!isComplete && (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={conversation.length === 0 ? "Describe your goals..." : "Reply..."}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            maxLength={1000}
            editable={!sending}
            onSubmitEditing={handleSend}
            blurOnSubmit
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <FontAwesome name="send" size={16} color={colors.white} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  welcomeCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  promptGrid: {
    gap: 8,
    marginTop: 16,
    width: "100%",
  },
  promptChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  promptChipText: {
    fontSize: 13,
    color: colors.primaryDarker,
    lineHeight: 18,
  },
  messageList: {
    padding: 16,
    gap: 8,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  thinkingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultProtocolName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  resultSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultItem: {
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: 10,
    paddingBottom: 6,
  },
  resultItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  resultItemMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  resultItemType: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "capitalize",
  },
  resultItemDosage: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultItemWindow: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "capitalize",
  },
  resultItemReason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  startOverButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  startOverText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
