/**
 * EVENT DISCOVERY EDGE FUNCTION
 * 
 * Uses Google Gemini 2.0 Flash with Google Search grounding to discover
 * real events happening in any city worldwide. Results are cached in
 * the destination_events table with a 14-day TTL.
 * 
 * Actions:
 *   - discover: Fetch events for a city (checks cache first)
 *   - get:      Return cached events for a city
 *   - refresh:  Force re-fetch events (ignores cache)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.0.0'

// ─── Configuration ───────────────────────────────────────────────
const CACHE_TTL_DAYS = 14
const MAX_EVENTS_PER_FETCH = 15
const GEMINI_MODEL = 'gemini-2.0-flash'
const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001'
const IMAGE_BATCH_SIZE = 5

const EVENT_CATEGORIES = [
  'Music & Concerts',
  'Festivals & Carnivals',
  'Food & Drink',
  'Art & Culture',
  'Sports & Marathons',
  'Conferences & Expos',
  'Markets & Fairs',
  'Nightlife & Entertainment',
  'Outdoor & Adventure',
  'Religious & Spiritual',
  'Theater & Performing Arts',
  'Family & Kids',
  'Community & Local',
  'Parades & Celebrations',
]

// Curated high-quality Unsplash images per category (reliable fallbacks)
const CATEGORY_IMAGES: Record<string, string[]> = {
  'Music & Concerts': [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  ],
  'Festivals & Carnivals': [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  ],
  'Food & Drink': [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  ],
  'Art & Culture': [
    'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
  ],
  'Sports & Marathons': [
    'https://images.unsplash.com/photo-1461896836934-bd45ba44fadc?w=800&q=80',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
  ],
  'Conferences & Expos': [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
  ],
  'Markets & Fairs': [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80',
  ],
  'Nightlife & Entertainment': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    'https://images.unsplash.com/photo-1571266028243-3716f02d2d76?w=800&q=80',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
  ],
  'Outdoor & Adventure': [
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  ],
  'Religious & Spiritual': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80',
  ],
  'Theater & Performing Arts': [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80',
  ],
  'Family & Kids': [
    'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&q=80',
    'https://images.unsplash.com/photo-1594708767771-a7502209ff51?w=800&q=80',
    'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&q=80',
  ],
  'Community & Local': [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  ],
  'Parades & Celebrations': [
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  ],
}

function getCategoryFallbackImage(category: string, index: number): string {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Community & Local']
  return images[index % images.length]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Main Handler ────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { action = 'discover', city, country, category, month, forceRefresh, metro_area } = body

    // Use metro_area for broader coverage (e.g., La Mesa → San Diego)
    const searchCity = metro_area || city

    if (!city || !country) {
      return jsonResponse({ success: false, error: 'city and country are required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Determine target month(s)
    const now = new Date()
    const targetMonth = month || now.toLocaleString('en-US', { month: 'long' })
    const targetYear = now.getFullYear()
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonth = nextMonthDate.toLocaleString('en-US', { month: 'long' })

    // ─── ACTION: get (cache only) ────────────────────────────────
    if (action === 'get') {
      const events = await getCachedEvents(supabase, city, country, category)
      return jsonResponse({ success: true, events, cached: true, city, country })
    }

    // ─── ACTION: discover / refresh ──────────────────────────────
    const shouldRefresh = action === 'refresh' || forceRefresh === true

    // Check cache first (unless forcing refresh)
    if (!shouldRefresh) {
      const cached = await getCachedEvents(supabase, city, country, category)
      if (cached.length > 0) {
        return jsonResponse({ success: true, events: cached, cached: true, city, country })
      }
    }

    // Fetch fresh events via Gemini
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) {
      return jsonResponse({ success: false, error: 'GOOGLE_AI_API_KEY not configured' }, 500)
    }

    const events = await discoverEvents(apiKey, searchCity, country, targetMonth, nextMonth, targetYear, category)

    // Generate AI images for discovered events using Imagen 4 Fast
    let imageMap = new Map<number, string>()
    if (events.length > 0) {
      try {
        imageMap = await generateImagesForEvents(apiKey, supabase, events, searchCity)
      } catch (imgErr) {
        console.error('Image generation failed (non-fatal):', (imgErr as Error).message)
      }
    }

    if (events.length > 0) {
      // Clear old events for this city if refreshing
      if (shouldRefresh) {
        await supabase
          .from('destination_events')
          .delete()
          .ilike('city', city)
          .ilike('country', country)
      }

      // Insert new events (AI-generated image → event image_url → category fallback)
      const rows = events.map((e: any, idx: number) => ({
        city: searchCity,
        country: country,
        event_name: e.event_name,
        category: e.category,
        description: e.description || null,
        venue: e.venue || null,
        date_start: e.date_start || null,
        date_end: e.date_end || null,
        time_info: e.time_info || null,
        ticket_price: e.ticket_price || null,
        ticket_url: e.ticket_url || null,
        image_url: imageMap.get(idx) || e.image_url || getCategoryFallbackImage(e.category, idx),
        source_url: e.source_url || null,
        is_free: e.is_free || false,
        is_recurring: e.is_recurring || false,
        recurrence_info: e.recurrence_info || null,
        estimated_attendees: e.estimated_attendees || null,
        highlights: Array.isArray(e.highlights) ? e.highlights : [],
        tags: e.tags || [],
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      }))

      const { error: insertErr } = await supabase
        .from('destination_events')
        .insert(rows)

      if (insertErr) {
        console.error('Insert error:', insertErr)
      }
    }

    // Apply generated image URLs to events before returning
    for (const [idx, url] of imageMap.entries()) {
      if (events[idx]) events[idx].image_url = url
    }

    // Return fresh results (with optional category filter)
    const finalEvents = category
      ? events.filter((e: any) => e.category === category)
      : events

    return jsonResponse({
      success: true,
      events: finalEvents,
      cached: false,
      eventsDiscovered: events.length,
      city,
      country,
    })

  } catch (error) {
    console.error('Event discovery error:', error)
    return jsonResponse({ success: false, error: (error as Error).message }, 500)
  }
})

// ─── Gemini Event Discovery ─────────────────────────────────────
async function discoverEvents(
  apiKey: string,
  city: string,
  country: string,
  currentMonth: string,
  nextMonth: string,
  year: number,
  category?: string,
): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey })

  const categoryFilter = category
    ? `Focus specifically on "${category}" events.`
    : `Cover a variety of categories: ${EVENT_CATEGORIES.join(', ')}.`

  const prompt = `Find real, upcoming events happening in and around ${city}, ${country} (within approximately 30 miles / 50 km radius) during ${currentMonth} and ${nextMonth} ${year}.

${categoryFilter}

Search for events from sources like local tourism boards, Facebook events, Eventbrite, Meetup, local news, city government event calendars, and any other reliable sources.

Include a wide range: major festivals, local community events, food markets, concerts, sports events, marathons, art exhibitions, theater shows, cultural celebrations, religious observances, outdoor activities, conferences, and family-friendly events.

For each event, provide the following information as accurately as possible:
- event_name: Official event name
- category: One of [${EVENT_CATEGORIES.join(', ')}]
- description: A rich, detailed 3-5 sentence description. Describe what the event is about, what attendees can expect, highlights or featured performers/speakers, what makes it special, and any notable history of the event. Make the description engaging and informative enough for someone deciding whether to attend.
- venue: Full venue or location name including neighborhood/area
- date_start: Start date in YYYY-MM-DD format (use best estimate if exact date unknown)
- date_end: End date in YYYY-MM-DD format (null if single-day)
- time_info: Time information (e.g., "7:00 PM - 11:00 PM" or "All Day")
- ticket_price: Price info (e.g., "$25-50", "Free", "$15 advance / $20 door")
- ticket_url: URL to buy tickets or get more info (if available)
- image_url: A direct URL to a real, publicly accessible image of this specific event (official event poster, venue photo, or promotional image). Only include if you find a real image URL. Set to null if no image found.
- source_url: URL where you found this event
- is_free: true/false
- is_recurring: true/false (e.g., weekly farmers market)
- recurrence_info: If recurring, describe pattern (e.g., "Every Saturday")
- estimated_attendees: Rough estimate (e.g., "500", "5k", "50k+")
- highlights: Array of 3-5 key highlights or things to look forward to at this event (e.g., ["Live performances by 20+ local bands", "Craft beer from 50+ breweries", "Family-friendly activities"])
- tags: Array of 3-5 relevant tags (e.g., ["outdoor", "family-friendly", "food", "live-music"])

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON array of event objects. No markdown, no explanation.
- All string values must use double quotes and properly escape any internal double quotes with backslash.
- Do NOT use curly/smart quotes. Only use straight double quotes for JSON.
- Avoid using double quotes inside description or highlights text; use single quotes instead.
- Ensure all URLs are properly escaped.
- Do not include trailing commas.
Find at least 10-${MAX_EVENTS_PER_FETCH} events if possible.`

  try {
    // First attempt: with Google Search grounding for real-time data
    let response: any
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        },
      })
    } catch (err) {
      console.error('Gemini with search failed, trying without:', err)
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      })
    }

    const text = response.text || ''
    
    // Extract JSON array from response
    let jsonStr = text
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '').trim()

    // Try to extract just the JSON array if there's extra text
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      jsonStr = arrayMatch[0]
    }

    // Sanitize the JSON string to handle common Gemini issues:
    // 1. Fix unescaped control characters inside string values
    // 2. Fix smart quotes and special chars
    jsonStr = jsonStr
      .replace(/\u201C|\u201D/g, '"')  // smart double quotes
      .replace(/\u2018|\u2019/g, "'")  // smart single quotes
      .replace(/\u2013/g, '-')         // en dash
      .replace(/\u2014/g, '--')        // em dash
      .replace(/\u2026/g, '...')       // ellipsis

    // Remove control characters but preserve structural whitespace
    // We need to be careful: only strip control chars inside string values
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // Flatten whitespace and remove trailing commas upfront
    jsonStr = jsonStr.replace(/[\n\r\t]/g, ' ')
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1')

    // Attempt to parse the full JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseErr) {
      console.warn('Full JSON parse failed, trying per-object extraction:', (parseErr as Error).message)
      
      // Fallback: extract individual event objects using balanced braces
      const eventObjects: any[] = []
      let depth = 0
      let objStart = -1
      
      for (let i = 0; i < jsonStr.length; i++) {
        const ch = jsonStr[i]
        // Skip characters inside strings
        if (ch === '"') {
          // Find the closing quote (handle escaped quotes)
          i++
          while (i < jsonStr.length && !(jsonStr[i] === '"' && jsonStr[i-1] !== '\\')) i++
          continue
        }
        if (ch === '{') {
          if (depth === 0) objStart = i
          depth++
        } else if (ch === '}') {
          depth--
          if (depth === 0 && objStart >= 0) {
            const objStr = jsonStr.slice(objStart, i + 1)
            try {
              const obj = JSON.parse(objStr)
              if (obj.event_name) eventObjects.push(obj)
            } catch {
              // Skip malformed individual objects
              console.warn('Skipped malformed event object at position', objStart)
            }
            objStart = -1
          }
        }
      }
      
      if (eventObjects.length > 0) {
        parsed = eventObjects
      } else {
        throw new Error('Could not parse any events from Gemini response')
      }
    }
    const events = Array.isArray(parsed) ? parsed : (parsed.events || [])

    // Validate and normalize each event
    return events
      .filter((e: any) => e.event_name && e.category)
      .slice(0, MAX_EVENTS_PER_FETCH)
      .map((e: any) => {
        // Normalize "null" strings to actual null
        const imageUrl = (e.image_url && e.image_url !== 'null' && e.image_url !== 'undefined') ? e.image_url : null
        const dateEnd = (e.date_end && e.date_end !== 'null') ? e.date_end : null
        return {
          ...e,
          category: normalizeCategory(e.category),
          is_free: e.is_free === true || e.ticket_price?.toLowerCase() === 'free',
          tags: Array.isArray(e.tags) ? e.tags : [],
          image_url: imageUrl,
          date_end: dateEnd,
        }
      })

  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Failed to discover events: ${(error as Error).message}`)
  }
}

// ─── Cache Helpers ───────────────────────────────────────────────
async function getCachedEvents(
  supabase: any,
  city: string,
  country: string,
  category?: string,
): Promise<any[]> {
  let query = supabase
    .from('destination_events')
    .select('*')
    .ilike('city', city)
    .ilike('country', country)
    .gt('expires_at', new Date().toISOString())
    .order('date_start', { ascending: true, nullsFirst: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Cache fetch error:', error)
    return []
  }

  return data || []
}

// ─── Utilities ───────────────────────────────────────────────────
function normalizeCategory(cat: string): string {
  // Find the closest matching category
  const lower = cat.toLowerCase()
  for (const valid of EVENT_CATEGORIES) {
    if (valid.toLowerCase() === lower || lower.includes(valid.toLowerCase().split(' ')[0])) {
      return valid
    }
  }
  // Fallback mappings
  if (lower.includes('music') || lower.includes('concert')) return 'Music & Concerts'
  if (lower.includes('festival') || lower.includes('carnival')) return 'Festivals & Carnivals'
  if (lower.includes('food') || lower.includes('drink') || lower.includes('culinary')) return 'Food & Drink'
  if (lower.includes('art') || lower.includes('culture') || lower.includes('museum')) return 'Art & Culture'
  if (lower.includes('sport') || lower.includes('marathon') || lower.includes('run')) return 'Sports & Marathons'
  if (lower.includes('conference') || lower.includes('expo') || lower.includes('tech')) return 'Conferences & Expos'
  if (lower.includes('market') || lower.includes('fair') || lower.includes('bazaar')) return 'Markets & Fairs'
  if (lower.includes('night') || lower.includes('club') || lower.includes('party')) return 'Nightlife & Entertainment'
  if (lower.includes('outdoor') || lower.includes('hike') || lower.includes('adventure')) return 'Outdoor & Adventure'
  if (lower.includes('relig') || lower.includes('spiritual') || lower.includes('church')) return 'Religious & Spiritual'
  if (lower.includes('theater') || lower.includes('theatre') || lower.includes('perform')) return 'Theater & Performing Arts'
  if (lower.includes('family') || lower.includes('kids') || lower.includes('children')) return 'Family & Kids'
  if (lower.includes('parade') || lower.includes('celebration')) return 'Parades & Celebrations'
  return 'Community & Local'
}

// ─── AI Image Generation (Imagen 4 Fast) ────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

function buildImagePrompt(event: any, city: string): string {
  const categoryStyles: Record<string, string> = {
    'Music & Concerts': 'live music performance, concert stage with colorful lights, excited crowd',
    'Festivals & Carnivals': 'vibrant outdoor festival, decorations, crowd celebrating',
    'Food & Drink': 'artisanal food market stalls, gourmet street food, people tasting food outdoors',
    'Art & Culture': 'art exhibition space, cultural installations, gallery atmosphere',
    'Sports & Marathons': 'dynamic sports event, athletic competition, stadium with cheering fans',
    'Conferences & Expos': 'modern conference venue, exhibition hall, professional networking',
    'Markets & Fairs': 'bustling outdoor artisan market, colorful vendor stalls, handmade goods',
    'Nightlife & Entertainment': 'vibrant nightlife scene, entertainment venue, dynamic lighting',
    'Outdoor & Adventure': 'scenic outdoor adventure setting, nature, active participants',
    'Religious & Spiritual': 'peaceful spiritual gathering, ceremonial atmosphere, sacred space',
    'Theater & Performing Arts': 'theater stage, dramatic performance, elegant venue',
    'Family & Kids': 'family-friendly outdoor event, children playing, colorful activities',
    'Community & Local': 'community gathering in a park, local neighborhood celebration',
    'Parades & Celebrations': 'festive street parade, marching participants, colorful floats',
  }

  const style = categoryStyles[event.category] || 'community event, people gathering outdoors'
  const venue = event.venue ? `at ${event.venue}` : ''

  return `A vibrant, photorealistic wide-angle photograph of the event "${event.event_name}" ${venue} in ${city}. The scene shows ${style}. Professional travel magazine photography, natural warm lighting, high quality, no text overlays, no watermarks, no logos.`
}

async function generateSingleImage(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
        },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`Imagen API ${res.status}:`, errBody.slice(0, 500))
      return null
    }

    const data = await res.json()
    const base64 = data.predictions?.[0]?.bytesBase64Encoded
    if (!base64) {
      console.warn('No image data in Imagen response:', JSON.stringify(data).slice(0, 300))
      return null
    }
    return base64
  } catch (err) {
    console.error('Imagen fetch error:', (err as Error).message)
    return null
  }
}

async function uploadImageToStorage(
  supabase: any,
  base64: string,
  city: string,
  eventSlug: string,
): Promise<string | null> {
  try {
    const raw = atob(base64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

    const filePath = `${slugify(city)}/${eventSlug}-${Date.now()}.jpg`

    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, bytes, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.error('Storage upload error:', error.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath)

    return urlData?.publicUrl || null
  } catch (err) {
    console.error('Upload error:', (err as Error).message)
    return null
  }
}

async function generateImagesForEvents(
  apiKey: string,
  supabase: any,
  events: any[],
  city: string,
): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>()
  console.log(`Generating AI images for ${events.length} events in batches of ${IMAGE_BATCH_SIZE}...`)

  for (let i = 0; i < events.length; i += IMAGE_BATCH_SIZE) {
    const batch = events.slice(i, i + IMAGE_BATCH_SIZE)
    const batchStart = Date.now()

    const results = await Promise.allSettled(
      batch.map(async (event: any, batchIdx: number) => {
        const idx = i + batchIdx
        const prompt = buildImagePrompt(event, city)
        const base64 = await generateSingleImage(apiKey, prompt)
        if (!base64) return

        const slug = slugify(event.event_name)
        const publicUrl = await uploadImageToStorage(supabase, base64, city, slug)
        if (publicUrl) {
          imageMap.set(idx, publicUrl)
        }
      })
    )

    const batchTime = Date.now() - batchStart
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    console.log(`Batch ${Math.floor(i / IMAGE_BATCH_SIZE) + 1}: ${succeeded}/${batch.length} images in ${batchTime}ms`)
  }

  console.log(`Image generation complete: ${imageMap.size}/${events.length} images generated`)
  return imageMap
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
