/**
 * Phase 3 — AI copywriter.
 *
 * Takes a template-selected notification and rewrites the title/body so it
 * feels personal to the specific traveler, using a compact persona derived
 * from `profiles` + `user_travel_dna`. Reuses the app's standard AI stack:
 * Gemini `gemini-3-flash-preview` with a Claude Haiku fallback.
 *
 * Safety:
 *  - Hard env kill-switch (`TRIP_ENGAGEMENT_AI=false`).
 *  - Per-call timeout; any failure / invalid output returns null so the engine
 *    keeps the original template (correctness never depends on the AI).
 *  - Length-clamped output; the core fact stays in the template if the model
 *    drifts.
 */

import type { Phase } from './types.ts';
import { clamp } from './lib.ts';

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const GEMINI_MODEL = 'gemini-3-flash-preview';
const AI_TIMEOUT_MS = 4000;

/** Whether the copywriter should run at all this deployment. */
export function aiEnabled(): boolean {
  if ((Deno.env.get('TRIP_ENGAGEMENT_AI') || '').toLowerCase() === 'false') return false;
  return Boolean(GOOGLE_AI_API_KEY || ANTHROPIC_API_KEY);
}

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

/** Build a short, comma-free-ish persona string from profile + DNA signals. */
export function buildPersona(profile: Row | null, dna: Row | null): string {
  if (!profile && !dna) return '';
  const tp = (profile?.travel_preferences || {}) as Row;
  const bits: string[] = [];

  if (profile?.profession) {
    bits.push(`works as a ${profile.profession}${profile.industry ? ` in ${profile.industry}` : ''}`);
  }
  const interests = [
    ...(Array.isArray(tp.interests) ? tp.interests : []),
    ...(Array.isArray(tp.styles) ? tp.styles : []),
  ].filter(Boolean);
  if (interests.length) bits.push(`enjoys ${interests.slice(0, 4).join(', ')}`);

  if (profile?.packing_style && profile.packing_style !== 'normal') {
    bits.push(`${String(profile.packing_style).replace(/_/g, ' ')} packer`);
  }
  if (profile?.food_adventurousness) {
    bits.push(`${String(profile.food_adventurousness).replace(/_/g, ' ')} with food`);
  }
  if (profile?.photography_level && profile.photography_level !== 'phone_only') {
    bits.push('keen on photography');
  }
  if (profile?.activity_level && profile.activity_level !== 'moderate') {
    bits.push(`${String(profile.activity_level).replace(/_/g, ' ')} pace`);
  }
  if (profile?.morning_person === false) bits.push('night owl');
  if (Array.isArray(tp.dietary_restrictions) && tp.dietary_restrictions.length) {
    bits.push(`dietary needs: ${tp.dietary_restrictions.slice(0, 3).join(', ')}`);
  }

  if (dna?.primary_companion_type) bits.push(`usually travels ${dna.primary_companion_type}`);
  if (dna?.has_children) bits.push('travels with kids');
  if (dna?.travel_frequency) bits.push(`${dna.travel_frequency} traveler`);

  return bits.slice(0, 6).join('; ');
}

interface PolishInput {
  module: string;
  phase: Phase;
  destinationName: string;
  countryName: string;
  title: string;
  body: string;
}

function buildPrompt(persona: string, input: PolishInput): string {
  return [
    'You write a single mobile push notification for a travel app called Guidera.',
    "Rewrite the draft so it feels personal, warm and genuinely useful for THIS traveler, while keeping the exact core fact/item unchanged.",
    '',
    `Traveler: ${persona || 'a traveler'}.`,
    `Destination: ${input.destinationName}${input.countryName ? `, ${input.countryName}` : ''}. Trip phase: ${input.phase}. Type: ${input.module}.`,
    '',
    `Draft title: ${input.title}`,
    `Draft body: ${input.body}`,
    '',
    'Rules:',
    '- Stay true to the core item/fact. Never invent specifics (no fake brands, gates, prices, names).',
    '- Only reference the persona when it naturally fits; do not force it or list traits.',
    '- Title: max 45 characters, keep the leading emoji if the draft has one.',
    '- Body: ONE sentence, max 150 characters, friendly and natural.',
    '- No hashtags, no surrounding quotes, no markdown.',
    'Return ONLY JSON: {"title": "...", "body": "..."}',
  ].join('\n');
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonLoose(text: string): { title?: string; body?: string } | null {
  if (!text) return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Surfaces the last copywriter failure reason for debugging (dryRun only). */
export let lastDebug = '';

async function callGemini(prompt: string): Promise<string | null> {
  if (!GOOGLE_AI_API_KEY) {
    lastDebug = 'gemini:no_key';
    return null;
  }
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          // Gemini 3 spends output tokens on hidden "thinking" first, which was
          // truncating the JSON answer. This is a trivial rewrite — disable it.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  if (!res) {
    lastDebug = 'gemini:timeout';
    return null;
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    lastDebug = `gemini:${res.status}:${errText.slice(0, 120)}`;
    return null;
  }
  const data = await res.json().catch(() => null);
  // Gemini 3 can split output across multiple parts (e.g. thinking + answer),
  // so concatenate every part's text rather than only reading parts[0].
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: Row) => p?.text || '').join('').trim() || null
    : null;
  if (!text) lastDebug = `gemini:empty:${JSON.stringify(data).slice(0, 120)}`;
  return text;
}

async function callClaude(prompt: string): Promise<string | null> {
  if (!ANTHROPIC_API_KEY) return null;
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0.7,
      // Prefill the assistant turn with '{' so Claude continues pure JSON
      // instead of adding a prose preamble like "Here is the JSON:".
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    }),
  });
  if (!res) {
    lastDebug = 'claude:timeout';
    return null;
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    lastDebug = `claude:${res.status}:${errText.slice(0, 120)}`;
    return null;
  }
  const data = await res.json().catch(() => null);
  const text = data?.content?.[0]?.text ?? null;
  // Re-attach the prefill brace we forced above.
  return text ? `{${text}` : null;
}

/**
 * Returns a personalized { title, body }, or null to fall back to the template.
 */
export async function personalize(
  persona: string,
  input: PolishInput
): Promise<{ title: string; body: string } | null> {
  const prompt = buildPrompt(persona, input);
  const raw = (await callGemini(prompt)) || (await callClaude(prompt));
  if (!raw) return null;

  const parsed = parseJsonLoose(raw);
  if (!parsed?.title || !parsed?.body) {
    lastDebug = `parse_fail:${raw.slice(0, 100)}`;
    return null;
  }

  const title = clamp(String(parsed.title), 60);
  const body = clamp(String(parsed.body), 180);
  if (title.length < 3 || body.length < 8) {
    lastDebug = 'too_short';
    return null;
  }

  lastDebug = 'ok';
  return { title, body };
}
