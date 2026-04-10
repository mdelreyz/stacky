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

import { AmbientBackdrop } from "@/components/ui/AmbientBackdrop";
import { FadeInView } from "@/components/ui/FadeInView";
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
      <AmbientBackdrop canvasStyle={styles.backdrop} />
      <FadeInView style={styles.body}>
        <FlowScreenHeader
          title="Protocol Wizard"
          subtitle="AI-guided protocol building"
        />

        {conversation.length === 0 && !sending && (
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeGlowLarge} />
            <View style={styles.welcomeGlowSmall} />
            <FontAwesome name="magic" size={28} color={colors.primaryDark} />
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
                  style={({ pressed }) => [styles.promptChip, pressed && styles.softPressed]}
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
          style={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: turn }) => (
            <View
              style={[
                styles.messageBubble,
                turn.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {turn.role === "assistant" && (
                <FontAwesome name="bolt" size={12} color={colors.primaryDark} style={{ marginBottom: 4 }} />
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
                    style={({ pressed }) => [
                      styles.applyButton,
                      applying && styles.buttonDisabled,
                      pressed && !applying && styles.buttonPressed,
                    ]}
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
                    style={({ pressed }) => [styles.startOverButton, pressed && styles.softPressed]}
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
      </FadeInView>

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
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled,
              pressed && input.trim() && !sending && styles.buttonPressed,
            ]}
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
  backdrop: {
    top: -48,
    height: 1120,
  },
  body: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: "rgba(255,255,255,0.76)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    overflow: "hidden",
  },
  welcomeGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(123,220,225,0.12)",
    top: -48,
    right: -12,
  },
  welcomeGlowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    bottom: -18,
    left: -10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
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
    backgroundColor: "rgba(243,247,251,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
  },
  promptChipText: {
    fontSize: 13,
    color: colors.primaryDarker,
    lineHeight: 18,
  },
  list: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    gap: 8,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 20,
    padding: 14,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primaryDark,
    borderBottomRightRadius: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 2,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.76)",
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    backgroundColor: "rgba(255,255,255,0.76)",
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
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
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 4,
  },
  resultSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultItem: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(248,251,255,0.72)",
    marginTop: 10,
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
    backgroundColor: "rgba(243,247,251,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: "capitalize",
  },
  resultItemDosage: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
    backgroundColor: "rgba(234,242,248,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resultItemWindow: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: "rgba(234,245,239,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
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
    borderRadius: 18,
    marginTop: 16,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
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
    borderRadius: 16,
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
    backgroundColor: "rgba(255,255,255,0.78)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.92)",
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "rgba(248,251,255,0.84)",
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  buttonPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
  softPressed: {
    transform: [{ scale: 0.992 }],
    opacity: 0.95,
  },
});
