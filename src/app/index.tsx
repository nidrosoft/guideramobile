import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/styles';

export default function SplashScreen() {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const descFadeAnim = useRef(new Animated.Value(0)).current;
  const fullText = 'GUIDERA';

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Typing animation with haptic feedback
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        // Haptic feedback on each letter
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Show description after typing
        setShowDescription(true);
        Animated.timing(descFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
        
        // Navigate to first walkthrough screen after 5 seconds total
        setTimeout(() => {
          router.replace('/(onboarding)/welcome-1');
        }, 3500); // 1.5s typing + 3.5s = 5s total
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo/Brand Name */}
          <View style={styles.centerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>{displayedText}</Text>
              {displayedText.length < fullText.length && (
                <View style={styles.cursor} />
              )}
            </View>

            {/* Description */}
            {showDescription && (
              <Animated.Text style={[styles.description, { opacity: descFadeAnim }]}>
                Your AI-Powered Travel Companion
              </Animated.Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>BY CYRIAC ZEH</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 3,
  },
  cursor: {
    width: 2,
    height: typography.fontSize['3xl'],
    backgroundColor: colors.white,
    marginLeft: 3,
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    opacity: 0.85,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
    letterSpacing: 1.5,
    opacity: 0.7,
  },
});
