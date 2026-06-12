// journeys-recommend-countries (briefing spec §10.3)
// Ranks top countries for a journey ("Not sure — recommend countries"), grounded.
// Cached per journey in the generic edge_response_cache.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getEdgeResponseCache, setEdgeResponseCache } from '../_shared/edgeScale/cache.ts';
import { recordEdgeMetric, deferEdgeWork } from '../_shared/edgeScale/metrics.ts';
import { extractJSON } from '../_shared/journeys/json.ts';
import { callPerplexity, hasPerplexity } from '../_shared/journeys/perplexity.ts';
import { callGemini } from '../_shared/journeys/gemini.ts';
import { guardAiRequest, AI_LIMITS } from '../_shared/aiRateGuard.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const NS = 'journeys-recommend';
const TTL = 30 * 24 * 3600; // 30 days

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const body = await req.json();
    const { categorySlug } = body;
    if (!categorySlug) return json(400, { error: 'missing_category' });

    const cached = await getEdgeResponseCache<any>(admin, NS, categorySlug);
    if (cached) {
      deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, cacheStatus: 'hit', statusCode: 200 }));
      return json(200, { recommendations: cached.response, cacheStatus: 'hit' });
    }

    const __rl = await guardAiRequest({
      req, body, supabase: admin, config: AI_LIMITS.journeysRecommend,
      corsHeaders, supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, anonKey: SUPABASE_ANON_KEY,
    });
    if (__rl) return __rl;

    const { data: cat } = await admin
      .from('journey_categories')
      .select('id,slug,name,ai_definition,ai_emphasis,is_sensitive')
      .eq('slug', categorySlug)
      .maybeSingle();
    if (!cat || cat.is_sensitive) return json(400, { error: 'invalid_or_sensitive_category' });

    const { data: countries } = await admin.from('journey_countries').select('code,name,continent');
    const list = (countries ?? []).map((c: any) => `${c.code}=${c.name}`).join(', ');

    const system = `You are Guidera's Journey Discovery engine. Given a purposeful-travel JOURNEY and a fixed list of
candidate countries (ISO-2=Name), rank the 6 countries MOST genuinely known for that journey. Be honest —
only pick countries with a real, recognized reputation for it. Output strict JSON only.
OUTPUT: { "recommendations": [ { "countryCode": "<ISO-2 from the list>", "headline": "4-8 words", "why": "1 sentence, grounded in fact" } ] }`;
    const user = `JOURNEY: ${cat.name} — ${cat.ai_definition}\nEMPHASIS: ${cat.ai_emphasis}\nCANDIDATES: ${list}\nReturn the top 6 as strict JSON.`;

    const usePplx = hasPerplexity();
    const r = usePplx
      ? await callPerplexity({ system, user })
      : await callGemini({ system, user, grounded: true });
    const parsed = extractJSON(r.text);
    const valid = new Set((countries ?? []).map((c: any) => c.code));
    const recommendations = (parsed?.recommendations ?? [])
      .filter((x: any) => x && valid.has(String(x.countryCode).toUpperCase()))
      .map((x: any) => ({ countryCode: String(x.countryCode).toUpperCase(), headline: String(x.headline ?? ''), why: String(x.why ?? '') }))
      .slice(0, 6);

    if (recommendations.length > 0) {
      deferEdgeWork(setEdgeResponseCache(admin, NS, categorySlug, recommendations, TTL, { engine: usePplx ? 'perplexity' : 'gemini' }));
    }
    deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, cacheStatus: 'miss', statusCode: 200 }));
    return json(200, { recommendations, cacheStatus: 'miss' });
  } catch (e) {
    return json(500, { error: 'recommend_failed', detail: String((e as Error)?.message ?? e) });
  }
});
