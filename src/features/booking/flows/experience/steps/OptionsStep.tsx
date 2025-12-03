/**
 * EXPERIENCE OPTIONS STEP
 * 
 * Select date, time, and participants.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Calendar,
  Clock,
  People,
  TickCircle,
  Add,
  Minus,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useExperienceStore } from '../../../stores/useExperienceStore';
import { TimeSlot } from '../../../types/experience.types';

interface OptionsStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Generate mock time slots
const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [
    {
      id: '1',
      date,
      startTime: '09:00',
      endTime: '12:00',
      spotsAvailable: 4,
      spotsTotal: 8,
    },
    {
      id: '2',
      date,
      startTime: '10:30',
      endTime: '13:30',
      spotsAvailable: 2,
      spotsTotal: 8,
    },
    {
      id: '3',
      date,
      startTime: '14:00',
      endTime: '17:00',
      spotsAvailable: 8,
      spotsTotal: 8,
    },
    {
      id: '4',
      date,
      startTime: '15:30',
      endTime: '18:30',
      spotsAvailable: 6,
      spotsTotal: 8,
    },
  ];
  return slots;
};

export default function OptionsStep({ onNext, onBack, onClose }: OptionsStepProps) {
  const insets = useSafeAreaInsets();
  const {
    selectedExperience,
    searchParams,
    selectedDate,
    selectedTimeSlot,
    selectDate,
    selectTimeSlot,
    setParticipants,
    pricing,
    calculatePricing,
  } = useExperienceStore();
  
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  
  if (!selectedExperience) return null;
  
  const experience = selectedExperience;
  const { adults, children, infants } = searchParams.participants;
  
  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(new Date(selectedDate));
  }, [selectedDate]);
  
  const formatPrice = (amount: number): string => {
    return `$${amount}`;
  };
  
  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectDate(date);
  };
  
  const handleTimeSelect = (slot: TimeSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectTimeSlot(slot);
    calculatePricing();
  };
  
  const handleParticipantChange = (type: 'adults' | 'children' | 'infants', delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = searchParams.participants[type];
    const newValue = Math.max(type === 'adults' ? 1 : 0, current + delta);
    setParticipants({ ...searchParams.participants, [type]: newValue });
    calculatePricing();
  };
  
  const canContinue = selectedDate && selectedTimeSlot;
  
  const handleContinue = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
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
  
  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return date.toDateString() === selected.toDateString();
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      
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
        {/* Experience Summary */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <Text style={styles.experienceTitle} numberOfLines={2}>
            {experience.title}
          </Text>
          <View style={styles.summaryInfo}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.summaryText}>
              {Math.floor(experience.duration / 60)} hours
            </Text>
          </View>
        </Animated.View>
        
        {/* Date Selection */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          
          <View style={styles.calendarCard}>
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
          </View>
        </Animated.View>
        
        {/* Time Selection */}
        {selectedDate && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Select Time</Text>
            </View>
            
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot?.id === slot.id && styles.timeSlotSelected,
                    slot.spotsAvailable === 0 && styles.timeSlotDisabled,
                  ]}
                  onPress={() => slot.spotsAvailable > 0 && handleTimeSelect(slot)}
                  disabled={slot.spotsAvailable === 0}
                >
                  <Text
                    style={[
                      styles.timeSlotTime,
                      selectedTimeSlot?.id === slot.id && styles.timeSlotTimeSelected,
                    ]}
                  >
                    {slot.startTime}
                  </Text>
                  <Text
                    style={[
                      styles.timeSlotSpots,
                      selectedTimeSlot?.id === slot.id && styles.timeSlotSpotsSelected,
                      slot.spotsAvailable <= 2 && styles.timeSlotSpotsLow,
                    ]}
                  >
                    {slot.spotsAvailable === 0 ? 'Sold out' : `${slot.spotsAvailable} left`}
                  </Text>
                  {selectedTimeSlot?.id === slot.id && (
                    <View style={styles.timeSlotCheck}>
                      <TickCircle size={16} color={colors.white} variant="Bold" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Participants */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <People size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Participants</Text>
          </View>
          
          <View style={styles.participantsCard}>
            {/* Adults */}
            <View style={styles.participantRow}>
              <View>
                <Text style={styles.participantLabel}>Adults</Text>
                <Text style={styles.participantPrice}>{formatPrice(pricing.adultPrice)} each</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
                  onPress={() => handleParticipantChange('adults', -1)}
                  disabled={adults <= 1}
                >
                  <Minus size={18} color={adults <= 1 ? colors.gray400 : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adults}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => handleParticipantChange('adults', 1)}
                >
                  <Add size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Children */}
            <View style={styles.participantRow}>
              <View>
                <Text style={styles.participantLabel}>Children (2-12)</Text>
                <Text style={styles.participantPrice}>{formatPrice(pricing.childPrice)} each</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                  onPress={() => handleParticipantChange('children', -1)}
                  disabled={children <= 0}
                >
                  <Minus size={18} color={children <= 0 ? colors.gray400 : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{children}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => handleParticipantChange('children', 1)}
                >
                  <Add size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Infants */}
            <View style={[styles.participantRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.participantLabel}>Infants (0-2)</Text>
                <Text style={styles.participantPrice}>Free</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, infants <= 0 && styles.counterButtonDisabled]}
                  onPress={() => handleParticipantChange('infants', -1)}
                  disabled={infants <= 0}
                >
                  <Minus size={18} color={infants <= 0 ? colors.gray400 : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{infants}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => handleParticipantChange('infants', 1)}
                >
                  <Add size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Price Summary */}
        {selectedTimeSlot && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <View style={styles.priceSummaryCard}>
              {adults > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{adults} Adult{adults > 1 ? 's' : ''} × {formatPrice(pricing.adultPrice)}</Text>
                  <Text style={styles.priceValue}>{formatPrice(pricing.adultTotal)}</Text>
                </View>
              )}
              {children > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{children} Child{children > 1 ? 'ren' : ''} × {formatPrice(pricing.childPrice)}</Text>
                  <Text style={styles.priceValue}>{formatPrice(pricing.childTotal)}</Text>
                </View>
              )}
              {infants > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{infants} Infant{infants > 1 ? 's' : ''}</Text>
                  <Text style={styles.priceValue}>Free</Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatPrice(pricing.subtotal)}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Footer */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceValue}>{formatPrice(pricing.subtotal)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!canContinue}
        >
          <LinearGradient
            colors={canContinue ? [colors.primary, colors.primaryDark] : [colors.gray300, colors.gray400]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  experienceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthNavButton: {
    fontSize: 24,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  monthTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
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
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  dayTextSelected: { color: colors.white, fontWeight: typography.fontWeight.semibold },
  dayTextDisabled: { color: colors.gray400 },
  
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    position: 'relative',
  },
  timeSlotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  timeSlotDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray100,
  },
  timeSlotTime: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timeSlotTimeSelected: { color: colors.primary },
  timeSlotSpots: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  timeSlotSpotsSelected: { color: colors.primary },
  timeSlotSpotsLow: { color: colors.warning },
  timeSlotCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  participantsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  participantLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  participantPrice: {
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
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: { backgroundColor: colors.gray50 },
  counterValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  
  priceSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  footerPrice: {},
  footerPriceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footerPriceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: {
    flex: 1,
    marginLeft: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: { opacity: 0.7 },
  continueButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
