/**
 * ROOM CARD
 *
 * Card displaying a room option for selection.
 * Fully theme-aware — no hardcoded colors.
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
import { spacing, typography, borderRadius as br } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Room } from '../../../types/hotel.types';

interface RoomCardProps {
  room: Room;
  nights: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RoomCard({ room, nights, isSelected, onSelect }: RoomCardProps) {
  const { colors: tc } = useTheme();
  const priceAmount = typeof room.price === 'object' ? room.price?.amount : (room.price || 0);
  const totalPrice = (priceAmount || 0) * nights;

  const images = room.images || [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400';

  const bedConfiguration = room.bedConfiguration || [];
  const bedConfig = bedConfiguration.length > 0
    ? bedConfiguration.map(b => `${b.count} ${b.type}`).join(', ')
    : 'Standard bed';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
        isSelected && { borderColor: tc.primary, borderWidth: 2, backgroundColor: `${tc.primary}05` },
      ]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: tc.textPrimary }]}>{room.name}</Text>
          {isSelected && <TickCircle size={24} color={tc.primary} variant="Bold" />}
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <People size={14} color={tc.textSecondary} />
            <Text style={[styles.detailText, { color: tc.textSecondary }]}>
              Up to {typeof room.maxOccupancy === 'object' ? (room.maxOccupancy?.total || room.maxOccupancy?.adults || 2) : (room.maxOccupancy || 2)} guests
            </Text>
          </View>
          {room.size ? (
            <View style={styles.detail}>
              <Maximize size={14} color={tc.textSecondary} />
              <Text style={[styles.detailText, { color: tc.textSecondary }]}>{room.size} m²</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.bedConfig, { color: tc.textSecondary }]}>{bedConfig}</Text>

        <View style={styles.tagsRow}>
          {room.breakfast === 'included' && (
            <View style={[styles.tagBadge, { backgroundColor: `${tc.success}15` }]}>
              <Coffee size={12} color={tc.success} />
              <Text style={[styles.tagText, { color: tc.success }]}>Breakfast included</Text>
            </View>
          )}
          {room.refundable && (
            <View style={[styles.tagBadge, { backgroundColor: `${tc.primary}15` }]}>
              <TickCircle size={12} color={tc.primary} variant="Bold" />
              <Text style={[styles.tagText, { color: tc.primary }]}>Free cancellation</Text>
            </View>
          )}
        </View>

        <View style={[styles.priceRow, { borderTopColor: tc.borderSubtle }]}>
          <View>
            <Text style={[styles.price, { color: tc.primary }]}>
              ${Math.round(priceAmount).toLocaleString('en-US')}
              <Text style={[styles.priceUnit, { color: tc.textSecondary }]}>/night</Text>
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabel, { color: tc.textSecondary }]}>{nights} nights total</Text>
            <Text style={[styles.totalPrice, { color: tc.textPrimary }]}>${Math.round(totalPrice).toLocaleString('en-US')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: br.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 120 },
  content: { padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  detailsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: typography.fontSize.sm },
  bedConfig: { fontSize: typography.fontSize.sm, marginBottom: spacing.sm },
  tagsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: br.sm,
  },
  tagText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  totalContainer: { alignItems: 'flex-end' },
  totalLabel: { fontSize: typography.fontSize.xs, marginBottom: 2 },
  totalPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});
