/**
 * HOTEL SEARCH STEP
 * 
 * Search form with destination, dates, and guest selection.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Location,
  Calendar,
  People,
  ArrowRight2,
  SearchNormal1,
  Building,
  TickCircle,
  Add,
  Minus,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useHotelStore } from '../../../stores/useHotelStore';
import { POPULAR_DESTINATIONS } from '../../../data/mockHotels';
import { Location as LocationType } from '../../../types/booking.types';

interface SearchStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function SearchStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: SearchStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    setDestination,
    setCheckInDate,
    setCheckOutDate,
    setGuests,
  } = useHotelStore();
  
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  
  const canSearch = useMemo(() => {
    return (
      searchParams.destination !== null &&
      searchParams.checkIn !== null &&
      searchParams.checkOut !== null
    );
  }, [searchParams]);
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getGuestSummary = (): string => {
    const { rooms, adults, children } = searchParams.guests;
    const parts = [];
    parts.push(`${rooms} room${rooms > 1 ? 's' : ''}`);
    parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
    if (children > 0) {
      parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
    }
    return parts.join(', ');
  };
  
  const handleSearch = () => {
    if (!canSearch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  // Set default dates if not set
  React.useEffect(() => {
    if (!searchParams.checkIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(tomorrow);
    }
    if (!searchParams.checkOut) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 3);
      setCheckOutDate(nextWeek);
    }
  }, []);
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Destination Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.card}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setShowDestinationPicker(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Building size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardLabel}>Destination</Text>
              {searchParams.destination ? (
                <Text style={styles.cardValue}>{searchParams.destination.name}</Text>
              ) : (
                <Text style={styles.cardPlaceholder}>Where are you going?</Text>
              )}
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Dates Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(150)}
          style={styles.card}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
              <Calendar size={24} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardLabel}>Check-in / Check-out</Text>
              <Text style={styles.cardValue}>
                {formatDate(searchParams.checkIn)} - {formatDate(searchParams.checkOut)}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Guests Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.card}
        >
          <TouchableOpacity
            style={styles.cardContent}
            onPress={() => setShowGuestPicker(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
              <People size={24} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardLabel}>Guests & Rooms</Text>
              <Text style={styles.cardValue}>{getGuestSummary()}</Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Popular Destinations */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.popularSection}
        >
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.destinationGrid}>
            {POPULAR_DESTINATIONS.slice(0, 6).map((dest, index) => (
              <TouchableOpacity
                key={dest.id}
                style={[
                  styles.destinationChip,
                  searchParams.destination?.id === dest.id && styles.destinationChipActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDestination(dest);
                }}
              >
                <Text
                  style={[
                    styles.destinationChipText,
                    searchParams.destination?.id === dest.id && styles.destinationChipTextActive,
                  ]}
                >
                  {dest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Search Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
          onPress={handleSearch}
          activeOpacity={0.8}
          disabled={!canSearch}
        >
          <LinearGradient
            colors={canSearch ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchButtonGradient}
          >
            <SearchNormal1 size={20} color={colors.white} />
            <Text style={styles.searchButtonText}>Search Hotels</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Destination Picker Modal */}
      <DestinationPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(dest) => {
          setDestination(dest);
          setShowDestinationPicker(false);
        }}
        selected={searchParams.destination}
      />
      
      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        checkIn={searchParams.checkIn}
        checkOut={searchParams.checkOut}
        onSelectCheckIn={setCheckInDate}
        onSelectCheckOut={setCheckOutDate}
      />
      
      {/* Guest Picker Modal */}
      <GuestPickerModal
        visible={showGuestPicker}
        onClose={() => setShowGuestPicker(false)}
        guests={searchParams.guests}
        onUpdate={setGuests}
      />
    </View>
  );
}

// ============================================
// DESTINATION PICKER MODAL
// ============================================

interface DestinationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (destination: LocationType) => void;
  selected: LocationType | null;
}

function DestinationPickerModal({
  visible,
  onClose,
  onSelect,
  selected,
}: DestinationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredDestinations = useMemo(() => {
    if (!searchQuery) return POPULAR_DESTINATIONS;
    const query = searchQuery.toLowerCase();
    return POPULAR_DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Select Destination</Text>
          <TouchableOpacity onPress={onClose}>
            <CloseCircle size={28} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>
        </View>
        
        <View style={modalStyles.searchContainer}>
          <SearchNormal1 size={20} color={colors.gray400} />
          <TextInput
            style={modalStyles.searchInput}
            placeholder="Search city or destination"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        
        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
              <TouchableOpacity
                style={[
                  modalStyles.destinationItem,
                  selected?.id === item.id && modalStyles.destinationItemSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item);
                }}
              >
                <View style={modalStyles.destinationIcon}>
                  <Location size={20} color={colors.primary} />
                </View>
                <View style={modalStyles.destinationInfo}>
                  <Text style={modalStyles.destinationName}>{item.name}</Text>
                  <Text style={modalStyles.destinationCountry}>{item.country}</Text>
                </View>
                {selected?.id === item.id && (
                  <TickCircle size={22} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={modalStyles.listContent}
        />
      </View>
    </Modal>
  );
}

// ============================================
// DATE PICKER MODAL (Simplified)
// ============================================

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  checkIn: Date | null;
  checkOut: Date | null;
  onSelectCheckIn: (date: Date) => void;
  onSelectCheckOut: (date: Date) => void;
}

function DatePickerModal({
  visible,
  onClose,
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut,
}: DatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  
  // Generate next 60 days
  const dates = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);
  
  const handleSelectDate = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!selectingCheckOut) {
      onSelectCheckIn(date);
      setSelectingCheckOut(true);
    } else {
      if (date > (checkIn || new Date())) {
        onSelectCheckOut(date);
        setSelectingCheckOut(false);
        onClose();
      }
    }
  };
  
  const isDateSelected = (date: Date): boolean => {
    if (!checkIn && !checkOut) return false;
    const dateStr = date.toDateString();
    return dateStr === checkIn?.toDateString() || dateStr === checkOut?.toDateString();
  };
  
  const isDateInRange = (date: Date): boolean => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>
            {selectingCheckOut ? 'Select Check-out' : 'Select Check-in'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <CloseCircle size={28} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>
        </View>
        
        <View style={modalStyles.dateHeader}>
          <View style={[modalStyles.dateBox, !selectingCheckOut && modalStyles.dateBoxActive]}>
            <Text style={modalStyles.dateBoxLabel}>Check-in</Text>
            <Text style={modalStyles.dateBoxValue}>
              {checkIn?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Select'}
            </Text>
          </View>
          <View style={modalStyles.dateSeparator}>
            <ArrowRight2 size={20} color={colors.gray400} />
          </View>
          <View style={[modalStyles.dateBox, selectingCheckOut && modalStyles.dateBoxActive]}>
            <Text style={modalStyles.dateBoxLabel}>Check-out</Text>
            <Text style={modalStyles.dateBoxValue}>
              {checkOut?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Select'}
            </Text>
          </View>
        </View>
        
        <FlatList
          data={dates}
          keyExtractor={(item) => item.toISOString()}
          numColumns={7}
          renderItem={({ item }) => {
            const isSelected = isDateSelected(item);
            const inRange = isDateInRange(item);
            const isPast = item < new Date();
            const isDisabled = selectingCheckOut && checkIn ? item <= checkIn : false;
            
            return (
              <TouchableOpacity
                style={[
                  modalStyles.dateCell,
                  isSelected && modalStyles.dateCellSelected,
                  inRange && modalStyles.dateCellInRange,
                  (isPast || isDisabled) && modalStyles.dateCellDisabled,
                ]}
                onPress={() => !isPast && !isDisabled && handleSelectDate(item)}
                disabled={isPast || isDisabled}
              >
                <Text
                  style={[
                    modalStyles.dateCellText,
                    isSelected && modalStyles.dateCellTextSelected,
                    (isPast || isDisabled) && modalStyles.dateCellTextDisabled,
                  ]}
                >
                  {item.getDate()}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={modalStyles.dateGrid}
        />
      </View>
    </Modal>
  );
}

// ============================================
// GUEST PICKER MODAL
// ============================================

interface GuestPickerModalProps {
  visible: boolean;
  onClose: () => void;
  guests: { rooms: number; adults: number; children: number };
  onUpdate: (guests: Partial<{ rooms: number; adults: number; children: number }>) => void;
}

function GuestPickerModal({
  visible,
  onClose,
  guests,
  onUpdate,
}: GuestPickerModalProps) {
  const insets = useSafeAreaInsets();
  
  const handleIncrement = (key: 'rooms' | 'adults' | 'children') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const max = key === 'rooms' ? 5 : key === 'adults' ? 8 : 6;
    if (guests[key] < max) {
      onUpdate({ [key]: guests[key] + 1 });
    }
  };
  
  const handleDecrement = (key: 'rooms' | 'adults' | 'children') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const min = key === 'children' ? 0 : 1;
    if (guests[key] > min) {
      onUpdate({ [key]: guests[key] - 1 });
    }
  };
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Guests & Rooms</Text>
          <TouchableOpacity onPress={onClose}>
            <CloseCircle size={28} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>
        </View>
        
        <View style={modalStyles.guestContent}>
          {/* Rooms */}
          <View style={modalStyles.guestRow}>
            <View>
              <Text style={modalStyles.guestLabel}>Rooms</Text>
              <Text style={modalStyles.guestSubLabel}>Max 5 rooms</Text>
            </View>
            <View style={modalStyles.counterContainer}>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.rooms <= 1 && modalStyles.counterButtonDisabled]}
                onPress={() => handleDecrement('rooms')}
                disabled={guests.rooms <= 1}
              >
                <Minus size={18} color={guests.rooms <= 1 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
              <Text style={modalStyles.counterValue}>{guests.rooms}</Text>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.rooms >= 5 && modalStyles.counterButtonDisabled]}
                onPress={() => handleIncrement('rooms')}
                disabled={guests.rooms >= 5}
              >
                <Add size={18} color={guests.rooms >= 5 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Adults */}
          <View style={modalStyles.guestRow}>
            <View>
              <Text style={modalStyles.guestLabel}>Adults</Text>
              <Text style={modalStyles.guestSubLabel}>Ages 18+</Text>
            </View>
            <View style={modalStyles.counterContainer}>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.adults <= 1 && modalStyles.counterButtonDisabled]}
                onPress={() => handleDecrement('adults')}
                disabled={guests.adults <= 1}
              >
                <Minus size={18} color={guests.adults <= 1 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
              <Text style={modalStyles.counterValue}>{guests.adults}</Text>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.adults >= 8 && modalStyles.counterButtonDisabled]}
                onPress={() => handleIncrement('adults')}
                disabled={guests.adults >= 8}
              >
                <Add size={18} color={guests.adults >= 8 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Children */}
          <View style={modalStyles.guestRow}>
            <View>
              <Text style={modalStyles.guestLabel}>Children</Text>
              <Text style={modalStyles.guestSubLabel}>Ages 0-17</Text>
            </View>
            <View style={modalStyles.counterContainer}>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.children <= 0 && modalStyles.counterButtonDisabled]}
                onPress={() => handleDecrement('children')}
                disabled={guests.children <= 0}
              >
                <Minus size={18} color={guests.children <= 0 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
              <Text style={modalStyles.counterValue}>{guests.children}</Text>
              <TouchableOpacity
                style={[modalStyles.counterButton, guests.children >= 6 && modalStyles.counterButtonDisabled]}
                onPress={() => handleIncrement('children')}
                disabled={guests.children >= 6}
              >
                <Add size={18} color={guests.children >= 6 ? colors.gray300 : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={[modalStyles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity style={modalStyles.doneButton} onPress={onClose}>
            <Text style={modalStyles.doneButtonText}>Done</Text>
          </TouchableOpacity>
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
    paddingBottom: 120,
  },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.gray400,
  },
  
  // Popular Destinations
  popularSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  destinationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  destinationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  destinationChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  destinationChipTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
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
});

// Modal styles
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    margin: spacing.lg,
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
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  destinationItemSelected: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  destinationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  destinationCountry: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Date picker
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
  },
  dateBox: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  dateBoxActive: {
    borderColor: colors.primary,
  },
  dateBoxLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dateBoxValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  dateSeparator: {
    paddingHorizontal: spacing.sm,
  },
  dateGrid: {
    padding: spacing.md,
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: borderRadius.md,
  },
  dateCellSelected: {
    backgroundColor: colors.primary,
  },
  dateCellInRange: {
    backgroundColor: colors.primary + '20',
  },
  dateCellDisabled: {
    opacity: 0.3,
  },
  dateCellText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  dateCellTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  dateCellTextDisabled: {
    color: colors.gray400,
  },
  
  // Guest picker
  guestContent: {
    padding: spacing.lg,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  guestLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  guestSubLabel: {
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
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    borderColor: colors.gray200,
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
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

