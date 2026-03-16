import { View, Text, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Magicpen, ShieldTick, MessageText1, LanguageSquare, People } from 'iconsax-react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { TouchableOpacity } from 'react-native';

// Typewriter component for titles
function TypewriterText({ 
  text, 
  onComplete, 
  shouldStart 
}: { 
  text: string; 
  onComplete: () => void; 
  shouldStart: boolean;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      setDisplayText('');
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Haptic feedback on each character (iOS only)
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 15); // 15ms per character

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && displayText.length > 0) {
      onComplete();
    }
  }, [currentIndex, text, shouldStart, displayText.length, onComplete]);

  return <Text style={styles.featureTitle}>{displayText}</Text>;
}

// Typewriter component for descriptions
function TypewriterDescription({ 
  text, 
  onComplete, 
  shouldStart 
}: { 
  text: string; 
  onComplete: () => void; 
  shouldStart: boolean;
}) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      setDisplayText('');
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 10); // 10ms per character (faster than title)

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && displayText.length > 0) {
      onComplete();
    }
  }, [currentIndex, text, shouldStart, displayText.length, onComplete]);

  return <Text style={styles.featureDescription}>{displayText}</Text>;
}

// Animated feature component
function AnimatedFeature({ 
  feature, 
  shouldAnimate, 
  shouldZoom 
}: { 
  feature: any; 
  shouldAnimate: boolean; 
  shouldZoom: boolean;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [hasAnimated, setHasAnimated] = useState(false);
  const [titleComplete, setTitleComplete] = useState(false);
  const [descComplete, setDescComplete] = useState(false);

  // Entrance animation
  useEffect(() => {
    if (shouldAnimate && !hasAnimated) {
      setHasAnimated(true);
      
      // Play haptic
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Animate scale with bounce
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade in opacity
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldAnimate, hasAnimated, scale, opacity]);

  // Zoom animation
  useEffect(() => {
    if (shouldZoom) {
      // Play heavy haptic
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Zoom in and out — fast snap
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldZoom, scale]);

  return (
    <Animated.View 
      style={[
        styles.featureCard, 
        { backgroundColor: feature.bgColor, borderColor: feature.borderColor || 'transparent' },
        { transform: [{ scale }], opacity }
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: feature.iconBgColor }]}>
        <feature.icon size={24} color={feature.iconColor} variant="Bold" />
      </View>
      <View style={styles.featureContent}>
        <TypewriterText 
          text={feature.title} 
          onComplete={() => setTitleComplete(true)}
          shouldStart={hasAnimated}
        />
        {titleComplete && (
          <TypewriterDescription 
            text={feature.description} 
            onComplete={() => setDescComplete(true)}
            shouldStart={true}
          />
        )}
      </View>
    </Animated.View>
  );
}

export default function Intro() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [zoomFeatureIndex, setZoomFeatureIndex] = useState(-1);
  const [showButton, setShowButton] = useState(false);
  const buttonScale = useRef(new Animated.Value(0)).current;

  const features = [
    {
      icon: Magicpen,
      title: 'AI Smart Trip Planner',
      description: 'One tap generates your full itinerary, packing list, safety guide, and more',
      bgColor: isDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(168, 85, 247, 0.08)',
      iconBgColor: isDark ? 'rgba(168, 85, 247, 0.28)' : 'rgba(168, 85, 247, 0.15)',
      iconColor: '#C084FC',
      borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.12)',
    },
    {
      icon: ShieldTick,
      title: 'Real-Time Safety Alerts',
      description: 'Live travel advisories, emergency contacts, SOS, and danger zone warnings',
      bgColor: isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)',
      iconBgColor: isDark ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.15)',
      iconColor: '#F87171',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.12)',
    },
    {
      icon: MessageText1,
      title: 'AI Travel Assistant',
      description: 'Ask anything — flights, visas, weather, maps, local tips, all in one chat',
      bgColor: isDark ? 'rgba(59, 130, 246, 0.14)' : 'rgba(59, 130, 246, 0.08)',
      iconBgColor: isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(59, 130, 246, 0.15)',
      iconColor: '#60A5FA',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)',
    },
    {
      icon: LanguageSquare,
      title: 'Cultural & Language Kit',
      description: '120+ survival phrases, cultural do\'s & don\'ts, and local etiquette',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.08)',
      iconBgColor: isDark ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.15)',
      iconColor: '#FBBF24',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.12)',
    },
    {
      icon: People,
      title: 'Travel Community',
      description: 'Connect with travelers, local guides, join group meetups, and find travel buddies',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.08)',
      iconBgColor: isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.15)',
      iconColor: '#34D399',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)',
    },
  ];

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Feature appearance schedule (1.6 seconds apart for 5 cards)
    features.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setCurrentFeatureIndex(index);
      }, index * 1600);
      timeouts.push(timeout);
    });

    // Button appearance after all 5 cards (8.5 seconds)
    const buttonTimeout = setTimeout(() => {
      setShowButton(true);
      
      // Play success haptic
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate button
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 8500);
    timeouts.push(buttonTimeout);

    // Zoom effects starting at 9.5 seconds (200ms apart — fast cascade)
    features.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setZoomFeatureIndex(index);
        // Reset after animation
        setTimeout(() => setZoomFeatureIndex(-1), 250);
      }, 9500 + (index * 200));
      timeouts.push(timeout);
    });

    // Cleanup
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [buttonScale, features.length]);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(onboarding)/name');
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Welcome to Guidera!</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Your AI-powered travel companion that plans, protects, and connects you everywhere you go. Here's what makes Guidera different:
        </Text>
      </View>

      {/* Features Container */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          index <= currentFeatureIndex && (
            <AnimatedFeature
              key={index}
              feature={feature}
              shouldAnimate={index === currentFeatureIndex}
              shouldZoom={index === zoomFeatureIndex}
            />
          )
        ))}
      </View>

      {/* Button Container */}
      {showButton && (
        <Animated.View 
          style={[
            styles.buttonContainer,
            { transform: [{ scale: buttonScale }] }
          ]}
        >
          <Text style={[styles.setupText, { color: tc.textSecondary }]}>Let's personalize your experience</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: tc.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaButtonText, { color: tc.white }]}>Get Started</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: tc.textTertiary }]}>Quick setup — less than 2 minutes</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  featuresContainer: {
    flex: 1,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
  },
  ctaButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    width: '100%',
  },
  setupText: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
