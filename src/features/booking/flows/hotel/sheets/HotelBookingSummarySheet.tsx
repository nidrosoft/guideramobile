/**
 * HOTEL BOOKING SUMMARY SHEET
 * 
 * Bottom sheet showing booking summary details
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Calendar, People, Building, Star1 } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';

interface HotelBookingSummarySheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function HotelBookingSummarySheet({
  visible,
  onClose,
}: HotelBookingSummarySheetProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedHotel,
    selectedRoom,
    searchParams,
    getNights,
  } = useHotelStore();

  if (!selectedHotel || !selectedRoom) return null;

  const nights = getNights();

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    // Handle both Date objects and string dates (from persistence)
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          <Text style={styles.title}>Booking Summary</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseCircle size={28} color={colors.textSecondary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          {/* Hotel Card */}
          <View style={styles.hotelCard}>
            <Image
              source={{ uri: selectedHotel.images[0]?.url }}
              style={styles.hotelImage}
            />
            <View style={styles.hotelInfo}>
              <View style={styles.starRow}>
                {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
                  <Star1 key={i} size={12} color={colors.warning} variant="Bold" />
                ))}
              </View>
              <Text style={styles.hotelName}>{selectedHotel.name}</Text>
              <Text style={styles.hotelLocation}>
                {selectedHotel.location.city}, {selectedHotel.location.country}
              </Text>
            </View>
          </View>

          {/* Room Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Room</Text>
            </View>
            <Text style={styles.roomName}>{selectedRoom.name}</Text>
            <Text style={styles.roomDetails}>
              {selectedRoom.bedConfiguration.map(b => `${b.count} ${b.type}`).join(', ')}
              {' · '}{selectedRoom.size} m²
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Dates</Text>
            </View>
            <View style={styles.dateRow}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{formatDate(searchParams.checkIn)}</Text>
                <Text style={styles.dateTime}>From 3:00 PM</Text>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{formatDate(searchParams.checkOut)}</Text>
                <Text style={styles.dateTime}>Until 11:00 AM</Text>
              </View>
            </View>
            <View style={styles.nightsBadge}>
              <Text style={styles.nightsText}>{nights} night{nights > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Guests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <People size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Guests</Text>
            </View>
            <Text style={styles.guestsText}>
              {searchParams.guests.adults} adult{searchParams.guests.adults > 1 ? 's' : ''}
              {searchParams.guests.children > 0 && 
                `, ${searchParams.guests.children} child${searchParams.guests.children > 1 ? 'ren' : ''}`
              }
            </Text>
          </View>

          {/* Price Summary */}
          <View style={styles.priceSection}>
            <Text style={styles.priceSectionTitle}>Price Summary</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {selectedRoom.name} x {nights} night{nights > 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceValue}>
                ${selectedRoom.price.amount * nights}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes & Fees (12%)</Text>
              <Text style={styles.priceValue}>
                ${Math.round(selectedRoom.price.amount * nights * 0.12)}
              </Text>
            </View>

            <View style={styles.priceDivider} />

            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${Math.round(selectedRoom.price.amount * nights * 1.12)}
              </Text>
            </View>
          </View>
        </ScrollView>
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
  contentContainer: {
    padding: spacing.lg,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelInfo: {
    flex: 1,
    padding: spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  hotelName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  hotelLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  roomName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  roomDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dateTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  nightsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  nightsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  guestsText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  priceSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  priceSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
