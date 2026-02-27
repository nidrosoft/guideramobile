/**
 * FLIGHT DETAIL SHEET - PREMIUM EDITION
 * 
 * A stunning, beautifully designed bottom sheet showing complete flight details
 * Features: Gradient header, animated flight path, premium cards, smooth transitions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { 
  CloseCircle, 
  Airplane, 
  Clock, 
  Calendar,
  Location,
  TickCircle,
  Briefcase,
  Coffee,
  Wifi,
  Monitor,
  ArrowRight2,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlightDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  flightInfo: {
    airlineName: string;
    airlineCode?: string;
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
    currency?: string;
    refundable?: boolean;
    changeable?: boolean;
  };
}

export default function FlightDetailSheet({
  visible,
  onClose,
  flightInfo,
}: FlightDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [logoError, setLogoError] = useState(false);

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

  const formatFullDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getAirlineLogoUrl = (code: string) => {
    return `https://images.kiwi.com/airlines/64/${code}.png`;
  };

  const getAirlineInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const getCabinClassLabel = (cabinClass?: string) => {
    const labels: Record<string, string> = {
      'ECONOMY': 'Economy Class',
      'PREMIUM_ECONOMY': 'Premium Economy',
      'BUSINESS': 'Business Class',
      'FIRST': 'First Class',
    };
    return labels[cabinClass || 'ECONOMY'] || 'Economy Class';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Premium Gradient Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CloseCircle size={28} color="rgba(255,255,255,0.8)" variant="Bold" />
          </TouchableOpacity>

          {/* Airline Logo & Info */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.airlineHeader}>
            <View style={styles.airlineLogoContainer}>
              {!logoError && flightInfo.airlineCode ? (
                <Image
                  source={{ uri: getAirlineLogoUrl(flightInfo.airlineCode) }}
                  style={styles.airlineLogo}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6']}
                  style={styles.airlineLogoFallback}
                >
                  <Text style={styles.airlineInitials}>
                    {getAirlineInitials(flightInfo.airlineName)}
                  </Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.airlineName}>{flightInfo.airlineName}</Text>
            <View style={styles.flightBadge}>
              <Text style={styles.flightBadgeText}>
                {flightInfo.flightNumber || 'FL-000'} • {getCabinClassLabel(flightInfo.cabinClass)}
              </Text>
            </View>
          </Animated.View>

          {/* Flight Route Visualization */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.routeVisualization}>
            <View style={styles.routePoint}>
              <Text style={styles.routeCode}>{flightInfo.originCode}</Text>
              <Text style={styles.routeCity}>{flightInfo.originCity || 'Origin'}</Text>
            </View>
            
            <View style={styles.routePath}>
              <View style={styles.routeDot} />
              <View style={styles.routeLine}>
                <View style={styles.planeOnRoute}>
                  <Airplane size={20} color={colors.white} variant="Bold" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
              </View>
              <View style={styles.routeDot} />
            </View>
            
            <View style={styles.routePoint}>
              <Text style={styles.routeCode}>{flightInfo.destCode}</Text>
              <Text style={styles.routeCity}>{flightInfo.destCity || 'Destination'}</Text>
            </View>
          </Animated.View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Clock size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>{formatDuration(flightInfo.duration)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Airplane size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statText}>
                {flightInfo.stops === 0 ? 'Direct' : `${flightInfo.stops} Stop${flightInfo.stops > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>

          {/* Date in Header */}
          <Text style={styles.headerDate}>{formatDate(flightInfo.departureTime)}</Text>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* Detailed Timeline Card */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.timelineCard}>
            <Text style={styles.cardTitle}>Flight Itinerary</Text>
            
            {/* Departure */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={styles.departureDot}>
                  <View style={styles.departureDotInner} />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRightColumn}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>{formatTime(flightInfo.departureTime)}</Text>
                  <View style={styles.departureBadge}>
                    <Text style={styles.departureBadgeText}>Departure</Text>
                  </View>
                </View>
                <Text style={styles.timelineAirport}>
                  {flightInfo.originCity || flightInfo.originCode} ({flightInfo.originCode})
                </Text>
                <View style={styles.airportDetails}>
                  <Location size={14} color={colors.textSecondary} />
                  <Text style={styles.airportText}>
                    {flightInfo.originAirport || 'International Airport'}
                  </Text>
                </View>
                <View style={styles.terminalBadge}>
                  <Text style={styles.terminalText}>{flightInfo.originTerminal || 'Terminal 1'}</Text>
                </View>
                
                {/* Duration pill inline */}
                <View style={styles.durationPillInline}>
                  <Airplane size={14} color={colors.primary} />
                  <Text style={styles.durationPillText}>
                    {formatDuration(flightInfo.duration)} flight time
                  </Text>
                </View>
                {flightInfo.stops > 0 && (
                  <Text style={styles.stopsNote}>
                    {flightInfo.stops} stop{flightInfo.stops > 1 ? 's' : ''} en route
                  </Text>
                )}
              </View>
            </View>

            {/* Arrival */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeftColumn}>
                <View style={styles.arrivalDot}>
                  <TickCircle size={14} color={colors.white} variant="Bold" />
                </View>
              </View>
              <View style={styles.timelineRightColumn}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTime}>{formatTime(flightInfo.arrivalTime)}</Text>
                  <View style={[styles.departureBadge, styles.arrivalBadgeStyle]}>
                    <Text style={[styles.departureBadgeText, styles.arrivalBadgeText]}>Arrival</Text>
                  </View>
                </View>
                <Text style={styles.timelineAirport}>
                  {flightInfo.destCity || flightInfo.destCode} ({flightInfo.destCode})
                </Text>
                <View style={styles.airportDetails}>
                  <Location size={14} color={colors.textSecondary} />
                  <Text style={styles.airportText}>
                    {flightInfo.destAirport || 'International Airport'}
                  </Text>
                </View>
                <View style={styles.terminalBadge}>
                  <Text style={styles.terminalText}>{flightInfo.destTerminal || 'Terminal 1'}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Amenities Card */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.amenitiesCard}>
            <Text style={styles.cardTitle}>Onboard Experience</Text>
            <View style={styles.amenitiesGrid}>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Briefcase size={18} color={colors.primary} />
                </View>
                <Text style={styles.amenityText}>Cabin Bag</Text>
              </View>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Coffee size={18} color={colors.primary} />
                </View>
                <Text style={styles.amenityText}>Meals</Text>
              </View>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Wifi size={18} color={colors.primary} />
                </View>
                <Text style={styles.amenityText}>Wi-Fi</Text>
              </View>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Monitor size={18} color={colors.primary} />
                </View>
                <Text style={styles.amenityText}>Entertainment</Text>
              </View>
            </View>
          </Animated.View>

          {/* Fare Rules Card */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.fareRulesCard}>
            <Text style={styles.cardTitle}>Fare Rules</Text>
            <View style={styles.fareRuleRow}>
              <View style={styles.fareRuleItem}>
                <View style={[styles.fareRuleIcon, flightInfo.refundable && styles.fareRuleIconActive]}>
                  {flightInfo.refundable ? (
                    <TickCircle size={16} color={colors.white} variant="Bold" />
                  ) : (
                    <CloseCircle size={16} color={colors.white} variant="Bold" />
                  )}
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
            </View>
            <View style={styles.fareRuleRow}>
              <View style={styles.fareRuleItem}>
                <View style={[styles.fareRuleIcon, flightInfo.changeable && styles.fareRuleIconActive]}>
                  {flightInfo.changeable ? (
                    <TickCircle size={16} color={colors.white} variant="Bold" />
                  ) : (
                    <CloseCircle size={16} color={colors.white} variant="Bold" />
                  )}
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
          </Animated.View>

          {/* Price Summary */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.priceValue}>
                ${flightInfo.price.toFixed(2)} {flightInfo.currency || 'USD'}
              </Text>
            </View>
            <Text style={styles.priceNote}>Price per person • All taxes included</Text>
          </Animated.View>
        </ScrollView>

        {/* Premium Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeBtnGradient}
            >
              <Text style={styles.closeBtnText}>Got it</Text>
              <ArrowRight2 size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Premium Gradient Header - Compact
  headerGradient: {
    paddingTop: 44,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  // Airline Header Section - Compact
  airlineHeader: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  airlineLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  airlineLogoFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineInitials: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: colors.white,
  },
  airlineName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.white,
    marginBottom: 4,
  },
  flightBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 100,
  },
  flightBadgeText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as any,
  },
  
  // Route Visualization - Compact
  routeVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  routePoint: {
    alignItems: 'center',
    width: 80,
  },
  routeCode: {
    fontSize: 24,
    fontWeight: '800' as any,
    color: colors.white,
    letterSpacing: 1,
  },
  routeCity: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  routePath: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  routeLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.xs,
    position: 'relative',
  },
  planeOnRoute: {
    position: 'absolute',
    top: -9,
    left: '50%',
    marginLeft: -10,
  },
  
  // Quick Stats - Compact
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500' as any,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.md,
  },
  headerDate: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  
  // Content Section
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  
  // Timeline Card
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  
  // Timeline Row Structure
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeftColumn: {
    width: 32,
    alignItems: 'center',
  },
  timelineRightColumn: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.sm,
  },
  
  // Departure Dot
  departureDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  departureDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  
  // Timeline Line - flex to fill space
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  
  // Arrival Dot
  arrivalDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Timeline Content
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timelineTime: {
    fontSize: 22,
    fontWeight: '700' as any,
    color: colors.textPrimary,
  },
  departureBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 100,
  },
  departureBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600' as any,
  },
  arrivalBadgeStyle: {
    backgroundColor: '#10B98115',
  },
  arrivalBadgeText: {
    color: '#10B981',
  },
  timelineAirport: {
    fontSize: typography.fontSize.base,
    fontWeight: '600' as any,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  airportDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  airportText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  terminalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  terminalText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500' as any,
  },
  
  // Duration Pill Inline
  durationPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  durationPillText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as any,
  },
  stopsNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  // Amenities Card
  amenitiesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    width: (SCREEN_WIDTH - spacing.lg * 4 - spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amenityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500' as any,
  },
  
  // Fare Rules Card
  fareRulesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fareRuleRow: {
    marginBottom: spacing.md,
  },
  fareRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  fareRuleInfo: {
    flex: 1,
  },
  fareRuleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600' as any,
    color: colors.textPrimary,
  },
  fareRuleDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Price Card
  priceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: `${colors.primary}20`,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: colors.primary,
  },
  priceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  
  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  closeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  closeBtnText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600' as any,
    color: colors.white,
  },
});
