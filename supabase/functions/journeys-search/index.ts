// journeys-search (spec §10.2)
// Input: { countryCode } (the client resolves a free-text query -> a country).
// Returns the "what is X known for across journeys" profile; cache-or-generate.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaudeJSON, JOURNEYS_MODEL } from '../_shared/journeys/claude.ts';
import { extractJSON, validateSearch, validateIntent } from '../_shared/journeys/json.ts';
import { SEARCH_SYSTEM_PROMPT, INTENT_SYSTEM_PROMPT } from './prompt.ts';

const PROMPT_VERSION = 2;
const STALE_DAYS = 180;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { countryCode, query } = body ?? {};

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Free-text intent resolution: the LLM maps any natural-language query
    // (a procedure, a goal, a place) to the journey taxonomy.
    if (!countryCode && typeof query === 'string' && query.trim()) {
      const raw = query.trim().slice(0, 200);
      let intent;
      try {
        const out = await callClaudeJSON({
          maxTokens: 300,
          system: { staticPrompt: INTENT_SYSTEM_PROMPT },
          userContent: `Search query: "${raw}". Map it to the taxonomy.`,
        });
        intent = validateIntent(extractJSON(out));
      } catch (_e) {
        const out2 = await callClaudeJSON({
          maxTokens: 300,
          system: { staticPrompt: INTENT_SYSTEM_PROMPT },
          userContent: `Search query: "${raw}". RETURN VALID JSON ONLY.`,
        });
        intent = validateIntent(extractJSON(out2));
      }
      admin
        .from('journey_events')
        .insert({
          event_type: 'search_intent_resolved',
          category_slug: intent.categorySlug,
          country_code: intent.countryCode,
          payload: { q: raw, subhub: intent.subhubSlug },
        })
        .then(undefined, () => {});
      return json(200, { intent });
    }

    if (!countryCode) return json(400, { error: 'missing_country' });

    const { data: country } = await admin
      .from('journey_countries')
      .select('*')
      .eq('code', countryCode)
      .maybeSingle();
    if (!country) return json(400, { error: 'invalid_country' });

    // cache check
    const { data: cached } = await admin
      .from('journey_country_profiles')
      .select('*')
      .eq('country_code', countryCode)
      .maybeSingle();
    if (cached?.generated_at) {
      const ageDays = (Date.now() - new Date(cached.generated_at).getTime()) / 86400000;
      if (ageDays < STALE_DAYS) {
        return json(200, { profile: { ...cached, countryName: country.name } });
      }
    }

    let parsed: any;
    const userContent = `Country: ${country.name} (code: ${country.code}, continent: ${country.continent}). Produce the profile.`;
    try {
      const raw = await callClaudeJSON({
        maxTokens: 1500,
        system: { staticPrompt: SEARCH_SYSTEM_PROMPT },
        userContent,
      });
      parsed = validateSearch(extractJSON(raw));
    } catch (_e) {
      const raw2 = await callClaudeJSON({
        maxTokens: 1500,
        system: { staticPrompt: SEARCH_SYSTEM_PROMPT },
        userContent: `${userContent}\n\nRETURN VALID JSON ONLY.`,
      });
      parsed = validateSearch(extractJSON(raw2));
    }
    parsed.countryCode = countryCode;

    const { data: profile } = await admin
      .from('journey_country_profiles')
      .upsert(
        {
          country_code: countryCode,
          overview: parsed.overview,
          known_for: parsed.knownFor,
          matched: parsed.matched,
          primary_journey: parsed.primaryJourney,
          confidence: parsed.confidence,
          model: JOURNEYS_MODEL,
          prompt_version: PROMPT_VERSION,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'country_code' }
      )
      .select('*')
      .single();

    await admin.from('journey_events').insert({
      event_type: 'search_profile_generated',
      country_code: countryCode,
      payload: { matched: parsed.matched?.length ?? 0 },
    });

    return json(200, { profile: { ...profile, countryName: country.name } });
  } catch (e) {
    return json(500, { error: 'search_failed', detail: String((e as Error)?.message ?? e) });
  }
});
