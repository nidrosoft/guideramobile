import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2, More, Calendar, User, Airplane, Building, Car, Location, CalendarEdit, Bag2, Book, ShieldTick, InfoCircle, SecuritySafe, DollarCircle, LanguageSquare, DocumentText } from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { BookingType, FlightDetails, HotelDetails, CarRentalDetails, ActivityDetails } from '@/features/trips/types/trip.types';
import InviteTravelersBottomSheet from '@/features/trips/components/InviteTravelersBottomSheet';
import CircleButton from '@/components/atoms/CircleButton/CircleButton';
import { useToast } from '@/contexts/ToastContext';
import { Skeleton } from '@/components/common/SkeletonLoader';
import { packingService } from '@/services/packing.service';
import { invitationService, TripInvitation } from '@/services/invitation.service';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.2;

interface TripDetailScreenProps {
  tripId: string;
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function TripDetailSkeleton({ isDark, colors: c, insets, onBack }: { isDark: boolean; colors: any; insets: any; onBack: () => void }) {
  return (
    <View style={[styles.container, { backgroundColor: c.bgPrimary }]}>
      {/* Hero Image Skeleton */}
      <View style={[styles.heroContainer, { backgroundColor: c.bgSecondary }]}>
        <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
      </View>

      {/* Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <CircleButton onPress={onBack} icon={<ArrowLeft2 size={20} color={c.textPrimary} />} />
        <View style={styles.spacer} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.content, { backgroundColor: c.bgPrimary }]}>
          {/* Date Card Skeleton */}
          <View style={[styles.dateCard, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <Skeleton width={20} height={20} borderRadius={6} />
              <Skeleton width="60%" height={14} />
            </View>
            <Skeleton width={70} height={28} borderRadius={12} />
          </View>

          {/* Stats Section Skeleton */}
          <View style={[styles.statsSection, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                <View style={styles.statItem}>
                  <Skeleton width={32} height={32} borderRadius={16} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={50} height={10} style={{ marginBottom: spacing.xs }} />
                  <Skeleton width={40} height={14} />
                </View>
                {i < 2 && <View style={[styles.statDivider, { backgroundColor: c.borderSubtle }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Trip Hub Skeleton */}
          <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <Skeleton width={80} height={20} borderRadius={6} style={{ marginBottom: spacing.md }} />
            
            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="50%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="70%" height={12} />
              </View>
            </View>

            {/* Grid skeleton */}
            <View style={[styles.hubGridContainer, { marginTop: spacing.md }]}>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>

            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle, marginTop: spacing.md }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="55%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="65%" height={12} />
              </View>
            </View>

            {/* Grid skeleton */}
            <View style={[styles.hubGridContainer, { marginTop: spacing.md }]}>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="70%" height={12} />
              </View>
              <View style={[styles.hubSquareCard, { borderColor: c.borderSubtle }]}>
                <Skeleton width={44} height={44} borderRadius={16} style={{ marginBottom: spacing.sm }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>

            {/* Wide card skeleton */}
            <View style={[styles.hubListCard, { borderColor: c.borderSubtle, marginTop: spacing.md }]}>
              <Skeleton width={44} height={44} borderRadius={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="40%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>
          </View>

          {/* Travelers Section Skeleton */}
          <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
            <Skeleton width={100} height={20} borderRadius={6} style={{ marginBottom: spacing.md }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Skeleton width="40%" height={14} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="55%" height={12} />
              </View>
            </View>
          </View>

          <View style={{ height: spacing.xl * 2 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

export default function TripDetailScreen({ tripId }: TripDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { showSuccess } = useToast();
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  const isLoading = useTripStore(state => state.isLoading);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
  const [packingProgress, setPackingProgress] = useState({ total: 0, packed: 0, percentage: 0 });
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const scrollOffset = useSharedValue(0);

  const loadTripData = () => {
    if (!tripId) return;
    packingService.getProgress(tripId).then(setPackingProgress).catch((err) => { if (__DEV__) console.warn('Failed to load packing progress:', err); });
    invitationService.getTripInvitations(tripId).then(setInvitations).catch((err) => { if (__DEV__) console.warn('Failed to load invitations:', err); });
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  if (!trip) {
    return <TripDetailSkeleton isDark={isDark} colors={colors} insets={insets} onBack={() => router.back()} />;
  }

  const flights = trip.bookings.filter(b => b.type === BookingType.FLIGHT);
  const hotels = trip.bookings.filter(b => b.type === BookingType.HOTEL);
  const cars = trip.bookings.filter(b => b.type === BookingType.CAR_RENTAL);
  const activities = trip.bookings.filter(b => b.type === BookingType.ACTIVITY);

  const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));


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
      backgroundColor: isDark
        ? `rgba(32, 32, 32, ${opacity})`
        : `rgba(255, 255, 255, ${opacity})`,
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
            <Location size={16} color="#FFFFFF" variant="Bold" />
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
        <View style={[styles.content, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.dateCard, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard }]}>
            <View style={styles.dateRow}>
              <Calendar size={20} color={colors.primary} variant="Bold" />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' → '}
                {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={[styles.durationBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.durationText}>{duration} days</Text>
            </View>
          </View>

          <View style={[styles.statsSection, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard }]}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.info}15` }]}>
                <Calendar size={18} color={colors.info} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trip Plan</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{duration} Days</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Building size={18} color={colors.primary} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{trip.bookings.length}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Bag2 size={18} color={colors.warning} variant="Bold" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Packing List</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{packingProgress.total > 0 ? `${packingProgress.percentage}%` : 'No items'}</Text>
            </View>
          </View>

          {trip.bookings.length > 0 && (
            <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bookings</Text>
              
              {flights.map(booking => {
                const details = booking.details as FlightDetails;
                return (
                  <TouchableOpacity key={booking.id} style={[styles.bookingCard, { borderBottomColor: colors.borderSubtle }]} activeOpacity={0.7}>
                    <View style={[styles.bookingIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <Airplane size={24} color={colors.primary} variant="Bold" />
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>{details.airline} {details.flightNumber}</Text>
                      <Text style={[styles.bookingSubtitle, { color: colors.textSecondary }]}>{details.departure.airport} → {details.arrival.airport}</Text>
                      <Text style={[styles.bookingDate, { color: colors.textTertiary }]}>
                        {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.bookingPrice}>
                      <Text style={[styles.priceAmount, { color: colors.textPrimary }]}>{booking.price.currency} {booking.price.amount}</Text>
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
                  <TouchableOpacity key={booking.id} style={[styles.bookingCard, { borderBottomColor: colors.borderSubtle }]} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.success}15` }]}>
                        <Building size={24} color={colors.success} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>{details.name}</Text>
                        <Text style={[styles.bookingSubtitle, { color: colors.textSecondary }]}>{details.roomType}</Text>
                        <Text style={[styles.bookingDate, { color: colors.textTertiary }]}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {booking.endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={[styles.priceAmount, { color: colors.textPrimary }]}>{booking.price.currency} {booking.price.amount}</Text>
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
                  <TouchableOpacity key={booking.id} style={[styles.bookingCard, { borderBottomColor: colors.borderSubtle }]} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.warning}15` }]}>
                        <Car size={24} color={colors.warning} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>{details.carModel}</Text>
                        <Text style={[styles.bookingSubtitle, { color: colors.textSecondary }]}>{details.company}</Text>
                        <Text style={[styles.bookingDate, { color: colors.textTertiary }]}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {booking.endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={[styles.priceAmount, { color: colors.textPrimary }]}>{booking.price.currency} {booking.price.amount}</Text>
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
                  <TouchableOpacity key={booking.id} style={[styles.bookingCard, { borderBottomColor: colors.borderSubtle }]} activeOpacity={0.7}>
                      <View style={[styles.bookingIcon, { backgroundColor: `${colors.info}15` }]}>
                        <Location size={24} color={colors.info} variant="Bold" />
                      </View>
                      <View style={styles.bookingInfo}>
                        <Text style={[styles.bookingTitle, { color: colors.textPrimary }]}>{details.name}</Text>
                        <Text style={[styles.bookingSubtitle, { color: colors.textSecondary }]}>{details.location.name}</Text>
                        <Text style={[styles.bookingDate, { color: colors.textTertiary }]}>
                          {booking.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={styles.bookingPrice}>
                        <Text style={[styles.priceAmount, { color: colors.textPrimary }]}>{booking.price.currency} {booking.price.amount}</Text>
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
          <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trip Hub</Text>
            
            {/* 1. Trip Planner - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity 
                style={[styles.hubListCard, { borderColor: colors.borderSubtle }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/planner/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <CalendarEdit size={28} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={[styles.hubListTitle, { color: colors.textPrimary }]}>Trip Planner</Text>
                  <Text style={[styles.hubListDescription, { color: colors.textSecondary }]}>Plan your days & activities</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* 2. Packing + Journal - Square Grid */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity 
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/packing/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.warning}15` }]}>
                  <Bag2 size={32} color={colors.warning} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Packing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/journal/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.info}15` }]}>
                  <Book size={32} color={colors.info} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Journal</Text>
              </TouchableOpacity>
            </View>
            
            {/* 3. Expense Tracker - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity 
                style={[styles.hubListCard, { borderColor: colors.borderSubtle }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/expenses/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `${colors.success}15` }]}>
                  <DollarCircle size={28} color={colors.success} variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={[styles.hubListTitle, { color: colors.textPrimary }]}>Expense Tracker</Text>
                  <Text style={[styles.hubListDescription, { color: colors.textSecondary }]}>Track spending & budget</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* 4. Compensation + Do's & Don'ts - Square Grid */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/compensation/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.purple}15` }]}>
                  <ShieldTick size={32} color={colors.purple} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Compensation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/dos-donts/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: colors.successBg }]}>
                  <InfoCircle size={32} color={colors.success} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Do's & Don'ts</Text>
              </TouchableOpacity>
            </View>
            
            {/* 5. Safety + Language - Square Grid */}
            <View style={styles.hubGridContainer}>
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/safety/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: colors.errorBg }]}>
                  <SecuritySafe size={32} color={colors.error} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Safety</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.hubSquareCard, { borderColor: colors.borderSubtle }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/language/${tripId}`)}
              >
                <View style={[styles.hubSquareIcon, { backgroundColor: `${colors.info}15` }]}>
                  <LanguageSquare size={32} color={colors.info} variant="Bold" />
                </View>
                <Text style={[styles.hubSquareTitle, { color: colors.textPrimary }]}>Language</Text>
              </TouchableOpacity>
            </View>
            
            {/* 6. Documents - Wide Card */}
            <View style={styles.hubListContainer}>
              <TouchableOpacity 
                style={[styles.hubListCard, { borderColor: colors.borderSubtle }]} 
                activeOpacity={0.7}
                onPress={() => router.push(`/documents/${tripId}`)}
              >
                <View style={[styles.hubListIcon, { backgroundColor: `${colors.orange}15` }]}>
                  <DocumentText size={28} color={colors.orange} variant="Bold" />
                </View>
                <View style={styles.hubListContent}>
                  <Text style={[styles.hubListTitle, { color: colors.textPrimary }]}>Documents</Text>
                  <Text style={[styles.hubListDescription, { color: colors.textSecondary }]}>Passport, visa & travel docs</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : colors.bgCard }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Travelers ({trip.travelers.length + invitations.length})
              </Text>
              <TouchableOpacity
                style={[styles.inviteButtonContainer, { backgroundColor: `${colors.primary}15` }]}
                onPress={() => setInviteSheetVisible(true)}
              >
                <Text style={[styles.inviteButton, { color: colors.primary }]}>+ Invite</Text>
              </TouchableOpacity>
            </View>

            {/* Trip owner / existing travelers */}
            {trip.travelers.map(traveler => (
              <View key={traveler.id} style={[styles.travelerCard, { borderBottomColor: colors.borderSubtle }]}>
                <View style={[styles.travelerAvatar, { backgroundColor: `${colors.primary}15` }]}>
                  <User size={20} color={colors.primary} variant="Bold" />
                </View>
                <View style={styles.travelerInfo}>
                  <Text style={[styles.travelerName, { color: colors.textPrimary }]}>{traveler.name}</Text>
                  <Text style={[styles.travelerEmail, { color: colors.textSecondary }]}>{traveler.email}</Text>
                </View>
                {traveler.id === trip.userId && (
                  <View style={[styles.ownerBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.ownerText, { color: colors.primary }]}>Owner</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Invited travelers with status */}
            {invitations.map(invite => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                pending:  { bg: '#F59E0B15', text: '#F59E0B', label: 'Pending' },
                accepted: { bg: `${colors.success}15`, text: colors.success, label: 'Accepted' },
                declined: { bg: '#EF444415', text: '#EF4444', label: 'Declined' },
                expired:  { bg: `${colors.textTertiary}15`, text: colors.textTertiary, label: 'Expired' },
              };
              const sc = statusColors[invite.status] || statusColors.pending;

              return (
                <View key={invite.id} style={[styles.travelerCard, { borderBottomColor: colors.borderSubtle }]}>
                  <View style={[styles.travelerAvatar, {
                    backgroundColor: invite.status === 'accepted' ? `${colors.success}15` : `${colors.warning}15`,
                  }]}>
                    <User size={20} color={invite.status === 'accepted' ? colors.success : colors.warning} variant="Bold" />
                  </View>
                  <View style={styles.travelerInfo}>
                    <Text style={[styles.travelerName, { color: colors.textPrimary }]}>
                      {invite.invitedName || invite.invitedEmail.split('@')[0]}
                    </Text>
                    <Text style={[styles.travelerEmail, { color: colors.textSecondary }]}>
                      {invite.invitedEmail}
                    </Text>
                  </View>
                  <View style={[styles.ownerBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.ownerText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>
              );
            })}

            {trip.travelers.length === 0 && invitations.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                <Text style={[styles.travelerEmail, { color: colors.textTertiary }]}>
                  No travelers yet. Tap + Invite to add companions.
                </Text>
              </View>
            )}
          </View>
          <View style={{ height: spacing.xl }} />
        </View>
      </Animated.ScrollView>

      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerAnimatedStyle]}>
        <CircleButton icon={<ArrowLeft2 size={24} color={colors.textPrimary} />} onPress={() => router.back()} />
        <View style={styles.spacer} />
        {/* Menu removed — trip status managed automatically by the system */}
        <View style={{ width: 40 }} />
      </Animated.View>


      {/* Invite Travelers Bottom Sheet */}
      <InviteTravelersBottomSheet
        visible={inviteSheetVisible}
        onClose={() => {
          setInviteSheetVisible(false);
          loadTripData();
        }}
        tripId={tripId}
        tripName={trip.title || `${trip.destination.city} Trip`}
        tripDestination={trip.destination.city}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { width, height: IMAGE_HEIGHT, position: 'absolute', top: 0, zIndex: 0 },
  heroImage: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250 },
  heroOverlay: { position: 'absolute', bottom: spacing.xl * 4 + spacing.sm, left: 0, right: 0, padding: spacing.lg },
  stateBadge: { position: 'absolute', bottom: spacing.xl * 4 + spacing.sm + spacing.xl * 3 + spacing.lg + spacing.md, left: spacing.lg, backgroundColor: '#F24B6D', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  stateBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  heroTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroTitle: { fontSize: typography.fontSize['2xl'], fontWeight: '700', color: '#FFFFFF', flex: 1 },
  heroBudget: { fontSize: typography.fontSize.xl, fontWeight: '700', color: '#FFFFFF', marginLeft: spacing.sm },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroLocation: { fontSize: typography.fontSize.base, color: '#FFFFFF', fontWeight: '500' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, zIndex: 10, gap: spacing.md },
  spacer: { flex: 1 },
  scrollContent: { paddingTop: IMAGE_HEIGHT - 60 },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: spacing.lg },
  dateCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: -spacing.xl * 2, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dateText: { fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1 },
  durationBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12 },
  durationText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: '#FFFFFF' },
  statsSection: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statLabel: { fontSize: typography.fontSize.xs, fontWeight: '500', marginBottom: spacing.xs },
  statValue: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  statDivider: { width: 1 },
  section: { marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  bookingCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  bookingIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  bookingInfo: { flex: 1, justifyContent: 'center' },
  bookingTitle: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  bookingSubtitle: { fontSize: typography.fontSize.sm, marginBottom: spacing.xs },
  bookingDate: { fontSize: typography.fontSize.xs },
  bookingPrice: { alignItems: 'flex-end', justifyContent: 'center', marginRight: spacing.sm },
  priceAmount: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  expandedDetails: { padding: spacing.md, marginTop: -1, marginBottom: spacing.sm, borderRadius: 12 },
  detailRow: { marginBottom: spacing.sm },
  detailLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', marginBottom: spacing.xs, textTransform: 'uppercase' },
  detailValue: { fontSize: typography.fontSize.sm, fontWeight: '500' },
  // Trip Hub Styles
  hubListContainer: { gap: spacing.md, marginTop: spacing.md },
  hubListCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubListIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  hubListContent: { flex: 1 },
  hubListTitle: { fontSize: typography.fontSize.base, fontWeight: '700', marginBottom: spacing.xs },
  hubListDescription: { fontSize: typography.fontSize.sm },
  hubGridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md },
  hubSquareCard: { flex: 1, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSubtle, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  hubSquareIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  hubSquareTitle: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  inviteButtonContainer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  inviteButton: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  travelerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: typography.fontSize.base, fontWeight: '600', marginBottom: spacing.xs },
  travelerEmail: { fontSize: typography.fontSize.sm },
  ownerBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  ownerText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
});
