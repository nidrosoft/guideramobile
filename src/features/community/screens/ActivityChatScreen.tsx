/**
 * ACTIVITY CHAT SCREEN
 *
 * Group chat for Pulse activity participants.
 * Uses the chat_rooms table (type='activity') + chat_messages.
 * Real-time message updates via Supabase Realtime.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft2, Send2, People } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, borderRadius } from '@/styles';
import { chatService } from '@/services/community/chat.service';
import { activityService } from '@/services/community/activity.service';
import { supabase } from '@/lib/supabase/client';
import AvatarFallback from '../components/pulse/AvatarFallback';
import type { Activity, UserProfile } from '@/services/community/types/community.types';

interface ChatMsg {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: Date;
  isOwn: boolean;
}

export default function ActivityChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Participant map for resolving sender names
  const participantMap = useRef<Map<string, UserProfile>>(new Map());

  // Load activity + chat room + messages
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activityId || !profile?.id) return;
      try {
        // Get activity details
        const act = await activityService.getActivity(activityId);
        if (cancelled) return;
        setActivity(act);

        // Build participant map
        if (act?.participants) {
          for (const p of act.participants) {
            if (p.user) participantMap.current.set(p.userId, p.user);
          }
        }
        if (act?.creator) {
          participantMap.current.set(act.createdBy, act.creator);
        }

        // Get chat room
        const room = await chatService.getActivityChatRoom(activityId);
        if (cancelled || !room) {
          setLoading(false);
          return;
        }
        setChatRoomId(room.id);

        // Load messages
        const rawMsgs = await chatService.getMessages(room.id, { limit: 100 });
        if (cancelled) return;

        setMessages(rawMsgs.map(m => mapMessage(m, profile.id)));
      } catch (err) {
        if (__DEV__) console.warn('ActivityChatScreen load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activityId, profile?.id]);

  // M5: Mark activity chat alerts as read when opened
  useEffect(() => {
    if (!activityId || !profile?.id) return;
    supabase
      .from('alerts')
      .update({ status: 'read' })
      .eq('user_id', profile.id)
      .eq('alert_type_code', 'activity_message')
      .eq('status', 'delivered')
      .then(() => {});
  }, [activityId, profile?.id]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`activity-chat-${chatRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${chatRoomId}`,
      }, (payload) => {
        const msg = payload.new as any;
        // Don't duplicate messages we sent ourselves (optimistic add)
        if (msg.user_id === profile?.id) return;

        const sender = participantMap.current.get(msg.user_id);
        setMessages(prev => [...prev, {
          id: msg.id,
          senderId: msg.user_id,
          senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone',
          senderAvatar: sender?.avatarUrl,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          isOwn: false,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatRoomId, profile?.id]);

  function mapMessage(m: any, currentUserId: string): ChatMsg {
    const sender = participantMap.current.get(m.senderId);
    return {
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderId === currentUserId ? 'You' : (sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone'),
      senderAvatar: sender?.avatarUrl,
      content: m.content,
      createdAt: new Date(m.createdAt),
      isOwn: m.senderId === currentUserId,
    };
  }

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !chatRoomId || !profile?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const content = inputText.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic add
    const optimistic: ChatMsg = {
      id: tempId,
      senderId: profile.id,
      senderName: 'You',
      senderAvatar: profile.avatar_url,
      content,
      createdAt: new Date(),
      isOwn: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');
    setSending(true);

    try {
      const saved = await chatService.sendMessage(chatRoomId, profile.id, content);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: saved.id } : m));
    } catch (err) {
      if (__DEV__) console.warn('Failed to send:', err);
    } finally {
      setSending(false);
    }
  }, [inputText, chatRoomId, profile]);

  const renderMessage = useCallback(({ item, index }: { item: ChatMsg; index: number }) => {
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showSender = !prevMsg || prevMsg.senderId !== item.senderId;
    const timeStr = item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[msgStyles.row, item.isOwn && msgStyles.rowOwn]}>
        {!item.isOwn && showSender && (
          <AvatarFallback uri={item.senderAvatar} name={item.senderName} size={28} style={msgStyles.avatar} />
        )}
        {!item.isOwn && !showSender && <View style={msgStyles.avatarSpacer} />}
        <View style={[msgStyles.bubble, item.isOwn ? { backgroundColor: tc.primary } : { backgroundColor: tc.bgElevated, borderWidth: 1, borderColor: tc.borderSubtle }]}>
          {!item.isOwn && showSender && (
            <Text style={[msgStyles.senderName, { color: tc.primary }]}>{item.senderName}</Text>
          )}
          <Text style={[msgStyles.content, { color: item.isOwn ? '#FFFFFF' : tc.textPrimary }]}>
            {item.content}
          </Text>
          <Text style={[msgStyles.time, { color: item.isOwn ? 'rgba(255,255,255,0.6)' : tc.textTertiary }]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  }, [messages, tc]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.background, paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>
            {activity?.title || 'Activity Chat'}
          </Text>
          <View style={styles.headerMeta}>
            <People size={14} color={tc.textTertiary} />
            <Text style={[styles.headerSubtitle, { color: tc.textTertiary }]}>
              {activity?.participantCount || 0} participants
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: tc.textTertiary }]}>
                No messages yet. Say hi! {String.fromCodePoint(0x1F44B)}
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={[styles.inputBar, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
          <View style={[styles.inputWrap, { backgroundColor: tc.bgCard || tc.background, borderColor: tc.borderSubtle }]}>
            <TextInput
              style={[styles.input, { color: tc.textPrimary }]}
              placeholder="Type a message..."
              placeholderTextColor={tc.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? tc.primary : tc.borderSubtle }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Send2 size={20} color={inputText.trim() ? '#FFFFFF' : tc.textTertiary} variant="Bold" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerSubtitle: { fontSize: 12 },
  msgList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: { fontSize: 15, paddingVertical: 8 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
});

const msgStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  rowOwn: { justifyContent: 'flex-end' },
  avatar: { marginRight: 6, marginBottom: 2 },
  avatarSpacer: { width: 34 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  content: { fontSize: 15, lineHeight: 20 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
});
