/**
 * ACTION BUTTON ORGANISM
 * 
 * Primary call-to-action button for detail pages
 * Adapts label and action based on detail type
 * Universal component used across all detail types
 */

import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Routing, TicketStar, Call, Calendar } from 'iconsax-react-native';
import { colors, typography, spacing } from '@/styles';
import * as Haptics from 'expo-haptics';

interface ActionButtonProps {
  type: 'destination' | 'restaurant' | 'event' | 'activity' | 'accommodation';
  onPress: () => void;
  disabled?: boolean;
}

export default function ActionButton({ 
  type, 
  onPress,
  disabled = false 
}: ActionButtonProps) {
  
  const getButtonConfig = () => {
    switch (type) {
      case 'destination':
        return {
          label: 'Make Plans',
          icon: <Calendar size={24} color={colors.white} variant="Bold" />,
          gradient: ['#6366F1', '#8B5CF6'] as const,
        };
      case 'restaurant':
        return {
          label: 'Reserve Table',
          icon: <Call size={24} color={colors.white} variant="Bold" />,
          gradient: ['#F59E0B', '#EF4444'] as const,
        };
      case 'event':
        return {
          label: 'Buy Tickets',
          icon: <TicketStar size={24} color={colors.white} variant="Bold" />,
          gradient: ['#EC4899', '#8B5CF6'] as const,
        };
      case 'activity':
        return {
          label: 'Book Now',
          icon: <Calendar size={24} color={colors.white} variant="Bold" />,
          gradient: ['#10B981', '#06B6D4'] as const,
        };
      case 'accommodation':
        return {
          label: 'Check Availability',
          icon: <Calendar size={24} color={colors.white} variant="Bold" />,
          gradient: ['#3B82F6', '#8B5CF6'] as const,
        };
      default:
        return {
          label: 'Learn More',
          icon: <Routing size={24} color={colors.white} variant="Bold" />,
          gradient: ['#6366F1', '#8B5CF6'] as const,
        };
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const config = getButtonConfig();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.button}
      >
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {config.icon}
            <Text style={styles.label}>{config.label}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
