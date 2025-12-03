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
import { colors, spacing, typography, borderRadius } from '@/styles';
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
    <View style={styles.counterRow}>
      <View style={styles.counterInfo}>
        <Text style={styles.counterLabel}>{label}</Text>
        <Text style={styles.counterDescription}>{description}</Text>
      </View>
      
      <View style={styles.counterControls}>
        <TouchableOpacity
          style={[styles.counterButton, !canDecrement && styles.counterButtonDisabled]}
          onPress={handleDecrement}
          disabled={!canDecrement}
        >
          <Minus size={20} color={canDecrement ? colors.primary : colors.gray300} />
        </TouchableOpacity>
        
        <Text style={styles.counterValue}>{value}</Text>
        
        <TouchableOpacity
          style={[styles.counterButton, !canIncrement && styles.counterButtonDisabled]}
          onPress={handleIncrement}
          disabled={!canIncrement}
        >
          <Add size={20} color={canIncrement ? colors.primary : colors.gray300} />
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Passengers</Text>
          <View style={styles.closeButton} />
        </View>
        
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Profile2User size={24} color={colors.primary} variant="Bold" />
          </View>
          <Text style={styles.summaryText}>{getTotalLabel()}</Text>
        </View>
        
        {/* Counters */}
        <View style={styles.counters}>
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
          
          <View style={styles.divider} />
          
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
              <View style={styles.divider} />
              
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
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            {showInfants 
              ? 'Infants must sit on an adult\'s lap. Maximum 1 infant per adult.'
              : 'Children under 12 must be accompanied by an adult.'
            }
          </Text>
        </View>
        
        {/* Confirm Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={styles.confirmButton}
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
  const total = passengers.adults + passengers.children + (showInfants ? passengers.infants : 0);
  
  const getLabel = (): string => {
    if (total === 1) return '1 Passenger';
    return `${total} Passengers`;
  };
  
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress}>
      <People size={20} color={colors.textSecondary} />
      <Text style={styles.triggerText}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    color: colors.textPrimary,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary + '10',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  counters: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  counterInfo: {
    flex: 1,
  },
  counterLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  counterDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  counterValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.lg,
  },
  infoNote: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.info + '10',
    borderRadius: borderRadius.md,
  },
  infoNoteText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  // Trigger styles
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  triggerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
