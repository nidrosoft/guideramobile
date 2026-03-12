/**
 * HOTEL DETAIL SCREEN
 *
 * Detailed view of selected hotel with gallery, amenities, rooms,
 * and a "Book on Provider" button at the bottom.
 * All colors are theme-aware (dark/light mode), no hardcoded hex.
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
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import {
  ArrowLeft,
  Heart,
  Share,
  Star1,
  Location,
  TickCircle,
  Coffee,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius as br } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Room } from '../../../types/hotel.types';
import RoomCard from '../components/RoomCard';
import { BookOnProviderButton } from '../../../components/shared';
import { useDealRedirect } from '@/hooks/useDeals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HotelDetailScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function HotelDetailScreen({ onContinue, onBack }: HotelDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: tc } = useTheme();
  const { user } = useAuth();
  const { selectedHotel, selectedRoom, selectRoom, getNights } = useHotelStore();
  const { redirect } = useDealRedirect();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollY = useSharedValue(0);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [180, 250], [0, 1], 'clamp'),
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  if (!selectedHotel) return null;

  const nights = getNights();
  const provider = selectedHotel.provider?.code || 'google_hotels';
  const deepLink = selectedHotel.deepLink || '';

  const handleSelectRoom = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectRoom(room);
  };

  const handleBookOnProvider = async () => {
    if (!selectedHotel) return;
    const totalPrice = selectedRoom
      ? (typeof selectedRoom.price === 'object' ? selectedRoom.price?.amount || 0 : selectedRoom.price || 0) * nights
      : (selectedHotel as any)?.lowestPrice?.amount || (selectedHotel.pricePerNight?.amount || 0) * nights;

    await redirect({
      deal_type: 'hotel',
      provider,
      affiliate_url: deepLink,
      deal_snapshot: {
        title: selectedHotel.name,
        subtitle: selectedHotel.location?.address || '',
        provider: { code: provider, name: selectedHotel.provider?.name || provider },
        price: { amount: totalPrice, currency: 'USD', formatted: `$${totalPrice}` },
        hotel: {
          name: selectedHotel.name,
          starRating: selectedHotel.starRating,
          address: selectedHotel.location?.address || '',
          checkIn: '',
          checkOut: '',
          nights,
          roomType: selectedRoom?.name,
          amenities: selectedHotel.amenities?.map((a: any) => a.name || a) || [],
        },
      },
      price_amount: totalPrice,
      source: 'search',
      deep_link: deepLink,
      destination: selectedHotel.location?.city || selectedHotel.name,
    });
  };

  const lowestPrice = selectedRoom
    ? (typeof selectedRoom.price === 'object' ? selectedRoom.price?.amount || 0 : selectedRoom.price || 0) * nights
    : (selectedHotel.pricePerNight?.amount || 0) * nights;

  return (
    <View style={[localStyles.container, { backgroundColor: tc.background }]}>
      {/* Fixed Header (visible on scroll) */}
      <Animated.View style={[localStyles.fixedHeader, { paddingTop: insets.top + spacing.xs, backgroundColor: tc.background }, headerAnimatedStyle]}>
        <TouchableOpacity style={[localStyles.headerBtn, { backgroundColor: tc.bgElevated }]} onPress={onBack}>
          <ArrowLeft size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <View style={localStyles.fixedHeaderActions}>
          <TouchableOpacity
            style={[localStyles.headerBtn, { backgroundColor: tc.bgElevated }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsFavorite(!isFavorite); }}
          >
            <Heart size={20} color={isFavorite ? tc.error : tc.textPrimary} variant={isFavorite ? 'Bold' : 'Linear'} />
          </TouchableOpacity>
          <TouchableOpacity style={[localStyles.headerBtn, { backgroundColor: tc.bgElevated }]}>
            <Share size={20} color={tc.textPrimary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={localStyles.galleryContainer}>
          <FlatList
            data={selectedHotel.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={localStyles.galleryImage} resizeMode="cover" />
            )}
            keyExtractor={(item) => item.id}
          />
          <View style={localStyles.imageIndicators}>
            {selectedHotel.images.map((_, i) => (
              <View key={i} style={[localStyles.indicator, { backgroundColor: i === currentImageIndex ? tc.bgElevated : 'rgba(255,255,255,0.45)' }, i === currentImageIndex && localStyles.indicatorActive]} />
            ))}
          </View>
        </View>

        {/* Hotel Info Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={[localStyles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Text style={[localStyles.hotelName, { color: tc.textPrimary }]}>{selectedHotel.name}</Text>

          <View style={localStyles.locationRow}>
            <Location size={16} color={tc.textSecondary} />
            <Text style={[localStyles.locationText, { color: tc.textSecondary }]}>
              {typeof selectedHotel.location.city === 'string' ? selectedHotel.location.city : ''}
              {!selectedHotel.location.city && (typeof selectedHotel.location.address === 'string' ? selectedHotel.location.address : (selectedHotel.location.address as any)?.formatted || '')}
            </Text>
          </View>

          <View style={localStyles.ratingRow}>
            <View style={[localStyles.ratingBadge, { backgroundColor: tc.primary }]}>
              <Text style={localStyles.ratingValue}>{selectedHotel.userRating.toFixed(1)}</Text>
            </View>
            <Text style={[localStyles.ratingLabel, { color: tc.textSecondary }]}>
              {selectedHotel.userRating >= 4.5 ? 'Excellent' : selectedHotel.userRating >= 4 ? 'Very Good' : 'Good'} · {selectedHotel.reviewCount} reviews
            </Text>
          </View>
        </Animated.View>

        {/* Check-in / Check-out Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={[localStyles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Text style={[localStyles.sectionTitle, { color: tc.textPrimary }]}>Hotel Policies</Text>
          <View style={localStyles.policiesGrid}>
            <View style={[localStyles.policyItem, { backgroundColor: `${tc.primary}08` }]}>
              <View style={[localStyles.policyIcon, { backgroundColor: `${tc.primary}15` }]}>
                <ArrowLeft size={18} color={tc.primary} style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
              <View>
                <Text style={[localStyles.policyLabel, { color: tc.textSecondary }]}>Check-in</Text>
                <Text style={[localStyles.policyValue, { color: tc.textPrimary }]}>
                  {(selectedHotel.policies?.checkIn as any)?.time || selectedHotel.policies?.checkIn?.from || '15:00'}
                </Text>
              </View>
            </View>
            <View style={[localStyles.policyItem, { backgroundColor: `${tc.primary}08` }]}>
              <View style={[localStyles.policyIcon, { backgroundColor: `${tc.primary}15` }]}>
                <ArrowLeft size={18} color={tc.primary} style={{ transform: [{ rotate: '-135deg' }] }} />
              </View>
              <View>
                <Text style={[localStyles.policyLabel, { color: tc.textSecondary }]}>Check-out</Text>
                <Text style={[localStyles.policyValue, { color: tc.textPrimary }]}>
                  {(selectedHotel.policies?.checkOut as any)?.time || selectedHotel.policies?.checkOut?.until || '11:00'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Amenities Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[localStyles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Text style={[localStyles.sectionTitle, { color: tc.textPrimary }]}>Amenities</Text>
          <View style={localStyles.amenitiesGrid}>
            {selectedHotel.amenities.slice(0, 8).map((amenity) => (
              <View key={amenity.id} style={localStyles.amenityItem}>
                <TickCircle size={20} color={tc.success} variant="Bold" />
                <Text style={[localStyles.amenityText, { color: tc.textPrimary }]}>{amenity.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Room Selection Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[localStyles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
          <Text style={[localStyles.sectionTitle, { color: tc.textPrimary }]}>Select Room</Text>
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

      {/* Footer — always visible with booking link */}
      <View style={[localStyles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: tc.bgElevated, borderTopColor: tc.borderSubtle }]}>
        <View style={localStyles.priceInfo}>
          <Text style={[localStyles.footerLabel, { color: tc.textSecondary }]}>{nights} night{nights > 1 ? 's' : ''}</Text>
          <Text style={[localStyles.footerPrice, { color: tc.textPrimary }]}>
            ${lowestPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <BookOnProviderButton
            provider={provider}
            onPress={handleBookOnProvider}
          />
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },

  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 100,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  fixedHeaderActions: { flexDirection: 'row', gap: spacing.sm },

  galleryContainer: { height: 280, position: 'relative' },
  galleryImage: { width: SCREEN_WIDTH, height: 280 },
  imageIndicators: {
    position: 'absolute', bottom: spacing.md, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  indicator: { width: 8, height: 8, borderRadius: 4 },
  indicatorActive: { width: 24 },

  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: br['2xl'],
    borderWidth: 1.5,
  },

  hotelName: {
    fontFamily: 'HostGrotesk-Bold',
    fontSize: typography.fontSize['2xl'],
    marginBottom: spacing.xs,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  locationText: { fontSize: typography.fontSize.sm, flex: 1 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: br.sm },
  ratingValue: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#fff' },
  ratingLabel: { fontSize: typography.fontSize.sm },

  sectionTitle: { fontFamily: 'Rubik-SemiBold', fontSize: typography.fontSize.lg, marginBottom: spacing.md },

  policiesGrid: { flexDirection: 'row', gap: spacing.md },
  policyItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: br.lg, gap: spacing.sm },
  policyIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  policyLabel: { fontSize: typography.fontSize.xs, marginBottom: 2 },
  policyValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '50%', paddingVertical: spacing.sm },
  amenityText: { fontSize: typography.fontSize.base },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  priceInfo: { flex: 1 },
  footerLabel: { fontSize: typography.fontSize.sm },
  footerPrice: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
});
