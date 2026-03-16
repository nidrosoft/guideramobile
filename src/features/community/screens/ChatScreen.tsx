/**
 * CHAT SCREEN
 * 
 * 1:1 Direct Message chat with a buddy.
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
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  More,
  Send2,
  Camera,
  Microphone2,
  Image as ImageIcon,
  Location,
  EmojiHappy,
  AttachCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, borderRadius } from '@/styles';
import { styles } from './ChatScreen.styles';
import ChatMessageBubble, { ChatMessageData } from '../components/ChatMessageBubble';
import { chatService } from '@/services/community/chat.service';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const reactionScaleAnim = useRef(new RNAnimated.Value(0)).current;

  const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
  
  const [buddy, setBuddy] = useState({
    id: '',
    firstName: '',
    lastName: '',
    avatar: '',
    isOnline: false,
    lastSeen: new Date(),
  });
  const currentUserId = profile?.id || '';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!profile?.id || !id) return;
      try {
        const [rawMessages, conversations] = await Promise.all([
          chatService.getMessages(id, { limit: 50 }),
          chatService.getConversations(profile.id),
        ]);
        if (cancelled) return;

        const conv = conversations.find(c => c.id === id);
        if (conv) {
          const nameParts = conv.otherUser.fullName.split(' ');
          setBuddy({
            id: conv.otherUser.id,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            avatar: conv.otherUser.avatarUrl || 'https://i.pravatar.cc/150?img=1',
            isOnline: false,
            lastSeen: new Date(),
          });
        }

        const mapped: ChatMessageData[] = rawMessages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderId === profile.id ? 'You' : (conv?.otherUser.fullName || 'Unknown'),
          senderAvatar: m.senderId === profile.id
            ? (profile.avatar_url || 'https://i.pravatar.cc/150?img=12')
            : (conv?.otherUser.avatarUrl || 'https://i.pravatar.cc/150?img=1'),
          type: (m.type || 'text') as any,
          content: m.content,
          status: 'read' as const,
          createdAt: new Date(m.createdAt),
        }));
        setMessages(mapped);
      } catch (err) {
        if (__DEV__) console.warn('ChatScreen load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, profile?.id]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !profile?.id || !id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const tempId = `msg-temp-${Date.now()}`;
    const content = inputText.trim();
    const newMessage: ChatMessageData = {
      id: tempId,
      senderId: currentUserId,
      senderName: 'You',
      senderAvatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=12',
      type: 'text',
      content,
      status: 'sending',
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    try {
      const saved = await chatService.sendMessage(id, profile.id, content);
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, id: saved.id, status: 'delivered' as const } : m)
      );
    } catch (err) {
      if (__DEV__) console.warn('Failed to send message:', err);
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'sent' as const } : m)
      );
    }
  }, [inputText, profile, id, currentUserId]);
  
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      
      const reactions = m.reactions || [];
      const existingIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (existingIndex >= 0) {
        const existing = reactions[existingIndex];
        if (existing.userReacted) {
          // Remove reaction
          if (existing.count === 1) {
            return { ...m, reactions: reactions.filter((_, i) => i !== existingIndex) };
          }
          return {
            ...m,
            reactions: reactions.map((r, i) => 
              i === existingIndex ? { ...r, count: r.count - 1, userReacted: false } : r
            ),
          };
        } else {
          // Add to existing
          return {
            ...m,
            reactions: reactions.map((r, i) => 
              i === existingIndex ? { ...r, count: r.count + 1, userReacted: true } : r
            ),
          };
        }
      } else {
        // New reaction
        return { ...m, reactions: [...reactions, { emoji, count: 1, userReacted: true }] };
      }
    }));
  }, []);
  
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };
  
  const renderMessage = useCallback(({ item, index }: { item: ChatMessageData; index: number }) => {
    const isOwn = item.senderId === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;
    
    return (
      <ChatMessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onReactionPress={(emoji) => handleReaction(item.id, emoji)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setReactionMessageId(item.id);
          RNAnimated.spring(reactionScaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }}
      />
    );
  }, [messages, handleReaction]);
  
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
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileInfo} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: buddy.avatar }} style={styles.avatar} />
            {buddy.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: tc.success, borderColor: tc.background }]} />}
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: tc.textPrimary }]}>{buddy.firstName} {buddy.lastName}</Text>
            <Text style={[styles.status, { color: buddy.isOnline ? tc.success : tc.textTertiary }]}>
              {buddy.isOnline ? 'Online' : `Last seen ${formatLastSeen(buddy.lastSeen)}`}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <More size={22} color={tc.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        
        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Image source={{ uri: buddy.avatar }} style={styles.typingAvatar} />
            <View style={[styles.typingBubble, { backgroundColor: tc.bgElevated }]}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, { backgroundColor: tc.textTertiary }, styles.typingDot1]} />
                <View style={[styles.typingDot, { backgroundColor: tc.textTertiary }, styles.typingDot2]} />
                <View style={[styles.typingDot, { backgroundColor: tc.textTertiary }, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
        
        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle, paddingBottom: insets.bottom || spacing.md }]}>
          {showAttachments && (
            <View style={[styles.attachmentOptions, { borderBottomColor: tc.borderSubtle }]}>
              <TouchableOpacity style={styles.attachmentButton}>
                <Camera size={22} color={tc.primary} />
                <Text style={[styles.attachmentLabel, { color: tc.textSecondary }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentButton}>
                <ImageIcon size={22} color={tc.primary} />
                <Text style={[styles.attachmentLabel, { color: tc.textSecondary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentButton}>
                <Location size={22} color={tc.primary} />
                <Text style={[styles.attachmentLabel, { color: tc.textSecondary }]}>Location</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={() => setShowAttachments(!showAttachments)}
            >
              <AttachCircle size={24} color={tc.textTertiary} />
            </TouchableOpacity>
            
            <View style={[styles.textInputContainer, { backgroundColor: tc.bgInput || tc.bgCard }]}>
              <TextInput
                style={[styles.textInput, { color: tc.textPrimary }]}
                placeholder="Type a message..."
                placeholderTextColor={tc.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity style={styles.emojiButton}>
                <EmojiHappy size={22} color={tc.textTertiary} />
              </TouchableOpacity>
            </View>
            
            {inputText.trim() ? (
              <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: tc.primary }]}
                onPress={handleSend}
              >
                <Send2 size={22} color="#FFFFFF" variant="Bold" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.micButton, { backgroundColor: tc.primary + '15' }]}>
                <Microphone2 size={22} color={tc.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Reaction Picker Overlay */}
      <Modal
        visible={reactionMessageId !== null}
        transparent
        animationType="none"
        onRequestClose={() => {
          reactionScaleAnim.setValue(0);
          setReactionMessageId(null);
        }}
      >
        <Pressable
          style={reactionStyles.overlay}
          onPress={() => {
            reactionScaleAnim.setValue(0);
            setReactionMessageId(null);
          }}
        >
          <RNAnimated.View
            style={[
              reactionStyles.pickerContainer,
              { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, transform: [{ scale: reactionScaleAnim }] },
            ]}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={reactionStyles.emojiOption}
                onPress={() => {
                  if (reactionMessageId) {
                    handleReaction(reactionMessageId, emoji);
                  }
                  reactionScaleAnim.setValue(0);
                  setReactionMessageId(null);
                }}
                activeOpacity={0.6}
              >
                <Text style={reactionStyles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </RNAnimated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  emojiText: {
    fontSize: 26,
  },
});
