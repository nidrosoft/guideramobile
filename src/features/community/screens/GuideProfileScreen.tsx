/**
 * GUIDE PROFILE SCREEN
 * 
 * Public-facing profile for a verified local guide.
 * Shows trust badges, bio, expertise, listings, reviews, vouches,
 * portfolio, community activity, and message button.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Star1,
  Message,
  Heart,
  ShieldTick,
  ShieldSecurity,
  Clock,
  LanguageSquare,
  Calendar,
  People,
  More,
  Location,
  Verify,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  GuideProfile,
  GuideListing,
  GuideReview,
  GuideVouch,
  TRUST_TIERS,
  EXPERTISE_OPTIONS,
} from '../types/guide.types';
import TrustBadge from '../components/TrustBadge';
import ListingCard from '../components/ListingCard';
import ReviewCard from '../components/ReviewCard';
import VouchCard from '../components/VouchCard';
import { MOCK_GUIDES, MOCK_LISTINGS, MOCK_REVIEWS, MOCK_VOUCHES } from '../data/guideMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProfileTab = 'about' | 'listings' | 'reviews' | 'vouches';

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available_now: { label: 'Available Now', color: '#22C55E' },
  available_this_week: { label: 'Available This Week', color: '#3B82F6' },
  busy: { label: 'Busy', color: '#F59E0B' },
  away: { label: 'Away', color: '#9CA3AF' },
};

export default function GuideProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [isSaved, setIsSaved] = useState(false);

  // Mock data lookup
  const guide = useMemo(() => MOCK_GUIDES.find(g => g.id === id) || MOCK_GUIDES[0], [id]);
  const listings = useMemo(() => MOCK_LISTINGS.filter(l => l.guideId === guide.id), [guide.id]);
  const reviews = useMemo(() => MOCK_REVIEWS.filter(r => r.guideId === guide.id), [guide.id]);
  const vouches = useMemo(() => MOCK_VOUCHES.filter(v => v.voucheeId === guide.id), [guide.id]);

  const availInfo = AVAILABILITY_LABELS[guide.availability] || AVAILABILITY_LABELS.away;
  const tierInfo = TRUST_TIERS[guide.trustTier];

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/community/chat/${guide.userId}`);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaved(!isSaved);
  };

  const TABS: { id: ProfileTab; label: string; count?: number }[] = [
    { id: 'about', label: 'About' },
    { id: 'listings', label: 'Listings', count: listings.length },
    { id: 'reviews', label: 'Reviews', count: guide.reviewCount },
    { id: 'vouches', label: 'Vouches', count: guide.vouchCount },
  ];

  const renderTrustDetails = () => {
    const checks = [
      { label: 'Identity Verified', done: guide.verificationStatus === 'verified', icon: '✓' },
      { label: 'Background Cleared', done: guide.backgroundCheckStatus === 'cleared', icon: '✓' },
      { label: `Vouched by ${guide.vouchCount} guides`, done: guide.vouchCount > 0, icon: '✓' },
      { label: `${guide.rating}★ from ${guide.reviewCount} reviews`, done: guide.reviewCount > 0, icon: '✓' },
      { label: `Active in ${guide.communityCount} communities`, done: guide.communityCount > 0, icon: '✓' },
      { label: guide.responseTime, done: true, icon: '⏱' },
      { label: `Member since ${formatMemberSince(guide.memberSince)}`, done: true, icon: '📅' },
    ];

    return (
      <View style={styles.trustSection}>
        <Text style={styles.sectionTitle}>Trust & Verification</Text>
        <View style={styles.trustBadgeLarge}>
          <TrustBadge tier={guide.trustTier} size="large" />
        </View>
        {checks.map((check, i) => (
          <View key={i} style={styles.trustCheckRow}>
            <Text style={[styles.trustCheckIcon, check.done && styles.trustCheckDone]}>
              {check.done ? '✅' : '⬜'}
            </Text>
            <Text style={[styles.trustCheckText, !check.done && styles.trustCheckPending]}>
              {check.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{guide.bio}</Text>
      </View>

      {/* Expertise */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expertise</Text>
        <View style={styles.expertiseGrid}>
          {guide.expertiseAreas.map((area, i) => {
            const opt = EXPERTISE_OPTIONS.find(o => o.id === area);
            return opt ? (
              <View key={i} style={styles.expertiseChip}>
                <Text style={styles.expertiseEmoji}>{opt.emoji}</Text>
                <Text style={styles.expertiseLabel}>{opt.label}</Text>
              </View>
            ) : null;
          })}
        </View>
      </View>

      {/* Trust Details */}
      {renderTrustDetails()}

      {/* Languages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.langChips}>
          {guide.languages.map((lang, i) => (
            <View key={i} style={styles.langChip}>
              <LanguageSquare size={14} color={colors.primary} />
              <Text style={styles.langChipText}>{lang}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Credentials */}
      {guide.credentials && guide.credentials.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          {guide.credentials.map((cred, i) => (
            <View key={i} style={styles.credRow}>
              <Verify size={16} color="#22C55E" variant="Bold" />
              <Text style={styles.credText}>{cred}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Portfolio */}
      {guide.portfolioPhotos && guide.portfolioPhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {guide.portfolioPhotos.map((photo, i) => (
              <Image key={i} source={{ uri: photo }} style={styles.portfolioPhoto} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Communities */}
      {guide.activeCommunities && guide.activeCommunities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Communities</Text>
          {guide.activeCommunities.map((comm, i) => (
            <TouchableOpacity key={i} style={styles.communityRow}>
              <People size={16} color={colors.primary} />
              <View style={styles.communityInfo}>
                <Text style={styles.communityName}>{comm.name}</Text>
                <Text style={styles.communityMembers}>{comm.memberCount.toLocaleString()} members</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      {listings.length === 0 ? (
        <Text style={styles.emptyText}>No listings yet</Text>
      ) : (
        listings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPress={() => router.push(`/community/listing/${listing.id}`)}
            onInquire={handleMessage}
          />
        ))
      )}
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <Text style={styles.ratingBig}>{guide.rating}</Text>
        <View style={styles.ratingStars}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star1 key={i} size={18} color={i < Math.round(guide.rating) ? '#F59E0B' : colors.gray200} variant="Bold" />
          ))}
        </View>
        <Text style={styles.ratingCount}>{guide.reviewCount} reviews</Text>
      </View>

      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews yet</Text>
      ) : (
        reviews.map(review => (
          <ReviewCard key={review.id} review={review} onHelpful={() => {}} />
        ))
      )}
    </View>
  );

  const renderVouchesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.vouchSummary}>
        <Text style={styles.vouchCount}>{guide.vouchCount}</Text>
        <Text style={styles.vouchLabel}>Vouches from verified guides</Text>
        <Text style={styles.vouchExplain}>
          Each vouch is a personal endorsement. Vouchers put their own reputation on the line.
        </Text>
      </View>

      {vouches.length === 0 ? (
        <Text style={styles.emptyText}>No vouches yet</Text>
      ) : (
        vouches.map(vouch => (
          <VouchCard
            key={vouch.id}
            vouch={vouch}
            onVoucherPress={() => router.push(`/community/guide/${vouch.voucherId}`)}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover + Back Button */}
        <View style={styles.coverContainer}>
          {guide.coverPhoto ? (
            <Image source={{ uri: guide.coverPhoto }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: tierInfo.color + '30' }]} />
          )}
          <View style={[styles.coverOverlay, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.coverActions}>
              <TouchableOpacity style={styles.coverActionBtn} onPress={handleSave}>
                <Heart size={20} color={colors.white} variant={isSaved ? 'Bold' : 'Linear'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.coverActionBtn}>
                <More size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: guide.avatar }} style={styles.profileAvatar} />
            <View style={[styles.availIndicator, { backgroundColor: availInfo.color }]} />
          </View>

          <Text style={styles.displayName}>{guide.displayName}</Text>
          <View style={styles.locationRow}>
            <Location size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {guide.city}, {guide.country}
            </Text>
          </View>

          {/* Trust Badge */}
          <TrustBadge tier={guide.trustTier} size="medium" />

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star1 size={16} color="#F59E0B" variant="Bold" />
              <Text style={styles.statValue}>{guide.rating}</Text>
              <Text style={styles.statLabel}>({guide.reviewCount})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ShieldTick size={16} color={tierInfo.color} variant="Bold" />
              <Text style={styles.statValue}>{guide.vouchCount}</Text>
              <Text style={styles.statLabel}>vouches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Clock size={16} color={colors.textTertiary} />
              <Text style={styles.statLabel}>{guide.responseTime.replace('Usually responds within ', '~')}</Text>
            </View>
          </View>

          {/* Availability */}
          <View style={[styles.availBadge, { backgroundColor: availInfo.color + '15' }]}>
            <View style={[styles.availDot, { backgroundColor: availInfo.color }]} />
            <Text style={[styles.availText, { color: availInfo.color }]}>{availInfo.label}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Message size={18} color={colors.white} variant="Bold" />
              <Text style={styles.messageButtonText}>Message {guide.firstName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Heart size={18} color={isSaved ? '#EF4444' : colors.textSecondary} variant={isSaved ? 'Bold' : 'Linear'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.id && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'listings' && renderListingsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'vouches' && renderVouchesTab()}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  coverContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  coverActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
    paddingBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.white,
  },
  availIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.white,
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.gray200,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  saveButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: colors.primary + '15',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabBadgeTextActive: {
    color: colors.primary,
  },

  // Tab Content
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  expertiseEmoji: {
    fontSize: 16,
  },
  expertiseLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },

  // Trust Section
  trustSection: {
    marginBottom: 24,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 16,
  },
  trustBadgeLarge: {
    marginBottom: 12,
  },
  trustCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trustCheckIcon: {
    fontSize: 14,
  },
  trustCheckDone: {
    // default
  },
  trustCheckText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  trustCheckPending: {
    color: colors.textTertiary,
  },

  // Languages
  langChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  langChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },

  // Credentials
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  credText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Portfolio
  portfolioPhoto: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: colors.gray100,
  },

  // Communities
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  communityMembers: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Reviews
  ratingSummary: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  ratingBig: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 3,
    marginVertical: 6,
  },
  ratingCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Vouches
  vouchSummary: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  vouchCount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  vouchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  vouchExplain: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
