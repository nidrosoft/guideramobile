/**
 * EXPERIENCE DETAIL SHEET
 * 
 * Bottom sheet showing full experience details.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  Star1,
  Clock,
  People,
  Location,
  TickCircle,
  CloseSquare,
  Heart,
  Share as ShareIcon,
  Translate,
  Shield,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Experience, CANCELLATION_POLICY_LABELS } from '../../../types/experience.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExperienceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (experience: Experience) => void;
  experience: Experience | null;
}

export default function ExperienceDetailSheet({
  visible,
  onClose,
  onSelect,
  experience,
}: ExperienceDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);

  if (!experience) return null;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: experience.title,
        message: `Check out this experience: ${experience.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFavorite(!isFavorite);
  };

  const handleSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(experience);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Experience Details</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={28} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Image with Action Buttons */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: experience.images[0] }} style={styles.image} />
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <ShareIcon size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                  <Heart
                    size={20}
                    color={isFavorite ? colors.error : colors.textPrimary}
                    variant={isFavorite ? 'Bold' : 'Linear'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rating & Badges */}
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Star1 size={14} color={colors.warning} variant="Bold" />
                <Text style={styles.ratingText}>{experience.rating}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount.toLocaleString()} reviews)</Text>
              </View>
              {experience.bestSeller && (
                <View style={styles.bestSellerBadge}>
                  <Text style={styles.bestSellerText}>Best Seller</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{experience.title}</Text>

            {/* Quick Info */}
            <View style={styles.quickInfo}>
              <View style={styles.quickInfoItem}>
                <Clock size={18} color={colors.primary} />
                <Text style={styles.quickInfoText}>{formatDuration(experience.duration)}</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <People size={18} color={colors.primary} />
                <Text style={styles.quickInfoText}>Max {experience.maxParticipants}</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Translate size={18} color={colors.primary} />
                <Text style={styles.quickInfoText}>{experience.languages.slice(0, 2).join(', ')}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Experience</Text>
              <Text style={styles.description}>{experience.description}</Text>
            </View>

            {/* What's Included */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {experience.includes.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <TickCircle size={16} color={colors.success} variant="Bold" />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Not Included */}
            {experience.notIncluded.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Not Included</Text>
                {experience.notIncluded.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <CloseSquare size={16} color={colors.error} variant="Bold" />
                    <Text style={styles.listItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Meeting Point */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meeting Point</Text>
              <View style={styles.meetingCard}>
                <Location size={20} color={colors.primary} variant="Bold" />
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingName}>{experience.location.meetingPoint.name}</Text>
                  <Text style={styles.meetingAddress}>{experience.location.meetingPoint.address}</Text>
                  <Text style={styles.meetingInstructions}>{experience.location.meetingPoint.instructions}</Text>
                </View>
              </View>
            </View>

            {/* Cancellation Policy */}
            <View style={styles.section}>
              <View style={styles.policyCard}>
                <Shield size={20} color={colors.success} variant="Bold" />
                <View style={styles.policyInfo}>
                  <Text style={styles.policyTitle}>Cancellation Policy</Text>
                  <Text style={styles.policyText}>
                    {CANCELLATION_POLICY_LABELS[experience.cancellationPolicy]}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.priceValue}>{experience.price.formatted}</Text>
              <Text style={styles.priceUnit}>/ person</Text>
            </View>
            <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectGradient}
              >
                <Text style={styles.selectText}>Check Availability</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    height: 220,
  },
  actionButtons: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bestSellerBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  bestSellerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  quickInfo: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  listItemText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  meetingCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  meetingAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  meetingInstructions: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: 4,
  },
  policyCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.success}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  policyInfo: {
    flex: 1,
  },
  policyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  policyText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  priceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  selectButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  selectGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  selectText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
