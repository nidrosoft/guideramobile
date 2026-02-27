/**
 * FLIGHT SUMMARY CARD - PREMIUM VERSION
 * 
 * Premium checkout flight card matching the FlightCard design.
 * Features elegant gradients, refined typography, and beautiful flight path visualization.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Airplane, ArrowDown2, TickCircle, CloseCircle, Clock } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { NormalizedFlightInfo } from '../../types/checkout.types';
import { FareRules } from '@/services/flight-offer-price.service';

interface FlightSummaryCardProps {
  flightInfo: NormalizedFlightInfo;
  fareRules?: FareRules;
  onViewDetails: () => void;
}

export default function FlightSummaryCard({
  flightInfo,
  fareRules,
  onViewDetails,
}: FlightSummaryCardProps) {
  const [logoError, setLogoError] = useState(false);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getAirlineLogoUrl = (code: string) => {
    return `https://images.kiwi.com/airlines/64/${code}.png`;
  };

  const getAirlineInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Determine refundable/changeable from fareRules or flightInfo
  const isRefundable = fareRules?.refundable ?? flightInfo.refundable ?? false;
  const isChangeable = fareRules?.changeable ?? flightInfo.changeable ?? false;

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <TouchableOpacity
        style={styles.container}
        onPress={onViewDetails}
        activeOpacity={0.9}
      >
        {/* Header: Airline + Price */}
        <View style={styles.header}>
          <View style={styles.airlineInfo}>
            {!logoError ? (
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: getAirlineLogoUrl(flightInfo.airlineCode) }}
                  style={styles.logo}
                  resizeMode="contain"
                  onError={() => setLogoError(true)}
                />
              </View>
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoContainer}
              >
                <Text style={styles.airlineInitials}>
                  {getAirlineInitials(flightInfo.airlineName)}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.airlineDetails}>
              <Text style={styles.airlineName} numberOfLines={1}>
                {flightInfo.airlineName || 'Airline'}
              </Text>
              <Text style={styles.flightNumber}>
                {flightInfo.flightNumber || flightInfo.airlineCode}
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${typeof flightInfo.price === 'number' ? flightInfo.price.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.priceLabel}>per person</Text>
          </View>
        </View>

        {/* Elegant Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Route Visualization */}
        <View style={styles.routeContainer}>
          {/* Departure */}
          <View style={styles.routeEndpoint}>
            <Text style={styles.routeTime}>{formatTime(flightInfo.departureTime)}</Text>
            <Text style={styles.routeCode}>{flightInfo.originCode || '---'}</Text>
          </View>

          {/* Flight Path */}
          <View style={styles.flightPath}>
            <View style={styles.flightPathLine}>
              {/* Origin Dot */}
              <View style={styles.pathDotOuter}>
                <View style={styles.pathDotInner} />
              </View>
              
              {/* Dashed Line */}
              <View style={styles.dashedLine}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              
              {/* Airplane Icon */}
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.planeIconBg}
              >
                <Airplane 
                  size={14} 
                  color={colors.white} 
                  variant="Bold"
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </LinearGradient>
              
              {/* Dashed Line */}
              <View style={styles.dashedLine}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              
              {/* Destination Dot */}
              <View style={styles.pathDotOuter}>
                <View style={[styles.pathDotInner, { backgroundColor: colors.success }]} />
              </View>
            </View>
            
            {/* Duration & Stops */}
            <View style={styles.flightMeta}>
              <View style={styles.durationBadge}>
                <Clock size={10} color={colors.textSecondary} />
                <Text style={styles.durationText}>{formatDuration(flightInfo.duration)}</Text>
              </View>
              <View style={[
                styles.stopsBadge,
                flightInfo.stops === 0 ? styles.directBadge : styles.stopsBadgeBlue
              ]}>
                <Text style={[
                  styles.stopsText,
                  flightInfo.stops === 0 ? styles.directText : styles.stopsTextBlue
                ]}>
                  {flightInfo.stops === 0 ? 'Direct' : `${flightInfo.stops} stop${flightInfo.stops > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrival */}
          <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
            <Text style={styles.routeTime}>{formatTime(flightInfo.arrivalTime)}</Text>
            <Text style={styles.routeCode}>{flightInfo.destCode || '---'}</Text>
          </View>
        </View>

        {/* Fare Rules Badges */}
        <View style={styles.badges}>
          <View style={[styles.badge, isRefundable ? styles.badgeSuccess : styles.badgeWarning]}>
            {isRefundable ? (
              <TickCircle size={12} color={colors.success} variant="Bold" />
            ) : (
              <CloseCircle size={12} color={colors.warning} variant="Bold" />
            )}
            <Text style={[styles.badgeText, isRefundable ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {isRefundable ? 'Refundable' : 'Non-refundable'}
            </Text>
          </View>
          
          <View style={[styles.badge, isChangeable ? styles.badgeSuccess : styles.badgeWarning]}>
            {isChangeable ? (
              <TickCircle size={12} color={colors.success} variant="Bold" />
            ) : (
              <CloseCircle size={12} color={colors.warning} variant="Bold" />
            )}
            <Text style={[styles.badgeText, isChangeable ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
              {isChangeable ? 'Changeable' : 'No changes'}
            </Text>
          </View>
        </View>

        {/* Dotted Divider */}
        <View style={styles.dottedDivider}>
          {[...Array(40)].map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>

        {/* View Details - Stacked with arrow pointing down */}
        <View style={styles.footer}>
          <Text style={styles.viewDetails}>View flight details</Text>
          <ArrowDown2 size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Card Container - Premium with depth
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg + 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  airlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
  },
  airlineInitials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.white,
    letterSpacing: 0.5,
  },
  airlineDetails: {
    flex: 1,
  },
  airlineName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  flightNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Elegant Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray100,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },

  // Route Container
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  routeEndpoint: {
    alignItems: 'center',
    minWidth: 50,
  },
  routeEndpointRight: {
    alignItems: 'center',
  },
  routeTime: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  routeCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 4,
  },

  // Flight Path Visualization
  flightPath: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  flightPathLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pathDotOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  dashedLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dash: {
    width: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.gray300,
  },
  planeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  // Flight Meta (Duration & Stops)
  flightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  stopsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  stopsBadgeBlue: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  directBadge: {
    backgroundColor: `${colors.success}15`,
  },
  stopsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  stopsTextBlue: {
    color: '#2563EB',
    fontWeight: typography.fontWeight.semibold as any,
  },
  directText: {
    color: colors.success,
    fontWeight: typography.fontWeight.semibold as any,
  },

  // Fare Rules Badges - Fully rounded like stops badge
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
  },
  badgeSuccess: {
    backgroundColor: `${colors.success}15`,
  },
  badgeWarning: {
    backgroundColor: `${colors.warning}15`,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  badgeTextSuccess: {
    color: colors.success,
  },
  badgeTextWarning: {
    color: colors.warning,
  },

  // Dotted Divider
  dottedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 4,
    height: 1,
    backgroundColor: colors.gray300,
    borderRadius: 1,
  },

  // Footer - Stacked vertically with arrow pointing down
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  viewDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium as any,
  },
});
