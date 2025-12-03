import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Airplane, Location, Global, Briefcase } from 'iconsax-react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import PrimaryButton from '@/components/common/buttons/PrimaryButton';

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

      // Zoom in and out
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldZoom, scale]);

  return (
    <Animated.View 
      style={[
        styles.featureCard, 
        { backgroundColor: feature.bgColor },
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
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [zoomFeatureIndex, setZoomFeatureIndex] = useState(-1);
  const [showButton, setShowButton] = useState(false);
  const buttonScale = useRef(new Animated.Value(0)).current;

  const features = [
    {
      icon: Airplane,
      title: 'Personalize your experience',
      description: 'Tell us about your travel preferences',
      bgColor: '#FFEBEB',
      iconBgColor: '#FFCCCC',
      iconColor: '#FF6B6B',
    },
    {
      icon: Location,
      title: 'Find the best destinations',
      description: 'Get AI-powered recommendations',
      bgColor: '#E0F2FE',
      iconBgColor: '#BAE6FD',
      iconColor: '#0284C7',
    },
    {
      icon: Global,
      title: 'Discover local insights',
      description: 'Access cultural tips and safety info',
      bgColor: '#FFEDD5',
      iconBgColor: '#FED7AA',
      iconColor: '#EA580C',
    },
    {
      icon: Briefcase,
      title: 'Book seamlessly',
      description: 'All your travel needs in one place',
      bgColor: '#DCFCE7',
      iconBgColor: '#BBF7D0',
      iconColor: '#16A34A',
    },
  ];

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    // Feature appearance schedule (2 seconds apart)
    features.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setCurrentFeatureIndex(index);
      }, index * 2000);
      timeouts.push(timeout);
    });

    // Button appearance at 8 seconds
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
    }, 8000);
    timeouts.push(buttonTimeout);

    // Zoom effects starting at 9 seconds (500ms apart)
    features.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setZoomFeatureIndex(index);
        // Reset after animation
        setTimeout(() => setZoomFeatureIndex(-1), 400);
      }, 9000 + (index * 500));
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Guidera!</Text>
        <Text style={styles.subtitle}>
          Thank you for signing up. Let's set up your account to give you the best travel experience.
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
          <Text style={styles.setupText}>Ready to personalize your journey?</Text>
          <PrimaryButton
            title="Let's Do It!"
            onPress={handleContinue}
          />
          <Text style={styles.footerText}>Takes less than 2 minutes</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  featuresContainer: {
    flex: 1,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    gap: spacing.md,
    minHeight: 80,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: spacing.xl,
    width: '100%',
  },
  setupText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
