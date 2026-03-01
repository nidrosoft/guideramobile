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
  Image,
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
  People,
  Star1,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  ListingCategory,
  LISTING_CATEGORIES,
  EXPERTISE_OPTIONS,
  ExpertiseArea,
} from '../types/guide.types';
import GuideCard from '../components/GuideCard';
import ListingCard from '../components/ListingCard';
import PartnerInviteCard from '../components/PartnerInviteCard';
import PartnerProgramSheet from '../components/PartnerProgramSheet';
import {
  MOCK_GUIDES,
  MOCK_LISTINGS,
  MOCK_GUIDE_COMMUNITIES,
} from '../data/guideMockData';

type FilterCategory = 'all' | ListingCategory;

export default function GuidesTabContent() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseArea | null>(null);
  const [showPartnerSheet, setShowPartnerSheet] = useState(false);

  const isPartner = false; // TODO: check from user profile

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
    <><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container, { backgroundColor: tc.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          <SearchNormal1 size={18} color={tc.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder="Search guides, tours, services..."
            placeholderTextColor={tc.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Partner Program Banner */}
      {!isPartner && (
        <View style={styles.sectionPadded}>
          <PartnerInviteCard onPress={() => setShowPartnerSheet(true)} />
        </View>
      )}

      {/* Featured Guides */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Featured Local Guides</Text>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => {}}>
            <Text style={[styles.seeAllText, { color: tc.primary }]}>See All</Text>
            <ArrowRight2 size={14} color={tc.primary} />
          </TouchableOpacity>
        </View>

        {/* Expertise Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }, !selectedExpertise && styles.filterChipActive]}
            onPress={() => setSelectedExpertise(null)}
          >
            <Text style={[styles.filterChipText, { color: tc.textSecondary }, !selectedExpertise && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {EXPERTISE_OPTIONS.slice(0, 6).map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.filterChip, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }, selectedExpertise === opt.id && styles.filterChipActive]}
              onPress={() => setSelectedExpertise(selectedExpertise === opt.id ? null : opt.id)}
            >
              <Text style={styles.filterEmoji}>{opt.emoji}</Text>
              <Text style={[styles.filterChipText, { color: tc.textSecondary }, selectedExpertise === opt.id && styles.filterChipTextActive]}>
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
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No guides match your search</Text>
          }
        />
      </View>

      {/* Listings by Category */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Browse Listings</Text>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {CATEGORY_FILTERS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, { color: tc.textSecondary }, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listing Cards */}
        <View style={styles.sectionPadded}>
          {filteredListings.length === 0 ? (
            <Text style={[styles.emptyText, { color: tc.textSecondary }]}>No listings in this category</Text>
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
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Top Communities with Guides</Text>
          <TouchableOpacity style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: tc.primary }]}>See All</Text>
            <ArrowRight2 size={14} color={tc.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionPadded}>
          {MOCK_GUIDE_COMMUNITIES.map(comm => (
            <TouchableOpacity key={comm.id} style={[styles.communityCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              {/* Cover Image */}
              <Image source={{ uri: comm.coverImage }} style={styles.communityCover} />
              {/* Trust Badge Overlay */}
              <View style={[styles.trustBadgeOverlay, { backgroundColor: tc.bgElevated }]}> 
                <Star1 size={12} color="#F59E0B" variant="Bold" />
                <Text style={[styles.trustBadgeText, { color: tc.textPrimary }]}>{comm.trustRating}</Text>
              </View>
              {/* Content */}
              <View style={styles.communityCardContent}>
                <Text style={[styles.communityName, { color: tc.textPrimary }]} numberOfLines={1}>{comm.name}</Text>
                <Text style={[styles.communityDesc, { color: tc.textSecondary }]} numberOfLines={2}>{comm.description}</Text>
                <View style={styles.communityStats}>
                  <View style={styles.communityStat}>
                    <People size={13} color={tc.textSecondary} />
                    <Text style={[styles.communityStatText, { color: tc.textSecondary }]}>{comm.memberCount.toLocaleString()}</Text>
                  </View>
                  <Text style={[styles.communityStatDot, { color: tc.textTertiary }]}>·</Text>
                  <Text style={[styles.communityStatText, { color: tc.textSecondary }]}>{comm.guideCount} guides</Text>
                  <Text style={[styles.communityStatDot, { color: tc.textTertiary }]}>·</Text>
                  <Text style={[styles.communityStatText, { color: tc.textSecondary }]}>{comm.postsPerWeek}/wk</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* Partner Program Bottom Sheet */}
    <PartnerProgramSheet
      visible={showPartnerSheet}
      onClose={() => setShowPartnerSheet(false)}
      onApply={() => {
        setShowPartnerSheet(false);
        router.push('/community/partner-apply' as any);
      }}
    />
  </>);
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
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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

  // Community Cards
  communityCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  communityCover: {
    width: '100%',
    height: 110,
  },
  trustBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  trustBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  communityCardContent: {
    padding: 14,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  communityDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  communityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  communityStatText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  communityStatDot: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
