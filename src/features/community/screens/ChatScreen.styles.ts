/**
 * CHAT SCREEN STYLES
 */

import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '@/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  nameContainer: {
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    padding: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: spacing.md,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.sm,
  },
  typingBubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  attachmentButton: {
    alignItems: 'center',
    gap: 4,
  },
  attachmentLabel: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.xs,
    marginBottom: 4,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.xs,
  },
  emojiButton: {
    padding: spacing.xs,
    marginBottom: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
