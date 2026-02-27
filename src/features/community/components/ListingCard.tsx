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
  const catConfig = CATEGORY_CONFIG[listing.category];

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onPress} activeOpacity={0.7}>
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
          <Text style={styles.compactTitle} numberOfLines={2}>{listing.title}</Text>
          {listing.priceRange && (
            <Text style={styles.compactPrice}>{listing.priceRange}</Text>
          )}
          <View style={styles.compactMeta}>
            <Star1 size={11} color="#F59E0B" variant="Bold" />
            <Text style={styles.compactRating}>{listing.rating || 'New'}</Text>
            <Text style={styles.compactDot}>·</Text>
            <Text style={styles.compactInquiries}>{listing.inquiryCount} inquiries</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
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
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Location size={12} color={colors.textTertiary} />
          <Text style={styles.locationText}>
            {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}
          </Text>
        </View>

        {/* Price & Duration */}
        <View style={styles.priceRow}>
          {listing.priceRange && (
            <Text style={styles.price}>{listing.priceRange}</Text>
          )}
          {listing.duration && (
            <View style={styles.durationBadge}>
              <Clock size={11} color={colors.textSecondary} />
              <Text style={styles.durationText}>{listing.duration}</Text>
            </View>
          )}
        </View>

        {/* Rating & Inquiries */}
        <View style={styles.statsRow}>
          {listing.rating ? (
            <View style={styles.ratingBadge}>
              <Star1 size={12} color="#F59E0B" variant="Bold" />
              <Text style={styles.ratingText}>{listing.rating}</Text>
              <Text style={styles.reviewCount}>({listing.reviewCount})</Text>
            </View>
          ) : null}
          <Text style={styles.inquiryCount}>{listing.inquiryCount} inquiries</Text>
        </View>

        {/* Guide Info */}
        <View style={styles.guideRow}>
          <Image source={{ uri: listing.guideAvatar }} style={styles.guideAvatar} />
          <Text style={styles.guideName}>{listing.guideName}</Text>
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
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
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
    backgroundColor: colors.gray100,
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
    backgroundColor: colors.gray50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
    borderTopColor: colors.gray100,
  },
  guideAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  inquireBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: colors.gray100,
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
    borderRadius: 8,
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
