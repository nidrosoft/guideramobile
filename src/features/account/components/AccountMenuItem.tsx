/**
 * ACCOUNT MENU ITEM
 * 
 * Reusable menu item component for account sections.
 * Supports icons, badges, chevrons, and destructive styling.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight2, Star1 } from 'iconsax-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { AccountMenuItem as MenuItemType } from '../types/account.types';

interface AccountMenuItemProps {
  item: MenuItemType;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function AccountMenuItem({ item, isFirst, isLast }: AccountMenuItemProps) {
  const router = useRouter();
  const Icon = item.icon;
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (item.disabled) return;
    
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFirst && styles.firstItem,
        isLast && styles.lastItem,
        item.disabled && styles.disabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={item.disabled}
    >
      {/* Icon */}
      <View style={[
        styles.iconContainer,
        item.destructive && styles.destructiveIcon,
        item.iconColor === colors.error && !item.destructive && styles.specialIcon,
        item.iconColor === colors.warning && styles.premiumIcon,
      ]}>
        <Icon
          size={22}
          color={item.iconColor || colors.gray900}
          variant={item.iconVariant || 'Bold'}
        />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.title,
            item.destructive && styles.destructiveText,
          ]}>
            {item.title}
          </Text>
          {item.premium && (
            <View style={styles.premiumBadge}>
              <Star1 size={10} color={colors.warning} variant="Bold" />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        {item.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      
      {/* Right side */}
      <View style={styles.rightContainer}>
        {item.badge !== undefined && (
          <View style={[
            styles.badge,
            { backgroundColor: item.badgeColor || colors.primary },
          ]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.showChevron && (
          <ArrowRight2 size={18} color={colors.gray400} variant="Linear" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  firstItem: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  lastItem: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIcon: {
    backgroundColor: colors.error + '10',
  },
  specialIcon: {
    backgroundColor: colors.error + '10',
  },
  premiumIcon: {
    backgroundColor: colors.warning + '10',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  destructiveText: {
    color: colors.error,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: colors.warning,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
