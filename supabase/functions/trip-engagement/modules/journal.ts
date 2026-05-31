/**
 * Journal module — an evening "capture today" nudge while traveling and a
 * "save your memories" prompt in the days right after the trip.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';

async function entryCountOn(supabase: SupabaseClient, tripId: string, date: string): Promise<number> {
  const { count } = await supabase
    .from('journal_entries')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('date', date);
  return count || 0;
}

const journal: NotificationModule = {
  key: 'journal',
  categoryCode: 'trip_tips',
  alertTypeCode: 'journal_tip',
  phases: ['during', 'after'],

  quota(ctx: TripContext): number {
    // Evening nudge during the trip.
    if (ctx.phase === 'during') return ctx.localHour >= 17 ? 1 : 0;
    // First two days after returning.
    if (ctx.phase === 'after' && ctx.daysAfterEnd <= 2) return 1;
    return 0;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    if (ctx.phase === 'during') {
      const ref = `during:${ctx.localDate}`;
      if (ctx.alreadySent.has(`journal:${ref}`)) return [];
      // Skip if they already journaled today.
      const todays = await entryCountOn(supabase, ctx.trip.id, ctx.localDate);
      if (todays > 0) return [];
      return [
        {
          contentRef: ref,
          title: '📔 Capture today',
          body: `How was Day ${ctx.tripDayNumber} in ${ctx.destinationName}? Jot a memory before the details fade.`,
          priority: 3,
          actionUrl: `/journal/${ctx.trip.id}`,
          context: { module: 'journal', kind: 'during' },
          weight: 22,
        },
      ];
    }

    const ref = `after:${ctx.localDate}`;
    if (ctx.alreadySent.has(`journal:${ref}`)) return [];
    return [
      {
        contentRef: ref,
        title: '📔 Save your memories',
        body: `Relive ${ctx.destinationName}. Add photos and notes to your travel journal while it's fresh.`,
        priority: 3,
        actionUrl: `/journal/${ctx.trip.id}`,
        context: { module: 'journal', kind: 'after' },
        weight: 26,
      },
    ];
  },
};

export default journal;
