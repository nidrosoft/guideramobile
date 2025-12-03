/**
 * ROOM SELECTION STEP
 * 
 * Display available rooms for selection.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  TickCircle,
  People,
  Maximize,
  Coffee,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { Room } from '../../../types/hotel.types';

interface RoomSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function RoomSelectionStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: RoomSelectionStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedHotel, selectedRoom, selectRoom, getNights } = useHotelStore();
  
  if (!selectedHotel) return null;
  
  const nights = getNights();
  
  const handleSelectRoom = useCallback((room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectRoom(room);
  }, [selectRoom]);
  
  const handleContinue = () => {
    if (!selectedRoom) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Choose Your Room</Text>
          <Text style={styles.subtitle}>
            {selectedHotel.rooms.length} room types available
          </Text>
        </Animated.View>
        
        {selectedHotel.rooms.map((room, index) => (
          <Animated.View
            key={room.id}
            entering={FadeInDown.duration(400).delay(100 + index * 80)}
          >
            <RoomCard
              room={room}
              nights={nights}
              isSelected={selectedRoom?.id === room.id}
              onSelect={() => handleSelectRoom(room)}
            />
          </Animated.View>
        ))}
      </ScrollView>
      
      {/* Footer */}
      {selectedRoom && (
        <Animated.View 
          entering={FadeInUp.duration(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.footerInfo}>
            <Text style={styles.footerRoomName}>{selectedRoom.name}</Text>
            <Text style={styles.footerPrice}>
              ${selectedRoom.price.amount * nights} for {nights} night{nights > 1 ? 's' : ''}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ============================================
// ROOM CARD
// ============================================

interface RoomCardProps {
  room: Room;
  nights: number;
  isSelected: boolean;
  onSelect: () => void;
}

function RoomCard({ room, nights, isSelected, onSelect }: RoomCardProps) {
  const totalPrice = room.price.amount * nights;
  
  return (
    <TouchableOpacity
      style={[styles.roomCard, isSelected && styles.roomCardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Image */}
      <Image
        source={{ uri: room.images[0] }}
        style={styles.roomImage}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.roomContent}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{room.name}</Text>
          {isSelected && (
            <TickCircle size={24} color={colors.primary} variant="Bold" />
          )}
        </View>
        
        {/* Features */}
        <View style={styles.featuresRow}>
          <View style={styles.feature}>
            <People size={16} color={colors.textSecondary} />
            <Text style={styles.featureText}>Up to {room.maxOccupancy}</Text>
          </View>
          <View style={styles.feature}>
            <Maximize size={16} color={colors.textSecondary} />
            <Text style={styles.featureText}>{room.size} m²</Text>
          </View>
          {room.breakfast === 'included' && (
            <View style={styles.feature}>
              <Coffee size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.success }]}>
                Breakfast
              </Text>
            </View>
          )}
        </View>
        
        {/* Bed Config */}
        <Text style={styles.bedConfig}>
          {room.bedConfiguration.map(b => `${b.count} ${b.type} bed`).join(', ')}
        </Text>
        
        {/* Badges */}
        <View style={styles.badgesRow}>
          {room.refundable && (
            <View style={[styles.badge, styles.badgeSuccess]}>
              <Text style={styles.badgeTextSuccess}>Free Cancellation</Text>
            </View>
          )}
          {room.originalPrice && (
            <View style={[styles.badge, styles.badgeWarning]}>
              <Text style={styles.badgeTextWarning}>
                {Math.round((1 - room.price.amount / room.originalPrice.amount) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <View>
            {room.originalPrice && (
              <Text style={styles.originalPrice}>
                ${room.originalPrice.amount}
              </Text>
            )}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${room.price.amount}</Text>
              <Text style={styles.priceNight}>/night</Text>
            </View>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{nights} night{nights > 1 ? 's' : ''}</Text>
            <Text style={styles.totalPrice}>${totalPrice}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  
  // Room Card
  roomCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.md,
  },
  roomCardSelected: {
    borderColor: colors.primary,
  },
  roomImage: {
    width: '100%',
    height: 140,
  },
  roomContent: {
    padding: spacing.md,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roomName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bedConfig: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeSuccess: {
    backgroundColor: colors.success + '15',
  },
  badgeWarning: {
    backgroundColor: colors.warning + '15',
  },
  badgeTextSuccess: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  badgeTextWarning: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.md,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
    textDecorationLine: 'line-through',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceNight: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
  footerInfo: {
    flex: 1,
  },
  footerRoomName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footerPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
