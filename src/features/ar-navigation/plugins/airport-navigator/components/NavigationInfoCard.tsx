/**
 * NAVIGATION INFO CARD
 * 
 * Transparent overlay card with navigation details and controls.
 * Similar to screenshot 2 - clean, minimal, essential info only.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Location, Clock, Eye, EyeSlash } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/styles';

interface NavigationInfoCardProps {
  destination: string;
  distance: string;
  estimatedTime: string;
  currentFloor?: string;
  onToggleSidePanel: () => void;
  sidePanelVisible: boolean;
  currentStep?: number;
  totalSteps?: number;
  milestones?: Array<{ label: string; completed: boolean }>;
}

export default function NavigationInfoCard({
  destination,
  distance,
  estimatedTime,
  currentFloor,
  onToggleSidePanel,
  sidePanelVisible,
  currentStep = 0,
  totalSteps = 4,
  milestones = [
    { label: 'Check-in', completed: true },
    { label: 'Security', completed: false },
    { label: 'To Gate', completed: false },
    { label: 'Departure', completed: false },
  ],
}: NavigationInfoCardProps) {
  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSidePanel();
  };

  return (
    <View style={styles.container}>
      {/* Destination Info */}
      <View style={styles.infoRow}>
        <Location size={24} color={colors.white} variant="Bold" />
        <View style={styles.infoText}>
          <Text style={styles.value}>{destination}</Text>
          <Text style={styles.label}>Destination</Text>
        </View>
      </View>

      {/* Timeline Progress Dots */}
      <View style={styles.timelineContainer}>
        {milestones.map((milestone, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              milestone.completed && styles.timelineDotCompleted,
              index === currentStep && styles.timelineDotCurrent,
            ]} />
            {index < milestones.length - 1 && (
              <View style={[
                styles.timelineLine,
                milestone.completed && styles.timelineLineCompleted,
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Milestone Labels */}
      <View style={styles.milestoneLabels}>
        {milestones.map((milestone, index) => (
          <Text
            key={index}
            style={[
              styles.milestoneLabel,
              milestone.completed && styles.milestoneLabelCompleted,
            ]}
          >
            {milestone.label}
          </Text>
        ))}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{distance}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Text style={styles.statValue}>{estimatedTime}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>

        {currentFloor && (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{currentFloor}</Text>
              <Text style={styles.statLabel}>Floor</Text>
            </View>
          </>
        )}
      </View>

      {/* Toggle Side Panel Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        {sidePanelVisible ? (
          <EyeSlash size={20} color={colors.white} variant="Bold" />
        ) : (
          <Eye size={20} color={colors.white} variant="Bold" />
        )}
        <Text style={styles.toggleText}>
          {sidePanelVisible ? 'Hide' : 'Show'} Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent like path
    borderRadius: 28, // More rounded (was 20, now 28)
    padding: spacing.lg,
    backdropFilter: 'blur(10px)',
    zIndex: 10, // Above path (path is zIndex: 1)
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  value: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  timelineDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineDotCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.bgModal,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  timelineLineCompleted: {
    backgroundColor: colors.primary,
  },
  milestoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  milestoneLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    flex: 1,
    textAlign: 'center',
  },
  milestoneLabelCompleted: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: typography.fontWeight.medium,
  },
});
