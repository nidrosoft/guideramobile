/**
 * COMMUNITY NOTIFICATIONS SCREEN
 * 
 * Matches the homepage NotificationCenterScreen UI pattern:
 * Row-based layout, grouped by date, icon circle + content + unread dot.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft2,
  MessageText,
  People,
  TickCircle,
  CloseCircle,
  Calendar,
  Notification,
  Location,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({ category: 'social' });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNotificationPress = async (notif: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl as any);
    }
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllAsRead();
  };

  const getCategoryIcon = (typeCode: string) => {
    // Pulse activity-specific icons
    if (typeCode === 'activity_join')
      return <People size={20} color={tc.success} variant="Bold" />;
    if (typeCode === 'activity_leave')
      return <People size={20} color={tc.warning} variant="Bold" />;
    if (typeCode === 'activity_cancel')
      return <CloseCircle size={20} color={tc.error} variant="Bold" />;
    if (typeCode === 'activity_comment')
      return <MessageText size={20} color={tc.primary} variant="Bold" />;
    if (typeCode === 'activity_update')
      return <Calendar size={20} color={tc.info} variant="Bold" />;
    if (typeCode === 'activity_milestone')
      return <Notification size={20} color={tc.success} variant="Bold" />;
    // Generic icon matching
    if (typeCode.includes('message') || typeCode.includes('chat'))
      return <MessageText size={20} color={tc.primary} variant="Bold" />;
    if (typeCode.includes('join_request') || typeCode.includes('request'))
      return <People size={20} color={tc.warning} variant="Bold" />;
    if (typeCode.includes('approved') || typeCode.includes('accept'))
      return <TickCircle size={20} color={tc.success} variant="Bold" />;
    if (typeCode.includes('denied') || typeCode.includes('reject'))
      return <CloseCircle size={20} color={tc.error} variant="Bold" />;
    if (typeCode.includes('member') || typeCode.includes('joined'))
      return <People size={20} color={tc.info} variant="Bold" />;
    if (typeCode.includes('event') || typeCode.includes('reminder'))
      return <Calendar size={20} color={tc.primary} variant="Bold" />;
    if (typeCode.includes('nearby') || typeCode.includes('location'))
      return <Location size={20} color={tc.success} variant="Bold" />;
    return <Notification size={20} color={tc.textTertiary} variant="Bold" />;
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupByDate = (notifs: AppNotification[]) => {
    const groups: { title: string; data: AppNotification[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const todayItems: AppNotification[] = [];
    const yesterdayItems: AppNotification[] = [];
    const olderItems: AppNotification[] = [];

    for (const n of notifs) {
      const d = new Date(n.createdAt).toDateString();
      if (d === todayStr) todayItems.push(n);
      else if (d === yesterdayStr) yesterdayItems.push(n);
      else olderItems.push(n);
    }

    if (todayItems.length > 0) groups.push({ title: 'Today', data: todayItems });
    if (yesterdayItems.length > 0) groups.push({ title: 'Yesterday', data: yesterdayItems });
    if (olderItems.length > 0) groups.push({ title: 'Earlier', data: olderItems });

    return groups;
  };

  const grouped = groupByDate(notifications);

  // Flatten grouped data for FlatList: interleave section headers with notification items
  type FlatItem = { type: 'header'; title: string } | { type: 'notif'; data: AppNotification };
  const flatData = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    for (const group of grouped) {
      items.push({ type: 'header', title: group.title });
      for (const notif of group.data) {
        items.push({ type: 'notif', data: notif });
      }
    }
    return items;
  }, [grouped]);

  return (
    <View style={[styles.screen, { backgroundColor: tc.bgPrimary, paddingTop: insets.top }]}>
      {/* Header — matches homepage notification center */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: tc.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tc.primary} />
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.title}` : `notif-${item.data.id}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={[styles.groupTitle, { color: tc.textTertiary }]}>{item.title}</Text>
              );
            }
            const notif = item.data;
            return (
              <TouchableOpacity
                style={[
                  styles.notifRow,
                  { backgroundColor: notif.isRead ? 'transparent' : `${tc.primary}05`, borderBottomColor: tc.borderSubtle },
                ]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.7}
              >
                <View style={[styles.notifIconCircle, { backgroundColor: `${tc.primary}10` }]}>
                  {getCategoryIcon(notif.typeCode)}
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: tc.textPrimary, fontWeight: notif.isRead ? '500' : '700' }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: tc.textSecondary }]} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={[styles.notifTime, { color: tc.textTertiary }]}>
                    {getTimeAgo(notif.createdAt)}
                  </Text>
                </View>
                {!notif.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: tc.primary }]} />
                )}
              </TouchableOpacity>
            );
          }}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Notification size={48} color={tc.textTertiary} variant="Linear" />
              <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No notifications</Text>
              <Text style={[styles.emptySubtitle, { color: tc.textTertiary }]}>
                You're all caught up! Activity from your network will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: insets.bottom + 20 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  markAllText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  group: { marginBottom: spacing.md },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, marginBottom: 2 },
  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
});
