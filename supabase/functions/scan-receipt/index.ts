/**
 * SCAN RECEIPT — AI Vision Edge Function
 * 
 * Extracts expense items from receipt photos using AI vision.
 * Identifies individual items, categories, amounts, and totals.
 * Returns structured expense data ready to insert into the expense tracker.
 * 
 * Models: Claude Haiku 4.5 (primary) → GPT-4o-mini → Gemini 2.5 Flash (fallback)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getUserIdFromRequest } from '../_shared/auth.ts';
import {
  beginAiInputGuard,
  setAiInputDedupeCache,
} from '../_shared/aiInputGuard.ts';
import { guardAiRequest, AI_LIMITS } from '../_shared/aiRateGuard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_PUBLIC_KEY') || '';
const MAX_SCAN_IMAGE_BYTES = 7 * 1024 * 1024;

const RECEIPT_PROMPT = `You are an expert receipt analyzer. Extract ALL expense items from this receipt image.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "merchant": "Store or restaurant name",
  "date": "YYYY-MM-DD (date on receipt, or null if not visible)",
  "currency": "USD (3-letter currency code, detect from symbols like $, €, £, ¥, or text)",
  "items": [
    {
      "description": "Item name exactly as shown",
      "amount": 12.99,
      "category": "food | transport | accommodation | activities | shopping | health | other",
      "quantity": 1
    }
  ],
  "subtotal": 25.98,
  "tax": 2.08,
  "tip": 0,
  "total": 28.06,
  "paymentMethod": "credit_card | debit_card | cash | digital_wallet | other",
  "confidence": 0.95
}

RULES:
1. Extract EVERY line item individually. If there are 5 items, return 5 items.
2. If only a total is visible (no itemized list), create ONE item with the total amount.
3. Category detection:
   - Restaurants, cafes, bars, grocery stores → "food"
   - Taxi, uber, gas, parking, metro/subway → "transport"
   - Hotel, airbnb, hostel → "accommodation"
   - Museum, tour, theme park, tickets → "activities"
   - Clothing, electronics, souvenirs, gifts → "shopping"
   - Pharmacy, doctor, medicine → "health"
   - Everything else → "other"
4. Detect the currency from symbols ($=USD, €=EUR, £=GBP, ¥=JPY/CNY, etc.) or text on receipt.
5. Payment method: look for "VISA", "MASTERCARD", "CASH", "Apple Pay", etc.
6. Amounts must be numbers (not strings). Parse "12,99" as 12.99 for European formats.
7. If the image is NOT a receipt: {"error": "Not a receipt", "confidence": 0}
8. NEVER guess amounts. If you can't read a price clearly, use null and lower confidence.`;

// ─── AI Vision Providers ───────────────────────────

async function extractWithClaude(imageBase64: string, mediaType: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: RECEIPT_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function extractWithGPT(imageBase64: string, mediaType: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: RECEIPT_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:${mediaType};base64,${imageBase64}` },
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function extractWithGemini(imageBase64: string, mediaType: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mediaType, data: imageBase64 } },
          { text: RECEIPT_PROMPT },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Parse JSON from AI response ───────────────────

function parseReceiptJSON(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  return JSON.parse(jsonMatch[0]);
}

// ─── Normalize payment method to DB enum ───────────

const VALID_PAYMENT_METHODS = ['credit_card', 'debit_card', 'cash', 'digital_wallet', 'other'];

function normalizePaymentMethod(raw: string | undefined): string {
  if (!raw) return 'other';
  const lower = raw.toLowerCase().trim();

  // Already a valid enum value
  if (VALID_PAYMENT_METHODS.includes(lower)) return lower;

  // Credit card variants
  if (/visa|mastercard|amex|american express|discover|diners|jcb|credit|carte/.test(lower)) return 'credit_card';
  // Debit card variants
  if (/debit|maestro|interac|eftpos/.test(lower)) return 'debit_card';
  // Cash variants
  if (/cash|especes|efectivo|bargeld|contant/.test(lower)) return 'cash';
  // Digital wallet variants
  if (/apple\s?pay|google\s?pay|samsung\s?pay|paypal|venmo|zelle|alipay|wechat|digital|mobile|contactless|nfc|tap/.test(lower)) return 'digital_wallet';

  return 'other';
}

// ─── Normalize items into expense format ───────────

function normalizeExpenseItems(parsed: any, defaultCurrency: string): any[] {
  const items = parsed.items || [];
  const date = parsed.date || new Date().toISOString().split('T')[0];
  const currency = parsed.currency || defaultCurrency;
  const paymentMethod = normalizePaymentMethod(parsed.paymentMethod);
  const merchant = parsed.merchant || 'Unknown';

  if (items.length === 0 && parsed.total) {
    // No itemized list — create a single expense from the total
    const category = detectMerchantCategory(merchant);
    return [{
      description: merchant,
      amount: parsed.total,
      currency,
      category,
      date,
      paymentMethod,
      notes: `Receipt total from ${merchant}`,
    }];
  }

  const validCategories = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'entertainment', 'health', 'communication', 'tips', 'other'];
  const normalizeCategory = (cat: string | undefined): string => {
    if (!cat) return 'other';
    const lower = cat.toLowerCase().trim();
    if (validCategories.includes(lower)) return lower;
    if (/food|dining|restaurant|grocery|meal|drink|beverage/.test(lower)) return 'food';
    if (/transport|taxi|uber|gas|fuel|parking|bus|train|metro/.test(lower)) return 'transport';
    if (/hotel|accommodation|lodging|hostel|airbnb/.test(lower)) return 'accommodation';
    if (/activit|tour|museum|ticket|experience/.test(lower)) return 'activities';
    if (/shop|retail|cloth|souvenir|gift|electronics/.test(lower)) return 'shopping';
    if (/entertainment|nightlife|movie|concert|club|casino|cinema|theater/.test(lower)) return 'entertainment';
    if (/health|pharmacy|medicine|medical|doctor|hospital/.test(lower)) return 'health';
    if (/sim|phone|wifi|internet|call|communication/.test(lower)) return 'communication';
    if (/tip|gratuity|service charge/.test(lower)) return 'tips';
    return 'other';
  };

  return items.map((item: any) => ({
    description: item.description || 'Unknown item',
    amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
    currency,
    category: normalizeCategory(item.category),
    date,
    paymentMethod,
    notes: items.length > 1 ? `${merchant} (${item.quantity || 1}x)` : `Receipt from ${merchant}`,
  })).filter((item: any) => item.amount > 0);
}

function detectMerchantCategory(merchant: string): string {
  const name = merchant.toLowerCase();
  if (/restaurant|cafe|coffee|pizza|burger|sushi|bakery|bar|grill|diner|food|eat|kitchen/.test(name)) return 'food';
  if (/uber|lyft|taxi|gas|shell|bp|parking|metro|transit/.test(name)) return 'transport';
  if (/hotel|airbnb|hostel|inn|resort|lodge/.test(name)) return 'accommodation';
  if (/museum|tour|park|cinema|theater|ticket|adventure/.test(name)) return 'activities';
  if (/pharmacy|cvs|walgreens|doctor|clinic|hospital/.test(name)) return 'health';
  if (/mall|store|shop|market|amazon|walmart|target|zara|nike/.test(name)) return 'shopping';
  return 'other';
}

// ─── Main Handler ──────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64, mediaType = 'image/jpeg', currency = 'USD' } = body;

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const __rl = await guardAiRequest({
      req, body, supabase, config: AI_LIMITS.ocr,
      corsHeaders, supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, anonKey: SUPABASE_ANON_KEY,
    });
    if (__rl) return __rl;

    const guard = await beginAiInputGuard({
      req,
      body,
      supabase,
      kind: 'scan_receipt',
      fieldName: 'imageBase64',
      maxBytes: MAX_SCAN_IMAGE_BYTES,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      mimeType: mediaType,
      corsHeaders,
      resolveUserId: () =>
        getUserIdFromRequest(req, body, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY),
    });
    if (guard.response) return guard.response;

    const normalizedImageBase64 = body.imageBase64;

    let rawText: string;
    let modelUsed: string;

    // Try Claude Haiku first (fastest), then GPT-4o-mini, then Gemini
    try {
      rawText = await extractWithClaude(normalizedImageBase64, mediaType);
      modelUsed = 'claude-haiku-4-5';
    } catch (claudeErr: any) {
      console.warn('Claude failed, trying GPT:', claudeErr.message);
      try {
        rawText = await extractWithGPT(normalizedImageBase64, mediaType);
        modelUsed = 'gpt-4o-mini';
      } catch (gptErr: any) {
        console.warn('GPT failed, trying Gemini:', gptErr.message);
        try {
          rawText = await extractWithGemini(normalizedImageBase64, mediaType);
          modelUsed = 'gemini-2.5-flash';
        } catch (geminiErr: any) {
          throw new Error(`All models failed. Claude: ${claudeErr.message}. GPT: ${gptErr.message}. Gemini: ${geminiErr.message}`);
        }
      }
    }

    // Parse the AI response
    const parsed = parseReceiptJSON(rawText);

    // Check for error response (not a receipt)
    if (parsed.error || parsed.confidence < 0.2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: parsed.error || 'Could not identify receipt information in this image',
          confidence: parsed.confidence || 0,
          modelUsed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize into expense items
    const expenses = normalizeExpenseItems(parsed, currency);

    const responseBody = {
      success: true,
      merchant: parsed.merchant,
      date: parsed.date,
      currency: parsed.currency || currency,
      items: expenses,
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      tip: parsed.tip,
      total: parsed.total,
      paymentMethod: parsed.paymentMethod,
      confidence: parsed.confidence,
      modelUsed,
      itemCount: expenses.length,
    };
    if (guard.userId && guard.payloadHash) {
      await setAiInputDedupeCache(supabase, 'scan_receipt', guard.userId, guard.payloadHash, responseBody);
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scan receipt error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
