import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft2, Edit2 } from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { typography, spacing, borderRadius } from '@/styles';
import * as Haptics from 'expo-haptics';

export default function EditTrip() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
      >
        <ArrowLeft2 size={24} color={tc.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${tc.primary}15` }]}>
          <Edit2 size={40} color={tc.primary} variant="Bold" />
        </View>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Edit Trip</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Trip editing is coming soon. You'll be able to update destinations, dates, and details right here.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tc.primary }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.back(); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: tc.white }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  button: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
