/**
 * REVIEW CARD MOLECULE
 * 
 * Individual review card component
 * Shows user info, rating, review text, and photos
 */

import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star1 } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';

interface ReviewCardProps {
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  reviewText: string;
  photos?: string[];
  helpful?: number;
  compact?: boolean;
}

export default function ReviewCard({
  userName,
  userAvatar,
  rating,
  date,
  reviewText,
  photos = [],
  helpful = 0,
  compact = false,
}: ReviewCardProps) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* User Info */}
      <View style={styles.header}>
        <Image source={{ uri: userAvatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, index) => (
              <Star1
                key={index}
                size={14}
                color={index < rating ? '#F59E0B' : colors.gray300}
                variant={index < rating ? 'Bold' : 'Linear'}
              />
            ))}
            <Text style={styles.date}> • {date}</Text>
          </View>
        </View>
      </View>

      {/* Review Text */}
      <Text style={styles.reviewText}>{reviewText}</Text>

      {/* Photos - Hidden in compact mode */}
      {!compact && photos.length > 0 && (
        <View style={styles.photosContainer}>
          {photos.slice(0, 3).map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photo}
            />
          ))}
          {photos.length > 3 && (
            <View style={styles.morePhotos}>
              <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Helpful - Hidden in compact mode */}
      {!compact && helpful > 0 && (
        <Text style={styles.helpful}>{helpful} people found this helpful</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compactContainer: {
    width: 240,
    height: 130,
    padding: spacing.xs,
    marginBottom: 0,
    marginRight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  morePhotos: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  helpful: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
