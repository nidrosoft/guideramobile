/**
 * PULSE ACTIVITY LIST
 *
 * Bottom sheet with search, filter tabs (Popular/All/categories with counts),
 * and scrollable activity cards with creator avatar, timing, and going count.
 *
 * Part of the Connect feature (formerly Community).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { Clock, SearchNormal1, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import type { Activity } from '@/services/community/types/community.types';
import { getActivityIcon, getTimingLabel, ACTIVITY_CATEGORIES } from './pulse.utils';

interface PulseActivityListProps {
  activities: Activity[];
  onActivityPress: (activity: Activity) => void;
}

const POPULAR_THRESHOLD = 3;

export default function PulseActivityList({ activities, onActivityPress }: PulseActivityListProps) {
  const { colors: tc } = useTheme();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Build filter tabs with counts
  const filterTabs = useMemo(() => {
    const popularCount = activities.filter(a => a.participantCount >= POPULAR_THRESHOLD).length;
    const tabs: { id: string; label: string; emoji?: string; count: number }[] = [
      { id: 'popular', label: 'Popular', emoji: String.fromCodePoint(0x1F525), count: popularCount },
      { id: 'all', label: 'All', count: activities.length },
    ];
    // Add category tabs that have activities
    const catCounts: Record<string, number> = {};
    activities.forEach(a => { catCounts[a.type] = (catCounts[a.type] || 0) + 1; });
    ACTIVITY_CATEGORIES.forEach(cat => {
      if (catCounts[cat.id]) {
        tabs.push({ id: cat.id, label: cat.label.split(' ')[0], emoji: cat.emoji, count: catCounts[cat.id] });
      }
    });
    return tabs;
  }, [activities]);

  // Filter activities
  const filtered = useMemo(() => {
    let list = activities;
    if (activeTab === 'popular') {
      list = list.filter(a => a.participantCount >= POPULAR_THRESHOLD);
    } else if (activeTab !== 'all') {
      list = list.filter(a => a.type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.locationName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activities, activeTab, search]);

  return (
    <View style={[styles.sheet, { backgroundColor: tc.background }]}>
      {/* Handle */}
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: tc.textPrimary }]}>
        {activities.length} {activities.length === 1 ? 'activity' : 'activities'} in this area
      </Text>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
        <SearchNormal1 size={16} color={tc.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search activities..."
          placeholderTextColor={tc.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {filterTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { borderColor: isActive ? tc.primary : tc.borderSubtle },
                isActive && { backgroundColor: tc.primary },
              ]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
            >
              {tab.emoji && <Text style={styles.tabEmoji}>{tab.emoji}</Text>}
              <Text style={[styles.tabLabel, { color: isActive ? '#FFF' : tc.textSecondary }]}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: tc.textSecondary }]}>
            No activities match. Tap + to create one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { borderBottomColor: tc.borderSubtle }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onActivityPress(item); }}
              activeOpacity={0.7}
            >
              {/* Creator avatar */}
              <Image
                source={{ uri: item.creator?.avatarUrl || `https://i.pravatar.cc/40?u=${item.createdBy}` }}
                style={styles.creatorAvatar}
              />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: tc.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.cardMeta}>
                  <Clock size={12} color={tc.textTertiary} />
                  <Text style={[styles.cardMetaText, { color: tc.textSecondary }]}>
                    {getTimingLabel(item)}
                  </Text>
                </View>
              </View>
              {/* Attendee avatars + going */}
              <View style={styles.cardRight}>
                <View style={styles.attendeeAvatars}>
                  {item.participants?.slice(0, 2).map((p, i) => (
                    <Image
                      key={p.id || String(i)}
                      source={{ uri: p.user?.avatarUrl || `https://i.pravatar.cc/24?u=${p.userId}` }}
                      style={[styles.attendeeAvatar, { marginLeft: i > 0 ? -6 : 0, borderColor: tc.background }]}
                    />
                  ))}
                </View>
                <Text style={[styles.goingText, { color: tc.textTertiary }]}>
                  {item.participantCount} Going
                </Text>
              </View>
              <ArrowRight2 size={16} color={tc.textTertiary} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '55%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  title: { fontSize: 17, fontWeight: '700', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  tabsScroll: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  tabEmoji: { fontSize: 13 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: 14, textAlign: 'center' },
  list: { paddingBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  creatorAvatar: { width: 40, height: 40, borderRadius: 20 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  attendeeAvatars: { flexDirection: 'row' },
  attendeeAvatar: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  goingText: { fontSize: 11, fontWeight: '500' },
});
