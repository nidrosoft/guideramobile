import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, BarChart } from 'react-native-chart-kit';
import {
  ArrowLeft,
  Add,
  DollarCircle,
  ShoppingCart,
  Car,
  Home2,
  Activity,
  Bag2,
  Health,
  More,
  Trash,
  Receipt1,
  VideoPlay,
  Call,
  MoneyRecive,
} from 'iconsax-react-native';
import { spacing, typography, borderRadius, colors } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { Expense, ExpenseCategory, CategoryInfo, ExpenseStats, PaymentMethod } from '../types/expense.types';
import AddExpenseBottomSheet from '../components/AddExpenseBottomSheet';
import BudgetSetupModal from '../components/BudgetSetupModal';
import * as Haptics from 'expo-haptics';
import { useToast } from '@/contexts/ToastContext';
import { expenseService } from '@/services/expense.service';
import { expenseSummaryService, ExpenseSummary } from '@/services/expenseSummary.service';
import { useAuth } from '@/context/AuthContext';
import PluginEmptyState from '@/features/trips/components/PluginEmptyState';
import PluginErrorState from '@/features/trips/components/PluginErrorState';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Category configuration
const CATEGORIES: CategoryInfo[] = [
  { id: ExpenseCategory.FOOD, name: 'Food & Dining', icon: 'restaurant', color: colors.success, emoji: '🍔' },
  { id: ExpenseCategory.TRANSPORT, name: 'Transportation', icon: 'car', color: colors.info, emoji: '🚗' },
  { id: ExpenseCategory.ACCOMMODATION, name: 'Accommodation', icon: 'home', color: colors.purple, emoji: '🏨' },
  { id: ExpenseCategory.ACTIVITIES, name: 'Activities', icon: 'activity', color: colors.warning, emoji: '🎭' },
  { id: ExpenseCategory.SHOPPING, name: 'Shopping', icon: 'shopping', color: colors.pink, emoji: '🛍️' },
  { id: ExpenseCategory.ENTERTAINMENT, name: 'Entertainment', icon: 'entertainment', color: '#E17055', emoji: '🎬' },
  { id: ExpenseCategory.HEALTH, name: 'Health', icon: 'health', color: colors.error, emoji: '💊' },
  { id: ExpenseCategory.COMMUNICATION, name: 'Communication', icon: 'communication', color: '#0984E3', emoji: '📱' },
  { id: ExpenseCategory.TIPS, name: 'Tips', icon: 'tips', color: '#FDCB6E', emoji: '💰' },
  { id: ExpenseCategory.OTHER, name: 'Other', icon: 'more', color: colors.gray500, emoji: '📦' },
];

export default function ExpensesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));
  const { showSuccess } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'summary'>('overview');
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [budgetSetupVisible, setBudgetSetupVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesData, budgetData] = await Promise.all([
        expenseService.getExpenses(tripId),
        expenseService.getTripBudget(tripId),
      ]);
      setExpenses(expensesData);
      if (budgetData.total > 0) setBudget(budgetData.total);
      if (budgetData.currency) setBudgetCurrency(budgetData.currency);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  // Calculate statistics (must be above early returns to satisfy Rules of Hooks)
  const stats: ExpenseStats = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetRemaining = budget - totalSpent;
    const percentageUsed = (totalSpent / budget) * 100;

    // Calculate category totals
    const categoryMap = new Map<ExpenseCategory, number>();
    expenses.forEach(exp => {
      categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
    });

    const categoryTotals = Array.from(categoryMap.entries()).map(([category, amount]) => {
      const categoryInfo = CATEGORIES.find(c => c.id === category)!;
      return {
        category,
        amount,
        percentage: (amount / totalSpent) * 100,
        color: categoryInfo.color,
      };
    }).sort((a, b) => b.amount - a.amount);

    // Calculate daily totals
    const dailyMap = new Map<string, number>();
    expenses.forEach(exp => {
      const dateKey = exp.date.toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + exp.amount);
    });

    const dailyTotals = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tripDays = trip?.endDate && trip?.startDate
      ? Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const averagePerDay = totalSpent / Math.max(dailyTotals.length, 1);

    const highestExpense = expenses.reduce((max, exp) =>
      exp.amount > (max?.amount || 0) ? exp : max
    , expenses[0] || null);

    return {
      totalSpent,
      budgetRemaining,
      percentageUsed,
      averagePerDay,
      highestExpense,
      categoryTotals,
      dailyTotals,
    };
  }, [expenses, budget, trip]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <PluginErrorState message={error} onRetry={fetchExpenses} />
      </View>
    );
  }

  const handleAddExpense = async (expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    try {
      if (editingExpense) {
        const updated = await expenseService.updateExpense(editingExpense.id, {
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
          paymentMethod: expense.paymentMethod,
        });
        setExpenses(expenses.map(e => e.id === editingExpense.id ? updated : e));
        showSuccess('Expense updated!');
        setEditingExpense(null);
      } else {
        const newExpense = await expenseService.addExpense(tripId, profile?.id ?? '', {
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
          paymentMethod: expense.paymentMethod,
        });
        setExpenses([newExpense, ...expenses]);
      }
    } catch (err) {
      console.error('Failed to save expense:', err);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setAddExpenseVisible(true);
  };

  const handleCloseExpenseSheet = () => {
    setAddExpenseVisible(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpenses(expenses.filter(e => e.id !== expenseId));
    showSuccess('Expense deleted');
    try {
      await expenseService.deleteExpense(expenseId);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleGenerateSummary = async (forceRefresh = false) => {
    if (expenses.length === 0) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const result = await expenseSummaryService.getSummary(tripId, forceRefresh);
      if (result.summary) {
        setSummary(result.summary);
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setSummaryError(err.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Auto-fetch summary when switching to summary tab
  const handleTabChange = (tab: 'overview' | 'analytics' | 'summary') => {
    setActiveTab(tab);
    if (tab === 'summary' && !summary && !summaryLoading && expenses.length > 0) {
      handleGenerateSummary();
    }
  };

  const getCategoryIcon = (category: ExpenseCategory, size: number = 24, color: string) => {
    const iconProps = { size, color, variant: 'Bold' as const };
    switch (category) {
      case ExpenseCategory.FOOD:
        return <ShoppingCart {...iconProps} />;
      case ExpenseCategory.TRANSPORT:
        return <Car {...iconProps} />;
      case ExpenseCategory.ACCOMMODATION:
        return <Home2 {...iconProps} />;
      case ExpenseCategory.ACTIVITIES:
        return <Activity {...iconProps} />;
      case ExpenseCategory.SHOPPING:
        return <Bag2 {...iconProps} />;
      case ExpenseCategory.ENTERTAINMENT:
        return <VideoPlay {...iconProps} />;
      case ExpenseCategory.HEALTH:
        return <Health {...iconProps} />;
      case ExpenseCategory.COMMUNICATION:
        return <Call {...iconProps} />;
      case ExpenseCategory.TIPS:
        return <MoneyRecive {...iconProps} />;
      default:
        return <More {...iconProps} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getProgressColor = () => {
    if (stats.percentageUsed < 70) return colors.success;
    if (stats.percentageUsed < 90) return colors.warning;
    return colors.error;
  };

  if (expenses.length === 0) {
    return (
      <>
        <PluginEmptyState
          headerTitle="Expenses"
          icon={<DollarCircle size={36} color={colors.success} variant="Bold" />}
          iconColor={colors.success}
          title="No Expenses Yet"
          subtitle="Start tracking your spending by adding your first expense. Scan a receipt or add one manually — your trip budget starts here."
          ctaLabel="Add Expense"
          onCtaPress={() => setAddExpenseVisible(true)}
          headerRight={
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setAddExpenseVisible(true)}
            >
              <Add size={24} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
          }
        />
        <AddExpenseBottomSheet
          visible={addExpenseVisible}
          onClose={handleCloseExpenseSheet}
          onAdd={handleAddExpense}
          categories={CATEGORIES}
          editingExpense={editingExpense}
          defaultCurrency={budgetCurrency}
        />
      </>
    );
  }

  // Prepare chart data
  const pieChartData = stats.categoryTotals.map((cat, index) => ({
    name: CATEGORIES.find(c => c.id === cat.category)?.name || '',
    population: cat.amount,
    color: cat.color,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const barChartData = {
    labels: stats.dailyTotals.slice(-7).map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [{
      data: stats.dailyTotals.slice(-7).map(d => d.amount),
    }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bgPrimary, borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Expenses</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push({ pathname: '/expenses/scan-receipt', params: { tripId } } as any)}
            >
              <Receipt1 size={20} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddExpenseVisible(true)}
            >
              <Add size={24} color={colors.primary} variant="Bold" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Budget Progress Card */}
          <View style={[styles.budgetCard, { backgroundColor: colors.bgCard }]}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetIconContainer}>
                <DollarCircle size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.budgetTextContainer}>
                <Text style={[styles.budgetTitle, { color: colors.textPrimary }]}>Track Your Spending</Text>
                <Text style={[styles.budgetSubtitle, { color: colors.textSecondary }]}>
                  {formatCurrency(stats.totalSpent)} of {formatCurrency(budget)} spent
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBudgetButton}
                onPress={() => setBudgetSetupVisible(true)}
              >
                <Text style={styles.editBudgetText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.borderMedium }]}>
              <LinearGradient
                colors={[getProgressColor(), `${getProgressColor()}80`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.min(stats.percentageUsed, 100)}%` }]}
              />
            </View>

            <View style={styles.budgetStats}>
              <Text style={[styles.budgetPercentage, { color: getProgressColor() }]}>
                {stats.percentageUsed.toFixed(1)}%
              </Text>
              <Text style={[styles.budgetRemaining, { color: colors.textSecondary }]}>
                {formatCurrency(stats.budgetRemaining)} remaining
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.bgSecondary }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => handleTabChange('overview')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
              onPress={() => handleTabChange('analytics')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'analytics' && styles.tabTextActive]}>
                Analytics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
              onPress={() => handleTabChange('summary')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'summary' && styles.tabTextActive]}>
                Summary
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View>
              {/* Category Breakdown */}
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>By Category</Text>
                {stats.categoryTotals.map(cat => {
                  const categoryInfo = CATEGORIES.find(c => c.id === cat.category)!;
                  return (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.categoryIconContainer, { backgroundColor: `${cat.color}15` }]}>
                          {getCategoryIcon(cat.category, 20, cat.color)}
                        </View>
                        <View>
                          <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{categoryInfo.name}</Text>
                          <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>{formatCurrency(cat.amount)}</Text>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <View style={styles.categoryBarContainer}>
                          <View
                            style={[
                              styles.categoryBar,
                              {
                                width: `${cat.percentage}%`,
                                backgroundColor: cat.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>{cat.percentage.toFixed(0)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recent Expenses */}
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Expenses</Text>
                {expenses.slice(0, 10).map(expense => {
                  const categoryInfo = CATEGORIES.find(c => c.id === expense.category)!;
                  return (
                    <TouchableOpacity
                      key={expense.id}
                      style={styles.expenseItem}
                      onPress={() => handleEditExpense(expense)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.expenseLeft}>
                        <View style={[styles.expenseIconContainer, { backgroundColor: `${categoryInfo.color}15` }]}>
                          {getCategoryIcon(expense.category, 24, categoryInfo.color)}
                        </View>
                        <View style={styles.expenseInfo}>
                          <Text style={[styles.expenseDescription, { color: colors.textPrimary }]}>{expense.description}</Text>
                          <Text style={[styles.expenseDate, { color: colors.textTertiary }]}>{formatDate(expense.date)}</Text>
                        </View>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={[styles.expenseAmount, { color: colors.textPrimary }]}>{formatCurrency(expense.amount)}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense.id);
                          }}
                        >
                          <Trash size={18} color={colors.error} variant="Bold" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'analytics' && (
            <View>
              {/* Analytics Tab */}
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Spending by Category</Text>
                {pieChartData.length > 0 && (
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={pieChartData}
                      width={SCREEN_WIDTH - spacing.lg * 2}
                      height={220}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  </View>
                )}
              </View>

              {/* Daily Spending Trend */}
              <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Spending (Last 7 Days)</Text>
                {barChartData.datasets[0].data.length > 0 && (
                  <View style={styles.chartContainer}>
                    <BarChart
                      data={barChartData}
                      width={SCREEN_WIDTH - spacing.lg * 2}
                      height={220}
                      yAxisLabel="$"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: colors.bgCard,
                        backgroundGradientFrom: colors.bgCard,
                        backgroundGradientTo: colors.bgCard,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16,
                        },
                      }}
                      style={styles.chart}
                      showValuesOnTopOfBars
                    />
                  </View>
                )}
              </View>

              {/* Stats Cards */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{formatCurrency(stats.averagePerDay)}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg per Day</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {stats.highestExpense ? formatCurrency(stats.highestExpense.amount) : '$0'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</Text>
                </View>
              </View>

              {stats.categoryTotals.length > 0 && (
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {CATEGORIES.find(c => c.id === stats.categoryTotals[0].category)?.emoji}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Top Category</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{expenses.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'summary' && (
            <View>
              {/* Summary Tab — AI-Generated Post-Trip Summary */}
              {summaryLoading && (
                <View style={styles.summaryLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.summaryLoadingText, { color: colors.textPrimary }]}>
                    Analyzing your expenses...
                  </Text>
                  <Text style={[styles.summaryLoadingSubtext, { color: colors.textSecondary }]}>
                    AI is crafting your trip spending summary
                  </Text>
                </View>
              )}

              {summaryError && !summaryLoading && (
                <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                  <Text style={[styles.summaryErrorText, { color: colors.error }]}>{summaryError}</Text>
                  <TouchableOpacity
                    style={[styles.summaryRetryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleGenerateSummary(true)}
                  >
                    <Text style={styles.summaryRetryText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {expenses.length === 0 && !summaryLoading && (
                <View style={[styles.section, { backgroundColor: colors.bgCard, alignItems: 'center', paddingVertical: spacing.xl }]}>
                  <DollarCircle size={48} color={colors.textTertiary} variant="Bold" />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.md }]}>No Expenses Yet</Text>
                  <Text style={[styles.summaryLoadingSubtext, { color: colors.textSecondary }]}>
                    Add some expenses to generate your AI summary
                  </Text>
                </View>
              )}

              {summary && !summaryLoading && (
                <View>
                  {/* Headline Card */}
                  <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.summaryHeadline, { color: colors.textPrimary }]}>
                      {summary.headline}
                    </Text>
                    <Text style={[styles.summaryOneLiner, { color: colors.textSecondary }]}>
                      {summary.one_liner}
                    </Text>
                  </View>

                  {/* Budget Verdict */}
                  {summary.budget_verdict && (
                    <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                      <View style={styles.summaryVerdictHeader}>
                        <View style={[
                          styles.summaryVerdictBadge,
                          {
                            backgroundColor: summary.budget_verdict.status === 'under_budget'
                              ? `${colors.success}15`
                              : summary.budget_verdict.status === 'over_budget'
                                ? `${colors.error}15`
                                : `${colors.warning}15`,
                          },
                        ]}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: summary.budget_verdict.status === 'under_budget'
                              ? colors.success
                              : summary.budget_verdict.status === 'over_budget'
                                ? colors.error
                                : colors.warning,
                          }}>
                            {summary.budget_verdict.status === 'under_budget' ? 'Under Budget' :
                              summary.budget_verdict.status === 'over_budget' ? 'Over Budget' :
                                summary.budget_verdict.status === 'on_budget' ? 'On Budget' : 'No Budget Set'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.summaryVerdictMessage, { color: colors.textSecondary }]}>
                        {summary.budget_verdict.message}
                      </Text>
                    </View>
                  )}

                  {/* Daily Average + Biggest Expense */}
                  <View style={styles.statsGrid}>
                    {summary.daily_average && (
                      <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {summary.daily_average.currency} {summary.daily_average.amount.toFixed(0)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Daily Avg</Text>
                      </View>
                    )}
                    {summary.biggest_single_expense && (
                      <View style={[styles.statCard, { backgroundColor: colors.bgCard }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {summary.biggest_single_expense.currency} {summary.biggest_single_expense.amount.toFixed(0)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Biggest</Text>
                      </View>
                    )}
                  </View>

                  {/* Top Category Highlight */}
                  {summary.top_category && (
                    <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Category</Text>
                      <View style={styles.summaryTopCatRow}>
                        <Text style={styles.summaryTopCatEmoji}>
                          {CATEGORIES.find(c => c.id === summary.top_category.category_id)?.emoji || '📊'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.summaryTopCatName, { color: colors.textPrimary }]}>
                            {summary.top_category.category_name}
                          </Text>
                          <Text style={[styles.summaryTopCatHighlight, { color: colors.textSecondary }]}>
                            {summary.top_category.highlight}
                          </Text>
                        </View>
                        <Text style={[styles.summaryTopCatPercent, { color: colors.primary }]}>
                          {summary.top_category.percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* AI Insights */}
                  {summary.insights && summary.insights.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Insights</Text>
                      {summary.insights.map((insight, idx) => (
                        <View key={idx} style={styles.summaryInsightRow}>
                          <Text style={styles.summaryInsightBullet}>💡</Text>
                          <Text style={[styles.summaryInsightText, { color: colors.textSecondary }]}>
                            {insight}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Category Breakdown */}
                  {summary.category_breakdown && summary.category_breakdown.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Breakdown</Text>
                      {summary.category_breakdown.map((cat, idx) => (
                        <View key={idx} style={styles.summaryCatRow}>
                          <Text style={styles.summaryCatIcon}>{cat.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.summaryCatName, { color: colors.textPrimary }]}>{cat.name}</Text>
                            <Text style={[styles.summaryCatCount, { color: colors.textTertiary }]}>
                              {cat.count} expense{cat.count !== 1 ? 's' : ''}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.summaryCatAmount, { color: colors.textPrimary }]}>
                              {formatCurrency(cat.amount)}
                            </Text>
                            <Text style={[styles.summaryCatPercent, { color: colors.textTertiary }]}>
                              {cat.percentage.toFixed(0)}%
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Day-by-Day Narrative */}
                  {summary.by_day_narrative && (
                    <View style={[styles.section, { backgroundColor: colors.bgCard }]}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Day-by-Day</Text>
                      <Text style={[styles.summaryNarrative, { color: colors.textSecondary }]}>
                        {summary.by_day_narrative}
                      </Text>
                    </View>
                  )}

                  {/* Next Trip Note */}
                  {summary.next_trip_note && (
                    <View style={[styles.section, { backgroundColor: `${colors.primary}08`, borderWidth: 1, borderColor: `${colors.primary}20` }]}>
                      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Next Trip Tip</Text>
                      <Text style={[styles.summaryNarrative, { color: colors.textSecondary }]}>
                        {summary.next_trip_note}
                      </Text>
                    </View>
                  )}

                  {/* Refresh Button */}
                  <TouchableOpacity
                    style={[styles.summaryRefreshBtn, { borderColor: colors.borderSubtle }]}
                    onPress={() => handleGenerateSummary(true)}
                  >
                    <Text style={[styles.summaryRefreshText, { color: colors.textSecondary }]}>
                      Regenerate Summary
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Expense Bottom Sheet */}
        <AddExpenseBottomSheet
          visible={addExpenseVisible}
          onClose={handleCloseExpenseSheet}
          onAdd={handleAddExpense}
          categories={CATEGORIES}
          editingExpense={editingExpense}
          defaultCurrency={budgetCurrency}
        />

        {/* Budget Setup Modal */}
        <BudgetSetupModal
          visible={budgetSetupVisible}
          onClose={() => setBudgetSetupVisible(false)}
          onSave={async (newBudget: number) => {
            setBudget(newBudget);
            try {
              await expenseService.saveTripBudget(tripId, newBudget);
            } catch (err) {
              console.error('Failed to save budget:', err);
            }
          }}
          currentBudget={budget}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  budgetCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  budgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 195, 158, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  budgetTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  editBudgetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(63, 195, 158, 0.06)',
  },
  editBudgetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetPercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  budgetRemaining: {
    fontSize: typography.fontSize.sm,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: typography.fontSize.xs,
  },
  categoryRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    marginBottom: 4,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: typography.fontSize.xs,
  },
  expenseRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  expenseAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  chart: {
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  summaryLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  summaryLoadingText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  summaryLoadingSubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  summaryErrorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRetryBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  summaryRetryText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  summaryHeadline: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  summaryOneLiner: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  summaryVerdictHeader: {
    marginBottom: spacing.sm,
  },
  summaryVerdictBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  summaryVerdictMessage: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  summaryTopCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  summaryTopCatEmoji: {
    fontSize: 32,
  },
  summaryTopCatName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  summaryTopCatHighlight: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  summaryTopCatPercent: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  summaryInsightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryInsightBullet: {
    fontSize: 16,
    marginTop: 1,
  },
  summaryInsightText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  summaryCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  summaryCatIcon: {
    fontSize: 24,
  },
  summaryCatName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  summaryCatCount: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  summaryCatAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  summaryCatPercent: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  summaryNarrative: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  summaryRefreshBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryRefreshText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
