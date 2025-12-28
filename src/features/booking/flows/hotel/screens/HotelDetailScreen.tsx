/**
 * HOTEL DETAIL SCREEN
 * 
 * Detailed view of selected hotel with gallery, amenities, rooms.
 * Placeholder - to be fully implemented.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import {
  ArrowLeft,
  Heart,
  Share,
  Star1,
  Location,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Room } from '../../../types/hotel.types';
import RoomCard from '../components/RoomCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelDetailScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function HotelDetailScreen({
  onContinue,
  onBack,
}: HotelDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { selectedHotel, selectedRoom, selectRoom, getNights } = useHotelStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollY = useSharedValue(0);

  // Animated header style - shows background when scrolled past image
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [180, 250], [0, 1], 'clamp');
    return {
      backgroundColor: `rgba(248, 249, 250, ${opacity})`,
    };
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  if (!selectedHotel) return null;

  const nights = getNights();

  const handleSelectRoom = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectRoom(room);
  };

  const handleContinue = () => {
    if (!selectedRoom) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

  // Amenity colors mapping
  const amenityColors: Record<string, { bg: string; text: string }> = {
    'Free WiFi': { bg: '#EEF2FF', text: '#6366F1' },
    'WiFi': { bg: '#EEF2FF', text: '#6366F1' },
    'Air Conditioning': { bg: '#FEF3C7', text: '#D97706' },
    'Flat-screen TV': { bg: '#DCFCE7', text: '#16A34A' },
    'TV': { bg: '#DCFCE7', text: '#16A34A' },
    'Free Parking': { bg: '#FCE7F3', text: '#DB2777' },
    'Parking': { bg: '#FCE7F3', text: '#DB2777' },
    'Pool': { bg: '#DBEAFE', text: '#3B82F6' },
    'Spa': { bg: '#F3E8FF', text: '#9333EA' },
    'Gym': { bg: '#FEE2E2', text: '#DC2626' },
    'Restaurant': { bg: '#FFEDD5', text: '#EA580C' },
    'Concierge': { bg: '#E0E7FF', text: '#4F46E5' },
    'Business Center': { bg: '#F1F5F9', text: '#475569' },
    'In-room Safe': { bg: '#ECFDF5', text: '#059669' },
  };

  const getAmenityColor = (name: string) => {
    return amenityColors[name] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <Animated.View style={[styles.fixedHeader, { paddingTop: insets.top + spacing.sm }, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fixedHeaderButton}
          onPress={onBack}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.fixedHeaderActions}>
          <TouchableOpacity
            style={styles.fixedHeaderButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart
              size={22}
              color={isFavorite ? colors.error : colors.textPrimary}
              variant={isFavorite ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fixedHeaderButton}>
            <Share size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
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
        </View>

        {/* Hotel Info */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoSection}>
          {/* Star Rating */}
          <View style={styles.starRow}>
            {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
              <Star1 key={i} size={16} color={colors.warning} variant="Bold" />
            ))}
          </View>

          {/* Name */}
          <Text style={styles.hotelName}>{selectedHotel.name}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Location size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{selectedHotel.location.address}</Text>
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingValue}>{selectedHotel.userRating.toFixed(1)}</Text>
            </View>
            <Text style={styles.ratingText}>
              Excellent · {selectedHotel.reviewCount} reviews
            </Text>
          </View>
        </Animated.View>

        {/* Amenities */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {selectedHotel.amenities.slice(0, 8).map((amenity) => (
              <View key={amenity.id} style={styles.amenityItem}>
                <TickCircle size={20} color={colors.success} variant="Bold" />
                <Text style={styles.amenityText}>{amenity.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Room Selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Select Room</Text>
          {selectedHotel.rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              nights={nights}
              isSelected={selectedRoom?.id === room.id}
              onSelect={() => handleSelectRoom(room)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      {selectedRoom && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.priceInfo}>
            <Text style={styles.totalLabel}>{nights} nights</Text>
            <Text style={styles.totalPrice}>
              ${selectedRoom.price.amount * nights}
            </Text>
          </View>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 100,
  },
  fixedHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fixedHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  galleryContainer: {
    height: 280,
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
  },
  actionButtons: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  infoSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing.sm,
  },
  hotelName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  ratingValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '50%',
    paddingVertical: spacing.sm,
  },
  amenityText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadows.lg,
  },
  priceInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
