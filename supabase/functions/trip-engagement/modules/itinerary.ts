/**
 * Itinerary module — occasional "sneak peek" teasers before the trip and a
 * daily "today's plan" highlight while traveling. Pulls from `itinerary_days`
 * and `itinerary_activities`.
 */

import type { Candidate, NotificationModule, SupabaseClient, TripContext } from '../types.ts';
import { clamp } from '../lib.ts';

async function firstActivityHint(supabase: SupabaseClient, dayId: string): Promise<string> {
  const { data } = await supabase
    .from('itinerary_activities')
    .select('title, insider_tip, position')
    .eq('day_id', dayId)
    .order('position', { ascending: true })
    .limit(5);
  if (!Array.isArray(data) || data.length === 0) return '';
  const withTip = data.find((a) => a.insider_tip);
  if (withTip) return `Don't miss: ${clamp(withTip.title, 50)} — ${clamp(withTip.insider_tip, 90)}`;
  return `First up: ${clamp(data[0].title, 60)}.`;
}

const itinerary: NotificationModule = {
  key: 'itinerary',
  categoryCode: 'trip_tips',
  alertTypeCode: 'itinerary_tip',
  phases: ['before', 'during'],
  personalize: true,

  quota(ctx: TripContext): number {
    // Teasers a few times in the final two weeks.
    if (ctx.phase === 'before') {
      return ctx.daysUntilStart <= 14 && ctx.daysUntilStart >= 1 && ctx.daysUntilStart % 4 === 0
        ? 1
        : 0;
    }
    // One "today" highlight per day while traveling.
    if (ctx.phase === 'during') return 1;
    return 0;
  },

  async selectCandidates(ctx: TripContext, supabase: SupabaseClient): Promise<Candidate[]> {
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('id, day_number, date, title, theme, neighborhood_focus')
      .eq('trip_id', ctx.trip.id)
      .order('day_number', { ascending: true })
      .limit(60);

    if (!Array.isArray(days) || days.length === 0) return [];

    if (ctx.phase === 'before') {
      const day1 = days[0];
      const ref = `teaser:${day1.id}`;
      if (ctx.alreadySent.has(`itinerary:${ref}`)) return [];
      const focus = day1.theme || day1.title || day1.neighborhood_focus || 'your first day';
      return [
        {
          contentRef: ref,
          title: '🗺️ A peek at your trip',
          body: clamp(`Day 1 in ${ctx.destinationName}: ${focus}. Tap to see the full plan.`, 170),
          priority: 3,
          actionUrl: `/trip/${ctx.trip.id}`,
          context: { module: 'itinerary', dayId: day1.id, kind: 'teaser' },
          weight: 24,
        },
      ];
    }

    // during: pick the day matching today, else by trip day number.
    const target =
      days.find((d) => d.date === ctx.localDate) ||
      days.find((d) => d.day_number === ctx.tripDayNumber) ||
      null;
    if (!target) return [];

    const ref = `day:${target.id}`;
    if (ctx.alreadySent.has(`itinerary:${ref}`)) return [];

    const hint = await firstActivityHint(supabase, target.id);
    const focus = target.theme || target.title || target.neighborhood_focus || 'Explore the city';
    const body = hint ? `${focus}. ${hint}` : `${focus}.`;

    return [
      {
        contentRef: ref,
        title: `📍 Today: Day ${target.day_number}`,
        body: clamp(body, 175),
        priority: 4,
        actionUrl: `/trip/${ctx.trip.id}`,
        context: { module: 'itinerary', dayId: target.id, kind: 'today' },
        weight: 40,
      },
    ];
  },
};

export default itinerary;
