/**
 * FLIGHT CHECKOUT SCREEN
 * 
 * Combined checkout page with expandable sections:
 * - Flight Summary
 * - Seat Selection
 * - Extras (Baggage, Meals)
 * - Traveler Details
 * - Payment
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  ArrowDown2,
  ArrowUp2,
  Airplane,
  Briefcase,
  Reserve,
  User,
  Card,
  TickCircle,
  ArrowRight2,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { Flight } from '../../../types/flight.types';
import SeatSelectionSheet from '../sheets/SeatSelectionSheet';
import ExtrasSheet from '../sheets/ExtrasSheet';
import TravelerDetailsSheet from '../sheets/TravelerDetailsSheet';
import FlightDetailSheet from '../sheets/FlightDetailSheet';
import PaymentSheet from '../sheets/PaymentSheet';
import { CancelBookingModal } from '../../shared';
import { styles } from './FlightCheckoutScreen.styles';

interface FlightCheckoutScreenProps {
  flight: Flight;
  onComplete: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Section component for expandable areas
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  completed?: boolean;
}

const Section = ({ title, icon, expanded, onToggle, children, completed }: SectionProps) => (
  <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, completed && styles.sectionIconCompleted]}>
          {completed ? (
            <TickCircle size={20} color={colors.white} variant="Bold" />
          ) : (
            icon
          )}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {expanded ? (
        <ArrowUp2 size={20} color={colors.gray400} />
      ) : (
        <ArrowDown2 size={20} color={colors.gray400} />
      )}
    </TouchableOpacity>
    {expanded && <View style={styles.sectionContent}>{children}</View>}
  </Animated.View>
);

export default function FlightCheckoutScreen({
  flight,
  onComplete,
  onBack,
  onClose,
}: FlightCheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const flightStore = useFlightStore();
  
  // Bottom sheet visibility states
  const [showFlightDetailSheet, setShowFlightDetailSheet] = useState(false);
  const [showSeatSheet, setShowSeatSheet] = useState(false);
  const [showExtrasSheet, setShowExtrasSheet] = useState(false);
  const [showTravelerSheet, setShowTravelerSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Close confirmation handlers
  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleCancelClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCloseConfirm(false);
  };
  
  // Form states
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [extras, setExtras] = useState({
    checkedBags: 0,
    meal: null as string | null,
    priorityBoarding: false,
    wifi: false,
    entertainment: false,
    insurance: false,
  });
  const [travelers, setTravelers] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date | null;
    passport: string;
  }>>([]);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });
  
  // Get flight display info - handle both real Flight type and mock data
  const flightData = flight as any;
  const hasSegments = flightData.segments && flightData.segments.length > 0;
  
  // Extract flight info from either format
  const flightInfo = hasSegments ? {
    airlineName: flightData.segments[0]?.airline?.name || 'Airline',
    originCode: flightData.segments[0]?.origin?.code || 'DEP',
    destCode: flightData.segments[flightData.segments.length - 1]?.destination?.code || 'ARR',
    departureTime: flightData.segments[0]?.departureTime,
    arrivalTime: flightData.segments[flightData.segments.length - 1]?.arrivalTime,
    duration: flightData.totalDuration || 180,
    stops: flightData.stops || 0,
    price: flightData.price?.amount || 200,
  } : {
    airlineName: flightData.airlineName || 'Airline',
    originCode: flightData.originCode || 'DEP',
    destCode: flightData.destCode || 'ARR',
    departureTime: flightData.departureTime,
    arrivalTime: flightData.arrivalTime,
    duration: flightData.duration || 180,
    stops: flightData.stops || 0,
    price: flightData.price || 200,
  };
  
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '--:--';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '--:--';
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  // Calculate extras total
  const calculateExtrasTotal = () => {
    let total = 0;
    total += extras.checkedBags * 35;
    if (extras.meal) total += 15;
    if (extras.priorityBoarding) total += 15;
    if (extras.wifi) total += 12;
    if (extras.entertainment) total += 8;
    if (extras.insurance) total += 25;
    return total;
  };
  
  // Calculate total price
  const basePrice = flightInfo.price;
  const seatPrice = selectedSeats.length * 25;
  const extrasTotal = calculateExtrasTotal();
  const totalPrice = basePrice + seatPrice + extrasTotal;
  
  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };
  
  // Check if sections are completed
  const isTravelerComplete = travelers.length > 0 && travelers.every(t => t.firstName && t.lastName && t.email);
  const hasExtras = extras.checkedBags > 0 || extras.meal || extras.priorityBoarding || extras.wifi || extras.entertainment || extras.insurance;
  const isPaymentComplete = !!(
    paymentInfo.cardNumber.replace(/\s/g, '').length >= 16 &&
    paymentInfo.cardHolder &&
    paymentInfo.expiryDate.length >= 5 &&
    paymentInfo.cvv.length >= 3
  );

  return (
    <View style={styles.container}>
      {/* Header with flight background */}
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
            <Text style={styles.headerSubtitle}>{flightInfo.originCode} → {flightInfo.destCode}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePress}>
            <CloseCircle size={24} color={colors.white} variant="Bold" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Detail Card - Opens Bottom Sheet */}
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFlightDetailSheet(true);
          }}
        >
          <View style={styles.selectionIcon}>
            <Airplane size={20} color={colors.primary} variant="Bold" />
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Flight Details</Text>
            <Text style={styles.selectionSubtitle}>
              {flightInfo.airlineName} • {Math.floor(flightInfo.duration / 60)}h {flightInfo.duration % 60}m
            </Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} />
        </TouchableOpacity>
        
        {/* Selection Cards - Open Bottom Sheets */}
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSeatSheet(true);
          }}
        >
          <View style={[styles.selectionIcon, selectedSeats.length > 0 && styles.selectionIconComplete]}>
            {selectedSeats.length > 0 ? (
              <TickCircle size={20} color={colors.white} variant="Bold" />
            ) : (
              <Reserve size={20} color={colors.primary} variant="Bold" />
            )}
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Select Seats</Text>
            <Text style={styles.selectionSubtitle}>
              {selectedSeats.length > 0 
                ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}: ${selectedSeats.join(', ')}`
                : '+$25 per seat'
              }
            </Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowExtrasSheet(true);
          }}
        >
          <View style={[styles.selectionIcon, hasExtras && styles.selectionIconComplete]}>
            {hasExtras ? (
              <TickCircle size={20} color={colors.white} variant="Bold" />
            ) : (
              <Briefcase size={20} color={colors.primary} variant="Bold" />
            )}
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Extras</Text>
            <Text style={styles.selectionSubtitle}>
              {hasExtras 
                ? `+$${extrasTotal} in extras`
                : 'Baggage, meals, add-ons'
              }
            </Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTravelerSheet(true);
          }}
        >
          <View style={[styles.selectionIcon, isTravelerComplete && styles.selectionIconComplete]}>
            {isTravelerComplete ? (
              <TickCircle size={20} color={colors.white} variant="Bold" />
            ) : (
              <User size={20} color={colors.primary} variant="Bold" />
            )}
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Traveler Details</Text>
            <Text style={styles.selectionSubtitle}>
              {isTravelerComplete 
                ? `${travelers.length} traveler${travelers.length > 1 ? 's' : ''}`
                : 'Add passenger information'
              }
            </Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} />
        </TouchableOpacity>
        
        {/* Payment Card - Opens Bottom Sheet */}
        <TouchableOpacity 
          style={styles.selectionCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPaymentSheet(true);
          }}
        >
          <View style={[styles.selectionIcon, isPaymentComplete && styles.selectionIconComplete]}>
            {isPaymentComplete ? (
              <TickCircle size={20} color={colors.white} variant="Bold" />
            ) : (
              <Card size={20} color={colors.primary} variant="Bold" />
            )}
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>Payment Details</Text>
            <Text style={styles.selectionSubtitle}>
              {isPaymentComplete 
                ? `•••• ${paymentInfo.cardNumber.slice(-4)}`
                : 'Enter card information'
              }
            </Text>
          </View>
          <ArrowRight2 size={20} color={colors.gray400} />
        </TouchableOpacity>
      </ScrollView>
      
      {/* Bottom Sheets */}
      <SeatSelectionSheet
        visible={showSeatSheet}
        onClose={() => setShowSeatSheet(false)}
        selectedSeats={selectedSeats}
        onSelectSeats={setSelectedSeats}
      />
      
      <ExtrasSheet
        visible={showExtrasSheet}
        onClose={() => setShowExtrasSheet(false)}
        selectedExtras={extras}
        onSelectExtras={setExtras}
      />
      
      <TravelerDetailsSheet
        visible={showTravelerSheet}
        onClose={() => setShowTravelerSheet(false)}
        travelers={travelers}
        onSaveTravelers={setTravelers}
      />
      
      <FlightDetailSheet
        visible={showFlightDetailSheet}
        onClose={() => setShowFlightDetailSheet(false)}
        flightInfo={flightInfo}
      />
      
      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        paymentInfo={paymentInfo}
        onSavePayment={setPaymentInfo}
      />
      
      {/* Bottom Price & Book Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.priceBreakdown}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>${totalPrice}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !(isTravelerComplete && isPaymentComplete) && styles.bookButtonDisabled]}
          onPress={handleComplete}
          disabled={!(isTravelerComplete && isPaymentComplete)}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>
            {isTravelerComplete && isPaymentComplete ? 'Book Now' : 'Complete All Details'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Close Confirmation Modal */}
      <CancelBookingModal
        visible={showCloseConfirm}
        onCancel={handleCancelClose}
        onConfirm={handleConfirmClose}
      />
    </View>
  );
}
