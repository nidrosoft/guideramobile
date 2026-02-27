/**
 * MY BOOKINGS SCREEN
 * 
 * User's flight, hotel, car, and experience bookings.
 * Organized by upcoming and past with status indicators.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Airplane, 
  Building, 
  Car, 
  Activity,
  Calendar,
  TicketStar,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { bookingService, Booking, BookingType, BookingStatus } from '@/services/booking.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

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

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        bookingService.getUpcomingBookings(user.id),
        bookingService.getPastBookings(user.id),
      ]);
      
      if (upcomingRes.data) setUpcomingBookings(upcomingRes.data);
      if (pastRes.data) setPastBookings(pastRes.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBookingPress = (booking: Booking) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/account/booking-detail',
      params: { id: booking.id },
    } as any);
  };

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const getBookingTitle = (booking: Booking): string => {
    switch (booking.type) {
      case 'flight':
        const flight = booking.flight_booking;
        if (flight?.outbound_flight) {
          return `${flight.outbound_flight.departure?.city || 'Origin'} → ${flight.outbound_flight.arrival?.city || 'Destination'}`;
        }
        return 'Flight Booking';
      case 'hotel':
        return booking.hotel_booking?.hotel?.name || 'Hotel Booking';
      case 'car':
        return booking.car_booking?.car?.name || 'Car Rental';
      case 'experience':
        return booking.experience_booking?.experience?.name || 'Experience';
      case 'package':
        return 'Travel Package';
      default:
        return 'Booking';
    }
  };

  const getBookingSubtitle = (booking: Booking): string => {
    switch (booking.type) {
      case 'flight':
        const flight = booking.flight_booking;
        if (flight?.outbound_flight?.departure?.date) {
          return formatDate(flight.outbound_flight.departure.date);
        }
        return booking.reference_number;
      case 'hotel':
        const hotel = booking.hotel_booking;
        if (hotel?.check_in_date) {
          return `${formatDate(hotel.check_in_date)} - ${formatDate(hotel.check_out_date)}`;
        }
        return booking.reference_number;
      case 'car':
        const car = booking.car_booking;
        if (car?.pickup_datetime) {
          return formatDate(car.pickup_datetime);
        }
        return booking.reference_number;
      case 'experience':
        const exp = booking.experience_booking;
        if (exp?.date) {
          return formatDate(exp.date);
        }
        return booking.reference_number;
      default:
        return booking.reference_number;
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              activeTab === tab.value && styles.tabActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.value as 'upcoming' | 'past');
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.value && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {tab.value === 'upcoming' && upcomingBookings.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{upcomingBookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : currentBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <TicketStar size={48} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? 'Your upcoming trips will appear here'
                : 'Your completed trips will appear here'}
            </Text>
          </View>
        ) : (
          currentBookings.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              title={getBookingTitle(booking)}
              subtitle={getBookingSubtitle(booking)}
              onPress={() => handleBookingPress(booking)}
              formatCurrency={formatCurrency}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Booking Card Component
interface BookingCardProps {
  booking: Booking;
  title: string;
  subtitle: string;
  onPress: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

function BookingCard({ booking, title, subtitle, onPress, formatCurrency }: BookingCardProps) {
  const TypeIcon = TYPE_ICONS[booking.type] || TicketStar;
  const typeColor = TYPE_COLORS[booking.type] || colors.primary;
  const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
          <TypeIcon size={20} color={typeColor} variant="Bold" />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{subtitle}</Text>
        </View>
        <Text style={styles.refNumber}>#{booking.reference_number}</Text>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.totalAmount}>
          {formatCurrency(booking.total, booking.currency)}
        </Text>
        <ArrowRight2 size={18} color={colors.gray400} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  refNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  totalAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
