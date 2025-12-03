/**
 * PRACTICAL INFO SECTION ORGANISM
 * 
 * Displays practical information for visiting
 * Hours, price, contact, best time to visit, etc.
 * Universal component used across all detail types
 */

import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Clock, DollarCircle, Call, Calendar, Location as LocationIcon } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import { iconColors } from '@/styles/iconColors';
import * as Haptics from 'expo-haptics';

interface PracticalInfoItem {
  icon: 'clock' | 'price' | 'phone' | 'calendar' | 'location';
  label: string;
  value: string;
  actionable?: boolean;
  action?: () => void;
}

interface PracticalInfoSectionProps {
  items: PracticalInfoItem[];
}

export default function PracticalInfoSection({ items }: PracticalInfoSectionProps) {
  const getIconConfig = (iconType: string) => {
    switch (iconType) {
      case 'clock':
        return { icon: Clock, color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'price':
        return { icon: DollarCircle, color: '#10B981', bgColor: '#ECFDF5' };
      case 'phone':
        return { icon: Call, color: '#8B5CF6', bgColor: '#F5F3FF' };
      case 'calendar':
        return { icon: Calendar, color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'location':
        return { icon: LocationIcon, color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { icon: Clock, color: '#3B82F6', bgColor: '#EFF6FF' };
    }
  };

  const handleItemPress = (item: PracticalInfoItem) => {
    if (item.actionable && item.action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      item.action();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Practical Information</Text>
        <Text style={styles.subtitle}>Essential details for planning your visit</Text>
      </View>
      
      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={() => handleItemPress(item)}
            disabled={!item.actionable}
            activeOpacity={item.actionable ? 0.7 : 1}
          >
            <View style={[styles.iconCircle, { backgroundColor: getIconConfig(item.icon).bgColor }]}>
              {(() => {
                const IconComponent = getIconConfig(item.icon).icon;
                return <IconComponent size={22} color={getIconConfig(item.icon).color} variant="Bold" />;
              })()}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[
                styles.value,
                item.actionable && styles.actionableValue
              ]}>
                {item.value}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  itemsContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  actionableValue: {
    color: colors.primary,
  },
});
