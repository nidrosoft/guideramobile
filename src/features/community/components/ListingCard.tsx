/**
 * LISTING CARD
 * 
 * Displays a guide listing (tour, rental, service, recommendation).
 * Shows category, price range, guide info, and inquiry button.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star1, Message, Clock, Location, Home2, Map, Setting2, DocumentText } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { GuideListing, ListingCategory, TRUST_TIERS } from '../types/guide.types';
import TrustBadge from './TrustBadge';

interface ListingCardProps {
  listing: GuideListing;
  onPress: () => void;
  onInquire?: () => void;
  variant?: 'full' | 'compact';
}

const CATEGORY_CONFIG: Record<ListingCategory, { label: string; color: string; Icon: any }> = {
  property_rental: { label: 'Property', color: '#8B5CF6', Icon: Home2 },
  tour_experience: { label: 'Tour', color: '#F59E0B', Icon: Map },
  service: { label: 'Service', color: '#3B82F6', Icon: Setting2 },
  recommendation: { label: 'Guide', color: '#22C55E', Icon: DocumentText },
};

export default function ListingCard({ listing, onPress, onInquire, variant = 'full' }: ListingCardProps) {
  const { colors: tc } = useTheme();
  const catConfig = CATEGORY_CONFIG[listing.category];

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={[styles.compactContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]} onPress={onPress} activeOpacity={0.7}>
        {listing.photos.length > 0 ? (
          <Image source={{ uri: listing.photos[0] }} style={styles.compactImage} />
        ) : (
          <View style={[styles.compactImage, styles.compactImagePlaceholder]}>
            <catConfig.Icon size={24} color={catConfig.color} />
          </View>
        )}
        <View style={styles.compactContent}>
          <View style={[styles.catBadge, { backgroundColor: catConfig.color + '15' }]}>
            <Text style={[styles.catText, { color: catConfig.color }]}>{catConfig.label}</Text>
          </View>
          <Text style={[styles.compactTitle, { color: tc.textPrimary }]} numberOfLines={2}>{listing.title}</Text>
          {listing.priceRange && (
            <Text style={[styles.compactPrice, { color: tc.primary }]}>{listing.priceRange}</Text>
          )}
          <View style={styles.compactMeta}>
            <Star1 size={11} color="#F59E0B" variant="Bold" />
            <Text style={[styles.compactRating, { color: tc.textPrimary }]}>{listing.rating || 'New'}</Text>
            <Text style={[styles.compactDot, { color: tc.textSecondary }]}>·</Text>
            <Text style={[styles.compactInquiries, { color: tc.textSecondary }]}>{listing.inquiryCount} inquiries</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]} onPress={onPress} activeOpacity={0.7}>
      {/* Cover Image */}
      {listing.photos.length > 0 && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: listing.photos[0] }} style={styles.coverImage} />
          <View style={[styles.categoryBadge, { backgroundColor: catConfig.color }]}>
            <catConfig.Icon size={12} color={colors.white} variant="Bold" />
            <Text style={styles.categoryLabel}>{catConfig.label}</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: tc.textPrimary }]} numberOfLines={2}>{listing.title}</Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Location size={12} color={tc.textSecondary} />
          <Text style={[styles.locationText, { color: tc.textSecondary }]}>
            {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}
          </Text>
        </View>

        {/* Price & Duration */}
        <View style={styles.priceRow}>
          {listing.priceRange && (
            <Text style={[styles.price, { color: tc.textPrimary }]}>{listing.priceRange}</Text>
          )}
          {listing.duration && (
            <View style={[styles.durationBadge, { backgroundColor: tc.bgCard }]}>
              <Clock size={11} color={tc.textSecondary} />
              <Text style={[styles.durationText, { color: tc.textSecondary }]}>{listing.duration}</Text>
            </View>
          )}
        </View>

        {/* Rating & Inquiries */}
        <View style={styles.statsRow}>
          {listing.rating ? (
            <View style={styles.ratingBadge}>
              <Star1 size={12} color="#F59E0B" variant="Bold" />
              <Text style={[styles.ratingText, { color: tc.textPrimary }]}>{listing.rating}</Text>
              <Text style={[styles.reviewCount, { color: tc.textSecondary }]}>({listing.reviewCount})</Text>
            </View>
          ) : null}
          <Text style={[styles.inquiryCount, { color: tc.textSecondary }]}>{listing.inquiryCount} inquiries</Text>
        </View>

        {/* Guide Info */}
        <View style={[styles.guideRow, { borderTopColor: tc.borderSubtle }]}>
          <Image source={{ uri: listing.guideAvatar }} style={styles.guideAvatar} />
          <Text style={[styles.guideName, { color: tc.textPrimary }]}>{listing.guideName}</Text>
          <TrustBadge tier={listing.guideTrustTier} size="small" showLabel={false} />
          <View style={styles.spacer} />
          {onInquire && (
            <TouchableOpacity style={styles.inquireBtn} onPress={onInquire}>
              <Message size={14} color={colors.white} variant="Bold" />
              <Text style={styles.inquireBtnText}>Inquire</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.borderSubtle,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inquiryCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  guideAvatar: {
    width: 28,
    height: 28,
    borderRadius: 20,
  },
  guideName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  inquireBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inquireBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.borderSubtle,
  },
  compactImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 4,
  },
  catText: {
    fontSize: 10,
    fontWeight: '600',
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
    lineHeight: 18,
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactRating: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  compactDot: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  compactInquiries: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
