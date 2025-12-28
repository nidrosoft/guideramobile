/**
 * FLIGHT DETAIL SHEET
 * 
 * Bottom sheet showing complete flight details
 * Airline, route, times, terminals, duration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseCircle, Airplane } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface FlightDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  flightInfo: {
    airlineName: string;
    flightNumber?: string;
    originCode: string;
    originCity?: string;
    originAirport?: string;
    originTerminal?: string;
    destCode: string;
    destCity?: string;
    destAirport?: string;
    destTerminal?: string;
    departureTime: Date | string;
    arrivalTime: Date | string;
    duration: number;
    stops: number;
    cabinClass?: string;
    price: number;
  };
}

export default function FlightDetailSheet({
  visible,
  onClose,
  flightInfo,
}: FlightDetailSheetProps) {
  const insets = useSafeAreaInsets();

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '--:--';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '--:--';
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detail Trip</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Airline Logo & Name */}
          <View style={styles.airlineSection}>
            <View style={styles.airlineLogo}>
              <Airplane size={24} color={colors.primary} variant="Bold" />
            </View>
            <Text style={styles.airlineName}>{flightInfo.airlineName}</Text>
          </View>

          {/* Route Summary */}
          <Text style={styles.routeSummary}>
            {flightInfo.originCity || flightInfo.originCode} ({flightInfo.originCode}) → {flightInfo.destCity || flightInfo.destCode} ({flightInfo.destCode})
          </Text>
          <Text style={styles.flightMeta}>
            {formatDuration(flightInfo.duration)} - {flightInfo.stops === 0 ? 'Direct Flight' : `${flightInfo.stops} Stop${flightInfo.stops > 1 ? 's' : ''}`}
          </Text>

          {/* Flight Details Card */}
          <View style={styles.detailCard}>
            {/* Flight Number & Class */}
            <View style={styles.flightHeader}>
              <View style={styles.airlineLogoSmall}>
                <Airplane size={18} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.flightHeaderInfo}>
                <Text style={styles.airlineNameSmall}>{flightInfo.airlineName}</Text>
                <Text style={styles.flightNumberText}>
                  {flightInfo.flightNumber || 'FL-1234'} • {flightInfo.cabinClass || 'Economy'}
                </Text>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timeline}>
              {/* Departure */}
              <View style={styles.timelineRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{formatTime(flightInfo.departureTime)}</Text>
                  <Text style={styles.dateText}>{formatDate(flightInfo.departureTime)}</Text>
                </View>
                <View style={styles.timelineIndicator}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.locationColumn}>
                  <Text style={styles.locationCode}>{flightInfo.originCity || flightInfo.originCode} ({flightInfo.originCode})</Text>
                  <Text style={styles.airportName}>{flightInfo.originAirport || 'International Airport'}</Text>
                  <Text style={styles.terminalText}>{flightInfo.originTerminal || 'Terminal 1'}</Text>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.durationRow}>
                <View style={styles.timeColumn} />
                <View style={styles.timelineIndicator}>
                  <View style={styles.timelineLineOnly} />
                </View>
                <View style={styles.durationInfo}>
                  <Text style={styles.durationText}>
                    {formatDuration(flightInfo.duration)} ({flightInfo.stops === 0 ? 'Direct' : `${flightInfo.stops} stop`})
                  </Text>
                </View>
              </View>

              {/* Arrival */}
              <View style={styles.timelineRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>{formatTime(flightInfo.arrivalTime)}</Text>
                  <Text style={styles.dateText}>{formatDate(flightInfo.arrivalTime)}</Text>
                </View>
                <View style={styles.timelineIndicator}>
                  <View style={styles.timelineDot} />
                </View>
                <View style={styles.locationColumn}>
                  <Text style={styles.locationCode}>{flightInfo.destCity || flightInfo.destCode} ({flightInfo.destCode})</Text>
                  <Text style={styles.airportName}>{flightInfo.destAirport || 'International Airport'}</Text>
                  <Text style={styles.terminalText}>{flightInfo.destTerminal || 'Terminal 1'}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  airlineSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  airlineLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  airlineName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  routeSummary: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  flightMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: spacing.lg,
  },
  airlineLogoSmall: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  flightHeaderInfo: {
    flex: 1,
  },
  airlineNameSmall: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  flightNumberText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: spacing.md,
  },
  timeText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray200,
    marginTop: 4,
  },
  timelineLineOnly: {
    width: 2,
    height: 40,
    backgroundColor: colors.gray200,
    borderStyle: 'dashed',
  },
  locationColumn: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  locationCode: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  airportName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  terminalText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInfo: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E6E9EB',
  },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
