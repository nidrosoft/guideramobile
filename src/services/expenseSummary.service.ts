/**
 * EXPENSE SUMMARY SERVICE
 * 
 * Client-side service for the generate-expense-summary edge function.
 * Generates AI-powered post-trip expense summaries and caches results.
 */

import { supabase } from '@/lib/supabase/client';
import { invokeEdgeFn } from '@/utils/retry';

// ─── Types ──────────────────────────────────────

export interface BudgetVerdict {
  status: 'under_budget' | 'on_budget' | 'over_budget' | 'no_budget';
  amount_difference: number;
  currency: string;
  message: string;
}

export interface DailyAverage {
  amount: number;
  currency: string;
  context: string;
}

export interface TopCategory {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  highlight: string;
}

export interface BiggestExpense {
  amount: number;
  currency: string;
  description: string;
  day: number;
  category: string;
}

export interface CategoryBreakdownItem {
  category_id: string;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ExpenseSummary {
  headline: string;
  one_liner: string;
  budget_verdict: BudgetVerdict;
  daily_average: DailyAverage;
  top_category: TopCategory;
  biggest_single_expense: BiggestExpense;
  insights: string[];
  category_breakdown: CategoryBreakdownItem[];
  by_day_narrative: string;
  next_trip_note: string;
  generated_at: string;
  model_used: string;
  expense_count: number;
}

export interface ExpenseSummaryResult {
  success: boolean;
  summary?: ExpenseSummary;
  cached?: boolean;
  modelUsed?: string;
  error?: string;
}

// ─── Service ──────────────────────────────────────

class ExpenseSummaryService {
  /**
   * Generate or retrieve a cached expense summary for a trip.
   */
  async getSummary(tripId: string, forceRefresh = false): Promise<ExpenseSummaryResult> {
    const { data, error } = await invokeEdgeFn(supabase, 'generate-expense-summary', { tripId, forceRefresh }, 'fast');

    if (error) throw new Error(`Summary generation failed: ${error.message}`);
    if (!data?.success) throw new Error(data?.error || 'Failed to generate summary');

    return data as ExpenseSummaryResult;
  }

  /**
   * Get cached summary from the trips table without calling the edge function.
   * Returns null if no cached summary exists.
   */
  async getCachedSummary(tripId: string): Promise<ExpenseSummary | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('expense_summary')
      .eq('id', tripId)
      .single();

    if (error || !data?.expense_summary) return null;
    return data.expense_summary as ExpenseSummary;
  }
}

export const expenseSummaryService = new ExpenseSummaryService();
export default expenseSummaryService;
