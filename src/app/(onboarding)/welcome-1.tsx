import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';

const { width, height } = Dimensions.get('window');

export default function Welcome1() {
  const router = useRouter();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/welcome-2' as any);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/landing' as any);
  };

  const handleDevShortcut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Skip Button - Top Right */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Onboarding Image - Takes most of the screen */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/images/welcome.png')}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Content with Blur Effect */}
      <BlurView intensity={80} tint="light" style={styles.bottomContainer}>
        <View style={styles.content}>
          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === 0 && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Title & Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Guidera</Text>
            <Text style={styles.description}>
              Your travel buddy! Explore, plan, and experience tailored travel from your phone. Let's start over.
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>

          {/* Dev Shortcut Button */}
          <TouchableOpacity
            style={styles.devButton}
            onPress={handleDevShortcut}
            activeOpacity={0.7}
          >
            <Text style={styles.devButtonText}>🚀 Go to Home (Dev)</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  onboardingImage: {
    width: width * 1.05,
    height: height * 0.75,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  textContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.black,
    textAlign: 'center',
    lineHeight: 22,
  },
  nextButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  devButton: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
  },
  devButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
