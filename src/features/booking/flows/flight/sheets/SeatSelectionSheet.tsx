/**
 * SEAT SELECTION SHEET
 * 
 * Full bottom sheet with airplane seat map
 * Shows available, taken, and selected seats with legend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, TickCircle, Airplane } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface SeatSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedSeats: string[];
  onSelectSeats: (seats: string[]) => void;
  pricePerSeat?: number;
}

// Mock seat data - in real app this would come from API
const ROWS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Taken seats (mock)
const TAKEN_SEATS = ['1A', '1B', '2C', '3D', '4A', '5F', '6B', '7C', '8A', '9E', '10B', '11D', '12A', '12F'];

export default function SeatSelectionSheet({
  visible,
  onClose,
  selectedSeats,
  onSelectSeats,
  pricePerSeat = 25,
}: SeatSelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>(selectedSeats);

  const isSeatTaken = (seat: string) => TAKEN_SEATS.includes(seat);
  const isSeatSelected = (seat: string) => localSelectedSeats.includes(seat);

  const handleSeatPress = (seat: string) => {
    if (isSeatTaken(seat)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isSeatSelected(seat)) {
      setLocalSelectedSeats(prev => prev.filter(s => s !== seat));
    } else {
      setLocalSelectedSeats(prev => [...prev, seat]);
    }
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectSeats(localSelectedSeats);
    onClose();
  };

  const getSeatStyle = (seat: string) => {
    if (isSeatTaken(seat)) return styles.seatTaken;
    if (isSeatSelected(seat)) return styles.seatSelected;
    return styles.seatAvailable;
  };

  const getSeatTextStyle = (seat: string) => {
    if (isSeatTaken(seat)) return styles.seatTextTaken;
    if (isSeatSelected(seat)) return styles.seatTextSelected;
    return styles.seatTextAvailable;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Your Seat</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerSubtitle}>+${pricePerSeat} per seat</Text>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendAvailable]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendTaken]} />
            <Text style={styles.legendText}>Taken</Text>
          </View>
        </View>

        {/* Seat Map */}
        <ScrollView 
          style={styles.seatMapContainer}
          contentContainerStyle={styles.seatMapContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Airplane nose indicator */}
          <View style={styles.planeNose}>
            <Airplane size={24} color={colors.gray400} variant="Bold" />
            <Text style={styles.frontText}>Front</Text>
          </View>

          {/* Column headers */}
          <View style={styles.columnHeaders}>
            {COLUMNS.slice(0, 3).map(col => (
              <Text key={col} style={styles.columnHeader}>{col}</Text>
            ))}
            <View style={styles.aisleSpace} />
            {COLUMNS.slice(3).map(col => (
              <Text key={col} style={styles.columnHeader}>{col}</Text>
            ))}
          </View>

          {/* Seat rows */}
          {ROWS.map(row => (
            <View key={row} style={styles.seatRow}>
              <Text style={styles.rowNumber}>{row}</Text>
              {COLUMNS.slice(0, 3).map(col => {
                const seat = `${row}${col}`;
                return (
                  <TouchableOpacity
                    key={seat}
                    style={[styles.seat, getSeatStyle(seat)]}
                    onPress={() => handleSeatPress(seat)}
                    disabled={isSeatTaken(seat)}
                    activeOpacity={0.7}
                  >
                    <Text style={getSeatTextStyle(seat)}>{col}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.aisleSpace} />
              {COLUMNS.slice(3).map(col => {
                const seat = `${row}${col}`;
                return (
                  <TouchableOpacity
                    key={seat}
                    style={[styles.seat, getSeatStyle(seat)]}
                    onPress={() => handleSeatPress(seat)}
                    disabled={isSeatTaken(seat)}
                    activeOpacity={0.7}
                  >
                    <Text style={getSeatTextStyle(seat)}>{col}</Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.rowNumber}>{row}</Text>
            </View>
          ))}

          <View style={styles.planeBack}>
            <Text style={styles.backText}>Back</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectedCount}>
              {localSelectedSeats.length} seat{localSelectedSeats.length !== 1 ? 's' : ''} selected
            </Text>
            {localSelectedSeats.length > 0 && (
              <Text style={styles.selectedSeats}>
                {localSelectedSeats.join(', ')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              localSelectedSeats.length === 0 && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              {localSelectedSeats.length > 0 
                ? `Confirm (+$${localSelectedSeats.length * pricePerSeat})`
                : 'Skip Seat Selection'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EB',
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
  legendAvailable: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  legendSelected: {
    backgroundColor: colors.primary,
  },
  legendTaken: {
    backgroundColor: colors.gray200,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  seatMapContainer: {
    flex: 1,
  },
  seatMapContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  planeNose: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  frontText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    marginTop: 4,
  },
  columnHeaders: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: 28,
    paddingRight: 28,
  },
  columnHeader: {
    width: 40,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  aisleSpace: {
    width: 24,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowNumber: {
    width: 20,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  seat: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  seatAvailable: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  seatSelected: {
    backgroundColor: colors.primary,
  },
  seatTaken: {
    backgroundColor: colors.gray200,
  },
  seatTextAvailable: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  seatTextSelected: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  seatTextTaken: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
  },
  planeBack: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E6E9EB',
  },
  selectionInfo: {
    marginBottom: spacing.md,
  },
  selectedCount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  selectedSeats: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
