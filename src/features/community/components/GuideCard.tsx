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
import { useTheme } from '@/context/ThemeContext';
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
  const { colors: tc } = useTheme();
  const availInfo = AVAILABILITY_LABELS[guide.availability] || AVAILABILITY_LABELS.away;
  const expertiseLabels = guide.expertiseAreas
    .slice(0, 2)
    .map(area => EXPERTISE_OPTIONS.find(o => o.id === area)?.label || area);

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={[styles.hContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: guide.avatar }} style={styles.hAvatar} />
        <View style={styles.hContent}>
          <View style={styles.hNameRow}>
            <Text style={[styles.hName, { color: tc.textPrimary }]} numberOfLines={1}>{guide.displayName}</Text>
            <TrustBadge tier={guide.trustTier} size="small" showLabel={false} />
          </View>
          <View style={styles.hRatingRow}>
            <Star1 size={12} color="#F59E0B" variant="Bold" />
            <Text style={[styles.hRating, { color: tc.textPrimary }]}>{guide.rating}</Text>
            <Text style={[styles.hReviews, { color: tc.textSecondary }]}>({guide.reviewCount})</Text>
          </View>
          <Text style={[styles.hExpertise, { color: tc.textSecondary }]} numberOfLines={1}>
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
    <TouchableOpacity style={[styles.container, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar & Availability */}
      <View style={styles.avatarSection}>
        <Image source={{ uri: guide.avatar }} style={styles.avatar} />
        <View style={[styles.availDot, { backgroundColor: availInfo.color }]} />
      </View>

      {/* Name & Badge */}
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: tc.textPrimary }]} numberOfLines={1}>{guide.displayName}</Text>
        <TrustBadge tier={guide.trustTier} size="small" />
      </View>

      {/* Location */}
      <Text style={[styles.location, { color: tc.textSecondary }]}>{guide.city}, {guide.country}</Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <Star1 size={14} color="#F59E0B" variant="Bold" />
        <Text style={[styles.rating, { color: tc.textPrimary }]}>{guide.rating}</Text>
        <Text style={[styles.reviews, { color: tc.textSecondary }]}>({guide.reviewCount} reviews)</Text>
        <Text style={[styles.dot, { color: tc.textSecondary }]}>·</Text>
        <Text style={[styles.vouches, { color: tc.textSecondary }]}>{guide.vouchCount} vouches</Text>
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
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>{guide.responseTime.replace('Usually responds within ', '~')}</Text>
        </View>
      </View>

      {/* Languages */}
      <View style={styles.langRow}>
        <LanguageSquare size={12} color={colors.textTertiary} />
        <Text style={[styles.langText, { color: colors.textTertiary }]}>{guide.languages.join(', ')}</Text>
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
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  availDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
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
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hAvatar: {
    width: 52,
    height: 52,
    borderRadius: 20,
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
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
