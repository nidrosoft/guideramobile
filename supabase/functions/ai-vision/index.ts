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
 *   - translate-snapshot: Snapshot — OCR + translate in a single Gemini call (replaces Cloud Vision + Translation APIs)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const MODEL = 'gemini-2.5-flash';
const FAST_MODEL = 'gemini-2.0-flash';  // faster for structured extraction tasks
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Prompt Templates ─────────────────────────────────────────

const PROMPTS = {
  liveFrame: (lang: string) =>
    `You are a real-time travel assistant embedded in a camera app. The user is a traveler who does not speak the local language. Analyze what you see in the camera frame. If you see any text, signs, labels, menus, or written content in any language, translate it to ${lang} and briefly explain what it means or what the user should do. Be concise — max 2 sentences. Only respond when you see something meaningful to translate. If there is no text visible, respond with exactly: {"hasText": false}. Otherwise respond with JSON: {"hasText": true, "translation": "...", "explanation": "...", "sourceLanguage": "..."}`,

  menuScan: (lang: string) =>
    `You are an expert food menu OCR and translation system. Analyze this restaurant menu image with extreme precision.

RULES:
1. Extract EVERY single menu item visible — do not skip any items
2. Detect the menu's language automatically
3. Translate all item names and descriptions to ${lang}
4. Preserve exact prices as shown (with currency symbols)
5. Categorize items logically (Appetizers, Mains, Drinks, Desserts, Sides, etc.)
6. For each item, identify dietary flags: vegetarian, vegan, gluten-free, spicy, contains nuts, contains dairy, halal, kosher
7. If a description exists in the original menu, translate it. If none exists, write a brief helpful one (1 sentence max)
8. If you cannot read a price clearly, write "ask waiter"
9. Return ONLY valid JSON — no markdown, no code fences, no explanation

JSON FORMAT:
{"source_language":"ISO 639-1 code","source_language_name":"Full language name","items":[{"category":"Category","name_original":"Original name","name_translated":"Translated to ${lang}","description":"Brief description in ${lang}","price":"Price as shown","dietary_flags":[]}]}

If the image is not a menu or unreadable: {"error":"This doesn't appear to be a food menu. Please try again with a clear menu photo."}`,

  orderBuilder: (localLang: string, country: string) =>
    `A traveler wants to place the following food order at a restaurant in ${country}. Generate a natural, polite spoken order in ${localLang} as if speaking directly to a waiter. The traveler does not speak the local language, so make it sound fluent and natural. Include appropriate greetings and politeness markers for the culture. Return ONLY valid JSON, no markdown: {"spoken_order": "the full spoken order in ${localLang}", "english_translation": "the English translation", "spoken_language_code": "ISO 639-1 code of the language used for spoken_order"}`,

  snapshotFollowup: (translatedText: string, lang: string) =>
    `The user took a photo and extracted the following translated text:\n\n"${translatedText}"\n\nThe user may ask follow-up questions about this text. Answer in ${lang}. Be helpful, concise, and travel-aware.`,

  isMenu: `Look at this image. Does it appear to be a food or drink menu? Respond with ONLY "yes" or "no".`,

  translateSnapshot: (lang: string) =>
    `You are a travel translator. The user took a photo of text they want to understand. Extract ALL visible text from the image exactly as written. Then translate it to ${lang}. Also detect the source language and determine if this image appears to be a food/drink menu. Return ONLY valid JSON, no markdown:
{"originalText": "exact text as seen in the image", "translatedText": "full translation in ${lang}", "sourceLanguage": "ISO 639-1 code of the detected language", "isMenu": true/false}
If no text is visible, return: {"originalText": "", "translatedText": "", "sourceLanguage": "unknown", "isMenu": false}`,
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
  return callGeminiWithModel(apiKey, MODEL, contents, systemInstruction, maxTokens);
}

async function callGeminiWithModel(
  apiKey: string,
  model: string,
  contents: Array<{ role: string; parts: GeminiPart[] }>,
  systemInstruction?: string,
  maxTokens = 4096,
  timeoutMs = 30000,
): Promise<string> {
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ai-vision] Gemini (${model}) error:`, res.status, errText);
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');
    return text;
  } finally {
    clearTimeout(timer);
  }
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
      { text: 'Extract and translate every item from this food menu.' },
    ],
  }];

  const prompt = PROMPTS.menuScan(lang);

  // Fallback chain: fast model first, then smart model
  const models = [
    { name: FAST_MODEL, timeout: 15000, label: 'fast' },
    { name: MODEL, timeout: 25000, label: 'smart' },
  ];

  let lastError = '';
  for (const { name: modelName, timeout, label } of models) {
    try {
      console.log(`[ai-vision] Trying menu extraction with ${label} model (${modelName})...`);
      const startTime = Date.now();
      const raw = await callGeminiWithModel(apiKey, modelName, contents, prompt, 3072, timeout);
      const elapsed = Date.now() - startTime;
      console.log(`[ai-vision] ${label} model responded in ${elapsed}ms`);

      let parsed: any;
      try {
        parsed = JSON.parse(cleanJson(raw));
      } catch (parseErr) {
        console.warn(`[ai-vision] ${label} model JSON parse failed, trying next model...`);
        lastError = 'Failed to parse menu data';
        continue; // try next model
      }

      if (parsed.error) return { items: [], error: parsed.error };

      // Handle both formats
      const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
      if (rawItems.length === 0) {
        console.warn(`[ai-vision] ${label} model returned 0 items, trying next model...`);
        lastError = 'No items extracted';
        continue;
      }

      const items = rawItems.map((item: any, i: number) => ({
        id: `menu-${i}`,
        category: item.category || 'Other',
        nameOriginal: item.name_original || '',
        nameTranslated: item.name_translated || '',
        description: item.description || '',
        price: item.price || '',
        dietaryFlags: item.dietary_flags || [],
      }));

      console.log(`[ai-vision] Successfully extracted ${items.length} items with ${label} model`);
      return {
        items,
        sourceLanguage: parsed.source_language || null,
        sourceLanguageName: parsed.source_language_name || null,
      };
    } catch (err: any) {
      console.warn(`[ai-vision] ${label} model failed:`, err.message);
      lastError = err.message;
      // continue to next model
    }
  }

  // All models failed
  return { items: [], error: lastError || 'Could not read menu. Please try again with a clearer photo.' };
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
  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson(raw));
  } catch (parseErr) {
    console.error('[ai-vision] orderBuilder JSON parse failed:', parseErr);
    return { spokenOrder: '', localOrder: '', tips: [], etiquette: [] };
  }

  return {
    spokenOrder: parsed.spoken_order || '',
    englishTranslation: parsed.english_translation || '',
    spokenLanguageCode: parsed.spoken_language_code || '',
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

async function handleChat(apiKey: string, body: any) {
  const { message, userLanguage, image, conversationHistory } = body;
  if (!message) throw new Error('message required');

  const lang = userLanguage || 'English';
  const systemPrompt = `You are Guidera — a warm, knowledgeable, and enthusiastic AI travel companion. The user is a traveler who may be exploring a new city or country and needs help.

You can:
- Answer travel-related questions (restaurants, directions, customs, safety, tips)
- Translate phrases or words
- Explain cultural norms and etiquette
- Help with ordering food, reading signs, understanding local customs
- Provide general knowledge about landmarks, history, and culture
- Have friendly, natural conversations

If the user provides an image (camera feed), describe what you see and provide helpful context.

Guidelines:
- Respond in ${lang} (the user's language)
- Be concise: 1-3 sentences unless the user asks for more detail
- Be conversational and warm, like a knowledgeable friend
- If you don't know something, say so honestly
- Never refuse to help — always try your best`;

  const contents: Array<{ role: string; parts: GeminiPart[] }> = [];

  if (conversationHistory?.length) {
    for (const entry of conversationHistory.slice(-6)) {
      contents.push({
        role: entry.role === 'user' ? 'user' : 'model',
        parts: [{ text: entry.text }],
      });
    }
  }

  const userParts: GeminiPart[] = [];
  if (image) {
    userParts.push({ inline_data: { mime_type: 'image/jpeg', data: image } });
  }
  userParts.push({ text: message });
  contents.push({ role: 'user', parts: userParts });

  const responseText = await callGemini(apiKey, contents, systemPrompt, 1024);
  return { response: responseText };
}

async function handleTranslateSnapshot(apiKey: string, body: any) {
  const { image, userLanguage } = body;
  if (!image) throw new Error('image (base64) required');

  const lang = userLanguage || 'English';
  const contents = [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: image } },
      { text: 'Extract and translate all visible text in this image.' },
    ],
  }];

  const raw = await callGemini(apiKey, contents, PROMPTS.translateSnapshot(lang));
  try {
    const parsed = JSON.parse(cleanJson(raw));
    return {
      originalText: parsed.originalText || '',
      translatedText: parsed.translatedText || '',
      sourceLanguage: parsed.sourceLanguage || 'unknown',
      isMenu: parsed.isMenu ?? false,
    };
  } catch {
    return { originalText: '', translatedText: '', sourceLanguage: 'unknown', isMenu: false };
  }
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
      case 'translate-snapshot':
        result = await handleTranslateSnapshot(apiKey, body);
        break;
      case 'chat':
        result = await handleChat(apiKey, body);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Valid: analyze-frame, extract-menu, generate-order, ask-followup, check-menu, translate-snapshot, chat` }),
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
