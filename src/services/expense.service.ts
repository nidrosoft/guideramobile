import { supabase } from '@/lib/supabase/client';
import {
  Expense,
  ExpenseSource,
  ExpenseStats,
  CategoryTotal,
} from '@/features/trips/plugins/expenses/types/expense.types';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  transport: '#4ECDC4',
  accommodation: '#45B7D1',
  activities: '#96CEB4',
  shopping: '#FFEAA7',
  entertainment: '#E17055',
  health: '#DDA0DD',
  communication: '#0984E3',
  tips: '#FDCB6E',
  other: '#95A5A6',
};

function fromDb(row: any): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    category: row.category,
    description: row.description,
    date: new Date(row.date),
    paymentMethod: row.payment_method,
    merchant: row.merchant ?? undefined,
    receipt: row.receipt_url ?? undefined,
    notes: row.notes ?? undefined,
    source: (row.source as ExpenseSource) ?? 'manual',
    createdAt: new Date(row.created_at),
  };
}

class ExpenseService {
  async getExpenses(tripId: string, limit = 500): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map(fromDb);
  }

  async addExpense(
    tripId: string,
    userId: string,
    input: {
      amount: number;
      currency: string;
      category: string;
      description: string;
      merchant?: string;
      date: string;
      paymentMethod: string;
      notes?: string;
      source?: ExpenseSource;
    },
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        user_id: userId,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        description: input.description,
        merchant: input.merchant ?? null,
        date: input.date,
        payment_method: input.paymentMethod,
        notes: input.notes ?? null,
        source: input.source ?? 'manual',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Check budget and fire warning notification if approaching/exceeded
    try {
      const { data: trip } = await supabase
        .from('trips')
        .select('title, destination, budget_amount, budget_currency')
        .eq('id', tripId)
        .single();

      if (trip?.budget_amount && trip.budget_amount > 0) {
        const { data: allExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('trip_id', tripId);

        const totalSpent = (allExpenses || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const percentUsed = Math.round((totalSpent / trip.budget_amount) * 100);

        if (percentUsed >= 80) {
          const { notifyBudgetWarning } = await import('@/services/notifications/community-notifications');
          await notifyBudgetWarning(
            userId, tripId,
            trip.title || trip.destination || 'Your trip',
            percentUsed, trip.budget_amount, totalSpent,
            trip.budget_currency || input.currency,
          );
        }
      }
    } catch (e) { if (__DEV__) console.warn('Operation failed:', e); }

    return fromDb(data);
  }

  async updateExpense(
    expenseId: string,
    updates: Partial<Record<string, any>>,
  ): Promise<Expense> {
    const dbUpdates: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      paymentMethod: 'payment_method',
      receiptUrl: 'receipt_url',
      tripId: 'trip_id',
      userId: 'user_id',
    };

    for (const [key, value] of Object.entries(updates)) {
      dbUpdates[fieldMap[key] ?? key] = value;
    }
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('expenses')
      .update(dbUpdates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return fromDb(data);
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw new Error(error.message);
  }

  async addBulkExpenses(
    tripId: string,
    userId: string,
    items: Array<{
      amount: number;
      currency: string;
      category: string;
      description: string;
      date: string;
      paymentMethod: string;
      notes?: string;
      receiptUrl?: string;
    }>,
  ): Promise<Expense[]> {
    const rows = items.map(item => ({
      trip_id: tripId,
      user_id: userId,
      amount: item.amount,
      currency: item.currency,
      category: item.category,
      description: item.description,
      date: item.date,
      payment_method: item.paymentMethod,
      notes: item.notes ?? null,
      receipt_url: item.receiptUrl ?? null,
      source: 'receipt_scan' as const,
    }));

    const { data, error } = await supabase
      .from('expenses')
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return (data ?? []).map(fromDb);
  }

  async getTripBudget(tripId: string): Promise<{ total: number; currency: string }> {
    const { data, error } = await supabase
      .from('trips')
      .select('budget_total, budget_currency')
      .eq('id', tripId)
      .single();

    if (error) throw new Error(error.message);
    return {
      total: parseFloat(data?.budget_total ?? '0') || 0,
      currency: data?.budget_currency || 'USD',
    };
  }

  async saveTripBudget(tripId: string, total: number, currency: string = 'USD'): Promise<void> {
    const { error } = await supabase
      .from('trips')
      .update({ budget_total: total, budget_currency: currency, updated_at: new Date().toISOString() })
      .eq('id', tripId);

    if (error) throw new Error(error.message);
  }

  async getAllUserExpenses(
    userId: string,
    options: { page?: number; pageSize?: number } = {},
  ): Promise<{ expenses: Expense[]; hasMore: boolean }> {
    const page = options.page ?? 0;
    const pageSize = options.pageSize ?? 50;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('expenses')
      .select('*, trips!inner(title, destination)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(from, to + 1); // fetch one extra to detect hasMore

    if (error) {
      // Fallback without join if trips relation fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .range(from, to + 1);

      if (fallbackError) throw new Error(fallbackError.message);
      const rows = (fallbackData ?? []);
      const hasMore = rows.length > pageSize;
      return {
        expenses: rows.slice(0, pageSize).map(fromDb),
        hasMore,
      };
    }

    const rows = data ?? [];
    const hasMore = rows.length > pageSize;
    return {
      expenses: rows.slice(0, pageSize).map((row: any) => ({
        ...fromDb(row),
        tripTitle: row.trips?.title || row.trips?.destination?.city || undefined,
      })),
      hasMore,
    };
  }

  async getStats(tripId: string, budgetTotal?: number): Promise<ExpenseStats> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (error) throw new Error(error.message);

    const expenses = (data ?? []).map(fromDb);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = budgetTotal ?? 0;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const expense of expenses) {
      const current = categoryMap.get(expense.category) ?? 0;
      categoryMap.set(expense.category, current + expense.amount);
    }

    const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({
        category: category as any,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
        color: CATEGORY_COLORS[category] ?? '#95A5A6',
      }),
    );
    categoryTotals.sort((a, b) => b.amount - a.amount);

    // Daily totals
    const dailyMap = new Map<string, number>();
    for (const expense of expenses) {
      const dateKey = expense.date.toISOString().split('T')[0];
      const current = dailyMap.get(dateKey) ?? 0;
      dailyMap.set(dateKey, current + expense.amount);
    }
    const dailyTotals = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const numDays = dailyTotals.length || 1;
    const highestExpense = expenses.length > 0
      ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0])
      : null;

    return {
      totalSpent,
      budgetRemaining: budget - totalSpent,
      percentageUsed: budget > 0 ? Math.round((totalSpent / budget) * 100) : 0,
      averagePerDay: Math.round((totalSpent / numDays) * 100) / 100,
      highestExpense,
      categoryTotals,
      dailyTotals,
    };
  }
}

export const expenseService = new ExpenseService();
export default expenseService;
