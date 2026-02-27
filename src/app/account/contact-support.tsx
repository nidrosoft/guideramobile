/**
 * CONTACT SUPPORT SCREEN
 * 
 * Multiple ways to reach support: chat, email, and quick actions.
 */

import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Message,
  Sms,
  Call,
  Send2,
  Clock,
  TickCircle,
  DocumentText,
  Warning2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { id: 'report', icon: Warning2, label: 'Report an Issue', route: '/account/report-issue' },
  { id: 'feedback', icon: DocumentText, label: 'Send Feedback', action: 'feedback' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: "Hi there! 👋 I'm Guidera's support assistant. How can I help you today?",
    isUser: false,
    timestamp: new Date(),
  },
];

const AUTO_RESPONSES: Record<string, string> = {
  'booking': "For booking-related issues, please go to your Trips tab and select the specific booking. You can view details, modify, or cancel from there. If you need further assistance, please describe your issue and I'll connect you with a human agent.",
  'refund': "Refund requests are processed according to each provider's cancellation policy. To request a refund, go to your booking details and tap 'Request Refund'. Processing typically takes 5-10 business days.",
  'account': "For account-related issues, you can manage most settings in the Account tab. If you're having trouble accessing your account, try resetting your password or contact us with your registered email.",
  'password': "To reset your password, go to the login screen and tap 'Forgot Password'. We'll send you a reset link to your registered email address.",
  'delete': "To delete your account, go to Settings > Account > Delete Account. Please note this action is permanent and cannot be undone.",
  'default': "Thank you for your message. Our support team typically responds within 24 hours. For urgent issues, you can also email us at support@guidera.app",
};

export default function ContactSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action.route) {
      router.push(action.route as any);
    } else if (action.action === 'feedback') {
      handleSendFeedback();
    }
  };

  const handleSendFeedback = () => {
    Alert.prompt(
      'Send Feedback',
      'Share your thoughts on how we can improve Guidera:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (feedback: string | undefined) => {
            if (feedback?.trim()) {
              try {
                await supabase.from('support_messages').insert({
                  user_id: user?.id,
                  type: 'feedback',
                  message: feedback,
                  status: 'pending',
                });
                Alert.alert('Thank You!', 'Your feedback has been submitted. We appreciate your input!');
              } catch (error) {
                console.error('Error sending feedback:', error);
                Alert.alert('Error', 'Failed to send feedback. Please try again.');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleEmailSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const email = 'support@guidera.app';
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent(`
Hi Guidera Support,

[Please describe your issue here]

---
User ID: ${user?.id || 'Not logged in'}
App Version: 1.0.0
Device: ${Platform.OS} ${Platform.Version}
    `);
    
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const getAutoResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, response] of Object.entries(AUTO_RESPONSES)) {
      if (keyword !== 'default' && lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    return AUTO_RESPONSES.default;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    setIsTyping(true);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Save message to database
    try {
      await supabase.from('support_messages').insert({
        user_id: user?.id,
        type: 'chat',
        message: userMessage.text,
        status: 'pending',
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
    
    // Simulate typing delay and auto-response
    setTimeout(() => {
      const response = getAutoResponse(userMessage.text);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      setIsSending(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionCard}
                    onPress={() => handleQuickAction(action)}
                    activeOpacity={0.7}
                  >
                    <Icon size={20} color={colors.primary} variant="Bold" />
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Contact Options */}
          <View style={styles.contactOptionsSection}>
            <TouchableOpacity
              style={styles.contactOption}
              onPress={handleEmailSupport}
              activeOpacity={0.7}
            >
              <View style={styles.contactOptionIcon}>
                <Sms size={20} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.contactOptionContent}>
                <Text style={styles.contactOptionTitle}>Email Support</Text>
                <Text style={styles.contactOptionSubtitle}>support@guidera.app</Text>
              </View>
              <ArrowLeft size={16} color={colors.gray400} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Response Time Notice */}
          <View style={styles.responseTimeCard}>
            <Clock size={16} color={colors.info} variant="Bold" />
            <Text style={styles.responseTimeText}>
              Average response time: 2-4 hours during business hours
            </Text>
          </View>

          {/* Chat Messages */}
          <View style={styles.messagesSection}>
            <Text style={styles.chatSectionTitle}>Live Chat</Text>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.botMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.botMessageText,
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.isUser ? styles.userMessageTime : styles.botMessageTime,
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageBubble, styles.botMessage, styles.typingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.gray400}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send2 size={20} color={colors.white} variant="Bold" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  onlineText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  contactOptionsSection: {
    marginBottom: spacing.md,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  contactOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactOptionContent: {
    flex: 1,
  },
  contactOptionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  contactOptionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  responseTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  responseTimeText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  messagesSection: {
    marginBottom: spacing.md,
  },
  chatSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  messageText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.white,
  },
  botMessageText: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  userMessageTime: {
    color: colors.white + '80',
    textAlign: 'right',
  },
  botMessageTime: {
    color: colors.textSecondary,
  },
  typingBubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray400,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginRight: spacing.sm,
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
});
