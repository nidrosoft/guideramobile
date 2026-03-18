/**
 * DEPARTURE ADVISOR BOTTOM SHEET
 *
 * Full departure advisory showing:
 * - Flight info header
 * - "Leave by" countdown
 * - Time breakdown
 * - Transport options
 * - Risk indicators
 * - Reasoning explanation
 * - Action buttons (Maps, Uber/Lyft, Set Reminder)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Airplane,
  Clock,
  Car,
  Bus,
  Location,
  ShieldTick,
  Warning2,
  Map1,
  InfoCircle,
  Timer1,
  SecuritySafe,
  Routing2,
  DollarCircle,
  TickCircle,
  Danger,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import {
  departureAdvisorService,
  DepartureAdvisory,
  CalculateParams,
} from '@/services/departure/departure.service';
import { useUserLocation } from '@/hooks/useUserLocation';
import { scheduleDepartureReminder, scheduleDepartureFeedback } from '@/services/notifications/trip-notification-scheduler';
import { useToast } from '@/contexts/ToastContext';

interface DepartureAdvisorSheetProps {
  visible: boolean;
  onClose: () => void;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  destination: string;
  isInternational: boolean;
  tripId?: string;
  bookingId?: string;
}

export default function DepartureAdvisorSheet({
  visible,
  onClose,
  flightNumber,
  departureAirport,
  departureTime,
  destination,
  isInternational,
  tripId,
  bookingId,
}: DepartureAdvisorSheetProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const { location: userLocation } = useUserLocation();
  const { showSuccess } = useToast();
  const [reminderSet, setReminderSet] = useState(false);

  const [advisory, setAdvisory] = useState<DepartureAdvisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ text: string; urgent: boolean }>({ text: '', urgent: false });

  // Calculate advisory when sheet opens
  const calculateAdvisory = useCallback(async () => {
    if (!userLocation) {
      setError('Unable to get your location. Please enable location services.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: CalculateParams = {
        tripId,
        bookingId,
        flightNumber,
        departureAirport,
        departureTime,
        isInternational,
        userLocation: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        preferences: {
          parkingType: 'rideshare',
          comfortBuffer: 'standard',
        },
      };

      const result = await departureAdvisorService.calculate(params);
      setAdvisory(result);
    } catch (err) {
      if (__DEV__) console.warn('Departure advisor calculation failed:', err);
      setError('Unable to calculate departure time. Please check your location services and try again.');
    } finally {
      setLoading(false);
    }
  }, [userLocation, flightNumber, departureAirport, departureTime, isInternational, tripId, bookingId]);

  useEffect(() => {
    if (visible && userLocation) {
      calculateAdvisory();
    }
  }, [visible, userLocation]);

  // Live countdown
  useEffect(() => {
    if (!advisory?.leaveByTime) return;

    const update = () => {
      setCountdown(departureAdvisorService.getTimeUntilLeave(advisory.leaveByTime));
    };

    update();
    const interval = setInterval(update, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [advisory?.leaveByTime]);

  const handleOpenMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = Platform.OS === 'ios'
      ? `maps:?daddr=${departureAirport}+Airport&dirflg=d`
      : `geo:0,0?q=${departureAirport}+Airport`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${departureAirport}+Airport`);
    });
  };

  const handleOpenUber = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('uber://').catch(() => {
      Linking.openURL('https://m.uber.com');
    });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <TickCircle size={18} color={tc.success} variant="Bold" />;
      case 'moderate': return <Warning2 size={18} color={tc.warning} variant="Bold" />;
      case 'high': return <Danger size={18} color={tc.error} variant="Bold" />;
      default: return <InfoCircle size={18} color={tc.textTertiary} variant="Bold" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return tc.success;
      case 'moderate': return tc.warning;
      case 'high': return tc.error;
      default: return tc.textTertiary;
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'drive': return <Car size={20} color={tc.primary} variant="Bold" />;
      case 'rideshare': return <Car size={20} color={tc.purple} variant="Bold" />;
      case 'transit': return <Bus size={20} color={tc.info} variant="Bold" />;
      default: return <Car size={20} color={tc.textTertiary} variant="Bold" />;
    }
  };

  const getTransportLabel = (mode: string) => {
    switch (mode) {
      case 'drive': return 'Drive yourself';
      case 'rideshare': return 'Uber / Lyft';
      case 'transit': return 'Public transit';
      default: return mode;
    }
  };

  const depTime = new Date(departureTime);
  const boardingTimeStr = advisory
    ? departureAdvisorService.formatTime(advisory.boardingTime)
    : depTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Backdrop (Tappable to close) */}
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        {/* Sheet Content */}
        <View style={[styles.sheet, { backgroundColor: tc.bgPrimary, paddingBottom: insets.bottom || spacing.lg }]}>
          {/* Header Row with Close Button */}
          <View style={styles.headerContainer}>
            <View style={styles.handleWrapper}>
              <View style={[styles.handle, { backgroundColor: tc.borderSubtle }]} />
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseCircle size={28} color={tc.textTertiary} variant="Bold" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>

            {/* Flight Header */}
            <View style={[styles.flightHeader, { backgroundColor: `${tc.primary}08`, borderColor: tc.borderSubtle }]}>
              <View style={[styles.flightIconCircle, { backgroundColor: `${tc.primary}15` }]}>
                <Airplane size={24} color={tc.primary} variant="Bold" />
              </View>
              <View style={styles.flightInfo}>
                <Text style={[styles.flightNumber, { color: tc.textPrimary }]}>{flightNumber}</Text>
                <Text style={[styles.flightRoute, { color: tc.textSecondary }]}>
                  {departureAirport} → {destination}
                </Text>
                <Text style={[styles.flightTime, { color: tc.textTertiary }]}>
                  Boards {boardingTimeStr}
                  {advisory?.flightStatus?.gate ? ` · Gate ${advisory.flightStatus.gate}` : ''}
                  {advisory?.flightStatus?.terminal ? ` · Terminal ${advisory.flightStatus.terminal}` : ''}
                </Text>
              </View>
              {isInternational && (
                <View style={[styles.intlBadge, { backgroundColor: `${tc.info}15` }]}>
                  <Text style={[styles.intlBadgeText, { color: tc.info }]}>INTL</Text>
                </View>
              )}
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tc.primary} />
                <Text style={[styles.loadingText, { color: tc.textSecondary }]}>
                  Calculating your optimal departure...
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && !loading && (
              <View style={[styles.errorContainer, { backgroundColor: `${tc.error}10` }]}>
                <Danger size={24} color={tc.error} variant="Bold" />
                <Text style={[styles.errorText, { color: tc.error }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: tc.primary }]}
                  onPress={calculateAdvisory}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Advisory Content */}
            {advisory && !loading && (
              <>
                {/* Leave By — Hero Section */}
                <View style={[styles.leaveByCard, { backgroundColor: countdown.urgent ? `${tc.error}10` : `${tc.primary}08`, borderColor: countdown.urgent ? tc.error : tc.primary }]}>
                  <View style={styles.leaveByHeader}>
                    <Timer1 size={20} color={countdown.urgent ? tc.error : tc.primary} variant="Bold" />
                    <Text style={[styles.leaveByLabel, { color: countdown.urgent ? tc.error : tc.primary }]}>
                      LEAVE BY
                    </Text>
                  </View>
                  <Text style={[styles.leaveByTime, { color: countdown.urgent ? tc.error : tc.textPrimary }]}>
                    {departureAdvisorService.formatTime(advisory.leaveByTime)}
                  </Text>
                  <Text style={[styles.leaveByCountdown, { color: countdown.urgent ? tc.error : tc.textSecondary }]}>
                    {countdown.text}
                  </Text>

                  {/* Confidence badge */}
                  <View style={[styles.confidenceBadge, {
                    backgroundColor: advisory.confidence === 'high' ? `${tc.success}15` : advisory.confidence === 'medium' ? `${tc.warning}15` : `${tc.error}15`,
                  }]}>
                    <Text style={[styles.confidenceText, {
                      color: advisory.confidence === 'high' ? tc.success : advisory.confidence === 'medium' ? tc.warning : tc.error,
                    }]}>
                      {advisory.confidence === 'high' ? '● High confidence' : advisory.confidence === 'medium' ? '● Medium confidence' : '● Low confidence'}
                    </Text>
                  </View>
                </View>

                {/* Breakdown */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Routing2 size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Breakdown</Text>
                  </View>

                  <View style={[styles.breakdownCard, { borderColor: tc.borderSubtle }]}>
                    {[
                      { label: 'Drive to airport', value: advisory.breakdown.driveTime, icon: '🚗' },
                      ...(advisory.breakdown.trafficBuffer > 0 ? [{ label: 'Traffic buffer', value: advisory.breakdown.trafficBuffer, icon: '🚦' }] : []),
                      { label: 'Parking & transfer', value: advisory.breakdown.parkingAndTransfer, icon: '🅿️' },
                      { label: 'Check-in cutoff', value: advisory.breakdown.checkinCutoff, icon: '🛂' },
                      { label: 'Security (TSA)', value: advisory.breakdown.securityEstimate, icon: '🔒' },
                      { label: 'Walk to gate', value: advisory.breakdown.gateWalkTime, icon: '🚶' },
                      { label: 'Comfort buffer', value: advisory.breakdown.comfortBuffer, icon: '⏱️' },
                    ].map((item, idx) => (
                      <View key={idx} style={[styles.breakdownRow, idx > 0 && { borderTopWidth: 1, borderTopColor: tc.borderSubtle }]}>
                        <Text style={styles.breakdownEmoji}>{item.icon}</Text>
                        <Text style={[styles.breakdownLabel, { color: tc.textSecondary }]}>{item.label}</Text>
                        <Text style={[styles.breakdownValue, { color: tc.textPrimary }]}>
                          {departureAdvisorService.formatDuration(item.value)}
                        </Text>
                      </View>
                    ))}
                    <View style={[styles.breakdownTotal, { borderTopColor: tc.primary }]}>
                      <Text style={[styles.breakdownTotalLabel, { color: tc.primary }]}>Total needed</Text>
                      <Text style={[styles.breakdownTotalValue, { color: tc.primary }]}>
                        {departureAdvisorService.formatDuration(advisory.breakdown.totalMinutes)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Transport Options */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Car size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Transport Options</Text>
                  </View>

                  {advisory.transport.map((option, idx) => (
                    <View key={idx} style={[styles.transportCard, { borderColor: tc.borderSubtle }]}>
                      <View style={styles.transportLeft}>
                        {getTransportIcon(option.mode)}
                        <View style={styles.transportInfo}>
                          <Text style={[styles.transportMode, { color: tc.textPrimary }]}>
                            {getTransportLabel(option.mode)}
                          </Text>
                          <Text style={[styles.transportDuration, { color: tc.textSecondary }]}>
                            ~{departureAdvisorService.formatDuration(option.durationMinutes)}
                            {option.estimatedCost ? ` · $${option.estimatedCost.min}-${option.estimatedCost.max}` : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.trafficBadge, {
                        backgroundColor: option.trafficLevel === 'heavy' ? `${tc.error}15` : option.trafficLevel === 'moderate' ? `${tc.warning}15` : `${tc.success}15`,
                      }]}>
                        <Text style={[styles.trafficBadgeText, {
                          color: option.trafficLevel === 'heavy' ? tc.error : option.trafficLevel === 'moderate' ? tc.warning : tc.success,
                        }]}>
                          {option.trafficLevel}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Risk Indicators */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <SecuritySafe size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Risk Level</Text>
                  </View>

                  <View style={[styles.riskGrid]}>
                    {advisory.risks.map((risk, idx) => (
                      <View key={idx} style={[styles.riskCard, { backgroundColor: `${getRiskColor(risk.level)}08`, borderColor: `${getRiskColor(risk.level)}20` }]}>
                        {getRiskIcon(risk.level)}
                        <Text style={[styles.riskCategory, { color: tc.textPrimary }]}>{risk.category}</Text>
                        <Text style={[styles.riskDetail, { color: tc.textSecondary }]} numberOfLines={2}>{risk.detail}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Why This Recommendation */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <InfoCircle size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Why This Recommendation</Text>
                  </View>
                  <View style={[styles.reasoningCard, { backgroundColor: `${tc.primary}06`, borderColor: tc.borderSubtle }]}>
                    <Text style={[styles.reasoningText, { color: tc.textSecondary }]}>{advisory.reasoning}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: tc.primary }]}
                    onPress={handleOpenMaps}
                    activeOpacity={0.8}
                  >
                    <Map1 size={20} color="#FFFFFF" variant="Bold" />
                    <Text style={styles.actionButtonText}>Open Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: tc.textPrimary }]}
                    onPress={handleOpenUber}
                    activeOpacity={0.8}
                  >
                    <Car size={20} color={tc.bgPrimary} variant="Bold" />
                    <Text style={[styles.actionButtonText, { color: tc.bgPrimary }]}>Book Ride</Text>
                  </TouchableOpacity>
                </View>

                {/* Set Reminder Button */}
                {advisory && !reminderSet && (
                  <TouchableOpacity
                    style={[styles.reminderButton, { borderColor: tc.primary }]}
                    onPress={async () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      await scheduleDepartureReminder(
                        advisory.leaveByTime,
                        flightNumber,
                        departureAirport,
                        destination,
                        tripId
                      );
                      await scheduleDepartureFeedback(
                        departureTime,
                        advisory.advisoryId,
                        tripId
                      );
                      setReminderSet(true);
                      showSuccess('Reminder set! We\'ll notify you when it\'s time to leave.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Clock size={18} color={tc.primary} variant="Bold" />
                    <Text style={[styles.reminderButtonText, { color: tc.primary }]}>Set Leave Reminder</Text>
                  </TouchableOpacity>
                )}
                {reminderSet && (
                  <View style={[styles.reminderSetBadge, { backgroundColor: `${tc.success}12` }]}>
                    <TickCircle size={16} color={tc.success} variant="Bold" />
                    <Text style={[styles.reminderSetText, { color: tc.success }]}>Reminder set</Text>
                  </View>
                )}
              </>
            )}

            {/* Maybe Later */}
            <TouchableOpacity style={styles.maybeLaterBtn} onPress={handleClose} activeOpacity={0.6}>
              <Text style={[styles.maybeLaterText, { color: tc.textTertiary }]}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    minHeight: 44,
  },
  handleWrapper: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handle: { width: 40, height: 4, borderRadius: 2 },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.md },

  // Flight Header
  flightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  flightIconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  flightInfo: { flex: 1 },
  flightNumber: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  flightRoute: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  flightTime: { fontSize: 12 },
  intlBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  intlBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  loadingText: { fontSize: 14, marginTop: spacing.md },

  // Error
  errorContainer: { alignItems: 'center', padding: spacing.xl, borderRadius: 16, marginBottom: spacing.lg },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 12 },
  retryButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Leave By
  leaveByCard: { alignItems: 'center', padding: spacing.lg, borderRadius: 20, borderWidth: 1.5, marginBottom: spacing.lg },
  leaveByHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  leaveByLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  leaveByTime: { fontSize: 42, fontWeight: '800', lineHeight: 50, marginBottom: 4 },
  leaveByCountdown: { fontSize: 15, fontWeight: '500', marginBottom: spacing.sm },
  confidenceBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 11, fontWeight: '600' },

  // Section
  sectionContainer: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700' },

  // Breakdown
  breakdownCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md },
  breakdownEmoji: { fontSize: 16, width: 28 },
  breakdownLabel: { flex: 1, fontSize: 14 },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  breakdownTotal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderTopWidth: 2 },
  breakdownTotalLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  breakdownTotalValue: { fontSize: 15, fontWeight: '800' },

  // Transport
  transportCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm },
  transportLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transportInfo: { marginLeft: spacing.md },
  transportMode: { fontSize: 14, fontWeight: '600' },
  transportDuration: { fontSize: 12, marginTop: 2 },
  trafficBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  trafficBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  // Risk
  riskGrid: { flexDirection: 'row', gap: spacing.sm },
  riskCard: { flex: 1, padding: spacing.md, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  riskCategory: { fontSize: 12, fontWeight: '700', marginTop: 6, marginBottom: 4 },
  riskDetail: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  // Reasoning
  reasoningCard: { padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  reasoningText: { fontSize: 13, lineHeight: 20 },

  // Actions
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Reminder
  reminderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: spacing.md },
  reminderButtonText: { fontSize: 15, fontWeight: '700' },
  reminderSetBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, marginBottom: spacing.md },
  reminderSetText: { fontSize: 13, fontWeight: '600' },

  // Close
  maybeLaterBtn: { paddingVertical: 12, alignItems: 'center' },
  maybeLaterText: { fontSize: 15, fontWeight: '500' },
});
