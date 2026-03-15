/**
 * ALL GROUPS SCREEN
 *
 * Shows all community groups in a 2-column grid with search and filter chips.
 * Accessible from Discover "See All" on Trending Groups.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  SearchNormal1,
  People,
  Verify,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/services/community/group.service';
import { CommunityPreview } from '../types/community.types';
import JoinButton from '../components/JoinButton';

type FilterType = 'all' | 'destination' | 'interest' | 'trip' | 'local';

const FILTER_CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'destination', label: 'Destinations' },
  { id: 'interest', label: 'Interests' },
  { id: 'trip', label: 'Trip Groups' },
  { id: 'local', label: 'Local' },
];

/** Map a Group from service to CommunityPreview for the grid */
function mapGroupToPreview(g: any, myGroupIds: Set<string>): CommunityPreview {
  return {
    id: g.id,
    name: g.name,
    avatar: g.groupPhotoUrl || g.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: g.coverPhotoUrl || g.groupPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
    memberCount: g.memberCount || 0,
    isVerified: g.isVerified || false,
    type: (g.category as any) || 'interest',
    privacy: g.privacy || 'public',
    tags: g.tags || [],
    description: g.description,
    isMember: myGroupIds.has(g.id),
  };
}

export default function AllGroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const userId = profile?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [groups, setGroups] = useState<CommunityPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch user's joined groups for isMember flag
  useEffect(() => {
    if (!userId) return;
    groupService.getUserGroups(userId)
      .then(data => setMyGroupIds(new Set(data.map(d => d.group.id))))
      .catch(() => {});
  }, [userId]);

  // Fetch groups based on filter + search (debounced)
  const fetchGroups = useCallback(async (filter: FilterType, search: string) => {
    setLoading(true);
    try {
      const category = filter === 'all' ? undefined : filter;
      const result = await groupService.discoverGroups({
        category: category as any,
        search: search.trim() || undefined,
        limit: 30,
      });
      setGroups(result.map(g => mapGroupToPreview(g, myGroupIds)));
    } catch (err) {
      console.warn('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  }, [myGroupIds]);

  // Initial fetch + re-fetch on filter change
  useEffect(() => {
    fetchGroups(activeFilter, searchQuery);
  }, [activeFilter, fetchGroups]);

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchGroups(activeFilter, text);
    }, 400);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleGroupPress = (groupId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/${groupId}` as any);
  };

  const renderGroupCard = ({ item }: { item: CommunityPreview }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={() => handleGroupPress(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.coverImage }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardName, { color: tc.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isVerified && <Verify size={14} color={tc.primary} variant="Bold" />}
        </View>
        <View style={styles.cardMeta}>
          <People size={12} color={tc.textSecondary} />
          <Text style={[styles.cardMembers, { color: tc.textSecondary }]}>
            {item.memberCount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.cardTags}>
          {item.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[styles.cardTag, { backgroundColor: tc.primary + '12' }]}>
              <Text style={[styles.cardTagText, { color: tc.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>
        {!item.isMember ? (
          <JoinButton
            communityId={item.id}
            privacy={item.privacy}
            initialStatus="none"
            variant="small"
          />
        ) : (
          <View style={[styles.joinedBadge, { backgroundColor: tc.primary + '15' }]}>
            <Text style={[styles.joinedText, { color: tc.primary }]}>Joined</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>All Groups</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: tc.background }]}>
        <View style={[styles.searchBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <SearchNormal1 size={18} color={tc.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search by name, country, interest..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                activeFilter === filter.id && { backgroundColor: tc.primary, borderColor: tc.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(filter.id);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: tc.textSecondary },
                  activeFilter === filter.id && { color: '#FFFFFF' },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: tc.textSecondary }]}>
          {loading ? 'Searching...' : `${groups.length} group${groups.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Groups Grid */}
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderGroupCard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <People size={48} color={tc.textTertiary} />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No groups found</Text>
            <Text style={[styles.emptySubtitle, { color: tc.textSecondary }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filtersContainer: {
    marginTop: spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsText: {
    fontSize: 13,
  },
  gridContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  groupCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 100,
  },
  cardContent: {
    padding: spacing.sm,
    gap: 4,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMembers: {
    fontSize: 12,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  cardTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  joinedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
  joinedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
