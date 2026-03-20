/**
 * MY EXPENSES SCREEN
 * 
 * Consolidated view of all user expenses across trips + general.
 * Organized by year → month with category breakdowns and totals.
 * Accessible from Account → Saved & Collections → My Expenses.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft2, DollarCircle, ArrowDown2, ArrowUp2,
  Calendar, Receipt1,
} from 'iconsax-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { typography, spacing, borderRadius } from '@/styles';
import { expenseService } from '@/services/expense.service';
import { Expense, ExpenseCategory } from '@/features/trips/plugins/expenses/types/expense.types';

// Extended expense with trip name
interface ExpenseWithTrip extends Expense {
  tripTitle?: string;
}

// Category config
const CATEGORIES: { id: ExpenseCategory; name: string; emoji: string; color: string }[] = [
  { id: ExpenseCategory.FOOD, name: 'Food & Dining', emoji: '🍔', color: '#FF6B6B' },
  { id: ExpenseCategory.TRANSPORT, name: 'Transport', emoji: '🚗', color: '#4ECDC4' },
  { id: ExpenseCategory.ACCOMMODATION, name: 'Accommodation', emoji: '🏨', color: '#45B7D1' },
  { id: ExpenseCategory.ACTIVITIES, name: 'Activities', emoji: '🎭', color: '#96CEB4' },
  { id: ExpenseCategory.SHOPPING, name: 'Shopping', emoji: '🛍️', color: '#FFEAA7' },
  { id: ExpenseCategory.ENTERTAINMENT, name: 'Entertainment', emoji: '🎬', color: '#E17055' },
  { id: ExpenseCategory.HEALTH, name: 'Health', emoji: '💊', color: '#DDA0DD' },
  { id: ExpenseCategory.COMMUNICATION, name: 'Communication', emoji: '📱', color: '#0984E3' },
  { id: ExpenseCategory.TIPS, name: 'Tips', emoji: '💰', color: '#FDCB6E' },
  { id: ExpenseCategory.OTHER, name: 'Other', emoji: '📦', color: '#95A5A6' },
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Month Group Component ───

interface MonthGroup {
  key: string;
  year: number;
  month: number;
  label: string;
  expenses: ExpenseWithTrip[];
  total: number;
  categoryBreakdown: { category: ExpenseCategory; amount: number; percentage: number }[];
}

function MonthCard({ group, tc }: { group: MonthGroup; tc: any }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const getCatInfo = (cat: ExpenseCategory) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[6];

  return (
    <View style={[styles.monthCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
      {/* Month Header */}
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.monthHeader}>
        <View style={styles.monthLeft}>
          <View style={[styles.monthIcon, { backgroundColor: `${tc.primary}12` }]}>
            <Calendar size={18} color={tc.primary} variant="Bold" />
          </View>
          <View>
            <Text style={[styles.monthLabel, { color: tc.textPrimary }]}>{group.label}</Text>
            <Text style={[styles.monthCount, { color: tc.textTertiary }]}>
              {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.monthRight}>
          <Text style={[styles.monthTotal, { color: tc.textPrimary }]}>
            ${group.total.toFixed(2)}
          </Text>
          <View style={[styles.chevronWrap, { backgroundColor: `${tc.primary}12` }]}>
            {expanded
              ? <ArrowUp2 size={14} color={tc.primary} />
              : <ArrowDown2 size={14} color={tc.primary} />
            }
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.monthBody}>
          {/* Category Breakdown */}
          <View style={[styles.catBreakdown, { borderTopColor: tc.borderSubtle }]}>
            {group.categoryBreakdown.map(cat => {
              const info = getCatInfo(cat.category);
              return (
                <View key={cat.category} style={styles.catRow}>
                  <View style={styles.catLeft}>
                    <Text style={styles.catEmoji}>{info.emoji}</Text>
                    <Text style={[styles.catName, { color: tc.textPrimary }]}>{info.name}</Text>
                  </View>
                  <View style={styles.catRight}>
                    <View style={[styles.catBar, { backgroundColor: `${tc.textTertiary}15` }]}>
                      <View style={[styles.catBarFill, { width: `${cat.percentage}%`, backgroundColor: info.color }]} />
                    </View>
                    <Text style={[styles.catAmount, { color: tc.textSecondary }]}>${cat.amount.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Individual Expenses */}
          <View style={[styles.expList, { borderTopColor: tc.borderSubtle }]}>
            {group.expenses.map((exp, idx) => {
              const info = getCatInfo(exp.category);
              return (
                <View
                  key={exp.id}
                  style={[
                    styles.expRow,
                    idx < group.expenses.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tc.borderSubtle },
                  ]}
                >
                  <Text style={styles.expEmoji}>{info.emoji}</Text>
                  <View style={styles.expInfo}>
                    <Text style={[styles.expDesc, { color: tc.textPrimary }]} numberOfLines={1}>{exp.description}</Text>
                    <Text style={[styles.expMeta, { color: tc.textTertiary }]}>
                      {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {exp.tripTitle ? ` · ${exp.tripTitle}` : ''}
                      {exp.source === 'receipt_scan' ? ' · 📷' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.expAmount, { color: tc.textPrimary }]}>${exp.amount.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ───

export default function MyExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();

  const [expenses, setExpenses] = useState<ExpenseWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { expenses: data } = await expenseService.getAllUserExpenses(profile.id, { pageSize: 200 });
      setExpenses(data as ExpenseWithTrip[]);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses();
  }, [fetchExpenses]);

  // Group expenses by year → month
  const { monthGroups, yearTotals, grandTotal, topCategory } = useMemo(() => {
    const groups = new Map<string, MonthGroup>();
    const yearMap = new Map<number, number>();
    let total = 0;
    const catTotals = new Map<ExpenseCategory, number>();

    for (const exp of expenses) {
      const d = exp.date instanceof Date ? exp.date : new Date(exp.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          year,
          month,
          label: `${MONTH_NAMES[month]} ${year}`,
          expenses: [],
          total: 0,
          categoryBreakdown: [],
        });
      }

      const group = groups.get(key)!;
      group.expenses.push(exp);
      group.total += exp.amount;
      total += exp.amount;
      yearMap.set(year, (yearMap.get(year) || 0) + exp.amount);
      catTotals.set(exp.category, (catTotals.get(exp.category) || 0) + exp.amount);
    }

    // Build category breakdown per month
    for (const group of groups.values()) {
      const catMap = new Map<ExpenseCategory, number>();
      for (const exp of group.expenses) {
        catMap.set(exp.category, (catMap.get(exp.category) || 0) + exp.amount);
      }
      group.categoryBreakdown = Array.from(catMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: group.total > 0 ? (amount / group.total) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    // Sort by most recent first
    const sorted = Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Top category overall
    let topCat: { category: ExpenseCategory; amount: number } | null = null;
    for (const [cat, amt] of catTotals.entries()) {
      if (!topCat || amt > topCat.amount) topCat = { category: cat, amount: amt };
    }

    return {
      monthGroups: sorted,
      yearTotals: yearMap,
      grandTotal: total,
      topCategory: topCat,
    };
  }, [expenses]);

  // ─── Loading ───
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: tc.background, paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={tc.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: tc.bgSunken }]}>
          <ArrowLeft2 size={20} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>My Expenses</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: tc.bgCard, borderColor: tc.borderSubtle }]}>
          <View style={[styles.summaryIcon, { backgroundColor: `${tc.primary}12` }]}>
            <DollarCircle size={28} color={tc.primary} variant="Bold" />
          </View>
          <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>Total Spending</Text>
          <Text style={[styles.summaryTotal, { color: tc.textPrimary }]}>
            ${grandTotal.toFixed(2)}
          </Text>
          <View style={styles.summaryStats}>
            <View style={[styles.statChip, { backgroundColor: tc.bgSunken }]}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{expenses.length}</Text>
              <Text style={[styles.statLabel, { color: tc.textTertiary }]}>expenses</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: tc.bgSunken }]}>
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{monthGroups.length}</Text>
              <Text style={[styles.statLabel, { color: tc.textTertiary }]}>months</Text>
            </View>
            {topCategory && (
              <View style={[styles.statChip, { backgroundColor: tc.bgSunken }]}>
                <Text style={[styles.statValue, { color: tc.textPrimary }]}>
                  {CATEGORIES.find(c => c.id === topCategory.category)?.emoji || '📦'}
                </Text>
                <Text style={[styles.statLabel, { color: tc.textTertiary }]}>top</Text>
              </View>
            )}
          </View>
        </View>

        {/* Empty State */}
        {expenses.length === 0 && (
          <View style={styles.emptyState}>
            <Receipt1 size={48} color={tc.textTertiary} variant="Bold" />
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No Expenses Yet</Text>
            <Text style={[styles.emptySub, { color: tc.textSecondary }]}>
              Scan a receipt or add expenses from your trip to see them here
            </Text>
          </View>
        )}

        {/* Month Groups */}
        {monthGroups.map(group => (
          <MonthCard key={group.key} group={group} tc={tc} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: 12 },

  // Summary
  summaryCard: {
    borderRadius: 20, borderWidth: 1, padding: spacing.lg, alignItems: 'center',
  },
  summaryIcon: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  summaryLabel: { fontSize: typography.fontSize.sm, fontWeight: '500', marginBottom: 4 },
  summaryTotal: { fontSize: 32, fontWeight: '800', marginBottom: spacing.md },
  summaryStats: { flexDirection: 'row', gap: spacing.sm },
  statChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignItems: 'center',
  },
  statValue: { fontSize: typography.fontSize.base, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: '700', marginTop: spacing.md },
  emptySub: { fontSize: typography.fontSize.sm, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 },

  // Month Card
  monthCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
  },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  monthCount: { fontSize: typography.fontSize.xs, marginTop: 1 },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthTotal: { fontSize: typography.fontSize.base, fontWeight: '700' },
  chevronWrap: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },

  monthBody: {},

  // Category Breakdown
  catBreakdown: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  catEmoji: { fontSize: 16 },
  catName: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  catRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catAmount: { fontSize: typography.fontSize.xs, fontWeight: '600', width: 65, textAlign: 'right' },

  // Expense List
  expList: { paddingHorizontal: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  expEmoji: { fontSize: 20 },
  expInfo: { flex: 1 },
  expDesc: { fontSize: typography.fontSize.sm, fontWeight: '600' },
  expMeta: { fontSize: typography.fontSize.xs, marginTop: 2 },
  expAmount: { fontSize: typography.fontSize.sm, fontWeight: '700' },
});
