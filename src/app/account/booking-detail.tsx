/**
 * BOOKING DETAIL SCREEN
 * 
 * Detailed view of a single booking with all information.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Airplane, 
  Building, 
  Car, 
  Activity,
  TicketStar,
  Calendar,
  Location,
  User,
  Clock,
  Receipt1,
  Call,
  Sms,
  Copy,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { bookingService, Booking, BookingType, BookingStatus } from '@/services/booking.service';

const TYPE_ICONS: Record<BookingType, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  experience: Activity,
  package: TicketStar,
};

const TYPE_COLORS: Record<BookingType, string> = {
  flight: colors.info,
  hotel: colors.primary,
  car: colors.warning,
  experience: colors.success,
  package: colors.error,
};

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100' },
  confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  completed: { bg: '#E3F2FD', text: '#1565C0' },
  refunded: { bg: '#F3E5F5', text: '#7B1FA2' },
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    
    try {
      const { data, error } = await bookingService.getBookingById(id);
      
      if (error) {
        console.error('Error fetching booking:', error);
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
        return;
      }
      
      setBooking(data);
    } catch (error) {
      console.error('Error in fetchBooking:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCopyReference = async () => {
    if (!booking?.reference_number) return;
    await Clipboard.setStringAsync(booking.reference_number);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Reference number copied to clipboard');
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backLink} onPress={handleBack}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const TypeIcon = TYPE_ICONS[booking.type] || TicketStar;
  const typeColor = TYPE_COLORS[booking.type] || colors.primary;
  const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.typeIconLarge, { backgroundColor: `${typeColor}15` }]}>
            <TypeIcon size={32} color={typeColor} variant="Bold" />
          </View>
          <Text style={styles.bookingType}>
            {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking
          </Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusTextLarge, { color: statusStyle.text }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Reference Number */}
        <View style={styles.referenceCard}>
          <View style={styles.referenceLeft}>
            <Text style={styles.referenceLabel}>Booking Reference</Text>
            <Text style={styles.referenceNumber}>{booking.reference_number}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyReference}>
            <Copy size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Booking Details Based on Type */}
        {booking.type === 'flight' && booking.flight_booking && (
          <FlightDetails 
            flight={booking.flight_booking} 
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {booking.type === 'hotel' && booking.hotel_booking && (
          <HotelDetails 
            hotel={booking.hotel_booking}
            formatDate={formatDate}
          />
        )}

        {booking.type === 'car' && booking.car_booking && (
          <CarDetails 
            car={booking.car_booking}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}

        {booking.type === 'experience' && booking.experience_booking && (
          <ExperienceDetails 
            experience={booking.experience_booking}
            formatDate={formatDate}
          />
        )}

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(booking.subtotal, booking.currency)}
              </Text>
            </View>
            {booking.taxes > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & Fees</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency(booking.taxes + booking.fees, booking.currency)}
                </Text>
              </View>
            )}
            {booking.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>
                  -{formatCurrency(booking.discount, booking.currency)}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(booking.total, booking.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Calendar size={18} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Booked on</Text>
              <Text style={styles.infoValue}>{formatDate(booking.booked_at)}</Text>
            </View>
            {booking.provider && (
              <View style={styles.infoRow}>
                <Receipt1 size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Provider</Text>
                <Text style={styles.infoValue}>{booking.provider}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Receipt1 size={18} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Payment Status</Text>
              <Text style={styles.infoValue}>
                {booking.payment_status?.charAt(0).toUpperCase() + booking.payment_status?.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.supportCard}>
            <TouchableOpacity style={styles.supportButton}>
              <Call size={20} color={colors.primary} />
              <Text style={styles.supportButtonText}>Call Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportButton}>
              <Sms size={20} color={colors.primary} />
              <Text style={styles.supportButtonText}>Chat with Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Flight Details Component
function FlightDetails({ flight, formatDate, formatTime }: any) {
  const outbound = flight.outbound_flight;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Flight Details</Text>
      <View style={styles.detailCard}>
        {outbound && (
          <>
            <View style={styles.flightRoute}>
              <View style={styles.flightCity}>
                <Text style={styles.cityCode}>{outbound.departure?.code || 'DEP'}</Text>
                <Text style={styles.cityName}>{outbound.departure?.city || 'Origin'}</Text>
              </View>
              <View style={styles.flightLine}>
                <Airplane size={20} color={colors.primary} />
              </View>
              <View style={styles.flightCity}>
                <Text style={styles.cityCode}>{outbound.arrival?.code || 'ARR'}</Text>
                <Text style={styles.cityName}>{outbound.arrival?.city || 'Destination'}</Text>
              </View>
            </View>
            <View style={styles.flightInfo}>
              <View style={styles.flightInfoItem}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={styles.flightInfoText}>
                  {outbound.departure?.date ? formatDate(outbound.departure.date) : 'Date TBD'}
                </Text>
              </View>
              <View style={styles.flightInfoItem}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.flightInfoText}>
                  {outbound.departure?.time || 'Time TBD'}
                </Text>
              </View>
            </View>
          </>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Class</Text>
          <Text style={styles.detailValue}>{flight.cabin_class || 'Economy'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Passengers</Text>
          <Text style={styles.detailValue}>{flight.passengers?.length || 1}</Text>
        </View>
      </View>
    </View>
  );
}

// Hotel Details Component
function HotelDetails({ hotel, formatDate }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hotel Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.hotelName}>{hotel.hotel?.name || 'Hotel'}</Text>
        {hotel.hotel?.address && (
          <View style={styles.hotelAddress}>
            <Location size={16} color={colors.textSecondary} />
            <Text style={styles.addressText}>{hotel.hotel.address}</Text>
          </View>
        )}
        <View style={styles.dateRange}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Check-in</Text>
            <Text style={styles.dateValue}>{formatDate(hotel.check_in_date)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Check-out</Text>
            <Text style={styles.dateValue}>{formatDate(hotel.check_out_date)}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room Type</Text>
          <Text style={styles.detailValue}>{hotel.room?.name || 'Standard Room'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Guests</Text>
          <Text style={styles.detailValue}>{hotel.guests?.length || 1}</Text>
        </View>
      </View>
    </View>
  );
}

// Car Details Component
function CarDetails({ car, formatDate, formatTime }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Car Rental Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.carName}>{car.car?.name || 'Rental Car'}</Text>
        <View style={styles.locationRow}>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Pick-up</Text>
            <Text style={styles.locationValue}>
              {car.pickup_location?.name || 'Location TBD'}
            </Text>
            <Text style={styles.locationDate}>
              {formatDate(car.pickup_datetime)} • {formatTime(car.pickup_datetime)}
            </Text>
          </View>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Drop-off</Text>
            <Text style={styles.locationValue}>
              {car.dropoff_location?.name || 'Location TBD'}
            </Text>
            <Text style={styles.locationDate}>
              {formatDate(car.dropoff_datetime)} • {formatTime(car.dropoff_datetime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Experience Details Component
function ExperienceDetails({ experience, formatDate }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Experience Details</Text>
      <View style={styles.detailCard}>
        <Text style={styles.experienceName}>
          {experience.experience?.name || 'Experience'}
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formatDate(experience.date)}</Text>
        </View>
        {experience.time_slot && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{experience.time_slot}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Participants</Text>
          <Text style={styles.detailValue}>{experience.participants?.length || 1}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backLink: {
    padding: spacing.md,
  },
  backLinkText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingType: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusBadgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusTextLarge: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  referenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  referenceLeft: {
    flex: 1,
  },
  referenceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  referenceNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  copyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  discountValue: {
    color: colors.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
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
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  supportCard: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  supportButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  // Flight specific styles
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: spacing.md,
  },
  flightCity: {
    alignItems: 'center',
  },
  cityCode: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  cityName: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flightLine: {
    flex: 1,
    alignItems: 'center',
  },
  flightInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  flightInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flightInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  // Hotel specific styles
  hotelName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hotelAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  dateRange: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  // Car specific styles
  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  locationRow: {
    gap: spacing.md,
  },
  locationItem: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  locationDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Experience specific styles
  experienceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});
