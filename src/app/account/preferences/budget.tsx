/**
 * BUDGET PREFERENCES SCREEN
 * 
 * Edit default budget amount, currency, spending style, and priority.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, TickCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  preferencesService, 
  TravelPreferences,
  PREFERENCE_OPTIONS,
  Currency,
  SpendingStyle,
  BudgetPriority,
} from '@/services/preferences.service';

export default function BudgetPreferencesScreen() {
  const router = useRouter();
  const { colors: tc } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [budgetAmount, setBudgetAmount] = useState(3000);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [spendingStyle, setSpendingStyle] = useState<SpendingStyle>('midrange');
  const [budgetPriority, setBudgetPriority] = useState<BudgetPriority>('balanced');

  const fetchPreferences = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(profile.id);
      if (data) {
        setPreferences(data);
        setBudgetAmount(data.defaultBudgetAmount);
        setCurrency(data.defaultCurrency);
        setSpendingStyle(data.spendingStyle);
        setBudgetPriority(data.budgetPriority);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateBudgetPreferences(
        profile.id,
        budgetAmount,
        currency,
        spendingStyle,
        budgetPriority
      );
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmountChange = (text: string) => {
    const amount = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    setBudgetAmount(amount);
  };

  const getCurrencySymbol = () => {
    const curr = PREFERENCE_OPTIONS.currencies.find(c => c.code === currency);
    return curr?.symbol || '$';
  };

  const hasChanges = () => {
    if (!preferences) return false;
    return (
      budgetAmount !== preferences.defaultBudgetAmount ||
      currency !== preferences.defaultCurrency ||
      spendingStyle !== preferences.spendingStyle ||
      budgetPriority !== preferences.budgetPriority
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: tc.bgPrimary }]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: tc.bgPrimary }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: tc.bgElevated, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Budget & Spending</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, { backgroundColor: hasChanges() ? tc.primary : tc.borderSubtle }]}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={[styles.saveButtonText, { color: hasChanges() ? '#FFFFFF' : tc.textTertiary }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Default trip budget</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Your typical budget per trip</Text>
          
          <View style={[styles.budgetInputContainer, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            <Text style={[styles.currencySymbol, { color: tc.primary }]}>{getCurrencySymbol()}</Text>
            <TextInput
              style={[styles.budgetInput, { color: tc.textPrimary }]}
              value={budgetAmount.toLocaleString()}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="3,000"
              placeholderTextColor={tc.textTertiary}
            />
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Preferred currency</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>Select your default currency for budgeting</Text>
          <View style={styles.currencyGrid}>
            {PREFERENCE_OPTIONS.currencies.map(curr => (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.currencyCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  currency === curr.code && { backgroundColor: `${tc.primary}15`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrency(curr.code as Currency);
                }}
              >
                <Text style={[
                  styles.currencySymbolCard,
                  { color: tc.textPrimary },
                  currency === curr.code && { color: tc.primary },
                ]}>
                  {curr.symbol}
                </Text>
                <Text style={[
                  styles.currencyCode,
                  { color: tc.textSecondary },
                  currency === curr.code && { color: tc.primary },
                ]}>
                  {curr.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spending Style */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Spending style</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>How do you prefer to spend on trips?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.spendingStyles.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  spendingStyle === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSpendingStyle(option.id as SpendingStyle);
                }}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    { color: tc.textPrimary },
                    spendingStyle === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {spendingStyle === option.id && (
                  <TickCircle size={20} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Where to prioritize spending?</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>What matters most to you on a trip?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.budgetPriorities.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.priorityCard,
                  { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle },
                  budgetPriority === option.id && { backgroundColor: `${tc.primary}10`, borderColor: tc.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBudgetPriority(option.id as BudgetPriority);
                }}
              >
                <View style={styles.priorityContent}>
                  <Text style={[
                    styles.priorityLabel,
                    { color: tc.textPrimary },
                    budgetPriority === option.id && { color: tc.primary },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.priorityDescription, { color: tc.textSecondary }]}>{option.description}</Text>
                </View>
                {budgetPriority === option.id && (
                  <TickCircle size={20} color={tc.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  saveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  saveButtonTextDisabled: {
    color: colors.gray400,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  currencyCard: {
    width: '31%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  currencyCardSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  currencySymbolCard: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  currencySymbolCardSelected: {
    color: colors.primary,
  },
  currencyCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  currencyCodeSelected: {
    color: colors.primary,
  },
  optionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  optionCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  priorityCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
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
});
