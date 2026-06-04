// journeys-generate-guide (spec §10.1)
// Generates (or refreshes) a universal guide for a journey x country (+subhub),
// validates strict JSON, and upserts the row using the service-role key.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { runGuideGeneration } from '../_shared/journeys/generateGuide.ts';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { categorySlug, countryCode, subhubSlug } = await req.json();
    if (!categorySlug || !countryCode) return json(400, { error: 'missing_params' });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const result = await runGuideGeneration(admin, { categorySlug, countryCode, subhubSlug });
    if (result.status === 'invalid_category') return json(400, { error: 'invalid_category' });
    if (result.status === 'sensitive_category') return json(400, { error: 'sensitive_category' });
    if (result.status === 'invalid_country') return json(400, { error: 'invalid_country' });
    if (!result.guide) return json(500, { error: 'db_upsert_failed', detail: result.error });

    await admin.from('journey_events').insert({
      event_type: 'guide_generated',
      category_slug: categorySlug,
      country_code: countryCode,
      payload: { confidence: result.guide.confidence },
    });

    return json(200, { guide: result.guide });
  } catch (e) {
    return json(500, { error: 'generation_failed', detail: String((e as Error)?.message ?? e) });
  }
});
