/**
 * GENERATE DOCUMENTS INTELLIGENCE — AI Document Checklist Edge Function
 *
 * Generates a comprehensive document checklist + validity alerts + insurance
 * recommendations + digital backup protocol + border crossing notes.
 *
 * Called in parallel with generate-itinerary, generate-packing, generate-safety, etc.
 * Fires ONCE on trip creation. Output stored in document_checklists + document_items.
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

// ─── Helpers ─────────────────────────────────────────────

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

// ─── Context Builder ─────────────────────────────────────

async function buildContext(supabase: any, tripId: string) {
  const { data: trip, error: tripErr } = await supabase
    .from('trips').select('*').eq('id', tripId).single();
  if (tripErr || !trip) throw new Error(`Trip not found: ${tripErr?.message || 'unknown'}`);

  const [profileRes, bookingsRes, travelersRes, travelPrefsRes, activitiesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', trip.user_id).single(),
    supabase.from('trip_bookings').select('*').eq('trip_id', tripId),
    supabase.from('trip_travelers').select('*').eq('trip_id', tripId),
    supabase.from('travel_preferences').select('*').eq('user_id', trip.user_id).maybeSingle(),
    supabase.from('trip_activities').select('*').eq('trip_id', tripId),
  ]);

  return {
    trip,
    profile: profileRes.data || {},
    bookings: bookingsRes.data || [],
    travelers: travelersRes.data || [],
    travelPrefs: travelPrefsRes?.data || {},
    activities: activitiesRes?.data || [],
  };
}

// ─── Prompt Builder ──────────────────────────────────────

function buildPrompt(ctx: any): string {
  const { trip, profile, bookings, travelers, travelPrefs, activities } = ctx;
  const dest = trip.destination || {};
  const destCity = dest.city || trip.title || 'Unknown';
  const destCountry = dest.country || '';
  const startDate = trip.start_date || trip.startDate || '';
  const endDate = trip.end_date || trip.endDate || '';
  const durationDays = startDate && endDate ? daysBetween(startDate, endDate) : 7;

  const age = computeAge(profile.date_of_birth);
  const tripType = trip.trip_type || 'leisure';
  const hasCarRental = bookings.some((b: any) => b.booking_type === 'car_rental');
  const flightBookings = bookings.filter((b: any) => b.booking_type === 'flight');
  const hotelBookings = bookings.filter((b: any) => b.booking_type === 'hotel');
  const transitCountries = flightBookings
    .filter((f: any) => f.details?.layovers?.length > 0)
    .flatMap((f: any) => (f.details?.layovers || []).map((l: any) => l.country || l.city || ''))
    .filter(Boolean);

  const childrenCount = travelPrefs.default_children || 0;
  const childrenAges = travelPrefs.children_default_ages || [];
  const travelingWithChildren = childrenCount > 0 || childrenAges.length > 0;
  const companionType = travelPrefs.default_companion_type || trip.trip_type || 'solo';

  const activitiesPlanned = activities.map((a: any) => a.title || a.name || a.type || '').filter(Boolean);

  return `You are Guidera's Documents Intelligence AI. Your task is to generate a comprehensive, personalized travel document checklist with validity alerts, insurance analysis, digital backup protocol, and border entry intelligence.

CRITICAL: You must output ONLY valid JSON. No markdown, no explanation, no code fences. Just raw JSON.

═══ TRIP CONTEXT ═══
TRIP_ID: ${trip.id}
TRIP_PURPOSE: ${tripType}
PRIMARY_DESTINATION: ${destCity}, ${destCountry}
COUNTRIES_VISITED: ${JSON.stringify([destCountry].filter(Boolean))}
TRANSIT_COUNTRIES: ${JSON.stringify(transitCountries)}
DEPARTURE_DATE: ${startDate}
RETURN_DATE: ${endDate}
TRIP_DURATION_DAYS: ${durationDays}

═══ TRAVELER PROFILE ═══
USER_NAME: ${profile.first_name || 'Traveler'} ${profile.last_name || ''}
USER_NATIONALITY: ${profile.nationality || 'Unknown'}
USER_PASSPORT_COUNTRY: ${profile.passport_country || profile.nationality || 'Unknown'}
USER_PASSPORT_EXPIRY: ${profile.passport_expiry || 'Not provided'}
USER_AGE: ${age || 'Unknown'}
USER_GENDER: ${profile.gender || 'Not specified'}
USER_RELIGION: ${profile.religion || 'Not specified'}
USER_PROFESSION: ${profile.profession || 'Not specified'}
USER_DUAL_CITIZENSHIP: ${JSON.stringify(profile.dual_citizenship || [])}

═══ GROUP COMPOSITION ═══
TRAVELER_TYPE: ${companionType}
TRAVELING_WITH_CHILDREN: ${travelingWithChildren}
CHILDREN_AGES: ${JSON.stringify(childrenAges)}
TRAVELER_COUNT: ${travelers.length || 1}

═══ TRIP CONTEXT ═══
HAS_CAR_RENTAL: ${hasCarRental}
HAS_DRONE: ${profile.has_drone || false}
ACTIVITIES_PLANNED: ${JSON.stringify(activitiesPlanned)}
IS_WORKING_AT_DESTINATION: ${tripType === 'business'}
HAS_FLIGHTS: ${flightBookings.length > 0}
HAS_HOTEL_BOOKINGS: ${hotelBookings.length > 0}

═══ EXISTING DOCUMENTS ═══
HAS_TRAVEL_INSURANCE: ${profile.insurance_provider ? 'true' : 'unknown'}
INSURANCE_PROVIDER: ${profile.insurance_provider || 'Unknown'}
INSURANCE_TYPE: ${profile.insurance_type || 'Unknown'}
HAS_GLOBAL_ENTRY: ${profile.has_global_entry || false}
HAS_NEXUS: ${profile.has_nexus || false}
HAS_TSA_PRECHECK: ${profile.has_tsa_precheck || false}
HAS_DRIVERS_LICENSE: ${profile.has_drivers_license !== false}
LICENSE_COUNTRY: ${profile.license_country || profile.nationality || 'Unknown'}
HAS_INTERNATIONAL_DRIVING_PERMIT: ${profile.has_international_driving_permit || false}

═══ HEALTH ═══
USER_MEDICAL_CONDITIONS: ${JSON.stringify(profile.medical_conditions || [])}
USER_MEDICATIONS: ${JSON.stringify(profile.medications || [])}
USER_ALLERGIES: ${JSON.stringify(profile.allergies || [])}

═══ GENERATION INSTRUCTIONS ═══

Generate a complete document intelligence package with these sections:

1. CRITICAL_ALERTS: Array of urgent issues (passport expiry, visa deadlines).
   Each: { type, severity (critical|warning|info), title, detail, action, deadline }

2. DOCUMENT_GROUPS: Array of document groups, each with documents.
   Groups: grp_identity (Identity & Entry), grp_bookings (Travel Bookings), grp_driving (Driving - ONLY if car rental), grp_health (Health & Medical), grp_children (Children - ONLY if traveling with children), grp_profession (Profession & Activity - ONLY if applicable), grp_financial (Financial)

   Each group: { group_id, title, icon (emoji), display_order, documents: [] }
   Each document: { id (doc_XXX), name, status (ok|warning|critical|action_required|not_required|not_started), status_label, priority (critical|high|medium|low), expiry?, validity_note?, deadline_days_before_departure?, url?, processing_time?, cost?, notes?, action_required (bool), pack_reminder (bool), display_order }

3. DIGITAL_BACKUP_CHECKLIST: Array of items to digitize.
   Each: { item, priority (1|2), storage_methods: string[], is_complete: false }

4. INSURANCE_ANALYSIS: { overall_coverage_status (adequate|gaps_detected|no_coverage), gaps: [{ gap_type, severity (high|medium|low), title, explanation, what_you_need, recommended_providers: [{ name, url, best_for, approx_cost }], action_required, deadline_note }], confirmed_coverages: string[], credit_card_check_note: string }

5. BORDER_ENTRY_NOTES: Array per destination country.
   Each: { country, entry_type, common_questions: string[], bring_to_immigration: string[], specific_notes: string }

PASSPORT VALIDITY RULES:
- Most countries require 6 months validity beyond return date
- If passport_expiry is before (return_date + 6 months): severity = critical
- If passport_expiry is within 6 months of departure: severity = warning
- If not provided, flag it as a warning to add passport expiry to profile

VISA RULES:
- Check visa requirements for ${profile.passport_country || profile.nationality || 'Unknown'} passport holders visiting ${destCountry}
- Use your knowledge of visa policies. Be conservative — if uncertain, flag as action_required
- Always add disclaimer: "Visa requirements change — verify with official embassy"

OUTPUT FORMAT (exact JSON structure):
{
  "destination_summary": ["${destCountry}"],
  "total_documents": <number>,
  "action_required_count": <number>,
  "critical_alerts": [...],
  "document_groups": [...],
  "digital_backup_checklist": [...],
  "insurance_analysis": {...},
  "border_entry_notes": [...]
}`;
}

// ─── AI Callers ──────────────────────────────────────────

async function callGemini(prompt: string): Promise<{ text: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
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
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 16384,
      temperature: 0.4,
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

  // Parse JSON — strip code fences if present
  const cleaned = result.text.replace(/```json\s*|```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return { parsed, model: result.model };
}

// ─── Storage ─────────────────────────────────────────────

async function storeResults(supabase: any, tripId: string, userId: string, parsed: any, model: string) {
  const destSummary = parsed.destination_summary || [];
  const groups = parsed.document_groups || [];
  const totalDocs = parsed.total_documents || groups.reduce((sum: number, g: any) => sum + (g.documents?.length || 0), 0);
  const actionCount = parsed.action_required_count || groups.reduce((sum: number, g: any) =>
    sum + (g.documents || []).filter((d: any) => d.action_required).length, 0);

  // Upsert checklist
  const { data: checklist, error: clErr } = await supabase
    .from('document_checklists')
    .upsert({
      trip_id: tripId,
      user_id: userId,
      destination: destSummary[0] || null,
      destination_country: destSummary[0] || null,
      destinations: destSummary,
      total_documents: totalDocs,
      action_required_count: actionCount,
      checked_count: 0,
      critical_alerts: parsed.critical_alerts || [],
      insurance_analysis: parsed.insurance_analysis || {},
      digital_backup_checklist: parsed.digital_backup_checklist || [],
      border_entry_notes: parsed.border_entry_notes || [],
      generated_by: model,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'trip_id' })
    .select('id')
    .single();

  if (clErr) throw new Error(`Checklist upsert failed: ${clErr.message}`);
  const checklistId = checklist.id;

  // Delete old items for this checklist
  await supabase.from('document_items').delete().eq('checklist_id', checklistId);

  // Flatten groups into items
  const items: any[] = [];
  for (const group of groups) {
    for (const doc of (group.documents || [])) {
      items.push({
        checklist_id: checklistId,
        trip_id: tripId,
        group_id: group.group_id,
        group_title: group.title,
        group_icon: group.icon || '📄',
        name: doc.name,
        status: doc.status || 'not_started',
        status_label: doc.status_label || null,
        priority: doc.priority || 'medium',
        expiry: doc.expiry || null,
        validity_note: doc.validity_note || null,
        deadline_days_before_departure: doc.deadline_days_before_departure || null,
        url: doc.url || null,
        processing_time: doc.processing_time || null,
        cost: doc.cost || null,
        notes: doc.notes || null,
        action_required: doc.action_required || false,
        pack_reminder: doc.pack_reminder || false,
        is_checked: false,
        display_order: doc.display_order || 0,
      });
    }
  }

  // Batch insert in chunks of 50
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50);
    const { error: insertErr } = await supabase.from('document_items').insert(chunk);
    if (insertErr) throw new Error(`Item insert failed at chunk ${i}: ${insertErr.message}`);
  }

  return { checklistId, totalDocs: items.length, actionCount };
}

// ─── Main Handler ────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tripId } = await req.json();
    if (!tripId) {
      return new Response(JSON.stringify({ error: 'tripId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    // Build context
    const ctx = await buildContext(supabase, tripId);
    const prompt = buildPrompt(ctx);

    // Call AI
    const { parsed, model } = await callAI(prompt);

    // Store results
    const { totalDocs, actionCount } = await storeResults(
      supabase, tripId, ctx.trip.user_id, parsed, model,
    );

    return new Response(
      JSON.stringify({
        success: true,
        totalDocuments: totalDocs,
        actionRequired: actionCount,
        modelUsed: model,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('generate-documents error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
