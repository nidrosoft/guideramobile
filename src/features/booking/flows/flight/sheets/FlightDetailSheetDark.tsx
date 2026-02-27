/**
 * FLIGHT DETAIL SHEET - DARK PREMIUM EDITION
 * 
 * A sophisticated dark-themed bottom sheet modal showing complete flight details.
 * Features: Dark gradients, timeline visualization, blur backdrop, smooth animations.
 * Occupies 92% of screen height with spring animations.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Airplane,
  Clock,
  CloseCircle,
  Briefcase,
  Wifi,
  Coffee,
  Flash,
  ArrowRight2,
} from 'iconsax-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;

// Color palette
const COLORS = {
  background: {
    primary: '#1E293B',
    secondary: '#0F172A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    tertiary: '#64748B',
  },
  accent: {
    blue: '#3B82F6',
    green: '#10B981',
    greenDark: '#059669',
  },
  border: 'rgba(255, 255, 255, 0.1)',
  cardBg: 'rgba(30, 41, 59, 0.5)',
};

interface FlightDetailSheetDarkProps {
  visible: boolean;
  onClose: () => void;
  flightInfo: {
    airlineName: string;
    airlineCode?: string;
    airlineColor?: string;
    flightNumber?: string;
    aircraft?: string;
    originCode: string;
    originCity?: string;
    originAirport?: string;
    originTerminal?: string;
    originGate?: string;
    destCode: string;
    destCity?: string;
    destAirport?: string;
    destTerminal?: string;
    departureTime: Date | string;
    arrivalTime: Date | string;
    duration: number;
    cabinClass?: string;
    price: number;
    currency?: string;
    checkedBaggage?: string;
    cabinBaggage?: string;
    passengerCount?: number;
    refundable?: boolean;
    changeable?: boolean;
  };
}

export default function FlightDetailSheetDark({
  visible,
  onClose,
  flightInfo,
}: FlightDetailSheetDarkProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.parallel([
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      RNAnimated.parallel([
        RNAnimated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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
    return dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const airlineColor = flightInfo.airlineColor || COLORS.accent.blue;
  const passengerCount = flightInfo.passengerCount || 1;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop with blur */}
      <RNAnimated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.backdropOverlay} />
        </BlurView>
      </RNAnimated.View>

      {/* Sheet Container */}
      <RNAnimated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.background.primary, COLORS.background.secondary]}
          style={styles.sheetGradient}
        >
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Trip Details</Text>
              <Text style={styles.headerSubtitle}>
                {flightInfo.originCity || flightInfo.originCode} to {flightInfo.destCity || flightInfo.destCode}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <CloseCircle size={20} color={COLORS.text.secondary} variant="Linear" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Flight Info Card */}
            <LinearGradient
              colors={[airlineColor, COLORS.background.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flightCard}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.airlineTag}>
                  <Text style={styles.airlineTagText}>{flightInfo.airlineName}</Text>
                </View>
                <View style={styles.durationTag}>
                  <Clock size={12} color="#E2E8F0" variant="Linear" />
                  <Text style={styles.durationTagText}>{formatDuration(flightInfo.duration)}</Text>
                </View>
              </View>

              {/* Route Display */}
              <View style={styles.routeDisplay}>
                {/* Departure */}
                <View style={styles.routePoint}>
                  <Text style={styles.routeCode}>{flightInfo.originCode}</Text>
                  <Text style={styles.routeTime}>{formatTime(flightInfo.departureTime)}</Text>
                  <Text style={styles.routeDate}>{formatDate(flightInfo.departureTime)}</Text>
                </View>

                {/* Flight Path */}
                <View style={styles.flightPath}>
                  <View style={styles.pathLine} />
                  <View style={styles.planeContainer}>
                    <Airplane size={24} color={COLORS.text.primary} variant="Bold" style={styles.planeIcon} />
                  </View>
                  <View style={styles.pathLine} />
                </View>

                {/* Arrival */}
                <View style={[styles.routePoint, styles.routePointRight]}>
                  <Text style={styles.routeCode}>{flightInfo.destCode}</Text>
                  <Text style={styles.routeTime}>{formatTime(flightInfo.arrivalTime)}</Text>
                  <Text style={styles.routeDate}>{formatDate(flightInfo.arrivalTime)}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Flight Itinerary Section */}
            <Text style={styles.sectionTitle}>Flight Itinerary</Text>
            <View style={styles.timeline}>
              {/* Departure Item */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{formatTime(flightInfo.departureTime)}</Text>
                  <View style={styles.timelineLineContainer}>
                    <View style={styles.timelineVerticalLine} />
                  </View>
                </View>
                <View style={styles.timelineRight}>
                  <View style={[styles.timelinePoint, styles.timelinePointDeparture]} />
                  <Text style={styles.timelineStation}>
                    {flightInfo.originAirport || flightInfo.originCity || `${flightInfo.originCode} Airport`}
                  </Text>
                  <Text style={styles.timelineDetail}>
                    {flightInfo.originTerminal ? `${flightInfo.originTerminal} • ` : ''}{flightInfo.originGate || 'Departure'}
                  </Text>
                </View>
              </View>

              {/* In-Flight Item */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineDuration}>{formatDuration(flightInfo.duration)}</Text>
                  <View style={styles.timelineLineContainer}>
                    <View style={styles.timelineDashedLine} />
                  </View>
                </View>
                <View style={styles.timelineRight}>
                  <View style={[styles.timelinePoint, styles.timelinePointInFlight]} />
                  <Text style={styles.timelineInFlightStatus}>In Flight</Text>
                  <Text style={styles.timelineDetail}>
                    {flightInfo.aircraft || 'Boeing 787-9 Dreamliner'}
                  </Text>
                  {/* Amenity Badges */}
                  <View style={styles.amenityBadges}>
                    <View style={styles.amenityBadge}>
                      <Wifi size={12} color={COLORS.text.secondary} variant="Linear" />
                      <Text style={styles.amenityBadgeText}>Wi-Fi</Text>
                    </View>
                    <View style={styles.amenityBadge}>
                      <Coffee size={12} color={COLORS.text.secondary} variant="Linear" />
                      <Text style={styles.amenityBadgeText}>Meal</Text>
                    </View>
                    <View style={styles.amenityBadge}>
                      <Flash size={12} color={COLORS.text.secondary} variant="Linear" />
                      <Text style={styles.amenityBadgeText}>Power</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Arrival Item */}
              <View style={[styles.timelineItem, styles.timelineItemLast]}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{formatTime(flightInfo.arrivalTime)}</Text>
                </View>
                <View style={styles.timelineRight}>
                  <View style={[styles.timelinePoint, styles.timelinePointArrival]} />
                  <Text style={styles.timelineStation}>
                    {flightInfo.destAirport || flightInfo.destCity || `${flightInfo.destCode} Airport`}
                  </Text>
                  <Text style={styles.timelineDetail}>
                    {flightInfo.destTerminal ? `${flightInfo.destTerminal} • ` : ''}Arrival
                  </Text>
                </View>
              </View>
            </View>

            {/* Baggage Allowance Section */}
            <Text style={styles.sectionTitle}>Baggage Allowance</Text>
            <View style={styles.baggageContainer}>
              <View style={styles.baggageItem}>
                <View style={styles.baggageIconContainer}>
                  <Briefcase size={20} color={COLORS.text.primary} variant="Bold" />
                </View>
                <View style={styles.baggageInfo}>
                  <Text style={styles.baggageLabel}>Checked Baggage</Text>
                  <Text style={styles.baggageValue}>{flightInfo.checkedBaggage || '2 x 23kg'}</Text>
                </View>
              </View>
              <View style={styles.baggageDivider} />
              <View style={styles.baggageItem}>
                <View style={styles.baggageIconContainer}>
                  <Briefcase size={16} color={COLORS.text.primary} variant="Linear" />
                </View>
                <View style={styles.baggageInfo}>
                  <Text style={styles.baggageLabel}>Cabin Baggage</Text>
                  <Text style={styles.baggageValue}>{flightInfo.cabinBaggage || '1 x 7kg'}</Text>
                </View>
              </View>
            </View>

            {/* Fare Rules Section */}
            <Text style={styles.sectionTitle}>Fare Rules</Text>
            <View style={styles.fareRulesContainer}>
              <View style={styles.fareRuleItem}>
                <View style={[styles.fareRuleIcon, flightInfo.refundable && styles.fareRuleIconActive]}>
                  <Text style={styles.fareRuleIconText}>{flightInfo.refundable ? '✓' : '✕'}</Text>
                </View>
                <View style={styles.fareRuleInfo}>
                  <Text style={styles.fareRuleTitle}>
                    {flightInfo.refundable ? 'Refundable' : 'Non-refundable'}
                  </Text>
                  <Text style={styles.fareRuleDesc}>
                    {flightInfo.refundable ? 'Full refund available' : 'No refund on cancellation'}
                  </Text>
                </View>
              </View>
              <View style={styles.fareRuleDivider} />
              <View style={styles.fareRuleItem}>
                <View style={[styles.fareRuleIcon, flightInfo.changeable && styles.fareRuleIconActive]}>
                  <Text style={styles.fareRuleIconText}>{flightInfo.changeable ? '✓' : '✕'}</Text>
                </View>
                <View style={styles.fareRuleInfo}>
                  <Text style={styles.fareRuleTitle}>
                    {flightInfo.changeable ? 'Changeable' : 'Non-changeable'}
                  </Text>
                  <Text style={styles.fareRuleDesc}>
                    {flightInfo.changeable ? 'Date changes allowed' : 'Changes not permitted'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Summary Section */}
            <Text style={styles.sectionTitle}>Price Summary</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Flight ({passengerCount} Adult{passengerCount > 1 ? 's' : ''})</Text>
                <Text style={styles.priceValue}>${(flightInfo.price * 0.85).toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & Fees</Text>
                <Text style={styles.priceValue}>${(flightInfo.price * 0.15).toFixed(2)}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceTotalLabel}>Total Amount</Text>
                <Text style={styles.priceTotalValue}>${flightInfo.price.toFixed(2)}</Text>
              </View>
            </View>

            {/* Bottom Spacer */}
            <View style={[styles.bottomSpacer, { paddingBottom: insets.bottom + 24 }]} />
          </ScrollView>
        </LinearGradient>
      </RNAnimated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheetGradient: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  flightCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airlineTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  airlineTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  routeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  routePoint: {
    flex: 1,
  },
  routePointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  routeDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  flightPath: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  planeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  planeIcon: {
    transform: [{ rotate: '90deg' }],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineItemLast: {
    // No additional styling needed
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  timelineDuration: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  timelineLineContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  timelineVerticalLine: {
    width: 2,
    height: 40,
    backgroundColor: '#334155',
  },
  timelineDashedLine: {
    width: 1,
    height: 60,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#475569',
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 24,
    paddingBottom: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  timelinePoint: {
    position: 'absolute',
    left: -6,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  timelinePointDeparture: {
    backgroundColor: COLORS.accent.blue,
    borderColor: COLORS.background.primary,
  },
  timelinePointInFlight: {
    backgroundColor: COLORS.text.tertiary,
    borderColor: '#475569',
  },
  timelinePointArrival: {
    backgroundColor: COLORS.accent.greenDark,
    borderColor: COLORS.accent.green,
  },
  timelineStation: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  timelineDetail: {
    fontSize: 13,
    color: COLORS.text.tertiary,
  },
  timelineInFlightStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  amenityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  amenityBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  baggageContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  baggageItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  baggageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baggageInfo: {
    flex: 1,
  },
  baggageLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  baggageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  baggageDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  priceBreakdown: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent.blue,
  },
  bottomSpacer: {
    height: 40,
  },
  fareRulesContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  fareRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fareRuleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F87171',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fareRuleIconActive: {
    backgroundColor: '#34D399',
  },
  fareRuleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  fareRuleInfo: {
    flex: 1,
  },
  fareRuleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  fareRuleDesc: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  fareRuleDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
});
