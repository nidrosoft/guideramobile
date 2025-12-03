/**
 * TRIP SETUP STEP
 * 
 * First step: destination, dates, travelers, and package type selection.
 * This is the unified entry point that sets context for the entire package.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Location,
  Calendar,
  People,
  Airplane,
  Building,
  Car,
  Map1,
  ArrowRight2,
  CloseCircle,
  SearchNormal1,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { usePackageStore } from '../../../stores/usePackageStore';
import { PACKAGE_TEMPLATES, PackageTemplate } from '../../../types/package.types';
import { Location as LocationType } from '../../../types/booking.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TripSetupStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Mock destinations for demo
const POPULAR_DESTINATIONS: LocationType[] = [
  { id: '1', name: 'Paris', code: 'PAR', country: 'France', countryCode: 'FR', type: 'city' },
  { id: '2', name: 'Tokyo', code: 'TYO', country: 'Japan', countryCode: 'JP', type: 'city' },
  { id: '3', name: 'New York', code: 'NYC', country: 'USA', countryCode: 'US', type: 'city' },
  { id: '4', name: 'London', code: 'LON', country: 'UK', countryCode: 'GB', type: 'city' },
  { id: '5', name: 'Dubai', code: 'DXB', country: 'UAE', countryCode: 'AE', type: 'city' },
  { id: '6', name: 'Singapore', code: 'SIN', country: 'Singapore', countryCode: 'SG', type: 'city' },
  { id: '7', name: 'Barcelona', code: 'BCN', country: 'Spain', countryCode: 'ES', type: 'city' },
  { id: '8', name: 'Rome', code: 'ROM', country: 'Italy', countryCode: 'IT', type: 'city' },
];

const PACKAGE_TYPE_ICONS: Record<string, any> = {
  flight_hotel: { primary: Airplane, secondary: Building },
  flight_hotel_car: { primary: Airplane, secondary: Car },
  flight_hotel_experience: { primary: Building, secondary: Map1 },
  all_inclusive: { primary: TickCircle, secondary: null },
  custom: { primary: null, secondary: null },
};

export default function TripSetupStep({
  onNext,
  onBack,
  onClose,
}: TripSetupStepProps) {
  const insets = useSafeAreaInsets();
  const {
    tripSetup,
    setOrigin,
    setDestination,
    setDepartureDate,
    setReturnDate,
    setTravelers,
    setPackageType,
  } = usePackageStore();
  
  // Modal states
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTravelersModal, setShowTravelersModal] = useState(false);
  
  // Local state for date picker
  const [selectingReturn, setSelectingReturn] = useState(false);
  
  const isFormValid = () => {
    return (
      tripSetup.origin !== null &&
      tripSetup.destination !== null &&
      tripSetup.departureDate !== null &&
      tripSetup.returnDate !== null
    );
  };
  
  const handleContinue = () => {
    if (!isFormValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select';
    // Ensure date is a proper Date object (may be string from persistence)
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Select';
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getTotalTravelers = () => {
    const { adults, children, infants } = tripSetup.travelers;
    const total = adults + children + infants;
    return `${total} traveler${total > 1 ? 's' : ''}`;
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Plan Your Trip</Text>
          <Text style={styles.subtitle}>
            Bundle and save up to 20% on your travel
          </Text>
        </Animated.View>
        
        {/* Package Type Selection */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>What do you need?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.packageTypesContainer}
          >
            {PACKAGE_TEMPLATES.filter(t => t.type !== 'custom').map((template) => {
              const isSelected = tripSetup.packageType === template.type;
              const icons = PACKAGE_TYPE_ICONS[template.type];
              
              return (
                <TouchableOpacity
                  key={template.type}
                  style={[
                    styles.packageTypeCard,
                    isSelected && styles.packageTypeCardSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPackageType(template.type);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.packageTypeIcons,
                    isSelected && styles.packageTypeIconsSelected,
                  ]}>
                    {icons.primary && (
                      <icons.primary 
                        size={16} 
                        color={isSelected ? colors.white : colors.primary}
                        variant="Bold"
                      />
                    )}
                    {icons.secondary && (
                      <>
                        <Text style={[
                          styles.plusSign,
                          isSelected && styles.plusSignSelected,
                        ]}>+</Text>
                        <icons.secondary 
                          size={16} 
                          color={isSelected ? colors.white : colors.primary}
                          variant="Bold"
                        />
                      </>
                    )}
                  </View>
                  <Text style={[
                    styles.packageTypeLabel,
                    isSelected && styles.packageTypeLabelSelected,
                  ]}>
                    {template.label}
                  </Text>
                  {template.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
        
        {/* Origin & Destination */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Where are you traveling?</Text>
          
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowOriginModal(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <Location size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>From</Text>
              <Text style={[
                styles.inputValue,
                !tripSetup.origin && styles.inputPlaceholder,
              ]}>
                {tripSetup.origin?.name || 'Select departure city'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowDestinationModal(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.success + '15' }]}>
              <Location size={20} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>To</Text>
              <Text style={[
                styles.inputValue,
                !tripSetup.destination && styles.inputPlaceholder,
              ]}>
                {tripSetup.destination?.name || 'Select destination'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Dates */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>When are you traveling?</Text>
          
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateCard, styles.dateCardHalf]}
              onPress={() => {
                setSelectingReturn(false);
                setShowDateModal(true);
              }}
            >
              <Calendar size={20} color={colors.primary} />
              <View>
                <Text style={styles.dateLabel}>Departure</Text>
                <Text style={[
                  styles.dateValue,
                  !tripSetup.departureDate && styles.inputPlaceholder,
                ]}>
                  {formatDate(tripSetup.departureDate)}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateCard, styles.dateCardHalf]}
              onPress={() => {
                setSelectingReturn(true);
                setShowDateModal(true);
              }}
            >
              <Calendar size={20} color={colors.success} />
              <View>
                <Text style={styles.dateLabel}>Return</Text>
                <Text style={[
                  styles.dateValue,
                  !tripSetup.returnDate && styles.inputPlaceholder,
                ]}>
                  {formatDate(tripSetup.returnDate)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Travelers */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Who's traveling?</Text>
          
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowTravelersModal(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.warning + '15' }]}>
              <People size={20} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Travelers</Text>
              <Text style={styles.inputValue}>{getTotalTravelers()}</Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isFormValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!isFormValid()}
        >
          <LinearGradient
            colors={isFormValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Build Your Package</Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showOriginModal || showDestinationModal}
        onClose={() => {
          setShowOriginModal(false);
          setShowDestinationModal(false);
        }}
        onSelect={(location) => {
          if (showOriginModal) {
            setOrigin(location);
          } else {
            setDestination(location);
          }
          setShowOriginModal(false);
          setShowDestinationModal(false);
        }}
        title={showOriginModal ? 'Select Origin' : 'Select Destination'}
        destinations={POPULAR_DESTINATIONS}
      />
      
      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={(date) => {
          if (selectingReturn) {
            setReturnDate(date);
          } else {
            setDepartureDate(date);
            // Auto-advance to return date
            if (!tripSetup.returnDate) {
              setSelectingReturn(true);
            } else {
              setShowDateModal(false);
            }
          }
        }}
        selectedDate={selectingReturn ? tripSetup.returnDate : tripSetup.departureDate}
        minDate={selectingReturn ? tripSetup.departureDate : new Date()}
        title={selectingReturn ? 'Select Return Date' : 'Select Departure Date'}
      />
      
      {/* Travelers Modal */}
      <TravelersModal
        visible={showTravelersModal}
        onClose={() => setShowTravelersModal(false)}
        travelers={tripSetup.travelers}
        onUpdate={setTravelers}
      />
    </View>
  );
}

// ============================================
// LOCATION PICKER MODAL
// ============================================

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationType) => void;
  title: string;
  destinations: LocationType[];
}

function LocationPickerModal({
  visible,
  onClose,
  onSelect,
  title,
  destinations,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  
  const filteredDestinations = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.country.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <CloseCircle size={28} color={colors.gray500} variant="Bold" />
          </TouchableOpacity>
        </View>
        
        <View style={modalStyles.searchContainer}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={modalStyles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        
        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={modalStyles.locationItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(item);
              }}
            >
              <View style={modalStyles.locationIcon}>
                <Location size={20} color={colors.primary} />
              </View>
              <View style={modalStyles.locationInfo}>
                <Text style={modalStyles.locationName}>{item.name}</Text>
                <Text style={modalStyles.locationCountry}>{item.country}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={modalStyles.listContent}
        />
      </View>
    </Modal>
  );
}

// ============================================
// DATE PICKER MODAL
// ============================================

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
  minDate: Date | null;
  title: string;
}

function DatePickerModal({
  visible,
  onClose,
  onSelect,
  selectedDate,
  minDate,
  title,
}: DatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Add padding for first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    return false;
  };
  
  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };
  
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);
  
  React.useEffect(() => {
    setTempSelectedDate(selectedDate);
  }, [selectedDate, visible]);
  
  const handleConfirm = () => {
    if (tempSelectedDate) {
      onSelect(tempSelectedDate);
      onClose();
    }
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dateBottomSheet}>
          <View style={modalStyles.sheetHandle} />
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <CloseCircle size={24} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>
          
          {/* Month Navigation */}
          <View style={modalStyles.monthNav}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          >
            <Text style={modalStyles.monthNavButton}>←</Text>
          </TouchableOpacity>
          <Text style={modalStyles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          >
            <Text style={modalStyles.monthNavButton}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Day Headers */}
        <View style={modalStyles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={modalStyles.dayHeader}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar Grid */}
        <FlatList
          data={days}
          keyExtractor={(item, index) => index.toString()}
          numColumns={7}
          renderItem={({ item }) => {
            const isCurrentMonth = item.getMonth() === currentMonth.getMonth();
            const disabled = isDateDisabled(item);
            const selected = isDateSelected(item);
            
            return (
              <TouchableOpacity
                style={[
                  modalStyles.dayCell,
                  selected && modalStyles.dayCellSelected,
                  disabled && modalStyles.dayCellDisabled,
                ]}
                onPress={() => {
                  if (!disabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTempSelectedDate(item);
                  }
                }}
                disabled={disabled}
              >
                <Text style={[
                  modalStyles.dayText,
                  !isCurrentMonth && modalStyles.dayTextOther,
                  selected && modalStyles.dayTextSelected,
                  disabled && modalStyles.dayTextDisabled,
                ]}>
                  {item.getDate()}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={modalStyles.calendarContent}
        />
          
          <View style={[modalStyles.sheetFooter, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={[modalStyles.doneButton, !tempSelectedDate && modalStyles.doneButtonDisabled]}
              onPress={handleConfirm}
              disabled={!tempSelectedDate}
            >
              <Text style={modalStyles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// TRAVELERS MODAL
// ============================================

interface TravelersModalProps {
  visible: boolean;
  onClose: () => void;
  travelers: { adults: number; children: number; infants: number };
  onUpdate: (travelers: { adults: number; children: number; infants: number }) => void;
}

function TravelersModal({
  visible,
  onClose,
  travelers,
  onUpdate,
}: TravelersModalProps) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState(travelers);
  
  React.useEffect(() => {
    setLocal(travelers);
  }, [travelers]);
  
  const updateCount = (type: 'adults' | 'children' | 'infants', delta: number) => {
    const newValue = Math.max(type === 'adults' ? 1 : 0, local[type] + delta);
    const maxValue = type === 'infants' ? local.adults : 9;
    setLocal({ ...local, [type]: Math.min(newValue, maxValue) });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleDone = () => {
    onUpdate(local);
    onClose();
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.bottomSheet}>
          <View style={modalStyles.sheetHandle} />
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>Travelers</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <CloseCircle size={24} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.travelersContent}>
          {[
            { type: 'adults' as const, label: 'Adults', subtitle: 'Age 12+' },
            { type: 'children' as const, label: 'Children', subtitle: 'Age 2-11' },
            { type: 'infants' as const, label: 'Infants', subtitle: 'Under 2' },
          ].map((item) => (
            <View key={item.type} style={modalStyles.travelerRow}>
              <View>
                <Text style={modalStyles.travelerLabel}>{item.label}</Text>
                <Text style={modalStyles.travelerSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={modalStyles.counterContainer}>
                <TouchableOpacity
                  style={[
                    modalStyles.counterButton,
                    local[item.type] <= (item.type === 'adults' ? 1 : 0) && modalStyles.counterButtonDisabled,
                  ]}
                  onPress={() => updateCount(item.type, -1)}
                  disabled={local[item.type] <= (item.type === 'adults' ? 1 : 0)}
                >
                  <Text style={modalStyles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={modalStyles.counterValue}>{local[item.type]}</Text>
                <TouchableOpacity
                  style={modalStyles.counterButton}
                  onPress={() => updateCount(item.type, 1)}
                >
                  <Text style={modalStyles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          </View>
          
          <View style={[modalStyles.sheetFooter, { paddingBottom: insets.bottom + spacing.md }]}>
            <TouchableOpacity
              style={modalStyles.doneButton}
              onPress={handleDone}
            >
              <Text style={modalStyles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Package Types
  packageTypesContainer: {
    gap: spacing.sm,
  },
  packageTypeCard: {
    width: 120,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gray200,
    alignItems: 'center',
    ...shadows.sm,
  },
  packageTypeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  packageTypeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    marginBottom: spacing.sm,
  },
  packageTypeIconsSelected: {
    backgroundColor: colors.primary,
  },
  plusSign: {
    fontSize: 14,
    color: colors.primary,
    marginHorizontal: 2,
  },
  plusSignSelected: {
    color: colors.white,
  },
  packageTypeLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  packageTypeLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  popularBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1,
  },
  popularText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Input Cards
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  inputValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  inputPlaceholder: {
    color: colors.gray400,
  },
  
  // Date Cards
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  dateCardHalf: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dateValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginTop: 2,
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
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Bottom Sheet Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  dateBottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '65%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
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
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: spacing.md,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  locationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Calendar
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  monthNavButton: {
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  calendarContent: {
    paddingHorizontal: spacing.lg,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: borderRadius.lg,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dayTextOther: {
    color: colors.gray300,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  dayTextDisabled: {
    color: colors.gray300,
  },
  
  // Travelers
  travelersContent: {
    padding: spacing.lg,
  },
  travelerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  travelerLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  travelerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  counterButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
