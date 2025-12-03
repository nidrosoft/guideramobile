import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
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
} from 'iconsax-react-native';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useTripStore } from '@/features/trips/stores/trip.store';
import { Expense, ExpenseCategory, CategoryInfo, ExpenseStats, PaymentMethod } from '../types/expense.types';
import AddExpenseBottomSheet from '../components/AddExpenseBottomSheet';
import BudgetSetupModal from '../components/BudgetSetupModal';
import * as Haptics from 'expo-haptics';
import { useToast } from '@/contexts/ToastContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Category configuration
const CATEGORIES: CategoryInfo[] = [
  { id: ExpenseCategory.FOOD, name: 'Food & Dining', icon: 'restaurant', color: '#10B981', emoji: '🍔' },
  { id: ExpenseCategory.TRANSPORT, name: 'Transportation', icon: 'car', color: '#3B82F6', emoji: '🚗' },
  { id: ExpenseCategory.ACCOMMODATION, name: 'Accommodation', icon: 'home', color: '#8B5CF6', emoji: '🏨' },
  { id: ExpenseCategory.ACTIVITIES, name: 'Activities', icon: 'activity', color: '#F59E0B', emoji: '🎭' },
  { id: ExpenseCategory.SHOPPING, name: 'Shopping', icon: 'shopping', color: '#EC4899', emoji: '🛍️' },
  { id: ExpenseCategory.HEALTH, name: 'Health', icon: 'health', color: '#EF4444', emoji: '💊' },
  { id: ExpenseCategory.OTHER, name: 'Other', icon: 'more', color: '#6B7280', emoji: '📦' },
];

// Mock expenses data
const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    tripId: '1',
    amount: 45.50,
    currency: 'USD',
    category: ExpenseCategory.FOOD,
    description: 'Lunch at Italian restaurant',
    date: new Date('2024-06-17T12:30:00'),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    createdAt: new Date('2024-06-17T12:30:00'),
  },
  {
    id: '2',
    tripId: '1',
    amount: 120.00,
    currency: 'USD',
    category: ExpenseCategory.TRANSPORT,
    description: 'Taxi to hotel',
    date: new Date('2024-06-17T10:00:00'),
    paymentMethod: PaymentMethod.CASH,
    createdAt: new Date('2024-06-17T10:00:00'),
  },
  {
    id: '3',
    tripId: '1',
    amount: 280.00,
    currency: 'USD',
    category: ExpenseCategory.ACCOMMODATION,
    description: 'Hotel night 1',
    date: new Date('2024-06-17'),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    createdAt: new Date('2024-06-17'),
  },
  {
    id: '4',
    tripId: '1',
    amount: 85.00,
    currency: 'USD',
    category: ExpenseCategory.ACTIVITIES,
    description: 'Museum tickets',
    date: new Date('2024-06-18T14:00:00'),
    paymentMethod: PaymentMethod.DEBIT_CARD,
    createdAt: new Date('2024-06-18T14:00:00'),
  },
  {
    id: '5',
    tripId: '1',
    amount: 32.00,
    currency: 'USD',
    category: ExpenseCategory.FOOD,
    description: 'Coffee and pastries',
    date: new Date('2024-06-18T09:00:00'),
    paymentMethod: PaymentMethod.CASH,
    createdAt: new Date('2024-06-18T09:00:00'),
  },
  {
    id: '6',
    tripId: '1',
    amount: 200.00,
    currency: 'USD',
    category: ExpenseCategory.TRANSPORT,
    description: 'Train tickets',
    date: new Date('2024-06-18T16:00:00'),
    paymentMethod: PaymentMethod.DIGITAL_WALLET,
    createdAt: new Date('2024-06-18T16:00:00'),
  },
  {
    id: '7',
    tripId: '1',
    amount: 99.00,
    currency: 'USD',
    category: ExpenseCategory.ACTIVITIES,
    description: 'City tour',
    date: new Date('2024-06-19T10:00:00'),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    createdAt: new Date('2024-06-19T10:00:00'),
  },
  {
    id: '8',
    tripId: '1',
    amount: 67.50,
    currency: 'USD',
    category: ExpenseCategory.FOOD,
    description: 'Dinner at local restaurant',
    date: new Date('2024-06-19T19:00:00'),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    createdAt: new Date('2024-06-19T19:00:00'),
  },
];

const MOCK_BUDGET = 2000;

export default function ExpensesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess } = useToast();
  const tripId = params.tripId as string;
  const trip = useTripStore(state => state.trips.find(t => t.id === tripId));

  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [budget, setBudget] = useState(MOCK_BUDGET);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [budgetSetupVisible, setBudgetSetupVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Trip not found</Text>
      </SafeAreaView>
    );
  }

  // Calculate statistics
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

    const tripDays = trip.endDate && trip.startDate
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

  const handleAddExpense = (expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    if (editingExpense) {
      // Update existing expense
      setExpenses(expenses.map(e =>
        e.id === editingExpense.id
          ? { ...expense, id: e.id, tripId: e.tripId, createdAt: e.createdAt }
          : e
      ));
      showSuccess('Expense updated!');
      setEditingExpense(null);
    } else {
      // Add new expense
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
        tripId,
        createdAt: new Date(),
      };
      setExpenses([newExpense, ...expenses]);
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

  const handleDeleteExpense = (expenseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpenses(expenses.filter(e => e.id !== expenseId));
    showSuccess('Expense deleted');
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
      case ExpenseCategory.HEALTH:
        return <Health {...iconProps} />;
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

  // Prepare chart data
  const pieChartData = stats.categoryTotals.map((cat, index) => ({
    name: CATEGORIES.find(c => c.id === cat.category)?.name || '',
    population: cat.amount,
    color: cat.color,
    legendFontColor: colors.gray700,
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.gray900} variant="Linear" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddExpenseVisible(true)}
          >
            <Add size={24} color={colors.primary} variant="Bold" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Budget Progress Card */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetIconContainer}>
                <DollarCircle size={24} color={colors.primary} variant="Bold" />
              </View>
              <View style={styles.budgetTextContainer}>
                <Text style={styles.budgetTitle}>Track Your Spending</Text>
                <Text style={styles.budgetSubtitle}>
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
            <View style={styles.progressBarContainer}>
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
              <Text style={styles.budgetRemaining}>
                {formatCurrency(stats.budgetRemaining)} remaining
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
              onPress={() => setActiveTab('analytics')}
            >
              <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
                Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' ? (
            <View>
              {/* Category Breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>By Category</Text>
                {stats.categoryTotals.map(cat => {
                  const categoryInfo = CATEGORIES.find(c => c.id === cat.category)!;
                  return (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.categoryIconContainer, { backgroundColor: `${cat.color}15` }]}>
                          {getCategoryIcon(cat.category, 20, cat.color)}
                        </View>
                        <View>
                          <Text style={styles.categoryName}>{categoryInfo.name}</Text>
                          <Text style={styles.categoryAmount}>{formatCurrency(cat.amount)}</Text>
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
                        <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(0)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recent Expenses */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Expenses</Text>
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
                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                          <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                        </View>
                      </View>
                      <View style={styles.expenseRight}>
                        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
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
          ) : (
            <View>
              {/* Analytics Tab */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Spending by Category</Text>
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
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Spending (Last 7 Days)</Text>
                {barChartData.datasets[0].data.length > 0 && (
                  <View style={styles.chartContainer}>
                    <BarChart
                      data={barChartData}
                      width={SCREEN_WIDTH - spacing.lg * 2}
                      height={220}
                      yAxisLabel="$"
                      yAxisSuffix=""
                      chartConfig={{
                        backgroundColor: colors.white,
                        backgroundGradientFrom: colors.white,
                        backgroundGradientTo: colors.white,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatCurrency(stats.averagePerDay)}</Text>
                  <Text style={styles.statLabel}>Avg per Day</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {stats.highestExpense ? formatCurrency(stats.highestExpense.amount) : '$0'}
                  </Text>
                  <Text style={styles.statLabel}>Highest</Text>
                </View>
              </View>

              {stats.categoryTotals.length > 0 && (
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {CATEGORIES.find(c => c.id === stats.categoryTotals[0].category)?.emoji}
                    </Text>
                    <Text style={styles.statLabel}>Top Category</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{expenses.length}</Text>
                    <Text style={styles.statLabel}>Total Expenses</Text>
                  </View>
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
        />

        {/* Budget Setup Modal */}
        <BudgetSetupModal
          visible={budgetSetupVisible}
          onClose={() => setBudgetSetupVisible(false)}
          onSave={setBudget}
          currentBudget={budget}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
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
    color: colors.gray900,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  budgetCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: `${colors.primary}15`,
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
    color: colors.gray900,
    marginBottom: 4,
  },
  budgetSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
  },
  editBudgetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
  },
  editBudgetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray200,
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
    color: colors.gray600,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
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
    color: colors.gray600,
  },
  tabTextActive: {
    color: colors.white,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray900,
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
    color: colors.gray900,
  },
  categoryAmount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
  },
  categoryRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray200,
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
    color: colors.gray700,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    color: colors.gray900,
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  },
  expenseRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  expenseAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.gray900,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  chart: {
    borderRadius: borderRadius.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    textAlign: 'center',
  },
});
