import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// MODEL CONFIGURATION - Multi-Model Fallback
// ============================================
// Primary: Claude Opus 4.5 (Released Nov 24, 2025) - Best quality
// Fallback 1: xAI Grok 4 (Released July 9, 2025) - Fast, good reasoning
// Fallback 2: Gemini 3 Flash (Dec 2025) - Cost-effective, 1M context

interface ModelConfig {
  provider: 'anthropic' | 'xai' | 'google';
  model: string;
  maxTokens: number;
  name: string;
}

const MODEL_PRIORITY: ModelConfig[] = [
  {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    maxTokens: 8192,
    name: 'Claude Opus 4.5',
  },
  {
    provider: 'xai',
    model: 'grok-beta',
    maxTokens: 8192,
    name: 'Grok Beta',
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    name: 'Gemini 1.5 Flash',
  },
];

// Initialize clients
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
});

const googleAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY') || '');

const XAI_API_KEY = Deno.env.get('XAI_API_KEY') || '';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// System prompts for each module
const SYSTEM_PROMPTS: Record<string, string> = {
  packing: `You are Guidera's Packing Intelligence Engine. Generate a comprehensive, personalized packing list.

Your output must be valid JSON with this structure:
{
  "summary": { "totalItems": number, "estimatedWeight": "light"|"medium"|"heavy", "luggageRecommendation": string, "criticalItemsCount": number },
  "categories": [{ "id": string, "name": string, "icon": string, "priority": "critical"|"essential"|"recommended"|"optional", "items": [{ "name": string, "quantity": number, "required": boolean, "reason": string, "notes": string, "weight": "minimal"|"light"|"medium"|"heavy" }] }],
  "warnings": [{ "type": string, "severity": "info"|"warning"|"critical", "message": string }],
  "tips": [string]
}

Consider: weather, activities, cultural requirements, health needs, professional items, religious items, documents, and luggage limits.`,

  dos_donts: `You are Guidera's Cultural Intelligence Engine. Generate do's and don'ts for the destination.

Your output must be valid JSON with this structure:
{
  "destinationGuide": { "destination": string, "country": string, "generatedFor": { "tripType": string, "composition": string, "keyConsiderations": [string] }, "summary": { "totalDos": number, "totalDonts": number, "criticalCount": number, "mostImportantTakeaway": string } },
  "items": [{ "type": "do"|"dont", "category": string, "title": string, "description": string, "severity": "critical"|"important"|"helpful"|"optional", "appliesTo": [string], "context": string, "consequence": string, "icon": string }],
  "quickReference": { "mustDo": [string], "neverDo": [string] }
}

Categories: cultural, food, safety, dress, transportation, language, photo, religion, tipping, business, taboo, lgbtq, alcohol, gesture, greeting, shopping, health, emergency.`,

  safety: `You are Guidera's Safety Intelligence Engine. Generate safety guidance for the destination.

Your output must be valid JSON with this structure:
{
  "overallAssessment": { "score": number, "level": string, "summary": string },
  "currentAlerts": [{ "type": string, "title": string, "description": string, "source": string }],
  "emergencyContacts": [{ "service": string, "number": string, "notes": string }],
  "embassy": { "name": string, "address": string, "phone": string } | null,
  "areaGuidance": [{ "name": string, "safetyLevel": "safe"|"caution"|"avoid", "reason": string }],
  "scamAwareness": [{ "name": string, "description": string, "whereCommon": [string], "howToAvoid": string, "severity": "low"|"medium"|"high" }],
  "personalSafetyTips": [string],
  "healthPrecautions": [string]
}`,

  language: `You are Guidera's Language Intelligence Engine. Generate essential phrases and language tips.

Your output must be valid JSON with this structure:
{
  "destination": string,
  "primaryLanguage": { "name": string, "code": string, "script": string, "difficulty": "easy"|"moderate"|"challenging"|"difficult" },
  "otherLanguages": [string],
  "englishProficiency": "widespread"|"common"|"limited"|"rare",
  "categories": [{ "id": string, "name": string, "icon": string, "phrases": [{ "english": string, "local": string, "transliteration": string, "context": string }] }],
  "culturalNotes": [string],
  "translationApps": [string],
  "offlineTips": [string]
}

Categories: greetings, basics, directions, dining, shopping, emergency, numbers, polite_phrases.`,

  budget: `You are Guidera's Budget Intelligence Engine. Generate budget guidance for the destination.

Your output must be valid JSON with this structure:
{
  "destination": string,
  "tripDuration": number,
  "currency": { "local": { "code": string, "symbol": string }, "user": { "code": string, "symbol": string }, "exchangeRate": number },
  "dailyBudgetEstimate": { "budget": { "min": number, "max": number }, "midRange": { "min": number, "max": number }, "luxury": { "min": number, "max": number }, "yourTier": string, "yourEstimate": number },
  "breakdown": [{ "category": string, "icon": string, "budgetOption": string, "midRangeOption": string, "luxuryOption": string, "yourEstimate": number, "currency": string }],
  "totalEstimate": { "min": number, "max": number, "recommended": number },
  "savingTips": [string],
  "splurgeRecommendations": [string],
  "hiddenCosts": [string],
  "paymentTips": [string]
}`,

  cultural: `You are Guidera's Cultural Intelligence Engine. Generate cultural insights for the destination.

Your output must be valid JSON with this structure:
{
  "destination": string,
  "culturalOverview": string,
  "keyValues": [string],
  "socialNorms": [{ "topic": string, "insight": string, "importance": "essential"|"important"|"helpful", "icon": string }],
  "religiousContext": { "dominantReligion": string, "otherReligions": [string], "religiousSites": [string], "observances": [string] },
  "diningEtiquette": [{ "topic": string, "insight": string, "importance": string, "icon": string }],
  "taboos": [string],
  "localCustoms": [{ "topic": string, "insight": string, "importance": string, "icon": string }],
  "festivalsDuringTrip": [{ "name": string, "date": string, "description": string, "impact": string }]
}`,

  documents: `You are Guidera's Document Intelligence Engine. Generate a document checklist.

Your output must be valid JSON with this structure:
{
  "destination": string,
  "nationality": string,
  "travelDates": { "start": string, "end": string },
  "documents": [{ "document": string, "required": boolean, "status": "valid"|"expiring_soon"|"expired"|"needed"|"not_applicable", "notes": string, "action": { "type": string, "description": string, "url": string, "deadline": string } | null, "icon": string }],
  "criticalActions": [{ "document": string, "action": string, "deadline": string, "priority": "urgent"|"soon"|"before_travel" }],
  "printChecklist": [string],
  "digitalCopiesRecommended": [string],
  "tips": [string]
}`,
};

// ============================================
// PROVIDER-SPECIFIC API CALLS
// ============================================

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const responseContent = message.content[0];
  if (responseContent.type !== 'text') {
    throw new Error('Unexpected Anthropic response type');
  }

  return {
    text: responseContent.text,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

async function callXAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  _maxTokens: number
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const geminiModel = googleAI.getGenerativeModel({ 
    model,
    systemInstruction: systemPrompt,
  });

  const result = await geminiModel.generateContent(userPrompt);
  const response = result.response;
  const text = response.text();

  return {
    text,
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
  };
}

// ============================================
// MULTI-MODEL FALLBACK ORCHESTRATOR
// ============================================

interface GenerationResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  provider: string;
  fallbacksAttempted: string[];
}

async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string
): Promise<GenerationResult> {
  const fallbacksAttempted: string[] = [];
  let lastError: Error | null = null;

  for (const config of MODEL_PRIORITY) {
    try {
      console.log(`Attempting generation with ${config.name} (${config.provider})`);

      let result: { text: string; inputTokens: number; outputTokens: number };

      switch (config.provider) {
        case 'anthropic':
          if (!Deno.env.get('ANTHROPIC_API_KEY')) {
            throw new Error('ANTHROPIC_API_KEY not configured');
          }
          result = await callAnthropic(systemPrompt, userPrompt, config.model, config.maxTokens);
          break;

        case 'xai':
          if (!XAI_API_KEY) {
            throw new Error('XAI_API_KEY not configured');
          }
          result = await callXAI(systemPrompt, userPrompt, config.model, config.maxTokens);
          break;

        case 'google':
          if (!Deno.env.get('GOOGLE_AI_API_KEY')) {
            throw new Error('GOOGLE_AI_API_KEY not configured');
          }
          result = await callGemini(systemPrompt, userPrompt, config.model, config.maxTokens);
          break;

        default:
          throw new Error(`Unknown provider: ${config.provider}`);
      }

      console.log(`Successfully generated with ${config.name}`);
      return {
        ...result,
        modelUsed: config.model,
        provider: config.provider,
        fallbacksAttempted,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${config.name} failed: ${errorMessage}`);
      fallbacksAttempted.push(`${config.name}: ${errorMessage}`);
      lastError = error instanceof Error ? error : new Error(errorMessage);
    }
  }

  throw new Error(`All models failed. Attempts: ${fallbacksAttempted.join('; ')}`);
}

// ============================================
// MAIN REQUEST HANDLER
// ============================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, moduleType, context } = await req.json();

    if (action !== 'generate') {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!moduleType || !SYSTEM_PROMPTS[moduleType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid module type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Context required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the user prompt with context
    const userPrompt = buildUserPrompt(moduleType, context);
    const systemPrompt = SYSTEM_PROMPTS[moduleType];

    // Generate with multi-model fallback
    const generation = await generateWithFallback(systemPrompt, userPrompt);

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = generation.text;
      const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      // Also handle plain code blocks
      const codeMatch = jsonText.match(/```\n?([\s\S]*?)\n?```/);
      if (codeMatch && !jsonMatch) {
        jsonText = codeMatch[1];
      }
      result = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Response text:', generation.text);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        meta: {
          modelUsed: generation.modelUsed,
          provider: generation.provider,
          fallbacksAttempted: generation.fallbacksAttempted,
        },
        usage: {
          inputTokens: generation.inputTokens,
          outputTokens: generation.outputTokens,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildUserPrompt(moduleType: string, context: any): string {
  const { trip, travelers, primaryTraveler, bookings, destination, realtime, weather } = context;

  // Handle both context formats (old format with trip.primaryDestination and new format with destination.basic)
  const destName = trip?.primaryDestination?.name || destination?.basic?.name || 'Unknown';
  const destCountry = trip?.primaryDestination?.country || destination?.basic?.code || 'Unknown';
  const tripDuration = trip?.durationDays || 'Unknown';
  const tripType = trip?.tripType || 'leisure';
  const composition = trip?.composition || 'solo';
  const budgetTier = trip?.budgetTier || trip?.budget?.style || 'moderate';
  const budgetCurrency = trip?.budgetCurrency || trip?.budget?.currency || 'USD';
  const budgetTotal = trip?.budgetTotal || trip?.budget?.total || 'not specified';

  const baseInfo = `
## Trip Information
- Destination: ${destName}, ${destCountry}
- Dates: ${trip?.startDate || 'Unknown'} to ${trip?.endDate || 'Unknown'} (${tripDuration} days)
- Trip Type: ${tripType}
- Travelers: ${travelers?.length || trip?.travelersCount || 1} (${composition})
- Budget: ${budgetTier} (${budgetCurrency} ${budgetTotal})

## Primary Traveler
- Nationality: ${primaryTraveler?.demographics?.nationality || 'US'}
- Languages: ${primaryTraveler?.demographics?.languagesSpoken?.join(', ') || 'English'}
${primaryTraveler?.professional?.profession ? `- Profession: ${primaryTraveler.professional.profession}` : ''}
${primaryTraveler?.cultural?.religion && primaryTraveler.cultural.religion !== 'none' ? `- Religion: ${primaryTraveler.cultural.religion} (${primaryTraveler.cultural.religiousObservance})` : ''}
${primaryTraveler?.health?.conditions?.length ? `- Health Conditions: ${primaryTraveler.health.conditions.join(', ')}` : ''}
${primaryTraveler?.health?.allergies?.length ? `- Allergies: ${primaryTraveler.health.allergies.join(', ')}` : ''}
${primaryTraveler?.health?.medications?.length ? `- Medications: ${primaryTraveler.health.medications.join(', ')}` : ''}
${primaryTraveler?.preferences?.packingStyle ? `- Packing Style: ${primaryTraveler.preferences.packingStyle}` : ''}
${primaryTraveler?.preferences?.activityLevel ? `- Activity Level: ${primaryTraveler.preferences.activityLevel}` : ''}
${primaryTraveler?.preferences?.photography ? `- Photography: ${primaryTraveler.preferences.photography}` : ''}

## Destination Info
- Primary Language: ${destination?.culture?.primaryLanguage || 'Unknown'}
- Currency: ${destination?.practical?.currency || 'Unknown'}
- Climate: ${destination?.geography?.climate || destination?.geography?.climateType || 'Unknown'}
- Safety Score: ${destination?.safety?.overallScore || 'Unknown'}
- Tap Water Safe: ${destination?.practical?.tapWaterSafe ? 'Yes' : 'No'}
- Power Plug: ${destination?.practical?.powerPlugType || 'Unknown'}
- Voltage: ${destination?.practical?.voltage || 'Unknown'}V
`;

  const bookingsInfo = bookings?.totalBookings > 0 ? `
## Bookings
${bookings.hasFlights ? `- Flights: ${bookings.flights.length} (${bookings.flights.map((f: any) => f.airline).join(', ')})` : ''}
${bookings.hasHotels ? `- Hotels: ${bookings.hotels.length}` : ''}
${bookings.hasCars ? `- Car Rentals: ${bookings.cars.length}` : ''}
${bookings.hasExperiences ? `- Experiences: ${bookings.experiences.length}` : ''}
` : '';

  // Handle both weather formats
  const weatherData = weather || realtime?.weather;
  const weatherInfo = weatherData ? `
## Weather Forecast
- Current Temperature: ${weatherData.current?.temperature || weatherData.summary?.temperatureRange?.min || '?'}°C
- Feels Like: ${weatherData.current?.feelsLike || '?'}°C
- Average High: ${weatherData.forecast?.averageHigh || weatherData.summary?.temperatureRange?.max || '?'}°C
- Average Low: ${weatherData.forecast?.averageLow || weatherData.summary?.temperatureRange?.min || '?'}°C
- Conditions: ${weatherData.current?.conditions || weatherData.summary?.overallCondition || 'Unknown'}
- Season: ${weatherData.forecast?.season || 'Unknown'}
- UV Index: ${weatherData.forecast?.uvIndex || 'Unknown'}
${weatherData.packingImplications?.length ? `- Packing Notes: ${weatherData.packingImplications.join(', ')}` : ''}
` : '';

  // Activities info
  const activitiesInfo = trip?.activities?.length ? `
## Planned Activities
${trip.activities.map((a: any) => `- ${a.name} (${a.type}) - ${a.date}`).join('\n')}
` : '';

  let moduleSpecificPrompt = '';

  switch (moduleType) {
    case 'packing':
      moduleSpecificPrompt = `
Generate a comprehensive packing list for this trip. Consider:
1. Weather conditions and activities
2. Cultural dress requirements
3. Professional items if traveling for work
4. Religious items based on observance level
5. Health/medical needs
6. Document requirements
7. Airline baggage limits
8. Duration of trip

Include quantities based on trip length and laundry availability.`;
      break;

    case 'dos_donts':
      moduleSpecificPrompt = `
Generate cultural do's and don'ts for ${destName}, ${destCountry}. Consider:
1. The traveler's nationality and cultural background
2. Trip type (${tripType})
3. Traveler composition (${composition})
4. Any religious considerations
5. LGBTQ+ safety if relevant
6. Business etiquette if business trip

Prioritize critical safety and legal issues first.`;
      break;

    case 'safety':
      moduleSpecificPrompt = `
Generate safety guidance for ${destName}, ${destCountry}. Include:
1. Overall safety assessment
2. Emergency contacts (police, ambulance, tourist police)
3. Embassy information for ${primaryTraveler?.demographics?.nationality || 'US'} citizens
4. Areas to avoid
5. Common scams
6. Health precautions
7. Personal safety tips`;
      break;

    case 'language':
      moduleSpecificPrompt = `
Generate essential phrases for ${destName}, ${destCountry}. Include:
1. Basic greetings
2. Common phrases for travelers
3. Emergency phrases
4. Dining phrases
5. Shopping/bargaining phrases
6. Direction asking
7. Polite expressions
8. Numbers 1-10

Provide local script, transliteration, and pronunciation hints.`;
      break;

    case 'budget':
      moduleSpecificPrompt = `
Generate budget guidance for ${destName}, ${destCountry}. Consider:
1. Trip duration: ${tripDuration} days
2. Budget tier: ${budgetTier}
3. User's currency: ${primaryTraveler?.financial?.preferredCurrency || 'USD'}
4. Activities planned

Provide daily estimates and total trip budget breakdown.`;
      break;

    case 'cultural':
      moduleSpecificPrompt = `
Generate cultural insights for ${destName}, ${destCountry}. Include:
1. Cultural overview and values
2. Social norms and etiquette
3. Religious context
4. Dining customs
5. Taboos to avoid
6. Local customs
7. Any festivals during the trip dates`;
      break;

    case 'documents':
      moduleSpecificPrompt = `
Generate a document checklist for traveling from ${primaryTraveler?.demographics?.countryOfResidence || 'US'} to ${destCountry}. Consider:
1. Passport validity requirements
2. Visa requirements for ${primaryTraveler?.demographics?.nationality || 'US'} citizens
3. Travel insurance
4. Health certificates/vaccinations
5. Booking confirmations
6. Driver's license/IDP if renting car

Check passport expiry: ${primaryTraveler?.documents?.passport?.expirationDate || 'Unknown'}`;
      break;
  }

  return baseInfo + bookingsInfo + weatherInfo + activitiesInfo + '\n' + moduleSpecificPrompt;
}
