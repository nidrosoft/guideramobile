// journeys-generate-topic (briefing spec §10.1)
// Generates ONE topic-section for journey × country × topic (+subhub), cache-first.
// Routes research topics to Perplexity (falls back to Gemini+grounding when no PPLX
// key), evergreen topics to Gemini Flash. Hardened with durable rate limit + metrics.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { consumeEdgeRateLimit, edgeRateLimitResponse } from '../_shared/edgeScale/rateLimit.ts';
import { recordEdgeMetric, deferEdgeWork } from '../_shared/edgeScale/metrics.ts';
import { tryAcquireEdgeLock, releaseEdgeLock } from '../_shared/edgeScale/locks.ts';
import { extractJSON, validateBriefingTopic } from '../_shared/journeys/json.ts';
import { callPerplexity, hasPerplexity, PERPLEXITY_MODEL } from '../_shared/journeys/perplexity.ts';
import { callGemini, GEMINI_MODEL } from '../_shared/journeys/gemini.ts';
import { BRIEFING_SYSTEM_PROMPT, BRIEFING_PROMPT_VERSION, buildBriefingUserContent } from './prompt.ts';

const NS = 'journeys-generate-topic';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function requesterKey(req: Request): string {
  return (
    req.headers.get('x-guidera-client-id') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'anonymous'
  );
}

async function readCachedTopic(admin: any, cacheKey: string) {
  const { data } = await admin
    .from('journey_topic_content')
    .select('content, summary, engine, sources, status, confidence')
    .eq('cache_key', cacheKey)
    .neq('status', 'archived')
    .maybeSingle();
  return data;
}

// Poll the cache while another worker generates the same topic (coalescing).
async function waitForCachedTopic(admin: any, cacheKey: string, maxMs: number) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 1500));
    const c = await readCachedTopic(admin, cacheKey);
    if (c) return c;
  }
  return null;
}

function sectionResponse(cached: any, cacheStatus: string) {
  return {
    section: { ...cached.content, summary: cached.summary, sources: cached.sources, engine: cached.engine, status: cached.status },
    cacheStatus,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const started = Date.now();
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { categorySlug, countryCode, subhubSlug, topicKey, stage, who } = await req.json();
    if (!categorySlug || !countryCode || !topicKey) return json(400, { error: 'missing_params' });

    // Durable rate limit (per requester): 40 topic generations / 5 min.
    const rl = await consumeEdgeRateLimit(admin, {
      namespace: NS,
      bucketKey: requesterKey(req),
      windowSeconds: 300,
      maxRequests: 40,
    });
    if (!rl.allowed) {
      deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, cacheStatus: 'rate_limited', statusCode: 429 }));
      return edgeRateLimitResponse(rl, corsHeaders);
    }

    const [{ data: cat }, { data: country }, { data: topic }] = await Promise.all([
      admin.from('journey_categories').select('id,slug,name,ai_definition,ai_emphasis,requires_disclaimer,is_sensitive').eq('slug', categorySlug).maybeSingle(),
      admin.from('journey_countries').select('code,name,continent').eq('code', countryCode).maybeSingle(),
      admin.from('journey_topics').select('key,label,research_basis,needs_research,model_override').eq('key', topicKey).maybeSingle(),
    ]);
    if (!cat || cat.is_sensitive) return json(400, { error: 'invalid_or_sensitive_category' });
    if (!country) return json(400, { error: 'invalid_country' });
    if (!topic) return json(400, { error: 'invalid_topic' });

    let subhub: any = null;
    if (subhubSlug) {
      const { data } = await admin.from('journey_subhubs').select('id,name,slug').eq('category_id', cat.id).eq('slug', subhubSlug).maybeSingle();
      subhub = data;
    }

    const cacheKey = `${cat.id}:${countryCode}:${subhub?.id ?? '_'}:${topicKey}`;

    // 1) Cache hit?
    const cached = await readCachedTopic(admin, cacheKey);
    if (cached) {
      deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, phase: topicKey, cacheStatus: 'hit', statusCode: 200, durationMs: Date.now() - started }));
      return json(200, sectionResponse(cached, 'hit'));
    }

    // 2) Single-flight: only one worker generates a given topic; others wait for
    //    the cache (coalescing) so concurrent users never trigger duplicate calls.
    const lock = await tryAcquireEdgeLock(admin, NS, cacheKey, 60);
    if (!lock.acquired) {
      const waited = await waitForCachedTopic(admin, cacheKey, 28000);
      if (waited) {
        deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, phase: topicKey, cacheStatus: 'coalesced', statusCode: 200, durationMs: Date.now() - started }));
        return json(200, sectionResponse(waited, 'coalesced'));
      }
      // still missing after wait — fall through and generate ourselves
    } else {
      // double-check cache after acquiring the lock (a prior holder may have written it)
      const recheck = await readCachedTopic(admin, cacheKey);
      if (recheck) {
        deferEdgeWork(releaseEdgeLock(admin, NS, cacheKey, lock.ownerId));
        deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, phase: topicKey, cacheStatus: 'hit', statusCode: 200, durationMs: Date.now() - started }));
        return json(200, sectionResponse(recheck, 'hit'));
      }
    }

    // 3) Generate
    const system = BRIEFING_SYSTEM_PROMPT;
    const user = buildBriefingUserContent({
      journeyName: cat.name,
      aiDefinition: cat.ai_definition,
      aiEmphasis: cat.ai_emphasis,
      countryName: country.name,
      continent: country.continent,
      subhubName: subhub?.name,
      topicLabel: topic.label,
      topicBasis: topic.research_basis,
      stage,
      who,
    });

    const wantsResearch = topic.model_override
      ? topic.model_override.startsWith('sonar')
      : !!topic.needs_research;
    const usePplx = wantsResearch && hasPerplexity();
    let engine = usePplx ? 'perplexity' : 'gemini';
    let model = usePplx ? PERPLEXITY_MODEL : GEMINI_MODEL;

    async function callModel() {
      if (usePplx) return await callPerplexity({ system, user });
      // research topics without a Perplexity key use Gemini with Google Search grounding
      return await callGemini({ system, user, grounded: wantsResearch });
    }

    let section: any;
    let sources: Array<{ label?: string; url: string }> = [];
    try {
      const r = await callModel();
      sources = r.sources ?? [];
      section = validateBriefingTopic(extractJSON(r.text), topicKey);
    } catch (_e) {
      const r2 = usePplx
        ? await callPerplexity({ system, user: `${user}\n\nRETURN VALID JSON ONLY.` })
        : await callGemini({ system, user: `${user}\n\nRETURN VALID JSON ONLY.`, grounded: wantsResearch });
      sources = r2.sources ?? [];
      section = validateBriefingTopic(extractJSON(r2.text), topicKey);
    }

    // 3) Upsert cache
    const { error: upErr } = await admin.from('journey_topic_content').upsert(
      {
        category_id: cat.id,
        country_code: countryCode,
        subhub_id: subhub?.id ?? null,
        topic_key: topicKey,
        content: section,
        summary: section.summary ?? null,
        engine,
        model,
        prompt_version: BRIEFING_PROMPT_VERSION,
        confidence: section.confidence ?? null,
        sources,
        status: 'ai_generated',
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' }
    );
    if (lock.acquired) deferEdgeWork(releaseEdgeLock(admin, NS, cacheKey, lock.ownerId, upErr ? 'failed' : 'completed'));

    if (upErr) {
      deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, phase: topicKey, cacheStatus: 'error', statusCode: 500, errorMessage: upErr.message }));
      return json(500, { error: 'cache_write_failed', detail: upErr.message });
    }

    deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, phase: topicKey, cacheStatus: 'miss', statusCode: 200, durationMs: Date.now() - started, providerSummary: { engine, model } }));
    return json(200, { section: { ...section, sources, engine, status: 'ai_generated' }, cacheStatus: 'miss' });
  } catch (e) {
    deferEdgeWork(recordEdgeMetric(admin, { namespace: NS, cacheStatus: 'error', statusCode: 500, errorMessage: String((e as Error)?.message ?? e) }));
    return json(500, { error: 'generation_failed', detail: String((e as Error)?.message ?? e) });
  }
});
