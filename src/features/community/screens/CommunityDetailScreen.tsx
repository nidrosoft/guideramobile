/**
 * COMMUNITY DETAIL SCREEN
 * 
 * Shows full community details with tabs for Chat, Members, Events.
 * Premium users can interact, others can only view.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  More,
  People,
  Message as MessageIcon,
  Calendar,
  Send2,
  Crown,
  Verify,
  Setting2,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { MOCK_COMMUNITY_DETAIL, MOCK_MESSAGES, MOCK_EVENTS } from '../data/mockData';
import { Message } from '../types/chat.types';
import { getDefaultChatPermissions } from '../types/chat.types';
import EventCard from '../components/EventCard';
import ChatInput from '../components/ChatInput';

type TabType = 'chat' | 'members' | 'events' | 'about';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'chat', label: 'Chat', icon: MessageIcon },
  { id: 'members', label: 'Members', icon: People },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'about', label: 'About', icon: InfoCircle },
];

export default function CommunityDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  
  // Mock states - will come from auth/API
  const isPremium = true;
  const isMember = true;
  const community = MOCK_COMMUNITY_DETAIL;
  
  const permissions = getDefaultChatPermissions(isPremium, isMember);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSendMessage = useCallback((text: string, attachments?: any[]) => {
    if (!text.trim() && !attachments?.length) return;
    if (!permissions.canSendMessages) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: community.id,
      chatType: 'community',
      senderId: 'current-user',
      sender: {
        id: 'current-user',
        firstName: 'You',
        lastName: '',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isPremium: true,
      },
      type: attachments?.length ? 'image' : 'text',
      content: text.trim(),
      media: attachments?.filter(a => a.type === 'image' || a.type === 'video').map(a => ({
        type: a.type,
        url: a.uri,
        thumbnailUrl: a.uri,
      })),
      status: 'sending',
      createdAt: new Date(),
      isDeleted: false,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  }, [permissions.canSendMessages, community.id]);
  
  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Handle join logic
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  const renderChatTab = () => (
    <View style={styles.chatContainer}>
      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => {
          const isOwn = message.senderId === 'current-user';
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <View
              key={message.id}
              style={[styles.messageRow, isOwn && styles.messageRowOwn]}
            >
              {!isOwn && showAvatar && (
                <Image source={{ uri: message.sender.avatar }} style={styles.messageAvatar} />
              )}
              {!isOwn && !showAvatar && <View style={styles.avatarPlaceholder} />}
              
              <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
                {!isOwn && showAvatar && (
                  <Text style={styles.senderName}>
                    {message.sender.firstName} {message.sender.lastName}
                  </Text>
                )}
                {/* Media attachments */}
                {message.media && message.media.length > 0 && (
                  <View style={styles.mediaContainer}>
                    {message.media.map((media, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: media.url }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                {/* Location */}
                {message.location && (
                  <View style={styles.locationMessage}>
                    <Text style={styles.locationName}>{message.location.name}</Text>
                  </View>
                )}
                {message.content.length > 0 && (
                  <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
                    {message.content}
                  </Text>
                )}
                <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
                  {formatTime(message.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Input Area */}
      {permissions.canSendMessages ? (
        <ChatInput
          onSend={handleSendMessage}
          placeholder="Type a message..."
          isPremium={isPremium}
        />
      ) : (
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || spacing.md }]}>
          <TouchableOpacity style={styles.premiumPrompt} onPress={() => router.push('/premium' as any)}>
            <Crown size={20} color={colors.warning} variant="Bold" />
            <Text style={styles.premiumPromptText}>
              {!isMember ? 'Join to participate' : 'Upgrade to Premium to send messages'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  const renderMembersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.memberCount}>
        {community.stats.memberCount.toLocaleString()} members
      </Text>
      
      {/* Placeholder member list */}
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={styles.memberCard}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?img=${i + 10}` }}
            style={styles.memberAvatar}
          />
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Member {i}</Text>
            <Text style={styles.memberRole}>Member since 2024</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
  
  const renderEventsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {MOCK_EVENTS.filter(e => e.communityId === community.id).length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.gray300} variant="Bold" />
          <Text style={styles.emptyTitle}>No upcoming events</Text>
          <Text style={styles.emptyText}>Events will appear here</Text>
        </View>
      ) : (
        MOCK_EVENTS.filter(e => e.communityId === community.id).map(event => (
          <EventCard
            key={event.id}
            event={event}
            variant="list"
            onPress={() => router.push(`/community/event/${event.id}` as any)}
          />
        ))
      )}
    </ScrollView>
  );
  
  const renderAboutTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.aboutTitle}>About</Text>
      <Text style={styles.aboutDescription}>{community.description}</Text>
      
      <Text style={styles.aboutTitle}>Community Rules</Text>
      {community.rules.map((rule, index) => (
        <View key={rule.id} style={styles.ruleCard}>
          <View style={styles.ruleNumber}>
            <Text style={styles.ruleNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <Text style={styles.ruleDescription}>{rule.description}</Text>
          </View>
        </View>
      ))}
      
      <Text style={styles.aboutTitle}>Tags</Text>
      <View style={styles.tagsContainer}>
        {community.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat': return renderChatTab();
      case 'members': return renderMembersTab();
      case 'events': return renderEventsTab();
      case 'about': return renderAboutTab();
      default: return null;
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      
      {/* Header with Cover Image */}
      <View style={styles.header}>
        <Image source={{ uri: community.coverImage }} style={styles.coverImage} />
        <View style={styles.headerOverlay} />
        
        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <More size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Community Info */}
        <View style={styles.communityInfo}>
          <Image source={{ uri: community.avatar }} style={styles.avatar} />
          <View style={styles.communityText}>
            <View style={styles.nameRow}>
              <Text style={styles.communityName}>{community.name}</Text>
              {community.isVerified && (
                <Verify size={18} color={colors.primary} variant="Bold" />
              )}
            </View>
            <Text style={styles.memberStats}>
              {community.stats.memberCount.toLocaleString()} members • {community.stats.activeMembers} active
            </Text>
          </View>
          
          {!isMember ? (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.settingsButton}>
              <Setting2 size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
            >
              <Icon
                size={18}
                color={isActive ? colors.primary : colors.gray500}
                variant={isActive ? 'Bold' : 'Outline'}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Tab Content */}
      {renderTabContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.white,
  },
  communityText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  communityName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  memberStats: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  joinButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray500,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.xs,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: spacing.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: spacing.sm,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: colors.gray500,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: colors.white,
    opacity: 0.7,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    maxHeight: 100,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  premiumPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  premiumPromptText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  // Members styles
  memberCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  memberRole: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Events styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // About styles
  aboutTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  aboutDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ruleCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  ruleContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  ruleTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  ruleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Media in messages
  mediaContainer: {
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  locationMessage: {
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  locationName: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
