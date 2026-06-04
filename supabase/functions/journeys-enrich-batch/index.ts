// journeys-enrich-batch (spec §10.3) — cron-scheduled enrichment.
// A) PRE-GENERATE: popular journeys x their top seed countries lacking a guide.
// B) REFRESH: regenerate guides older than guideStaleDays.
// Capped per run to respect edge-function wall time (generation ~30-45s each).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireCronOrServiceAuth } from '../_shared/cronAuth.ts';
import { runGuideGeneration } from '../_shared/journeys/generateGuide.ts';

const STALE_DAYS = 120;
const MAX_PER_RUN = 3; // generation is slow; keep within wall time

// Top seed countries per popular journey (mirrors client KNOWN_DESTINATIONS).
const SEED: Record<string, string[]> = {
  medical: ['TR', 'MX', 'TH'],
  relocation: ['PT', 'ES', 'MX'],
  nomad: ['PT', 'TH', 'ID'],
  wellness: ['ID', 'TH', 'CR'],
  solo: ['JP', 'PT', 'NZ'],
  study: ['GB', 'CA', 'DE'],
  pilgrimage: ['SA', 'ES', 'IT'],
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const unauthorized = requireCronOrServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const generated: string[] = [];
  const refreshed: string[] = [];
  const errors: string[] = [];

  let mode = 'pregenerate';
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.mode === 'refresh') mode = 'refresh';
  } catch {
    // default pregenerate
  }

  try {
    if (mode === 'refresh') {
      const cutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();
      const { data: stale } = await admin
        .from('journey_guides')
        .select('category_id, country_code, subhub_id, journey_categories(slug), journey_subhubs(slug), generated_at')
        .neq('status', 'curated')
        .lt('generated_at', cutoff)
        .limit(MAX_PER_RUN);
      for (const g of stale ?? []) {
        const catSlug = (g.journey_categories as any)?.slug;
        const subSlug = (g.journey_subhubs as any)?.slug ?? null;
        if (!catSlug) continue;
        const r = await runGuideGeneration(admin, { categorySlug: catSlug, countryCode: g.country_code, subhubSlug: subSlug });
        if (r.guide) refreshed.push(`${catSlug}:${g.country_code}`);
        else errors.push(`${catSlug}:${g.country_code}:${r.status}`);
      }
    } else {
      // PRE-GENERATE missing popular journey x seed country guides
      const { data: cats } = await admin
        .from('journey_categories')
        .select('id, slug, has_subhubs')
        .eq('is_popular', true)
        .eq('status', 'active');
      const popular = (cats ?? []).filter((c: any) => SEED[c.slug]);

      outer: for (const cat of popular) {
        // skip sub-hub journeys here (handled with focus elsewhere); generate base guide
        for (const code of SEED[cat.slug] ?? []) {
          if (generated.length >= MAX_PER_RUN) break outer;
          // already has a published guide for this country (any subhub)?
          const { data: existing } = await admin
            .from('journey_guides')
            .select('id')
            .eq('category_id', cat.id)
            .eq('country_code', code)
            .eq('is_published', true)
            .limit(1);
          if (existing && existing.length > 0) continue;
          const r = await runGuideGeneration(admin, { categorySlug: cat.slug, countryCode: code });
          if (r.guide) generated.push(`${cat.slug}:${code}`);
          else errors.push(`${cat.slug}:${code}:${r.status}`);
        }
      }
    }

    await admin.from('journey_events').insert({
      event_type: 'enrich_batch_run',
      payload: { mode, generated, refreshed, errors },
    });

    return json(200, { mode, generated, refreshed, errors });
  } catch (e) {
    return json(500, { error: 'enrich_failed', detail: String((e as Error)?.message ?? e), generated, refreshed });
  }
});
