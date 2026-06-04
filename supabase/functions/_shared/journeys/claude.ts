// Anthropic client + prompt-cache helper for the Journeys module (spec §9.1).
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '' });

export const JOURNEYS_MODEL = Deno.env.get('JOURNEYS_CLAUDE_MODEL') || 'claude-sonnet-4-20250514';

export async function callClaudeJSON(opts: {
  model?: string;
  maxTokens: number;
  system: { staticPrompt: string; dynamicSpec?: string };
  userContent: string;
}): Promise<string> {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) throw new Error('ANTHROPIC_API_KEY not configured');
  const system: any[] = [
    { type: 'text', text: opts.system.staticPrompt, cache_control: { type: 'ephemeral' } },
  ];
  if (opts.system.dynamicSpec) {
    system.push({ type: 'text', text: opts.system.dynamicSpec, cache_control: { type: 'ephemeral' } });
  }
  const res = await anthropic.messages.create({
    model: opts.model || JOURNEYS_MODEL,
    max_tokens: opts.maxTokens,
    system,
    messages: [{ role: 'user', content: opts.userContent }],
  });
  const block = res.content.find((b: any) => b.type === 'text') as any;
  return block?.text ?? '';
}
