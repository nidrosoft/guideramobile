/**
 * TRIP TYPE STEP
 * 
 * Step 1: What kind of trip are you planning?
 * Round Trip, One Way, or Multi-City selection.
 * Uses segmented control pattern matching Flight SearchStep.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  Repeat,
  ArrowRight,
  Map,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { TRIP_TYPE_OPTIONS } from '../../../config/planning.config';
import { AdvancedTripType } from '../../../types/planning.types';

interface TripTypeStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function TripTypeStep({
  onNext,
  onBack,
  onClose,
}: TripTypeStepProps) {
  const insets = useSafeAreaInsets();
  const { advancedTripData, setTripType, isTripTypeValid } = useAdvancedPlanningStore();
  
  const handleSelectType = useCallback((type: AdvancedTripType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTripType(type);
  }, [setTripType]);
  
  const handleContinue = useCallback(() => {
    if (!isTripTypeValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isTripTypeValid, onNext]);
  
  const isSelected = (type: AdvancedTripType) => advancedTripData.tripType === type;
  
  const getIcon = (type: AdvancedTripType, selected: boolean) => {
    const color = selected ? colors.white : colors.textSecondary;
    const size = 18;
    switch (type) {
      case 'roundtrip': return <Repeat size={size} color={color} />;
      case 'oneway': return <ArrowRight size={size} color={color} />;
      case 'multicity': return <Map size={size} color={color} />;
    }
  };
  
  const getDescription = () => {
    switch (advancedTripData.tripType) {
      case 'multicity':
        return 'Visit multiple destinations in one journey. Perfect for exploring different cities!';
      case 'oneway':
        return 'Great when you\'re relocating or continuing to another destination.';
      default:
        return 'The most common choice - depart and return to the same location.';
    }
  };
  
  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>What kind of trip?</Text>
          <Text style={styles.subtitle}>
            Choose how you want to travel
          </Text>
        </Animated.View>
        
        {/* Trip Type Selector - Segmented Control Style */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.segmentedContainer}
        >
          {TRIP_TYPE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.segmentButton,
                isSelected(option.id) && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelectType(option.id)}
              activeOpacity={0.7}
            >
              {getIcon(option.id, isSelected(option.id))}
              <Text style={[
                styles.segmentText,
                isSelected(option.id) && styles.segmentTextActive,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
        
        {/* Description Card */}
        <Animated.View 
          entering={FadeIn.duration(300).delay(200)}
          style={styles.descriptionCard}
        >
          <View style={styles.descriptionIconContainer}>
            {getIcon(advancedTripData.tripType, false)}
          </View>
          <View style={styles.descriptionContent}>
            <Text style={styles.descriptionTitle}>
              {TRIP_TYPE_OPTIONS.find(o => o.id === advancedTripData.tripType)?.label}
            </Text>
            <Text style={styles.descriptionText}>{getDescription()}</Text>
          </View>
        </Animated.View>
        
        {/* Visual Guide */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.visualGuide}
        >
          <Text style={styles.visualGuideTitle}>Your journey</Text>
          <View style={styles.journeyVisual}>
            {advancedTripData.tripType === 'roundtrip' && (
              <>
                <View style={styles.journeyDot} />
                <View style={styles.journeyLine} />
                <View style={[styles.journeyDot, styles.journeyDotDestination]} />
                <View style={styles.journeyLine} />
                <View style={styles.journeyDot} />
              </>
            )}
            {advancedTripData.tripType === 'oneway' && (
              <>
                <View style={styles.journeyDot} />
                <View style={styles.journeyLine} />
                <View style={[styles.journeyDot, styles.journeyDotDestination]} />
              </>
            )}
            {advancedTripData.tripType === 'multicity' && (
              <>
                <View style={styles.journeyDot} />
                <View style={styles.journeyLine} />
                <View style={[styles.journeyDot, styles.journeyDotDestination]} />
                <View style={styles.journeyLine} />
                <View style={[styles.journeyDot, styles.journeyDotDestination]} />
                <View style={styles.journeyLine} />
                <View style={[styles.journeyDot, styles.journeyDotDestination]} />
              </>
            )}
          </View>
          <View style={styles.journeyLabels}>
            <Text style={styles.journeyLabel}>Origin</Text>
            <Text style={styles.journeyLabel}>
              {advancedTripData.tripType === 'multicity' ? 'Destinations' : 'Destination'}
            </Text>
            {advancedTripData.tripType === 'roundtrip' && (
              <Text style={styles.journeyLabel}>Return</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Continue Button */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isTripTypeValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isTripTypeValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isTripTypeValid() 
              ? [colors.primary, colors.gradientEnd]
              : [colors.gray300, colors.gray400]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
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
  
  // Segmented Control - Matches Flight SearchStep
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.white,
  },
  
  // Description Card
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  descriptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  descriptionContent: {
    flex: 1,
  },
  descriptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Visual Guide
  visualGuide: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  visualGuideTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  journeyVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  journeyDotDestination: {
    backgroundColor: colors.error,
  },
  journeyLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.xs,
  },
  journeyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journeyLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
