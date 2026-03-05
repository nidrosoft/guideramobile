import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ActionSheetIOS,
  Image,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send2, Star1, Crown, Add, Clock, MessageText } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
// Custom lightweight markdown renderer (see MarkdownBubble below)
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { spacing, borderRadius } from '@/styles';

export interface AIChatContext {
  id?: string;
  name: string;
  location?: string;
  safetyScore?: number;
  budget?: string;
  bestTime?: string;
  description?: string;
  category?: string;
  rating?: number;
  highlights?: string[];
  safetyInfo?: string[];
  practicalInfo?: string[];
}

export interface AIChatSheetProps {
  visible: boolean;
  onClose: () => void;
  contextType?: 'destination' | 'global';
  contextData?: AIChatContext;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isUpsell?: boolean;
  isStreaming?: boolean;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  context_type: string;
  context_name: string | null;
  last_message_at: string;
  created_at: string;
}

const SUGGESTED_QUESTIONS_DESTINATION = [
  'Is it safe to travel there alone?',
  'What should I pack?',
  'Best local food to try?',
  'How do I get around?',
];

const SUGGESTED_QUESTIONS_GLOBAL = [
  'Best destinations in Southeast Asia?',
  'How to travel on a tight budget?',
  'Safest cities for solo travellers?',
  'What vaccinations do I need?',
];

// ── Typing Indicator ────────────────────────────────────────────────
function TypingIndicator({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ── Markdown Bubble ─────────────────────────────────────────────────
// Lightweight markdown renderer: bold, italic, bullets, numbered lists,
// headers (##), blockquotes (>), inline code (`), horizontal rules (---)
function parseInlineMarkdown(text: string, textColor: string, baseStyle: any): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Match: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Text key={key++} style={baseStyle}>{text.slice(lastIndex, match.index)}</Text>);
    }
    if (match[2]) {
      // Bold
      nodes.push(<Text key={key++} style={[baseStyle, { fontWeight: '700' }]}>{match[2]}</Text>);
    } else if (match[3]) {
      // Italic
      nodes.push(<Text key={key++} style={[baseStyle, { fontStyle: 'italic' }]}>{match[3]}</Text>);
    } else if (match[4]) {
      // Inline code
      nodes.push(
        <Text key={key++} style={[baseStyle, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 3, borderRadius: 3 }]}>
          {match[4]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Text key={key++} style={baseStyle}>{text.slice(lastIndex)}</Text>);
  }
  return nodes.length > 0 ? nodes : [<Text key={0} style={baseStyle}>{text}</Text>];
}

function MapImage({ url }: { url: string }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={styles.mapImageContainer}
    >
      <Image
        source={{ uri: url }}
        style={styles.mapImage}
        resizeMode="cover"
      />
      <View style={styles.mapOverlay}>
        <Text style={styles.mapOverlayText}>Tap to open map</Text>
      </View>
    </TouchableOpacity>
  );
}

function MarkdownBubble({ content, textColor }: { content: string; textColor: string }) {
  // Extract [MAP_IMAGE]...[/MAP_IMAGE] tags and split content around them
  const mapRegex = /\[MAP_IMAGE\](https?:\/\/[^\s\[\]]+)\[\/MAP_IMAGE\]/g;
  const mdImgRegex = /!\[([^\]]*)\]\((https?:\/\/api\.mapbox\.com[^)]+)\)/g;
  const parts: { type: 'text' | 'map'; value: string }[] = [];
  let lastIdx = 0;
  let match;

  // First check for [MAP_IMAGE] tags
  while ((match = mapRegex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    }
    parts.push({ type: 'map', value: match[1] });
    lastIdx = match.index + match[0].length;
  }
  // Also check for markdown image syntax with mapbox URLs
  if (parts.length === 0) {
    while ((match = mdImgRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', value: content.slice(lastIdx, match.index) });
      }
      parts.push({ type: 'map', value: match[2] });
      lastIdx = match.index + match[0].length;
    }
  }
  if (lastIdx < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIdx) });
  }
  if (parts.length === 0) {
    parts.push({ type: 'text', value: content });
  }

  const allElements: React.ReactNode[] = [];
  let globalKey = 0;

  for (const part of parts) {
    if (part.type === 'map') {
      allElements.push(<MapImage key={`map-${globalKey++}`} url={part.value} />);
      continue;
    }

  const lines = part.value.split('\n');
  const elements: React.ReactNode[] = [];
  const baseText = { fontSize: 15, lineHeight: 22, color: textColor };
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (i > 0 && i < lines.length - 1) {
        elements.push(<View key={key++} style={{ height: 6 }} />);
      }
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <View key={key++} style={{ height: 1, backgroundColor: textColor, opacity: 0.15, marginVertical: 8 }} />
      );
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={[baseText, { fontSize: 15, fontWeight: '600', marginTop: 6, marginBottom: 2 }]}>
          {parseInlineMarkdown(trimmed.slice(4), textColor, [baseText, { fontSize: 15, fontWeight: '600' }])}
        </Text>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={[baseText, { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 2 }]}>
          {parseInlineMarkdown(trimmed.slice(3), textColor, [baseText, { fontSize: 16, fontWeight: '700' }])}
        </Text>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <Text key={key++} style={[baseText, { fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 3 }]}>
          {parseInlineMarkdown(trimmed.slice(2), textColor, [baseText, { fontSize: 18, fontWeight: '700' }])}
        </Text>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <View key={key++} style={{ borderLeftWidth: 3, borderLeftColor: '#3FC39E', paddingLeft: 10, marginVertical: 3, opacity: 0.9 }}>
          <Text style={[baseText, { fontStyle: 'italic' }]}>
            {parseInlineMarkdown(trimmed.slice(2), textColor, [baseText, { fontStyle: 'italic' }])}
          </Text>
        </View>
      );
      continue;
    }

    // Bullet list (-, *, ·, •)
    const bulletMatch = trimmed.match(/^[-*·•]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <View key={key++} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, paddingLeft: 4 }}>
          <Text style={[baseText, { marginRight: 8, color: '#3FC39E', fontWeight: '700' }]}>•</Text>
          <Text style={[baseText, { flex: 1 }]}>
            {parseInlineMarkdown(bulletMatch[1], textColor, baseText)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      elements.push(
        <View key={key++} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, paddingLeft: 4 }}>
          <Text style={[baseText, { marginRight: 8, color: '#3FC39E', fontWeight: '600', minWidth: 18 }]}>{numMatch[1]}.</Text>
          <Text style={[baseText, { flex: 1 }]}>
            {parseInlineMarkdown(numMatch[2], textColor, baseText)}
          </Text>
        </View>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={key++} style={[baseText, { marginBottom: 3 }]}>
        {parseInlineMarkdown(trimmed, textColor, baseText)}
      </Text>
    );
  }

  allElements.push(<View key={`text-${globalKey++}`}>{elements}</View>);
  }

  return <View>{allElements}</View>;
}

// ── Typewriter constants ────────────────────────────────────────────
const CHAR_DELAY = 8; // ms per character for typewriter effect
const CHUNK_SIZE = 3; // characters revealed per tick

// ── Main Component ──────────────────────────────────────────────────
export default function AIChatSheet({
  visible,
  onClose,
  contextType = 'global',
  contextData,
}: AIChatSheetProps) {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  // View state: 'lobby' or 'chat'
  const [view, setView] = useState<'lobby' | 'chat'>('lobby');
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  const suggested = contextType === 'destination'
    ? SUGGESTED_QUESTIONS_DESTINATION
    : SUGGESTED_QUESTIONS_GLOBAL;

  const headerBg = isDark ? '#1A1A1A' : colors.white;

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    header: { backgroundColor: headerBg, borderBottomColor: colors.gray200 },
    inputBar: { backgroundColor: headerBg, borderTopColor: colors.gray200 },
    inputContainer: { backgroundColor: isDark ? '#2A2A2A' : colors.gray100 },
    userBubble: { backgroundColor: colors.primary },
    aiBubble: { backgroundColor: isDark ? '#2A2A2A' : colors.gray100, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.gray200 },
    upsellBubble: { backgroundColor: isDark ? '#2D1F00' : '#FFF8E6', borderColor: '#F59E0B' },
    inputText: { color: colors.textPrimary },
    timeText: { color: colors.textTertiary },
    contextChipBg: { backgroundColor: isDark ? '#1A2E26' : '#E8F8F3' },
    suggestBorder: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.gray200 },
    sessionCard: { backgroundColor: isDark ? '#2A2A2A' : colors.white, borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.gray200 },
  }), [colors, isDark, headerBg]);

  // ── Load past sessions ────────────────────────────────────────────
  const loadPastSessions = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingSessions(true);
    try {
      const { data } = await supabase
        .from('ai_chat_sessions')
        .select('id, context_type, context_name, last_message_at, created_at')
        .eq('user_id', profile.id)
        .order('last_message_at', { ascending: false })
        .limit(20);
      setPastSessions(data || []);
    } catch {
      setPastSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [profile?.id]);

  // ── Resume a session ──────────────────────────────────────────────
  const resumeSession = useCallback(async (sid: string) => {
    setSessionId(sid);
    setView('chat');
    setIsLoading(true);
    try {
      const { data: msgs } = await supabase
        .from('ai_chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });
      setMessages(
        (msgs || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at),
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, []);

  // ── Start new chat ────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setInputText('');
    setStreamingMsgId(null);
    setView('chat');
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      // If opened from detail page (with context), go straight to chat
      if (contextType === 'destination' && contextData?.name) {
        startNewChat();
      } else {
        setView('lobby');
        loadPastSessions();
      }
    }
  }, [visible, contextType, contextData, startNewChat, loadPastSessions]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  // Ref for typewriter timer cleanup
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  // ── Typewriter reveal ──────────────────────────────────────────────
  const revealText = useCallback((msgId: string, fullText: string, isUpsell: boolean) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let charIndex = 0;

    typewriterRef.current = setInterval(() => {
      charIndex = Math.min(charIndex + CHUNK_SIZE, fullText.length);
      const partial = fullText.slice(0, charIndex);

      setMessages(prev =>
        prev.map(m =>
          m.id === msgId ? { ...m, content: partial, isStreaming: charIndex < fullText.length } : m
        )
      );
      scrollToBottom();

      if (charIndex >= fullText.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setMessages(prev =>
          prev.map(m =>
            m.id === msgId ? { ...m, isStreaming: false, isUpsell } : m
          )
        );
        setIsLoading(false);
        setStreamingMsgId(null);
      }
    }, CHAR_DELAY);
  }, [scrollToBottom]);

  // ── Send message ───────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    if (!profile?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    scrollToBottom();

    const aiMsgId = `ai-${Date.now()}`;
    setStreamingMsgId(aiMsgId);

    // Add placeholder AI message (typing indicator)
    setMessages(prev => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', isStreaming: true, createdAt: new Date() },
    ]);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          sessionId,
          message: trimmed,
          contextType,
          contextData: contextData ? {
            id: contextData.id,
            name: contextData.name,
            location: contextData.location,
            safetyScore: contextData.safetyScore,
            budget: contextData.budget,
            bestTime: contextData.bestTime,
            description: contextData.description,
          } : null,
          userId: profile.id,
        },
      });

      if (error) throw error;

      if (data?.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const responseText = data?.response || "Sorry, I couldn't get a response. Please try again.";
      const isUpsell = data?.isPremiumUpsell ?? false;

      // Start typewriter reveal
      revealText(aiMsgId, responseText, isUpsell);
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: "I'm having trouble connecting right now. Please try again in a moment.", isStreaming: false }
            : m
        )
      );
      setIsLoading(false);
      setStreamingMsgId(null);
      scrollToBottom();
    }
  }, [isLoading, profile, sessionId, contextType, contextData, scrollToBottom, revealText]);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Copy message on long press (contextual menu) ────────────────
  const handleCopyMessage = useCallback((content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Copy Message', 'Cancel'],
          cancelButtonIndex: 1,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await Clipboard.setStringAsync(content);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      );
    } else {
      // Android fallback: copy directly with feedback
      Clipboard.setStringAsync(content).then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }
  }, []);

  // ── Render message bubble ─────────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <View style={styles.messageRowRight}>
          <View style={styles.messageCol}>
            <TouchableOpacity
              style={[styles.bubble, styles.bubbleUser, dynamicStyles.userBubble]}
              onLongPress={() => handleCopyMessage(item.content)}
              activeOpacity={0.8}
              delayLongPress={400}
            >
              <Text style={styles.textUser}>{item.content}</Text>
            </TouchableOpacity>
            <Text style={[styles.timeOutside, styles.timeOutsideRight, dynamicStyles.timeText]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    if (item.isUpsell) {
      return (
        <View style={styles.messageRowLeft}>
          <View style={styles.messageCol}>
            <TouchableOpacity
              style={[styles.bubble, styles.bubbleUpsell, dynamicStyles.upsellBubble]}
              onLongPress={() => handleCopyMessage(item.content)}
              activeOpacity={0.8}
              delayLongPress={400}
            >
              <View style={styles.upsellHeader}>
                <Crown size={16} color="#F59E0B" variant="Bold" />
                <Text style={styles.upsellLabel}>Premium Feature</Text>
              </View>
              <MarkdownBubble content={item.content} textColor={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.timeOutside, styles.timeOutsideLeft, dynamicStyles.timeText]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    // AI message (normal or streaming)
    return (
      <View style={styles.messageRowLeft}>
        <View style={styles.messageCol}>
          <TouchableOpacity
            style={[styles.bubble, styles.bubbleAI, dynamicStyles.aiBubble]}
            onLongPress={() => !item.isStreaming && handleCopyMessage(item.content)}
            activeOpacity={item.isStreaming ? 1 : 0.8}
            delayLongPress={400}
          >
            {item.isStreaming && !item.content ? (
              <TypingIndicator color={colors.textSecondary} />
            ) : (
              <>
                <MarkdownBubble content={item.content} textColor={colors.textPrimary} />
                {item.isStreaming && (
                  <View style={styles.streamingCursor} />
                )}
              </>
            )}
          </TouchableOpacity>
          {!item.isStreaming && item.content ? (
            <Text style={[styles.timeOutside, styles.timeOutsideLeft, dynamicStyles.timeText]}>
              {formatTime(item.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  // ── Lobby View ────────────────────────────────────────────────────
  const renderLobby = () => (
    <View style={[styles.lobbyContainer, dynamicStyles.container]}>
      {/* Status bar spacer */}
      <View style={{ height: insets.top, backgroundColor: headerBg }} />

      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#3FC39E', '#2D9A7A']} style={styles.headerAvatar}>
            <Star1 size={16} color="#FFF" variant="Bold" />
          </LinearGradient>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Guidera AI</Text>
            <Text style={[styles.headerSubtitle, { color: '#3FC39E' }]}>Your travel assistant</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
        onPress={startNewChat}
        activeOpacity={0.8}
      >
        <Add size={22} color="#FFF" variant="Linear" />
        <Text style={styles.newChatBtnText}>New Chat</Text>
      </TouchableOpacity>

      {/* Past Sessions */}
      <View style={styles.sessionsHeader}>
        <Clock size={16} color={colors.textSecondary} variant="Linear" />
        <Text style={[styles.sessionsTitle, { color: colors.textSecondary }]}>Recent Chats</Text>
      </View>

      {loadingSessions ? (
        <ActivityIndicator size="small" color={colors.textTertiary} style={{ marginTop: 32 }} />
      ) : pastSessions.length === 0 ? (
        <View style={styles.emptyLobby}>
          <MessageText size={40} color={colors.textTertiary} variant="Bulk" />
          <Text style={[styles.emptyLobbyTitle, { color: colors.textSecondary }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptyLobbyText, { color: colors.textTertiary }]}>
            Start a new chat to ask anything about travel
          </Text>
        </View>
      ) : (
        <FlatList
          data={pastSessions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.sessionsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sessionCard, dynamicStyles.sessionCard]}
              onPress={() => resumeSession(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sessionCardLeft}>
                <LinearGradient
                  colors={item.context_type === 'destination' ? ['#3FC39E', '#2D9A7A'] : ['#6366F1', '#4F46E5']}
                  style={styles.sessionIcon}
                >
                  <Star1 size={12} color="#FFF" variant="Bold" />
                </LinearGradient>
                <View style={styles.sessionCardInfo}>
                  <Text style={[styles.sessionCardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.context_name || (item.context_type === 'global' ? 'General Travel Chat' : 'Destination Chat')}
                  </Text>
                  <Text style={[styles.sessionCardTime, { color: colors.textTertiary }]}>
                    {formatSessionDate(item.last_message_at)}
                  </Text>
                </View>
              </View>
              <ArrowLeft size={16} color={colors.textTertiary} variant="Linear" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // ── Chat View ─────────────────────────────────────────────────────
  const renderChat = () => (
    <View style={[styles.chatContainer, dynamicStyles.container]}>
      {/* Status bar spacer */}
      <View style={{ height: insets.top, backgroundColor: headerBg }} />

      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (contextType === 'destination') {
              onClose();
            } else {
              setView('lobby');
              loadPastSessions();
            }
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#3FC39E', '#2D9A7A']} style={styles.headerAvatar}>
            <Star1 size={16} color="#FFF" variant="Bold" />
          </LinearGradient>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Guidera AI</Text>
            <Text style={[styles.headerSubtitle, { color: '#3FC39E' }]}>Always online</Text>
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Context chip */}
      {contextType === 'destination' && contextData?.name && (
        <View style={[styles.contextChip, dynamicStyles.contextChipBg]}>
          <Star1 size={12} color="#3FC39E" variant="Bold" />
          <Text style={styles.contextChipText}>
            Asking about <Text style={styles.contextChipBold}>{contextData.name}</Text>
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.suggestionsCenter}>
            <View style={[styles.welcomeAvatarLarge]}>
              <LinearGradient colors={['#3FC39E', '#2D9A7A']} style={styles.welcomeAvatarGradient}>
                <Star1 size={28} color="#FFF" variant="Bold" />
              </LinearGradient>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
              {contextType === 'destination' && contextData?.name
                ? `Ask about ${contextData.name}`
                : 'Ask me anything'}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              {contextType === 'destination' && contextData?.name
                ? 'Safety tips, local food, transport, what to pack...'
                : 'Destinations, packing, safety, budgets, culture...'}
            </Text>
            <View style={styles.suggestChipsWrap}>
              {suggested.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.suggestChip, dynamicStyles.suggestBorder]}
                  onPress={() => sendMessage(q)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestChipText, { color: colors.textPrimary }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, dynamicStyles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
            <TextInput
              style={[styles.input, dynamicStyles.inputText]}
              placeholder={contextType === 'destination' && contextData?.name
                ? `Ask about ${contextData.name}...`
                : 'Ask me anything about travel...'}
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => sendMessage(inputText)}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? colors.primary : colors.gray300 },
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading && !streamingMsgId
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Send2 size={20} color="#FFF" variant="Bold" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {view === 'lobby' ? renderLobby() : renderChat()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────
  lobbyContainer: { flex: 1 },
  chatContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  headerTitleGroup: { alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, fontWeight: '500' },
  headerRight: { width: 32 },

  // ── Context Chip ────────────────────────────────────
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  contextChipText: { fontSize: 13, color: '#3FC39E' },
  contextChipBold: { fontWeight: '700' },

  // ── Lobby ───────────────────────────────────────────
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
  },
  newChatBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: spacing.md,
    marginTop: 24,
    marginBottom: spacing.sm,
  },
  sessionsTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sessionsList: { paddingHorizontal: spacing.md },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  sessionCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sessionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sessionCardInfo: { flex: 1 },
  sessionCardTitle: { fontSize: 15, fontWeight: '600' },
  sessionCardTime: { fontSize: 12, marginTop: 2 },
  emptyLobby: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyLobbyTitle: { fontSize: 17, fontWeight: '600', marginTop: 16 },
  emptyLobbyText: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  // ── Chat Messages ───────────────────────────────────
  messageList: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  messageListEmpty: { flexGrow: 1, justifyContent: 'center' },
  messageRowLeft: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md },
  messageRowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  messageCol: { maxWidth: '82%', flexShrink: 1 },
  bubble: { borderRadius: borderRadius.xl, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleUpsell: { borderWidth: 1, borderBottomLeftRadius: 4 },
  textUser: { color: '#FFFFFF', fontSize: 15, lineHeight: 21 },
  timeOutside: { fontSize: 11, marginTop: 4 },
  timeOutsideLeft: { textAlign: 'left' as const, marginLeft: 2 },
  timeOutsideRight: { textAlign: 'right' as const, marginRight: 2 },
  upsellHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  upsellLabel: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  streamingCursor: { width: 2, height: 16, backgroundColor: '#3FC39E', marginTop: 4, borderRadius: 1 },

  // ── Typing Indicator ────────────────────────────────
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },

  // ── Centered Suggestions (empty chat) ───────────────
  suggestionsCenter: { alignItems: 'center', paddingHorizontal: spacing.lg },
  welcomeAvatarLarge: { marginBottom: 16 },
  welcomeAvatarGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  welcomeSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  suggestChipsWrap: { width: '100%' },
  suggestChip: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  suggestChipText: { fontSize: 14 },

  // ── Input Bar ───────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 4,
    maxHeight: 120,
  },
  input: { fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // ── Map Image ─────────────────────────────────────
  mapImageContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
