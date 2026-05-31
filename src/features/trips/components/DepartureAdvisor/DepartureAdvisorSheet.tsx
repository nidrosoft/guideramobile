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
  Routing,
  Building,
  TicketStar,
  DollarCircle,
  TickCircle,
  Danger,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  seatNumber?: string;
  cabinClass?: string;
}

/**
 * Compacts an aircraft string into a short model code that fits a stat column.
 * Strips the manufacturer name and keeps the model token so the value stays on
 * one line regardless of source format:
 *   "Airbus A320"     → "A320"
 *   "Boeing 737-800"  → "737-800"
 *   "Embraer E190"    → "E190"
 *   "A320" / "B738"   → unchanged
 */
const MANUFACTURERS = ['airbus', 'boeing', 'embraer', 'bombardier', 'mcdonnell douglas', 'de havilland', 'cessna', 'gulfstream', 'sukhoi', 'comac', 'atr'];
function formatAircraft(raw?: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim();
  const lower = s.toLowerCase();
  for (const m of MANUFACTURERS) {
    if (lower.startsWith(m + ' ')) {
      s = s.slice(m.length).trim();
      break;
    }
  }
  const tokens = s.split(/\s+/);
  if (tokens.length > 1) {
    s = tokens.find((t) => /\d/.test(t)) || tokens[tokens.length - 1];
  }
  return s || raw.trim();
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
  seatNumber,
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

  // Persist last-known location so the server-side departure monitor can
  // compute traffic-aware leave-by times even when the app isn't open.
  useEffect(() => {
    if (visible && userLocation?.latitude && userLocation?.longitude) {
      departureAdvisorService.persistLastKnownLocation(userLocation.latitude, userLocation.longitude);
    }
  }, [visible, userLocation?.latitude, userLocation?.longitude]);

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

  const boardingTimeStr = advisory
    ? departureAdvisorService.formatTime(advisory.boardingTime)
    : departureAdvisorService.formatTime(departureTime);

  // Urgency stage drives the whole card's color theme (recomputed on each
  // countdown tick): comfortable → green, soon → orange, overdue → red.
  const leaveStage: 'comfortable' | 'soon' | 'overdue' = (() => {
    if (!advisory?.leaveByTime) return 'comfortable';
    const diffMin = Math.floor((new Date(advisory.leaveByTime).getTime() - Date.now()) / 60000);
    if (diffMin <= 0) return 'overdue';
    if (diffMin <= 45) return 'soon';
    return 'comfortable';
  })();
  const stagePalette: Record<typeof leaveStage, { gradient: [string, string]; border: string }> = {
    comfortable: { gradient: [tc.primary, tc.primaryGradient], border: `${tc.primary}33` },
    soon: { gradient: ['#F59E0B', '#D97706'], border: 'rgba(245,158,11,0.4)' },
    overdue: { gradient: ['#EF4444', '#DC2626'], border: 'rgba(239,68,68,0.4)' },
  };
  const cardTheme = stagePalette[leaveStage];

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

            {/* Premium Flight Card */}
            <View style={[styles.flightCard, { borderColor: cardTheme.border }]}>
              <LinearGradient
                colors={cardTheme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flightCardHeader}
              >
                <View style={styles.flightCardTopRow}>
                  <Text style={styles.flightCardRoute} numberOfLines={1}>
                    {flightNumber} · {departureAirport} → {destination || 'Destination'}
                  </Text>
                  {isInternational && (
                    <View style={styles.flightCardIntlBadge}>
                      <Text style={styles.flightCardIntlText}>INTL</Text>
                    </View>
                  )}
                </View>

                {advisory && !loading ? (
                  <View style={styles.heroLeaveBy}>
                    <Text style={styles.heroLeaveByLabel}>LEAVE BY</Text>
                    <View style={styles.heroLeaveByRow}>
                      <Text style={styles.heroLeaveByTime} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                        {departureAdvisorService.formatTime(advisory.leaveByTime)}
                      </Text>
                      <View style={styles.heroConfidencePill}>
                        <View style={[styles.heroConfidenceDot, { backgroundColor: '#FFFFFF' }]} />
                        <Text style={styles.heroConfidenceText}>
                          {advisory.confidence === 'high' ? 'High' : advisory.confidence === 'medium' ? 'Medium' : 'Low'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.heroLeaveBySub} numberOfLines={1}>
                      {countdown.text}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.flightCardBoards}>
                    {advisory?.flightStatus?.status === 'cancelled'
                      ? 'Flight cancelled'
                      : `Boards ${boardingTimeStr}${advisory?.flightStatus?.delay ? ` · Delayed ${advisory.flightStatus.delay}m` : ''}`}
                  </Text>
                )}
              </LinearGradient>

              {/* Core details — seat / terminal / aircraft / flight time */}
              <View style={[styles.flightCardFooter, { backgroundColor: tc.bgSecondary }]}>
                {[
                  { label: 'SEAT', value: seatNumber || '—' },
                  { label: 'TERMINAL', value: advisory?.flightStatus?.terminal || '—' },
                  { label: 'AIRCRAFT', value: formatAircraft(advisory?.flightStatus?.aircraft) || '—' },
                  { label: 'FLIGHT', value: advisory?.flightStatus?.durationMinutes ? departureAdvisorService.formatDuration(advisory.flightStatus.durationMinutes) : '—' },
                ].map((stat, idx) => (
                  <React.Fragment key={stat.label}>
                    {idx > 0 && <View style={[styles.flightCardDivider, { backgroundColor: tc.borderSubtle }]} />}
                    <View style={styles.flightCardStat}>
                      <Text style={[styles.flightCardStatLabel, { color: tc.textTertiary }]}>{stat.label}</Text>
                      <Text style={[styles.flightCardStatValue, { color: tc.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{stat.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
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
                {/* Breakdown */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Routing2 size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Breakdown</Text>
                  </View>

                  <View style={[styles.breakdownCard, { borderColor: tc.borderSubtle }]}>
                    {[
                      { label: 'Drive to airport', value: advisory.breakdown.driveTime, icon: <Car size={18} color={tc.primary} variant="Bold" /> },
                      ...(advisory.breakdown.trafficBuffer > 0 ? [{ label: 'Traffic buffer', value: advisory.breakdown.trafficBuffer, icon: <Routing2 size={18} color={tc.warning} variant="Bold" /> }] : []),
                      { label: 'Parking & transfer', value: advisory.breakdown.parkingAndTransfer, icon: <Building size={18} color={tc.textSecondary} variant="Bold" /> },
                      { label: 'Check-in cutoff', value: advisory.breakdown.checkinCutoff, icon: <TicketStar size={18} color={tc.info} variant="Bold" /> },
                      { label: 'Security (TSA)', value: advisory.breakdown.securityEstimate, icon: <ShieldTick size={18} color={tc.success} variant="Bold" /> },
                      { label: 'Walk to gate', value: advisory.breakdown.gateWalkTime, icon: <Routing size={18} color={tc.purple} variant="Bold" /> },
                      { label: 'Comfort buffer', value: advisory.breakdown.comfortBuffer, icon: <Timer1 size={18} color={tc.textSecondary} variant="Bold" /> },
                    ].map((item, idx) => (
                      <View key={idx} style={[styles.breakdownRow, idx > 0 && { borderTopWidth: 1, borderTopColor: tc.borderSubtle }]}>
                        <View style={styles.breakdownIcon}>{item.icon}</View>
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

                  {(advisory.transport || []).map((option, idx) => (
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
                  {(!advisory.transport || advisory.transport.length === 0) && (
                    <View style={[styles.transportCard, { borderColor: tc.borderSubtle }]}>
                      <Text style={[styles.transportDuration, { color: tc.textTertiary }]}>
                        Transport estimates are unavailable right now.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Risk Indicators */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <SecuritySafe size={18} color={tc.textSecondary} variant="Bold" />
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Risk Level</Text>
                  </View>

                  <View style={[styles.riskGrid]}>
                    {(advisory.risks || []).map((risk, idx) => (
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

  // Premium Flight Card
  flightCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  flightCardHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md + 2 },
  flightCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flightCardRoute: { flex: 1, fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  flightCardIntlBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', marginLeft: 8 },
  flightCardIntlText: { fontSize: typography.fontSize.captionSm, fontWeight: '800', letterSpacing: 0.5, color: '#FFFFFF' },
  flightCardBoards: { fontSize: typography.fontSize.bodySm, color: 'rgba(255,255,255,0.9)', marginTop: 10 },
  // Merged leave-by hero (inside green card)
  heroLeaveBy: { marginTop: spacing.md },
  heroLeaveByLabel: { fontSize: typography.fontSize.bodySm, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(255,255,255,0.9)' },
  heroLeaveByRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  heroLeaveByTime: { fontSize: 46, fontWeight: '800', lineHeight: 54, color: '#FFFFFF', flexShrink: 1 },
  heroConfidencePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  heroConfidenceDot: { width: 7, height: 7, borderRadius: 4 },
  heroConfidenceText: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },
  heroLeaveBySub: { fontSize: typography.fontSize.bodySm, color: 'rgba(255,255,255,0.9)', marginTop: 10, fontWeight: typography.fontWeight.medium },
  flightCardFooter: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  flightCardStat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  flightCardStatLabel: { fontSize: typography.fontSize.captionSm, fontWeight: typography.fontWeight.semibold, letterSpacing: 0.4, marginBottom: 4 },
  flightCardStatValue: { fontSize: typography.fontSize.bodyLg, fontWeight: '800', textAlign: 'center' },
  flightCardDivider: { width: 1, height: 28, alignSelf: 'center' },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  loadingText: { fontSize: typography.fontSize.bodyLg, marginTop: spacing.md },

  // Error
  errorContainer: { alignItems: 'center', padding: spacing.xl, borderRadius: 16, marginBottom: spacing.lg },
  errorText: { fontSize: typography.fontSize.bodyLg, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 12 },
  retryButtonText: { fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },

  // Section
  sectionContainer: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold },

  // Breakdown
  breakdownCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md },
  breakdownIcon: { width: 28 },
  breakdownLabel: { flex: 1, fontSize: typography.fontSize.bodyLg },
  breakdownValue: { fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.semibold },
  breakdownTotal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderTopWidth: 2 },
  breakdownTotalLabel: { flex: 1, fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.bold },
  breakdownTotalValue: { fontSize: typography.fontSize.heading3, fontWeight: '800' },

  // Transport
  transportCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: 16, borderWidth: 1, marginBottom: spacing.sm },
  transportLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transportInfo: { marginLeft: spacing.md },
  transportMode: { fontSize: typography.fontSize.bodyLg, fontWeight: typography.fontWeight.semibold },
  transportDuration: { fontSize: typography.fontSize.bodySm, marginTop: 2 },
  trafficBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  trafficBadgeText: { fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold, textTransform: 'capitalize' },

  // Risk
  riskGrid: { flexDirection: 'row', gap: spacing.sm },
  riskCard: { flex: 1, padding: spacing.md, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  riskCategory: { fontSize: typography.fontSize.bodySm, fontWeight: typography.fontWeight.bold, marginTop: 6, marginBottom: 4 },
  riskDetail: { fontSize: typography.fontSize.captionSm, textAlign: 'center', lineHeight: 14 },

  // Reasoning
  reasoningCard: { padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  reasoningText: { fontSize: typography.fontSize.body, lineHeight: 20 },

  // Actions
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, marginTop: spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  actionButtonText: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.bold, color: '#FFFFFF' },

  // Reminder
  reminderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: spacing.md },
  reminderButtonText: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.bold },
  reminderSetBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, marginBottom: spacing.md },
  reminderSetText: { fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold },

  // Close
  maybeLaterBtn: { paddingVertical: 12, alignItems: 'center' },
  maybeLaterText: { fontSize: typography.fontSize.heading3, fontWeight: typography.fontWeight.medium },
});
