// Thin Gemini (Generative Language API) wrapper for the Journey Briefing engine.
// Uses GOOGLE_AI_API_KEY. Supports optional Google Search grounding so it can serve
// as the research fallback when Perplexity is not configured (returns citations too).

export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

function geminiKey(): string {
  const k = Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
  if (!k) throw new Error('GOOGLE_AI_API_KEY not configured');
  return k;
}

export async function callGemini(opts: {
  system: string;
  user: string;
  model?: string;
  grounded?: boolean;
  maxTokens?: number;
}): Promise<{ text: string; sources: Array<{ label?: string; url: string }> }> {
  const key = geminiKey();
  const model = opts.model || GEMINI_MODEL;
  const body: any = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: 'user', parts: [{ text: opts.user }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: opts.maxTokens ?? 2048 },
  };
  // Strict JSON mode guarantees parseable output, but it's incompatible with the
  // google_search tool — so only enable it for non-grounded (evergreen) calls.
  if (opts.grounded) body.tools = [{ google_search: {} }];
  else body.generationConfig.responseMimeType = 'application/json';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gemini ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p: any) => p?.text ?? '').join('');
  const chunks: any[] = cand?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((c: any) => ({ label: c?.web?.title, url: c?.web?.uri }))
    .filter((s: any) => !!s.url)
    .slice(0, 8);
  return { text, sources };
}
