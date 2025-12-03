import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { Calendar } from 'iconsax-react-native';

interface DealViewCardProps {
  title: string;
  subtitle: string;
  description: string;
  amount: string;
  expiryDate: string;
  imageUrl: string;
  backgroundColor: string;
  onPress: () => void;
}

export default function DealViewCard({
  title,
  subtitle,
  description,
  amount,
  expiryDate,
  imageUrl,
  backgroundColor,
  onPress,
}: DealViewCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.colorContainer, { backgroundColor }]}>
        <View style={styles.textContent}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </View>
        {/* Decorative elements */}
        <View style={[styles.dot, styles.dotTopLeft]} />
        <View style={[styles.dot, styles.dotTopRight]} />
        <View style={[styles.dot, styles.dotBottomLeft]} />
        <View style={[styles.dot, styles.dotBottomRight]} />
        <View style={[styles.wave, styles.waveTop]} />
        <View style={[styles.wave, styles.waveBottom]} />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.textSecondary} variant="Outline" />
            <Text style={styles.expiryText}>Until {expiryDate}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Deal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 22,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  colorContainer: {
    borderRadius: 20,
    padding: spacing.sm,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  textContent: {
    zIndex: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotTopLeft: {
    top: 20,
    left: 20,
  },
  dotTopRight: {
    top: 60,
    right: 100,
  },
  dotBottomLeft: {
    bottom: 60,
    left: 40,
  },
  dotBottomRight: {
    bottom: 20,
    right: 40,
  },
  wave: {
    position: 'absolute',
    width: 60,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  waveTop: {
    top: 30,
    right: 40,
    transform: [{ rotate: '15deg' }],
  },
  waveBottom: {
    bottom: 40,
    left: 60,
    transform: [{ rotate: '-10deg' }],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiryText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
