/**
 * CAR RENTAL SEARCH STEP
 * 
 * Capture pickup/return location, dates, times, and driver age.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Location,
  Calendar,
  Clock,
  Car,
  ArrowRight2,
  CloseCircle,
  SearchNormal1,
  User,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useCarStore } from '../../../stores/useCarStore';
import { Location as LocationType } from '../../../types/booking.types';

interface SearchStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Mock locations
const POPULAR_LOCATIONS: LocationType[] = [
  { id: '1', name: 'Los Angeles Airport (LAX)', code: 'LAX', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '2', name: 'San Francisco Airport (SFO)', code: 'SFO', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '3', name: 'New York JFK Airport', code: 'JFK', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '4', name: 'Miami Airport (MIA)', code: 'MIA', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '5', name: 'Las Vegas Airport (LAS)', code: 'LAS', country: 'USA', countryCode: 'US', type: 'airport' },
  { id: '6', name: 'Downtown Los Angeles', code: 'DTLA', country: 'USA', countryCode: 'US', type: 'city' },
  { id: '7', name: 'Downtown Miami', code: 'MIA-DT', country: 'USA', countryCode: 'US', type: 'city' },
  { id: '8', name: 'Orlando Airport (MCO)', code: 'MCO', country: 'USA', countryCode: 'US', type: 'airport' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00',
];

export default function SearchStep({ onNext, onBack, onClose }: SearchStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    setPickupLocation,
    setReturnLocation,
    setSameReturnLocation,
    setPickupDate,
    setPickupTime,
    setReturnDate,
    setReturnTime,
    setDriverAge,
    isSearchValid,
  } = useCarStore();
  
  // Modal states
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPickupDateModal, setShowPickupDateModal] = useState(false);
  const [showReturnDateModal, setShowReturnDateModal] = useState(false);
  const [showPickupTimeModal, setShowPickupTimeModal] = useState(false);
  const [showReturnTimeModal, setShowReturnTimeModal] = useState(false);
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Select date';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const handleSearch = () => {
    if (!isSearchValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Find Your Car</Text>
          <Text style={styles.subtitle}>Search for the perfect rental</Text>
        </Animated.View>
        
        {/* Pickup Location */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowPickupModal(true)}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <Location size={20} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={[
                styles.inputValue,
                !searchParams.pickupLocation && styles.inputPlaceholder,
              ]}>
                {searchParams.pickupLocation?.name || 'Select pickup location'}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Same Return Location Toggle */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Return to same location</Text>
          <Switch
            value={searchParams.sameReturnLocation}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSameReturnLocation(value);
            }}
            trackColor={{ false: colors.gray300, true: colors.primary + '50' }}
            thumbColor={searchParams.sameReturnLocation ? colors.primary : colors.gray400}
          />
        </Animated.View>
        
        {/* Return Location (if different) */}
        {!searchParams.sameReturnLocation && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Return Location</Text>
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowReturnModal(true)}
            >
              <View style={[styles.inputIcon, { backgroundColor: colors.success + '15' }]}>
                <Location size={20} color={colors.success} variant="Bold" />
              </View>
              <View style={styles.inputContent}>
                <Text style={[
                  styles.inputValue,
                  !searchParams.returnLocation && styles.inputPlaceholder,
                ]}>
                  {searchParams.returnLocation?.name || 'Select return location'}
                </Text>
              </View>
              <ArrowRight2 size={20} color={colors.gray400} />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Pickup Date & Time */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeCard, { flex: 1.5 }]}
              onPress={() => setShowPickupDateModal(true)}
            >
              <Calendar size={18} color={colors.primary} />
              <Text style={[
                styles.dateTimeValue,
                !searchParams.pickupDate && styles.inputPlaceholder,
              ]}>
                {formatDate(searchParams.pickupDate)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => setShowPickupTimeModal(true)}
            >
              <Clock size={18} color={colors.primary} />
              <Text style={styles.dateTimeValue}>
                {formatTime(searchParams.pickupTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Return Date & Time */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Return</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeCard, { flex: 1.5 }]}
              onPress={() => setShowReturnDateModal(true)}
            >
              <Calendar size={18} color={colors.success} />
              <Text style={[
                styles.dateTimeValue,
                !searchParams.returnDate && styles.inputPlaceholder,
              ]}>
                {formatDate(searchParams.returnDate)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => setShowReturnTimeModal(true)}
            >
              <Clock size={18} color={colors.success} />
              <Text style={styles.dateTimeValue}>
                {formatTime(searchParams.returnTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Driver Age */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Age</Text>
          <View style={styles.ageSelector}>
            <TouchableOpacity
              style={styles.ageButton}
              onPress={() => {
                if (searchParams.driverAge > 18) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDriverAge(searchParams.driverAge - 1);
                }
              }}
            >
              <Text style={styles.ageButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.ageDisplay}>
              <Text style={styles.ageValue}>{searchParams.driverAge}</Text>
              <Text style={styles.ageLabel}>years old</Text>
            </View>
            <TouchableOpacity
              style={styles.ageButton}
              onPress={() => {
                if (searchParams.driverAge < 99) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDriverAge(searchParams.driverAge + 1);
                }
              }}
            >
              <Text style={styles.ageButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {searchParams.driverAge < 25 && (
            <Text style={styles.ageWarning}>
              Young driver fee may apply for drivers under 25
            </Text>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.searchButton, !isSearchValid() && styles.searchButtonDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={!isSearchValid()}
        >
          <LinearGradient
            colors={isSearchValid() ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchGradient}
          >
            <Car size={20} color={colors.white} variant="Bold" />
            <Text style={styles.searchText}>Search Cars</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showPickupModal || showReturnModal}
        onClose={() => {
          setShowPickupModal(false);
          setShowReturnModal(false);
        }}
        onSelect={(location) => {
          if (showPickupModal) {
            setPickupLocation(location);
          } else {
            setReturnLocation(location);
          }
          setShowPickupModal(false);
          setShowReturnModal(false);
        }}
        title={showPickupModal ? 'Pickup Location' : 'Return Location'}
        locations={POPULAR_LOCATIONS}
      />
      
      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showPickupDateModal}
        onClose={() => setShowPickupDateModal(false)}
        onSelect={(date) => {
          setPickupDate(date);
          setShowPickupDateModal(false);
        }}
        selectedDate={searchParams.pickupDate}
        minDate={new Date()}
        title="Pickup Date"
      />
      
      <DatePickerModal
        visible={showReturnDateModal}
        onClose={() => setShowReturnDateModal(false)}
        onSelect={(date) => {
          setReturnDate(date);
          setShowReturnDateModal(false);
        }}
        selectedDate={searchParams.returnDate}
        minDate={searchParams.pickupDate || new Date()}
        title="Return Date"
      />
      
      {/* Time Picker Modals */}
      <TimePickerModal
        visible={showPickupTimeModal}
        onClose={() => setShowPickupTimeModal(false)}
        onSelect={(time) => {
          setPickupTime(time);
          setShowPickupTimeModal(false);
        }}
        selectedTime={searchParams.pickupTime}
        title="Pickup Time"
      />
      
      <TimePickerModal
        visible={showReturnTimeModal}
        onClose={() => setShowReturnTimeModal(false)}
        onSelect={(time) => {
          setReturnTime(time);
          setShowReturnTimeModal(false);
        }}
        selectedTime={searchParams.returnTime}
        title="Return Time"
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
  locations: LocationType[];
}

function LocationPickerModal({ visible, onClose, onSelect, title, locations }: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  
  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
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
              placeholder="Search locations..."
              placeholderTextColor={colors.gray400}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={modalStyles.locationItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item);
                }}
              >
                <View style={[
                  modalStyles.locationIcon,
                  { backgroundColor: item.type === 'airport' ? colors.primary + '15' : colors.success + '15' }
                ]}>
                  {item.type === 'airport' ? (
                    <Car size={18} color={colors.primary} />
                  ) : (
                    <Location size={18} color={colors.success} />
                  )}
                </View>
                <View style={modalStyles.locationInfo}>
                  <Text style={modalStyles.locationName}>{item.name}</Text>
                  <Text style={modalStyles.locationType}>
                    {item.type === 'airport' ? 'Airport' : 'City Center'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={modalStyles.listContent}
          />
        </View>
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

function DatePickerModal({ visible, onClose, onSelect, selectedDate, minDate, title }: DatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  
  React.useEffect(() => {
    setTempDate(selectedDate);
  }, [selectedDate, visible]);
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
  const isDateDisabled = (date: Date) => {
    const min = minDate instanceof Date ? minDate : minDate ? new Date(minDate) : null;
    if (min && date < new Date(min.setHours(0, 0, 0, 0))) return true;
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    return false;
  };
  
  const isDateSelected = (date: Date) => {
    if (!tempDate) return false;
    const selected = tempDate instanceof Date ? tempDate : new Date(tempDate);
    return date.toDateString() === selected.toDateString();
  };
  
  const handleConfirm = () => {
    if (tempDate) {
      onSelect(tempDate);
    }
    onClose();
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dateSheet}>
          <View style={modalStyles.sheetHandle} />
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={24} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.monthNav}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <Text style={modalStyles.monthNavButton}>←</Text>
            </TouchableOpacity>
            <Text style={modalStyles.monthTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <Text style={modalStyles.monthNavButton}>→</Text>
            </TouchableOpacity>
          </View>
          
          <View style={modalStyles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={modalStyles.dayHeader}>{day}</Text>
            ))}
          </View>
          
          <FlatList
            data={days}
            keyExtractor={(_, index) => index.toString()}
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
                      setTempDate(item);
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
              style={[modalStyles.doneButton, !tempDate && modalStyles.doneButtonDisabled]}
              onPress={handleConfirm}
              disabled={!tempDate}
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
// TIME PICKER MODAL
// ============================================

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  selectedTime: string;
  title: string;
}

function TimePickerModal({ visible, onClose, onSelect, selectedTime, title }: TimePickerModalProps) {
  const insets = useSafeAreaInsets();
  
  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.timeSheet}>
          <View style={modalStyles.sheetHandle} />
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={24} color={colors.gray500} variant="Bold" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={TIME_SLOTS}
            keyExtractor={(item) => item}
            numColumns={3}
            renderItem={({ item }) => {
              const isSelected = item === selectedTime;
              return (
                <TouchableOpacity
                  style={[
                    modalStyles.timeSlot,
                    isSelected && modalStyles.timeSlotSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(item);
                  }}
                >
                  <Text style={[
                    modalStyles.timeSlotText,
                    isSelected && modalStyles.timeSlotTextSelected,
                  ]}>
                    {formatTimeDisplay(item)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={modalStyles.timeGrid}
          />
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
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
  
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  inputIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContent: { flex: 1, marginLeft: spacing.md },
  inputValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  inputPlaceholder: { color: colors.gray400 },
  
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  dateTimeValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  
  ageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  ageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  ageDisplay: {
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  ageValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  ageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  ageWarning: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  
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
  searchButton: { borderRadius: borderRadius.xl, overflow: 'hidden' },
  searchButtonDisabled: { opacity: 0.7 },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 60,
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
  listContent: { paddingHorizontal: spacing.lg },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: { marginLeft: spacing.md },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  locationType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Date Sheet
  dateSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
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
  calendarContent: { paddingHorizontal: spacing.lg },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellDisabled: { opacity: 0.3 },
  dayText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dayTextOther: { color: colors.gray300 },
  dayTextSelected: { color: colors.white, fontWeight: typography.fontWeight.semibold },
  dayTextDisabled: { color: colors.gray300 },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doneButtonDisabled: { backgroundColor: colors.gray300 },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  
  // Time Sheet
  timeSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  timeGrid: {
    padding: spacing.md,
  },
  timeSlot: {
    flex: 1,
    margin: 4,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
});
