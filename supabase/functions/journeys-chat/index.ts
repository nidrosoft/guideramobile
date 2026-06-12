// journeys-chat (spec §14.2) — per-journey AI concierge.
// Non-streaming: loads the thread, the relevant guide facts, and recent history,
// then returns a grounded assistant reply and persists it (service role).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { corsHeaders } from '../_shared/cors.ts';
import { guardAiRequest, AI_LIMITS } from '../_shared/aiRateGuard.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const MODEL = Deno.env.get('JOURNEYS_CLAUDE_MODEL') || 'claude-sonnet-4-20250514';
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function buildSystem(journeyName: string, countryName: string, guideContent: any): string {
  let facts = '';
  if (guideContent?.sections?.length) {
    try {
      const parts: string[] = [];
      if (guideContent.hero?.hook) parts.push(`Overview: ${guideContent.hero.hook}`);
      for (const s of guideContent.sections) {
        if (s.type === 'costs' && s.rows) parts.push(`Costs: ${s.rows.map((r: any) => `${r.item} ${r.abroad} (home ${r.home})`).join('; ')}`);
        else if (s.items) parts.push(`${s.title}: ${s.items.join('; ')}`);
        else if (s.steps) parts.push(`${s.title}: ${s.steps.join(' -> ')}`);
        else if (s.body) parts.push(`${s.title}: ${s.body}`);
      }
      facts = parts.join('\n').slice(0, 6000);
    } catch {
      facts = '';
    }
  }
  return `You are Guidera's ${journeyName} concierge for ${countryName}. Help the traveler with practical,
honest answers about this journey. Ground answers in the GUIDE FACTS below plus general knowledge.
Rules: information only — NO medical/legal/financial/immigration advice; use ranges not false precision;
never invent specific clinics/agencies/providers (Guidera lists verified ones separately); be concise
(2-5 sentences), warm and specific. If asked something outside this journey/country, gently refocus.
Where relevant, mention that verified providers and the cost/checklist toolkit are available in the app.

GUIDE FACTS:
${facts || '(No full guide is cached yet; answer from general knowledge with appropriate caution.)'}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const { threadId, message } = body;
    if (!threadId || !message) return json(400, { error: 'missing_params' });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const __rl = await guardAiRequest({
      req, body, supabase: admin, config: AI_LIMITS.journeysChat,
      corsHeaders, supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, anonKey: SUPABASE_ANON_KEY,
    });
    if (__rl) return __rl;

    const { data: thread } = await admin
      .from('journey_chat_threads')
      .select('id, category_id, country_code, journey_categories(slug,name), journey_countries(name)')
      .eq('id', threadId)
      .maybeSingle();
    if (!thread) return json(404, { error: 'thread_not_found' });

    const journeyName = (thread.journey_categories as any)?.name ?? 'travel';
    const countryName = (thread.journey_countries as any)?.name ?? 'this country';

    // pull guide facts if a guide exists
    let guideContent: any = null;
    if (thread.category_id && thread.country_code) {
      const { data: g } = await admin
        .from('journey_guides')
        .select('content, status')
        .eq('category_id', thread.category_id)
        .eq('country_code', thread.country_code)
        .eq('is_published', true)
        .order('status', { ascending: true })
        .limit(1)
        .maybeSingle();
      guideContent = g?.content ?? null;
    }

    // recent history (last 10)
    const { data: history } = await admin
      .from('journey_chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(20);

    const messages = (history ?? [])
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role, content: m.content }));
    // ensure the latest user message is included
    if (!messages.length || messages[messages.length - 1].content !== message) {
      messages.push({ role: 'user', content: message });
    }

    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystem(journeyName, countryName, guideContent),
      messages,
    });
    const reply = (res.content.find((b: any) => b.type === 'text') as any)?.text ?? '';

    await admin.from('journey_chat_messages').insert({ thread_id: threadId, role: 'assistant', content: reply });
    await admin.from('journey_chat_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

    return json(200, { reply });
  } catch (e) {
    return json(500, { error: 'chat_failed', detail: String((e as Error)?.message ?? e) });
  }
});
