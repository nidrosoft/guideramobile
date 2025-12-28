/**
 * BUDGET STEP
 * 
 * Step 5: What's your budget?
 * Budget amount, spending style, and priority selection.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowRight2,
  Wallet2,
  DollarCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/styles';
import { useAdvancedPlanningStore } from '../../../stores/useAdvancedPlanningStore';
import { 
  SPENDING_STYLE_OPTIONS, 
  BUDGET_PRIORITY_OPTIONS,
  CURRENCY_OPTIONS,
} from '../../../config/planning.config';

interface BudgetStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function BudgetStep({
  onNext,
  onBack,
  onClose,
}: BudgetStepProps) {
  const insets = useSafeAreaInsets();
  const {
    advancedTripData,
    setBudgetAmount,
    setBudgetCurrency,
    setSpendingStyle,
    setBudgetPriority,
    isBudgetValid,
    getTotalNights,
  } = useAdvancedPlanningStore();
  
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  
  const handleAmountChange = (text: string) => {
    const amount = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    setBudgetAmount(amount);
  };
  
  const handleCurrencySelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBudgetCurrency(code);
    setShowCurrencyPicker(false);
  };
  
  const handleSpendingStyleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpendingStyle(id as any);
  };
  
  const handlePrioritySelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBudgetPriority(id as any);
  };
  
  const handleContinue = useCallback(() => {
    if (!isBudgetValid()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [isBudgetValid, onNext]);
  
  const getCurrencySymbol = () => {
    const currency = CURRENCY_OPTIONS.find(c => c.code === advancedTripData.budget.currency);
    return currency?.symbol || '$';
  };
  
  const getPerDayBudget = () => {
    const nights = getTotalNights() || 7;
    const perDay = Math.round(advancedTripData.budget.amount / nights);
    return perDay;
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>What's your budget?</Text>
          <Text style={styles.subtitle}>
            Set your total trip budget (excluding flights)
          </Text>
        </Animated.View>
        
        {/* Budget Input */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.budgetInputContainer}
        >
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <Text style={styles.currencyCode}>{advancedTripData.budget.currency}</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.budgetInput}
            value={advancedTripData.budget.amount > 0 ? advancedTripData.budget.amount.toString() : ''}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            maxLength={7}
          />
        </Animated.View>
        
        {/* Currency Picker */}
        {showCurrencyPicker && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.currencyPicker}
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  advancedTripData.budget.currency === currency.code && styles.currencyOptionSelected,
                ]}
                onPress={() => handleCurrencySelect(currency.code)}
              >
                <Text style={styles.currencyOptionSymbol}>{currency.symbol}</Text>
                <Text style={styles.currencyOptionLabel}>{currency.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
        
        {/* Per Day Estimate */}
        {advancedTripData.budget.amount > 0 && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.perDayCard}
          >
            <DollarCircle size={20} color={colors.primary} variant="Bold" />
            <Text style={styles.perDayText}>
              ~{getCurrencySymbol()}{getPerDayBudget()} per day
            </Text>
          </Animated.View>
        )}
        
        {/* Spending Style */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Spending Style</Text>
          <View style={styles.styleOptions}>
            {SPENDING_STYLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.styleCard,
                  advancedTripData.spendingStyle === option.id && styles.styleCardSelected,
                ]}
                onPress={() => handleSpendingStyleSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.styleEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.styleLabel,
                  advancedTripData.spendingStyle === option.id && styles.styleLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.styleDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Budget Priority */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Where to splurge?</Text>
          <Text style={styles.sectionHint}>What matters most to you</Text>
          
          <View style={styles.priorityOptions}>
            {BUDGET_PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.priorityOption,
                  advancedTripData.budgetPriority === option.id && styles.priorityOptionSelected,
                ]}
                onPress={() => handlePrioritySelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOuter}>
                  {advancedTripData.budgetPriority === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.priorityContent}>
                  <Text style={[
                    styles.priorityLabel,
                    advancedTripData.budgetPriority === option.id && styles.priorityLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.priorityDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
            !isBudgetValid() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isBudgetValid()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isBudgetValid() 
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
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  
  // Budget Input
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  currencySymbol: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  currencyCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  budgetInput: {
    flex: 1,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  
  // Currency Picker
  currencyPicker: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  currencyOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  currencyOptionSymbol: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    width: 30,
  },
  currencyOptionLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Per Day Card
  perDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  perDayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  // Style Options - Compact cards
  styleOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  styleCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  styleEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  styleLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  styleLabelSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  styleDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Priority Options - Radio style
  priorityOptions: {
    gap: spacing.sm,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  priorityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  priorityContent: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  priorityLabelSelected: {
    color: colors.primary,
  },
  priorityDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
