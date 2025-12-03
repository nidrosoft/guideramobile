/**
 * NAVIGATION CARD
 * 
 * Bottom card showing destination info, progress, and stats.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Routing, Location } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { NavigationRoute } from '../types/navigation.types';

interface NavigationCardProps {
  route: NavigationRoute;
  onExit: () => void;
}

export default function NavigationCard({ route, onExit }: NavigationCardProps) {
  const getDestinationIcon = () => {
    switch (route.destinationType) {
      case 'gate':
        return '✈️';
      case 'baggage':
        return '🧳';
      case 'restroom':
        return '🚻';
      case 'food':
        return '🍔';
      case 'exit':
        return '🚪';
      case 'security':
        return '🔒';
      default:
        return '📍';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.destinationInfo}>
          <Text style={styles.icon}>{getDestinationIcon()}</Text>
          <View style={styles.destinationText}>
            <Text style={styles.destinationName}>{route.destination}</Text>
            <Text style={styles.destinationType}>
              {route.destinationType.charAt(0).toUpperCase() + route.destinationType.slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Location size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.statValue}>{route.totalDistance}m</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Clock size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.statValue}>{route.estimatedTime} min</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Routing size={20} color={colors.primary} variant="Bold" />
          <Text style={styles.statValue}>
            {route.currentStep} of {route.totalSteps}
          </Text>
          <Text style={styles.statLabel}>Steps</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(route.currentStep / route.totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {route.currentStep}: {route.steps[route.currentStep - 1]?.instruction}
        </Text>
      </View>

      {/* Arrival Time (if available) */}
      {route.arrivalTime && (
        <View style={styles.arrivalInfo}>
          <Text style={styles.arrivalLabel}>Estimated Arrival</Text>
          <Text style={styles.arrivalTime}>{route.arrivalTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  destinationText: {
    flex: 1,
  },
  destinationName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  destinationType: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  exitButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  exitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray300,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  arrivalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  arrivalLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
  },
  arrivalTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});
