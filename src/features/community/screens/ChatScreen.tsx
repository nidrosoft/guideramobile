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
import { spacing, borderRadius } from '@/styles';
import { styles } from './ChatScreen.styles';
import ChatMessageBubble, { ChatMessageData } from '../components/ChatMessageBubble';

// Mock conversation data
const MOCK_BUDDY = {
  id: 'buddy-1',
  firstName: 'Sarah',
  lastName: 'Chen',
  avatar: 'https://i.pravatar.cc/150?img=5',
  isOnline: true,
  lastSeen: new Date(),
};

const MOCK_MESSAGES: ChatMessageData[] = [
  {
    id: 'msg-1',
    senderId: 'buddy-1',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?img=5',
    type: 'text',
    content: 'Hey! Are you still planning to visit Tokyo next month?',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    senderName: 'You',
    senderAvatar: 'https://i.pravatar.cc/150?img=12',
    type: 'text',
    content: 'Yes! I\'m so excited. Landing on the 15th 🎉',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
  },
  {
    id: 'msg-3',
    senderId: 'buddy-1',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?img=5',
    type: 'text',
    content: 'Perfect! I\'ll be there from the 14th to 28th. We should definitely meet up!',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: 'msg-4',
    senderId: 'current-user',
    senderName: 'You',
    senderAvatar: 'https://i.pravatar.cc/150?img=12',
    type: 'text',
    content: 'Absolutely! I\'d love to explore Shibuya and try some authentic ramen together',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: 'msg-5',
    senderId: 'buddy-1',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?img=5',
    type: 'image',
    content: 'Check out this ramen place I found!',
    media: [{ url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400' }],
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [{ emoji: '🤤', count: 1, userReacted: true }],
  },
  {
    id: 'msg-6',
    senderId: 'current-user',
    senderName: 'You',
    senderAvatar: 'https://i.pravatar.cc/150?img=12',
    type: 'text',
    content: 'OMG that looks amazing! 🍜 Adding it to my list right now',
    status: 'delivered',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'msg-7',
    senderId: 'buddy-1',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?img=5',
    type: 'text',
    content: 'I also know a great spot for matcha desserts in Harajuku. Want me to send you the location?',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: tc, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<ChatMessageData[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const reactionScaleAnim = useRef(new RNAnimated.Value(0)).current;

  const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
  
  const buddy = MOCK_BUDDY;
  const currentUserId = 'current-user';
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      senderAvatar: 'https://i.pravatar.cc/150?img=12',
      type: 'text',
      content: inputText.trim(),
      status: 'sending',
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Simulate message sent
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' as const } : m)
      );
    }, 500);
    
    // Simulate delivered
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m)
      );
    }, 1000);
  }, [inputText]);
  
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
