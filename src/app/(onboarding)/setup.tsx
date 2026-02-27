import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { User, Location, Heart, Shield, Airplane } from 'iconsax-react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuth } from '@/context/AuthContext';

const setupSteps = [
  { id: 1, text: 'Setting up your account', icon: User, color: '#6366F1', bgColor: '#EEF2FF', duration: 1500 },
  { id: 2, text: 'Finding destinations', icon: Location, color: '#EC4899', bgColor: '#FCE7F3', duration: 1500 },
  { id: 3, text: 'Personalizing experience', icon: Heart, color: '#EF4444', bgColor: '#FEE2E2', duration: 1500 },
  { id: 4, text: 'Configuring safety', icon: Shield, color: '#10B981', bgColor: '#D1FAE5', duration: 1500 },
  { id: 5, text: 'Preparing your journey', icon: Airplane, color: '#F59E0B', bgColor: '#FEF3C7', duration: 1500 },
];

export default function Setup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const confettiRef = useRef<any>(null);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  
  const { updateProfile, completeOnboarding } = useAuth();
  const { getProfileUpdates, reset: resetOnboarding } = useOnboardingStore();

  const saveProfileData = async () => {
    if (hasSavedProfile) return;
    setHasSavedProfile(true);
    
    try {
      const profileUpdates = getProfileUpdates();
      await updateProfile(profileUpdates);
      await completeOnboarding();
      resetOnboarding();
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  useEffect(() => {
    if (currentStep < setupSteps.length) {
      const timer = setTimeout(() => {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        setCompletedSteps(prev => [...prev, currentStep]);
        
        if (currentStep < setupSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          saveProfileData();
          
          setTimeout(() => {
            confettiRef.current?.start();
          }, 300);
          
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 3000);
        }
      }, setupSteps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Confetti */}
      <ConfettiCannon
        count={200}
        origin={{x: -10, y: 0}}
        autoStart={false}
        ref={confettiRef}
        fadeOut
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>GUIDERA</Text>
          <Text style={styles.subtitle}>Setting up your experience</Text>
        </View>

        {/* Setup Steps */}
        <View style={styles.stepsContainer}>
          {setupSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(index);
            const isActive = index === currentStep;
            
            return (
              <View key={step.id} style={styles.stepItem}>
                <View style={[styles.iconContainer, { backgroundColor: step.bgColor }]}>
                  <StepIcon size={28} color={step.color} variant="Bold" />
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{step.text}</Text>
                  {isActive && (
                    <View style={styles.loadingDots}>
                      <View style={[styles.loadingDot, styles.loadingDot1]} />
                      <View style={[styles.loadingDot, styles.loadingDot2]} />
                      <View style={[styles.loadingDot, styles.loadingDot3]} />
                    </View>
                  )}
                </View>
                
                {isCompleted && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Bottom Message */}
        <Text style={styles.bottomMessage}>
          This will only take a moment...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logo: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  stepsContainer: {
    gap: spacing.xl,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray400,
  },
  loadingDot1: {
    opacity: 0.3,
  },
  loadingDot2: {
    opacity: 0.6,
  },
  loadingDot3: {
    opacity: 1,
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  bottomMessage: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
