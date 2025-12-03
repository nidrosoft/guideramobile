/**
 * SEAT SELECTION STEP
 * 
 * Interactive seat map for selecting seats.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Airplane,
  TickCircle,
  InfoCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { Seat, SeatMap } from '../../../types/flight.types';
import { generateSeatMap } from '../../../data/mockFlights';

interface SeatSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
  stepIndex: number;
  totalSteps: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEAT_SIZE = (SCREEN_WIDTH - 80) / 7; // 6 seats + aisle

export default function SeatSelectionStep({
  onNext,
  onBack,
  onClose,
  onSkip,
  stepIndex,
  totalSteps,
}: SeatSelectionStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedOutboundFlight, searchParams, selectedSeats, selectSeat } = useFlightStore();
  
  const [seatMap] = useState<SeatMap>(() => 
    generateSeatMap(selectedOutboundFlight?.id || '')
  );
  
  const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
  const selectedCount = selectedSeats.outbound.length;
  const totalSeatPrice = selectedSeats.outbound.reduce((sum, s) => sum + s.seat.price, 0);
  
  const handleSeatSelect = useCallback((seat: Seat) => {
    if (seat.status === 'occupied' || seat.status === 'blocked') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // For simplicity, assign to first available passenger
    const passengerId = `passenger-${selectedSeats.outbound.length}`;
    selectSeat(passengerId, seat, 'outbound');
  }, [selectedSeats, selectSeat]);
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  };
  
  const isSeatSelected = (seatId: string): boolean => {
    return selectedSeats.outbound.some(s => s.seat.id === seatId);
  };
  
  const getSeatColor = (seat: Seat): string => {
    if (isSeatSelected(seat.id)) return colors.primary;
    if (seat.status === 'occupied') return colors.gray700;
    if (seat.status === 'blocked') return colors.gray300;
    if (seat.type === 'premium') return colors.warning;
    if (seat.type === 'exit_row') return colors.success;
    return colors.gray200;
  };
  
  return (
    <View style={styles.container}>
      {/* Selection Status */}
      <Animated.View 
        entering={FadeInDown.duration(400)}
        style={styles.statusBar}
      >
        <Text style={styles.statusText}>
          {selectedCount} of {totalPassengers} seats selected
        </Text>
        {onSkip && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {/* Legend */}
      <Animated.View 
        entering={FadeInDown.duration(400).delay(100)}
        style={styles.legendContainer}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendContent}
        >
          {seatMap.legend.map((item) => (
            <View key={item.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Seat Map */}
      <ScrollView
        style={styles.seatMapScroll}
        contentContainerStyle={styles.seatMapContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Airplane Nose */}
        <Animated.View 
          entering={FadeIn.duration(400).delay(200)}
          style={styles.airplaneNose}
        >
          <View style={styles.noseShape}>
            <Airplane size={32} color={colors.gray400} />
          </View>
          <Text style={styles.frontText}>Front</Text>
        </Animated.View>
        
        {/* Column Headers */}
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>A</Text>
          <Text style={styles.columnHeader}>B</Text>
          <Text style={styles.columnHeader}>C</Text>
          <View style={styles.aisleSpace} />
          <Text style={styles.columnHeader}>D</Text>
          <Text style={styles.columnHeader}>E</Text>
          <Text style={styles.columnHeader}>F</Text>
        </View>
        
        {/* Seat Rows */}
        {seatMap.rows.map((row, rowIndex) => (
          <Animated.View
            key={row.rowNumber}
            entering={FadeInDown.duration(300).delay(rowIndex * 20)}
            style={[
              styles.seatRow,
              row.isExitRow && styles.exitRow,
            ]}
          >
            {/* Row Number */}
            <Text style={styles.rowNumber}>{row.rowNumber}</Text>
            
            {/* Seats */}
            <View style={styles.seatsContainer}>
              {row.seats.slice(0, 3).map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={isSeatSelected(seat.id)}
                  color={getSeatColor(seat)}
                  onPress={() => handleSeatSelect(seat)}
                />
              ))}
              
              {/* Aisle */}
              <View style={styles.aisle} />
              
              {row.seats.slice(3).map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={isSeatSelected(seat.id)}
                  color={getSeatColor(seat)}
                  onPress={() => handleSeatSelect(seat)}
                />
              ))}
            </View>
            
            {/* Exit Row Indicator */}
            {row.isExitRow && (
              <View style={styles.exitIndicator}>
                <Text style={styles.exitText}>EXIT</Text>
              </View>
            )}
          </Animated.View>
        ))}
        
        {/* Airplane Tail */}
        <View style={styles.airplaneTail}>
          <Text style={styles.backText}>Back</Text>
        </View>
      </ScrollView>
      
      {/* Selected Seats Summary */}
      {selectedCount > 0 && (
        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={styles.selectionSummary}
        >
          <View style={styles.selectedSeatsRow}>
            {selectedSeats.outbound.map((selection, index) => (
              <View key={index} style={styles.selectedSeatBadge}>
                <Text style={styles.selectedSeatText}>{selection.seat.id}</Text>
                {selection.seat.price > 0 && (
                  <Text style={styles.selectedSeatPrice}>+${selection.seat.price}</Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      )}
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Seat Selection</Text>
          <Text style={styles.footerPriceAmount}>
            {totalSeatPrice > 0 ? `+$${totalSeatPrice}` : 'Free'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCount < totalPassengers && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedCount >= totalPassengers
                ? [colors.primary, colors.primaryDark]
                : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {selectedCount >= totalPassengers ? 'Continue' : `Select ${totalPassengers - selectedCount} more`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ============================================
// SEAT BUTTON COMPONENT
// ============================================

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  color: string;
  onPress: () => void;
}

function SeatButton({ seat, isSelected, color, onPress }: SeatButtonProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    if (seat.status === 'occupied' || seat.status === 'blocked') return;
    
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };
  
  const isDisabled = seat.status === 'occupied' || seat.status === 'blocked';
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.seat,
          { backgroundColor: color },
          isSelected && styles.seatSelected,
          isDisabled && styles.seatDisabled,
        ]}
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {isSelected && (
          <TickCircle size={16} color={colors.white} variant="Bold" />
        )}
        {seat.price > 0 && !isSelected && !isDisabled && (
          <Text style={styles.seatPrice}>${seat.price}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Legend
  legendContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  legendContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Seat Map
  seatMapScroll: {
    flex: 1,
  },
  seatMapContent: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  airplaneNose: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  noseShape: {
    width: 80,
    height: 60,
    backgroundColor: colors.gray100,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frontText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingLeft: 30,
  },
  columnHeader: {
    width: SEAT_SIZE,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  aisleSpace: {
    width: 20,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  exitRow: {
    backgroundColor: colors.success + '10',
    paddingVertical: spacing.xs,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rowNumber: {
    width: 24,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aisle: {
    width: 20,
  },
  seat: {
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    margin: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatSelected: {
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.md,
  },
  seatDisabled: {
    opacity: 0.5,
  },
  seatPrice: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  exitIndicator: {
    marginLeft: spacing.sm,
  },
  exitText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  airplaneTail: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  // Selection Summary
  selectionSummary: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  selectedSeatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedSeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  selectedSeatText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  selectedSeatPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  
  // Footer
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
