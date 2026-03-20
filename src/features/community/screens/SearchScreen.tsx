/**
 * COMMUNITY SEARCH SCREEN
 * 
 * Dedicated search with filters for groups, buddies, and events.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft2,
  SearchNormal1,
  Filter,
  CloseCircle,
  People,
  Calendar,
  Location,
  Verify,
  Lock,
  Star1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { groupService, eventService } from '@/services/community';

type SearchTab = 'all' | 'groups' | 'buddies' | 'events';
type SortOption = 'relevance' | 'popular' | 'recent' | 'nearby';

interface FilterState {
  privacy: 'all' | 'public' | 'private';
  memberCount: 'all' | 'small' | 'medium' | 'large';
  destination: string;
  tags: string[];
}

const POPULAR_TAGS = ['adventure', 'foodie', 'photography', 'budget', 'luxury', 'solo', 'backpacking', 'beach', 'mountains', 'city'];

const SUGGESTED_SEARCHES = ['Tokyo groups', 'travel buddies NYC', 'hiking events'];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    privacy: 'all',
    memberCount: 'all',
    destination: '',
    tags: [],
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const filterHeight = useRef(new Animated.Value(0)).current;
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const toggleFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showFilters ? 0 : 280;
    Animated.spring(filterHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setShowFilters(!showFilters);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };
  
  const handleRecentSearch = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(query);
  };
  
  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : prev.tags.length < 5 ? [...prev.tags, tag] : prev.tags,
    }));
  };
  
  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({
      privacy: 'all',
      memberCount: 'all',
      destination: '',
      tags: [],
    });
  };
  
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let results: any[] = [];

      if (activeTab === 'all' || activeTab === 'groups') {
        try {
          const groups = await groupService.discoverGroups({
            search: query,
            limit: 10,
          });
          results.push(...groups.map(g => ({
            id: g.id,
            type: 'group',
            name: g.name,
            avatar: g.groupPhotoUrl || g.coverPhotoUrl || '',
            memberCount: g.memberCount || 0,
            isVerified: g.isVerified || false,
            privacy: g.privacy || 'public',
            destination: g.destinationName || null,
          })));
        } catch {}
      }

      if (activeTab === 'all' || activeTab === 'buddies') {
        try {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, city, nationality')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,city.ilike.%${query}%`)
            .limit(10);

          if (users) {
            results.push(...users.map(u => ({
              id: u.id,
              type: 'buddy',
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              avatar: u.avatar_url || '',
              location: u.city || u.nationality || '',
              rating: 0,
              trips: 0,
              isOnline: false,
            })));
          }
        } catch {}
      }

      if (activeTab === 'all' || activeTab === 'events') {
        try {
          const { data: events } = await supabase
            .from('community_events')
            .select('id, title, start_date, location_name, attendee_count, cover_image_url')
            .or(`title.ilike.%${query}%,location_name.ilike.%${query}%`)
            .eq('status', 'upcoming')
            .limit(10);

          if (events) {
            results.push(...events.map(e => ({
              id: e.id,
              type: 'event',
              title: e.title,
              date: e.start_date ? new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
              location: e.location_name || '',
              attendees: e.attendee_count || 0,
              image: e.cover_image_url || '',
            })));
          }
        } catch {}
      }

      if (filters.privacy !== 'all') {
        results = results.filter(r => r.type !== 'group' || r.privacy === filters.privacy);
      }

      setSearchResults(results);
    } catch (err) {
      if (__DEV__) console.warn('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [activeTab, filters.privacy]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  }, [performSearch]);

  const results = searchResults;
  const activeFiltersCount = [
    filters.privacy !== 'all',
    filters.memberCount !== 'all',
    filters.destination.length > 0,
    filters.tags.length > 0,
  ].filter(Boolean).length;
  
  const renderResult = (item: any) => {
    if (item.type === 'group') {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.resultCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/community/${item.id}` as any);
          }}
        >
          <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultName, { color: tc.textPrimary }]} numberOfLines={1}>{item.name}</Text>
              {item.isVerified && <Verify size={14} color={tc.primary} variant="Bold" />}
              {item.privacy === 'private' && <Lock size={12} color={tc.textTertiary} />}
            </View>
            {item.destination && (
              <View style={styles.resultLocation}>
                <Location size={12} color={tc.textTertiary} />
                <Text style={[styles.resultLocationText, { color: tc.textSecondary }]}>{item.destination}</Text>
              </View>
            )}
            <View style={styles.resultFooter}>
              <People size={14} color={tc.textSecondary} />
              <Text style={[styles.resultMeta, { color: tc.textSecondary }]}>{item.memberCount.toLocaleString()} members</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, { backgroundColor: tc.primary + '15' }]}>
            <Text style={[styles.resultBadgeText, { color: tc.primary }]}>Group</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    if (item.type === 'buddy') {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.resultCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/community/buddy/${item.id}` as any);
          }}
        >
          <View style={styles.buddyAvatarContainer}>
            <Image source={{ uri: item.avatar }} style={styles.resultAvatar} />
            {item.isOnline && <View style={[styles.onlineIndicator, { borderColor: tc.bgElevated }]} />}
          </View>
          <View style={styles.resultContent}>
            <Text style={[styles.resultName, { color: tc.textPrimary }]}>{item.name}</Text>
            <View style={styles.resultLocation}>
              <Location size={12} color={tc.textTertiary} />
              <Text style={[styles.resultLocationText, { color: tc.textSecondary }]}>{item.location}</Text>
            </View>
            <View style={styles.resultFooter}>
              <Star1 size={14} color={colors.warning} variant="Bold" />
              <Text style={[styles.resultMeta, { color: tc.textSecondary }]}>{item.rating} · {item.trips} trips</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.resultBadgeText, { color: colors.success }]}>Buddy</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    if (item.type === 'event') {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.resultCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/community/event/${item.id}` as any);
          }}
        >
          <Image source={{ uri: item.image }} style={styles.resultAvatar} />
          <View style={styles.resultContent}>
            <Text style={[styles.resultName, { color: tc.textPrimary }]}>{item.title}</Text>
            <View style={styles.resultLocation}>
              <Calendar size={12} color={tc.textTertiary} />
              <Text style={[styles.resultLocationText, { color: tc.textSecondary }]}>{item.date}</Text>
            </View>
            <View style={styles.resultFooter}>
              <Location size={14} color={tc.textSecondary} />
              <Text style={[styles.resultMeta, { color: tc.textSecondary }]}>{item.location} · {item.attendees} going</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, { backgroundColor: colors.warning + '15' }]}>
            <Text style={[styles.resultBadgeText, { color: colors.warning }]}>Event</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    return null;
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tc.bgElevated }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: tc.bgCard }]}>
          <SearchNormal1 size={20} color={tc.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search groups, buddies, events..."
            placeholderTextColor={tc.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <CloseCircle size={20} color={tc.textTertiary} variant="Bold" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: tc.primary + '15' }, showFilters && styles.filterButtonActive]}
          onPress={toggleFilters}
        >
          <Filter size={20} color={showFilters ? colors.white : tc.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        {[
          { id: 'all' as SearchTab, label: 'All' },
          { id: 'groups' as SearchTab, label: 'Groups' },
          { id: 'buddies' as SearchTab, label: 'Buddies' },
          { id: 'events' as SearchTab, label: 'Events' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
          >
            <Text style={[styles.tabText, { color: tc.textSecondary }, activeTab === tab.id && { color: tc.primary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Filters Panel */}
      <Animated.View style={[styles.filtersPanel, { height: filterHeight, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Privacy Filter */}
          <Text style={[styles.filterLabel, { color: tc.textPrimary }]}>Privacy</Text>
          <View style={styles.filterOptions}>
            {['all', 'public', 'private'].map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.filterOption, { backgroundColor: tc.bgCard }, filters.privacy === option && styles.filterOptionActive]}
                onPress={() => setFilters(prev => ({ ...prev, privacy: option as any }))}
              >
                <Text style={[styles.filterOptionText, { color: tc.textSecondary }, filters.privacy === option && styles.filterOptionTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Group Size Filter */}
          <Text style={[styles.filterLabel, { color: tc.textPrimary }]}>Group Size</Text>
          <View style={styles.filterOptions}>
            {[
              { id: 'all', label: 'Any' },
              { id: 'small', label: '<100' },
              { id: 'medium', label: '100-500' },
              { id: 'large', label: '500+' },
            ].map(option => (
              <TouchableOpacity
                key={option.id}
                style={[styles.filterOption, { backgroundColor: tc.bgCard }, filters.memberCount === option.id && styles.filterOptionActive]}
                onPress={() => setFilters(prev => ({ ...prev, memberCount: option.id as any }))}
              >
                <Text style={[styles.filterOptionText, { color: tc.textSecondary }, filters.memberCount === option.id && styles.filterOptionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Tags */}
          <Text style={[styles.filterLabel, { color: tc.textPrimary }]}>Tags</Text>
          <View style={styles.tagsContainer}>
            {POPULAR_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, { backgroundColor: tc.bgCard }, filters.tags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, { color: tc.textSecondary }, filters.tags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {searchQuery.length === 0 ? (
          <>
            {/* Suggested Searches */}
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Suggested Searches</Text>
            {SUGGESTED_SEARCHES.map((query, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => handleRecentSearch(query)}
              >
                <SearchNormal1 size={18} color={tc.textTertiary} />
                <Text style={[styles.recentText, { color: tc.textSecondary }]}>{query}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Popular Tags */}
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl, color: tc.textPrimary }]}>Popular Tags</Text>
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.slice(0, 6).map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.popularTag, { backgroundColor: tc.primary + '15' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearchQuery(tag);
                  }}
                >
                  <Text style={[styles.popularTagText, { color: tc.primary }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <SearchNormal1 size={48} color={tc.textTertiary} />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>Try different keywords or filters</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.resultsCount, { color: tc.textSecondary }]}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.map(renderResult)}
          </>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  filtersPanel: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderSubtle,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  filterOptionTextActive: {
    color: colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderSubtle,
  },
  tagActive: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tagTextActive: {
    color: colors.white,
  },
  clearFilters: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  clearFiltersText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  recentText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  popularTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  popularTagText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  resultsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  resultAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
  },
  buddyAvatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  resultContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  resultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  resultLocationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  resultMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  resultBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
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
