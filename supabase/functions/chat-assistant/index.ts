import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { buildSystemPrompt } from './system-prompt.ts';
import { TOOL_DEFINITIONS } from './tool-defs.ts';
import { executeTool } from './tool-exec.ts';
import { getUserIdFromRequest, unauthorizedResponse } from '../_shared/auth.ts';

const cors = { 'Access-Control-Allow-Origin': '', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const PREMIUM_KW = ['generate','create a list','make me a','build me','give me a full','packing list','full itinerary','plan my trip','plan the trip','write me an itinerary','save to my trip'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const { sessionId, message, contextType, contextData } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // SEC-01: Validate user identity from JWT, falling back to body.userId for backward compat
    const userId = await getUserIdFromRequest(req, body, supabaseUrl, supabaseServiceKey, supabaseAnonKey);
    if (!message?.trim() || !userId) return new Response(JSON.stringify({ error: 'message and valid authentication required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    let sid = sessionId;
    if (!sid) {
      const { data, error } = await sb.from('ai_chat_sessions').insert({ user_id: userId, context_type: contextType || 'global', context_id: contextData?.id || null, context_name: contextData?.name ? `${contextData.name}${contextData.location ? ', '+contextData.location : ''}` : null, last_message_at: new Date().toISOString() }).select('id').single();
      if (error) throw new Error(error.message);
      sid = data.id;
    } else { await sb.from('ai_chat_sessions').update({ last_message_at: new Date().toISOString() }).eq('id', sid); }

    const { data: hist } = await sb.from('ai_chat_messages').select('role, content').eq('session_id', sid).order('created_at', { ascending: true }).limit(16);
    await sb.from('ai_chat_messages').insert({ session_id: sid, role: 'user', content: message.trim() });

    // Premium gate
    const lower = message.toLowerCase();
    if (PREMIUM_KW.some((k: string) => lower.includes(k))) {
      const feat = lower.includes('packing') ? 'packing list' : lower.includes('itinerary') ? 'full itinerary' : 'trip plan';
      const upsell = `I can help you create a personalized ${feat}! This is a Guidera Premium feature — it generates a complete, AI-powered guide saved to your trip for offline access. Upgrade to Premium to unlock full trip planning, packing lists, safety guides, and more. ✨\n\nMeanwhile, I'm happy to answer specific questions!`;
      await sb.from('ai_chat_messages').insert({ session_id: sid, role: 'assistant', content: upsell });
      return new Response(JSON.stringify({ sessionId: sid, response: upsell, isPremiumUpsell: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const sysPrompt = buildSystemPrompt(contextType, contextData);
    const msgs = [...(hist || []).map((m: any) => ({ role: m.role as 'user'|'assistant', content: m.content })), { role: 'user' as const, content: message.trim() }];
    let text = '';
    const ak = Deno.env.get('ANTHROPIC_API_KEY'), xk = Deno.env.get('XAI_API_KEY');

    if (ak) {
      const anthropic = new Anthropic({ apiKey: ak });
      let cur: any[] = [...msgs]; let rounds = 0;
      for (const model of ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307']) {
        try {
          while (rounds < 4) {
            const r = await anthropic.messages.create({ model, max_tokens: 1500, system: sysPrompt, messages: cur, tools: TOOL_DEFINITIONS });
            const tools = r.content.filter((b: any) => b.type === 'tool_use');
            const txts = r.content.filter((b: any) => b.type === 'text');
            if (tools.length > 0) {
              const results: any[] = [];
              for (const t of tools) { console.log(`Tool: ${t.name}`, JSON.stringify(t.input)); results.push({ type: 'tool_result', tool_use_id: t.id, content: await executeTool(t.name, t.input) }); }
              cur = [...cur, { role: 'assistant', content: r.content }, { role: 'user', content: results }];
              rounds++;
              if (txts.length > 0 && r.stop_reason === 'end_turn') { text = txts.map((b: any) => b.text).join(''); break; }
              continue;
            } else { text = txts.map((b: any) => b.text).join(''); break; }
          }
          if (text) { console.log(`Used ${model} (${rounds} tool rounds)`); break; }
        } catch (e: any) { console.warn(`${model} failed: ${e.message}`); }
      }
    }

    if (!text && xk) {
      try {
        const r = await fetch('https://api.x.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${xk}` }, body: JSON.stringify({ model: 'grok-3-mini', messages: [{ role: 'system', content: sysPrompt }, ...msgs], max_tokens: 1500, temperature: 0.7, search_parameters: { mode: 'auto' } }) });
        if (r.ok) { const d = await r.json(); text = d.choices?.[0]?.message?.content || ''; if (text) console.log('Used grok-3-mini'); }
      } catch (e: any) { console.warn('xAI error:', e.message); }
    }

    if (!text) text = "I'm having trouble connecting right now. Please try again in a moment!";
    await sb.from('ai_chat_messages').insert({ session_id: sid, role: 'assistant', content: text });
    return new Response(JSON.stringify({ sessionId: sid, response: text, isPremiumUpsell: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('chat-assistant error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
