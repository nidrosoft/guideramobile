import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft2, Send2 } from 'iconsax-react-native';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useJourneyCatalog } from '../hooks/useJourneyCatalog';
import { getOrCreateThread, getMessages, sendMessage, type ChatMessage } from '../services/journeyChat.service';

export function JourneyChatScreen({ categorySlug, countryCode }: { categorySlug: string; countryCode: string }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const userId = (profile as any)?.id as string | undefined;
  const { data: categories = [] } = useJourneyCatalog();
  const category = categories.find((c) => c.slug === categorySlug);
  const accent = category?.tint ?? colors.primary;

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!userId) return;
      try {
        const id = await getOrCreateThread({ userId, categorySlug, countryCode });
        if (!active) return;
        setThreadId(id);
        setMessages(await getMessages(id));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, categorySlug, countryCode]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !threadId || busy) return;
    setDraft('');
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() }]);
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const reply = await sendMessage(threadId, text);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: reply, createdAt: new Date().toISOString() }]);
    } catch {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', content: "Sorry — I couldn't respond just now. Please try again.", createdAt: new Date().toISOString() }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/journeys' as any))} style={[styles.backBtn, { backgroundColor: colors.bgCard }]} accessibilityLabel="Go back">
          <ArrowLeft2 size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{category?.name ?? 'Journey'} concierge</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{countryCode} · AI assistant</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={[styles.intro, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.introText, { color: colors.textSecondary }]}>
                Ask anything about {category?.name ?? 'this journey'} in {countryCode} — costs, process, what to
                watch out for. Information only, not professional advice.
              </Text>
            </View>
          ) : (
            messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.role === 'user'
                    ? { backgroundColor: accent, alignSelf: 'flex-end', borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.bgCard, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.bubbleText, { color: m.role === 'user' ? '#FFFFFF' : colors.textPrimary }]}>{m.content}</Text>
              </View>
            ))
          )}
          {busy ? (
            <View style={[styles.bubble, { backgroundColor: colors.bgCard, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderSubtle }]}>
              <ActivityIndicator color={accent} />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputRow, { borderTopColor: colors.borderSubtle, backgroundColor: colors.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask the concierge…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
            multiline
            onSubmitEditing={send}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!draft.trim() || busy || !threadId}
            style={[styles.sendBtn, { backgroundColor: accent, opacity: !draft.trim() || busy ? 0.5 : 1 }]}
            accessibilityLabel="Send"
          >
            <Send2 size={20} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },
  subtitle: { fontSize: typography.fontSize.xs },
  messages: { padding: spacing.lg, gap: spacing.md },
  intro: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md },
  introText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  bubble: { maxWidth: '82%', borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, borderWidth: 1, borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.fontSize.sm },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
