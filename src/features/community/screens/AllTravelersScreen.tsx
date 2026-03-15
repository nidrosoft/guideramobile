/**
 * ALL TRAVELERS SCREEN
 *
 * Shows all recommended travelers in a 2-column grid with search and filters.
 * Accessible from Discover "See All" on Travelers You Might Like.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Star1,
  Verify,
  Global,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { buddyService } from '@/services/community/buddy.service';

type FilterType = 'all' | 'high_match' | 'nearby' | 'verified' | 'online';

interface TravelerItem {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  matchScore: number;
  travelStyles: string[];
  countriesVisited: number;
  rating: number;
  isVerified: boolean;
  isOnline: boolean;
}

const FILTER_CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high_match', label: 'Best Match' },
  { id: 'verified', label: 'Verified' },
  { id: 'online', label: 'Online' },
];

/** Map BuddySuggestion to TravelerItem */
function mapSuggestionToTraveler(s: any): TravelerItem {
  return {
    id: s.user.id,
    firstName: s.user.firstName || '',
    lastName: s.user.lastName || '',
    avatar: s.user.avatarUrl || 'https://i.pravatar.cc/150?img=1',
    bio: s.user.bio || '',
    matchScore: s.matchScore || 0,
    travelStyles: s.user.travelStyles || [],
    countriesVisited: s.user.countryCount || 0,
    rating: s.user.averageRating || 0,
    isVerified: s.user.isVerified || false,
    isOnline: false,
  };
}

export default function AllTravelersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const userId = profile?.id;

  const [allTravelers, setAllTravelers] = useState<TravelerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch buddy suggestions
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    buddyService.getSuggestions(userId, 30)
      .then(suggestions => setAllTravelers(suggestions.map(mapSuggestionToTraveler)))
      .catch(err => console.warn('Failed to fetch travelers:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  const filteredTravelers = useMemo(() => {
    let travelers = allTravelers;

    switch (activeFilter) {
      case 'high_match':
        travelers = [...travelers].sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'verified':
        travelers = travelers.filter(t => t.isVerified);
        break;
      case 'online':
        travelers = travelers.filter(t => t.isOnline);
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      travelers = travelers.filter(
        t =>
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
          t.bio.toLowerCase().includes(q) ||
          t.travelStyles.some(s => s.toLowerCase().includes(q))
      );
    }

    return travelers;
  }, [allTravelers, activeFilter, searchQuery]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTravelerPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/buddy/${userId}` as any);
  };

  const renderTravelerCard = ({ item }: { item: TravelerItem }) => (
    <TouchableOpacity
      style={[styles.travelerCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
      onPress={() => handleTravelerPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isOnline && <View style={[styles.onlineDot, { borderColor: tc.bgElevated }]} />}
      </View>
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{item.matchScore}%</Text>
      </View>
      <Text style={[styles.travelerName, { color: tc.textPrimary }]} numberOfLines={1}>
        {item.firstName} {item.lastName.charAt(0)}.
      </Text>
      {item.isVerified && (
        <View style={styles.verifiedRow}>
          <Verify size={12} color={tc.primary} variant="Bold" />
          <Text style={[styles.verifiedLabel, { color: tc.primary }]}>Verified</Text>
        </View>
      )}
      <Text style={[styles.bio, { color: tc.textSecondary }]} numberOfLines={2}>
        {item.bio}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Global size={12} color={tc.textTertiary} />
          <Text style={[styles.statText, { color: tc.textTertiary }]}>{item.countriesVisited}</Text>
        </View>
        <View style={styles.statItem}>
          <Star1 size={12} color="#FFBD2E" variant="Bold" />
          <Text style={[styles.statText, { color: tc.textTertiary }]}>{item.rating}</Text>
        </View>
      </View>
      <View style={styles.stylesRow}>
        {item.travelStyles.slice(0, 2).map(style => (
          <View key={style} style={[styles.styleBadge, { backgroundColor: tc.primary + '12' }]}>
            <Text style={[styles.styleText, { color: tc.primary }]}>{style}</Text>
          </View>
        ))}
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
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Travelers</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: tc.background }]}>
        <View style={[styles.searchBar, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <SearchNormal1 size={18} color={tc.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search travelers..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
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

      {/* Results */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: tc.textSecondary }]}>
          {filteredTravelers.length} traveler{filteredTravelers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Travelers Grid */}
      <FlatList
        data={filteredTravelers}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderTravelerCard}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No travelers found</Text>
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
  travelerCard: {
    flex: 1,
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#3FC39E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  travelerName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  bio: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
  },
  stylesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  styleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
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
