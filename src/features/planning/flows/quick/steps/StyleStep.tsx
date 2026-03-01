/**
 * STYLE STEP
 * 
 * Step 3: Who's going and what's your vibe?
 * Companion type selection and trip style preferences.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  TickCircle,
  People,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { usePlanningStore } from '../../../stores/usePlanningStore';
import { COMPANION_OPTIONS, TRIP_STYLES, MAX_TRIP_STYLES } from '../../../config/planning.config';
import { CompanionType, TripStyle } from '../../../types/planning.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StyleStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function StyleStep({
  onNext,
  onBack,
  onClose,
}: StyleStepProps) {
  const { colors: tc } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    quickTripData,
    setCompanionType,
    toggleTripStyle,
    isStyleValid,
  } = usePlanningStore();
  
  const handleSelectCompanion = useCallback((type: CompanionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompanionType(type);
  }, [setCompanionType]);
  
  const handleToggleStyle = useCallback((style: TripStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTripStyle(style);
  }, [toggleTripStyle]);
  
  const handleContinue = useCallback(() => {
    if (!isStyleValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isStyleValid, onNext]);
  
  const isCompanionSelected = (type: CompanionType) => 
    quickTripData.companionType === type;
  
  const isStyleSelected = (style: TripStyle) => 
    quickTripData.tripStyles.includes(style);
  
  const getTravelerSummary = () => {
    const { adults, children, infants } = quickTripData.travelerCount;
    const parts = [];
    if (adults > 0) parts.push(`${adults} adult${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} child${children > 1 ? 'ren' : ''}`);
    if (infants > 0) parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
    return parts.join(', ') || '1 adult';
  };
  
  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Who's traveling?</Text>
          <Text style={styles.subtitle}>
            Tell us about your travel companions
          </Text>
        </Animated.View>
        
        {/* Companion Selection - Pill/Chip Style */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <View style={styles.chipsContainer}>
            {COMPANION_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeIn.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    isCompanionSelected(option.id) && styles.chipSelected,
                  ]}
                  onPress={() => handleSelectCompanion(option.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.chipLabel,
                    isCompanionSelected(option.id) && styles.chipLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          {/* Traveler Count Summary */}
          {quickTripData.companionType && (
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={styles.travelerSummary}
            >
              <People size={18} color={colors.primary} />
              <Text style={styles.travelerSummaryText}>
                {getTravelerSummary()}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
        
        {/* Trip Style Section - Pill/Chip Style */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What's your vibe?</Text>
            <Text style={styles.sectionHint}>
              Pick up to {MAX_TRIP_STYLES}
            </Text>
          </View>
          
          <View style={styles.chipsContainer}>
            {TRIP_STYLES.map((style, index) => (
              <Animated.View
                key={style.id}
                entering={FadeIn.duration(300).delay(100 + index * 30)}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    isStyleSelected(style.id) && styles.chipSelected,
                  ]}
                  onPress={() => handleToggleStyle(style.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>{style.emoji}</Text>
                  <Text style={[
                    styles.chipLabel,
                    isStyleSelected(style.id) && styles.chipLabelSelected,
                  ]}>
                    {style.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
        
        {/* Selected Styles Summary */}
        {quickTripData.tripStyles.length > 0 && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.selectedSummary}
          >
            <Text style={styles.selectedSummaryLabel}>Selected:</Text>
            <View style={styles.selectedTags}>
              {quickTripData.tripStyles.map((styleId) => {
                const style = TRIP_STYLES.find(s => s.id === styleId);
                return (
                  <View key={styleId} style={styles.selectedTag}>
                    <Text style={styles.selectedTagEmoji}>{style?.emoji}</Text>
                    <Text style={styles.selectedTagText}>{style?.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isStyleValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isStyleValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isStyleValid() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>
              {isStyleValid() ? 'Create My Trip' : 'Select companion & style'}
            </Text>
            <ArrowRight2 size={20} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Chips Container - Pill/Chip Style like Bumble
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  
  // Traveler Summary
  travelerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  travelerSummaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Selected Summary
  selectedSummary: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  selectedSummaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  selectedTagEmoji: {
    fontSize: 14,
  },
  selectedTagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  continueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
