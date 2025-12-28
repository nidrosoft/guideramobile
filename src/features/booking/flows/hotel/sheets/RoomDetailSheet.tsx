/**
 * ROOM DETAIL SHEET
 * 
 * Bottom sheet showing detailed room information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloseCircle,
  TickCircle,
  People,
  Maximize,
  Coffee,
} from 'iconsax-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Room } from '../../../types/hotel.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RoomDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  room: Room | null;
  nights: number;
  onSelect: () => void;
}

export default function RoomDetailSheet({
  visible,
  onClose,
  room,
  nights,
  onSelect,
}: RoomDetailSheetProps) {
  const insets = useSafeAreaInsets();

  if (!room) return null;

  const totalPrice = room.price.amount * nights;
  const bedConfig = room.bedConfiguration
    .map(b => `${b.count} ${b.type} bed${b.count > 1 ? 's' : ''}`)
    .join(', ');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Room Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Room Image */}
          <Image
            source={{ uri: room.images[0] || 'https://via.placeholder.com/400x200' }}
            style={styles.roomImage}
            resizeMode="cover"
          />

          {/* Room Info */}
          <View style={styles.infoSection}>
            <Text style={styles.roomName}>{room.name}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detail}>
                <People size={18} color={colors.textSecondary} />
                <Text style={styles.detailText}>Up to {room.maxOccupancy} guests</Text>
              </View>
              <View style={styles.detail}>
                <Maximize size={18} color={colors.textSecondary} />
                <Text style={styles.detailText}>{room.size} m²</Text>
              </View>
            </View>

            <Text style={styles.bedConfig}>{bedConfig}</Text>
            
            {room.view && (
              <Text style={styles.viewText}>{room.view} view</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{room.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {room.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <TickCircle size={16} color={colors.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Policies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policies</Text>
            
            <View style={styles.policyRow}>
              <View style={[styles.policyBadge, room.refundable && styles.policyBadgeGreen]}>
                <Text style={[styles.policyText, room.refundable && styles.policyTextGreen]}>
                  {room.refundable ? 'Free Cancellation' : 'Non-refundable'}
                </Text>
              </View>
            </View>

            {room.breakfast === 'included' && (
              <View style={styles.policyRow}>
                <View style={[styles.policyBadge, styles.policyBadgeGreen]}>
                  <Coffee size={14} color={colors.success} />
                  <Text style={[styles.policyText, styles.policyTextGreen]}>
                    Breakfast Included
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.cancellationText}>{room.cancellationPolicy}</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>{nights} night{nights > 1 ? 's' : ''}</Text>
            <Text style={styles.totalPrice}>${totalPrice}</Text>
          </View>
          <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectGradient}
            >
              <Text style={styles.selectText}>Select Room</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  roomImage: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  infoSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  roomName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bedConfig: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  viewText: {
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
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '45%',
  },
  amenityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  policyRow: {
    marginBottom: spacing.sm,
  },
  policyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  policyBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  policyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  policyTextGreen: {
    color: colors.success,
  },
  cancellationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
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
