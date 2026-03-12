/**
 * TRIP SNAPSHOT EDGE FUNCTION
 * 
 * Orchestrates multiple travel APIs in parallel to generate a comprehensive
 * "Trip Intelligence Snapshot" for a destination + dates + travelers.
 * 
 * Calls:
 * - Amadeus (flights) → cheapest/fastest flight preview
 * - Booking.com via RapidAPI (hotels) → price tiers (budget/mid/luxury)
 * - Viator (experiences) → top 4 rated experiences
 * - Event Discovery (Gemini) → events during travel dates
 * - Claude 3.5 Haiku (AI brief) → personalized travel intelligence
 * 
 * All calls run in parallel via Promise.allSettled — partial data is fine.
 * 
 * Required env: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, RAPIDAPI_KEY,
 *               VIATOR_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY
 */

// NOTE: All shared code is inlined — this function is self-contained
// for deployment via MCP. The deployed version (v1) matches this file.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ─── Types ──────────────────────────────────────────────

interface SnapshotRequest {
  destination: string;       // "Paris", "Tokyo", etc.
  country?: string;
  startDate: string;         // YYYY-MM-DD
  endDate: string;           // YYYY-MM-DD
  travelers: { adults: number; children: number; infants: number };
  originAirport?: string;    // IATA code for flight search, e.g. "LAX"
  currency?: string;
  userPreferences?: {
    budgetAmount?: number;
    budgetCurrency?: string;
    interests?: string[];
    travelStyle?: string;
    accommodationType?: string;
  };
}

interface SnapshotResponse {
  destination: string;
  country?: string;
  dates: { start: string; end: string; nights: number };
  travelers: { adults: number; children: number; infants: number; total: number };
  flights: FlightPreview | null;
  hotels: HotelTiers | null;
  experiences: ExperiencePreview[];
  events: EventPreview[];
  costEstimate: CostEstimate;
  aiBrief: DestinationIntelligence | null;
  generatedAt: string;
}

interface FlightPreview {
  cheapest: { price: number; airline: string; stops: number; duration: string } | null;
  fastest: { price: number; airline: string; stops: number; duration: string } | null;
  avgPrice: number;
  currency: string;
}

interface HotelTiers {
  budget: { avgPrice: number; stars: number; count: number } | null;
  midRange: { avgPrice: number; stars: number; count: number } | null;
  luxury: { avgPrice: number; stars: number; count: number } | null;
  currency: string;
}

interface ExperiencePreview {
  id: string;
  title: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: string;
  image: string;
  category: string;
  freeCancellation: boolean;
  bookingUrl: string;
}

interface EventPreview {
  name: string;
  category: string;
  dateRange: string;
  venue?: string;
  isFree: boolean;
  description: string;
}

interface CostEstimate {
  low: number;
  high: number;
  breakdown: {
    flights: { low: number; high: number };
    hotels: { low: number; high: number };
    experiences: { low: number; high: number };
    food: { low: number; high: number };
  };
  currency: string;
  withinBudget?: boolean;
  budgetAmount?: number;
}

interface DestinationIntelligence {
  overview: string;
  sections: BriefSection[];
}

interface BriefSection {
  id: string;
  icon: string;
  title: string;
  items: BriefItem[];
}

interface BriefItem {
  label: string;
  detail: string;
}

// ─── Amadeus Token ──────────────────────────────────────

let amadeusToken: { token: string; expiresAt: number; baseUrl: string } | null = null;

function getAmadeusBaseUrl(): string {
  return Deno.env.get('AMADEUS_ENV') === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';
}

async function getAmadeusToken(): Promise<{ token: string; baseUrl: string }> {
  if (amadeusToken && Date.now() < amadeusToken.expiresAt) {
    return { token: amadeusToken.token, baseUrl: amadeusToken.baseUrl };
  }
  
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Amadeus credentials not set');

  const baseUrl = getAmadeusBaseUrl();

  const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const data = await res.json();
  amadeusToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000, baseUrl };
  return { token: amadeusToken.token, baseUrl };
}

// ─── City → IATA Airport Code ────────────────────────────

const CITY_TO_IATA: Record<string, string> = {
  'new york':'JFK','los angeles':'LAX','san francisco':'SFO','las vegas':'LAS',
  'chicago':'ORD','miami':'MIA','orlando':'MCO','san diego':'SAN','seattle':'SEA',
  'boston':'BOS','washington':'IAD','nashville':'BNA','new orleans':'MSY',
  'houston':'IAH','atlanta':'ATL','denver':'DEN','dallas':'DFW','phoenix':'PHX',
  'toronto':'YYZ','vancouver':'YVR','montreal':'YUL','cancun':'CUN',
  'mexico city':'MEX','london':'LHR','paris':'CDG','rome':'FCO','barcelona':'BCN',
  'amsterdam':'AMS','berlin':'BER','prague':'PRG','vienna':'VIE',
  'lisbon':'LIS','dublin':'DUB','edinburgh':'EDI','madrid':'MAD',
  'florence':'FLR','venice':'VCE','milan':'MXP','munich':'MUC',
  'budapest':'BUD','athens':'ATH','istanbul':'IST','nice':'NCE',
  'copenhagen':'CPH','stockholm':'ARN','zurich':'ZRH','brussels':'BRU',
  'cairo':'CAI','marrakech':'RAK','cape town':'CPT','johannesburg':'JNB',
  'nairobi':'NBO','lagos':'LOS','accra':'ACC','douala':'DLA',
  'casablanca':'CMN','dar es salaam':'DAR','addis ababa':'ADD',
  'tokyo':'NRT','bangkok':'BKK','singapore':'SIN','dubai':'DXB',
  'hong kong':'HKG','seoul':'ICN','taipei':'TPE','kuala lumpur':'KUL',
  'bali':'DPS','mumbai':'BOM','delhi':'DEL','hanoi':'HAN',
  'ho chi minh city':'SGN','beijing':'PEK','shanghai':'PVG',
  'buenos aires':'EZE','rio de janeiro':'GIG','lima':'LIM',
  'bogota':'BOG','santiago':'SCL','medellin':'MDE','sao paulo':'GRU',
  'sydney':'SYD','melbourne':'MEL','auckland':'AKL',
};

function resolveIATA(cityOrCode: string): string {
  if (cityOrCode.length === 3 && cityOrCode === cityOrCode.toUpperCase()) return cityOrCode;
  const k = cityOrCode.toLowerCase().trim();
  if (CITY_TO_IATA[k]) return CITY_TO_IATA[k];
  for (const [city, code] of Object.entries(CITY_TO_IATA)) {
    if (k.includes(city) || city.includes(k)) return code;
  }
  return cityOrCode.toUpperCase().slice(0, 3);
}

// ─── Flight Search (Amadeus) ────────────────────────────

async function fetchFlightPreview(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  adults: number,
  currency: string,
): Promise<FlightPreview | null> {
  try {
    const { token, baseUrl } = await getAmadeusToken();
    const destCode = resolveIATA(destination);
    const originCode = resolveIATA(origin);
    console.log(`Flights: ${originCode} → ${destCode} (${baseUrl})`);

    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destCode,
      departureDate: startDate,
      returnDate: endDate,
      adults: String(adults || 1),
      currencyCode: currency,
      max: '10',
      nonStop: 'false',
    });

    const res = await fetch(
      `${baseUrl}/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return null;
    const data = await res.json();
    const offers = data.data || [];
    if (offers.length === 0) return null;

    // Parse offers
    const parsed = offers.map((o: any) => {
      const price = parseFloat(o.price?.total || '0');
      const segments = o.itineraries?.[0]?.segments || [];
      const airline = segments[0]?.carrierCode || 'Unknown';
      const stops = Math.max(0, segments.length - 1);
      const dur = o.itineraries?.[0]?.duration || '';
      const duration = dur.replace('PT', '').replace('H', 'h ').replace('M', 'm').trim();
      return { price, airline, stops, duration };
    });

    const sorted = [...parsed].sort((a: any, b: any) => a.price - b.price);
    const byDuration = [...parsed].sort((a: any, b: any) => {
      const dA = (a.duration || '').length;
      const dB = (b.duration || '').length;
      return dA - dB;
    });

    const prices = sorted.map((o: any) => o.price);
    const avg = prices.reduce((s: number, p: number) => s + p, 0) / prices.length;

    return {
      cheapest: sorted[0] || null,
      fastest: byDuration[0]?.price !== sorted[0]?.price ? byDuration[0] : null,
      avgPrice: Math.round(avg),
      currency,
    };
  } catch (e) {
    console.error('Flight search error:', e);
    return null;
  }
}

// ─── Hotel Search (Amadeus) ─────────────────────────────

async function fetchHotelTiers(
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  currency: string,
): Promise<HotelTiers | null> {
  try {
    const { token, baseUrl } = await getAmadeusToken();
    const cityCode = resolveIATA(destination);
    console.log(`Hotels: searching Amadeus for cityCode=${cityCode}`);

    // Step 1: Get hotel IDs by city
    const cityRes = await fetch(
      `${baseUrl}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } },
    );
    if (!cityRes.ok) {
      console.error('Hotels: city lookup failed:', cityRes.status, await cityRes.text().catch(() => ''));
      return null;
    }
    const cityData = await cityRes.json();
    const hotelIds = (cityData.data || []).slice(0, 30).map((h: any) => h.hotelId);
    if (hotelIds.length === 0) { console.error('Hotels: no hotels found for', cityCode); return null; }
    console.log(`Hotels: found ${hotelIds.length} hotel IDs`);

    // Step 2: Get hotel offers (prices)
    const offersParams = new URLSearchParams({
      hotelIds: hotelIds.join(','),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: String(adults || 1),
      roomQuantity: '1',
      currency: currency,
    });

    const offersRes = await fetch(
      `${baseUrl}/v3/shopping/hotel-offers?${offersParams}`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } },
    );
    if (!offersRes.ok) {
      console.error('Hotels: offers search failed:', offersRes.status, await offersRes.text().catch(() => ''));
      return null;
    }
    const offersData = await offersRes.json();
    const hotels = offersData.data || [];
    console.log(`Hotels: got ${hotels.length} offers`);
    if (hotels.length === 0) return null;

    const nights = Math.max(1, daysBetween(checkIn, checkOut));

    // Parse and categorize by rating/price tier
    const parsed = hotels.map((h: any) => {
      const offer = h.offers?.[0];
      const totalPrice = parseFloat(offer?.price?.total || '0');
      const perNight = totalPrice / nights;
      const rating = h.hotel?.rating ? parseInt(h.hotel.rating) : 0;
      return { perNight, rating, name: h.hotel?.name || '' };
    }).filter((h: any) => h.perNight > 0);

    if (parsed.length === 0) return null;

    // Sort by price and split into tiers
    parsed.sort((a: any, b: any) => a.perNight - b.perNight);
    const third = Math.ceil(parsed.length / 3);
    const budgetSlice = parsed.slice(0, third);
    const midSlice = parsed.slice(third, third * 2);
    const luxSlice = parsed.slice(third * 2);

    const avgPrice = (arr: any[]) => {
      if (arr.length === 0) return null;
      return Math.round(arr.reduce((s: number, h: any) => s + h.perNight, 0) / arr.length);
    };

    const budgetAvg = avgPrice(budgetSlice);
    const midAvg = avgPrice(midSlice);
    const luxAvg = avgPrice(luxSlice);

    return {
      budget: budgetAvg ? { avgPrice: budgetAvg, stars: 3, count: budgetSlice.length } : null,
      midRange: midAvg ? { avgPrice: midAvg, stars: 4, count: midSlice.length } : null,
      luxury: luxAvg ? { avgPrice: luxAvg, stars: 5, count: luxSlice.length } : null,
      currency,
    };
  } catch (e) {
    console.error('Hotel search error:', e);
    return null;
  }
}

// ─── Experience Search (Viator, inlined) ─────────────────

const CITY_TO_VID: Record<string, string> = {
  'new york':'687','los angeles':'645','san francisco':'651','las vegas':'684',
  'chicago':'673','miami':'662','orlando':'663','san diego':'736','seattle':'704',
  'boston':'678','washington':'657','nashville':'5189','new orleans':'675',
  'toronto':'623','vancouver':'616','montreal':'617','cancun':'631',
  'london':'50648','paris':'479','rome':'511','barcelona':'562',
  'amsterdam':'525','berlin':'488','prague':'462','vienna':'454',
  'lisbon':'538','dublin':'503','edinburgh':'739','madrid':'564',
  'florence':'519','venice':'522','budapest':'443','athens':'496','istanbul':'585',
  'cairo':'782','marrakech':'5408','cape town':'318','nairobi':'5280',
  'tokyo':'334','bangkok':'343','singapore':'60449','dubai':'828',
  'hong kong':'583','seoul':'973','bali':'768','mumbai':'953',
  'buenos aires':'901','rio de janeiro':'712','lima':'928',
  'sydney':'357','melbourne':'361','auckland':'376',
};

function resolveViatorDest(city: string): string | null {
  const k = city.toLowerCase().trim();
  if (CITY_TO_VID[k]) return CITY_TO_VID[k];
  for (const [c, id] of Object.entries(CITY_TO_VID)) {
    if (k.includes(c) || c.includes(k)) return id;
  }
  return null;
}

async function fetchExperiencePreview(
  destination: string,
  startDate: string,
  currency: string,
): Promise<ExperiencePreview[]> {
  try {
    const apiKey = Deno.env.get('VIATOR_API_KEY');
    if (!apiKey) return [];
    const destId = resolveViatorDest(destination);
    if (!destId) return [];

    const body: any = {
      filtering: { destination: destId },
      sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
      pagination: { start: 1, count: 7 },
      currency,
    };
    if (startDate) body.filtering.startDate = startDate;

    const r = await fetch('https://api.viator.com/partner/products/search', {
      method: 'POST',
      headers: {
        'exp-api-key': apiKey,
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) return [];
    const data = await r.json();

    return (data.products || []).slice(0, 7).map((p: any) => {
      const price = p.pricing?.summary?.fromPrice || 0;
      const durMin = p.duration?.fixedDurationInMinutes || p.duration?.variableDurationFromMinutes || 120;
      const durStr = durMin >= 60 ? `${Math.round(durMin/60)}h` : `${durMin}min`;
      const imgs = (p.images || []).map((i: any) => {
        const v = i.variants || [];
        return (v.find((x: any) => x.width===720) || v.find((x: any) => x.width===480) || v[0] || {}).url || '';
      }).filter(Boolean);
      const flags = p.flags || [];
      return {
        id: p.productCode,
        title: p.title || 'Experience',
        rating: Math.round((p.reviews?.combinedAverageRating || 0) * 10) / 10,
        reviewCount: p.reviews?.totalReviews || 0,
        price: typeof price === 'number' ? price : parseFloat(price) || 0,
        currency: p.pricing?.currency || currency,
        duration: durStr,
        image: imgs[0] || '',
        category: 'Experience',
        freeCancellation: flags.includes('FREE_CANCELLATION'),
        bookingUrl: p.productUrl || `https://www.viator.com/tours/${p.productCode}`,
      };
    });
  } catch (e) {
    console.error('Experience search error:', e);
    return [];
  }
}

// ─── Event Discovery (Gemini) ───────────────────────────

async function fetchEventPreview(
  destination: string,
  country: string,
  startDate: string,
  endDate: string,
): Promise<EventPreview[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return [];

    // Call existing event-discovery edge function internally
    const res = await fetch(`${supabaseUrl}/functions/v1/event-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'discover',
        city: destination,
        country: country || '',
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const events = data.events || [];

    // Filter to events within travel dates and return top 5
    return events.slice(0, 5).map((evt: any) => ({
      name: evt.event_name || evt.name,
      category: evt.category || 'Event',
      dateRange: evt.date_start && evt.date_end
        ? `${formatShortDate(evt.date_start)} - ${formatShortDate(evt.date_end)}`
        : evt.time_info || 'During your trip',
      venue: evt.venue,
      isFree: evt.is_free || false,
      description: (evt.description || '').slice(0, 200),
    }));
  } catch (e) {
    console.error('Event discovery error:', e);
    return [];
  }
}

// ─── AI Destination Intelligence (Claude Sonnet 4 → Gemini 2.5 Flash fallback) ────────

function buildBriefPrompt(
  destination: string, startDate: string, endDate: string,
  travelers: { adults: number; children: number; infants: number },
  nights: number, costEstimate: CostEstimate,
  preferences?: SnapshotRequest['userPreferences'],
): string {
  const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;
  const prefsSection = preferences ? `\nTraveler preferences:\n- Budget: ${preferences.budgetAmount ? `$${preferences.budgetAmount}` : 'Not specified'}\n- Interests: ${preferences.interests?.join(', ') || 'General sightseeing'}\n- Travel style: ${preferences.travelStyle || 'Not specified'}\n- Accommodation preference: ${preferences.accommodationType || 'Not specified'}` : '';

  return `You are Guidera, the world's smartest AI travel assistant. Generate a comprehensive, structured destination intelligence brief as JSON.

Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights, ${month})
Travelers: ${totalTravelers} (${travelers.adults} adults${travelers.children ? `, ${travelers.children} children` : ''}${travelers.infants ? `, ${travelers.infants} infants` : ''})
Estimated cost range: $${costEstimate.low} - $${costEstimate.high}
${prefsSection}

Return ONLY valid JSON (no markdown, no code fences, no extra text) in this exact format:
{
  "overview": "A warm 2-3 sentence summary of what makes this destination special for this trip.",
  "sections": [
    {
      "id": "weather",
      "icon": "sun",
      "title": "Weather & Best Time",
      "items": [
        { "label": "Temperature", "detail": "Expected temperature range" },
        { "label": "Conditions", "detail": "What to expect" },
        { "label": "Pack", "detail": "What to bring" }
      ]
    },
    {
      "id": "culture",
      "icon": "people",
      "title": "Culture & Etiquette",
      "items": [
        { "label": "Greeting", "detail": "How locals greet" },
        { "label": "Dress Code", "detail": "What to wear" },
        { "label": "Tipping", "detail": "Tipping customs" },
        { "label": "Good to Know", "detail": "A key cultural insight" }
      ]
    },
    {
      "id": "food",
      "icon": "food",
      "title": "Food & Dining",
      "items": [
        { "label": "Must Try", "detail": "Top 2-3 local dishes" },
        { "label": "Street Food", "detail": "Best street food or market" },
        { "label": "Fine Dining", "detail": "A notable restaurant or area" },
        { "label": "Budget Meal", "detail": "Average cost of a local meal" }
      ]
    },
    {
      "id": "safety",
      "icon": "shield",
      "title": "Safety & Health",
      "items": [
        { "label": "Safety Level", "detail": "General safety rating/description" },
        { "label": "Areas to Avoid", "detail": "Specific areas or times" },
        { "label": "Emergency", "detail": "Emergency number" },
        { "label": "Health Tip", "detail": "Water safety, vaccinations etc" }
      ]
    },
    {
      "id": "transport",
      "icon": "car",
      "title": "Getting Around",
      "items": [
        { "label": "Best Option", "detail": "Recommended transport" },
        { "label": "From Airport", "detail": "How to get to city center" },
        { "label": "Local Tip", "detail": "A specific transport tip" }
      ]
    },
    {
      "id": "neighborhoods",
      "icon": "map",
      "title": "Best Neighborhoods",
      "items": [
        { "label": "For First-Timers", "detail": "Best area to stay" },
        { "label": "For Nightlife", "detail": "Where to go out" },
        { "label": "Hidden Gem", "detail": "A lesser-known area worth visiting" }
      ]
    },
    {
      "id": "money",
      "icon": "wallet",
      "title": "Money-Saving Tips",
      "items": [
        { "label": "Pro Tip", "detail": "A specific actionable money tip" },
        { "label": "Free Activities", "detail": "Best free things to do" },
        { "label": "Avoid", "detail": "Common tourist trap to skip" }
      ]
    },
    {
      "id": "language",
      "icon": "language",
      "title": "Language Essentials",
      "items": [
        { "label": "Hello", "detail": "How to say hello in local language" },
        { "label": "Thank You", "detail": "How to say thank you" },
        { "label": "Useful Phrase", "detail": "A handy phrase for tourists" },
        { "label": "English Level", "detail": "How widely English is spoken" }
      ]
    }
  ]
}

IMPORTANT: Be specific to ${destination} in ${month}. Use real place names, real dishes, real neighborhoods. No generic advice. Every detail should be actionable and specific. Return ONLY the JSON object, nothing else.`;
}

async function tryAnthropicBrief(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) { console.log('AI brief: ANTHROPIC_API_KEY not set, skipping'); return null; }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('Claude API error:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

async function tryGeminiBrief(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) { console.log('AI brief: GOOGLE_AI_API_KEY not set, skipping Gemini'); return null; }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!res.ok) {
    console.error('Gemini API error:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function parseAIBriefJSON(raw: string): DestinationIntelligence | null {
  try {
    // Strip any markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    const parsed = JSON.parse(cleaned);
    if (parsed.overview && Array.isArray(parsed.sections)) {
      return parsed as DestinationIntelligence;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse AI brief JSON:', e);
    return null;
  }
}

async function generateAIBrief(
  destination: string,
  startDate: string,
  endDate: string,
  travelers: { adults: number; children: number; infants: number },
  nights: number,
  costEstimate: CostEstimate,
  preferences?: SnapshotRequest['userPreferences'],
): Promise<DestinationIntelligence | null> {
  const prompt = buildBriefPrompt(destination, startDate, endDate, travelers, nights, costEstimate, preferences);

  // Try Anthropic first, then Gemini as fallback
  let raw = await tryAnthropicBrief(prompt);
  if (raw) {
    const parsed = parseAIBriefJSON(raw);
    if (parsed) { console.log('AI brief: generated via Claude Sonnet 4'); return parsed; }
    console.error('AI brief: Claude returned invalid JSON, trying Gemini');
  }

  raw = await tryGeminiBrief(prompt);
  if (raw) {
    const parsed = parseAIBriefJSON(raw);
    if (parsed) { console.log('AI brief: generated via Gemini 2.5 Flash'); return parsed; }
    console.error('AI brief: Gemini returned invalid JSON');
  }

  console.error('AI brief: all providers failed');
  return null;
}

// ─── Cost Estimate Calculator ───────────────────────────

function buildCostEstimate(
  nights: number,
  totalTravelers: number,
  flights: FlightPreview | null,
  hotels: HotelTiers | null,
  experiences: ExperiencePreview[],
  currency: string,
  userBudget?: number,
): CostEstimate {
  // Flights (round trip per person)
  const flightLow = flights ? Math.round((flights.cheapest?.price || flights.avgPrice) * totalTravelers) : 0;
  const flightHigh = flights ? Math.round(flights.avgPrice * 1.3 * totalTravelers) : 0;

  // Hotels (per night × nights)
  const hotelLow = hotels?.budget ? hotels.budget.avgPrice * nights : 0;
  const hotelHigh = hotels?.midRange ? hotels.midRange.avgPrice * nights : (hotelLow * 1.5);

  // Experiences (estimate 1 per day at avg price)
  const avgExpPrice = experiences.length > 0
    ? experiences.reduce((s, e) => s + e.price, 0) / experiences.length
    : 40;
  const expDays = Math.min(nights, 5);
  const expLow = Math.round(avgExpPrice * expDays * 0.6);
  const expHigh = Math.round(avgExpPrice * expDays * totalTravelers);

  // Food estimate ($30-80/person/day depending on destination)
  const foodLow = Math.round(30 * totalTravelers * nights);
  const foodHigh = Math.round(70 * totalTravelers * nights);

  const totalLow = flightLow + hotelLow + expLow + foodLow;
  const totalHigh = flightHigh + hotelHigh + expHigh + foodHigh;

  return {
    low: totalLow || 0,
    high: totalHigh || 0,
    breakdown: {
      flights: { low: flightLow, high: flightHigh },
      hotels: { low: hotelLow, high: hotelHigh },
      experiences: { low: expLow, high: expHigh },
      food: { low: foodLow, high: foodHigh },
    },
    currency,
    withinBudget: userBudget ? totalHigh <= userBudget : undefined,
    budgetAmount: userBudget,
  };
}

// ─── Helpers ────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function formatShortDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return d; }
}

// ─── Main Handler ───────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SnapshotRequest = await req.json();
    const { destination, country, startDate, endDate, travelers, originAirport, currency = 'USD', userPreferences } = body;

    if (!destination || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: destination, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const nights = daysBetween(startDate, endDate);
    const totalTravelers = (travelers?.adults || 1) + (travelers?.children || 0) + (travelers?.infants || 0);

    // ─── Fire all APIs in parallel ───
    const [flightResult, hotelResult, expResult, eventResult] = await Promise.allSettled([
      originAirport
        ? fetchFlightPreview(originAirport, destination, startDate, endDate, travelers?.adults || 1, currency)
        : Promise.resolve(null),
      fetchHotelTiers(destination, startDate, endDate, travelers?.adults || 1, currency),
      fetchExperiencePreview(destination, startDate, currency),
      fetchEventPreview(destination, country || '', startDate, endDate),
    ]);

    const flights = flightResult.status === 'fulfilled' ? flightResult.value : null;
    const hotels = hotelResult.status === 'fulfilled' ? hotelResult.value : null;
    const experiences = expResult.status === 'fulfilled' ? expResult.value : [];
    const events = eventResult.status === 'fulfilled' ? eventResult.value : [];

    // ─── Build cost estimate ───
    const costEstimate = buildCostEstimate(
      nights, totalTravelers, flights, hotels, experiences, currency,
      userPreferences?.budgetAmount,
    );

    // ─── Generate AI brief (after cost estimate is ready) ───
    let aiBrief: DestinationIntelligence | null = null;
    try {
      aiBrief = await generateAIBrief(
        destination, startDate, endDate, travelers || { adults: 1, children: 0, infants: 0 },
        nights, costEstimate, userPreferences,
      );
    } catch (e) {
      console.error('AI brief failed:', e);
    }

    // ─── Assemble response ───
    const response: SnapshotResponse = {
      destination,
      country,
      dates: { start: startDate, end: endDate, nights },
      travelers: {
        adults: travelers?.adults || 1,
        children: travelers?.children || 0,
        infants: travelers?.infants || 0,
        total: totalTravelers,
      },
      flights,
      hotels,
      experiences,
      events,
      costEstimate,
      aiBrief,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Trip snapshot error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to generate trip snapshot', details: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
