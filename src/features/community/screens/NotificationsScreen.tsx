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
  // For join requests that need action
  actionRequired?: boolean;
}

// Mock notifications data
const MOCK_NOTIFICATIONS: CommunityNotification[] = [
  {
    id: 'notif-1',
    type: 'join_request',
    title: 'Join Request',
    message: 'wants to join your group',
    groupName: 'Tokyo Travelers 2025',
    groupAvatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    groupId: 'comm-1',
    userId: 'user-20',
    userName: 'Sarah Chen',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    actionRequired: true,
  },
  {
    id: 'notif-2',
    type: 'message',
    title: 'New Messages',
    message: '3 new messages in the group',
    groupName: 'Solo Female Travelers',
    groupAvatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    groupId: 'comm-3',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
  {
    id: 'notif-3',
    type: 'approved',
    title: 'Request Approved',
    message: 'Your request to join has been approved',
    groupName: 'Bali Digital Nomads',
    groupAvatar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200',
    groupId: 'comm-2',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: 'notif-4',
    type: 'join_request',
    title: 'Join Request',
    message: 'wants to join your group',
    groupName: 'Tokyo Travelers 2025',
    groupAvatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    groupId: 'comm-1',
    userId: 'user-21',
    userName: 'Mike Johnson',
    userAvatar: 'https://i.pravatar.cc/150?img=8',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    actionRequired: true,
  },
  {
    id: 'notif-5',
    type: 'new_member',
    title: 'New Member',
    message: 'joined the group',
    groupName: 'NYC Foodies',
    groupAvatar: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200',
    groupId: 'comm-6',
    userId: 'user-22',
    userName: 'Emma Wilson',
    userAvatar: 'https://i.pravatar.cc/150?img=9',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
  {
    id: 'notif-6',
    type: 'event',
    title: 'Event Reminder',
    message: 'Tokyo Meetup starts in 2 days',
    groupName: 'Tokyo Travelers 2025',
    groupAvatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    groupId: 'comm-1',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 'notif-7',
    type: 'denied',
    title: 'Request Denied',
    message: 'Your request to join was declined',
    groupName: 'Exclusive Travel Club',
    groupAvatar: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200',
    groupId: 'comm-99',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleNotificationPress = (notification: CommunityNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    // Navigate based on type
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
    
    // Remove from list and show success
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // In real app, call API to approve
  };
  
  const handleDeny = (notification: CommunityNotification) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Remove from list
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // In real app, call API to deny
  };
  
  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
      default: return { icon: Notification, color: colors.gray500 };
    }
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const renderNotification = (notification: CommunityNotification) => {
    const { icon: Icon, color } = getNotificationIcon(notification.type);
    const isJoinRequest = notification.type === 'join_request' && notification.actionRequired;
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
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
              <Text style={styles.userName}>{notification.userName}</Text>
            </View>
          )}
          
          {/* Main content */}
          <Text style={styles.notificationTitle}>
            {isJoinRequest ? notification.message : notification.title}
          </Text>
          
          {!isJoinRequest && (
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
          )}
          
          {/* Group info */}
          <View style={styles.groupRow}>
            <Image source={{ uri: notification.groupAvatar }} style={styles.groupAvatar} />
            <Text style={styles.groupName}>{notification.groupName}</Text>
            <Text style={styles.timeText}>{formatTime(notification.createdAt)}</Text>
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
                style={styles.approveButton}
                onPress={() => handleApprove(notification)}
              >
                <TickCircle size={18} color={colors.white} variant="Bold" />
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Setting2 size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Unread count & Mark all read */}
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
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
            tintColor={colors.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Notification size={64} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
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
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    position: 'relative',
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
