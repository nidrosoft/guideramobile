/**
 * PRACTICAL INFO SECTION ORGANISM
 * 
 * Displays practical information for visiting
 * Hours, price, contact, best time to visit, etc.
 * Universal component used across all detail types
 */

import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Clock, DollarCircle, Call, Calendar, Location as LocationIcon, Money, Global, InfoCircle } from 'iconsax-react-native';
import { typography, spacing } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { iconColors } from '@/styles/iconColors';
import * as Haptics from 'expo-haptics';

interface PracticalInfoItem {
  icon: 'clock' | 'price' | 'phone' | 'calendar' | 'location' | 'currency' | 'language' | 'info';
  label: string;
  value: string;
  actionable?: boolean;
  action?: () => void;
}

interface PracticalInfoSectionProps {
  items: PracticalInfoItem[];
}

export default function PracticalInfoSection({ items }: PracticalInfoSectionProps) {
  const { colors } = useTheme();
  const getIconConfig = (iconType: string, label?: string) => {
    // Label-aware overrides: handles AI-generated 'info' icons with specific labels
    const lowerLabel = (label || '').toLowerCase();
    if (lowerLabel.includes('currency') || lowerLabel.includes('money')) {
      return { icon: Money, color: '#059669', bgColor: '#D1FAE5' };
    }
    if (lowerLabel.includes('language') || lowerLabel.includes('speak')) {
      return { icon: Global, color: '#0EA5E9', bgColor: '#E0F2FE' };
    }
    if (lowerLabel.includes('emergency') || lowerLabel.includes('urgent')) {
      return { icon: Call, color: '#EF4444', bgColor: '#FEE2E2' };
    }

    switch (iconType) {
      case 'clock':
        return { icon: Clock, color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'price':
        return { icon: DollarCircle, color: '#10B981', bgColor: '#ECFDF5' };
      case 'phone':
        return { icon: Call, color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'calendar':
        return { icon: Calendar, color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'location':
        return { icon: LocationIcon, color: '#EF4444', bgColor: '#FEE2E2' };
      case 'currency':
        return { icon: Money, color: '#059669', bgColor: '#D1FAE5' };
      case 'language':
        return { icon: Global, color: '#0EA5E9', bgColor: '#E0F2FE' };
      case 'info':
        return { icon: InfoCircle, color: '#6366F1', bgColor: '#EEF2FF' };
      default:
        return { icon: Clock, color: '#3B82F6', bgColor: '#DBEAFE' };
    }
  };

  const handleItemPress = (item: PracticalInfoItem) => {
    if (item.actionable && item.action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      item.action();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Practical Information</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Essential details for planning your visit</Text>
      </View>
      
      <View style={[styles.itemsContainer, { backgroundColor: colors.bgElevated, borderColor: colors.borderMedium }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={() => handleItemPress(item)}
            disabled={!item.actionable}
            activeOpacity={item.actionable ? 0.7 : 1}
          >
            <View style={[styles.iconCircle, { backgroundColor: getIconConfig(item.icon, item.label).bgColor }]}>
              {(() => {
                const cfg = getIconConfig(item.icon, item.label);
                return <cfg.icon size={22} color={cfg.color} variant="Bold" />;
              })()}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[
                styles.value,
                { color: colors.textPrimary },
                item.actionable && { color: colors.primary }
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  itemsContainer: {
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
