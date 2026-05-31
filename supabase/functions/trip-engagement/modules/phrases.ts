/**
 * Phrases module — a "phrase of the day" before and during the trip so the
 * traveler builds familiarity. Pulls from `language_phrases`.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';
import { clamp, rankWeight } from '../lib.ts';

const PRIORITY_ORDER = ['critical', 'high', 'useful', 'medium', 'nice_to_have'];
// Earlier categories surface first so users learn essentials before extras.
const CATEGORY_ORDER = [
  'greetings',
  'food',
  'directions',
  'transport',
  'shopping',
  'social',
  'accommodation',
  'emergency',
  'medical',
];

const phrases: NotificationModule = {
  key: 'phrases',
  categoryCode: 'trip_tips',
  alertTypeCode: 'phrase_tip',
  phases: ['before', 'during'],
  personalize: true,

  quota(ctx: TripContext): number {
    if (ctx.phase === 'before' && ctx.daysUntilStart >= 0 && ctx.daysUntilStart <= 21) return 1;
    if (ctx.phase === 'during') return 1;
    return 0;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const { data } = await supabase
      .from('language_phrases')
      .select('id, english, native, romanized, phonetic, context_note, category, priority, display_order')
      .eq('trip_id', ctx.trip.id)
      .order('display_order', { ascending: true })
      .limit(120);

    if (!Array.isArray(data)) return [];

    return data
      .filter((p) => !ctx.alreadySent.has(`phrases:${p.id}`) && (p.english || p.native))
      .map((p) => {
        const priorityWeight = rankWeight(p.priority, PRIORITY_ORDER, 36, 6);
        const catIdx = CATEGORY_ORDER.indexOf((p.category || '').toLowerCase());
        const categoryWeight = catIdx < 0 ? 0 : Math.max(0, 18 - catIdx * 2);
        const say = p.phonetic || p.romanized;
        const pron = say ? ` (${clamp(say, 40)})` : '';
        const note = p.context_note ? ` ${clamp(p.context_note, 70)}` : '';
        return {
          contentRef: String(p.id),
          title: ctx.phase === 'during' ? '🗣️ Phrase of the day' : '🗣️ Learn before you go',
          body: clamp(`Say "${p.english}" → "${p.native}"${pron}.${note}`, 170),
          priority: 3,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'phrases', phraseId: p.id },
          weight: priorityWeight + categoryWeight,
        } as Candidate;
      })
      .sort((a, b) => b.weight - a.weight);
  },
};

export default phrases;
