/**
 * Budget module — a gentle spend check while traveling (only when nearing the
 * budget) and a one-time spending summary after the trip. Uses `expenses`
 * and the trip's `budget_total`.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';

async function spendTotal(supabase: SupabaseClient, tripId: string): Promise<{ total: number; count: number }> {
  const { data } = await supabase
    .from('expenses')
    .select('amount')
    .eq('trip_id', tripId)
    .limit(1000);
  if (!Array.isArray(data)) return { total: 0, count: 0 };
  const total = data.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  return { total, count: data.length };
}

function money(amount: number, currency: string): string {
  const c = currency || 'USD';
  return `${Math.round(amount).toLocaleString('en-US')} ${c}`;
}

const budget: NotificationModule = {
  key: 'budget',
  categoryCode: 'trip_tips',
  alertTypeCode: 'budget_tip',
  phases: ['during', 'after'],

  quota(ctx: TripContext): number {
    if (ctx.phase === 'during') return 1; // conditional — gated in selectCandidates
    if (ctx.phase === 'after' && ctx.daysAfterEnd <= 1) return 1;
    return 0;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const currency = ctx.trip.budget_currency || 'USD';
    const budgetTotal = Number(ctx.trip.budget_total) || 0;

    if (ctx.phase === 'after') {
      const ref = 'summary';
      if (ctx.alreadySent.has(`budget:${ref}`)) return [];
      const { total, count } = await spendTotal(supabase, ctx.trip.id);
      if (count === 0) return [];
      return [
        {
          contentRef: ref,
          title: '💰 Your trip spending',
          body: `Trip wrapped! You logged ${money(total, currency)} across ${count} expense${count === 1 ? '' : 's'}. Tap for the breakdown.`,
          priority: 3,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'budget', kind: 'summary' },
          weight: 28,
        },
      ];
    }

    // during — only if a budget is set and spend has crossed 70%.
    if (budgetTotal <= 0) return [];
    const ref = `budget:${ctx.localDate}`;
    if (ctx.alreadySent.has(`budget:${ref}`)) return [];
    const { total } = await spendTotal(supabase, ctx.trip.id);
    const pct = Math.round((total / budgetTotal) * 100);
    if (pct < 70) return [];

    const over = pct >= 100;
    return [
      {
        contentRef: ref,
        title: over ? '💰 Over budget' : '💰 Budget check',
        body: over
          ? `You've spent ${money(total, currency)} — past your ${money(budgetTotal, currency)} budget. Worth a quick review.`
          : `You're at ${pct}% of your ${money(budgetTotal, currency)} budget (${money(total, currency)} spent).`,
        priority: 4,
        actionUrl: `/trip/${ctx.trip.id}`,
        context: { module: 'budget', kind: 'check', pct },
        weight: 30,
      },
    ];
  },
};

export default budget;
