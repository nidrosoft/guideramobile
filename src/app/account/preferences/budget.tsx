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
  const { user } = useAuth();
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
    if (!user?.id) return;
    
    try {
      const { data } = await preferencesService.getPreferences(user.id);
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
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await preferencesService.updateBudgetPreferences(
        user.id,
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
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget & Spending</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, !hasChanges() && styles.saveButtonDisabled]}
          disabled={!hasChanges() || isSaving}
        >
          <Text style={[styles.saveButtonText, !hasChanges() && styles.saveButtonTextDisabled]}>
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
          <Text style={styles.sectionTitle}>Default trip budget</Text>
          <Text style={styles.sectionSubtitle}>Your typical budget per trip</Text>
          
          <View style={styles.budgetInputContainer}>
            <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetAmount.toLocaleString()}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="3,000"
              placeholderTextColor={colors.gray400}
            />
          </View>
        </View>

        {/* Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred currency</Text>
          <Text style={styles.sectionSubtitle}>Select your default currency for budgeting</Text>
          <View style={styles.currencyGrid}>
            {PREFERENCE_OPTIONS.currencies.map(curr => (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.currencyCard,
                  currency === curr.code && styles.currencyCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrency(curr.code as Currency);
                }}
              >
                <Text style={[
                  styles.currencySymbolCard,
                  currency === curr.code && styles.currencySymbolCardSelected,
                ]}>
                  {curr.symbol}
                </Text>
                <Text style={[
                  styles.currencyCode,
                  currency === curr.code && styles.currencyCodeSelected,
                ]}>
                  {curr.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spending Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending style</Text>
          <Text style={styles.sectionSubtitle}>How do you prefer to spend on trips?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.spendingStyles.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  spendingStyle === option.id && styles.optionCardSelected,
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
                    spendingStyle === option.id && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {spendingStyle === option.id && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where to prioritize spending?</Text>
          <Text style={styles.sectionSubtitle}>What matters most to you on a trip?</Text>
          <View style={styles.optionsContainer}>
            {PREFERENCE_OPTIONS.budgetPriorities.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.priorityCard,
                  budgetPriority === option.id && styles.priorityCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setBudgetPriority(option.id as BudgetPriority);
                }}
              >
                <View style={styles.priorityContent}>
                  <Text style={[
                    styles.priorityLabel,
                    budgetPriority === option.id && styles.priorityLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.priorityDescription}>{option.description}</Text>
                </View>
                {budgetPriority === option.id && (
                  <TickCircle size={20} color={colors.primary} variant="Bold" />
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
