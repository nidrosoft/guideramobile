/**
 * Packing module — drips a few unpacked items per day before the trip.
 * Pulls real items from `packing_items`, prioritising essentials.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';
import { clamp, rankWeight } from '../lib.ts';

const PRIORITY_ORDER = ['critical', 'action_required', 'essential', 'recommended', 'optional'];

const packing: NotificationModule = {
  key: 'packing',
  categoryCode: 'trip_tips',
  alertTypeCode: 'packing_tip',
  phases: ['before'],
  personalize: true,

  quota(ctx: TripContext): number {
    // Only nag about packing within 3 weeks of departure.
    if (ctx.phase !== 'before') return 0;
    if (ctx.daysUntilStart < 0 || ctx.daysUntilStart > 21) return 0;
    return 3;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const { data } = await supabase
      .from('packing_items')
      .select('id, name, priority, reason, is_optional, display_order')
      .eq('trip_id', ctx.trip.id)
      .eq('is_packed', false)
      .order('display_order', { ascending: true })
      .limit(80);

    if (!Array.isArray(data)) return [];

    const lastChance = ctx.daysUntilStart <= 1;

    return data
      .filter((it) => !ctx.alreadySent.has(`packing:${it.id}`))
      .map((it) => {
        const weight = rankWeight(it.priority, PRIORITY_ORDER) - (it.is_optional ? 12 : 0);
        const lead = lastChance ? 'Last chance to pack' : "Don't forget to pack";
        const body = it.reason
          ? `${it.name} — ${clamp(it.reason, 110)}`
          : `${it.name}`;
        return {
          contentRef: String(it.id),
          title: lastChance ? '🧳 Final packing check' : '🧳 Time to pack',
          body: `${lead}: ${body}`,
          priority: 4,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'packing', packingItemId: it.id },
          weight,
        } as Candidate;
      })
      .sort((a, b) => b.weight - a.weight);
  },
};

export default packing;
