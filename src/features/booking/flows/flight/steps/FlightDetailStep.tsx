/**
 * FLIGHT DETAIL STEP
 * 
 * Detailed view of selected flight with full itinerary.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Airplane,
  Clock,
  Calendar,
  Location,
  TickCircle,
  Briefcase,
  Coffee,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';

interface FlightDetailStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  stepIndex: number;
  totalSteps: number;
}

export default function FlightDetailStep({
  onNext,
  onBack,
  onClose,
  stepIndex,
  totalSteps,
}: FlightDetailStepProps) {
  const insets = useSafeAreaInsets();
  const { selectedOutboundFlight, searchParams } = useFlightStore();
  
  if (!selectedOutboundFlight) {
    return null;
  }
  
  const flight = selectedOutboundFlight;
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Flight Summary Card */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.summaryCard}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.airlineBadge}>
                <Text style={styles.airlineCodeWhite}>{firstSegment.airline.code}</Text>
              </View>
              <Text style={styles.airlineNameWhite}>{firstSegment.airline.name}</Text>
            </View>
            
            <View style={styles.routeDisplay}>
              <View style={styles.routePoint}>
                <Text style={styles.routeCode}>{firstSegment.origin.code}</Text>
                <Text style={styles.routeTime}>{formatTime(firstSegment.departureTime)}</Text>
              </View>
              
              <View style={styles.routeMiddle}>
                <Airplane size={24} color={colors.white} style={styles.planeIcon} />
                <Text style={styles.durationWhite}>{formatDuration(flight.totalDuration)}</Text>
                <Text style={styles.stopsWhite}>
                  {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
                </Text>
              </View>
              
              <View style={[styles.routePoint, styles.routePointRight]}>
                <Text style={styles.routeCode}>{lastSegment.destination.code}</Text>
                <Text style={styles.routeTime}>{formatTime(lastSegment.arrivalTime)}</Text>
              </View>
            </View>
            
            <View style={styles.summaryFooter}>
              <View style={styles.summaryDate}>
                <Calendar size={16} color={colors.white} />
                <Text style={styles.dateTextWhite}>
                  {formatDate(firstSegment.departureTime)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Flight Segments */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.segmentsCard}
        >
          <Text style={styles.sectionTitle}>Flight Itinerary</Text>
          
          {flight.segments.map((segment, index) => (
            <View key={segment.id}>
              {/* Layover indicator */}
              {index > 0 && flight.layovers[index - 1] && (
                <View style={styles.layoverIndicator}>
                  <View style={styles.layoverLine} />
                  <View style={styles.layoverBadge}>
                    <Clock size={14} color={colors.warning} />
                    <Text style={styles.layoverText}>
                      {formatDuration(flight.layovers[index - 1].duration)} layover in {flight.layovers[index - 1].airport.code}
                    </Text>
                  </View>
                  <View style={styles.layoverLine} />
                </View>
              )}
              
              {/* Segment */}
              <View style={styles.segment}>
                <View style={styles.segmentTimeline}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineDot} />
                </View>
                
                <View style={styles.segmentContent}>
                  {/* Departure */}
                  <View style={styles.segmentPoint}>
                    <View style={styles.segmentTimeBlock}>
                      <Text style={styles.segmentTime}>
                        {formatTime(segment.departureTime)}
                      </Text>
                    </View>
                    <View style={styles.segmentDetails}>
                      <Text style={styles.segmentAirport}>
                        {segment.origin.city} ({segment.origin.code})
                      </Text>
                      <Text style={styles.segmentAirportName}>
                        {segment.origin.name}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Flight Info */}
                  <View style={styles.segmentFlightInfo}>
                    <View style={styles.flightInfoRow}>
                      <Airplane size={16} color={colors.primary} />
                      <Text style={styles.flightInfoText}>
                        {segment.flightNumber} • {segment.aircraft}
                      </Text>
                    </View>
                    <View style={styles.flightInfoRow}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={styles.flightInfoText}>
                        {formatDuration(segment.duration)} flight time
                      </Text>
                    </View>
                  </View>
                  
                  {/* Arrival */}
                  <View style={styles.segmentPoint}>
                    <View style={styles.segmentTimeBlock}>
                      <Text style={styles.segmentTime}>
                        {formatTime(segment.arrivalTime)}
                      </Text>
                    </View>
                    <View style={styles.segmentDetails}>
                      <Text style={styles.segmentAirport}>
                        {segment.destination.city} ({segment.destination.code})
                      </Text>
                      <Text style={styles.segmentAirportName}>
                        {segment.destination.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
        
        {/* Included Features */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.featuresCard}
        >
          <Text style={styles.sectionTitle}>What's Included</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
                <Briefcase size={20} color={colors.success} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Carry-on Bag</Text>
                <Text style={styles.featureDescription}>
                  1 personal item + 1 carry-on ({flight.baggageIncluded.cabin.dimensions})
                </Text>
              </View>
              <TickCircle size={20} color={colors.success} variant="Bold" />
            </View>
            
            <View style={styles.featureItem}>
              <View style={[
                styles.featureIcon, 
                { backgroundColor: flight.baggageIncluded.checked.included ? colors.success + '15' : colors.gray100 }
              ]}>
                <Briefcase 
                  size={20} 
                  color={flight.baggageIncluded.checked.included ? colors.success : colors.gray400} 
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Checked Bag</Text>
                <Text style={styles.featureDescription}>
                  {flight.baggageIncluded.checked.included 
                    ? `1 bag up to ${flight.baggageIncluded.checked.weight}kg`
                    : 'Not included - can be added'}
                </Text>
              </View>
              {flight.baggageIncluded.checked.included ? (
                <TickCircle size={20} color={colors.success} variant="Bold" />
              ) : (
                <Text style={styles.addText}>Add</Text>
              )}
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.info + '15' }]}>
                <Coffee size={20} color={colors.info} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>In-flight Service</Text>
                <Text style={styles.featureDescription}>
                  Complimentary snacks and beverages
                </Text>
              </View>
              <TickCircle size={20} color={colors.success} variant="Bold" />
            </View>
          </View>
        </Animated.View>
        
        {/* Fare Rules */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.rulesCard}
        >
          <Text style={styles.sectionTitle}>Fare Rules</Text>
          
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Cancellation</Text>
              <Text style={[
                styles.ruleValue,
                flight.refundable ? styles.ruleValueGreen : styles.ruleValueRed,
              ]}>
                {flight.refundable ? 'Refundable' : 'Non-refundable'}
              </Text>
            </View>
            
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Changes</Text>
              <Text style={styles.ruleValue}>
                {flight.changeable ? `Allowed ($${flight.changeFee} fee)` : 'Not allowed'}
              </Text>
            </View>
            
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Fare Class</Text>
              <Text style={styles.ruleValue}>{flight.fareClass}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total Price</Text>
          <Text style={styles.footerPriceAmount}>
            ${flight.price.amount * (searchParams.passengers.adults + searchParams.passengers.children)}
          </Text>
          <Text style={styles.footerPriceNote}>
            for {searchParams.passengers.adults + searchParams.passengers.children} passenger(s)
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  
  // Summary Card
  summaryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  summaryGradient: {
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  airlineBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  airlineCodeWhite: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  airlineNameWhite: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    marginLeft: spacing.sm,
    opacity: 0.9,
  },
  routeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  routePoint: {},
  routePointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  routeTime: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  routeMiddle: {
    alignItems: 'center',
  },
  planeIcon: {
    transform: [{ rotate: '45deg' }],
    marginBottom: spacing.xs,
  },
  durationWhite: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  stopsWhite: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.8,
  },
  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: spacing.md,
  },
  summaryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateTextWhite: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  
  // Segments Card
  segmentsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  segment: {
    flexDirection: 'row',
  },
  segmentTimeline: {
    width: 20,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray200,
    marginVertical: 4,
  },
  segmentContent: {
    flex: 1,
  },
  segmentPoint: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  segmentTimeBlock: {
    width: 70,
  },
  segmentTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  segmentDetails: {
    flex: 1,
  },
  segmentAirport: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  segmentAirportName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  segmentFlightInfo: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginLeft: 70,
    gap: spacing.sm,
  },
  flightInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flightInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Layover
  layoverIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  layoverLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.warning + '40',
  },
  layoverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    marginHorizontal: spacing.sm,
  },
  layoverText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },
  
  // Features Card
  featuresCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Rules Card
  rulesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  rulesList: {
    gap: spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  ruleLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  ruleValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  ruleValueGreen: {
    color: colors.success,
  },
  ruleValueRed: {
    color: colors.error,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  footerPriceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
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
