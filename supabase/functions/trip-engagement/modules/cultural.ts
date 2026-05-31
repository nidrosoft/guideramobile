/**
 * Cultural module — Do's & Don'ts / etiquette tips so travelers get familiar
 * with local customs before and during the trip. Pulls from `cultural_tips`.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';
import { clamp, rankWeight } from '../lib.ts';

const IMPORTANCE_ORDER = ['critical', 'important', 'helpful'];

const cultural: NotificationModule = {
  key: 'cultural',
  categoryCode: 'trip_tips',
  alertTypeCode: 'culture_tip',
  phases: ['before', 'during'],
  personalize: true,

  quota(ctx: TripContext): number {
    if (ctx.phase === 'before' && ctx.daysUntilStart >= 0 && ctx.daysUntilStart <= 21) return 1;
    if (ctx.phase === 'during') return 1;
    return 0;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const { data } = await supabase
      .from('cultural_tips')
      .select('id, title, description, is_do, importance, is_critical, penalty')
      .eq('trip_id', ctx.trip.id)
      .limit(120);

    if (!Array.isArray(data)) return [];

    return data
      .filter((t) => !ctx.alreadySent.has(`cultural:${t.id}`) && t.title)
      .map((t) => {
        let weight = rankWeight(t.importance, IMPORTANCE_ORDER, 38, 10);
        if (t.is_critical) weight += 10;
        const lead = t.is_do === false ? "Don't" : 'Do';
        const penalty = t.penalty ? ` (${clamp(t.penalty, 50)})` : '';
        const body = t.description
          ? `${lead}: ${t.title}. ${clamp(t.description, 110)}`
          : `${lead}: ${t.title}.${penalty}`;
        return {
          contentRef: String(t.id),
          title: `🌍 ${ctx.countryName || 'Local'} etiquette`,
          body: clamp(body, 175),
          priority: t.is_critical ? 5 : 3,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'cultural', tipId: t.id },
          weight,
        } as Candidate;
      })
      .sort((a, b) => b.weight - a.weight);
  },
};

export default cultural;
