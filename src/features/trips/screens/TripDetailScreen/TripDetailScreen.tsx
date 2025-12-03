import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, More, Calendar, User, Airplane, Building, Car, Location, CalendarEdit, Bag2, Book, ShieldTick, InfoCircle, SecuritySafe, DollarCircle } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { BookingType, FlightDetails, HotelDetails, CarRentalDetails, ActivityDetails } from '@/features/trips/types/trip.types';
import { BookingPassBottomSheet } from '@/features/trips/components/BookingPassBottomSheet';
import InviteTravelersBottomSheet from '@/features/trips/components/InviteTravelersBottomSheet';
import CircleButton from '@/components/atoms/CircleButton/CircleButton';
import { useToast } from '@/contexts/ToastContext';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.2;

interface TripDetailScreenProps {
  tripId: string;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TripDetailScreen({ tripId }: TripDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess } = useToast();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  const [selectedBooking, setSelectedBooking] = useState<{ id: string; type: BookingType; details: any; number: string; status: string } | null>(null);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const scrollOffset = useSharedValue(0);

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text>Trip not found</Text>
      </View>
    );
  }

  const flights = trip.bookings.filter(b => b.type === BookingType.FLIGHT);
  const hotels = trip.bookings.filter(b => b.type === BookingType.HOTEL);
  const cars = trip.bookings.filter(b => b.type === BookingType.CAR_RENTAL);
  const activities = trip.bookings.filter(b => b.type === BookingType.ACTIVITY);

  const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));

  const openBookingPass = (booking: any) => {
    setSelectedBooking({
      id: booking.id,
      type: booking.type,
      details: booking.details,
      number: booking.confirmationNumber || booking.id,
      status: booking.status,
    });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event: any) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollOffset.value,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.25],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity: interpolate(scrollOffset.value, [0, IMAGE_HEIGHT / 2, IMAGE_HEIGHT], [1, 0.8, 0.3], Extrapolate.CLAMP)
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, 100, 200],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    };
  });

  return (
    <View style={styles.container}>
      {/* Hero Image with Overlay - Both move together */}
      <Animated.View style={[styles.heroContainer, imageAnimatedStyle]}>
        <Animated.Image source={{ uri: trip.coverImage }} style={styles.heroImage} />
        
        {/* Gradient Overlay for Text Visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        />
        
        {/* Badge - Positioned independently */}
        <View style={styles.stateBadge}>
          <Text style={styles.stateBadgeText}>{trip.state.toUpperCase()}</Text>
        </View>
        
        {/* Hero Overlay - Moves with Image */}
        <View style={styles.heroOverlay}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle} numberOfLines={2}>{trip.title}</Text>
            {trip.budget && <Text style={styles.heroBudget}>${trip.budget.amount.toLocaleString()}</Text>}
          </View>
          <View style={styles.heroLocationRow}>
            <Location size={16} color={colors.white} variant="Bold" />
            <Text style={styles.heroLocation}>{trip.destination.city}, {trip.destination.country}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.dateCard}>
            <View style={styles.dateRow}>
              <Calendar size={20} color={colors.primary} variant="Bold" />
              <Text style={styles.dateText}>
                {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' → '}
                {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration} days</Text>
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
                <Calendar size={18} color={colors.info} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Trip Plan</Text>
              <Text style={styles.statValue}>{duration} Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Building size={18} color={colors.primary} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Bookings</Text>
              <Text style={styles.statValue}>{trip.bookings.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Bag2 size={18} color={colors.warning} variant="Bold" />
              </View>
              <Text style={styles.statLabel}>Packing List</Text>
              <Text style={styles.statValue}>45% / 100%</Text>
            </View>
          </View>

          {trip.bookings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bookings</Text>
              
              {flights.map(booking => {
                const details = booking.details as FlightDetails;
                return (
                  <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => openBookingPass(booking)} activeOpacity={0.7}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Airplane size={24} color={colors.primary} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingTitle}>{details.airline} {details.flightNumber}</Text>
                      <Text style={styles.bookingSubtitle}>{details.departure.airport} → {details.arrival.airport}</Text>
                      <Text style={styles.bookingDate}>
                        {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.bookingPrice}>
                      <Text style={styles.priceAmount}>{booking.price.currency} {booking.price.amount}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>{booking.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {hotels.map(booking => {
                const details = booking.details as HotelDetails;
                return (
                  <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => openBookingPass(booking)} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.success}15` }]}>
                        <Building size={24} color={colors.success} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle}>{details.name}</Text>
                        <Text style={styles.bookingSubtitle}>{details.roomType}</Text>
                        <Text style={styles.bookingDate}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {booking.endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={styles.priceAmount}>{booking.price.currency} {booking.price.amount}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                          <Text style={[styles.statusText, { color: colors.success }]}>{booking.status}</Text>
                        </View>
                      </View>
                  </TouchableOpacity>
                );
              })}

              {cars.map(booking => {
                const details = booking.details as CarRentalDetails;
                return (
                  <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => openBookingPass(booking)} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.warning}15` }]}>
                        <Car size={24} color={colors.warning} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle}>{details.carModel}</Text>
                        <Text style={styles.bookingSubtitle}>{details.company}</Text>
                        <Text style={styles.bookingDate}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {booking.endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={styles.priceAmount}>{booking.price.currency} {booking.price.amount}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                          <Text style={[styles.statusText, { color: colors.success }]}>{booking.status}</Text>
                        </View>
                      </View>
                  </TouchableOpacity>
                );
              })}

              {activities.map(booking => {
                const details = booking.details as ActivityDetails;
                return (
                  <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => openBookingPass(booking)} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.info}15` }]}>
                        <Location size={24} color={colors.info} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle}>{details.name}</Text>
                        <Text style={styles.bookingSubtitle}>{details.location.name}</Text>
                        <Text style={styles.bookingDate}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={styles.priceAmount}>{booking.price.currency} {booking.price.amount}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                          <Text style={[styles.statusText, { color: colors.success }]}>{booking.status}</Text>
                        </View>
                      </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Trip Hub */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Hub</Text>
            
            {/* 1. Trip Planner - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity 
                style={[styles.hubListCard, { borderColor: `${colors.primary}30` }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/planner/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <CalendarEdit size={28} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={styles.hubListTitle}>Trip Planner</Text>
                  <Text style={styles.hubListDescription}>Plan your days & activities</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* 2. Packing + Journal - Square Grid */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity 
                style={[styles.hubSquareCard, { borderColor: `${colors.warning}30` }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/packing/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.warning}15` }]}>
                  <Bag2 size={32} color={colors.warning} variant="Bold" />
                </View>
                <Text style={styles.hubSquareTitle}>Packing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.hubSquareCard, { borderColor: `${colors.info}30` }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/journal/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.info}15` }]}>
                  <Book size={32} color={colors.info} variant="Bold" />
                </View>
                <Text style={styles.hubSquareTitle}>Journal</Text>
              </TouchableOpacity>
            </View>
            
            {/* 3. Expense Tracker - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity 
                style={[styles.hubListCard, { borderColor: `${colors.success}30` }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/expenses/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `${colors.success}15` }]}>
                  <DollarCircle size={28} color={colors.success} variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={styles.hubListTitle}>Expense Tracker</Text>
                  <Text style={styles.hubListDescription}>Track spending & budget</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* 4. Compensation + Do's & Don'ts - Square Grid */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: `#8B5CF630` }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/compensation/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `#8B5CF615` }]}>
                  <ShieldTick size={32} color="#8B5CF6" variant="Bold" />
                </View>
                <Text style={styles.hubSquareTitle}>Compensation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: `#10B98130` }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/dos-donts/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `#10B98115` }]}>
                  <InfoCircle size={32} color="#10B981" variant="Bold" />
                </View>
                <Text style={styles.hubSquareTitle}>Do's & Don'ts</Text>
              </TouchableOpacity>
            </View>
            
            {/* 5. Safety - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity
                style={[styles.hubListCard, { borderColor: `#EF444430` }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/safety/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `#EF444415` }]}>
                  <SecuritySafe size={28} color="#EF4444" variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={styles.hubListTitle}>Safety</Text>
                  <Text style={styles.hubListDescription}>Emergency contacts & alerts</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Travelers ({trip.travelers.length})</Text>
              <TouchableOpacity
                style={styles.inviteButtonContainer}
                onPress={() => setInviteSheetVisible(true)}
              >
                <Text style={styles.inviteButton}>+ Invite</Text>
              </TouchableOpacity>
            </View>
            {trip.travelers.map(traveler => (
              <View key={traveler.id} style={styles.travelerCard}>
                <View style={styles.travelerAvatar}>
                  <User size={20} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.travelerInfo}>
                  <Text style={styles.travelerName}>{traveler.name}</Text>
                  <Text style={styles.travelerEmail}>{traveler.email}</Text>
                </View>
                {traveler.id === trip.userId && (
                  <View style={styles.ownerBadge}><Text style={styles.ownerText}>You</Text></View>
                )}
              </View>
            ))}
          </View>
          <View style={{ height: spacing.xl }} />
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerAnimatedStyle]}>
        <CircleButton icon={<ArrowLeft size={24} color={colors.textPrimary} />} onPress={() => router.back()} />
        <View style={styles.spacer} />
        <CircleButton icon={<More size={24} color={colors.textPrimary} />} onPress={() => {}} />
      </Animated.View>

      {/* Booking Pass Bottom Sheet */}
      {selectedBooking && (
        <BookingPassBottomSheet
          visible={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          bookingType={selectedBooking.type}
          details={selectedBooking.details}
          bookingNumber={selectedBooking.number}
          status={selectedBooking.status}
        />
      )}

      {/* Invite Travelers Bottom Sheet */}
      <InviteTravelersBottomSheet
        visible={inviteSheetVisible}
        onClose={() => setInviteSheetVisible(false)}
        tripName={`${trip.destination.city} Trip`}
        tripDestination={trip.destination.city}
        onInvite={(emails) => {
          // AI TODO: Send invitations to backend
          // await sendTripInvitations(trip.id, emails);
          showSuccess(`Invitation${emails.length > 1 ? 's' : ''} sent to ${emails.length} ${emails.length > 1 ? 'travelers' : 'traveler'}!`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  heroContainer: { width, height: IMAGE_HEIGHT, position: 'absolute', top: 0, zIndex: 0 },
  heroImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
  heroOverlay: { position: 'absolute', bottom: spacing.xl * 3, left: 0, right: 0, padding: spacing.lg },
  stateBadge: { position: 'absolute', bottom: spacing.xl * 3 + spacing.xl * 2 + spacing.lg, left: spacing.lg, backgroundColor: '#F24B6D', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  stateBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  heroTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroTitle: { fontSize: typography.fontSize['2xl'], fontWeight: '700', color: colors.white, flex: 1 },
  heroBudget: { fontSize: typography.fontSize.xl, fontWeight: '700', color: colors.white, marginLeft: spacing.sm },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroLocation: { fontSize: typography.fontSize.base, color: colors.white, fontWeight: '500' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, zIndex: 10, gap: spacing.md },
  spacer: { flex: 1 },
  scrollContent: { paddingTop: IMAGE_HEIGHT - 60 },
  content: { backgroundColor: colors.gray50, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: spacing.lg },
  dateCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: -spacing.xl * 2, padding: spacing.md, borderRadius: borderRadius.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dateText: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.gray900, flex: 1 },
  durationBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12 },
  durationText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.white },
  statsSection: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.gray500, fontWeight: '500', marginBottom: spacing.xs },
  statValue: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.gray900 },
  statDivider: { width: 1, backgroundColor: colors.gray200 },
  section: { backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: borderRadius.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', color: colors.gray900, marginBottom: spacing.md },
  bookingCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bookingIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  bookingInfo: { flex: 1, justifyContent: 'center' },
  bookingTitle: { fontSize: typography.fontSize.base, fontWeight: '700', color: colors.gray900, marginBottom: spacing.xs },
  bookingSubtitle: { fontSize: typography.fontSize.sm, color: colors.gray600, marginBottom: spacing.xs },
  bookingDate: { fontSize: typography.fontSize.xs, color: colors.gray500 },
  bookingPrice: { alignItems: 'flex-end', justifyContent: 'center', marginRight: spacing.sm },
  priceAmount: { fontSize: typography.fontSize.base, fontWeight: '700', color: colors.gray900, marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  expandedDetails: { backgroundColor: colors.gray50, padding: spacing.md, marginTop: -1, marginBottom: spacing.sm, borderRadius: 12 },
  detailRow: { marginBottom: spacing.sm },
  detailLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.gray500, marginBottom: spacing.xs, textTransform: 'uppercase' },
  detailValue: { fontSize: typography.fontSize.sm, color: colors.gray900, fontWeight: '500' },
  // Trip Hub Styles
  hubListContainer: { gap: spacing.md, marginTop: spacing.md },
  hubListCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray200, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubListIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  hubListContent: { flex: 1 },
  hubListTitle: { fontSize: typography.fontSize.base, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  hubListDescription: { fontSize: typography.fontSize.sm, color: colors.gray500 },
  hubGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md },
  hubSquareCard: { width: (width - spacing.lg * 2 - spacing.md * 3) / 2, backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray200, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubSquareIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  hubSquareTitle: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  inviteButtonContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: `${colors.primary}15`, borderRadius: borderRadius.full },
  inviteButton: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.primary },
  travelerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.gray900, marginBottom: spacing.xs },
  travelerEmail: { fontSize: typography.fontSize.sm, color: colors.gray600 },
  ownerBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  ownerText: { fontSize: typography.fontSize.xs, fontWeight: '600', color: colors.primary },
});
