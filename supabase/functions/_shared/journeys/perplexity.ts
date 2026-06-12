// Thin Perplexity (Sonar) wrapper for the Journey Briefing engine (spec §10.4).
// OpenAI-compatible chat completions. Returns text + citation URLs.

export function hasPerplexity(): boolean {
  return !!Deno.env.get('PERPLEXITY_API_KEY');
}

export const PERPLEXITY_MODEL = Deno.env.get('PPLX_MODEL') || 'sonar';

export async function callPerplexity(opts: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
}): Promise<{ text: string; sources: Array<{ label?: string; url: string }> }> {
  const key = Deno.env.get('PERPLEXITY_API_KEY');
  if (!key) throw new Error('PERPLEXITY_API_KEY not configured');

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model || PERPLEXITY_MODEL,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: 0.2,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`perplexity ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  const rawCitations: any[] = data?.citations ?? data?.search_results ?? [];
  const sources = rawCitations
    .map((c: any) => (typeof c === 'string' ? { url: c } : { label: c?.title, url: c?.url }))
    .filter((s: any) => !!s.url)
    .slice(0, 8);
  return { text, sources };
}
