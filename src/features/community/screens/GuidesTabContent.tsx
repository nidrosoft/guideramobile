/**
 * GUIDES TAB CONTENT
 * 
 * Main discovery view for the "Guides" tab in CommunityHubScreen.
 * Shows:
 * - "Become a Guide" banner (for non-guides)
 * - Featured guides horizontal scroll
 * - Browse listings by category
 * - Top-rated listings
 * - Featured communities with guide presence
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  SearchNormal1,
  Filter,
  ArrowRight2,
  Home2,
  Map,
  Setting2,
  DocumentText,
} from 'iconsax-react-native';
import { colors } from '@/styles';
import {
  ListingCategory,
  LISTING_CATEGORIES,
  EXPERTISE_OPTIONS,
  ExpertiseArea,
} from '../types/guide.types';
import GuideCard from '../components/GuideCard';
import ListingCard from '../components/ListingCard';
import BecomeGuideCard from '../components/BecomeGuideCard';
import {
  MOCK_GUIDES,
  MOCK_LISTINGS,
  MOCK_GUIDE_COMMUNITIES,
} from '../data/guideMockData';

type FilterCategory = 'all' | ListingCategory;

export default function GuidesTabContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseArea | null>(null);

  const isGuide = false; // TODO: check from user profile

  const filteredGuides = useMemo(() => {
    let guides = MOCK_GUIDES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      guides = guides.filter(g =>
        g.displayName.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q) ||
        g.country.toLowerCase().includes(q) ||
        g.expertiseAreas.some(a => a.includes(q))
      );
    }
    if (selectedExpertise) {
      guides = guides.filter(g => g.expertiseAreas.includes(selectedExpertise));
    }
    return guides;
  }, [searchQuery, selectedExpertise]);

  const filteredListings = useMemo(() => {
    let listings = MOCK_LISTINGS;
    if (selectedCategory !== 'all') {
      listings = listings.filter(l => l.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.guideName.toLowerCase().includes(q)
      );
    }
    return listings;
  }, [searchQuery, selectedCategory]);

  const handleGuidePress = (guideId: string) => {
    router.push(`/community/guide/${guideId}`);
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/community/listing/${listingId}`);
  };

  const CATEGORY_FILTERS: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    ...LISTING_CATEGORIES.map(c => ({ id: c.id as FilterCategory, label: c.label })),
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchNormal1 size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides, tours, services..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Become a Guide Banner */}
      {!isGuide && (
        <View style={styles.sectionPadded}>
          <BecomeGuideCard onPress={() => router.push('/community/become-guide')} />
        </View>
      )}

      {/* Featured Guides */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Local Guides</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => {}}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight2 size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Expertise Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedExpertise && styles.filterChipActive]}
            onPress={() => setSelectedExpertise(null)}
          >
            <Text style={[styles.filterChipText, !selectedExpertise && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {EXPERTISE_OPTIONS.slice(0, 6).map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.filterChip, selectedExpertise === opt.id && styles.filterChipActive]}
              onPress={() => setSelectedExpertise(selectedExpertise === opt.id ? null : opt.id)}
            >
              <Text style={styles.filterEmoji}>{opt.emoji}</Text>
              <Text style={[styles.filterChipText, selectedExpertise === opt.id && styles.filterChipTextActive]}>
                {opt.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Guide Cards Horizontal */}
        <FlatList
          data={filteredGuides}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.guideList}
          renderItem={({ item }) => (
            <View style={styles.guideCardWrapper}>
              <GuideCard
                guide={item}
                variant="horizontal"
                onPress={() => handleGuidePress(item.id)}
                onMessage={() => handleGuidePress(item.id)}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No guides match your search</Text>
          }
        />
      </View>

      {/* Listings by Category */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Listings</Text>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {CATEGORY_FILTERS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listing Cards */}
        <View style={styles.sectionPadded}>
          {filteredListings.length === 0 ? (
            <Text style={styles.emptyText}>No listings in this category</Text>
          ) : (
            filteredListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPress={() => handleListingPress(listing.id)}
                onInquire={() => handleGuidePress(listing.guideId)}
              />
            ))
          )}
        </View>
      </View>

      {/* Featured Communities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Communities with Guides</Text>
          <TouchableOpacity style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All</Text>
            <ArrowRight2 size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionPadded}>
          {MOCK_GUIDE_COMMUNITIES.map(comm => (
            <TouchableOpacity key={comm.id} style={styles.communityRow}>
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{comm.name}</Text>
                <Text style={styles.communityMeta}>
                  {comm.memberCount.toLocaleString()} members · {comm.guideCount} guides · {comm.postsPerWeek}/wk posts
                </Text>
                <Text style={styles.communityDesc} numberOfLines={2}>{comm.description}</Text>
              </View>
              <View style={styles.communityTrust}>
                <Text style={styles.communityTrustValue}>{comm.trustRating}</Text>
                <Text style={styles.communityTrustLabel}>trust</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  section: {
    marginTop: 16,
  },
  sectionPadded: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  filterScroll: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterEmoji: {
    fontSize: 14,
  },

  guideList: {
    paddingHorizontal: 16,
  },
  guideCardWrapper: {
    marginRight: 0,
  },

  // Communities
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  communityInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  communityMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  communityDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  communityTrust: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 10,
    padding: 10,
    minWidth: 50,
  },
  communityTrustValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  communityTrustLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
