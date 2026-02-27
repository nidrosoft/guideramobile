/**
 * REVIEW CARD
 * 
 * Displays a traveler's review of a guide with rating, tags, and optional guide response.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star1, Like1, Dislike } from 'iconsax-react-native';
import { colors } from '@/styles';
import { GuideReview } from '../types/guide.types';

interface ReviewCardProps {
  review: GuideReview;
  onHelpful?: () => void;
}

export default function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.content.length > 180;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star1
        key={i}
        size={14}
        color={i < rating ? '#F59E0B' : colors.gray200}
        variant={i < rating ? 'Bold' : 'Linear'}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Reviewer Info */}
      <View style={styles.header}>
        <Image source={{ uri: review.reviewerAvatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{review.reviewerName}</Text>
          {review.reviewerLocation && (
            <Text style={styles.location}>{review.reviewerLocation}</Text>
          )}
        </View>
        {review.visitDate && (
          <Text style={styles.visitDate}>Visited {review.visitDate}</Text>
        )}
      </View>

      {/* Stars */}
      <View style={styles.starsRow}>
        {renderStars(review.rating)}
      </View>

      {/* Content */}
      <Text style={styles.content} numberOfLines={expanded ? undefined : 4}>
        {review.content}
      </Text>
      {isLong && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={styles.readMore}>Read more</Text>
        </TouchableOpacity>
      )}

      {/* Tags */}
      {review.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {review.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Guide Response */}
      {review.guideResponse && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Guide's Response</Text>
          <Text style={styles.responseText}>{review.guideResponse}</Text>
        </View>
      )}

      {/* Actions */}
      {onHelpful && (
        <TouchableOpacity style={styles.helpfulBtn} onPress={onHelpful}>
          <Like1 size={14} color={colors.textTertiary} />
          <Text style={styles.helpfulText}>Helpful</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  location: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  visitDate: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  readMore: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#22C55E15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '500',
  },
  responseBox: {
    backgroundColor: colors.gray50,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.gray50,
  },
  helpfulText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
