/**
 * COMPREHENSIVE TRIP CARD
 * Rich trip card showing all bookings and details at a glance
 */

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Trip, BookingType } from '../../types/trip.types';
import { TRIP_STATE_CONFIG } from '../../config/trip-states.config';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { 
  Calendar, 
  User, 
  Moneys, 
  Airplane, 
  Building, 
  Car, 
  Location,
  Clock
} from 'iconsax-react-native';

interface ComprehensiveTripCardProps {
  trip: Trip;
  onPress: () => void;
}

export default function ComprehensiveTripCard({ trip, onPress }: ComprehensiveTripCardProps) {
  const { colors } = useTheme();
  const stateConfig = TRIP_STATE_CONFIG[trip.state];
  const duration = Math.ceil(
    (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Group bookings by type
  const flights = trip.bookings.filter(b => b.type === BookingType.FLIGHT);
  const hotels = trip.bookings.filter(b => b.type === BookingType.HOTEL);
  const cars = trip.bookings.filter(b => b.type === BookingType.CAR_RENTAL);
  const activities = trip.bookings.filter(b => b.type === BookingType.ACTIVITY);

  // Calculate days until trip
  const daysUntil = Math.ceil(
    (trip.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle }]}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bgCard }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Cover Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
        <Image
          source={{ uri: trip.coverImage }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />
        
        {/* State Badge */}
        <View style={[styles.stateBadge, { backgroundColor: stateConfig.color }]}>
          <Text style={styles.stateText}>{stateConfig.label}</Text>
        </View>

        {/* Days Until Badge (for upcoming trips) */}
        {daysUntil > 0 && daysUntil <= 30 && (
          <View style={styles.daysUntilBadge}>
            <Clock size={14} color={colors.white} variant="Bold" />
            <Text style={styles.daysUntilText}>
              {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
        
        {/* Title & Destination Overlay */}
        <View style={styles.titleOverlay}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {trip.title}
            </Text>
            {trip.budget && (
              <Text style={styles.priceOverlay}>
                ${trip.budget.amount.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={styles.destinationRow}>
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.destination} numberOfLines={1}>
              {trip.destination.city}, {trip.destination.country}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Content */}
      <View>
        {/* Date Range */}
        <View style={[styles.dateSection, { borderBottomColor: colors.borderSubtle }]}>
          <View style={styles.dateRow}>
            <Calendar size={18} color={colors.primary} variant="Bold" />
            <Text style={[styles.dateText, { color: colors.textPrimary }]}>
              {trip.startDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
              {' → '}
              {trip.endDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.durationText}>{duration} days</Text>
          </View>
        </View>

        {/* Bookings Summary */}
        {trip.bookings.length > 0 && (
          <View style={styles.bookingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bookings</Text>
            <View style={styles.bookingsGrid}>
              {/* Top Row: Flight, Hotel, Car */}
              <View style={styles.bookingsRow}>
                {/* Flights */}
                {flights.length > 0 && (
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Airplane size={18} color={colors.primary} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{flights.length}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {flights.length === 1 ? 'Flight' : 'Flights'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Hotels */}
                {hotels.length > 0 && (
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.success}15` }]}>
                      <Building size={18} color={colors.success} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{hotels.length}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {hotels.length === 1 ? 'Hotel' : 'Hotels'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Cars */}
                {cars.length > 0 && (
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.warning}15` }]}>
                      <Car size={18} color={colors.warning} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{cars.length}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {cars.length === 1 ? 'Car' : 'Cars'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Bottom Row: Activities, Travelers, Empty */}
              <View style={styles.bookingsRow}>
                {/* Activities */}
                {activities.length > 0 && (
                  <View style={styles.bookingItem}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.info}15` }]}>
                      <Location size={18} color={colors.info} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{activities.length}</Text>
                      <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                        {activities.length === 1 ? 'Activity' : 'Activities'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Travelers */}
                <View style={styles.bookingItem}>
                  <View style={[styles.bookingIcon, { backgroundColor: '#9333EA15' }]}>
                    <User size={18} color="#9333EA" variant="Bold" />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingCount, { color: colors.textPrimary }]}>{trip.travelers.length || 1}</Text>
                    <Text style={[styles.bookingLabel, { color: colors.textSecondary }]}>
                      {trip.travelers.length === 1 ? 'Traveler' : 'Travelers'}
                    </Text>
                  </View>
                </View>

                {/* Empty spacer for alignment */}
                <View style={styles.bookingItem} />
              </View>
            </View>
          </View>
        )}
      </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  stateBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stateText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysUntilBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  daysUntilText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  priceOverlay: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginLeft: spacing.sm,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  destination: {
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  durationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingsSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  bookingsGrid: {
    gap: spacing.lg,
  },
  bookingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: spacing.xs,
    width: '31%',
  },
  bookingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: {
    gap: 2,
  },
  bookingCount: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  bookingLabel: {
    fontSize: typography.fontSize.xs,
  },
});
