/**
 * EXPERIENCE SEARCH STEP
 * 
 * Search for experiences by location, date, and participants.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Location,
  Calendar,
  People,
  SearchNormal1,
  CloseCircle,
  ArrowRight2,
  Map1,
  Ticket,
  Coffee,
  Activity,
  Tree,
  Brush,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { ExperienceCategory, EXPERIENCE_CATEGORY_LABELS } from '../../../types/experience.types';
import { Location as LocationType } from '../../../types/booking.types';

interface SearchStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Sample locations
const SAMPLE_LOCATIONS: LocationType[] = [
  { id: '1', name: 'Paris', country: 'France', countryCode: 'FR', code: 'PAR', type: 'city' },
  { id: '2', name: 'Rome', country: 'Italy', countryCode: 'IT', code: 'ROM', type: 'city' },
  { id: '3', name: 'Barcelona', country: 'Spain', countryCode: 'ES', code: 'BCN', type: 'city' },
  { id: '4', name: 'London', country: 'United Kingdom', countryCode: 'GB', code: 'LON', type: 'city' },
  { id: '5', name: 'New York', country: 'USA', countryCode: 'US', code: 'NYC', type: 'city' },
  { id: '6', name: 'Tokyo', country: 'Japan', countryCode: 'JP', code: 'TYO', type: 'city' },
  { id: '7', name: 'Dubai', country: 'UAE', countryCode: 'AE', code: 'DXB', type: 'city' },
  { id: '8', name: 'Sydney', country: 'Australia', countryCode: 'AU', code: 'SYD', type: 'city' },
];

// Category options
const CATEGORIES: { id: ExperienceCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'tours', label: 'Tours', icon: <Map1 size={20} color={colors.primary} /> },
  { id: 'attractions', label: 'Attractions', icon: <Ticket size={20} color={colors.primary} /> },
  { id: 'food_drink', label: 'Food & Drink', icon: <Coffee size={20} color={colors.primary} /> },
  { id: 'adventure', label: 'Adventure', icon: <Activity size={20} color={colors.primary} /> },
  { id: 'nature_wildlife', label: 'Nature', icon: <Tree size={20} color={colors.primary} /> },
  { id: 'classes_workshops', label: 'Classes', icon: <Brush size={20} color={colors.primary} /> },
];

export default function SearchStep({ onNext, onBack, onClose }: SearchStepProps) {
  const insets = useSafeAreaInsets();
  const {
    searchParams,
    setDestination,
    setDate,
    setParticipants,
    setCategory,
  } = useExperienceStore();
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const filteredLocations = SAMPLE_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.country.toLowerCase().includes(locationSearch.toLowerCase())
  );
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const getTotalParticipants = (): number => {
    const { adults, children, infants } = searchParams.participants;
    return adults + children + infants;
  };
  
  const canSearch = searchParams.destination && searchParams.date;
  
  const handleSearch = () => {
    if (!canSearch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const handleLocationSelect = (location: LocationType) => {
    setDestination(location);
    setShowLocationModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleDateSelect = (date: Date) => {
    setDate(date);
    setShowDateModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleCategoryToggle = (category: ExperienceCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (searchParams.category === category) {
      setCategory(undefined);
    } else {
      setCategory(category);
    }
  };
  
  // Calendar helpers
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = searchParams.date && 
        new Date(searchParams.date).toDateString() === date.toDateString();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.dayCellSelected,
            isDisabled && styles.dayCellDisabled,
          ]}
          onPress={() => !isDisabled && handleDateSelect(date)}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.dayTextSelected,
              isDisabled && styles.dayTextDisabled,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Find Experiences</Text>
          <Text style={styles.subtitle}>Discover amazing activities and tours</Text>
        </Animated.View>
        
        {/* Location */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionLabel}>Where</Text>
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <Location size={22} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputValue, !searchParams.destination && styles.inputPlaceholder]}>
                {searchParams.destination?.name || 'Search destination'}
              </Text>
              {searchParams.destination && (
                <Text style={styles.inputSubtext}>{searchParams.destination.country}</Text>
              )}
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Date */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Text style={styles.sectionLabel}>When</Text>
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowDateModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.success + '15' }]}>
              <Calendar size={22} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={[styles.inputValue, !searchParams.date && styles.inputPlaceholder]}>
                {formatDate(searchParams.date)}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Participants */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionLabel}>Who</Text>
          <TouchableOpacity
            style={styles.inputCard}
            onPress={() => setShowParticipantsModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.inputIcon, { backgroundColor: colors.warning + '15' }]}>
              <People size={22} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputValue}>
                {getTotalParticipants()} {getTotalParticipants() === 1 ? 'Guest' : 'Guests'}
              </Text>
              <Text style={styles.inputSubtext}>
                {searchParams.participants.adults} Adults
                {searchParams.participants.children > 0 && `, ${searchParams.participants.children} Children`}
                {searchParams.participants.infants > 0 && `, ${searchParams.participants.infants} Infants`}
              </Text>
            </View>
            <ArrowRight2 size={20} color={colors.gray400} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Categories */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)}>
          <Text style={styles.sectionLabel}>Category (Optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  searchParams.category === cat.id && styles.categoryChipSelected,
                ]}
                onPress={() => handleCategoryToggle(cat.id)}
                activeOpacity={0.7}
              >
                {cat.icon}
                <Text
                  style={[
                    styles.categoryChipText,
                    searchParams.category === cat.id && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
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
            <Text style={styles.searchButtonText}>Search Experiences</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <CloseCircle size={28} color={colors.gray400} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <SearchNormal1 size={20} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities..."
              placeholderTextColor={colors.gray400}
              value={locationSearch}
              onChangeText={setLocationSearch}
            />
          </View>
          
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleLocationSelect(item)}
              >
                <View style={[styles.locationIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Location size={20} color={colors.primary} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{item.name}</Text>
                  <Text style={styles.locationType}>{item.country}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
      
      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.dateOverlay}>
          <View style={styles.dateSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <CloseCircle size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <Text style={styles.monthNavButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <Text style={styles.monthNavButton}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.dayHeaders}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>
            
            <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + spacing.md }]}>
              <TouchableOpacity
                style={[styles.doneButton, !searchParams.date && styles.doneButtonDisabled]}
                onPress={() => setShowDateModal(false)}
                disabled={!searchParams.date}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Participants Modal */}
      <Modal
        visible={showParticipantsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowParticipantsModal(false)}
      >
        <View style={styles.dateOverlay}>
          <View style={styles.participantsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Guests</Text>
              <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
                <CloseCircle size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>
            
            {/* Adults */}
            <View style={styles.participantRow}>
              <View>
                <Text style={styles.participantLabel}>Adults</Text>
                <Text style={styles.participantAge}>Age 13+</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, searchParams.participants.adults <= 1 && styles.counterButtonDisabled]}
                  onPress={() => {
                    if (searchParams.participants.adults > 1) {
                      setParticipants({ ...searchParams.participants, adults: searchParams.participants.adults - 1 });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{searchParams.participants.adults}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => {
                    setParticipants({ ...searchParams.participants, adults: searchParams.participants.adults + 1 });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Children */}
            <View style={styles.participantRow}>
              <View>
                <Text style={styles.participantLabel}>Children</Text>
                <Text style={styles.participantAge}>Age 2-12</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, searchParams.participants.children <= 0 && styles.counterButtonDisabled]}
                  onPress={() => {
                    if (searchParams.participants.children > 0) {
                      setParticipants({ ...searchParams.participants, children: searchParams.participants.children - 1 });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{searchParams.participants.children}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => {
                    setParticipants({ ...searchParams.participants, children: searchParams.participants.children + 1 });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Infants */}
            <View style={styles.participantRow}>
              <View>
                <Text style={styles.participantLabel}>Infants</Text>
                <Text style={styles.participantAge}>Under 2</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, searchParams.participants.infants <= 0 && styles.counterButtonDisabled]}
                  onPress={() => {
                    if (searchParams.participants.infants > 0) {
                      setParticipants({ ...searchParams.participants, infants: searchParams.participants.infants - 1 });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{searchParams.participants.infants}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => {
                    setParticipants({ ...searchParams.participants, infants: searchParams.participants.infants + 1 });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + spacing.md }]}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowParticipantsModal(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  header: { marginBottom: spacing.xl },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  inputSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  categoriesContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  categoryChipTextSelected: {
    color: colors.primary,
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
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
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
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
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
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  dayCellDisabled: { opacity: 0.3 },
  dayText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dayTextSelected: { color: colors.white, fontWeight: typography.fontWeight.semibold },
  dayTextDisabled: { color: colors.gray400 },
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
  
  // Participants Sheet
  participantsSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  participantLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  participantAge: {
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
  counterButtonDisabled: { backgroundColor: colors.gray200 },
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
});
