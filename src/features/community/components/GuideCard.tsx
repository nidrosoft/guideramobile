/**
 * GUIDE CARD
 * 
 * Displays a local guide preview with trust badge, rating, expertise, and availability.
 * Used in guide discovery lists and search results.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star1, Message, Clock, LanguageSquare } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { GuideProfile, EXPERTISE_OPTIONS } from '../types/guide.types';
import TrustBadge from './TrustBadge';

interface GuideCardProps {
  guide: GuideProfile;
  onPress: () => void;
  onMessage?: () => void;
  variant?: 'horizontal' | 'vertical';
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available_now: { label: 'Available Now', color: '#22C55E' },
  available_this_week: { label: 'Available This Week', color: '#3B82F6' },
  busy: { label: 'Busy', color: '#F59E0B' },
  away: { label: 'Away', color: '#9CA3AF' },
};

export default function GuideCard({ guide, onPress, onMessage, variant = 'vertical' }: GuideCardProps) {
  const availInfo = AVAILABILITY_LABELS[guide.availability] || AVAILABILITY_LABELS.away;
  const expertiseLabels = guide.expertiseAreas
    .slice(0, 2)
    .map(area => EXPERTISE_OPTIONS.find(o => o.id === area)?.label || area);

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.hContainer} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: guide.avatar }} style={styles.hAvatar} />
        <View style={styles.hContent}>
          <View style={styles.hNameRow}>
            <Text style={styles.hName} numberOfLines={1}>{guide.displayName}</Text>
            <TrustBadge tier={guide.trustTier} size="small" showLabel={false} />
          </View>
          <View style={styles.hRatingRow}>
            <Star1 size={12} color="#F59E0B" variant="Bold" />
            <Text style={styles.hRating}>{guide.rating}</Text>
            <Text style={styles.hReviews}>({guide.reviewCount})</Text>
          </View>
          <Text style={styles.hExpertise} numberOfLines={1}>
            {expertiseLabels.join(' · ')}
          </Text>
        </View>
        {onMessage && (
          <TouchableOpacity style={styles.hMessageBtn} onPress={onMessage}>
            <Message size={18} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar & Availability */}
      <View style={styles.avatarSection}>
        <Image source={{ uri: guide.avatar }} style={styles.avatar} />
        <View style={[styles.availDot, { backgroundColor: availInfo.color }]} />
      </View>

      {/* Name & Badge */}
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{guide.displayName}</Text>
        <TrustBadge tier={guide.trustTier} size="small" />
      </View>

      {/* Location */}
      <Text style={styles.location}>{guide.city}, {guide.country}</Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Star1 size={14} color="#F59E0B" variant="Bold" />
        <Text style={styles.rating}>{guide.rating}</Text>
        <Text style={styles.reviews}>({guide.reviewCount} reviews)</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.vouches}>{guide.vouchCount} vouches</Text>
      </View>

      {/* Expertise Tags */}
      <View style={styles.tagsRow}>
        {expertiseLabels.map((label, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Availability & Response */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <View style={[styles.metaDot, { backgroundColor: availInfo.color }]} />
          <Text style={[styles.metaText, { color: availInfo.color }]}>{availInfo.label}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={12} color={colors.textTertiary} />
          <Text style={styles.metaText}>{guide.responseTime.replace('Usually responds within ', '~')}</Text>
        </View>
      </View>

      {/* Languages */}
      <View style={styles.langRow}>
        <LanguageSquare size={12} color={colors.textTertiary} />
        <Text style={styles.langText}>{guide.languages.join(', ')}</Text>
      </View>

      {/* Action Button */}
      {onMessage && (
        <TouchableOpacity style={styles.messageBtn} onPress={onMessage}>
          <Message size={16} color={colors.white} variant="Bold" />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical variant
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.gray100,
  },
  availDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -36,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 10,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviews: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dot: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  vouches: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  langText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Horizontal variant
  hContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 10,
  },
  hContent: {
    flex: 1,
  },
  hNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  hName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  hRating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hReviews: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  hExpertise: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  hMessageBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
