/**
 * SEARCH STEP
 * 
 * Flight search form with origin/destination, dates, passengers, and cabin class.
 * Beautiful animated UI with premium feel.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Airplane,
  ArrowSwapHorizontal,
  Calendar,
  People,
  ArrowRight2,
  Location,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { TripType, CabinClass, TRIP_TYPE_OPTIONS, CABIN_CLASS_OPTIONS } from '../../../types/flight.types';
import { AIRPORTS } from '../../../data/mockFlights';
import DateRangePicker from '../../../components/shared/DateRangePicker';
import PassengerSelector from '../../../components/shared/PassengerSelector';

interface SearchStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
}

// Animated Pressable component
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SearchStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
  isFirstStep,
}: SearchStepProps) {
  const insets = useSafeAreaInsets();
  const { searchParams, setSearchParams, setTripType, setCabinClass, swapLocations } = useFlightStore();
  
  // Modal states
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);
  const [showCabinPicker, setShowCabinPicker] = useState(false);
  
  // Animation values
  const swapRotation = useSharedValue(0);
  
  const handleSwapLocations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swapRotation.value = withSpring(swapRotation.value + 180, { damping: 15 });
    swapLocations();
  };
  
  const swapButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapRotation.value}deg` }],
  }));
  
  const canSearch = searchParams.origin && searchParams.destination && searchParams.departureDate;
  
  const handleSearch = () => {
    if (!canSearch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getPassengerLabel = (): string => {
    const { adults, children, infants } = searchParams.passengers;
    const total = adults + children + infants;
    if (total === 1) return '1 Passenger';
    return `${total} Passengers`;
  };
  
  const getCabinLabel = (): string => {
    const option = CABIN_CLASS_OPTIONS.find(o => o.class === searchParams.cabinClass);
    return option?.label || 'Economy';
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trip Type Selector */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.tripTypeContainer}
        >
          {TRIP_TYPE_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.tripTypeButton,
                searchParams.tripType === option.type && styles.tripTypeButtonActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTripType(option.type);
              }}
            >
              <Text
                style={[
                  styles.tripTypeText,
                  searchParams.tripType === option.type && styles.tripTypeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
        
        {/* Location Cards */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.locationSection}
        >
          {/* Origin */}
          <TouchableOpacity
            style={styles.locationCard}
            onPress={() => setShowOriginPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDot, styles.locationDotOrigin]} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>From</Text>
              {searchParams.origin ? (
                <>
                  <Text style={styles.locationCode}>{searchParams.origin.code}</Text>
                  <Text style={styles.locationCity} numberOfLines={1}>
                    {searchParams.origin.city}
                  </Text>
                </>
              ) : (
                <Text style={styles.locationPlaceholder}>Select origin</Text>
              )}
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
          
          {/* Swap Button */}
          <Animated.View style={[styles.swapButtonContainer, swapButtonStyle]}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapLocations}
            >
              <ArrowSwapHorizontal size={20} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Destination */}
          <TouchableOpacity
            style={styles.locationCard}
            onPress={() => setShowDestinationPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDot, styles.locationDotDestination]} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>To</Text>
              {searchParams.destination ? (
                <>
                  <Text style={styles.locationCode}>{searchParams.destination.code}</Text>
                  <Text style={styles.locationCity} numberOfLines={1}>
                    {searchParams.destination.city}
                  </Text>
                </>
              ) : (
                <Text style={styles.locationPlaceholder}>Select destination</Text>
              )}
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
          
          {/* Connecting Line */}
          <View style={styles.connectingLine} />
        </Animated.View>
        
        {/* Date Selection */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.dateSection}
        >
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconContainer}>
              <Calendar size={22} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Departure</Text>
              <Text style={[
                styles.dateValue,
                !searchParams.departureDate && styles.datePlaceholder,
              ]}>
                {formatDate(searchParams.departureDate)}
              </Text>
            </View>
          </TouchableOpacity>
          
          {searchParams.tripType === 'round-trip' && (
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconContainer}>
                <Calendar size={22} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.dateContent}>
                <Text style={styles.dateLabel}>Return</Text>
                <Text style={[
                  styles.dateValue,
                  !searchParams.returnDate && styles.datePlaceholder,
                ]}>
                  {formatDate(searchParams.returnDate)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Passengers & Cabin Class */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.optionsSection}
        >
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setShowPassengerPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIconContainer}>
              <People size={22} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Passengers</Text>
              <Text style={styles.optionValue}>{getPassengerLabel()}</Text>
            </View>
            <ArrowRight2 size={18} color={colors.gray400} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setShowCabinPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.optionIconContainer}>
              <Airplane size={22} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>Cabin Class</Text>
              <Text style={styles.optionValue}>{getCabinLabel()}</Text>
            </View>
            <ArrowRight2 size={18} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Direct Flights Toggle */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(350)}
          style={styles.toggleSection}
        >
          <TouchableOpacity
            style={styles.toggleCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchParams({ directOnly: !searchParams.directOnly });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Direct flights only</Text>
              <Text style={styles.toggleDescription}>
                Skip connecting flights
              </Text>
            </View>
            <View style={[
              styles.toggleSwitch,
              searchParams.directOnly && styles.toggleSwitchActive,
            ]}>
              <Animated.View style={[
                styles.toggleKnob,
                searchParams.directOnly && styles.toggleKnobActive,
              ]} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Search Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSearch ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchButtonGradient}
          >
            <Airplane size={22} color={colors.white} variant="Bold" />
            <Text style={styles.searchButtonText}>Search Flights</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Modals */}
      <AirportPickerModal
        visible={showOriginPicker}
        onClose={() => setShowOriginPicker(false)}
        onSelect={(airport) => {
          setSearchParams({ origin: airport });
          setShowOriginPicker(false);
        }}
        title="Select Origin"
        excludeCode={searchParams.destination?.code}
      />
      
      <AirportPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(airport) => {
          setSearchParams({ destination: airport });
          setShowDestinationPicker(false);
        }}
        title="Select Destination"
        excludeCode={searchParams.origin?.code}
      />
      
      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        startDate={searchParams.departureDate}
        endDate={searchParams.returnDate}
        onStartDateChange={(date) => setSearchParams({ departureDate: date })}
        onEndDateChange={(date) => setSearchParams({ returnDate: date })}
        startLabel="Departure"
        endLabel="Return"
        singleDate={searchParams.tripType === 'one-way'}
      />
      
      <PassengerSelector
        visible={showPassengerPicker}
        onClose={() => setShowPassengerPicker(false)}
        passengers={searchParams.passengers}
        onPassengersChange={(passengers) => setSearchParams({ passengers })}
      />
      
      <CabinClassModal
        visible={showCabinPicker}
        onClose={() => setShowCabinPicker(false)}
        selected={searchParams.cabinClass}
        onSelect={(cabinClass) => {
          setCabinClass(cabinClass);
          setShowCabinPicker(false);
        }}
      />
    </View>
  );
}

// ============================================
// AIRPORT PICKER MODAL
// ============================================

interface AirportPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: any) => void;
  title: string;
  excludeCode?: string;
}

function AirportPickerModal({
  visible,
  onClose,
  onSelect,
  title,
  excludeCode,
}: AirportPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredAirports = AIRPORTS.filter((airport) => {
    if (airport.code === excludeCode) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      airport.code.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query)
    );
  });
  
  if (!visible) return null;
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <Animated.View 
        entering={FadeInUp.duration(300)}
        style={[styles.airportModal, { paddingTop: insets.top }]}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalCloseButton} />
        </View>
        
        <View style={styles.searchInputContainer}>
          <Location size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or airport"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        
        <ScrollView style={styles.airportList}>
          {filteredAirports.map((airport, index) => (
            <Animated.View
              key={airport.code}
              entering={FadeInDown.duration(300).delay(index * 50)}
            >
              <TouchableOpacity
                style={styles.airportItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(airport);
                }}
              >
                <View style={styles.airportItemLeft}>
                  <Text style={styles.airportCode}>{airport.code}</Text>
                </View>
                <View style={styles.airportItemCenter}>
                  <Text style={styles.airportCity}>{airport.city}</Text>
                  <Text style={styles.airportName} numberOfLines={1}>
                    {airport.name}
                  </Text>
                </View>
                <ArrowRight2 size={18} color={colors.gray300} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ============================================
// CABIN CLASS MODAL
// ============================================

interface CabinClassModalProps {
  visible: boolean;
  onClose: () => void;
  selected: CabinClass;
  onSelect: (cabinClass: CabinClass) => void;
}

function CabinClassModal({
  visible,
  onClose,
  selected,
  onSelect,
}: CabinClassModalProps) {
  const insets = useSafeAreaInsets();
  
  if (!visible) return null;
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <Animated.View 
        entering={FadeInUp.duration(300)}
        style={[styles.cabinModal, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.cabinModalHandle} />
        <Text style={styles.cabinModalTitle}>Select Cabin Class</Text>
        
        {CABIN_CLASS_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.class}
            entering={FadeInDown.duration(300).delay(index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.cabinOption,
                selected === option.class && styles.cabinOptionSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.class);
              }}
            >
              <View style={styles.cabinOptionContent}>
                <Text style={[
                  styles.cabinOptionLabel,
                  selected === option.class && styles.cabinOptionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.cabinOptionDescription}>
                  {option.description}
                </Text>
              </View>
              {selected === option.class && (
                <TickCircle size={24} color={colors.primary} variant="Bold" />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  
  // Trip Type
  tripTypeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  tripTypeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  tripTypeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  tripTypeTextActive: {
    color: colors.white,
  },
  
  // Location Section
  locationSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
    position: 'relative',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  locationIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationDotOrigin: {
    backgroundColor: colors.primary,
  },
  locationDotDestination: {
    backgroundColor: colors.error,
  },
  locationContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationCode: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  locationCity: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  locationPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.gray400,
    marginTop: spacing.xs,
  },
  swapButtonContainer: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  connectingLine: {
    position: 'absolute',
    left: spacing.md + 19,
    top: spacing.md + 44,
    bottom: spacing.md + 44,
    width: 2,
    backgroundColor: colors.gray200,
  },
  
  // Date Section
  dateSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dateCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  dateIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    color: colors.gray400,
    fontWeight: typography.fontWeight.regular,
  },
  
  // Options Section
  optionsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  optionValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  
  // Toggle Section
  toggleSection: {
    marginBottom: spacing.lg,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  searchButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  
  // Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  airportModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  airportList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  airportItemLeft: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  airportCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  airportItemCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  airportCity: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  airportName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Cabin Modal
  cabinModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },
  cabinModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  cabinModalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  cabinOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  cabinOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  cabinOptionContent: {
    flex: 1,
  },
  cabinOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cabinOptionLabelSelected: {
    color: colors.primary,
  },
  cabinOptionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
