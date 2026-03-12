/**
 * GENERATE EXPENSE SUMMARY — Post-Trip AI Summary Edge Function
 * 
 * Analyzes all logged expenses for a completed trip and generates
 * a narrative summary with insights, budget verdict, and recommendations.
 * 
 * Fires: When user opens Summary tab after trip ends, or taps "Generate Summary"
 * Models: Claude Haiku 4.5 (primary) → Gemini 2.5 Flash (fallback)
 * Caching: Summary stored in trips.expense_summary JSONB column
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// ─── System Prompt ──────────────────────────────────

const SYSTEM_PROMPT = `You are Guidera's trip expense analyst. A traveler has just returned from a trip and you're generating their post-trip spending summary.

Your summary should feel like a smart friend reviewing the trip with them — warm, specific, and genuinely insightful. Not a dry spreadsheet readout. Surface the interesting patterns. Note what surprised them. Give them something they couldn't have noticed just by scrolling through their own receipts.

You output only valid JSON. No preamble, no markdown, no explanation.

TONE: Friendly, conversational, positive — even if they overspent. This is a post-trip memory as much as a financial report.

WHAT MAKES A GOOD INSIGHT (generate 3–5):
  - "Your biggest single day was Day 4 in Marrakech — mostly the private riad dinner"
  - "You spent more on transport than food, which is unusual for a city trip"
  - "The first 3 days averaged €85/day; the last 2 averaged €140/day — the pace picked up"
  - "Shopping was your #2 category — just ahead of food, which tracks for a Tokyo trip"
  - NOT: "You spent a total of €820" — that's a number, not an insight

BUDGET ASSESSMENT (if budget was set):
  - Under budget: celebrate it specifically ("You came in €180 under — that's nearly a free night's accommodation")
  - On budget: acknowledge the discipline
  - Over budget: be honest but not harsh; attribute it to something specific ("Most of the overage was in activities — worth it for the experiences")
  - No budget set: note total and suggest a benchmark for next time

OUTPUT FORMAT — return ONLY this JSON:
{
  "headline": "12 days in Japan: €1,840 across 94 expenses",
  "one_liner": "A food-heavy trip that stayed almost exactly on budget — with one very good splurge.",
  "budget_verdict": {
    "status": "under_budget",
    "amount_difference": 160,
    "currency": "EUR",
    "message": "You came in €160 under your €2,000 budget — about one extra night at the ryokan."
  },
  "daily_average": {
    "amount": 153.33,
    "currency": "EUR",
    "context": "For Japan, that's right in line with a comfortable mid-range trip"
  },
  "top_category": {
    "category_id": "food",
    "category_name": "Food & Drinks",
    "amount": 620,
    "percentage": 33.7,
    "highlight": "33 meals logged — from ¥400 ramen to the tasting menu in Kyoto"
  },
  "biggest_single_expense": {
    "amount": 285,
    "currency": "EUR",
    "description": "Dinner at Mizai, Kyoto",
    "day": 7,
    "category": "food"
  },
  "insights": [
    "Days 6–8 in Kyoto averaged €210/day — nearly double the Tokyo pace, mostly activities and dining",
    "Transport was your second-largest category at €290 — the Shinkansen passes alone were €180 of that",
    "You logged 0 expenses on Day 3 — either a very quiet day or a few receipts worth adding",
    "Shopping came in under €100 for a 12-day Japan trip, which takes real discipline"
  ],
  "category_breakdown": [
    { "category_id": "food", "name": "Food & Drinks", "icon": "🍽️", "amount": 620, "percentage": 33.7, "count": 33 },
    { "category_id": "transport", "name": "Transport", "icon": "🚗", "amount": 290, "percentage": 15.8, "count": 18 }
  ],
  "by_day_narrative": "Spending was front-loaded — the first 4 days in Tokyo averaged €120/day. The middle stretch in Kyoto jumped to €210/day. The final days wound down to €90/day.",
  "next_trip_note": "For a similar Japan trip, budget €160–180/day for comfortable mid-range travel including some special meals."
}`;

// ─── AI Providers ──────────────────────────────────

async function generateWithClaude(contextPrompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 1200,
      temperature: 0.5,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function generateWithGemini(contextPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\n${contextPrompt}` }],
      }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Parse JSON from AI response ──────────────────

function parseJSON(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in AI response');
  return JSON.parse(jsonMatch[0]);
}

// ─── Category display names ────────────────────────

const CATEGORY_NAMES: Record<string, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  accommodation: 'Accommodation',
  activities: 'Activities',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health: 'Health',
  communication: 'Communication',
  tips: 'Tips',
  other: 'Other',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activities: '🎭',
  shopping: '🛍️',
  entertainment: '🎬',
  health: '💊',
  communication: '📱',
  tips: '💰',
  other: '📦',
};

// ─── Build Context ─────────────────────────────────

function buildContext(trip: any, expenses: any[], budgetTotal: number, budgetCurrency: string): string {
  const totalSpent = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
  const expenseCount = expenses.length;

  // Category totals
  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const current = categoryMap.get(e.category) || { amount: 0, count: 0 };
    categoryMap.set(e.category, {
      amount: current.amount + parseFloat(e.amount),
      count: current.count + 1,
    });
  }
  const categoryTotals = Array.from(categoryMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      name: CATEGORY_NAMES[cat] || cat,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily totals
  const dailyMap = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const dateKey = e.date?.split('T')[0] || e.date;
    const current = dailyMap.get(dateKey) || { amount: 0, count: 0 };
    dailyMap.set(dateKey, {
      amount: current.amount + parseFloat(e.amount),
      count: current.count + 1,
    });
  }
  const dailyTotals = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Trip duration
  const startDate = trip.start_date || trip.departure_date;
  const endDate = trip.end_date || trip.return_date;
  const tripDays = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : dailyTotals.length || 1;

  // Top 5 expenses
  const topExpenses = [...expenses]
    .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5);

  const destCity = trip.destination?.city || trip.title || 'Unknown';
  const destCountry = trip.destination?.country || '';

  return `TRIP: ${trip.title || destCity}
DATES: ${startDate || 'N/A'} to ${endDate || 'N/A'} (${tripDays} days)
DESTINATIONS: ${destCity}${destCountry ? `, ${destCountry}` : ''}
BUDGET: ${budgetTotal > 0 ? `${budgetCurrency} ${budgetTotal}` : 'No budget set'}
TOTAL SPENT: ${budgetCurrency} ${Math.round(totalSpent * 100) / 100}
EXPENSES COUNT: ${expenseCount}

CATEGORY TOTALS:
${categoryTotals.map(c => `  ${c.name}: ${budgetCurrency} ${c.amount} (${c.count} expenses, ${c.percentage}%)`).join('\n')}

DAILY TOTALS:
${dailyTotals.map((d, i) => `  Day ${i + 1} (${d.date}): ${budgetCurrency} ${Math.round(d.amount * 100) / 100} (${d.count} expenses)`).join('\n')}

TOP 5 SINGLE EXPENSES:
${topExpenses.map((e: any) => `  ${e.date?.split('T')[0] || e.date} — ${e.merchant || e.description}: ${e.currency || budgetCurrency} ${e.amount} (${e.category})`).join('\n')}

Generate the post-trip expense summary.`;
}

// ─── Main Handler ──────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tripId, forceRefresh = false } = await req.json();

    if (!tripId) {
      throw new Error('tripId is required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch trip data
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error(`Trip not found: ${tripError?.message || 'unknown'}`);
    }

    // Check for cached summary (unless force refresh)
    if (!forceRefresh && trip.expense_summary) {
      const summary = trip.expense_summary;
      // Check if any expenses were added after the summary was generated
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select('created_at')
        .eq('trip_id', tripId)
        .gt('created_at', summary.generated_at || '1970-01-01')
        .limit(1);

      if (!recentExpenses || recentExpenses.length === 0) {
        // Summary is still fresh
        return new Response(
          JSON.stringify({ success: true, summary, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch all expenses for this trip
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (expError) {
      throw new Error(`Failed to fetch expenses: ${expError.message}`);
    }

    if (!expenses || expenses.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No expenses found for this trip' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch budget
    const budgetTotal = parseFloat(trip.budget_total || '0') || 0;
    const budgetCurrency = trip.budget_currency || 'USD';

    // Build context
    const contextPrompt = buildContext(trip, expenses, budgetTotal, budgetCurrency);

    // Generate with Claude first, fallback to Gemini
    let rawText: string;
    let modelUsed: string;

    try {
      rawText = await generateWithClaude(contextPrompt);
      modelUsed = 'claude-haiku-4-5';
    } catch (claudeErr: any) {
      console.warn('Claude failed, trying Gemini:', claudeErr.message);
      try {
        rawText = await generateWithGemini(contextPrompt);
        modelUsed = 'gemini-2.5-flash';
      } catch (geminiErr: any) {
        throw new Error(`All models failed. Claude: ${claudeErr.message}. Gemini: ${geminiErr.message}`);
      }
    }

    // Parse the AI response
    const summary = parseJSON(rawText);
    summary.generated_at = new Date().toISOString();
    summary.model_used = modelUsed;
    summary.expense_count = expenses.length;

    // Cache summary in the trips table
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        expense_summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId);

    if (updateError) {
      console.warn('Failed to cache summary:', updateError.message);
    }

    return new Response(
      JSON.stringify({ success: true, summary, cached: false, modelUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Generate expense summary error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
