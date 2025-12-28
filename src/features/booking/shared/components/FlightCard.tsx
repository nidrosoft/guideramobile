/**
 * PREMIUM FLIGHT CARD COMPONENT
 * 
 * A visually stunning, premium flight card designed to disrupt the travel industry.
 * Features elegant gradients, refined typography, beautiful flight path visualization,
 * and premium visual polish.
 * 
 * Used in:
 * - FlightResultsScreen (standalone flight booking)
 * - PackageBuildScreen (package flow)
 * - FlightSelectionSheet (package flow full view)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Airplane, 
  TickCircle, 
  Wifi, 
  Coffee, 
  Briefcase,
  Crown,
  Star1,
  Clock,
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/styles';

// Flight display data interface
export interface FlightCardData {
  id: string;
  airlineName: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  destCode: string;
  departureTime: Date | string;
  arrivalTime: Date | string;
  duration: number; // in minutes
  stops: number;
  price: number;
  seatsAvailable?: number;
  facilities?: string[];
  cabinClass?: 'economy' | 'premium' | 'business' | 'first';
}

interface FlightCardProps {
  flight: FlightCardData;
  index?: number;
  isSelected?: boolean;
  isRecommended?: boolean;
  isBestDeal?: boolean;
  compact?: boolean;
  onPress: () => void;
  onViewDetails?: () => void;
}

// Airline brand colors for logo backgrounds
const AIRLINE_COLORS: Record<string, { primary: string; secondary: string }> = {
  'Delta': { primary: '#003366', secondary: '#C01933' },
  'American': { primary: '#0078D2', secondary: '#BF0D3E' },
  'United': { primary: '#002244', secondary: '#0033A0' },
  'Southwest': { primary: '#304CB2', secondary: '#FFBF27' },
  'JetBlue': { primary: '#003876', secondary: '#0033A0' },
  'Spirit': { primary: '#FFE600', secondary: '#000000' },
  'Alaska': { primary: '#01426A', secondary: '#00B5E2' },
  'default': { primary: colors.gradientStart, secondary: colors.gradientEnd },
};

// Facility configurations with icons
const FACILITY_CONFIG: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  'WiFi': { icon: Wifi, bg: '#EEF2FF', text: '#6366F1', label: 'WiFi' },
  'Meals': { icon: Coffee, bg: '#FEF3C7', text: '#D97706', label: 'Meals' },
  '23kg': { icon: Briefcase, bg: '#DCFCE7', text: '#16A34A', label: '23kg' },
  '30kg': { icon: Briefcase, bg: '#DCFCE7', text: '#16A34A', label: '30kg' },
  'Lounge': { icon: Crown, bg: '#FCE7F3', text: '#DB2777', label: 'Lounge' },
  'Priority': { icon: Star1, bg: '#FEF3C7', text: '#D97706', label: 'Priority' },
};

const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const getAirlineColors = (airlineName: string) => {
  const key = Object.keys(AIRLINE_COLORS).find(k => 
    airlineName.toLowerCase().includes(k.toLowerCase())
  );
  return AIRLINE_COLORS[key || 'default'];
};

const getAirlineInitials = (airlineName: string): string => {
  const words = airlineName.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return airlineName.substring(0, 2).toUpperCase();
};

export default function FlightCard({
  flight,
  index = 0,
  isSelected = false,
  isRecommended = false,
  isBestDeal = false,
  compact = false,
  onPress,
  onViewDetails,
}: FlightCardProps) {
  const facilities = flight.facilities || ['WiFi', 'Meals', '23kg'];
  const airlineColors = getAirlineColors(flight.airlineName);
  const airlineInitials = getAirlineInitials(flight.airlineName);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 100)}>
      <TouchableOpacity
        style={[
          styles.card,
          compact && styles.cardCompact,
          isSelected && styles.cardSelected,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Premium Badge with Gradient */}
        {(isRecommended || isBestDeal) && !compact && (
          <LinearGradient
            colors={isRecommended ? ['#10B981', '#059669'] : [colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Star1 size={12} color={colors.white} variant="Bold" />
            <Text style={styles.badgeText}>
              {isRecommended ? 'Recommended' : 'Best Deal'}
            </Text>
          </LinearGradient>
        )}

        {/* Header: Airline Info + Price */}
        <View style={styles.header}>
          {/* Airline Logo with Gradient */}
          <View style={styles.airlineSection}>
            <LinearGradient
              colors={[airlineColors.primary, airlineColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.airlineLogo, compact && styles.airlineLogoCompact]}
            >
              <Text style={[styles.airlineInitials, compact && styles.airlineInitialsCompact]}>
                {airlineInitials}
              </Text>
            </LinearGradient>
            <View style={styles.airlineInfo}>
              <Text style={[styles.airlineName, compact && styles.airlineNameCompact]} numberOfLines={1}>
                {flight.airlineName}
              </Text>
              <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
            </View>
          </View>

          {/* Price Block */}
          <View style={styles.priceSection}>
            <Text style={[styles.price, compact && styles.priceCompact, isSelected && styles.priceSelected]}>
              ${flight.price}
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

        {/* Flight Route Visualization */}
        <View style={[styles.routeContainer, compact && styles.routeContainerCompact]}>
          {/* Departure */}
          <View style={styles.routeEndpoint}>
            <Text style={[styles.routeTime, compact && styles.routeTimeCompact]}>
              {formatTime(flight.departureTime)}
            </Text>
            <View style={styles.routeCodeContainer}>
              <Text style={[styles.routeCode, compact && styles.routeCodeCompact]}>
                {flight.originCode}
              </Text>
            </View>
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
                {[...Array(compact ? 6 : 10)].map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              
              {/* Airplane Icon */}
              <View style={styles.planeIconContainer}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.planeIconBg}
                >
                  <Airplane 
                    size={compact ? 12 : 14} 
                    color={colors.white} 
                    variant="Bold"
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </LinearGradient>
              </View>
              
              {/* Dashed Line */}
              <View style={styles.dashedLine}>
                {[...Array(compact ? 6 : 10)].map((_, i) => (
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
                <Text style={styles.durationText}>{formatDuration(flight.duration)}</Text>
              </View>
              <View style={[
                styles.stopsBadge,
                flight.stops === 0 && styles.directBadge
              ]}>
                <Text style={[
                  styles.stopsText,
                  flight.stops === 0 && styles.directText
                ]}>
                  {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrival */}
          <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
            <Text style={[styles.routeTime, compact && styles.routeTimeCompact]}>
              {formatTime(flight.arrivalTime)}
            </Text>
            <View style={styles.routeCodeContainer}>
              <Text style={[styles.routeCode, compact && styles.routeCodeCompact]}>
                {flight.destCode}
              </Text>
            </View>
          </View>
        </View>

        {/* Facilities Row - Only in full mode */}
        {!compact && (
          <View style={styles.facilitiesRow}>
            {facilities.slice(0, 4).map((facility, i) => {
              const config = FACILITY_CONFIG[facility] || {
                icon: Star1,
                bg: colors.gray50,
                text: colors.textSecondary,
                label: facility,
              };
              const IconComponent = config.icon;
              return (
                <View key={i} style={[styles.facilityChip, { backgroundColor: config.bg }]}>
                  <IconComponent size={12} color={config.text} variant="Bold" />
                  <Text style={[styles.facilityLabel, { color: config.text }]}>
                    {config.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.selectionBadge}
            >
              <TickCircle size={14} color={colors.white} variant="Bold" />
              <Text style={styles.selectionText}>Selected</Text>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Card Container - Premium with depth
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg, // Use design system: 24px
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200, // Use design system border color
    // Premium shadow with depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardCompact: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    // Keep 24px borderRadius even in compact mode for consistency
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: `${colors.primary}03`,
    // Enhanced shadow when selected
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
  },

  // Premium Badge with Gradient
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: spacing.md,
    gap: 4,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },

  // Header Section
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  airlineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  airlineLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  airlineLogoCompact: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  airlineInitials: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  airlineInitialsCompact: {
    fontSize: typography.fontSize.sm,
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  airlineNameCompact: {
    fontSize: typography.fontSize.sm,
  },
  flightNumber: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  priceCompact: {
    fontSize: typography.fontSize.lg,
  },
  priceSelected: {
    color: colors.primary,
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
  routeContainerCompact: {
    paddingVertical: spacing.xs,
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
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  routeTimeCompact: {
    fontSize: typography.fontSize.lg,
  },
  routeCodeContainer: {
    marginTop: 4,
  },
  routeCode: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  routeCodeCompact: {
    fontSize: typography.fontSize.xs,
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
  planeIconContainer: {
    marginHorizontal: 4,
  },
  planeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: typography.fontWeight.medium,
  },
  stopsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  directBadge: {
    backgroundColor: `${colors.success}15`,
  },
  stopsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  directText: {
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },

  // Facilities Row
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: spacing.sm,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  facilityLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // Selection Indicator
  selectionIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  selectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  selectionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
