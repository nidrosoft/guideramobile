import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Airplane, Wallet3, CloseCircle, DocumentDownload } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { FlightDetails } from '@/features/trips/types/trip.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BookingPassBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  bookingType: 'flight' | 'hotel' | 'car' | 'activity';
  details: FlightDetails; // Will expand this for other types
  bookingNumber: string;
  status: string;
}

export const BookingPassBottomSheet: React.FC<BookingPassBottomSheetProps> = ({
  visible,
  onClose,
  bookingType,
  details,
  bookingNumber,
  status,
}) => {
  if (bookingType !== 'flight') {
    // For now, only handle flights
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.bottomSheet}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Boarding Pass Card */}
            <View style={styles.passCard}>
              {/* Route Section with Dotted Line */}
              <View style={styles.routeSection}>
                {/* Departure */}
                <View style={styles.locationContainer}>
                  <Text style={styles.airportCode}>{details.departure.airport}</Text>
                  <Text style={styles.dateTime}>
                    {new Date(details.departure.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}, {new Date(details.departure.time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                {/* Flight Path with Horizontal Dotted Line */}
                <View style={styles.flightPathContainer}>
                  <View style={styles.flightPathLine}>
                    <View style={styles.dotDeparture} />
                    <View style={styles.dottedLineHorizontal} />
                    <View style={styles.planeIconContainer}>
                      <Airplane size={16} color={colors.primary} variant="Bold" />
                    </View>
                    <View style={styles.dottedLineHorizontal} />
                    <View style={styles.dotArrival} />
                  </View>
                  <Text style={styles.flightDuration}>
                    {Math.floor((new Date(details.arrival.time).getTime() - new Date(details.departure.time).getTime()) / 3600000)}h {Math.floor(((new Date(details.arrival.time).getTime() - new Date(details.departure.time).getTime()) % 3600000) / 60000)}m
                  </Text>
                </View>

                {/* Arrival */}
                <View style={[styles.locationContainer, styles.locationRight]}>
                  <Text style={styles.airportCode}>{details.arrival.airport}</Text>
                  <Text style={styles.dateTime}>
                    {new Date(details.arrival.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}, {new Date(details.arrival.time).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>

              {/* Dashed Divider */}
              <View style={styles.dashedDivider} />

              {/* Flight Details Grid - Row 1: Gate, Airline Logo, Seat */}
              <View style={styles.detailsRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>GATE</Text>
                  <Text style={styles.detailValueLarge}>{details.departure.gate || 'A4'}</Text>
                </View>

                <View style={styles.airlineLogoContainer}>
                  <Airplane size={28} color={colors.primary} variant="Bold" />
                  <Text style={styles.airlineNameCenter}>{details.airline}</Text>
                </View>

                <View style={[styles.detailColumn, styles.detailRight]}>
                  <Text style={styles.detailLabel}>SET</Text>
                  <Text style={styles.detailValueLarge}>{details.seatNumber || 'B2'}</Text>
                </View>
              </View>

              {/* Flight Details Grid - Row 2: Terminal, Class */}
              <View style={styles.detailsRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>TERMINAL</Text>
                  <Text style={styles.detailValueLarge}>{details.departure.terminal || '4'}</Text>
                </View>

                <View style={[styles.detailColumn, styles.detailRight]}>
                  <Text style={styles.detailLabel}>CLASS</Text>
                  <Text style={styles.detailValueLarge}>{details.class || 'Economy'}</Text>
                </View>
              </View>

              {/* Flight Details Grid - Row 3: Passenger Name, Flight Number */}
              <View style={styles.detailsRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>PASSENGER NAME</Text>
                  <Text style={styles.detailValueLarge}>Alex Bajefski</Text>
                </View>

                <View style={[styles.detailColumn, styles.detailRight]}>
                  <Text style={styles.detailLabel}>FLIGHT NO</Text>
                  <Text style={styles.detailValueLarge}>{details.flightNumber}</Text>
                </View>
              </View>

              {/* Boarding Pass Section */}
              <View style={styles.boardingPassSection}>
                <Text style={styles.boardingPassTitle}>BOARDING PASS</Text>
                
                {/* Barcode Placeholder */}
                <View style={styles.barcodeContainer}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} style={styles.barcodeLine} />
                  ))}
                </View>
                
                <Text style={styles.barcodeNumber}>{bookingNumber}</Text>
              </View>

            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.primaryButton}>
                <DocumentDownload size={20} color={colors.white} variant="Bold" />
                <Text style={styles.primaryButtonText}>Download Ticket</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton}>
                <Wallet3 size={20} color={colors.primary} variant="Bold" />
                <Text style={styles.secondaryButtonText}>Add to Wallet</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  passCard: {
    backgroundColor: colors.bgModal,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  airlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  airlineName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray900,
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  locationContainer: {
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  locationRight: {
    alignItems: 'flex-end',
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  airportCode: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 4,
  },
  cityName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 10,
    color: colors.gray400,
    fontWeight: '400',
  },
  flightPathContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    minWidth: 100,
  },
  flightPathLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    width: '100%',
  },
  dotDeparture: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotArrival: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dottedLineHorizontal: {
    flex: 1,
    height: 2,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    borderStyle: 'dashed',
    marginHorizontal: 3,
    maxWidth: 40,
  },
  planeIconContainer: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
    padding: 4,
  },
  flightDuration: {
    fontSize: 10,
    color: colors.gray600,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  dashedDivider: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    borderStyle: 'dashed',
    marginVertical: spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailColumn: {
    flex: 1,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 10,
    color: colors.gray400,
    marginBottom: 6,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.gray900,
  },
  detailValueLarge: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray900,
  },
  airlineLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  airlineNameCenter: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
    marginTop: spacing.xs,
  },
  boardingPassSection: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  boardingPassTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  barcodeContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: spacing.sm,
  },
  barcodeLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.gray900,
  },
  barcodeNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: '600',
    letterSpacing: 2,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: `${colors.primary}10`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.primary,
  },
});
