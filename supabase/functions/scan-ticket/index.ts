/**
 * SCAN TICKET — OCR Edge Function
 * 
 * Extracts travel booking data from scanned tickets, boarding passes,
 * hotel vouchers, and booking confirmations using Claude Sonnet vision.
 * 
 * Accepts base64 image data, sends to Claude for structured extraction,
 * returns normalized booking data.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';

// Primary: Claude Haiku 4.5 (Oct 2025) — fastest vision model with good accuracy
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
// Fallback 1: GPT-4o-mini — fast and cheap OpenAI model
const OPENAI_MODEL = 'gpt-4o-mini';
// Fallback 2: Gemini 2.0 Flash
const GEMINI_MODEL = 'gemini-2.0-flash';

const EXTRACTION_PROMPT = `You are a travel booking data extraction expert with perfect accuracy. Analyze this image of a travel document (boarding pass, flight ticket, hotel voucher, car rental confirmation, train ticket, or booking confirmation).

Extract ALL available booking information and return it as valid JSON with this exact structure:

{
  "type": "flight" | "hotel" | "car" | "train" | "cruise" | "other",
  "confidence": 0.0-1.0,
  "title": "Human readable title, e.g. 'Japan Airlines JL951 Tokyo to Seoul'",
  "confirmationNumber": "booking reference or PNR",
  "provider": {
    "name": "airline/hotel chain/company name",
    "code": "IATA code if airline"
  },
  "origin": {
    "name": "departure city or location name",
    "code": "IATA airport code if applicable",
    "terminal": "terminal number if shown"
  },
  "destination": {
    "name": "arrival city or location name",
    "code": "IATA airport code if applicable",
    "terminal": "terminal number if shown"
  },
  "dates": {
    "departure": "YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD",
    "arrival": "YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD",
    "checkIn": "for hotels: YYYY-MM-DD",
    "checkOut": "for hotels: YYYY-MM-DD"
  },
  "details": {
    "flightNumber": "e.g. JL951",
    "seatNumber": "e.g. 05C",
    "cabin": "Economy/Premium Economy/Business/First",
    "gate": "gate number",
    "boardingGroup": "group number",
    "airline": "full airline name e.g. Japan Airlines",
    "route": "e.g. TYO → ICN or Tokyo → Seoul",
    "duration": "flight duration if shown, e.g. 2h 30m",
    "hotelName": "hotel name for hotels",
    "roomType": "room type for hotels",
    "carType": "car type for rentals",
    "carCompany": "rental company",
    "trainNumber": "train number"
  },
  "travelers": [
    {
      "name": "passenger/guest full name exactly as printed",
      "ticketNumber": "e-ticket number if shown"
    }
  ],
  "pricing": {
    "total": null,
    "currency": "USD"
  },
  "barcode": "barcode or QR code data if readable",
  "rawText": "any other important text from the document"
}

CRITICAL ACCURACY RULES — READ CAREFULLY:
1. Return ONLY valid JSON. No markdown, no backticks, no explanation.
2. DATES ARE THE MOST IMPORTANT FIELD. A wrong date = missed flight. Read EVERY digit individually:
   - Look at each character in the date one by one. "14" has a "1" then a "4". NOT "16".
   - If the ticket says "14 SEP 2028", the output MUST be "2028-09-14". Never "2028-09-16".
   - If the date appears multiple times on the ticket, cross-reference ALL instances to verify.
   - Common misreads to avoid: 4≠6, 1≠7, 3≠8, 5≠6, 0≠8.
3. For times: if "18:15" or "19:00" is shown, include it: "2028-09-14T18:15:00"
4. NEVER guess. If you can't read something clearly, use null and lower the confidence.
5. Extract the cabin class exactly: "Economy", "Premium Economy", "Business", "First".
6. Extract the route as "ORIGIN_CODE → DESTINATION_CODE" format.
7. If not a travel document: {"type": "unknown", "confidence": 0, "error": "Not a travel document"}`;

/**
 * PRIMARY: Call GPT-5.4 with vision (most accurate)
 */
async function extractWithGPT(imageBase64: string, mediaType: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
            },
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GPT-5.4 API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in GPT-5.4 response');

  return JSON.parse(jsonMatch[0]);
}

/**
 * FALLBACK 1: Call Claude Sonnet with vision
 */
async function extractWithClaude(imageBase64: string, mediaType: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
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
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Claude response');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Fallback: Call Gemini 2.0 Flash with vision
 */
async function extractWithGemini(imageBase64: string, mediaType: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mediaType,
              data: imageBase64,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  return JSON.parse(jsonMatch[0]);
}

/**
 * Normalize extracted data into the standard NormalizedBooking format
 */
function normalizeExtraction(extracted: any): any {
  const type = extracted.type || 'other';

  return {
    externalId: `scan_${Date.now()}`,
    provider: 'scan',
    category: type === 'unknown' ? 'other' : type,
    title: extracted.title || `${type} booking`,
    confirmationNumber: extracted.confirmationNumber,
    providerName: extracted.provider?.name,
    status: 'confirmed',
    startDate: extracted.dates?.departure || extracted.dates?.checkIn,
    endDate: extracted.dates?.arrival || extracted.dates?.checkOut,
    startLocation: {
      name: extracted.origin?.name,
      code: extracted.origin?.code,
    },
    endLocation: {
      name: extracted.destination?.name,
      code: extracted.destination?.code,
    },
    pricing: extracted.pricing,
    travelers: extracted.travelers || [],
    details: {
      ...extracted.details,
      gate: extracted.details?.gate,
      seatNumber: extracted.details?.seatNumber,
      cabin: extracted.details?.cabin,
      airline: extracted.details?.airline || extracted.provider?.name,
      route: extracted.details?.route || (extracted.origin?.code && extracted.destination?.code ? `${extracted.origin.code} → ${extracted.destination.code}` : null),
      duration: extracted.details?.duration,
      barcode: extracted.barcode,
    },
    confidence: extracted.confidence || 0.5,
    rawData: extracted,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, mediaType = 'image/jpeg', userId } = await req.json();

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    let extracted: any;
    let modelUsed: string;

    // Try Haiku 4.5 first (fastest), GPT-4o-mini second, Gemini third
    try {
      extracted = await extractWithClaude(imageBase64, mediaType);
      modelUsed = HAIKU_MODEL;
    } catch (haikuError: any) {
      console.warn('Haiku failed, trying GPT-4o-mini:', haikuError.message);
      try {
        extracted = await extractWithGPT(imageBase64, mediaType);
        modelUsed = OPENAI_MODEL;
      } catch (gptError: any) {
        console.warn('GPT-4o-mini failed, trying Gemini:', gptError.message);
        try {
          extracted = await extractWithGemini(imageBase64, mediaType);
          modelUsed = GEMINI_MODEL;
        } catch (geminiError: any) {
          throw new Error(`All models failed. Haiku: ${haikuError.message}. GPT: ${gptError.message}. Gemini: ${geminiError.message}`);
        }
      }
    }

    // Check if it's a valid travel document
    if (extracted.type === 'unknown' || extracted.confidence < 0.2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: extracted.error || 'Could not identify travel booking information in this image',
          extracted,
          modelUsed,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize into our standard format
    const normalized = normalizeExtraction(extracted);

    // If userId provided, create an import record
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('trip_imports').insert({
        user_id: userId,
        import_method: 'scan_ocr',
        provider: 'scan',
        raw_input_type: 'image',
        parsed_data: extracted,
        normalized_data: normalized,
        parse_status: 'parsed',
        overall_confidence: extracted.confidence,
        processing_status: 'pending',
        parsed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: normalized,
        extracted,
        modelUsed,
        confidence: extracted.confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scan ticket error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
