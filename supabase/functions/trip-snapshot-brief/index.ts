/**
 * TRIP SNAPSHOT BRIEF — Phase B
 * Streaming AI destination guide with per-topic ai_module_cache.
 */

import {
  DEFAULT_SNAPSHOT_TOPICS,
  GEMINI_SNAPSHOT_FALLBACK_MODELS,
  GEMINI_SNAPSHOT_MODEL,
  SNAPSHOT_MAX_OUTPUT_TOKENS,
} from '../_shared/tripSnapshot/constants.ts';
import { parseDestinationInput } from '../_shared/tripSnapshot/destination.ts';
import {
  getCachedTopicSection,
  setCachedTopicSection,
  getCachedOverview,
  setCachedOverview,
} from '../_shared/tripSnapshot/cache.ts';
import {
  checkSnapshotRateLimit,
  recordSnapshotMetric,
  snapshotRequesterKey,
} from '../_shared/tripSnapshot/snapshotRuntime.ts';
import { buildRichTopicPrompt } from '../_shared/tripSnapshot/promptTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-guidera-client-id, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface BriefRequest {
  destination: string;
  country?: string;
  startDate: string;
  endDate: string;
  travelers?: { adults: number; children: number; infants: number };
  nationality?: string;
  selectedTopics?: string[];
  costEstimate?: { low: number; high: number };
}

interface BriefSection {
  id: string;
  icon: string;
  title: string;
  items: { label: string; detail: string }[];
}

const TOPIC_META: Record<string, { icon: string; title: string }> = {
  safety: { icon: 'shield', title: 'Safety & Emergency' },
  scams_crime: { icon: 'warning', title: 'Scams & Crime Patterns' },
  visa_entry: { icon: 'document', title: 'Visa & Entry' },
  weather: { icon: 'sun', title: 'Weather & Packing' },
  customs: { icon: 'people', title: 'Local Customs & Etiquette' },
  social_norms: { icon: 'nightlife', title: 'Nightlife & Social Norms' },
  dos_donts: { icon: 'document', title: "Do's & Don'ts" },
  sacred_sites: { icon: 'people', title: 'Religion & Sacred Sites' },
  arrival: { icon: 'car', title: 'Airport Arrival Guide' },
  food: { icon: 'food', title: 'Food & Dining Guide' },
  food_culture: { icon: 'food', title: 'Food Etiquette' },
  transit: { icon: 'car', title: 'Public Transit Quick Start' },
  neighborhoods: { icon: 'map', title: 'Neighborhood Guide' },
  hours: { icon: 'clock', title: 'Hours & Local Rhythm' },
  payments: { icon: 'wallet', title: 'Payments & Banking' },
  price_feel: { icon: 'wallet', title: 'Prices & Budget' },
  saving_tips: { icon: 'wallet', title: 'Money-Saving Tips' },
  laws: { icon: 'document', title: 'Laws & Regulations' },
  solo_female: { icon: 'people', title: 'Solo Female Traveler Notes' },
  health: { icon: 'shield', title: 'Health & Medication' },
  crowds: { icon: 'clock', title: 'Crowds & Reservations' },
  history: { icon: 'clock', title: 'History & Festivals' },
  language: { icon: 'language', title: 'Language Cheat Sheet' },
  apps: { icon: 'wifi', title: 'Essential Apps & SIM' },
};


function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, opts),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function webSearch(query: string): Promise<string> {
  const braveKey = Deno.env.get('BRAVE_SEARCH_API_KEY');
  if (braveKey) {
    try {
      const r = await fetchWithTimeout(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { Accept: 'application/json', 'X-Subscription-Token': braveKey } },
        8000,
      );
      if (r.ok) {
        const d = await r.json();
        return (d.web?.results || []).slice(0, 5)
          .map((x: { title: string; description?: string }) => `- ${x.title}: ${x.description || ''}`)
          .join('\n');
      }
    } catch { /* fall through */ }
  }
  return '';
}

async function fetchLiveContext(
  destination: string,
  country: string,
  nationality: string,
  month: string,
  topics: string[],
): Promise<string> {
  const destFull = country ? `${destination}, ${country}` : destination;
  const natLabel = nationality || 'US citizen';
  const parts: string[] = [];

  const needs = new Set<string>();
  for (const t of topics) {
    if (['visa_entry', 'laws'].includes(t)) needs.add('visa');
    if (['safety', 'scams_crime', 'solo_female', 'health'].includes(t)) needs.add('safety');
    if (['arrival', 'transit'].includes(t)) needs.add('transport');
    if (['scams_crime'].includes(t)) needs.add('scams');
    if (['weather'].includes(t)) needs.add('weather');
  }
  if (needs.size === 0) needs.add('culture');

  const searches: Promise<string>[] = [];
  const labels: string[] = [];
  if (needs.has('visa')) {
    labels.push('VISA');
    searches.push(webSearch(`${natLabel} visa requirements ${destFull} 2026 entry rules`));
  }
  if (needs.has('safety')) {
    labels.push('SAFETY');
    searches.push(webSearch(`${destFull} travel safety 2026 tourist warnings`));
  }
  if (needs.has('transport')) {
    labels.push('TRANSPORT');
    searches.push(webSearch(`${destFull} airport to city transport cost 2026`));
  }
  if (needs.has('scams')) {
    labels.push('SCAMS');
    searches.push(webSearch(`${destFull} common tourist scams 2026`));
  }
  if (needs.has('weather') || needs.has('culture')) {
    labels.push('CONTEXT');
    searches.push(webSearch(`${destFull} weather ${month} 2026 travel tips culture`));
  }

  const results = await Promise.allSettled(searches);
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      parts.push(`${labels[i]}:\n${r.value}`);
    }
  });

  return parts.join('\n\n');
}


function buildOverviewPrompt(
  destination: string,
  country: string,
  month: string,
  costLow?: number,
  costHigh?: number,
): string {
  const destFull = country ? `${destination}, ${country}` : destination;
  return `You are Guidera travel AI. Write a destination intelligence overview for ${destFull} in ${month}.

Write ONE cohesive paragraph of 5-6 complete sentences as plain text (no JSON, markdown, bullets, or headers):
1. What makes ${destFull} special in ${month} — weather, festivals, or seasonal highlights.
2. Best area to stay and why (name a real neighborhood).
3. One cultural or food highlight specific to ${destination}.
4. One practical tip (transport, money, safety, or timing).
5. Who this trip suits best (e.g. business, adventure, culture seekers).
6. Brief value note${costLow ? ` (estimated trip budget ~$${costLow}-$${costHigh} USD)` : ''}.

Rules:
- Every sentence must be complete and end with proper punctuation.
- Be specific to ${destFull}, not generic travel advice.
- Target 120-180 words total.
- Do NOT stop mid-sentence. Finish the full paragraph.`;
}

function extractGeminiTextParts(parsed: Record<string, unknown>): string {
  const candidates = (parsed.candidates as Array<Record<string, unknown>> | undefined) || [];
  const parts = (candidates[0]?.content as { parts?: Array<{ text?: string; thought?: boolean }> } | undefined)?.parts || [];
  let text = '';
  for (const part of parts) {
    if (part.text && !part.thought) text += part.text;
  }
  return text;
}

function isOverviewComplete(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 220 && /[.!?]["']?\s*$/.test(trimmed);
}

function getGeminiModels(): string[] {
  return [GEMINI_SNAPSHOT_MODEL, ...GEMINI_SNAPSHOT_FALLBACK_MODELS];
}

function geminiGenerateUrl(apiKey: string, model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function geminiStreamUrl(apiKey: string, model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
}

async function callAnthropic(prompt: string, maxTokens: number): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error('Anthropic fallback error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch (e) {
    console.error('Anthropic fallback exception:', e);
    return null;
  }
}

async function callGeminiJSON(prompt: string, maxTokens = SNAPSHOT_MAX_OUTPUT_TOKENS): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) return callAnthropic(prompt, maxTokens);

  for (const model of getGeminiModels()) {
    try {
      const res = await fetch(geminiGenerateUrl(apiKey, model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens,
            thinkingConfig: { thinkingLevel: 'LOW' },
          },
        }),
      });

      if (!res.ok) {
        console.error('Gemini JSON error:', model, res.status, await res.text().catch(() => ''));
        continue;
      }

      const data = await res.json();
      const text = extractGeminiTextParts(data).trim()
        || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (e) {
      console.error('Gemini JSON exception:', model, e);
    }
  }

  return callAnthropic(prompt, maxTokens);
}

async function callGeminiText(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) return callAnthropic(prompt, 2048);

  for (const model of getGeminiModels()) {
    try {
      const res = await fetch(geminiGenerateUrl(apiKey, model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingLevel: 'LOW' },
          },
        }),
      });

      if (!res.ok) {
        console.error('Gemini text error:', model, res.status, await res.text().catch(() => ''));
        continue;
      }

      const data = await res.json();
      const text = extractGeminiTextParts(data).trim()
        || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (e) {
      console.error('Gemini text exception:', model, e);
    }
  }

  return callAnthropic(prompt, 2048);
}

async function streamGeminiText(
  prompt: string,
  onDelta: (text: string) => void,
): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) return null;

  for (const model of getGeminiModels()) {
    const streamed = await streamGeminiTextWithModel(apiKey, model, prompt, onDelta);
    if (streamed) return streamed;
  }

  return callGeminiText(prompt);
}

async function streamGeminiTextWithModel(
  apiKey: string,
  model: string,
  prompt: string,
  onDelta: (text: string) => void,
): Promise<string | null> {
  const res = await fetch(
    geminiStreamUrl(apiKey, model),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: 'LOW' },
        },
      }),
    },
  );

  if (!res.ok) {
    console.error('Gemini stream error:', model, res.status, await res.text().catch(() => ''));
    return null;
  }

  const reader = res.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload);
        const chunkText = extractGeminiTextParts(parsed);
        if (!chunkText) continue;

        // Gemini SSE chunks are cumulative — emit only the new suffix
        let delta = chunkText;
        if (chunkText.startsWith(fullText)) {
          delta = chunkText.slice(fullText.length);
          fullText = chunkText;
        } else {
          fullText += chunkText;
          delta = chunkText;
        }

        if (delta) {
          onDelta(delta);
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  const trimmed = fullText.trim();
  if (!isOverviewComplete(trimmed)) {
    console.warn(`Overview incomplete from ${model} (${trimmed.length} chars) — falling back to non-streaming`);
    const fallback = await callGeminiText(prompt);
    return fallback && isOverviewComplete(fallback) ? fallback : (trimmed || fallback);
  }

  return trimmed || null;
}

function parseSection(raw: string, topicId: string): BriefSection | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
    }
    const parsed = JSON.parse(cleaned);
    const wrapped = parsed.section || parsed[topicId] || parsed;
    const section = Array.isArray(wrapped) ? { items: wrapped } : wrapped;
    const items = Array.isArray(section.items)
      ? section.items
      : Array.isArray(section)
        ? section
        : [];

    if (items.length > 0) {
      const meta = TOPIC_META[topicId] || { icon: 'document', title: topicId.replace(/_/g, ' ') };
      return {
        id: topicId,
        icon: meta.icon,
        title: meta.title,
        items: items.filter((item: { label?: string; detail?: string }) => item?.label && item?.detail),
      };
    }
  } catch (e) {
    console.error('Section parse error:', e);
  }
  return null;
}

async function generateTopicSection(
  topicId: string,
  destination: string,
  country: string,
  month: string,
  nationality: string,
  liveContext: string,
): Promise<BriefSection | null> {
  const prompt = buildRichTopicPrompt(topicId, destination, country, month, nationality, liveContext);
  const fallbackPrompt = `${prompt}

Return a shorter valid JSON object for "${topicId}" with exactly 3 items, keeping every detail concise, complete, and user-facing.`;

  for (const candidatePrompt of [prompt, fallbackPrompt]) {
    const raw = await callGeminiJSON(candidatePrompt);
    if (!raw) continue;
    const section = parseSection(raw, topicId);
    if (section?.items?.length) return section;
  }

  return null;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestStartedAt = Date.now();

  try {
    const body: BriefRequest = await req.json();
    let { destination, country, startDate, endDate, nationality, selectedTopics, costEstimate } = body;

    if (!destination || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'Missing destination or dates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!country?.trim() && destination.includes(',')) {
      const parsed = parseDestinationInput(destination);
      country = parsed.country;
      destination = parsed.city || destination;
    }

    const topics = selectedTopics?.length ? selectedTopics : [...DEFAULT_SNAPSHOT_TOPICS];
    const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
    const nat = nationality || 'US citizen';
    const requesterKey = snapshotRequesterKey(req);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEncode(event, data)));
        };

        try {
          let sentOverview = false;
          let sentSections = 0;
          let coldBudgetConsumed = false;

          const cachedOverview = await getCachedOverview(destination, country || '', startDate);
          if (cachedOverview) {
            send('overview', { overview: cachedOverview.overview, cachedAt: cachedOverview.cachedAt });
            sentOverview = true;
          } else {
            const rateLimit = await checkSnapshotRateLimit(
              { destination, country, startDate, endDate, nationality: nat, currency: 'USD' },
              `brief:${requesterKey}`,
            );
            coldBudgetConsumed = true;
            if (!rateLimit.allowed) {
              await recordSnapshotMetric({
                phase: 'brief',
                destination,
                country,
                cacheStatus: 'rate_limited',
                statusCode: 429,
                durationMs: Date.now() - requestStartedAt,
                providerSummary: { blockedKey: rateLimit.blockedKey, stage: 'overview' },
              });
              send('done', { topics: topics.length, deferred: topics.length });
              return;
            }

            const overviewPrompt = buildOverviewPrompt(
              destination, country || '', month, costEstimate?.low, costEstimate?.high,
            );
            const overviewRaw = await streamGeminiText(overviewPrompt, (delta) => {
              send('overview_delta', { delta });
            });
            if (overviewRaw && isOverviewComplete(overviewRaw)) {
              await setCachedOverview(destination, country || '', startDate, overviewRaw);
              send('overview', { overview: overviewRaw, cachedAt: new Date().toISOString() });
              sentOverview = true;
            } else if (overviewRaw) {
              send('overview', { overview: overviewRaw, cachedAt: new Date().toISOString() });
              sentOverview = true;
            }
          }

          const missingTopics: string[] = [];
          const cachedTopicResults = await Promise.all(
            topics.map(async (topicId) => ({
              topicId,
              cached: await getCachedTopicSection(topicId, destination, country || '', nat, startDate),
            })),
          );

          for (const { topicId, cached } of cachedTopicResults) {
            if (cached?.section?.id === topicId) {
              send('section', { section: cached.section, cachedAt: cached.cachedAt });
              sentSections++;
            } else {
              missingTopics.push(topicId);
            }
          }

          if (missingTopics.length > 0) {
            if (!coldBudgetConsumed) {
              const rateLimit = await checkSnapshotRateLimit(
                { destination, country, startDate, endDate, nationality: nat, currency: 'USD' },
                `brief:${requesterKey}`,
              );
              coldBudgetConsumed = true;
              if (!rateLimit.allowed) {
                await recordSnapshotMetric({
                  phase: 'brief',
                  destination,
                  country,
                  cacheStatus: 'rate_limited',
                  statusCode: 429,
                  durationMs: Date.now() - requestStartedAt,
                  providerSummary: { missingTopics: missingTopics.length, blockedKey: rateLimit.blockedKey },
                });
                send('done', { topics: topics.length, deferred: missingTopics.length });
                return;
              }
            }

            const liveContext = await fetchLiveContext(destination, country || '', nat, month, topics);
            const tasks = missingTopics.map((topicId) => async () => {
              const section = await generateTopicSection(
                topicId, destination, country || '', month, nat, liveContext,
              );
              if (section) {
                await setCachedTopicSection(topicId, destination, country || '', nat, startDate, section);
                send('section', { section, cachedAt: new Date().toISOString() });
                sentSections++;
              } else {
                console.error('Brief topic generation failed:', topicId, destination, country || '');
                send('topic_error', { topicId });
              }
              return section;
            });

            await runWithConcurrency(tasks, 2);
          }

          send('done', { topics: topics.length });
          await recordSnapshotMetric({
            phase: 'brief',
            destination,
            country,
            cacheStatus: missingTopics.length > 0 ? 'generated' : 'hit',
            statusCode: 200,
            durationMs: Date.now() - requestStartedAt,
            providerSummary: { topics: topics.length, generatedTopics: missingTopics.length, sentSections },
          });
        } catch (e) {
          console.error('Brief stream error:', e);
          await recordSnapshotMetric({
            phase: 'brief',
            destination,
            country,
            cacheStatus: 'error',
            statusCode: 500,
            durationMs: Date.now() - requestStartedAt,
            errorMessage: String(e),
          });
          send('done', { topics: topics.length });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('trip-snapshot-brief error:', e);
    return new Response(JSON.stringify({ error: 'Failed to start brief stream', details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
