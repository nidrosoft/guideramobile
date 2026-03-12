import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Airplane, Building, Coffee, Car, Location, ShoppingCart } from 'iconsax-react-native';
import { colors, spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { Activity, ActivityType } from '../types/planner.types';

interface ActivityCardProps {
  activity: Activity;
  onAddPress?: () => void;
  showAddButton?: boolean;
}

const ACTIVITY_ICONS = {
  [ActivityType.FLIGHT]: Airplane,
  [ActivityType.HOTEL]: Building,
  [ActivityType.RESTAURANT]: Location,
  [ActivityType.ATTRACTION]: Location,
  [ActivityType.ACTIVITY]: Location,
  [ActivityType.TRANSPORT]: Car,
  [ActivityType.COFFEE]: Coffee,
  [ActivityType.SHOPPING]: ShoppingCart,
  [ActivityType.CUSTOM]: Location,
};

const ACTIVITY_COLORS = {
  [ActivityType.FLIGHT]: colors.purple,
  [ActivityType.HOTEL]: colors.success,
  [ActivityType.RESTAURANT]: colors.warning,
  [ActivityType.ATTRACTION]: colors.pink,
  [ActivityType.ACTIVITY]: colors.purple,
  [ActivityType.TRANSPORT]: colors.gray500,
  [ActivityType.COFFEE]: colors.orange,
  [ActivityType.SHOPPING]: colors.error,
  [ActivityType.CUSTOM]: colors.primary,
};

export default function ActivityCard({ activity, onAddPress, showAddButton }: ActivityCardProps) {
  const Icon = ACTIVITY_ICONS[activity.type];
  const iconColor = activity.color || ACTIVITY_COLORS[activity.type];

  return (
    <View style={styles.container}>
      {/* Time */}
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{activity.time}</Text>
        {activity.duration && (
          <Text style={styles.duration}>{activity.duration}</Text>
        )}
      </View>

      {/* Timeline Dot and Line */}
      <View style={styles.timelineContainer}>
        <View style={[styles.dot, { backgroundColor: iconColor }]}>
          <Icon size={16} color={colors.white} variant="Bold" />
        </View>
        <View style={styles.line} />
      </View>

      {/* Activity Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{activity.title}</Text>
          </View>
          
          {activity.subtitle && (
            <Text style={styles.subtitle}>{activity.subtitle}</Text>
          )}
          
          {activity.location && (
            <View style={styles.locationContainer}>
              <Location size={14} color={colors.gray500} variant="Bold" />
              <Text style={styles.location}>{activity.location}</Text>
            </View>
          )}
        </View>

        {/* Add Activity Button */}
        {showAddButton && onAddPress && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timeContainer: {
    width: 70,
    paddingTop: 4,
  },
  time: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray900,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  timelineContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray200,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.gray900,
    flex: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  location: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginLeft: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    alignSelf: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
});
