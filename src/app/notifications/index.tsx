/**
 * NOTIFICATION CENTER SCREEN
 *
 * Shows all notifications grouped by date with category filters.
 * Supports mark as read, mark all as read, and deep link navigation.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft2,
  Airplane,
  ShieldTick,
  DollarCircle,
  People,
  Setting2,
  TickCircle,
  Notification,
  Warning2,
  Clock,
  MessageText,
  Location,
  Heart,
  More,
  Trash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { TripState } from '@/features/trips/types/trip.types';
import { useAuth } from '@/context/AuthContext';

type FilterCategory = 'all' | 'trip' | 'safety' | 'financial' | 'social' | 'system';

const FILTERS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trip', label: 'Trips' },
  { key: 'financial', label: 'Deals' },
  { key: 'social', label: 'Social' },
  { key: 'safety', label: 'Safety' },
  { key: 'system', label: 'System' },
];

export default function NotificationCenterScreen() {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [showMenu, setShowMenu] = useState(false);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, clearAll, refresh } =
    useNotifications({
      category: activeFilter === 'all' ? undefined : activeFilter,
      limit: 100,
    });

  const trips = useTripStore(state => state.trips);
  const fetchTrips = useTripStore(state => state.fetchTrips);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    if (profile?.id) await fetchTrips(profile.id);
    setRefreshing(false);
  }, [refresh, profile?.id, fetchTrips]);

  // Resolve the trip status for a trip-related notification
  const getTripStatus = (notif: AppNotification): 'ok' | 'cancelled' | 'missing' | null => {
    if (notif.category !== 'trip' || !notif.actionUrl) return null;
    const match = notif.actionUrl.match(/^\/trip\/([a-f0-9-]+)/);
    if (!match) return null;
    const trip = trips.find(t => t.id === match[1]);
    if (!trip) return 'missing';
    if (trip.state === TripState.CANCELLED) return 'cancelled';
    return 'ok';
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    if (!notif.actionUrl) return;

    // For trip-related URLs, verify the trip exists in the store
    const tripMatch = notif.actionUrl.match(/^\/trip\/([a-f0-9-]+)/);
    if (tripMatch) {
      const tripId = tripMatch[1];
      const trip = trips.find(t => t.id === tripId);

      if (!trip && profile?.id) {
        // Refresh trips from DB in case they haven't been loaded
        await fetchTrips(profile.id);
      }

      // Re-check after refresh
      const updatedTrip = useTripStore.getState().trips.find(t => t.id === tripId);
      if (updatedTrip?.state === TripState.CANCELLED) {
        Alert.alert(
          'Trip Cancelled',
          'This trip has been cancelled. You can still view its details.',
          [{ text: 'View Details', onPress: () => router.push(notif.actionUrl as any) }, { text: 'Dismiss', style: 'cancel' }],
        );
        return;
      }
    }

    router.push(notif.actionUrl as any);
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllAsRead();
  };

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMenu(false);
    Alert.alert(
      'Clear All Notifications',
      'This will permanently delete all your notifications. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ],
    );
  };

  const handleDeleteNotification = (notifId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteNotification(notifId);
  };

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
    notifId: string,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: tc.error }]}
        onPress={() => handleDeleteNotification(notifId)}
        activeOpacity={0.8}
      >
        <RNAnimated.View style={{ transform: [{ scale }] }}>
          <Trash size={22} color="#FFFFFF" variant="Bold" />
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = (category: string, typeCode: string) => {
    switch (category) {
      case 'trip':
        if (typeCode.includes('flight')) return <Airplane size={20} color={tc.primary} variant="Bold" />;
        if (typeCode.includes('hotel')) return <Location size={20} color={tc.info} variant="Bold" />;
        if (typeCode.includes('checkin')) return <Clock size={20} color={tc.warning} variant="Bold" />;
        return <Airplane size={20} color={tc.primary} variant="Bold" />;
      case 'safety':
        return <ShieldTick size={20} color={tc.error} variant="Bold" />;
      case 'financial':
        return <DollarCircle size={20} color={tc.success} variant="Bold" />;
      case 'social':
        if (typeCode.includes('message')) return <MessageText size={20} color={tc.info} variant="Bold" />;
        return <People size={20} color={tc.purple} variant="Bold" />;
      case 'system':
        return <Setting2 size={20} color={tc.textSecondary} variant="Bold" />;
      default:
        return <Notification size={20} color={tc.textTertiary} variant="Bold" />;
    }
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

  return (
    <View style={[styles.screen, { backgroundColor: tc.bgPrimary, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={{ marginRight: spacing.sm }}>
              <Text style={[styles.markAllText, { color: tc.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <More size={22} color={tc.textPrimary} variant="Linear" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown menu */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuDropdown, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle, right: spacing.lg, top: insets.top + 52 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearAll}>
              <Trash size={18} color={tc.error} variant="Linear" />
              <Text style={[styles.menuItemText, { color: tc.error }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Category Filters */}
      <View style={styles.filtersRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                { borderColor: isActive ? tc.primary : tc.borderSubtle, backgroundColor: isActive ? `${tc.primary}12` : 'transparent' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(f.key);
              }}
            >
              <Text style={[styles.filterText, { color: isActive ? tc.primary : tc.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tc.primary} />}
      >
        {isLoading && notifications.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tc.primary} />
          </View>
        )}

        {!isLoading && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Notification size={48} color={tc.textTertiary} variant="Linear" />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textTertiary }]}>
              You're all caught up! We'll notify you when something important happens.
            </Text>
          </View>
        )}

        {grouped.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: tc.textTertiary }]}>{group.title}</Text>
            {group.data.map((notif) => (
              <Swipeable
                key={notif.id}
                ref={(ref) => {
                  if (ref) swipeableRefs.current.set(notif.id, ref);
                  else swipeableRefs.current.delete(notif.id);
                }}
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, notif.id)}
                overshootRight={false}
                friction={2}
              >
                <TouchableOpacity
                  style={[
                    styles.notifRow,
                    { backgroundColor: notif.isRead ? tc.bgPrimary || 'transparent' : `${tc.primary}05`, borderBottomColor: tc.borderSubtle },
                  ]}
                  onPress={() => handleNotificationPress(notif)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notifIconCircle, { backgroundColor: `${tc.primary}10` }]}>
                    {getCategoryIcon(notif.category, notif.typeCode)}
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, { color: tc.textPrimary, fontWeight: notif.isRead ? '500' : '700' }]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text style={[styles.notifBody, { color: tc.textSecondary }]} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <View style={styles.notifMeta}>
                      <Text style={[styles.notifTime, { color: tc.textTertiary }]}>
                        {getTimeAgo(notif.createdAt)}
                      </Text>
                      {getTripStatus(notif) === 'cancelled' && (
                        <View style={[styles.cancelledTag, { backgroundColor: `${tc.error}15` }]}>
                          <Text style={[styles.cancelledTagText, { color: tc.error }]}>Cancelled</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {!notif.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: tc.primary }]} />
                  )}
                </TouchableOpacity>
              </Swipeable>
            ))}
          </View>
        ))}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  markAllText: { fontSize: 13, fontWeight: '600' },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  menuDropdown: {
    position: 'absolute',
    zIndex: 101,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
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
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTime: { fontSize: 11 },
  cancelledTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cancelledTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
});
