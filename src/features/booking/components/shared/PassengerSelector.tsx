/**
 * PASSENGER SELECTOR
 * 
 * Component for selecting number of passengers (adults, children, infants).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Add, Minus, People, Profile2User } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { PassengerCount } from '../../types/booking.types';
import { BOOKING_LIMITS } from '../../config/booking.config';

interface PassengerSelectorProps {
  visible: boolean;
  onClose: () => void;
  passengers: PassengerCount;
  onPassengersChange: (passengers: PassengerCount) => void;
  maxPassengers?: number;
  showInfants?: boolean;
}

interface CounterRowProps {
  label: string;
  description: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  minValue?: number;
  maxValue?: number;
}

function CounterRow({
  label,
  description,
  value,
  onIncrement,
  onDecrement,
  minValue = 0,
  maxValue = 9,
}: CounterRowProps) {
  const { colors } = useTheme();
  const canDecrement = value > minValue;
  const canIncrement = value < maxValue;
  
  const handleDecrement = () => {
    if (canDecrement) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDecrement();
    }
  };
  
  const handleIncrement = () => {
    if (canIncrement) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onIncrement();
    }
  };
  
  return (
    <View style={[styles.counterRow, { backgroundColor: colors.bgElevated }]}>
      <View style={styles.counterInfo}>
        <Text style={[styles.counterLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.counterDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      
      <View style={styles.counterControls}>
        <TouchableOpacity
          style={[styles.counterButton, { backgroundColor: colors.primary + '15' }, !canDecrement && { backgroundColor: colors.bgCard }]}
          onPress={handleDecrement}
          disabled={!canDecrement}
        >
          <Minus size={20} color={canDecrement ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        
        <Text style={[styles.counterValue, { color: colors.textPrimary }]}>{value}</Text>
        
        <TouchableOpacity
          style={[styles.counterButton, { backgroundColor: colors.primary + '15' }, !canIncrement && { backgroundColor: colors.bgCard }]}
          onPress={handleIncrement}
          disabled={!canIncrement}
        >
          <Add size={20} color={canIncrement ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PassengerSelector({
  visible,
  onClose,
  passengers,
  onPassengersChange,
  maxPassengers = BOOKING_LIMITS.maxPassengers,
  showInfants = true,
}: PassengerSelectorProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [localPassengers, setLocalPassengers] = useState(passengers);
  
  const totalPassengers = localPassengers.adults + localPassengers.children;
  const remainingSlots = maxPassengers - totalPassengers;
  
  // Infants can't exceed number of adults
  const maxInfants = Math.min(localPassengers.adults, BOOKING_LIMITS.maxInfants);
  
  const updatePassengers = (updates: Partial<PassengerCount>) => {
    setLocalPassengers((prev) => ({ ...prev, ...updates }));
  };
  
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPassengersChange(localPassengers);
    onClose();
  };
  
  const getTotalLabel = (): string => {
    const parts: string[] = [];
    
    if (localPassengers.adults > 0) {
      parts.push(`${localPassengers.adults} Adult${localPassengers.adults > 1 ? 's' : ''}`);
    }
    if (localPassengers.children > 0) {
      parts.push(`${localPassengers.children} Child${localPassengers.children > 1 ? 'ren' : ''}`);
    }
    if (showInfants && localPassengers.infants > 0) {
      parts.push(`${localPassengers.infants} Infant${localPassengers.infants > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ') || '0 Passengers';
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Passengers</Text>
          <View style={styles.closeButton} />
        </View>
        
        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: colors.primary + '10' }]}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.bgElevated }]}>
            <Profile2User size={24} color={colors.primary} variant="Bold" />
          </View>
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>{getTotalLabel()}</Text>
        </View>
        
        {/* Counters */}
        <View style={[styles.counters, { backgroundColor: colors.bgCard }]}>
          <CounterRow
            label="Adults"
            description="Age 12+"
            value={localPassengers.adults}
            onIncrement={() => updatePassengers({ adults: localPassengers.adults + 1 })}
            onDecrement={() => {
              updatePassengers({ 
                adults: localPassengers.adults - 1,
                // Reduce infants if they exceed new adult count
                infants: Math.min(localPassengers.infants, localPassengers.adults - 1),
              });
            }}
            minValue={1}
            maxValue={Math.min(BOOKING_LIMITS.maxAdults, localPassengers.adults + remainingSlots)}
          />
          
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          
          <CounterRow
            label="Children"
            description="Age 2-11"
            value={localPassengers.children}
            onIncrement={() => updatePassengers({ children: localPassengers.children + 1 })}
            onDecrement={() => updatePassengers({ children: localPassengers.children - 1 })}
            minValue={0}
            maxValue={Math.min(BOOKING_LIMITS.maxChildren, localPassengers.children + remainingSlots)}
          />
          
          {showInfants && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
              
              <CounterRow
                label="Infants"
                description="Under 2 (on lap)"
                value={localPassengers.infants}
                onIncrement={() => updatePassengers({ infants: localPassengers.infants + 1 })}
                onDecrement={() => updatePassengers({ infants: localPassengers.infants - 1 })}
                minValue={0}
                maxValue={maxInfants}
              />
            </>
          )}
        </View>
        
        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: colors.info + '10' }]}>
          <Text style={[styles.infoNoteText, { color: colors.info }]}>
            {showInfants 
              ? 'Infants must sit on an adult\'s lap. Maximum 1 infant per adult.'
              : 'Children under 12 must be accompanied by an adult.'
            }
          </Text>
        </View>
        
        {/* Confirm Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Compact trigger button component
interface PassengerTriggerProps {
  passengers: PassengerCount;
  onPress: () => void;
  showInfants?: boolean;
}

export function PassengerTrigger({ 
  passengers, 
  onPress,
  showInfants = true,
}: PassengerTriggerProps) {
  const { colors } = useTheme();
  const total = passengers.adults + passengers.children + (showInfants ? passengers.infants : 0);
  
  const getLabel = (): string => {
    if (total === 1) return '1 Passenger';
    return `${total} Passengers`;
  };
  
  return (
    <TouchableOpacity style={[styles.trigger, { backgroundColor: colors.bgElevated }]} onPress={onPress}>
      <People size={20} color={colors.textSecondary} />
      <Text style={[styles.triggerText, { color: colors.textPrimary }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  counters: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  counterInfo: {
    flex: 1,
  },
  counterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  counterDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    minWidth: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  infoNote: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoNoteText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  // Trigger styles
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  triggerText: {
    fontSize: typography.fontSize.sm,
  },
});
