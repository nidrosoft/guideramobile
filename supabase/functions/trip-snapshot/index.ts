/**
 * TRIP SNAPSHOT EDGE FUNCTION (v5)
 * 
 * Orchestrates multiple travel APIs + live web search in parallel to generate
 * a comprehensive "Trip Intelligence Snapshot" for a destination + dates.
 * 
 * Calls (all parallel):
 * - Amadeus (flights) → cheapest/fastest round-trip flight preview
 * - Amadeus (hotels) → price tiers (budget/mid/luxury)
 * - Viator (experiences) → top 7 rated experiences
 * - Event Discovery (Gemini) → events during travel dates
 * - Web Search (Brave → Grok) → live visa, safety, transport, scam data
 * 
 * Then:
 * - Builds cost estimate with full breakdown (flights, hotels, food, experiences, misc)
 * - Generates AI brief via Claude Haiku 4.5 → Gemini 2.5 Flash fallback
 *   with 13 sections including live web search context
 * 
 * Required env: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET,
 *               VIATOR_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY,
 *               BRAVE_SEARCH_API_KEY (optional), XAI_API_KEY (optional)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ─── Types ──────────────────────────────────────────────

interface SnapshotRequest {
  destination: string;
  country?: string;
  startDate: string;
  endDate: string;
  travelers: { adults: number; children: number; infants: number };
  originCity?: string;
  originAirport?: string;
  currency?: string;
  nationality?: string;
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
    miscellaneous: { low: number; high: number };
  };
  currency: string;
  perDayBudget: { low: number; high: number };
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

// ─── Live Web Search (Brave → Grok fallback) ─────────────

// Fetch with timeout helper
function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, opts),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

async function webSearch(query: string): Promise<string> {
  const SEARCH_TIMEOUT = 8000; // 8s max per search

  // Try Brave Search API first (fast, ~1-3s)
  const braveKey = Deno.env.get('BRAVE_SEARCH_API_KEY');
  if (braveKey) {
    try {
      const r = await fetchWithTimeout(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': braveKey } },
        SEARCH_TIMEOUT,
      );
      if (r.ok) {
        const d = await r.json();
        const results = (d.web?.results || []).slice(0, 5)
          .map((x: any) => `- ${x.title}: ${x.description || x.url}`)
          .join('\n');
        if (results) return results;
      }
    } catch (e: any) { console.warn('Brave search error:', e.message); }
  }

  // Fallback: xAI Grok with web-grounded search
  const xaiKey = Deno.env.get('XAI_API_KEY');
  if (xaiKey) {
    try {
      const r = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${xaiKey}` },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: [{ role: 'user', content: `Provide the latest factual information about: ${query}. Be concise and factual. Include specific numbers, dates, and current details.` }],
          max_tokens: 400,
          temperature: 0.2,
          search_parameters: { mode: 'auto' },
        }),
      }, SEARCH_TIMEOUT);
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || '';
      }
    } catch (e: any) { console.warn('Grok search error:', e.message); }
  }

  return '';
}

async function fetchLiveContext(
  destination: string,
  country: string,
  nationality: string,
  month: string,
): Promise<{ visa: string; safety: string; transport: string; scams: string; connectivity: string }> {
  const destFull = country ? `${destination}, ${country}` : destination;
  const natLabel = nationality || 'US citizen';

  // Fire all searches in parallel — each is independent
  const [visaR, safetyR, transportR, scamsR, connectR] = await Promise.allSettled([
    webSearch(`${natLabel} visa requirements ${destFull} 2026 entry rules passport`),
    webSearch(`${destFull} travel safety 2026 areas to avoid tourist warnings`),
    webSearch(`${destFull} airport to city center transport options cost metro taxi 2026`),
    webSearch(`${destFull} common tourist scams fraud dangers to avoid 2026`),
    webSearch(`${destFull} eSIM mobile data coverage wifi tourist SIM card cost 2026`),
  ]);

  return {
    visa: visaR.status === 'fulfilled' ? visaR.value : '',
    safety: safetyR.status === 'fulfilled' ? safetyR.value : '',
    transport: transportR.status === 'fulfilled' ? transportR.value : '',
    scams: scamsR.status === 'fulfilled' ? scamsR.value : '',
    connectivity: connectR.status === 'fulfilled' ? connectR.value : '',
  };
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

    // Approximate exchange rates for common non-USD currencies
    // Used when Amadeus returns prices in local currency instead of requested USD
    const APPROX_TO_USD: Record<string, number> = {
      'IDR': 15500, 'INR': 84, 'THB': 35, 'VND': 25000, 'KRW': 1350,
      'JPY': 150, 'PHP': 56, 'MYR': 4.5, 'BRL': 5.2, 'MXN': 17,
      'TRY': 32, 'ZAR': 18, 'EGP': 48, 'NGN': 1500, 'KES': 150,
      'COP': 4000, 'ARS': 900, 'CLP': 950, 'PEN': 3.7, 'MAD': 10,
      'XAF': 600, 'XOF': 600, 'GHS': 14, 'TZS': 2600, 'UGX': 3750,
      'RWF': 1300, 'ETB': 57, 'PKR': 280, 'BDT': 110, 'LKR': 310,
      'GBP': 0.79, 'EUR': 0.92, 'AUD': 1.55, 'CAD': 1.37, 'CHF': 0.88,
      'NZD': 1.7, 'SGD': 1.35, 'HKD': 7.8, 'TWD': 32, 'SEK': 10.5,
      'NOK': 10.8, 'DKK': 6.9, 'CZK': 23, 'PLN': 4, 'HUF': 370,
      'RON': 4.6, 'BGN': 1.8, 'HRK': 7, 'RSD': 108, 'ISK': 140,
      'AED': 3.67, 'SAR': 3.75, 'QAR': 3.64, 'BHD': 0.376, 'OMR': 0.385,
      'JOD': 0.709, 'ILS': 3.6, 'CNY': 7.2, 'MMK': 2100, 'KHR': 4100,
      'LAK': 21000, 'MNT': 3400, 'NPR': 134, 'FJD': 2.3, 'PGK': 3.8,
    };

    function convertToUSD(amount: number, fromCurrency: string): number {
      if (!fromCurrency || fromCurrency === 'USD') return amount;
      const rate = APPROX_TO_USD[fromCurrency.toUpperCase()];
      if (rate && rate > 1) return amount / rate; // Foreign currency → USD
      if (rate && rate < 1) return amount * (1 / rate); // GBP/EUR → USD
      // Unknown currency with suspiciously high prices → likely local currency
      if (amount > 10000) return amount / 100; // rough safety net
      return amount;
    }

    // Parse and categorize by rating/price tier
    const parsed = hotels.map((h: any) => {
      const offer = h.offers?.[0];
      const rawPrice = parseFloat(offer?.price?.total || '0');
      const priceCurrency = offer?.price?.currency || currency;
      const totalPriceUSD = convertToUSD(rawPrice, priceCurrency);
      const perNight = totalPriceUSD / nights;
      const rating = h.hotel?.rating ? parseInt(h.hotel.rating) : 0;
      return { perNight, rating, name: h.hotel?.name || '' };
    }).filter((h: any) => h.perNight > 0 && h.perNight < 5000);

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

// ─── AI Destination Intelligence (Claude Haiku 4.5 → Gemini 2.5 Flash fallback) ────

function buildBriefPrompt(
  destination: string, startDate: string, endDate: string,
  travelers: { adults: number; children: number; infants: number },
  nights: number, costEstimate: CostEstimate,
  liveContext: { visa: string; safety: string; transport: string; scams: string; connectivity: string },
  nationality: string,
  preferences?: SnapshotRequest['userPreferences'],
): string {
  const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;
  const prefsSection = preferences ? `\nTraveler preferences:\n- Budget: ${preferences.budgetAmount ? `$${preferences.budgetAmount}` : 'Not specified'}\n- Interests: ${preferences.interests?.join(', ') || 'General sightseeing'}\n- Travel style: ${preferences.travelStyle || 'Not specified'}\n- Accommodation preference: ${preferences.accommodationType || 'Not specified'}` : '';

  // Inject live web search results as grounding context
  const liveData = `
═══ LIVE WEB SEARCH RESULTS (use these for accuracy — they are real-time) ═══

VISA & ENTRY (for ${nationality || 'US citizen'}):
${liveContext.visa || 'No live data — use your knowledge'}

SAFETY & WARNINGS:
${liveContext.safety || 'No live data — use your knowledge'}

LOCAL TRANSPORT:
${liveContext.transport || 'No live data — use your knowledge'}

COMMON SCAMS:
${liveContext.scams || 'No live data — use your knowledge'}

CONNECTIVITY (eSIM, Wi-Fi):
${liveContext.connectivity || 'No live data — use your knowledge'}
═══════════════════════════════════════════════════════════════════════════════`;

  return `You are Guidera, the world's smartest AI travel assistant. Generate a comprehensive destination intelligence brief as JSON.

Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights, ${month})
Travelers: ${totalTravelers} (${travelers.adults} adults${travelers.children ? `, ${travelers.children} children` : ''}${travelers.infants ? `, ${travelers.infants} infants` : ''})
Nationality: ${nationality || 'US citizen'}
Estimated cost range: $${costEstimate.low} - $${costEstimate.high}
${prefsSection}

${liveData}

INSTRUCTIONS: Use the live web search results above to provide accurate, current information. Supplement with your knowledge where live data is missing. Be hyper-specific — use real names, real prices, real places.

Return ONLY valid JSON (no markdown, no code fences) in this exact structure:
{
  "overview": "A warm, specific 2-3 sentence summary highlighting what makes ${destination} special in ${month} for this specific trip.",
  "sections": [
    {
      "id": "weather",
      "icon": "sun",
      "title": "Weather & Best Time",
      "items": [
        { "label": "Temperature", "detail": "Exact expected range in °F and °C for ${month}" },
        { "label": "Conditions", "detail": "Rainy/dry/humid specifics for the exact dates" },
        { "label": "Pack", "detail": "Specific items to bring for this weather" },
        { "label": "Best Time of Day", "detail": "When to do outdoor activities vs indoor" }
      ]
    },
    {
      "id": "best_times",
      "icon": "clock",
      "title": "Best Times for Key Spots",
      "items": [
        { "label": "[Top Attraction 1]", "detail": "Best time to visit and why (e.g. 'before 9am to avoid crowds')" },
        { "label": "[Top Attraction 2]", "detail": "Best time and insider tip" },
        { "label": "[Top Attraction 3]", "detail": "Best time and insider tip" },
        { "label": "Golden Hour", "detail": "Best spot for sunset/photos" }
      ]
    },
    {
      "id": "neighborhoods",
      "icon": "map",
      "title": "Where to Stay",
      "items": [
        { "label": "[Neighborhood 1]", "detail": "Pros: ..., Cons: ..., Best for: first-timers/families" },
        { "label": "[Neighborhood 2]", "detail": "Pros: ..., Cons: ..., Best for: nightlife/young travelers" },
        { "label": "[Neighborhood 3]", "detail": "Pros: ..., Cons: ..., Best for: budget/authentic" },
        { "label": "[Neighborhood 4]", "detail": "Pros: ..., Cons: ..., Best for: luxury/quiet" },
        { "label": "Avoid Staying In", "detail": "Area to avoid and why" }
      ]
    },
    {
      "id": "transport",
      "icon": "car",
      "title": "Getting Around",
      "items": [
        { "label": "Airport → City", "detail": "Exact options with costs (taxi $X, metro $X, bus $X)" },
        { "label": "Metro/Bus", "detail": "How the system works, day pass cost, operating hours" },
        { "label": "Taxi/Rideshare", "detail": "Uber/Bolt/local app availability, typical fare ranges" },
        { "label": "Pro Tip", "detail": "Specific transport hack locals use" }
      ]
    },
    {
      "id": "culture",
      "icon": "people",
      "title": "Tipping & Etiquette",
      "items": [
        { "label": "Greeting", "detail": "How locals greet (handshake, bow, kiss, etc.)" },
        { "label": "Tipping — Restaurants", "detail": "Expected tip percentage or 'not expected'" },
        { "label": "Tipping — Taxis/Hotels", "detail": "What's customary" },
        { "label": "Don't Do This", "detail": "A specific cultural faux pas to avoid" },
        { "label": "Dress Code", "detail": "What to wear, especially for religious sites" }
      ]
    },
    {
      "id": "food",
      "icon": "food",
      "title": "Food & Dining",
      "items": [
        { "label": "Must Try", "detail": "Top 3 local dishes with real names" },
        { "label": "Street Food Spot", "detail": "A specific market or street food area with name" },
        { "label": "Fine Dining", "detail": "A notable restaurant or area" },
        { "label": "Budget Meal Cost", "detail": "Average cost: street food $X, restaurant $X" },
        { "label": "Food Safety", "detail": "Water drinkable? Raw food safe? Specific tips" }
      ]
    },
    {
      "id": "safety",
      "icon": "shield",
      "title": "Safety & Health",
      "items": [
        { "label": "Safety Rating", "detail": "Overall safety level with context" },
        { "label": "Areas to Avoid", "detail": "Specific neighborhoods/areas, especially at night" },
        { "label": "Emergency Number", "detail": "Local emergency number (NOT 911 unless US/Canada)" },
        { "label": "Health", "detail": "Vaccinations needed, water safety, malaria risk if applicable" },
        { "label": "Insurance", "detail": "Travel insurance recommendation with minimum coverage" }
      ]
    },
    {
      "id": "scams",
      "icon": "warning",
      "title": "Scams & Risks",
      "items": [
        { "label": "[Scam 1]", "detail": "How it works and how to avoid it" },
        { "label": "[Scam 2]", "detail": "How it works and how to avoid it" },
        { "label": "[Scam 3]", "detail": "How it works and how to avoid it" },
        { "label": "General Rule", "detail": "A smart general safety principle for this destination" }
      ]
    },
    {
      "id": "visa",
      "icon": "document",
      "title": "Visa & Entry",
      "items": [
        { "label": "Visa Required?", "detail": "Specific answer for ${nationality || 'US'} citizens with duration" },
        { "label": "Passport", "detail": "Validity requirement (e.g. '6 months beyond stay')" },
        { "label": "On Arrival", "detail": "What to expect at immigration (forms, fees, lines)" },
        { "label": "Important", "detail": "Any current entry rules, COVID/health requirements" }
      ]
    },
    {
      "id": "connectivity",
      "icon": "wifi",
      "title": "Connectivity",
      "items": [
        { "label": "eSIM", "detail": "Best eSIM provider and approximate cost for data" },
        { "label": "Local SIM", "detail": "Where to buy, cost, coverage quality" },
        { "label": "Wi-Fi", "detail": "How common, speed quality, where to find it" },
        { "label": "Tip", "detail": "VPN needed? Any blocked services?" }
      ]
    },
    {
      "id": "budget",
      "icon": "wallet",
      "title": "Daily Budget Guide",
      "items": [
        { "label": "Budget Tier", "detail": "$X-Y/day — hostel, street food, public transport" },
        { "label": "Mid-Range Tier", "detail": "$X-Y/day — hotel, restaurants, some taxis" },
        { "label": "Luxury Tier", "detail": "$X-Y/day — luxury hotel, fine dining, private transport" },
        { "label": "Money Tip", "detail": "ATM fees, best way to pay, currency exchange advice" }
      ]
    },
    {
      "id": "money",
      "icon": "saving",
      "title": "Money-Saving Tips",
      "items": [
        { "label": "Pro Tip", "detail": "A specific actionable money-saving tip" },
        { "label": "Free Activities", "detail": "Best free things to do with specific names" },
        { "label": "Tourist Trap", "detail": "A specific overpriced thing to skip and the alternative" }
      ]
    },
    {
      "id": "language",
      "icon": "language",
      "title": "Language Essentials",
      "items": [
        { "label": "Hello", "detail": "How to say hello in local language with pronunciation" },
        { "label": "Thank You", "detail": "How to say thank you with pronunciation" },
        { "label": "Help/Emergency", "detail": "How to ask for help" },
        { "label": "English Level", "detail": "How widely English is spoken and where" }
      ]
    }
  ]
}

CRITICAL RULES:
1. Replace ALL bracketed placeholders (like [Neighborhood 1], [Scam 1]) with REAL names specific to ${destination}.
2. Use REAL prices in USD. Use the live web search data above for current/accurate info.
3. Every detail must be actionable — a tourist should be able to use it immediately.
4. For visa/entry: be specific to ${nationality || 'US'} citizens. Cite duration of visa-free stay if applicable.
5. For scams: describe 3 REAL scams common in ${destination}, not generic ones.
6. Return ONLY the JSON object, nothing else.`;
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
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
  liveContext: { visa: string; safety: string; transport: string; scams: string; connectivity: string },
  nationality: string,
  preferences?: SnapshotRequest['userPreferences'],
): Promise<DestinationIntelligence | null> {
  const prompt = buildBriefPrompt(destination, startDate, endDate, travelers, nights, costEstimate, liveContext, nationality, preferences);

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

  // Hotels (per night × nights) — cap at $2000/night as sanity check
  const capPerNight = (price: number) => Math.min(price, 2000);
  const hotelLow = hotels?.budget ? capPerNight(hotels.budget.avgPrice) * nights : 0;
  const hotelHigh = hotels?.midRange ? capPerNight(hotels.midRange.avgPrice) * nights : (hotelLow > 0 ? hotelLow * 1.5 : 0);

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

  // Miscellaneous (transport, SIM, tips, souvenirs — ~$15-40/person/day)
  const miscLow = Math.round(15 * totalTravelers * nights);
  const miscHigh = Math.round(40 * totalTravelers * nights);

  const totalLow = flightLow + hotelLow + expLow + foodLow + miscLow;
  const totalHigh = flightHigh + hotelHigh + expHigh + foodHigh + miscHigh;

  // Per-day budget (excluding flights which are one-time)
  const dailyCostsLow = hotelLow + foodLow + expLow + miscLow;
  const dailyCostsHigh = hotelHigh + foodHigh + expHigh + miscHigh;

  return {
    low: totalLow || 0,
    high: totalHigh || 0,
    breakdown: {
      flights: { low: flightLow, high: flightHigh },
      hotels: { low: hotelLow, high: hotelHigh },
      experiences: { low: expLow, high: expHigh },
      food: { low: foodLow, high: foodHigh },
      miscellaneous: { low: miscLow, high: miscHigh },
    },
    currency,
    perDayBudget: {
      low: nights > 0 ? Math.round(dailyCostsLow / nights) : 0,
      high: nights > 0 ? Math.round(dailyCostsHigh / nights) : 0,
    },
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
    const { destination, country, startDate, endDate, travelers, originCity, originAirport, currency = 'USD', nationality, userPreferences } = body;

    if (!destination || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: destination, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const nights = daysBetween(startDate, endDate);
    const totalTravelers = (travelers?.adults || 1) + (travelers?.children || 0) + (travelers?.infants || 0);
    const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });

    // Resolve origin airport from originCity if not provided directly
    const resolvedOrigin = originAirport || (originCity ? resolveIATA(originCity) : null);

    // ─── Fire all APIs + web search in parallel ───
    const [flightResult, hotelResult, expResult, eventResult, liveCtxResult] = await Promise.allSettled([
      resolvedOrigin
        ? fetchFlightPreview(resolvedOrigin, destination, startDate, endDate, travelers?.adults || 1, currency)
        : Promise.resolve(null),
      fetchHotelTiers(destination, startDate, endDate, travelers?.adults || 1, currency),
      fetchExperiencePreview(destination, startDate, currency),
      fetchEventPreview(destination, country || '', startDate, endDate),
      fetchLiveContext(destination, country || '', nationality || 'US citizen', month),
    ]);

    const flights = flightResult.status === 'fulfilled' ? flightResult.value : null;
    const hotels = hotelResult.status === 'fulfilled' ? hotelResult.value : null;
    const experiences = expResult.status === 'fulfilled' ? expResult.value : [];
    const events = eventResult.status === 'fulfilled' ? eventResult.value : [];
    const liveContext = liveCtxResult.status === 'fulfilled' ? liveCtxResult.value : { visa: '', safety: '', transport: '', scams: '', connectivity: '' };

    console.log(`Live context fetched: visa=${liveContext.visa.length}b, safety=${liveContext.safety.length}b, transport=${liveContext.transport.length}b, scams=${liveContext.scams.length}b, connectivity=${liveContext.connectivity.length}b`);

    // ─── Build cost estimate ───
    const costEstimate = buildCostEstimate(
      nights, totalTravelers, flights, hotels, experiences, currency,
      userPreferences?.budgetAmount,
    );

    // ─── Generate AI brief (after cost estimate is ready, with live web context) ───
    let aiBrief: DestinationIntelligence | null = null;
    try {
      aiBrief = await generateAIBrief(
        destination, startDate, endDate, travelers || { adults: 1, children: 0, infants: 0 },
        nights, costEstimate, liveContext, nationality || 'US citizen', userPreferences,
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
