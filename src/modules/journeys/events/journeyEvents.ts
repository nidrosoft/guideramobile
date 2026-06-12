/**
 * Journeys module event bus (spec §17). Fire-and-forget: writes to
 * journey_events (RLS allows anon insert) and forwards to app analytics.
 * Decoupled so other systems can subscribe via the table without the module
 * knowing about them.
 */
import { supabase } from '@/lib/supabase/client';
import { trackEvent } from '@/services/analytics/analytics';

export type JourneyEventType =
  | 'home_section_view' | 'home_card_tap' | 'see_all_tap' | 'community_entry_tap'
  | 'hub_view' | 'journey_select' | 'continent_filter' | 'subhub_filter'
  | 'country_card_tap' | 'guide_view' | 'guide_generate_requested' | 'guide_generated'
  | 'search_submit' | 'search_result_view' | 'search_matched_journey_tap'
  | 'provider_view' | 'provider_lead_captured'
  | 'pro_gate_view' | 'pro_upsell_view' | 'pro_subscribe_tap'
  | 'toolkit_view' | 'cost_estimate_saved' | 'checklist_item_toggled' | 'visa_watch_created'
  | 'community_join_tap' | 'peer_match_requested' | 'guide_feedback_submitted' | 'guide_saved'
  // Briefing engine (amendment spec §13)
  | 'briefing_sheet_open' | 'briefing_reason_change' | 'briefing_where_select' | 'briefing_recommend_countries'
  | 'briefing_stage_select' | 'briefing_who_select' | 'briefing_topic_toggle' | 'briefing_custom_topic_added'
  | 'briefing_generate' | 'topic_generated' | 'topic_cache_hit'
  | 'briefing_saved' | 'briefing_recent_open' | 'briefing_pro_gate_view';

export interface JourneyEventInput {
  categorySlug?: string;
  countryCode?: string;
  payload?: Record<string, any>;
}

export function emitJourneyEvent(eventType: JourneyEventType, input: JourneyEventInput = {}): void {
  // forward to analytics (sync, safe)
  try {
    trackEvent(`journeys_${eventType}`, {
      category_slug: input.categorySlug,
      country_code: input.countryCode,
      ...input.payload,
    });
  } catch {
    // analytics is best-effort
  }
  // persist to journey_events (best-effort, do not block UI)
  void supabase
    .from('journey_events')
    .insert({
      event_type: eventType,
      category_slug: input.categorySlug ?? null,
      country_code: input.countryCode ?? null,
      payload: input.payload ?? {},
    })
    .then(undefined, () => {
      /* swallow — analytics insert must never surface to the user */
    });
}
