/**
 * EmptyState Component
 *
 * Reusable empty state for lists and screens.
 * Provides consistent empty state UI across the app.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  DocumentText,
  Airplane,
  Building,
  Car,
  Calendar,
  SearchNormal,
  Notification,
  Heart
} from 'iconsax-react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

type EmptyStateType =
  | 'trips'
  | 'bookings'
  | 'search'
  | 'notifications'
  | 'favorites'
  | 'flights'
  | 'hotels'
  | 'cars'
  | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, {
  icon: (color: string) => React.ReactNode;
  title: string;
  description: string;
}> = {
  trips: {
    icon: (c) => <Calendar size={64} color={c} variant="Bulk" />,
    title: 'No trips yet',
    description: 'Start planning your next adventure!',
  },
  bookings: {
    icon: (c) => <DocumentText size={64} color={c} variant="Bulk" />,
    title: 'No bookings yet',
    description: 'Your booking history will appear here.',
  },
  search: {
    icon: (c) => <SearchNormal size={64} color={c} variant="Bulk" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  notifications: {
    icon: (c) => <Notification size={64} color={c} variant="Bulk" />,
    title: 'No notifications',
    description: 'You\'re all caught up!',
  },
  favorites: {
    icon: (c) => <Heart size={64} color={c} variant="Bulk" />,
    title: 'No favorites yet',
    description: 'Save places you love to find them easily.',
  },
  flights: {
    icon: (c) => <Airplane size={64} color={c} variant="Bulk" />,
    title: 'No flights found',
    description: 'Try different dates or destinations.',
  },
  hotels: {
    icon: (c) => <Building size={64} color={c} variant="Bulk" />,
    title: 'No hotels found',
    description: 'Try different dates or locations.',
  },
  cars: {
    icon: (c) => <Car size={64} color={c} variant="Bulk" />,
    title: 'No cars available',
    description: 'Try different dates or pickup locations.',
  },
  generic: {
    icon: (c) => <DocumentText size={64} color={c} variant="Bulk" />,
    title: 'Nothing here yet',
    description: 'Check back later.',
  },
};

export function EmptyState({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const config = EMPTY_STATE_CONFIG[type];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || config.icon(colors.gray300)}
      </View>

      <Text style={[styles.title, { color: colors.gray700 }]}>{title || config.title}</Text>
      <Text style={[styles.description, { color: colors.gray500 }]}>{description || config.description}</Text>

      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Text style={[styles.actionButtonText, { color: colors.white }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  iconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.8,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default EmptyState;
