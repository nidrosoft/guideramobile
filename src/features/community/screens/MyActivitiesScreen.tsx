/**
 * MY ACTIVITIES SCREEN
 *
 * Shows the user's activity history:
 * - Activities they created (hosting)
 * - Activities they joined (going)
 * Tabs: Active | Past
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft2, Clock, Location, People, Add } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useUserActivities } from '@/hooks/useCommunity';
import type { Activity } from '@/services/community/types/community.types';
import { getActivityIcon, getTimingLabel } from '../components/pulse/pulse.utils';
import AvatarFallback from '../components/pulse/AvatarFallback';

type TabType = 'active' | 'past';

export default function MyActivitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const userId = profile?.id;

  const { activities, loading } = useUserActivities(userId);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const filtered = useMemo(() => {
    if (activeTab === 'active') {
      return activities.filter(a => a.status === 'open' || a.status === 'full');
    }
    return activities.filter(a => a.status === 'completed' || a.status === 'cancelled');
  }, [activities, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // useUserActivities auto-fetches on mount; trigger re-render
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const isOwner = item.createdBy === userId;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/community/activity/${item.id}` as any);
        }}
        activeOpacity={0.7}
      >
        {/* Cover image or emoji */}
        {item.coverImageUrl ? (
          <View style={styles.coverWrap}>
            <AvatarFallback uri={item.coverImageUrl} name={item.title} size={56} style={styles.coverImg} />
          </View>
        ) : (
          <View style={[styles.emojiWrap, { backgroundColor: tc.primary + '12' }]}>
            <Text style={styles.emoji}>{getActivityIcon(item.type)}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isOwner && (
              <View style={[styles.hostBadge, { backgroundColor: tc.primary + '15' }]}>
                <Text style={[styles.hostBadgeText, { color: tc.primary }]}>Host</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Clock size={12} color={tc.textTertiary} />
            <Text style={[styles.metaText, { color: tc.textSecondary }]}>{getTimingLabel(item)}</Text>
          </View>

          {item.locationName && (
            <View style={styles.metaRow}>
              <Location size={12} color={tc.textTertiary} variant="Bold" />
              <Text style={[styles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{item.locationName}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <People size={12} color={tc.textTertiary} />
            <Text style={[styles.metaText, { color: tc.textSecondary }]}>
              {item.participantCount} going
              {item.maxParticipants ? ` · ${item.maxParticipants - item.participantCount} spots left` : ''}
            </Text>
          </View>

          {/* Status badge for past items */}
          {(item.status === 'completed' || item.status === 'cancelled') && (
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'cancelled' ? tc.error + '12' : tc.success + '12' }]}>
              <Text style={[styles.statusText, { color: item.status === 'cancelled' ? tc.error : tc.success }]}>
                {item.status === 'cancelled' ? 'Cancelled' : 'Completed'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: tc.bgElevated }]} onPress={() => router.back()}>
          <ArrowLeft2 size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>My Activities</Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: tc.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/community/create-activity' as any); }}
        >
          <Add size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: tc.borderSubtle }]}>
        {(['active', 'past'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: tc.primary, borderBottomWidth: 2 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? tc.primary : tc.textTertiary }]}>
              {tab === 'active' ? 'Active' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderActivity}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tc.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyEmoji]}>
              {activeTab === 'active' ? String.fromCodePoint(0x1F30D) : String.fromCodePoint(0x1F4DA)}
            </Text>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>
              {activeTab === 'active' ? 'No active activities' : 'No past activities'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              {activeTab === 'active' ? 'Create one or join activities on the Pulse map!' : 'Your completed activities will appear here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: {
    flexDirection: 'row', padding: spacing.md, borderRadius: 20,
    borderWidth: 1, marginBottom: spacing.sm, gap: spacing.md,
  },
  emojiWrap: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  coverWrap: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden' },
  coverImg: { borderRadius: 16 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  hostBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  hostBadgeText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  metaText: { fontSize: 12, flexShrink: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: spacing.xl },
});
