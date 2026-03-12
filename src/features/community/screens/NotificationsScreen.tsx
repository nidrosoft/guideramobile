/**
 * COMMUNITY NOTIFICATIONS SCREEN
 * 
 * Shows all group-related notifications:
 * - New messages, join requests, approvals, new members, events
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Message,
  People,
  TickCircle,
  CloseCircle,
  Calendar,
  Notification,
  Setting2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';

type NotificationType = 'message' | 'join_request' | 'approved' | 'denied' | 'new_member' | 'event';

interface CommunityNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  groupName: string;
  groupAvatar: string;
  groupId: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  isRead: boolean;
  createdAt: Date;
  actionRequired?: boolean;
}

function mapNotificationTypeCode(typeCode: string): NotificationType {
  if (typeCode.includes('message') || typeCode.includes('chat')) return 'message';
  if (typeCode.includes('join_request') || typeCode.includes('request')) return 'join_request';
  if (typeCode.includes('approved') || typeCode.includes('accept')) return 'approved';
  if (typeCode.includes('denied') || typeCode.includes('reject')) return 'denied';
  if (typeCode.includes('member') || typeCode.includes('joined')) return 'new_member';
  if (typeCode.includes('event') || typeCode.includes('reminder')) return 'event';
  return 'message';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications: rawNotifications,
    isLoading,
    markAsRead,
    markAllAsRead: hookMarkAllAsRead,
    refresh,
  } = useNotifications({ category: 'social' });

  const notifications: CommunityNotification[] = rawNotifications.map(n => ({
    id: n.id,
    type: mapNotificationTypeCode(n.typeCode),
    title: n.title,
    message: n.body,
    groupName: (n.data?.groupName as string) || '',
    groupAvatar: (n.data?.groupAvatar as string) || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    groupId: (n.data?.groupId as string) || '',
    userId: (n.data?.userId as string) || undefined,
    userName: (n.data?.userName as string) || undefined,
    userAvatar: (n.data?.userAvatar as string) || undefined,
    isRead: n.isRead,
    createdAt: new Date(n.createdAt),
    actionRequired: n.typeCode.includes('join_request') && !n.isRead,
  }));
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleNotificationPress = (notification: CommunityNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    markAsRead(notification.id);
    
    if (notification.type === 'message') {
      router.push(`/community/${notification.groupId}` as any);
    } else if (notification.type === 'event') {
      router.push(`/community/${notification.groupId}` as any);
    } else {
      router.push(`/community/${notification.groupId}` as any);
    }
  };
  
  const handleApprove = (notification: CommunityNotification) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAsRead(notification.id);
  };
  
  const handleDeny = (notification: CommunityNotification) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    markAsRead(notification.id);
  };
  
  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hookMarkAllAsRead();
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message': return { icon: Message, color: colors.primary };
      case 'join_request': return { icon: People, color: colors.warning };
      case 'approved': return { icon: TickCircle, color: colors.success };
      case 'denied': return { icon: CloseCircle, color: colors.error };
      case 'new_member': return { icon: People, color: colors.info };
      case 'event': return { icon: Calendar, color: colors.primary };
      default: return { icon: Notification, color: colors.textTertiary };
    }
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: tc.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  const renderNotification = (notification: CommunityNotification) => {
    const { icon: Icon, color } = getNotificationIcon(notification.type);
    const isJoinRequest = notification.type === 'join_request' && notification.actionRequired;
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }, !notification.isRead && { backgroundColor: tc.primary + '05', borderLeftWidth: 3, borderLeftColor: tc.primary }]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        {/* Left Icon */}
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Icon size={20} color={color} variant="Bold" />
        </View>
        
        {/* Content */}
        <View style={styles.notificationContent}>
          {/* User info for join requests */}
          {isJoinRequest && notification.userAvatar && (
            <View style={styles.userRow}>
              <Image source={{ uri: notification.userAvatar }} style={styles.userAvatar} />
              <Text style={[styles.userName, { color: tc.textPrimary }]}>{notification.userName}</Text>
            </View>
          )}
          
          {/* Main content */}
          <Text style={[styles.notificationTitle, { color: tc.textPrimary }]}>
            {isJoinRequest ? notification.message : notification.title}
          </Text>
          
          {!isJoinRequest && (
            <Text style={[styles.notificationMessage, { color: tc.textSecondary }]} numberOfLines={2}>
              {notification.message}
            </Text>
          )}
          
          {/* Group info */}
          <View style={styles.groupRow}>
            <Image source={{ uri: notification.groupAvatar }} style={styles.groupAvatar} />
            <Text style={[styles.groupName, { color: tc.textSecondary }]}>{notification.groupName}</Text>
            <Text style={[styles.timeText, { color: tc.textTertiary }]}>{formatTime(notification.createdAt)}</Text>
          </View>
          
          {/* Action buttons for join requests */}
          {isJoinRequest && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => handleDeny(notification)}
              >
                <CloseCircle size={18} color={colors.error} />
                <Text style={styles.denyButtonText}>Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: tc.primary }]}
                onPress={() => handleApprove(notification)}
              >
                <TickCircle size={18} color="#FFFFFF" variant="Bold" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Unread dot */}
        {!notification.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Notifications</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Setting2 size={22} color={tc.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Unread count & Mark all read */}
      {unreadCount > 0 && (
        <View style={[styles.unreadBar, { backgroundColor: tc.primary + '10' }]}>
          <Text style={[styles.unreadText, { color: tc.primary }]}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markReadText, { color: tc.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tc.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Notification size={64} color={tc.textTertiary} variant="Bold" />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
              You'll see group activity here
            </Text>
          </View>
        ) : (
          notifications.map(renderNotification)
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
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
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
  },
  unreadText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  markReadText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  notificationUnread: {
    backgroundColor: colors.primary + '05',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  userName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  notificationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  groupAvatar: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  groupName: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  denyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '10',
    gap: spacing.xs,
  },
  denyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.success,
    gap: spacing.xs,
  },
  approveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
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
});
