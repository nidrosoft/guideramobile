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

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
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
  Briefcase,
  ShoppingBag,
} from 'iconsax-react-native';
import { colors, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  GuideProfile,
  GuideListing,
  ListingCategory,
  LISTING_CATEGORIES,
  EXPERTISE_OPTIONS,
  ExpertiseArea,
} from '../types/guide.types';
import GuideCard from '../components/GuideCard';
import ListingCard from '../components/ListingCard';
import PartnerInviteCard from '../components/PartnerInviteCard';
import PartnerProgramSheet from '../components/PartnerProgramSheet';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

type FilterCategory = 'all' | ListingCategory;

export default function GuidesTabContent() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedExpertise, setSelectedExpertise] = useState<ExpertiseArea | null>(null);
  const [showPartnerSheet, setShowPartnerSheet] = useState(false);
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [listings, setListings] = useState<GuideListing[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  // Check if user is an approved partner
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('partner_applications')
      .select('status, didit_verification_status')
      .eq('user_id', profile.id)
      .in('status', ['approved', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === 'approved' || data?.didit_verification_status === 'approved') {
          setIsPartner(true);
        }
      })
      .catch(() => {});
  }, [profile?.id]);

  const fetchData = useCallback(async () => {
    try {
      setIsFetching(true);

      const [guidesRes, listingsRes, communitiesRes] = await Promise.all([
        supabase.from('guide_profiles').select('*').eq('status', 'active').order('rating', { ascending: false }).limit(20),
        supabase.from('guide_listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(20),
        supabase.from('groups').select('*').eq('status', 'active').order('member_count', { ascending: false }).limit(5),
      ]);

      if (guidesRes.data) setGuides(guidesRes.data as any);
      if (listingsRes.data) {
        setListings(listingsRes.data.map((l: any) => ({
          id: l.id,
          guideId: l.guide_id,
          guideName: l.guide_name || '',
          guideAvatar: l.guide_avatar || '',
          guideTrustTier: l.guide_trust_tier || 'verified_local',
          guideRating: l.guide_rating || 0,
          category: l.category || 'service',
          title: l.title || '',
          description: l.description || '',
          photos: l.photos || [],
          neighborhood: l.neighborhood,
          city: l.city || '',
          country: l.country || '',
          priceRange: l.price_range,
          currency: l.currency,
          duration: l.duration,
          whatsIncluded: l.whats_included,
          availability: l.availability,
          inquiryCount: l.inquiry_count || 0,
          rating: l.rating,
          reviewCount: l.review_count,
          status: l.status,
          createdAt: l.created_at,
          updatedAt: l.updated_at,
        })));
      }
      if (communitiesRes.data) {
        setCommunities(communitiesRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          avatar: c.group_photo_url || '',
          coverImage: c.cover_photo_url || '',
          memberCount: c.member_count || 0,
          guideCount: 0,
          postsPerWeek: 0,
          trustRating: 0,
          city: c.destination_name || '',
          country: c.destination_country || '',
          description: c.description || '',
        })));
      }
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch guides tab data:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredGuides = useMemo(() => {
    let g = guides;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      g = g.filter((guide: any) =>
        (guide.displayName || guide.display_name || '').toLowerCase().includes(q) ||
        (guide.city || '').toLowerCase().includes(q) ||
        (guide.country || '').toLowerCase().includes(q) ||
        (guide.expertiseAreas || guide.expertise_areas || []).some((a: string) => a.includes(q))
      );
    }
    if (selectedExpertise) {
      g = g.filter((guide: any) => (guide.expertiseAreas || guide.expertise_areas || []).includes(selectedExpertise));
    }
    return g;
  }, [searchQuery, selectedExpertise, guides]);

  const filteredListings = useMemo(() => {
    let l = listings;
    if (selectedCategory !== 'all') {
      l = l.filter(listing => listing.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      l = l.filter(listing =>
        listing.title.toLowerCase().includes(q) ||
        listing.city.toLowerCase().includes(q) ||
        listing.guideName.toLowerCase().includes(q)
      );
    }
    return l;
  }, [searchQuery, selectedCategory, listings]);

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

  const hasGuides = guides.length > 0;
  const hasListings = listings.length > 0;
  const hasCommunities = communities.length > 0;
  const hasAnyContent = hasGuides || hasListings || hasCommunities;
  const isAllEmpty = !isFetching && !hasAnyContent;

  return (
    <><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container, { backgroundColor: tc.background, flexGrow: isAllEmpty ? 1 : undefined }]}>
      {/* Partner Program Banner — always show */}
      {!isPartner && (
        <View style={styles.sectionPadded}>
          <PartnerInviteCard onPress={() => setShowPartnerSheet(true)} />
        </View>
      )}

      {isAllEmpty ? (
        /* Unified empty state — no section headers, no filters */
        <View style={styles.fullEmptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: tc.primary + '12' }]}>
            <Briefcase size={32} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.fullEmptyTitle, { color: tc.textPrimary }]}>
            Local Guides Coming Soon
          </Text>
          <Text style={[styles.fullEmptySubtitle, { color: tc.textSecondary }]}>
            This is where you'll find verified local guides offering tours, property rentals, transportation, and personalized experiences.{'\n\n'}As guides join Guidera, their profiles, listings, and communities will appear here. Want to be one of them? Tap the card above to get started — it's free!
          </Text>
        </View>
      ) : (
        <>
          {/* Search Bar — only when content exists */}
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

          {/* Featured Guides — only when guides exist */}
          {hasGuides && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Featured Local Guides</Text>
                <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/community/trending' as any)}>
                  <Text style={[styles.seeAllText, { color: tc.primary }]}>See All</Text>
                  <ArrowRight2 size={14} color={tc.primary} />
                </TouchableOpacity>
              </View>

              {/* Expertise Filter — only show chips for expertise areas that exist */}
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
              />
            </View>
          )}

          {/* Listings — only when listings exist */}
          {hasListings && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Browse Listings</Text>
              </View>

              {/* Category Filters — only if we have enough diversity */}
              {listings.length > 3 && (
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
              )}

              <View style={styles.sectionPadded}>
                {filteredListings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onPress={() => handleListingPress(listing.id)}
                    onInquire={() => handleGuidePress(listing.guideId)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Communities — only when communities exist */}
          {hasCommunities && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Top Groups with Guides</Text>
                <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/community/trending' as any)}>
                  <Text style={[styles.seeAllText, { color: tc.primary }]}>See All</Text>
                  <ArrowRight2 size={14} color={tc.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionPadded}>
                {communities.map(comm => (
                  <TouchableOpacity key={comm.id} style={[styles.communityCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]} onPress={() => router.push(`/community/${comm.id}` as any)} activeOpacity={0.7}>
                    <Image source={{ uri: comm.coverImage }} style={styles.communityCover} />
                    <View style={[styles.trustBadgeOverlay, { backgroundColor: tc.bgElevated }]}> 
                      <Star1 size={12} color="#F59E0B" variant="Bold" />
                      <Text style={[styles.trustBadgeText, { color: tc.textPrimary }]}>{comm.trustRating}</Text>
                    </View>
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
          )}
        </>
      )}

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
  sectionEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  fullEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  fullEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  fullEmptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
});
