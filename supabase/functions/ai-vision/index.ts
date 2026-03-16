/**
 * AI VISION EDGE FUNCTION
 *
 * Proxies all Gemini Vision API calls for the AI Vision Translator feature.
 * Uses the existing GOOGLE_AI_API_KEY secret (server-side, secure).
 *
 * Actions:
 *   - analyze-frame: Live mode — analyze a camera frame for text/signs
 *   - extract-menu: Menu scan — extract structured menu items from photo
 *   - generate-order: Order builder — generate spoken order in local language
 *   - ask-followup: Snapshot — follow-up question about translated text
 *   - check-menu: Snapshot — check if image is a menu
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Prompt Templates ─────────────────────────────────────────

const PROMPTS = {
  liveFrame: (lang: string) =>
    `You are a real-time travel assistant embedded in a camera app. The user is a traveler who does not speak the local language. Analyze what you see in the camera frame. If you see any text, signs, labels, menus, or written content in any language, translate it to ${lang} and briefly explain what it means or what the user should do. Be concise — max 2 sentences. Only respond when you see something meaningful to translate. If there is no text visible, respond with exactly: {"hasText": false}. Otherwise respond with JSON: {"hasText": true, "translation": "...", "explanation": "...", "sourceLanguage": "..."}`,

  menuScan: (lang: string) =>
    `This is a photo of a restaurant menu. Extract ALL menu items, descriptions, and prices. Translate everything to ${lang}. Return ONLY a valid JSON array in this exact format, no markdown, no explanation:
[{"category":"Category Name","name_original":"Original text","name_translated":"Translated name","description":"Brief description translated to ${lang}","price":"Price as shown","dietary_flags":["contains gluten","vegetarian",etc]}]
If you cannot read the menu clearly, return: {"error": "Could not read menu clearly. Please try again with better lighting."}`,

  orderBuilder: (localLang: string, country: string) =>
    `A traveler wants to place the following food order at a restaurant in ${country}. Generate a natural, polite spoken order in ${localLang} as if speaking directly to a waiter. The traveler does not speak the local language, so make it sound fluent and natural. Include appropriate greetings and politeness markers for the culture. Return ONLY valid JSON, no markdown: {"spoken_order": "...", "english_translation": "..."}`,

  snapshotFollowup: (translatedText: string, lang: string) =>
    `The user took a photo and extracted the following translated text:\n\n"${translatedText}"\n\nThe user may ask follow-up questions about this text. Answer in ${lang}. Be helpful, concise, and travel-aware.`,

  isMenu: `Look at this image. Does it appear to be a food or drink menu? Respond with ONLY "yes" or "no".`,
};

// ─── Gemini API Call ──────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

async function callGemini(
  apiKey: string,
  contents: Array<{ role: string; parts: GeminiPart[] }>,
  systemInstruction?: string,
  maxTokens = 4096,
): Promise<string> {
  const url = `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[ai-vision] Gemini error:', res.status, errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return text;
}

function cleanJson(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

// ─── Action Handlers ──────────────────────────────────────────

async function handleAnalyzeFrame(apiKey: string, body: any) {
  const { image, userLanguage } = body;
  if (!image) throw new Error('image (base64) required');

  const lang = userLanguage || 'English';
  const contents = [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: image } },
      { text: 'What text do you see? Translate it.' },
    ],
  }];

  const raw = await callGemini(apiKey, contents, PROMPTS.liveFrame(lang), 512);
  try {
    const parsed = JSON.parse(cleanJson(raw));
    return {
      hasText: parsed.hasText ?? false,
      translation: parsed.translation || '',
      explanation: parsed.explanation,
      sourceLanguage: parsed.sourceLanguage,
      timestamp: Date.now(),
    };
  } catch {
    return { hasText: false, translation: '', timestamp: Date.now() };
  }
}

async function handleExtractMenu(apiKey: string, body: any) {
  const { image, userLanguage } = body;
  if (!image) throw new Error('image (base64) required');

  const lang = userLanguage || 'English';
  const contents = [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: image } },
      { text: 'Extract and translate this menu.' },
    ],
  }];

  const raw = await callGemini(apiKey, contents, PROMPTS.menuScan(lang));
  const parsed = JSON.parse(cleanJson(raw));

  if (parsed.error) return { items: [], error: parsed.error };

  const items = (Array.isArray(parsed) ? parsed : []).map((item: any, i: number) => ({
    id: `menu-${i}`,
    category: item.category || 'Other',
    nameOriginal: item.name_original || '',
    nameTranslated: item.name_translated || '',
    description: item.description || '',
    price: item.price || '',
    dietaryFlags: item.dietary_flags || [],
  }));

  return { items };
}

async function handleGenerateOrder(apiKey: string, body: any) {
  const { items, localLanguage, destinationCountry } = body;
  if (!items?.length) throw new Error('items array required');

  const lang = localLanguage || 'English';
  const country = destinationCountry || 'the local country';
  const orderJson = JSON.stringify(items.map((i: any) => ({
    item: i.nameOriginal,
    translation: i.nameTranslated,
    quantity: i.quantity,
    price: i.price,
  })));

  const contents = [{
    role: 'user',
    parts: [{ text: `Order items: ${orderJson}` }],
  }];

  const raw = await callGemini(apiKey, contents, PROMPTS.orderBuilder(lang, country));
  const parsed = JSON.parse(cleanJson(raw));

  return {
    spokenOrder: parsed.spoken_order || '',
    englishTranslation: parsed.english_translation || '',
  };
}

async function handleAskFollowup(apiKey: string, body: any) {
  const { image, translatedText, question, userLanguage } = body;
  if (!question) throw new Error('question required');

  const lang = userLanguage || 'English';
  const parts: GeminiPart[] = [{ text: question }];
  if (image) {
    parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: image } });
  }

  const contents = [{ role: 'user', parts }];
  const answer = await callGemini(apiKey, contents, PROMPTS.snapshotFollowup(translatedText || '', lang));
  return { answer };
}

async function handleCheckMenu(apiKey: string, body: any) {
  const { image } = body;
  if (!image) throw new Error('image (base64) required');

  const contents = [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: image } },
      { text: PROMPTS.isMenu },
    ],
  }];

  const raw = await callGemini(apiKey, contents, undefined, 32);
  return { isMenu: raw.trim().toLowerCase().startsWith('yes') };
}

// ─── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }),
        { status: 500, headers: CORS },
      );
    }

    const body = await req.json();
    const { action } = body;

    let result: any;
    switch (action) {
      case 'analyze-frame':
        result = await handleAnalyzeFrame(apiKey, body);
        break;
      case 'extract-menu':
        result = await handleExtractMenu(apiKey, body);
        break;
      case 'generate-order':
        result = await handleGenerateOrder(apiKey, body);
        break;
      case 'ask-followup':
        result = await handleAskFollowup(apiKey, body);
        break;
      case 'check-menu':
        result = await handleCheckMenu(apiKey, body);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Valid: analyze-frame, extract-menu, generate-order, ask-followup, check-menu` }),
          { status: 400, headers: CORS },
        );
    }

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (e: any) {
    console.error('[ai-vision] Error:', e);
    return new Response(
      JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: CORS },
    );
  }
});
