import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles';
import PrimaryButton from '@/components/common/buttons/PrimaryButton';
import TypingAnimation from '@/components/common/TypingAnimation';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const router = useRouter();

  const phrases = [
    "Let's explore the world",
    "Let's immerse ourselves",
    "Let's go sightseeing",
    "Let's do some outside stuff",
    "Let's relax and unwind",
    "Let's exchange cultures",
    "Let's seek adventures",
    "Let's connect with nature",
    "Let's create memories",
  ];

  const handlePhoneSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/phone-signup');
  };

  const handleGoogleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement Google sign up
    console.log('Google sign up');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Video */}
      <Video
        source={require('../../../assets/images/landing.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Centered Typing Animation */}
        <View style={styles.centerSection}>
          <TypingAnimation 
            phrases={phrases}
            typingSpeed={80}
            deletingSpeed={50}
            pauseTime={800}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          {/* Phone Sign Up Button with Gradient */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.phoneButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.phoneButtonInner}
              onPress={handlePhoneSignUp}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneButtonText}>Sign up with Phone Number</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick & Easy Badge */}
          <Text style={styles.badge}>Quick & easy - no hassle, just your phone number</Text>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing up, you agree to our <Text style={styles.termsLink}>Terms</Text>. See how we use your data in our <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  bottomContainer: {
    gap: spacing.sm,
  },
  phoneButton: {
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  phoneButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
  },
  googleButton: {
    height: 56,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  googleButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signInText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  signInLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textDecorationLine: 'underline',
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  termsLink: {
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});
