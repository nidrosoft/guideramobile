/**
 * FLIGHT CHECKOUT SCREEN V3
 * 
 * Clean checkout flow with:
 * - Real Amadeus data only (baggage, seats, fare rules)
 * - Stripe payment integration
 * - Direct booking to database
 * - No mock data
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CloseCircle, Reserve, Briefcase, User, Card, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useStripe } from '@stripe/stripe-react-native';
import { colors, spacing } from '@/styles';

// Components
import {
  CheckoutSection,
  FlightSummaryCard,
  PriceChangeAlert,
  CheckoutLoadingState,
  CheckoutBottomBar,
} from '../components/checkout';
import { CancelBookingModal } from '../../shared';

// Sheets
import SeatSelectionSheet from '../sheets/SeatSelectionSheet';
import BaggageSheet from '../sheets/BaggageSheet';
import TravelerDetailsSheet from '../sheets/TravelerDetailsSheet';
import FlightDetailSheetDark from '../sheets/FlightDetailSheetDark';

// Services
import { stripeService } from '@/services/stripe.service';
import { bookingService } from '@/services/booking.service';
import { confirmFlightPrice, TravelerCount } from '@/services/flight-offer-price.service';

// Context
import { useAuth } from '@/context/AuthContext';

// Styles
import { styles } from './FlightCheckoutScreen.styles';

// ============================================
// TYPES
// ============================================

interface FlightCheckoutScreenProps {
  flight: any;
  onComplete: (bookingData: { tripId: string; bookingReference: string }) => void;
  onBack: () => void;
  onClose: () => void;
  travelers?: TravelerCount;
}

interface TravelerForm {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | null;
  passport: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

// Default traveler count - defined outside component to maintain stable reference
const DEFAULT_TRAVELER_COUNT: TravelerCount = { adults: 1 };

export default function FlightCheckoutScreenV3({
  flight,
  onComplete,
  onBack,
  onClose,
  travelers: travelerCountProp,
}: FlightCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Memoize traveler count to prevent reference changes
  const travelerCount = useMemo(() => 
    travelerCountProp || DEFAULT_TRAVELER_COUNT, 
    [travelerCountProp?.adults, travelerCountProp?.children, travelerCountProp?.infants]
  );
  
  const totalTravelerCount = useMemo(() => 
    (travelerCount.adults || 1) + (travelerCount.children || 0) + (travelerCount.infants || 0),
    [travelerCount]
  );

  // Loading states
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price confirmation from API
  const [priceConfirmation, setPriceConfirmation] = useState<any>(null);
  const [priceChanged, setPriceChanged] = useState(false);

  // Sheet visibility
  const [showFlightDetailSheet, setShowFlightDetailSheet] = useState(false);
  const [showSeatSheet, setShowSeatSheet] = useState(false);
  const [showBaggageSheet, setShowBaggageSheet] = useState(false);
  const [showTravelerSheet, setShowTravelerSheet] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Selections
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState(0);
  const [baggagePrice, setBaggagePrice] = useState(0);
  
  // Initialize travelers with stable initial value
  const [travelers, setTravelers] = useState<TravelerForm[]>(() => {
    const count = (travelerCountProp?.adults || 1) + (travelerCountProp?.children || 0) + (travelerCountProp?.infants || 0);
    return Array.from({ length: count }, (_, i) => ({
      id: `traveler-${i}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: null,
      passport: '',
    }));
  });

  // Track if price confirmation has been loaded
  const priceLoadedRef = React.useRef(false);
  
  // Load price confirmation only once on mount
  useEffect(() => {
    if (priceLoadedRef.current) return;
    priceLoadedRef.current = true;
    
    loadPriceConfirmation();
  }, []);

  const loadPriceConfirmation = async () => {
    try {
      setIsLoadingPrice(true);
      setError(null);

      const result = await confirmFlightPrice(
        flight,
        travelerCount,
        { includeSeatMap: true }
      );

      setPriceConfirmation(result);

      // Check if price changed
      const originalPrice = parseFloat(flight.price?.total || '0');
      if (result.priceChanged && Math.abs(result.confirmedPrice - originalPrice) > 0.01) {
        setPriceChanged(true);
      }
    } catch (err) {
      console.error('Price confirmation error:', err);
      setError('Failed to confirm flight price. Please try again.');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Extract flight info - memoized to prevent infinite re-renders
  // Supports: 1) Flat format from results screen, 2) NormalizedFlight (outbound), 3) UnifiedFlight (slices), 4) Raw Amadeus
  const flightInfo = useMemo(() => {
    // Check if this is a flat format (from FlightResultsScreen MockFlight)
    // These have direct properties like airlineName, originCode, etc.
    const isFlatFormat = flight.airlineName !== undefined || flight.originCode !== undefined;
    
    if (isFlatFormat) {
      // Flat format from results screen
      return {
        id: flight.id || '',
        provider: 'provider-manager',
        airlineName: flight.airlineName || 'Airline',
        airlineCode: flight.airlineCode || '',
        flightNumber: flight.flightNumber || '',
        originCode: flight.originCode || '',
        destCode: flight.destCode || '',
        departureTime: flight.departureTime instanceof Date 
          ? flight.departureTime.toISOString() 
          : (flight.departureTime || ''),
        arrivalTime: flight.arrivalTime instanceof Date 
          ? flight.arrivalTime.toISOString() 
          : (flight.arrivalTime || ''),
        duration: flight.duration || 0,
        stops: flight.stops ?? 0,
        price: typeof flight.price === 'number' ? flight.price : (flight.price?.amount || 0),
        currency: flight.currency || 'USD',
        cabinClass: flight.cabinClass || 'ECONOMY',
        refundable: flight.refundable ?? false,
        changeable: flight.changeable ?? false,
      };
    }
    
    // Check if this is NormalizedFlight format (has outbound with segments)
    const isNormalizedFlight = flight.outbound && flight.outbound.segments;
    
    if (isNormalizedFlight) {
      // NormalizedFlight format from provider-manager adapters
      const outbound = flight.outbound;
      const firstSegment = outbound.segments?.[0] || {};
      const lastSegment = outbound.segments?.[outbound.segments.length - 1] || firstSegment;
      
      return {
        id: flight.id || '',
        provider: flight.provider?.name || 'provider-manager',
        airlineName: firstSegment.carrier?.name || firstSegment.carrier?.code || 'Airline',
        airlineCode: firstSegment.carrier?.code || '',
        flightNumber: firstSegment.flightNumber || '',
        originCode: outbound.departure?.airport || '',
        destCode: outbound.arrival?.airport || '',
        departureTime: outbound.departure?.time || '',
        arrivalTime: outbound.arrival?.time || '',
        duration: flight.totalDurationMinutes || outbound.duration || 0,
        stops: flight.totalStops ?? outbound.stops ?? 0,
        price: flight.price?.amount || 0,
        currency: flight.price?.currency || 'USD',
        cabinClass: firstSegment.cabinClass || 'ECONOMY',
        refundable: flight.refundable ?? false,
        changeable: flight.changeable ?? false,
      };
    }
    
    // Check if this is a UnifiedFlight (has slices) or raw Amadeus (has itineraries)
    const isUnifiedFlight = flight.slices && Array.isArray(flight.slices);
    
    if (isUnifiedFlight) {
      // UnifiedFlight format from provider-manager
      const firstSlice = flight.slices?.[0];
      const firstSegment = firstSlice?.segments?.[0];
      const lastSegment = firstSlice?.segments?.[firstSlice.segments.length - 1];
      
      return {
        id: flight.id || '',
        provider: flight.provider?.name || 'amadeus',
        airlineName: firstSegment?.marketingCarrier?.name || firstSegment?.marketingCarrier?.code || 'Airline',
        airlineCode: firstSegment?.marketingCarrier?.code || '',
        flightNumber: firstSegment?.flightNumber || '',
        originCode: firstSlice?.origin?.code || firstSegment?.origin?.code || '',
        destCode: firstSlice?.destination?.code || lastSegment?.destination?.code || '',
        departureTime: firstSlice?.departureAt || firstSegment?.departureAt || '',
        arrivalTime: firstSlice?.arrivalAt || lastSegment?.arrivalAt || '',
        duration: flight.totalDurationMinutes || firstSlice?.durationMinutes || 0,
        stops: flight.totalStops ?? (firstSlice?.stops ?? 0),
        price: flight.price?.total || 0,
        currency: flight.price?.currency || 'USD',
        cabinClass: firstSegment?.cabinClass || 'ECONOMY',
        refundable: flight.isRefundable ?? false,
        changeable: flight.isChangeable ?? false,
      };
    } else {
      // Raw Amadeus format (legacy)
      const itinerary = flight.itineraries?.[0];
      const firstSegment = itinerary?.segments?.[0];
      const lastSegment = itinerary?.segments?.[itinerary?.segments?.length - 1];
      
      // Parse duration string (e.g., "PT2H30M") to minutes
      const parseDuration = (dur: string): number => {
        if (!dur) return 0;
        const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return 0;
        return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0');
      };
      
      return {
        id: flight.id || '',
        provider: 'amadeus',
        airlineName: flight.validatingAirlineCodes?.[0] || firstSegment?.carrierCode || 'Airline',
        airlineCode: firstSegment?.carrierCode || '',
        flightNumber: `${firstSegment?.carrierCode || ''}${firstSegment?.number || ''}`,
        originCode: firstSegment?.departure?.iataCode || '',
        destCode: lastSegment?.arrival?.iataCode || '',
        departureTime: firstSegment?.departure?.at || '',
        arrivalTime: lastSegment?.arrival?.at || '',
        duration: parseDuration(itinerary?.duration),
        stops: (itinerary?.segments?.length || 1) - 1,
        price: parseFloat(flight.price?.total || '0'),
        currency: flight.price?.currency || 'USD',
        cabinClass: flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        refundable: false,
        changeable: false,
      };
    }
  }, [flight]);

  // Calculate total price
  const calculateTotal = () => {
    const basePrice = priceConfirmation?.confirmedPrice || flightInfo.price;
    return basePrice + baggagePrice;
  };

  // Handlers
  const handleClosePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCloseConfirm(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    setTimeout(onClose, 100);
  }, [onClose]);

  const handleCancelClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCloseConfirm(false);
  }, []);

  const handleAcceptPriceChange = useCallback(() => {
    setPriceChanged(false);
  }, []);

  const handleBaggageSelect = useCallback((bags: number, price: number) => {
    setSelectedBaggage(bags);
    setBaggagePrice(price);
  }, []);

  const handleSaveTravelers = useCallback((updatedTravelers: TravelerForm[]) => {
    setTravelers(updatedTravelers);
    setShowTravelerSheet(false);
  }, []);

  // Process payment with Stripe
  const handlePayment = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to complete booking');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const totalAmount = calculateTotal();
      const amountInCents = stripeService.toCents(totalAmount);

      // 1. Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent({
        amount: amountInCents,
        currency: priceConfirmation?.currency || 'USD',
        userId: user.id,
        metadata: {
          flightOfferId: flight.id,
          travelers: JSON.stringify(travelers.map(t => ({ firstName: t.firstName, lastName: t.lastName }))),
        },
      });

      if (!paymentIntent.success || !paymentIntent.clientSecret) {
        throw new Error(paymentIntent.error || 'Failed to create payment');
      }

      // 2. Initialize Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent.clientSecret,
        merchantDisplayName: 'Guidera Travel',
        style: 'automatic',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User cancelled - not an error
          setIsProcessing(false);
          return;
        }
        throw new Error(presentError.message);
      }

      // 4. Payment successful - create booking
      const bookingResult = await bookingService.createFlightBooking({
        userId: user.id,
        paymentIntentId: paymentIntent.paymentIntentId!,
        flightOffer: flight,
        travelers: travelers.map(t => ({
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          dateOfBirth: t.dateOfBirth?.toISOString().split('T')[0],
          passportNumber: t.passport,
        })),
        selectedSeats,
        selectedBaggage,
        baggagePrice,
        totalPrice: totalAmount,
        currency: priceConfirmation?.currency || 'USD',
      });

      if (bookingResult.error || !bookingResult.data) {
        throw new Error(bookingResult.error?.message || 'Failed to create booking');
      }

      // 5. Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete({
        tripId: bookingResult.data.tripId,
        bookingReference: bookingResult.data.bookingReference,
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  }, [user, flight, travelers, selectedSeats, selectedBaggage, baggagePrice, priceConfirmation, initPaymentSheet, presentPaymentSheet, onComplete]);

  // Computed values
  const isTravelerComplete = travelers.length > 0 && 
    travelers.every(t => t.firstName && t.lastName && t.email);

  const isSeatSelectionAvailable = priceConfirmation?.seatMap?.available && 
    priceConfirmation.seatMap.decks?.length > 0;

  const canBook = isTravelerComplete;

  // Loading state
  if (isLoadingPrice) {
    return <CheckoutLoadingState message="Confirming flight price..." />;
  }

  // Price change alert
  if (priceChanged && priceConfirmation) {
    return (
      <PriceChangeAlert
        visible={true}
        originalPrice={flightInfo.price}
        newPrice={priceConfirmation.confirmedPrice}
        currency={priceConfirmation.currency}
        onAccept={handleAcceptPriceChange}
        onCancel={onBack}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ImageBackground
        source={require('../../../../../../assets/images/flightbg.png')}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>
              {flightInfo.originCode} → {flightInfo.destCode}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <CloseCircle size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Summary */}
        <FlightSummaryCard
          flightInfo={flightInfo}
          fareRules={priceConfirmation?.fareRules}
          onViewDetails={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFlightDetailSheet(true);
          }}
        />

        {/* Seat Selection - Only if available from Amadeus */}
        {isSeatSelectionAvailable && (
          <CheckoutSection
            title="Select Seats"
            subtitle={selectedSeats.length > 0 
              ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}: ${selectedSeats.join(', ')}`
              : 'Choose your preferred seats'
            }
            icon={<Reserve size={20} color={colors.primary} variant="Bold" />}
            completed={selectedSeats.length > 0}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSeatSheet(true);
            }}
            index={1}
          />
        )}

        {/* Baggage - Real Amadeus pricing */}
        <CheckoutSection
          title="Baggage"
          subtitle={selectedBaggage > 0 
            ? `${selectedBaggage} extra bag${selectedBaggage > 1 ? 's' : ''} (+$${baggagePrice.toFixed(2)})`
            : `${priceConfirmation?.baggage?.cabin?.included || 1} cabin bag included`
          }
          icon={<Briefcase size={20} color={colors.primary} variant="Bold" />}
          completed={selectedBaggage > 0}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowBaggageSheet(true);
          }}
          index={isSeatSelectionAvailable ? 2 : 1}
        />

        {/* Traveler Details */}
        <CheckoutSection
          title="Traveler Details"
          subtitle={isTravelerComplete 
            ? `${travelers.length} traveler${travelers.length > 1 ? 's' : ''} added`
            : 'Add passenger information'
          }
          icon={<User size={20} color={colors.primary} variant="Bold" />}
          completed={isTravelerComplete}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTravelerSheet(true);
          }}
          index={isSeatSelectionAvailable ? 3 : 2}
        />

        {/* Payment Info */}
        <CheckoutSection
          title="Payment"
          subtitle="Pay securely with Stripe"
          icon={<Card size={20} color={colors.primary} variant="Bold" />}
          completed={false}
          onPress={() => {
            if (canBook) {
              handlePayment();
            } else {
              Alert.alert('Complete Required Fields', 'Please add traveler details before proceeding to payment.');
            }
          }}
          index={isSeatSelectionAvailable ? 4 : 3}
        />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>
            ${calculateTotal().toFixed(2)} {priceConfirmation?.currency || 'USD'}
          </Text>
          {baggagePrice > 0 && (
            <Text style={styles.priceBreakdown}>
              Flight ${(priceConfirmation?.confirmedPrice || flightInfo.price).toFixed(2)} + Baggage ${baggagePrice.toFixed(2)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!canBook || isProcessing) && styles.bookButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!canBook || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <TickCircle size={20} color={colors.white} variant="Bold" />
              <Text style={styles.bookButtonText}>Pay Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      {isSeatSelectionAvailable && (
        <SeatSelectionSheet
          visible={showSeatSheet}
          onClose={() => setShowSeatSheet(false)}
          selectedSeats={selectedSeats}
          onSelectSeats={setSelectedSeats}
          seatMap={{
            rows: priceConfirmation.seatMap.decks[0].rows.map((r: any) => r.number),
            columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            seats: priceConfirmation.seatMap.decks[0].rows.flatMap((r: any) => 
              r.seats.map((s: any) => ({
                number: s.number,
                available: s.available,
                price: s.price,
                characteristics: s.characteristics,
              }))
            ),
            defaultPrice: 25,
          }}
        />
      )}

      <BaggageSheet
        visible={showBaggageSheet}
        onClose={() => setShowBaggageSheet(false)}
        selectedBags={selectedBaggage}
        onSelectBags={handleBaggageSelect}
        includedBaggage={{
          cabin: priceConfirmation?.baggage?.cabin?.included || 1,
          checked: priceConfirmation?.baggage?.checked?.included || 0,
          cabinWeight: priceConfirmation?.baggage?.cabin?.weight,
          checkedWeight: priceConfirmation?.baggage?.checked?.weight,
        }}
        addOnOptions={priceConfirmation?.baggage?.checked?.addOnOptions}
      />

      <TravelerDetailsSheet
        visible={showTravelerSheet}
        onClose={() => setShowTravelerSheet(false)}
        travelers={travelers}
        onSaveTravelers={handleSaveTravelers}
      />

      <FlightDetailSheetDark
        visible={showFlightDetailSheet}
        onClose={() => setShowFlightDetailSheet(false)}
        flightInfo={{
          ...flightInfo,
          passengerCount: totalTravelerCount,
        }}
      />

      {/* Close Confirmation */}
      <CancelBookingModal
        visible={showCloseConfirm}
        onCancel={handleCancelClose}
        onConfirm={handleConfirmClose}
      />
    </View>
  );
}
