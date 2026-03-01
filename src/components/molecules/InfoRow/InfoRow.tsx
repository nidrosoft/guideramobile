/**
 * INFO ROW MOLECULE
 * 
 * Displays an icon with label and value
 * Used for location, rating, hours, etc.
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/styles';

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
