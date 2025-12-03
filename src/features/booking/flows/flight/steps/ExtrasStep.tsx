/**
 * EXTRAS STEP
 * 
 * Add baggage, meals, and insurance options.
 */

import React, { useState } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Bag2,
  Coffee,
  Shield,
  Add,
  Minus,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useFlightStore } from '../../../stores/useFlightStore';
import { BaggageOption, MealOption, FlightInsuranceOption } from '../../../types/flight.types';

interface ExtrasStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
  stepIndex: number;
  totalSteps: number;
}

// Mock data for extras
const BAGGAGE_OPTIONS: BaggageOption[] = [
  { id: 'bag-1', type: 'checked', weight: 23, quantity: 1, price: 35, description: '1 checked bag (23kg)' },
  { id: 'bag-2', type: 'checked', weight: 23, quantity: 2, price: 60, description: '2 checked bags (23kg each)' },
  { id: 'bag-3', type: 'checked', weight: 32, quantity: 1, price: 55, description: '1 heavy bag (32kg)' },
];

const MEAL_OPTIONS: MealOption[] = [
  { id: 'meal-1', type: 'standard', name: 'Standard Meal', description: 'Chicken or pasta with sides', price: 15 },
  { id: 'meal-2', type: 'vegetarian', name: 'Vegetarian', description: 'Plant-based meal', price: 15 },
  { id: 'meal-3', type: 'vegan', name: 'Vegan', description: 'Fully plant-based, no dairy', price: 18 },
  { id: 'meal-4', type: 'halal', name: 'Halal', description: 'Halal-certified meal', price: 18 },
  { id: 'meal-5', type: 'kosher', name: 'Kosher', description: 'Kosher-certified meal', price: 20 },
];

const INSURANCE_OPTIONS: FlightInsuranceOption[] = [
  {
    id: 'ins-1',
    name: 'Basic Protection',
    description: 'Trip cancellation coverage',
    coverage: ['Trip cancellation up to $1,000', 'Flight delay compensation'],
    price: 19,
    pricePerPerson: true,
  },
  {
    id: 'ins-2',
    name: 'Premium Protection',
    description: 'Comprehensive coverage',
    coverage: ['Trip cancellation up to $5,000', 'Medical emergency up to $50,000', 'Lost baggage up to $2,000', '24/7 assistance'],
    price: 49,
    pricePerPerson: true,
  },
];

export default function ExtrasStep({
  onNext,
  onBack,
  onClose,
  onSkip,
  stepIndex,
  totalSteps,
}: ExtrasStepProps) {
  const insets = useSafeAreaInsets();
  const { extras, addBaggage, removeBaggage, setInsurance, searchParams } = useFlightStore();
  
  const [selectedBaggage, setSelectedBaggage] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  
  const totalPassengers = searchParams.passengers.adults + searchParams.passengers.children;
  
  const calculateTotal = (): number => {
    let total = 0;
    
    if (selectedBaggage) {
      const bag = BAGGAGE_OPTIONS.find(b => b.id === selectedBaggage);
      if (bag) total += bag.price * totalPassengers;
    }
    
    if (selectedMeal) {
      const meal = MEAL_OPTIONS.find(m => m.id === selectedMeal);
      if (meal) total += meal.price * totalPassengers;
    }
    
    if (selectedInsurance) {
      const insurance = INSURANCE_OPTIONS.find(i => i.id === selectedInsurance);
      if (insurance) total += insurance.price * totalPassengers;
    }
    
    return total;
  };
  
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Save selections to store
    if (selectedBaggage) {
      const bag = BAGGAGE_OPTIONS.find(b => b.id === selectedBaggage);
      if (bag) addBaggage(bag);
    }
    
    if (selectedInsurance) {
      const insurance = INSURANCE_OPTIONS.find(i => i.id === selectedInsurance);
      if (insurance) setInsurance(insurance);
    }
    
    onNext();
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  };
  
  return (
    <View style={styles.container}>
      {/* Skip Option */}
      {onSkip && (
        <Animated.View 
          entering={FadeInDown.duration(400)}
          style={styles.skipBar}
        >
          <Text style={styles.skipBarText}>All extras are optional</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Baggage Section */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Bag2 size={24} color={colors.primary} variant="Bold" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Checked Baggage</Text>
              <Text style={styles.sectionSubtitle}>Add extra luggage allowance</Text>
            </View>
          </View>
          
          <View style={styles.optionsGrid}>
            {BAGGAGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedBaggage === option.id && styles.optionCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedBaggage(selectedBaggage === option.id ? null : option.id);
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionWeight}>{option.weight}kg</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={styles.optionPriceRow}>
                  <Text style={[
                    styles.optionPrice,
                    selectedBaggage === option.id && styles.optionPriceSelected,
                  ]}>
                    ${option.price}
                  </Text>
                  <Text style={styles.optionPriceNote}>/person</Text>
                </View>
                {selectedBaggage === option.id && (
                  <View style={styles.selectedBadge}>
                    <TickCircle size={20} color={colors.primary} variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Meals Section */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Coffee size={24} color={colors.warning} variant="Bold" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>In-flight Meals</Text>
              <Text style={styles.sectionSubtitle}>Pre-order your meal</Text>
            </View>
          </View>
          
          <View style={styles.mealsList}>
            {MEAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.mealCard,
                  selectedMeal === option.id && styles.mealCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedMeal(selectedMeal === option.id ? null : option.id);
                }}
              >
                <View style={styles.mealContent}>
                  <Text style={styles.mealName}>{option.name}</Text>
                  <Text style={styles.mealDescription}>{option.description}</Text>
                </View>
                <View style={styles.mealPriceContainer}>
                  <Text style={[
                    styles.mealPrice,
                    selectedMeal === option.id && styles.mealPriceSelected,
                  ]}>
                    ${option.price}
                  </Text>
                  {selectedMeal === option.id && (
                    <TickCircle size={20} color={colors.primary} variant="Bold" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Insurance Section */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.success + '15' }]}>
              <Shield size={24} color={colors.success} variant="Bold" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Travel Protection</Text>
              <Text style={styles.sectionSubtitle}>Peace of mind for your trip</Text>
            </View>
          </View>
          
          <View style={styles.insuranceList}>
            {INSURANCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.insuranceCard,
                  selectedInsurance === option.id && styles.insuranceCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedInsurance(selectedInsurance === option.id ? null : option.id);
                }}
              >
                <View style={styles.insuranceHeader}>
                  <View>
                    <Text style={styles.insuranceName}>{option.name}</Text>
                    <Text style={styles.insuranceDescription}>{option.description}</Text>
                  </View>
                  <View style={styles.insurancePriceContainer}>
                    <Text style={[
                      styles.insurancePrice,
                      selectedInsurance === option.id && styles.insurancePriceSelected,
                    ]}>
                      ${option.price}
                    </Text>
                    <Text style={styles.insurancePriceNote}>/person</Text>
                  </View>
                </View>
                
                <View style={styles.coverageList}>
                  {option.coverage.map((item, index) => (
                    <View key={index} style={styles.coverageItem}>
                      <TickCircle size={14} color={colors.success} variant="Bold" />
                      <Text style={styles.coverageText}>{item}</Text>
                    </View>
                  ))}
                </View>
                
                {selectedInsurance === option.id && (
                  <View style={styles.insuranceSelectedBadge}>
                    <TickCircle size={24} color={colors.primary} variant="Bold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Footer */}
      <Animated.View 
        entering={FadeInUp.duration(400).delay(300)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Extras Total</Text>
          <Text style={styles.footerPriceAmount}>
            {calculateTotal() > 0 ? `+$${calculateTotal()}` : 'No extras'}
          </Text>
          {calculateTotal() > 0 && (
            <Text style={styles.footerPriceNote}>
              for {totalPassengers} passenger(s)
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
  skipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  skipBarText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    marginLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Baggage Options
  optionsGrid: {
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionContent: {
    flex: 1,
  },
  optionWeight: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  optionPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  optionPriceSelected: {
    color: colors.primary,
  },
  optionPriceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  selectedBadge: {
    marginLeft: spacing.md,
  },
  
  // Meals
  mealsList: {
    gap: spacing.sm,
  },
  mealCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  mealCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  mealDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  mealPriceSelected: {
    color: colors.primary,
  },
  
  // Insurance
  insuranceList: {
    gap: spacing.md,
  },
  insuranceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    ...shadows.sm,
    position: 'relative',
  },
  insuranceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  insuranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  insuranceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  insuranceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  insurancePriceContainer: {
    alignItems: 'flex-end',
  },
  insurancePrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  insurancePriceSelected: {
    color: colors.primary,
  },
  insurancePriceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  coverageList: {
    gap: spacing.xs,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coverageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  insuranceSelectedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerPriceAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  footerPriceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});
