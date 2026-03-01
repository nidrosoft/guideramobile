/**
 * QUICK ACTION CARD
 * 
 * Small action cards for quick access to features.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown } from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';

interface QuickActionCardProps {
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  isPremium?: boolean;
  badge?: number;
}

export default function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  color,
  onPress,
  isPremium,
  badge,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={22} color={color} variant="Bold" />
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={10} color={colors.warning} variant="Bold" />
          </View>
        )}
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bgElevated,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
