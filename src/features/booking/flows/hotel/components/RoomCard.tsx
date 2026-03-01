/**
 * ROOM CARD
 * 
 * Card displaying room type for selection
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TickCircle, People, Maximize, Coffee } from 'iconsax-react-native';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { Room } from '../../../types/hotel.types';

interface RoomCardProps {
  room: Room;
  nights: number;
  isSelected: boolean;
  onSelect: () => void;
}

// Amenity colors mapping
const amenityColors: Record<string, { bg: string; text: string }> = {
  'WiFi': { bg: '#EEF2FF', text: '#6366F1' },
  'TV': { bg: '#DCFCE7', text: '#16A34A' },
  'Air Conditioning': { bg: '#FEF3C7', text: '#D97706' },
  'Mini Bar': { bg: '#FCE7F3', text: '#DB2777' },
  'Safe': { bg: '#ECFDF5', text: '#059669' },
  'Balcony': { bg: '#DBEAFE', text: '#3B82F6' },
  'Ocean View': { bg: '#E0E7FF', text: '#4F46E5' },
  'City View': { bg: '#F1F5F9', text: '#475569' },
  'Bathtub': { bg: '#F3E8FF', text: '#9333EA' },
  'Shower': { bg: '#CFFAFE', text: '#0891B2' },
};

const getAmenityColor = (name: string) => {
  return amenityColors[name] || { bg: '#F3F4F6', text: '#6B7280' };
};

export default function RoomCard({
  room,
  nights,
  isSelected,
  onSelect,
}: RoomCardProps) {
  // Safely access price - handle both object and number formats
  const priceAmount = typeof room.price === 'object' ? room.price?.amount : (room.price || 0);
  const totalPrice = (priceAmount || 0) * nights;
  
  // Safely access images
  const images = room.images || [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400';
  
  // Format bed configuration - handle undefined
  const bedConfiguration = room.bedConfiguration || [];
  const bedConfig = bedConfiguration.length > 0
    ? bedConfiguration.map(b => `${b.count} ${b.type}`).join(', ')
    : 'Standard bed';

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {/* Image */}
      <Image
        source={{ uri: mainImage }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{room.name}</Text>
          {isSelected && (
            <TickCircle size={24} color={colors.primary} variant="Bold" />
          )}
        </View>
        
        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <People size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>Up to {typeof room.maxOccupancy === 'object' ? (room.maxOccupancy?.total || room.maxOccupancy?.adults || 2) : (room.maxOccupancy || 2)} guests</Text>
          </View>
          {room.size ? (
            <View style={styles.detail}>
              <Maximize size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{room.size} m²</Text>
            </View>
          ) : null}
        </View>
        
        {/* Bed Config */}
        <Text style={styles.bedConfig}>{bedConfig}</Text>
        
        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          {(room.amenities || []).slice(0, 4).map((amenity, index) => {
            const colorScheme = getAmenityColor(amenity);
            return (
              <View 
                key={index} 
                style={[styles.amenityBadge, { backgroundColor: colorScheme.bg }]}
              >
                <Text style={[styles.amenityText, { color: colorScheme.text }]}>
                  {amenity}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Breakfast & Refund */}
        <View style={styles.tagsRow}>
          {room.breakfast === 'included' && (
            <View style={styles.tagBadge}>
              <Coffee size={12} color={colors.success} />
              <Text style={styles.tagText}>Breakfast included</Text>
            </View>
          )}
          {room.refundable && (
            <View style={[styles.tagBadge, styles.refundBadge]}>
              <Text style={styles.refundText}>Free cancellation</Text>
            </View>
          )}
        </View>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>
              ${Math.round(priceAmount)}
              <Text style={styles.priceUnit}>/night</Text>
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{nights} nights total</Text>
            <Text style={styles.totalPrice}>${Math.round(totalPrice)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  containerSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  image: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bedConfig: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  amenityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  amenityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
  },
  refundBadge: {
    backgroundColor: '#DBEAFE',
  },
  refundText: {
    fontSize: typography.fontSize.xs,
    color: '#3B82F6',
    fontWeight: typography.fontWeight.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
