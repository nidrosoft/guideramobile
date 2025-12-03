/**
 * POI CARD
 * 
 * Beautiful floating card for displaying POI information.
 * Shows when user taps on a POI marker.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Star1,
  Location,
  Clock,
  Message,
  ArrowRight2,
} from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { POI } from '../types/cityNavigator.types';
import { getCategoryColor } from '../data/mockPOIs';

interface POICardProps {
  poi: POI;
  onPress: () => void;
  onChat?: () => void;
  compact?: boolean;
}

export default function POICard({ poi, onPress, onChat, compact = false }: POICardProps) {
  const categoryColor = getCategoryColor(poi.category);

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {poi.imageUrl && (
          <Image source={{ uri: poi.imageUrl }} style={styles.compactImage} />
        )}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{poi.name}</Text>
          {poi.rating && (
            <View style={styles.ratingRow}>
              <Star1 size={14} color={colors.warning} variant="Bold" />
              <Text style={styles.ratingText}>{poi.rating}</Text>
              {poi.reviewCount && (
                <Text style={styles.reviewCount}>({formatNumber(poi.reviewCount)} Review)</Text>
              )}
            </View>
          )}
        </View>
        {onChat && (
          <TouchableOpacity style={styles.chatButton} onPress={onChat}>
            <Message size={20} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Image Section */}
      {poi.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: poi.imageUrl }} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          />
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{poi.category}</Text>
          </View>
        </View>
      )}

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{poi.name}</Text>
          {poi.isOpen !== undefined && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: poi.isOpen ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: poi.isOpen ? colors.success : colors.error }
              ]}>
                {poi.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Location size={14} color={colors.gray500} variant="Bold" />
          <Text style={styles.locationText} numberOfLines={1}>
            {poi.city}, {poi.country}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {poi.distance !== undefined && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDistance(poi.distance)}</Text>
              <Text style={styles.statLabel}>Miles</Text>
            </View>
          )}
          {poi.duration !== undefined && (
            <View style={styles.stat}>
              <Clock size={14} color={colors.primary} variant="Bold" />
              <Text style={styles.statValue}>{formatDuration(poi.duration)}</Text>
            </View>
          )}
          {poi.rating && (
            <View style={styles.stat}>
              <Star1 size={14} color={colors.warning} variant="Bold" />
              <Text style={styles.statValue}>{poi.rating}</Text>
              {poi.reviewCount && (
                <Text style={styles.reviewText}>({formatNumber(poi.reviewCount)} Review)</Text>
              )}
            </View>
          )}
        </View>

        {/* Navigate Button */}
        <TouchableOpacity style={styles.navigateButton} onPress={onPress}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.navigateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ArrowRight2 size={24} color={colors.white} variant="Bold" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// Helper functions
function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 1 ? miles.toFixed(1) : miles.toFixed(1);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textTransform: 'capitalize',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  reviewText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  navigateButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  navigateGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    gap: spacing.sm,
  },
  compactImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
