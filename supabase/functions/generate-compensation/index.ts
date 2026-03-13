/**
 * GENERATE COMPENSATION ANALYSIS — AI Claim Analysis Edge Function
 *
 * Analyzes a flight disruption claim using regulation knowledge (EU261, UK261, APPR, etc.)
 * and generates: eligibility verdict, compensation amount, claim letter, filing options,
 * gate protocol, and airline intel.
 *
 * This is a REACTIVE module — triggered when a user reports a disruption or adds a claim,
 * NOT at trip creation like other generation modules.
 *
 * AI: Gemini 2.5 Flash (primary), Claude Haiku 4.5 (fallback)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

// ─── Regulation Knowledge ───────────────────────────────

const EU_MEMBER_STATES = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'IS','NO','CH','LI',
];

function determineRegulation(departureCountry: string, arrivalCountry: string, airlineCountry: string): {
  regulation: string;
  details: any;
} {
  const depUpper = (departureCountry || '').toUpperCase();
  const arrUpper = (arrivalCountry || '').toUpperCase();
  const airUpper = (airlineCountry || '').toUpperCase();

  // EU261: Departure from EU, OR arrival in EU on EU carrier
  if (EU_MEMBER_STATES.includes(depUpper) || (EU_MEMBER_STATES.includes(arrUpper) && EU_MEMBER_STATES.includes(airUpper))) {
    return {
      regulation: 'EU261',
      details: {
        name: 'EU Regulation 261/2004',
        shortName: 'EU261',
        jurisdiction: 'European Union',
        delayThresholdMinutes: 180,
        tiers: [
          { distanceTier: 'short_haul', distanceRange: '≤1,500 km', amount: 250, currency: 'EUR' },
          { distanceTier: 'medium_haul', distanceRange: '1,500–3,500 km', amount: 400, currency: 'EUR' },
          { distanceTier: 'long_haul', distanceRange: '>3,500 km', amount: 600, currency: 'EUR' },
        ],
        statuteOfLimitationsYears: 6,
        notes: 'Extraordinary circumstances (weather, ATC strikes, security) exempt the airline.',
      },
    };
  }

  // UK261: Departure from UK, OR arrival in UK on UK carrier
  if (depUpper === 'GB' || (arrUpper === 'GB' && airUpper === 'GB')) {
    return {
      regulation: 'UK261',
      details: {
        name: 'UK Air Passenger Rights (UK261)',
        shortName: 'UK261',
        jurisdiction: 'United Kingdom',
        delayThresholdMinutes: 180,
        tiers: [
          { distanceTier: 'short_haul', distanceRange: '≤1,500 km', amount: 220, currency: 'GBP' },
          { distanceTier: 'medium_haul', distanceRange: '1,500–3,500 km', amount: 350, currency: 'GBP' },
          { distanceTier: 'long_haul', distanceRange: '>3,500 km', amount: 520, currency: 'GBP' },
        ],
        statuteOfLimitationsYears: 6,
        notes: 'Mirrors EU261 with GBP amounts. File via airline, then CAA.',
      },
    };
  }

  // Canadian APPR
  if (depUpper === 'CA' || arrUpper === 'CA') {
    return {
      regulation: 'APPR',
      details: {
        name: 'Canadian Air Passenger Protection Regulations',
        shortName: 'APPR',
        jurisdiction: 'Canada',
        delayThresholdMinutes: 180,
        tiers: [
          { distanceTier: 'short_haul', distanceRange: '3–6 hour delay', amount: 400, currency: 'CAD' },
          { distanceTier: 'medium_haul', distanceRange: '6–9 hour delay', amount: 700, currency: 'CAD' },
          { distanceTier: 'long_haul', distanceRange: '9+ hour delay', amount: 1000, currency: 'CAD' },
        ],
        statuteOfLimitationsYears: 2,
        notes: 'Only applies to large carriers for situations within airline control. Small carriers have lower tiers.',
      },
    };
  }

  // Australian ACCC
  if (depUpper === 'AU' || arrUpper === 'AU') {
    return {
      regulation: 'ACCC',
      details: {
        name: 'Australian Consumer Law',
        shortName: 'ACCC',
        jurisdiction: 'Australia',
        delayThresholdMinutes: 0,
        tiers: [],
        statuteOfLimitationsYears: 6,
        notes: 'No fixed compensation amounts. Consumer guarantees apply — service must be provided with due care and within reasonable time. Case-by-case.',
      },
    };
  }

  // US DOT
  if (depUpper === 'US' || arrUpper === 'US') {
    return {
      regulation: 'US_DOT',
      details: {
        name: 'US Department of Transportation Rules',
        shortName: 'US_DOT',
        jurisdiction: 'United States',
        delayThresholdMinutes: 0,
        tiers: [],
        statuteOfLimitationsYears: 0,
        notes: 'The US has NO federal law mandating compensation for flight delays. Denied boarding (involuntary bumping) is covered: up to 400% of one-way fare (max $1,550). Airlines may offer vouchers voluntarily.',
      },
    };
  }

  return {
    regulation: 'AIRLINE_POLICY',
    details: {
      name: 'Airline-Specific Policy',
      shortName: 'AIRLINE_POLICY',
      jurisdiction: 'Varies',
      delayThresholdMinutes: 0,
      tiers: [],
      statuteOfLimitationsYears: 0,
      notes: 'No specific regulation applies. Compensation depends on the airline\'s own contract of carriage and goodwill policies.',
    },
  };
}

function getDistanceTier(distanceKm: number): string {
  if (distanceKm <= 1500) return 'short_haul';
  if (distanceKm <= 3500) return 'medium_haul';
  return 'long_haul';
}

// ─── Context Builder ────────────────────────────────────

async function buildContext(supabase: any, claimId: string) {
  const { data: claim, error: claimErr } = await supabase
    .from('compensation_claims')
    .select('*')
    .eq('id', claimId)
    .single();
  if (claimErr || !claim) throw new Error(`Claim not found: ${claimErr?.message || 'unknown'}`);

  const { data: trip } = await supabase
    .from('trips').select('*').eq('id', claim.trip_id).single();

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', claim.user_id).single();

  const { data: bookings } = await supabase
    .from('trip_bookings').select('*').eq('trip_id', claim.trip_id);

  const { data: travelers } = await supabase
    .from('trip_travelers').select('*').eq('trip_id', claim.trip_id);

  // Try to find rights card for this claim
  let rightsCard = null;
  if (claim.rights_card_id) {
    const { data: rc } = await supabase
      .from('compensation_rights_cards')
      .select('*')
      .eq('id', claim.rights_card_id)
      .single();
    rightsCard = rc;
  }

  return {
    claim,
    trip: trip || {},
    profile: profile || {},
    bookings: bookings || [],
    travelers: travelers || [],
    rightsCard,
  };
}

// ─── Prompt Builder ─────────────────────────────────────

function buildPrompt(ctx: any): string {
  const { claim, trip, profile, bookings, travelers, rightsCard } = ctx;
  const dest = trip.destination || {};

  // Determine regulation from rights card or claim data
  const depCountry = rightsCard?.departure_country || claim.departure_country || '';
  const arrCountry = rightsCard?.arrival_country || claim.arrival_country || '';
  const airlineCountry = rightsCard?.airline_country || '';
  const { regulation, details: regDetails } = determineRegulation(depCountry, arrCountry, airlineCountry);

  const flightBookings = bookings.filter((b: any) => b.booking_type === 'flight');
  const travelerCount = Math.max(travelers.length, 1);

  return `You are Guidera's Compensation Intelligence AI. You are an expert in air passenger rights regulations worldwide.

CRITICAL: You must output ONLY valid JSON. No markdown, no explanation, no code fences. Just raw JSON.

═══ CLAIM CONTEXT ═══
CLAIM_ID: ${claim.id}
TRIP_ID: ${claim.trip_id}
CLAIM_TYPE: ${claim.type}
DISRUPTION_TYPE: ${claim.disruption_type || claim.type}
PROVIDER (AIRLINE): ${claim.provider}
FLIGHT_NUMBER: ${claim.flight_number || 'Not specified'}
BOOKING_REFERENCE: ${claim.booking_reference || 'Not specified'}
INCIDENT_DATE: ${claim.incident_date}
DESCRIPTION: ${claim.description}
REASON: ${claim.reason}
USER_ESTIMATED_AMOUNT: ${claim.estimated_amount} ${claim.currency}
DELAY_MINUTES: ${claim.delay_minutes || 'Not specified'}
CANCELLATION_REASON: ${claim.cancellation_reason || 'Not specified'}

═══ FLIGHT DETAILS ═══
DEPARTURE_AIRPORT: ${rightsCard?.departure_airport || 'Not specified'}
ARRIVAL_AIRPORT: ${rightsCard?.arrival_airport || 'Not specified'}
DEPARTURE_COUNTRY: ${depCountry || 'Not specified'}
ARRIVAL_COUNTRY: ${arrCountry || 'Not specified'}
SCHEDULED_DEPARTURE: ${rightsCard?.scheduled_departure || 'Not specified'}
SCHEDULED_ARRIVAL: ${rightsCard?.scheduled_arrival || 'Not specified'}
DISTANCE_KM: ${rightsCard?.distance_km || 'Not specified'}
CABIN_CLASS: ${rightsCard?.cabin_class || 'economy'}

═══ REGULATION DETERMINATION ═══
APPLICABLE_REGULATION: ${regulation}
REGULATION_NAME: ${regDetails.name}
REGULATION_JURISDICTION: ${regDetails.jurisdiction}
DELAY_THRESHOLD_MINUTES: ${regDetails.delayThresholdMinutes}
COMPENSATION_TIERS: ${JSON.stringify(regDetails.tiers || [])}
STATUTE_OF_LIMITATIONS_YEARS: ${regDetails.statuteOfLimitationsYears}
REGULATION_NOTES: ${regDetails.notes}

═══ PASSENGER CONTEXT ═══
PASSENGER_NAME: ${profile.first_name || 'Traveler'} ${profile.last_name || ''}
PASSENGER_NATIONALITY: ${profile.nationality || 'Not specified'}
NUMBER_OF_PASSENGERS: ${travelerCount}
DESTINATION: ${dest.city || trip.title || 'Unknown'}, ${dest.country || ''}

═══ TRIP BOOKINGS ═══
FLIGHT_BOOKINGS: ${JSON.stringify(flightBookings.map((b: any) => ({
  booking_type: b.booking_type,
  provider: b.provider_name,
  reference: b.booking_reference,
  details: b.details,
})))}

═══ ANALYSIS INSTRUCTIONS ═══

Analyze this disruption claim and generate a complete compensation analysis:

1. FLIGHT_DETAILS: Summarize the flight (number, airline, route, airports, times, distance, tier).

2. DISRUPTION: Analyze the disruption type, delay duration, airline's stated reason, and whether it qualifies as "extraordinary circumstances" (weather, ATC strikes, security threats ARE extraordinary; technical faults, crew shortages, operational decisions are NOT).

3. REGULATION: Confirm which regulation applies and which articles are relevant.

4. ELIGIBILITY: Determine eligibility verdict:
   - "eligible" (>90% confidence): clear-cut case
   - "likely_eligible" (60-90%): probably eligible but some uncertainty
   - "unlikely_eligible" (20-60%): significant doubt
   - "not_eligible" (<20%): does not qualify
   - "needs_more_info": insufficient data to determine
   Provide detailed reasoning and any caveats.

5. COMPENSATION: Calculate exact amount per passenger, total for all passengers, currency, and show your calculation. Include any additional costs the passenger may claim (meals, transport, accommodation if overnight).

6. GATE_PROTOCOL: Array of immediate action steps the passenger should take RIGHT NOW at the airport (evidence collection, requesting vouchers, documenting everything). Each step: { step: number, action: string, reason: string }

7. CLAIM_LETTER: Generate a professional claim letter:
   - subject: Clear subject line with flight number, date, regulation, amount
   - body: Full formal letter citing specific regulation articles, facts, and amounts. Use placeholders like [DATE], [BOOKING_REFERENCE], [NAME], [BANK_DETAILS] where user-specific info is needed.
   - personalization_notes: Array of instructions for the user to customize the letter

8. FILING_OPTIONS: Ranked array of filing methods:
   - Rank 1: Direct to airline (always include, with specific airline claim URL if known)
   - Rank 2: Third-party claim service (AirHelp, Flightright, etc. — mark affiliate: true)
   - Rank 3: Regulatory body complaint (CAA, NEB, etc.)
   Each: { rank, method, name, url, affiliate, cost_to_passenger, typical_response_time, success_rate_note, recommended, recommended_when, instructions }

9. CLAIM_DEADLINE: { deadline_date (calculate from incident date + statute of limitations), regulation_basis, urgency (low/medium/high/critical), note }

10. AIRLINE_INTEL: { compliance_rate (0-100 estimate), typical_response_days, known_tactics: string[], recommended_approach }

SPECIAL CASES:
- If DISRUPTION_TYPE = "missed_connection": analyze based on FINAL arrival delay, not individual segment.
- If DISRUPTION_TYPE = "downgrade": EU261 Article 10 applies — 30%/50%/75% of ticket price.
- If DISRUPTION_TYPE = "denied_boarding": full compensation applies immediately for involuntary bumping.
- For US flights: be VERY clear that the US has NO federal delay compensation law. Only denied boarding is covered.

SECURITY RULES:
- Never fabricate compensation amounts. Use only regulation-specified amounts.
- Never claim certainty when extraordinary circumstances may genuinely apply.
- Mark placeholders clearly in claim letters.
- Flag any URLs as "verify current before submitting."

OUTPUT FORMAT (exact JSON structure):
{
  "flight_details": {
    "flight_number": "",
    "airline": "",
    "route": "",
    "departure_airport": "",
    "arrival_airport": "",
    "scheduled_departure": "",
    "scheduled_arrival": "",
    "distance_km": 0,
    "distance_tier": "short_haul|medium_haul|long_haul"
  },
  "disruption": {
    "type": "delay|cancellation|missed_connection|downgrade|denied_boarding",
    "delay_minutes": 0,
    "description": "",
    "airline_stated_reason": "",
    "is_extraordinary_circumstances": false,
    "extraordinary_circumstances_analysis": ""
  },
  "regulation": {
    "applicable": "EU261|UK261|APPR|US_DOT|ACCC|AIRLINE_POLICY|NONE",
    "full_name": "",
    "jurisdiction": "",
    "delay_threshold": "",
    "applicable_articles": []
  },
  "eligibility": {
    "verdict": "eligible|likely_eligible|unlikely_eligible|not_eligible|needs_more_info",
    "confidence": 0,
    "reasoning": "",
    "caveats": []
  },
  "compensation": {
    "amount_per_passenger": 0,
    "total_amount": 0,
    "currency": "",
    "number_of_passengers": 0,
    "calculation": "",
    "additional_costs": ""
  },
  "gate_protocol": [],
  "claim_letter": {
    "subject": "",
    "body": "",
    "personalization_notes": []
  },
  "filing_options": [],
  "claim_deadline": {
    "deadline_date": "",
    "regulation_basis": "",
    "urgency": "low|medium|high|critical",
    "note": ""
  },
  "airline_intel": {
    "compliance_rate": 0,
    "typical_response_days": 0,
    "known_tactics": [],
    "recommended_approach": ""
  }
}`;
}

// ─── AI Callers ─────────────────────────────────────────

async function callGemini(prompt: string): Promise<{ text: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return { text, model: 'gemini-2.5-flash' };
}

async function callClaude(prompt: string): Promise<{ text: string; model: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16384,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty response');
  return { text, model: 'claude-haiku-4.5' };
}

async function callAI(prompt: string): Promise<{ parsed: any; model: string }> {
  let result: { text: string; model: string };

  try {
    result = await callGemini(prompt);
  } catch (geminiErr: any) {
    console.warn('Gemini failed, falling back to Claude:', geminiErr.message);
    result = await callClaude(prompt);
  }

  const cleaned = result.text.replace(/```json\s*|```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return { parsed, model: result.model };
}

// ─── Storage ────────────────────────────────────────────

async function storeAnalysis(supabase: any, claimId: string, parsed: any, model: string) {
  const eligibility = parsed.eligibility || {};
  const compensation = parsed.compensation || {};
  const claimLetter = parsed.claim_letter || {};

  const updateData: any = {
    ai_analysis: parsed,
    ai_confidence: eligibility.confidence || 0,
    eligibility_notes: eligibility.reasoning || '',
    policy_details: `${parsed.regulation?.full_name || ''} — ${parsed.regulation?.applicable_articles?.join(', ') || ''}`,
    claim_letter_subject: claimLetter.subject || null,
    claim_letter_body: claimLetter.body || null,
    claim_letter_notes: claimLetter.personalization_notes || [],
    filing_options: parsed.filing_options || [],
    gate_protocol: parsed.gate_protocol || [],
    airline_intel: parsed.airline_intel || {},
    claim_deadline: parsed.claim_deadline || {},
    disruption_type: parsed.disruption?.type || null,
    delay_minutes: parsed.disruption?.delay_minutes || null,
    applicable_regulation: parsed.regulation?.applicable || null,
    analyzed_at: new Date().toISOString(),
    generated_by: model,
    updated_at: new Date().toISOString(),
  };

  // Update estimated amount if AI provides a more accurate calculation
  if (compensation.total_amount > 0) {
    updateData.estimated_amount = compensation.total_amount;
    updateData.currency = compensation.currency || 'EUR';
  }

  // Set status based on eligibility verdict
  const verdict = eligibility.verdict;
  if (verdict === 'eligible' || verdict === 'likely_eligible') {
    updateData.status = 'ready_to_file';
  } else if (verdict === 'not_eligible' || verdict === 'unlikely_eligible') {
    updateData.status = 'not_eligible';
  } else {
    updateData.status = 'potential';
  }

  const { data, error } = await supabase
    .from('compensation_claims')
    .update(updateData)
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw new Error(`Failed to store analysis: ${error.message}`);
  return data;
}

// ─── Main Handler ───────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { claimId } = await req.json();
    if (!claimId) {
      return new Response(JSON.stringify({ error: 'claimId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    // Mark claim as analyzing
    await supabase
      .from('compensation_claims')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', claimId);

    // Build context
    const ctx = await buildContext(supabase, claimId);
    const prompt = buildPrompt(ctx);

    // Call AI
    const { parsed, model } = await callAI(prompt);

    // Store results
    const updatedClaim = await storeAnalysis(supabase, claimId, parsed, model);

    return new Response(
      JSON.stringify({
        success: true,
        claimId,
        verdict: parsed.eligibility?.verdict || 'unknown',
        confidence: parsed.eligibility?.confidence || 0,
        estimatedAmount: parsed.compensation?.total_amount || 0,
        currency: parsed.compensation?.currency || 'EUR',
        regulation: parsed.regulation?.applicable || 'NONE',
        status: updatedClaim.status,
        modelUsed: model,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('generate-compensation error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
