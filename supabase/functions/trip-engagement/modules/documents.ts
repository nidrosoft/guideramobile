/**
 * Documents module — one document reminder per day before the trip, biased
 * toward items with approaching deadlines or long processing times.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';
import { clamp, rankWeight } from '../lib.ts';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

const documents: NotificationModule = {
  key: 'documents',
  categoryCode: 'trip_tips',
  alertTypeCode: 'document_tip',
  phases: ['before'],

  quota(ctx: TripContext): number {
    if (ctx.phase !== 'before') return 0;
    if (ctx.daysUntilStart < 0 || ctx.daysUntilStart > 30) return 0;
    return 1;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const { data } = await supabase
      .from('document_items')
      .select('id, name, status_label, priority, deadline_days_before_departure, processing_time, action_required, is_checked, display_order')
      .eq('trip_id', ctx.trip.id)
      .eq('is_checked', false)
      .order('display_order', { ascending: true })
      .limit(60);

    if (!Array.isArray(data)) return [];

    return data
      .filter((it) => !ctx.alreadySent.has(`documents:${it.id}`))
      .map((it) => {
        let weight = rankWeight(it.priority, PRIORITY_ORDER, 44, 9);
        if (it.action_required) weight += 6;
        // Surface items whose deadline window has arrived.
        const deadline = it.deadline_days_before_departure;
        if (typeof deadline === 'number' && ctx.daysUntilStart <= deadline) weight += 14;

        const detail = it.processing_time
          ? `Processing takes ${clamp(it.processing_time, 40)}.`
          : it.status_label
            ? clamp(it.status_label, 60)
            : 'Make sure this is sorted before you fly.';

        const urgent =
          typeof deadline === 'number' && ctx.daysUntilStart <= deadline;

        return {
          contentRef: String(it.id),
          title: urgent ? '📄 Document deadline approaching' : '📄 Travel document check',
          body: `${it.name}: ${detail}`,
          priority: urgent ? 5 : 4,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'documents', documentItemId: it.id },
          weight,
        } as Candidate;
      })
      .sort((a, b) => b.weight - a.weight);
  },
};

export default documents;
