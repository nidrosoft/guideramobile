import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { User, Location, Heart, Shield, Airplane } from 'iconsax-react-native';
import { colors, typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

const setupSteps = [
  { id: 1, text: 'Setting up your account', icon: User, color: '#818CF8', bgColor: 'rgba(99, 102, 241, 0.12)', duration: 1500 },
  { id: 2, text: 'Finding destinations', icon: Location, color: '#F472B6', bgColor: 'rgba(236, 72, 153, 0.12)', duration: 1500 },
  { id: 3, text: 'Personalizing experience', icon: Heart, color: '#F87171', bgColor: 'rgba(239, 68, 68, 0.12)', duration: 1500 },
  { id: 4, text: 'Configuring safety', icon: Shield, color: '#34D399', bgColor: 'rgba(16, 185, 129, 0.12)', duration: 1500 },
  { id: 5, text: 'Preparing your journey', icon: Airplane, color: '#FBBF24', bgColor: 'rgba(245, 158, 11, 0.12)', duration: 1500 },
];

export default function Setup() {
  const router = useRouter();
  const { colors: tc, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const confettiRef = useRef<any>(null);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  
  const { updateProfile, completeOnboarding, profile } = useAuth();
  const { getProfileUpdates, reset: resetOnboarding, data: onboardingData } = useOnboardingStore();

  const saveProfileData = async () => {
    if (hasSavedProfile) return;
    setHasSavedProfile(true);
    
    try {
      const profileUpdates = getProfileUpdates();
      await updateProfile(profileUpdates);

      // Also upsert travel_preferences table so it's the single source of truth
      if (profile?.id) {
        const travelPrefsRow: Record<string, any> = {
          user_id: profile.id,
          preferences_completed: true,
          updated_at: new Date().toISOString(),
        };

        // Travel styles (multi-select array, min 3)
        const styles = onboardingData.travelStyles.length > 0
          ? onboardingData.travelStyles
          : onboardingData.travelStyle ? [onboardingData.travelStyle] : [];
        if (styles.length > 0) {
          travelPrefsRow.preferred_trip_styles = styles;
        }

        // Dietary restrictions (multi-select array)
        const dietary = onboardingData.dietaryRestrictionsList.length > 0
          ? onboardingData.dietaryRestrictionsList.filter(d => d !== 'None')
          : onboardingData.dietaryRestrictions && onboardingData.dietaryRestrictions !== 'None'
            ? [onboardingData.dietaryRestrictions]
            : [];
        if (dietary.length > 0) {
          travelPrefsRow.dietary_restrictions = dietary;
        }

        // Accessibility needs (multi-select array)
        const accessibility = onboardingData.accessibilityNeedsList.length > 0
          ? onboardingData.accessibilityNeedsList.filter(a => a !== 'None')
          : onboardingData.accessibilityNeeds && onboardingData.accessibilityNeeds !== 'None'
            ? [onboardingData.accessibilityNeeds]
            : [];
        if (accessibility.length > 0) {
          travelPrefsRow.accessibility_needs = accessibility;
          if (accessibility.includes('Wheelchair accessible')) {
            travelPrefsRow.wheelchair_accessible = true;
          }
        }

        const { error: tpError } = await supabase
          .from('travel_preferences')
          .upsert(travelPrefsRow, { onConflict: 'user_id' });

        if (tpError) {
          console.warn('Error saving travel_preferences row:', tpError.message);
        }
      }

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
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
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
          <Text style={[styles.logo, { color: tc.textPrimary }]}>GUIDERA</Text>
          <Text style={[styles.subtitle, { color: tc.textSecondary }]}>Setting up your experience</Text>
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
                  <Text style={[styles.stepText, { color: tc.textPrimary }]}>{step.text}</Text>
                  {isActive && (
                    <View style={styles.loadingDots}>
                      <View style={[styles.loadingDot, styles.loadingDot1]} />
                      <View style={[styles.loadingDot, styles.loadingDot2]} />
                      <View style={[styles.loadingDot, styles.loadingDot3]} />
                    </View>
                  )}
                </View>
                
                {isCompleted && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: tc.success }]}>
                    <Text style={[styles.checkmark, { color: tc.white }]}>✓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Bottom Message */}
        <Text style={[styles.bottomMessage, { color: tc.textSecondary }]}>
          This will only take a moment...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  bottomMessage: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
