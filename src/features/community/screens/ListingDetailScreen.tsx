/**
 * LISTING DETAIL SCREEN
 * 
 * Full detail view for a guide listing (tour, rental, service, recommendation).
 * Shows cover photos, description, pricing, what's included, guide info,
 * reviews, and inquiry button.
 */

import React, { useState, useMemo, useRef } from 'react';
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
  Location,
  Clock,
  TickCircle,
  Share,
  More,
  ArrowRight2,
  Home2,
  Map,
  Setting2,
  DocumentText,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  GuideListing,
  ListingCategory,
  TRUST_TIERS,
} from '../types/guide.types';
import TrustBadge from '../components/TrustBadge';
import ReviewCard from '../components/ReviewCard';
import { MOCK_LISTINGS, MOCK_REVIEWS, MOCK_GUIDES } from '../data/guideMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_CONFIG: Record<ListingCategory, { label: string; color: string; Icon: any }> = {
  property_rental: { label: 'Property Rental', color: '#8B5CF6', Icon: Home2 },
  tour_experience: { label: 'Tour / Experience', color: '#F59E0B', Icon: Map },
  service: { label: 'Service', color: '#3B82F6', Icon: Setting2 },
  recommendation: { label: 'Recommendation', color: '#22C55E', Icon: DocumentText },
};

export default function ListingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isSaved, setIsSaved] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const listing = useMemo(() => MOCK_LISTINGS.find(l => l.id === id) || MOCK_LISTINGS[0], [id]);
  const guide = useMemo(() => MOCK_GUIDES.find(g => g.id === listing.guideId), [listing.guideId]);
  const reviews = useMemo(() => MOCK_REVIEWS.filter(r => r.guideId === listing.guideId).slice(0, 3), [listing.guideId]);

  const catConfig = CATEGORY_CONFIG[listing.category];

  const handleInquire = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/community/chat/${listing.guideId}`);
  };

  const handleGuidePress = () => {
    router.push(`/community/guide/${listing.guideId}`);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        {listing.photos.length > 0 ? (
          <View style={styles.photoContainer}>
            <FlatList
              data={listing.photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `photo-${i}`}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActivePhotoIndex(index);
              }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
            />
            {/* Photo dots */}
            {listing.photos.length > 1 && (
              <View style={styles.photoDots}>
                {listing.photos.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.photoDot, activePhotoIndex === i && styles.photoDotActive]}
                  />
                ))}
              </View>
            )}

            {/* Overlay buttons */}
            <View style={[styles.photoOverlay, { paddingTop: insets.top }]}>
              <TouchableOpacity style={styles.overlayBtn} onPress={() => router.back()}>
                <ArrowLeft size={20} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.overlayRight}>
                <TouchableOpacity style={styles.overlayBtn} onPress={handleShare}>
                  <Share size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.overlayBtn} onPress={handleSave}>
                  <Heart size={20} color={colors.white} variant={isSaved ? 'Bold' : 'Linear'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { paddingTop: insets.top + 50 }]}>
            <catConfig.Icon size={40} color={catConfig.color} />
            <View style={[styles.photoOverlay, { paddingTop: insets.top }]}>
              <TouchableOpacity style={styles.overlayBtn} onPress={() => router.back()}>
                <ArrowLeft size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: catConfig.color + '15' }]}>
            <catConfig.Icon size={14} color={catConfig.color} variant="Bold" />
            <Text style={[styles.categoryText, { color: catConfig.color }]}>{catConfig.label}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Location size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.country}
            </Text>
          </View>

          {/* Rating & Inquiries */}
          <View style={styles.statsRow}>
            {listing.rating ? (
              <View style={styles.ratingBadge}>
                <Star1 size={14} color="#F59E0B" variant="Bold" />
                <Text style={styles.ratingText}>{listing.rating}</Text>
                <Text style={styles.ratingCount}>({listing.reviewCount} reviews)</Text>
              </View>
            ) : null}
            <Text style={styles.inquiryText}>{listing.inquiryCount} inquiries</Text>
          </View>

          {/* Price & Duration */}
          <View style={styles.priceSection}>
            {listing.priceRange && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>{listing.priceRange}</Text>
              </View>
            )}
            {listing.duration && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Duration</Text>
                <View style={styles.durationRow}>
                  <Clock size={14} color={colors.primary} />
                  <Text style={styles.priceValue}>{listing.duration}</Text>
                </View>
              </View>
            )}
            {listing.availability && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Availability</Text>
                <Text style={styles.priceValue}>{listing.availability}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          {/* What's Included */}
          {listing.whatsIncluded && listing.whatsIncluded.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {listing.whatsIncluded.map((item, i) => (
                <View key={i} style={styles.includedRow}>
                  <TickCircle size={16} color="#22C55E" variant="Bold" />
                  <Text style={styles.includedText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Visibility Notice */}
          <View style={styles.noticeBox}>
            <InfoCircle size={18} color={colors.primary} />
            <Text style={styles.noticeText}>
              Prices shown are approximate and for reference only. No transactions happen on Guidera — reach out to the guide directly to arrange details.
            </Text>
          </View>

          {/* Guide Info */}
          {guide && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Guide</Text>
              <TouchableOpacity style={styles.guideCard} onPress={handleGuidePress} activeOpacity={0.7}>
                <Image source={{ uri: guide.avatar }} style={styles.guideAvatar} />
                <View style={styles.guideInfo}>
                  <View style={styles.guideNameRow}>
                    <Text style={styles.guideName}>{guide.displayName}</Text>
                    <TrustBadge tier={guide.trustTier} size="small" showLabel={false} />
                  </View>
                  <View style={styles.guideMetaRow}>
                    <Star1 size={12} color="#F59E0B" variant="Bold" />
                    <Text style={styles.guideRating}>{guide.rating}</Text>
                    <Text style={styles.guideReviews}>({guide.reviewCount} reviews)</Text>
                    <Text style={styles.guideDot}>·</Text>
                    <Text style={styles.guideVouches}>{guide.vouchCount} vouches</Text>
                  </View>
                  <Text style={styles.guideResponse}>{guide.responseTime}</Text>
                </View>
                <ArrowRight2 size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Reviews Preview */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                {guide && (
                  <TouchableOpacity onPress={() => router.push(`/community/guide/${guide.id}`)}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomPriceCol}>
          {listing.priceRange && (
            <Text style={styles.bottomPrice}>{listing.priceRange}</Text>
          )}
          {listing.duration && (
            <Text style={styles.bottomDuration}>{listing.duration}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.inquireButton} onPress={handleInquire}>
          <Message size={18} color={colors.white} variant="Bold" />
          <Text style={styles.inquireButtonText}>Inquire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Photo Gallery
  photoContainer: {
    position: 'relative',
    height: 280,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: colors.gray100,
  },
  photoDots: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  photoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoDotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayRight: {
    flexDirection: 'row',
    gap: 8,
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    padding: 18,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inquiryText: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Price Section
  priceSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  priceBox: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  // Sections
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 23,
  },

  // Included
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  includedText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Notice
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // Guide Card
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  guideAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  guideName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  guideRating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  guideReviews: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  guideDot: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  guideVouches: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  guideResponse: {
    fontSize: 11,
    color: colors.textTertiary,
  },

  // Bottom CTA
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomDuration: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  inquireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  inquireButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
