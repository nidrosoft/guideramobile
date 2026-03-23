/**
 * CLASSIFY-DESTINATION EDGE FUNCTION
 *
 * Uses Gemini to auto-classify destinations into homepage sections
 * with confidence scores and suitability ratings.
 *
 * Modes:
 *   POST { "destination_id": "uuid" }          — classify one destination
 *   POST { "mode": "batch" }                   — classify all unclassified
 *   POST { "mode": "batch", "force": true }    — re-classify all destinations
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`
const CLASSIFICATION_VERSION = 1

// All homepage section slugs the classifier can assign
const VALID_SECTIONS = [
  'popular-destinations',
  'trending',
  'editors-choice',
  'must-see',
  'budget-friendly',
  'luxury-escapes',
  'family-friendly',
  'hidden-gems',
  'adventure',
  'beach-islands',
  'places',
]

const SYSTEM_PROMPT = `You are a travel destination classifier for a travel app called Guidera.

Your job: Given a destination's data, classify it into the appropriate homepage sections and provide suitability scores.

SECTION DEFINITIONS:
- "popular-destinations": High popularity score (>700), well-known global destinations
- "trending": Currently trending, hot right now, social media buzz
- "editors-choice": Exceptional quality, editor rating >= 4.5, featured destinations
- "must-see": Iconic landmarks and bucket-list destinations, high editor rating
- "budget-friendly": Budget level 1-2, affordable daily costs, great value
- "luxury-escapes": Budget level 4-5, premium experiences, high-end accommodations
- "family-friendly": Safe for families, kid-friendly activities, suitable for all ages
- "hidden-gems": Off the beaten path, cultural gems, high quality but low popularity
- "adventure": Outdoor activities, thrill-seeking, active travel
- "beach-islands": Coastal destinations, beach culture, island getaways
- "places": General interesting places worth visiting

RULES:
1. A destination can belong to 1-5 sections. Be selective — only assign sections with confidence > 0.6
2. Confidence scores range from 0.0 to 1.0
3. Suitability scores range from 0.0 to 1.0
4. Generate a short compelling description (1-2 sentences) if the destination lacks one
5. Provide a brief best_time_summary (e.g., "April to October for warm weather")
6. Provide a budget_estimate_summary (e.g., "$50-100/day for mid-range travel")

RESPOND WITH ONLY valid JSON, no markdown fences, no explanation:
{
  "section_tags": ["popular-destinations", "must-see"],
  "confidence_scores": {"popular-destinations": 0.95, "must-see": 0.82},
  "generated_description": "A breathtaking...",
  "budget_estimate_summary": "$X-Y/day",
  "best_time_summary": "Month to Month for reason",
  "family_suitability": 0.7,
  "luxury_suitability": 0.4,
  "adventure_suitability": 0.8,
  "beach_suitability": 0.3,
  "cultural_suitability": 0.9
}`

interface ClassificationResult {
  destinationId: string
  title: string
  success: boolean
  sectionTags?: string[]
  error?: string
}

serve(async (req: Request) => {
  const startTime = Date.now()

  try {
    if (!geminiApiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured')
    }

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'single'
    const force = body.force === true
    const destinationId = body.destination_id

    let destinations: any[] = []

    if (mode === 'batch') {
      // Batch mode: get all destinations, optionally only unclassified
      const query = supabase
        .from('curated_destinations')
        .select('*')
        .eq('status', 'published')
        .order('title')

      const { data, error } = await query
      if (error) throw new Error(`Failed to fetch destinations: ${error.message}`)
      destinations = data || []

      if (!force) {
        // Filter to only unclassified destinations
        const { data: classified } = await supabase
          .from('destination_ai_enrichment')
          .select('destination_id')
          .not('classified_at', 'is', null)

        const classifiedIds = new Set(classified?.map(c => c.destination_id) || [])
        destinations = destinations.filter(d => !classifiedIds.has(d.id))
      }
    } else if (destinationId) {
      // Single destination mode
      const { data, error } = await supabase
        .from('curated_destinations')
        .select('*')
        .eq('id', destinationId)
        .single()

      if (error || !data) throw new Error(`Destination not found: ${destinationId}`)
      destinations = [data]
    } else {
      throw new Error('Provide destination_id for single mode or mode=batch for batch classification')
    }

    const results: ClassificationResult[] = []
    let successCount = 0
    let failCount = 0

    // Process destinations with rate limiting (1 per 500ms to stay within Gemini limits)
    for (const dest of destinations) {
      try {
        const classification = await classifyDestination(dest)
        await saveClassification(dest.id, classification)
        results.push({
          destinationId: dest.id,
          title: dest.title,
          success: true,
          sectionTags: classification.section_tags,
        })
        successCount++
      } catch (err: any) {
        results.push({
          destinationId: dest.id,
          title: dest.title,
          success: false,
          error: err.message,
        })
        failCount++
      }

      // Rate limit: 500ms between API calls
      if (destinations.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode,
      force,
      totalProcessed: destinations.length,
      successCount,
      failCount,
      results,
      responseTimeMs: Date.now() - startTime,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('classify-destination error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      responseTimeMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// ============================================
// CLASSIFICATION LOGIC
// ============================================

async function classifyDestination(dest: any): Promise<any> {
  const destInput = {
    title: dest.title,
    city: dest.city,
    country: dest.country,
    continent: dest.continent,
    primary_category: dest.primary_category,
    tags: dest.tags || [],
    travel_style: dest.travel_style || [],
    budget_level: dest.budget_level,
    editor_rating: dest.editor_rating,
    popularity_score: dest.popularity_score,
    safety_rating: dest.safety_rating,
    best_for: dest.best_for || [],
    seasons: dest.seasons || [],
    is_trending: dest.is_trending,
    is_featured: dest.is_featured,
    short_description: dest.short_description,
    estimated_daily_budget_usd: dest.estimated_daily_budget_usd,
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\nClassify this destination:\n${JSON.stringify(destInput, null, 2)}`,
        }],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 200)}`)
  }

  const geminiResult = await response.json()
  const text = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')

  // Parse JSON response
  let parsed: any
  try {
    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Failed to parse Gemini JSON: ${text.slice(0, 200)}`)
  }

  // Validate and filter section_tags
  if (!parsed.section_tags || !Array.isArray(parsed.section_tags)) {
    throw new Error('Missing section_tags in response')
  }

  // Only keep valid sections with confidence > 0.6
  const validTags = parsed.section_tags.filter((tag: string) => {
    if (!VALID_SECTIONS.includes(tag)) return false
    const confidence = parsed.confidence_scores?.[tag] || 0
    return confidence >= 0.6
  })

  parsed.section_tags = validTags

  // Clamp suitability scores to 0-1
  for (const key of ['family_suitability', 'luxury_suitability', 'adventure_suitability', 'beach_suitability', 'cultural_suitability']) {
    if (typeof parsed[key] === 'number') {
      parsed[key] = Math.max(0, Math.min(1, parsed[key]))
    } else {
      parsed[key] = 0
    }
  }

  return parsed
}

// ============================================
// SAVE TO DB
// ============================================

async function saveClassification(destinationId: string, classification: any): Promise<void> {
  // Check if enrichment row exists
  const { data: existing } = await supabase
    .from('destination_ai_enrichment')
    .select('id')
    .eq('destination_id', destinationId)
    .maybeSingle()

  const classificationData = {
    section_tags: classification.section_tags,
    confidence_scores: classification.confidence_scores || {},
    generated_description: classification.generated_description || null,
    budget_estimate_summary: classification.budget_estimate_summary || null,
    best_time_summary: classification.best_time_summary || null,
    family_suitability: classification.family_suitability || 0,
    luxury_suitability: classification.luxury_suitability || 0,
    adventure_suitability: classification.adventure_suitability || 0,
    beach_suitability: classification.beach_suitability || 0,
    cultural_suitability: classification.cultural_suitability || 0,
    classification_model: GEMINI_MODEL,
    classified_at: new Date().toISOString(),
    classification_version: CLASSIFICATION_VERSION,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('destination_ai_enrichment')
      .update(classificationData)
      .eq('destination_id', destinationId)
    if (error) throw new Error(`Failed to update classification: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('destination_ai_enrichment')
      .insert({
        destination_id: destinationId,
        ...classificationData,
      })
    if (error) throw new Error(`Failed to insert classification: ${error.message}`)
  }
}
