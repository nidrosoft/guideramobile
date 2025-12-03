/**
 * EXPERIENCE DETAIL STEP
 * 
 * Full experience information with rich media.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Star1,
  Clock,
  People,
  Heart,
  Share as ShareIcon,
  Location,
  TickCircle,
  CloseCircle,
  Translate,
  InfoCircle,
  User,
  MessageQuestion,
  Shield,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { CANCELLATION_POLICY_LABELS } from '../../../types/experience.types';

interface DetailStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetailStep({ onNext, onBack, onClose }: DetailStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedExperience } = useExperienceStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  if (!selectedExperience) return null;
  
  const experience = selectedExperience;
  
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
  
  const handleCheckAvailability = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  // Mock multiple images
  const images = [
    experience.images[0],
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  ];
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <Animated.View entering={FadeIn.duration(400)}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  activeImageIndex === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
          
          {/* Action Buttons */}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <ShareIcon size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
              <Heart
                size={20}
                color={isFavorite ? colors.error : colors.white}
                variant={isFavorite ? 'Bold' : 'Linear'}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Rating & Category */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.ratingRow}>
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
          </Animated.View>
          
          {/* Title */}
          <Animated.Text entering={FadeInDown.duration(400).delay(150)} style={styles.title}>
            {experience.title}
          </Animated.Text>
          
          {/* Quick Info */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.quickInfo}>
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
          </Animated.View>
          
          {/* Location */}
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.locationCard}>
            <Location size={20} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{experience.location.meetingPoint.name}</Text>
              <Text style={styles.locationAddress}>{experience.location.city}, {experience.location.country}</Text>
            </View>
          </Animated.View>
          
          {/* Description */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>About This Experience</Text>
            <Text
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {experience.description}
            </Text>
            {experience.description.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.readMore}>
                  {showFullDescription ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          
          {/* What's Included */}
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {experience.includes.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <TickCircle size={18} color={colors.success} variant="Bold" />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
          
          {/* What's Not Included */}
          {experience.notIncluded.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Not Included</Text>
              {experience.notIncluded.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <CloseCircle size={18} color={colors.error} variant="Bold" />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </Animated.View>
          )}
          
          {/* What to Bring */}
          {experience.whatToBring.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.section}>
              <Text style={styles.sectionTitle}>What to Bring</Text>
              {experience.whatToBring.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <InfoCircle size={18} color={colors.primary} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </Animated.View>
          )}
          
          {/* Host */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Your Host</Text>
            <View style={styles.hostCard}>
              <Image
                source={{ uri: experience.host.avatar }}
                style={styles.hostAvatar}
              />
              <View style={styles.hostInfo}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{experience.host.name}</Text>
                  {experience.host.verified && (
                    <TickCircle size={16} color={colors.primary} variant="Bold" />
                  )}
                  {experience.host.superHost && (
                    <View style={styles.superHostBadge}>
                      <Text style={styles.superHostText}>Superhost</Text>
                    </View>
                  )}
                </View>
                <View style={styles.hostStats}>
                  <Star1 size={14} color={colors.warning} variant="Bold" />
                  <Text style={styles.hostStatText}>{experience.host.rating}</Text>
                  <Text style={styles.hostStatDivider}>•</Text>
                  <Text style={styles.hostStatText}>{experience.host.reviewCount} reviews</Text>
                </View>
                {experience.host.bio && (
                  <Text style={styles.hostBio} numberOfLines={2}>{experience.host.bio}</Text>
                )}
              </View>
            </View>
          </Animated.View>
          
          {/* Cancellation Policy */}
          <Animated.View entering={FadeInDown.duration(400).delay(550)} style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <View style={styles.policyCard}>
              <Shield size={24} color={colors.success} />
              <View style={styles.policyInfo}>
                <Text style={styles.policyTitle}>
                  {experience.cancellationPolicy.startsWith('free') ? 'Free Cancellation' : 'Cancellation Policy'}
                </Text>
                <Text style={styles.policyText}>
                  {CANCELLATION_POLICY_LABELS[experience.cancellationPolicy]}
                </Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Features */}
          <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.featuresGrid}>
            {experience.instantConfirmation && (
              <View style={styles.featureItem}>
                <TickCircle size={20} color={colors.success} variant="Bold" />
                <Text style={styles.featureText}>Instant Confirmation</Text>
              </View>
            )}
            {experience.mobileTicket && (
              <View style={styles.featureItem}>
                <TickCircle size={20} color={colors.success} variant="Bold" />
                <Text style={styles.featureText}>Mobile Ticket</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(650)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>{experience.price.formatted}</Text>
          <Text style={styles.priceUnit}>/person</Text>
        </View>
        
        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckAvailability}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkButtonGradient}
          >
            <Text style={styles.checkButtonText}>Check Availability</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: { backgroundColor: colors.white, width: 24 },
  imageActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: { padding: spacing.lg },
  
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingBadge: {
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
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bestSellerBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
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
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  locationInfo: { marginLeft: spacing.sm, flex: 1 },
  locationName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  locationAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  
  hostCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  hostInfo: { marginLeft: spacing.md, flex: 1 },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  hostName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  superHostBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  superHostText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  hostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  hostStatText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  hostStatDivider: { color: colors.gray400 },
  hostBio: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  policyInfo: { marginLeft: spacing.sm, flex: 1 },
  policyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
  },
  policyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  priceContainer: {
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
    color: colors.textPrimary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  checkButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  checkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  checkButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
