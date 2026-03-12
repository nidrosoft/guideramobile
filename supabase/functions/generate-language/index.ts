import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// ─── Helpers ────────────────────────────────────────────

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function arr(v: any): any[] { return Array.isArray(v) ? v : []; }
function str(v: any, fb = ''): string { return v ? String(v) : fb; }

// ─── Context Builder ────────────────────────────────────

async function buildContext(sb: any, tripId: string) {
  const { data: trip, error: te } = await sb.from('trips').select('*').eq('id', tripId).single();
  if (te || !trip) throw new Error(`Trip not found: ${te?.message}`);

  const [profR, bookR, travR, prefR, actR] = await Promise.all([
    sb.from('profiles').select('*').eq('id', trip.user_id).single(),
    sb.from('trip_bookings').select('*').eq('trip_id', tripId),
    sb.from('trip_travelers').select('*').eq('trip_id', tripId),
    sb.from('travel_preferences').select('*').eq('user_id', trip.user_id).maybeSingle(),
    sb.from('trip_activities').select('*').eq('trip_id', tripId),
  ]);

  return {
    trip,
    profile: profR.data || {},
    bookings: bookR.data || [],
    travelers: travR.data || [],
    prefs: prefR?.data || {},
    activities: actR?.data || [],
  };
}

// ─── Prompt Builder ─────────────────────────────────────

function buildPrompt(ctx: any): string {
  const { trip, profile: p, bookings, travelers, prefs: tp, activities } = ctx;
  const dest = trip.destination || {};
  const city = str(dest.city, 'Unknown');
  const country = str(dest.country, 'Unknown');
  const startDate = str(trip.start_date || trip.startDate);
  const endDate = str(trip.end_date || trip.endDate);
  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 7;
  const purpose = str(trip.trip_purpose || trip.purpose, 'leisure');

  const userName = str(p.full_name || p.display_name, 'Traveler');
  const gender = str(p.gender || tp.gender, 'unspecified');
  const age = computeAge(p.date_of_birth);
  const nationality = str(p.nationality || tp.nationality, 'unspecified');
  const nativeLang = str(p.native_language || tp.native_language, 'english');
  const langSpoken = arr(p.languages_spoken || tp.languages_spoken || ['english']);
  const religion = str(p.religion || tp.religion, 'none');
  const profession = str(p.profession || tp.profession, '');

  const dietary = arr(tp.dietary_restrictions || p.dietary_restrictions);
  const allergies = arr(tp.allergies || p.allergies);
  const medical = arr(tp.medical_conditions || p.medical_conditions);

  const hasChildren = travelers.some((t: any) => t.type === 'child' || t.is_child);
  const childAges = travelers.filter((t: any) => t.type === 'child' || t.is_child).map((t: any) => t.age).filter(Boolean);
  const hasCarRental = bookings.some((b: any) => b.type === 'car_rental' || b.category === 'car_rental');

  const allActivities = [
    ...bookings.map((b: any) => b.activity_type || b.title || '').filter(Boolean),
    ...activities.map((a: any) => a.activity_type || a.title || '').filter(Boolean),
    ...arr(tp.interests),
  ];

  const isBusiness = purpose === 'business';

  return `You are an expert multilingual travel linguist. Generate a Language Survival Kit for a traveler.

═══ RUNTIME VARIABLES ═══
DESTINATION: ${city}, ${country}
TRIP_DURATION: ${days} days
TRIP_PURPOSE: ${purpose}
TRAVELER: ${userName}, ${gender}, age ${age || 'unknown'}, nationality ${nationality}
NATIVE_LANGUAGE: ${nativeLang}
LANGUAGES_SPOKEN: ${langSpoken.join(', ')}
RELIGION: ${religion}
PROFESSION: ${profession}
DIETARY_RESTRICTIONS: ${dietary.join(', ') || 'none'}
ALLERGIES: ${allergies.join(', ') || 'none'}
MEDICAL_CONDITIONS: ${medical.join(', ') || 'none'}
TRAVELING_WITH_CHILDREN: ${hasChildren}${hasChildren ? ` (ages: ${childAges.join(', ')})` : ''}
HAS_CAR_RENTAL: ${hasCarRental}
ACTIVITIES_PLANNED: ${allActivities.join(', ') || 'general sightseeing'}

═══ INSTRUCTIONS ═══

STEP 1 — LANGUAGE ANALYSIS
Determine:
- Primary language at ${city}
- Language code (ISO 639-1)
- Script type (latin, arabic, cyrillic, thai, japanese_mixed, korean, chinese_simplified, devanagari, hebrew, georgian)
- English penetration level (high/medium/low/very_low)
- Dialect notes if relevant (e.g. Moroccan Darija vs MSA, Brazilian vs European Portuguese)
- Gender calibration (Thai khrap/kha, Japanese gendered speech, Arabic grammar)
- Cultural usage notes for key phrases

STEP 2 — GENERATE PHRASES
Generate phrases across these categories. Each category must have 8-25 phrases:

1. 🆘 EMERGENCY (CRITICAL — always generate all 15 base phrases + emergency numbers)
2. 🤝 GREETINGS (20 base phrases + destination-specific greetings)
3. 🏥 MEDICAL (general + allergy phrases for EACH user allergy + dietary phrases)
4. 🚌 TRANSPORT (taxis, public transport${hasCarRental ? ', car rental phrases' : ''}, navigation)
5. 🏨 ACCOMMODATION (hotel check-in, issues, requests)
6. 🍽️ FOOD (ordering, dietary specifics for user restrictions, local customs)
7. 🛒 SHOPPING (prices, bargaining, receipts)
8. 📍 DIRECTIONS (left/right/near/far/lost)
9. 💬 SOCIAL (rapport phrases, compliments, local gems)
${isBusiness ? '10. 💼 BUSINESS (meetings, cards, formal phrases)\n' : ''}${religion !== 'none' ? '11. 🛐 FAITH (religion-specific phrases for ' + religion + ')\n' : ''}${hasChildren ? '12. 👶 WITH KIDS (child-specific phrases)\n' : ''}13. 🔤 PRONUNCIATION GUIDE (3-5 key pronunciation features)

STEP 3 — PHRASE STRUCTURE
Every phrase MUST have exactly this structure:
{
  "category": "emergency",
  "subcategory": "distress",
  "english": "Help!",
  "native": "[native script]",
  "romanized": "[romanized or null for Latin scripts]",
  "phonetic": "[English-speaker phonetic: sa-WAS-dee KRAP]",
  "pronunciation_notes": "[stress, tone, speed guidance]",
  "tone_marks": "[for tonal languages or null]",
  "gender_variant": { "male": "...", "female": "..." } or null,
  "context_note": "[when/how to use, when NOT to use, cultural context]",
  "formality": "urgent|casual|polite|formal",
  "priority": "critical|high|medium|useful|nice_to_have",
  "display_order": 1,
  "show_native_in_card": true
}

CRITICAL RULES:
- Phonetics must be written for English speakers using syllable-stress notation (sa-WAS-dee), NOT IPA
- For non-Latin scripts: ALWAYS provide native + romanized + phonetic
- For tonal languages: include tone_marks
- Gender variants: flag for Thai (khrap/kha), Japanese, Arabic
- Medical/allergy phrases: NEVER soften. "I am allergic to X" must convey urgency
- Generate specific allergy phrases for EACH item in: ${allergies.join(', ') || 'none'}
- Generate specific dietary phrases for EACH item in: ${dietary.join(', ') || 'none'}
- Emergency numbers: include police, ambulance, fire, tourist police for ${country}
- "Pronunciation Guide" category: generate as phrases where "english" is the rule title, "native" is an example, "phonetic" shows pronunciation, and "context_note" explains the rule

═══ OUTPUT FORMAT ═══
Return ONLY valid JSON:
{
  "language_kit": {
    "language": "Thai",
    "language_code": "th",
    "script": "thai",
    "destination": "${city}, ${country}",
    "destination_country": "${country}",
    "english_penetration": "medium",
    "language_context": {
      "overview": "...",
      "script_direction": "ltr",
      "show_native_recommended": true,
      "show_native_note": "...",
      "english_penetration_note": "...",
      "gender_note": "...",
      "dialect_note": "..."
    },
    "pronunciation_guide": [
      { "title": "...", "content": "...", "examples": [{ "word": "...", "meaning": "...", "tone": "..." }] }
    ],
    "local_gems": [
      { "phrase_english": "...", "meaning": "...", "native": "...", "phonetic": "...", "context": "...", "wow_factor": "high" }
    ],
    "emergency_numbers": { "police": "...", "ambulance": "...", "fire": "...", "tourist_police": "..." },
    "categories": [
      {
        "id": "cat_emergency",
        "tab_label": "Emergency",
        "category_key": "emergency",
        "phrases": [ ... ]
      }
    ]
  }
}

QUALITY: Generate at least 120 phrases total. Emergency must have 15+. Do NOT fabricate translations. Use safest formulations for uncertain phrases. No slang or profanity.`;
}

// ─── AI Callers ─────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 32768, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callHaiku(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 32768,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Haiku ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.content?.[0]?.text || '';
}

// ─── JSON Parser ────────────────────────────────────────

function parseJSON(text: string): any {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  // bracket repair
  let s = m ? m[0] : cleaned;
  let open = 0, close = 0;
  for (const c of s) { if (c === '{') open++; if (c === '}') close++; }
  if (open > close) s += '}'.repeat(open - close);
  try { return JSON.parse(s); } catch { throw new Error('Failed to parse AI JSON'); }
}

// ─── Storage ────────────────────────────────────────────

async function storeKit(sb: any, tripId: string, userId: string, kit: any, modelUsed: string) {
  const lk = kit.language_kit || kit;
  const cats = lk.categories || [];
  const allPhrases: any[] = [];
  cats.forEach((cat: any) => {
    arr(cat.phrases).forEach((ph: any, i: number) => {
      allPhrases.push({ ...ph, category: ph.category || cat.category_key || cat.id?.replace('cat_', ''), display_order: ph.display_order ?? i + 1 });
    });
  });

  // Upsert kit
  const { data: kitRow, error: kitErr } = await sb.from('language_kits').upsert({
    trip_id: tripId,
    user_id: userId,
    language: str(lk.language),
    language_code: str(lk.language_code),
    script: str(lk.script, 'latin'),
    destination: str(lk.destination),
    destination_country: str(lk.destination_country),
    english_penetration: str(lk.english_penetration, 'medium'),
    language_context: lk.language_context || {},
    pronunciation_guide: lk.pronunciation_guide || [],
    local_gems: lk.local_gems || [],
    emergency_numbers: lk.emergency_numbers || {},
    total_phrases: allPhrases.length,
    critical_phrases_count: allPhrases.filter((p: any) => p.priority === 'critical').length,
    generated_by: modelUsed,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'trip_id,language_code' }).select('id').single();

  if (kitErr) throw new Error(`Kit upsert failed: ${kitErr.message}`);
  const kitId = kitRow.id;

  // Delete old phrases for this kit, then bulk insert
  await sb.from('language_phrases').delete().eq('kit_id', kitId);

  if (allPhrases.length > 0) {
    const rows = allPhrases.map((ph: any) => ({
      kit_id: kitId,
      trip_id: tripId,
      category: ph.category,
      subcategory: ph.subcategory || null,
      english: ph.english,
      native: ph.native || null,
      romanized: ph.romanized || null,
      phonetic: ph.phonetic || null,
      pronunciation_notes: ph.pronunciation_notes || null,
      tone_marks: ph.tone_marks || null,
      gender_variant: ph.gender_variant || null,
      context_note: ph.context_note || null,
      formality: ph.formality || 'polite',
      priority: ph.priority || 'medium',
      display_order: ph.display_order || 0,
      show_native_in_card: ph.show_native_in_card ?? false,
      audio_phonetic: ph.audio_phonetic || ph.phonetic || null,
      is_favorited: false,
    }));

    // Batch insert in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error: phErr } = await sb.from('language_phrases').insert(chunk);
      if (phErr) console.error(`Phrase insert chunk ${i} error:`, phErr.message);
    }
  }

  return { kitId, totalPhrases: allPhrases.length, language: lk.language };
}

// ─── Main Handler ───────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { tripId } = await req.json();
    if (!tripId) return new Response(JSON.stringify({ error: 'tripId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const ctx = await buildContext(sb, tripId);
    const prompt = buildPrompt(ctx);

    let text = '';
    let modelUsed = '';
    try {
      text = await callGemini(prompt);
      modelUsed = 'gemini-2.5-flash';
    } catch (e) {
      console.error('Gemini failed, trying Haiku:', e);
      text = await callHaiku(prompt);
      modelUsed = 'claude-haiku-4.5';
    }

    const parsed = parseJSON(text);
    const result = await storeKit(sb, tripId, ctx.trip.user_id, parsed, modelUsed);

    return new Response(JSON.stringify({
      success: true,
      language: result.language,
      totalPhrases: result.totalPhrases,
      modelUsed,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('generate-language error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
