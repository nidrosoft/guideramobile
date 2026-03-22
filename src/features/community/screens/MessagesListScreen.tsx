/**
 * MESSAGES LIST SCREEN
 * 
 * Shows all group and DM conversations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft2,
  SearchNormal1,
  People,
  Message,
  Edit,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, typography, borderRadius } from '@/styles';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services/community/chat.service';
import { supabase } from '@/lib/supabase/client';

interface Conversation {
  id: string;
  type: 'group' | 'dm';
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  memberCount?: number;
}

type FilterType = 'all' | 'groups' | 'dms';

export default function MessagesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [dmConversations, groupChats, activityChats] = await Promise.all([
        chatService.getConversations(profile.id),
        chatService.getGroupChats(profile.id),
        chatService.getActivityChats(profile.id),
      ]);

      const dmMapped: Conversation[] = dmConversations.map(c => ({
        id: c.id,
        type: 'dm' as const,
        name: c.otherUser.fullName,
        avatar: c.otherUser.avatarUrl || '',
        lastMessage: c.lastMessage || '',
        lastMessageTime: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
        unreadCount: c.unreadCount || 0,
        isOnline: false,
      }));

      const groupMapped: Conversation[] = groupChats.map(g => ({
        id: g.id,
        type: 'group' as const,
        name: g.name,
        avatar: '',
        lastMessage: g.lastMessage || '',
        lastMessageTime: g.lastMessageAt ? new Date(g.lastMessageAt) : new Date(),
        unreadCount: g.unreadCount || 0,
      }));

      const activityMapped: Conversation[] = activityChats.map(g => ({
        id: g.referenceId,
        type: 'group' as const,
        name: `${String.fromCodePoint(0x1F4CD)} ${g.name}`,
        avatar: '',
        lastMessage: g.lastMessage || '',
        lastMessageTime: g.lastMessageAt ? new Date(g.lastMessageAt) : new Date(),
        unreadCount: g.unreadCount || 0,
      }));

      const combined = [...dmMapped, ...groupMapped, ...activityMapped].sort(
        (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
      setConversations(combined);
    } catch (err) {
      if (__DEV__) console.warn('MessagesListScreen load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: refresh conversation list when new messages arrive
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('messages-list-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, () => {
        // Re-fetch the full conversation list to get updated previews + counts
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchConversations]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (conversation.type === 'group') {
      // Activity chats have a pin emoji prefix — route to activity chat
      if (conversation.name.startsWith(String.fromCodePoint(0x1F4CD))) {
        router.push(`/community/activity-chat/${conversation.id}`);
      } else {
        router.push(`/community/${conversation.id}`);
      }
    } else {
      router.push(`/community/chat/${conversation.id}`);
    }
  };
  
  const handleNewMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/community/search');
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  const filteredConversations = conversations
    .filter(conv => {
      if (filter === 'groups') return conv.type === 'group';
      if (filter === 'dms') return conv.type === 'dm';
      return true;
    })
    .filter(conv => 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('community.messages.title')}</Text>
          {totalUnread > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: tc.error }]}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleNewMessage} accessibilityRole="button" accessibilityLabel="New message">
          <Edit size={22} color={tc.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <SearchNormal1 size={20} color={tc.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder={t('community.messages.searchPlaceholder')}
          placeholderTextColor={tc.textTertiary}
          accessibilityLabel="Search conversations"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {[
          { id: 'all' as FilterType, label: t('community.messages.all') },
          { id: 'groups' as FilterType, label: t('community.messages.groups'), icon: People },
          { id: 'dms' as FilterType, label: t('community.messages.direct'), icon: Message },
        ].map(f => {
          const isActive = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterButton,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                isActive && { backgroundColor: tc.primary, borderColor: tc.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f.id);
              }}
            >
              {f.icon && (
                <f.icon size={16} color={isActive ? '#FFFFFF' : tc.textSecondary} />
              )}
              <Text style={[
                styles.filterText,
                { color: tc.textSecondary },
                isActive && { color: '#FFFFFF' },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item: conversation }) => (
          <TouchableOpacity
            style={[styles.conversationCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
            onPress={() => handleConversationPress(conversation)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${conversation.name}${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread` : ''}`}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: conversation.avatar }} style={styles.avatar} />
              {conversation.type === 'dm' && conversation.isOnline && (
                <View style={[styles.onlineIndicator, { backgroundColor: tc.success, borderColor: tc.bgElevated }]} />
              )}
              {conversation.type === 'group' && (
                <View style={[styles.groupIndicator, { backgroundColor: tc.primary, borderColor: tc.bgElevated }]}>
                  <People size={10} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.conversationName, { color: tc.textPrimary }]} numberOfLines={1}>
                  {conversation.name}
                </Text>
                <Text style={[
                  styles.conversationTime,
                  { color: tc.textTertiary },
                  conversation.unreadCount > 0 && { color: tc.primary, fontWeight: '600' as const },
                ]}>
                  {formatTime(conversation.lastMessageTime)}
                </Text>
              </View>

              <View style={styles.conversationFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    { color: tc.textSecondary },
                    conversation.unreadCount > 0 && { color: tc.textPrimary, fontWeight: '500' as const },
                  ]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </Text>

                {conversation.unreadCount > 0 ? (
                  <View style={[styles.unreadBadge, { backgroundColor: tc.primary }]}>
                    <Text style={styles.unreadBadgeText}>
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Text>
                  </View>
                ) : (
                  <TickCircle size={16} color={tc.textTertiary} variant="Bold" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tc.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Message size={48} color={tc.textTertiary} />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>{t('community.messages.noConversations')}</Text>
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{t('community.messages.startChatting')}</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  newButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  groupIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
  },
  conversationTime: {
    fontSize: typography.fontSize.xs,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    marginRight: spacing.sm,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});
