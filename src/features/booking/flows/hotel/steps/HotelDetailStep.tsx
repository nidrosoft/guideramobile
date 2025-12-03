/**
 * HOTEL DETAIL STEP
 * 
 * Detailed view of selected hotel with gallery, amenities, and reviews.
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Star1,
  Location,
  Heart,
  Share,
  ArrowRight2,
  TickCircle,
  Clock,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelDetailStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function HotelDetailStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: HotelDetailStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedHotel, searchParams, getNights } = useHotelStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  if (!selectedHotel) return null;
  
  const nights = getNights();
  
  const handleSelectRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <Animated.View entering={FadeIn.duration(400)}>
          <FlatList
            data={selectedHotel.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item) => item.id}
          />
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {selectedHotel.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
          
          {/* Action Buttons */}
          <View style={styles.galleryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFavorite(!isFavorite);
              }}
            >
              <Heart
                size={22}
                color={isFavorite ? colors.error : colors.white}
                variant={isFavorite ? 'Bold' : 'Linear'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Hotel Info */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.infoSection}
        >
          <View style={styles.headerRow}>
            <View style={styles.ratingContainer}>
              {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
                <Star1 key={i} size={16} color={colors.warning} variant="Bold" />
              ))}
            </View>
            <View style={styles.userRatingBadge}>
              <Text style={styles.userRatingText}>{selectedHotel.userRating.toFixed(1)}</Text>
              <Text style={styles.reviewCountText}>({selectedHotel.reviewCount} reviews)</Text>
            </View>
          </View>
          
          <Text style={styles.hotelName}>{selectedHotel.name}</Text>
          
          <View style={styles.locationRow}>
            <Location size={18} color={colors.primary} />
            <Text style={styles.locationText}>
              {selectedHotel.location.address}, {selectedHotel.location.city}
            </Text>
          </View>
          
          <Text style={styles.description}>{selectedHotel.description}</Text>
        </Animated.View>
        
        {/* Amenities */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {selectedHotel.amenities.slice(0, 8).map((amenity) => (
              <View key={amenity.id} style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <TickCircle size={18} color={colors.success} variant="Bold" />
                </View>
                <Text style={styles.amenityName}>{amenity.name}</Text>
              </View>
            ))}
          </View>
          {selectedHotel.amenities.length > 8 && (
            <TouchableOpacity style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>
                Show all {selectedHotel.amenities.length} amenities
              </Text>
              <ArrowRight2 size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Policies */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Hotel Policies</Text>
          <View style={styles.policyCard}>
            <View style={styles.policyRow}>
              <View style={styles.policyItem}>
                <Clock size={20} color={colors.primary} />
                <View style={styles.policyInfo}>
                  <Text style={styles.policyLabel}>Check-in</Text>
                  <Text style={styles.policyValue}>
                    From {selectedHotel.policies.checkIn.from}
                  </Text>
                </View>
              </View>
              <View style={styles.policyItem}>
                <Clock size={20} color={colors.primary} />
                <View style={styles.policyInfo}>
                  <Text style={styles.policyLabel}>Check-out</Text>
                  <Text style={styles.policyValue}>
                    Until {selectedHotel.policies.checkOut.until}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.policyDivider} />
            
            <View style={styles.policyNote}>
              <InfoCircle size={18} color={colors.textSecondary} />
              <Text style={styles.policyNoteText}>
                {selectedHotel.policies.cancellation.description}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>From</Text>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceAmount}>
              ${selectedHotel.lowestPrice.amount}
            </Text>
            <Text style={styles.footerPriceNight}>/night</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleSelectRoom}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectButtonGradient}
          >
            <Text style={styles.selectButtonText}>Select Room</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Gallery
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  galleryActions: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Info Section
  infoSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  userRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  userRatingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  reviewCountText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  hotelName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  
  // Sections
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  amenityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  showMoreText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Policies
  policyCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  policyRow: {
    flexDirection: 'row',
  },
  policyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  policyInfo: {},
  policyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  policyValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  policyDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  policyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  policyNoteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  footerPriceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  footerPriceNight: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  selectButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
