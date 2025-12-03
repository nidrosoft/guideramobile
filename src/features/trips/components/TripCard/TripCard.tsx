/**
 * TRIP CARD COMPONENT
 * Displays a trip in the list view
 */

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Trip } from '../../types/trip.types';
import { TRIP_STATE_CONFIG } from '../../config/trip-states.config';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { Calendar, User, Moneys } from 'iconsax-react-native';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const stateConfig = TRIP_STATE_CONFIG[trip.state];
  const duration = Math.ceil(
    (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Cover Image */}
      <Image
        source={{ uri: trip.coverImage }}
        style={styles.coverImage}
        resizeMode="cover"
      />
      
      {/* State Badge */}
      <View style={[styles.stateBadge, { backgroundColor: stateConfig.color }]}>
        <Text style={styles.stateText}>{stateConfig.label}</Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {trip.title}
        </Text>
        
        {/* Destination */}
        <Text style={styles.destination} numberOfLines={1}>
          {trip.destination.city}, {trip.destination.country}
        </Text>
        
        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Dates */}
          <View style={styles.infoItem}>
            <Calendar size={16} color={colors.gray600} variant="Outline" />
            <Text style={styles.infoText}>
              {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          
          {/* Duration */}
          <Text style={styles.duration}>{duration}d</Text>
        </View>
        
        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          {/* Travelers */}
          <View style={styles.infoItem}>
            <User size={16} color={colors.gray600} variant="Outline" />
            <Text style={styles.infoText}>
              {trip.travelers.length || 1} {trip.travelers.length === 1 ? 'traveler' : 'travelers'}
            </Text>
          </View>
          
          {/* Budget */}
          {trip.budget && (
            <View style={styles.infoItem}>
              <Moneys size={16} color={colors.gray600} variant="Outline" />
              <Text style={styles.infoText}>
                {trip.budget.amount} {trip.budget.currency}
              </Text>
            </View>
          )}
        </View>
        
        {/* Bookings Count */}
        {trip.bookings.length > 0 && (
          <View style={styles.bookingsCount}>
            <Text style={styles.bookingsText}>
              {trip.bookings.length} {trip.bookings.length === 1 ? 'booking' : 'bookings'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray100,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  stateBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  destination: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  bookingsCount: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  bookingsText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
});
