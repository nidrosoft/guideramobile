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

// Primary: GPT-5.4 (March 2026) — best vision accuracy for document extraction
const OPENAI_MODEL = 'gpt-5.4-2026-03-05';
// Fallback 1: Gemini 3 Flash Preview — fast, supports structured output + vision
const GEMINI_MODEL = 'gemini-3-flash-preview';
// Fallback 2: Claude Haiku 4.5
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const EXTRACTION_PROMPT = `You are a travel booking data extraction expert with PERFECT accuracy. Analyze this image of a travel document (boarding pass, flight ticket, hotel voucher, car rental confirmation, train ticket, or booking confirmation).

Extract ALL available booking information and return it as valid JSON with this exact structure:

{
  "type": "flight" | "hotel" | "car" | "train" | "cruise" | "other",
  "confidence": 0.0-1.0,
  "title": "Human readable title, e.g. 'Costa Airways CZ1448 San Diego to Costa Rica'",
  "confirmationNumber": "booking reference or PNR",
  "provider": {
    "name": "airline/hotel chain/company name",
    "code": "IATA code if airline"
  },
  "origin": {
    "name": "departure city name — the FROM city, where the journey STARTS",
    "code": "IATA airport code of the DEPARTURE airport",
    "terminal": "terminal number if shown",
    "country": "country of origin city"
  },
  "destination": {
    "name": "arrival city or country — the TO destination, where the traveler is GOING",
    "code": "IATA airport code of the ARRIVAL airport",
    "terminal": "terminal number if shown",
    "country": "country of destination"
  },
  "dates": {
    "departure": "YYYY-MM-DDTHH:mm:ss — outbound flight departure date and time",
    "arrival": "YYYY-MM-DDTHH:mm:ss — outbound flight arrival date and time (may be +1 day)",
    "returnDate": "YYYY-MM-DD — return/comeback date if this is a round-trip ticket. Look for RETURN label.",
    "checkIn": "for hotels: YYYY-MM-DD",
    "checkOut": "for hotels: YYYY-MM-DD",
    "tripDurationDays": null
  },
  "details": {
    "flightNumber": "e.g. CZ1448",
    "seatNumber": "e.g. 19A",
    "cabin": "Economy/Premium Economy/Business/First",
    "gate": "gate number",
    "boardingGroup": "group number",
    "airline": "full airline name e.g. Costa Airways",
    "route": "e.g. SAN → SJO or San Diego → San Jose",
    "duration": "flight duration if shown",
    "isRoundTrip": true,
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
2. DATES ARE THE MOST IMPORTANT FIELD. A wrong date = missed flight:
   - Read EVERY digit character by character. "10" = one-zero, NOT "9" or "11".
   - If the ticket says "JULY 10, 2026", output MUST be "2026-07-10". Never off by even 1 day.
   - Cross-reference ALL date instances on the ticket to verify.
   - Common misreads to avoid: 4≠6, 1≠7, 3≠8, 5≠6, 0≠8, 9≠10.
3. ORIGIN vs DESTINATION — this is the SECOND MOST IMPORTANT field:
   - "FROM" / "DEPARTURE" = ORIGIN. This is where the passenger DEPARTS from.
   - "TO" / "DESTINATION" / "ARRIVAL" = DESTINATION. This is where they are GOING.
   - Do NOT confuse the arrival airport city name with the origin. SAN = San Diego, SJO = San Jose.
   - The origin.name should be the DEPARTURE city, not the arrival city.
4. RETURN DATE: If the ticket shows a "RETURN" date, extract it as dates.returnDate.
   - Round-trip tickets show both departure and return dates. Capture BOTH.
   - Also set details.isRoundTrip = true and dates.tripDurationDays if shown.
5. For times: include them as ISO format: "2026-07-10T10:20:00"
   - If arrival shows "+1" (next day), add 1 day to the arrival date.
6. NEVER guess. If you can't read something clearly, use null and lower the confidence.
7. Extract the cabin class exactly: "Economy", "Premium Economy", "Business", "First".
8. If not a travel document: {"type": "unknown", "confidence": 0, "error": "Not a travel document"}`;

/**
 * PRIMARY: Call GPT-5.4 with vision (most accurate for document OCR)
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
      temperature: 0.1,
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
              detail: 'high',
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
 * FALLBACK 2: Call Claude Haiku 4.5 with vision
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
 * FALLBACK 1: Call Gemini 3 Flash Preview with vision
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
        responseMimeType: 'application/json',
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
    endDate: extracted.dates?.returnDate || extracted.dates?.checkOut || extracted.dates?.arrival,
    returnDate: extracted.dates?.returnDate || null,
    tripDurationDays: extracted.dates?.tripDurationDays || null,
    isRoundTrip: extracted.details?.isRoundTrip || false,
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

    // Try GPT-5.4 first (most accurate vision), Gemini 3 Flash second, Claude Haiku third
    try {
      extracted = await extractWithGPT(imageBase64, mediaType);
      modelUsed = OPENAI_MODEL;
      console.log(`[scan-ticket] GPT-5.4 succeeded, confidence: ${extracted.confidence}`);
    } catch (gptError: any) {
      console.warn('[scan-ticket] GPT-5.4 failed, trying Gemini 3 Flash:', gptError.message);
      try {
        extracted = await extractWithGemini(imageBase64, mediaType);
        modelUsed = GEMINI_MODEL;
        console.log(`[scan-ticket] Gemini 3 Flash succeeded, confidence: ${extracted.confidence}`);
      } catch (geminiError: any) {
        console.warn('[scan-ticket] Gemini 3 Flash failed, trying Claude Haiku:', geminiError.message);
        try {
          extracted = await extractWithClaude(imageBase64, mediaType);
          modelUsed = HAIKU_MODEL;
          console.log(`[scan-ticket] Claude Haiku succeeded, confidence: ${extracted.confidence}`);
        } catch (haikuError: any) {
          throw new Error(`All models failed. GPT-5.4: ${gptError.message}. Gemini: ${geminiError.message}. Haiku: ${haikuError.message}`);
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
