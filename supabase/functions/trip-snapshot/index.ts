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
  selectedTopics?: string[];
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
          model: 'grok-4-fast-non-reasoning',
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

// Map topics to which web searches they need
const TOPIC_SEARCH_NEEDS: Record<string, string[]> = {
  customs: ['culture'], social_norms: ['culture', 'safety'], dos_donts: ['culture'],
  sacred_sites: ['culture'], arrival: ['transport'], transit: ['transport'],
  neighborhoods: ['transport', 'safety'], hours: ['culture'],
  safety: ['safety'], scams_crime: ['scams', 'safety'], solo_female: ['safety'],
  health: ['safety'], payments: ['culture'], price_feel: ['culture'],
  saving_tips: ['culture'], visa_entry: ['visa'], laws: ['visa', 'safety'],
  food: ['culture'], food_culture: ['culture'], weather: [],
  crowds: ['culture'], history: ['culture'], language: ['culture'],
  apps: ['connectivity'],
};

async function fetchLiveContext(
  destination: string,
  country: string,
  nationality: string,
  month: string,
  selectedTopics?: string[],
): Promise<{ visa: string; safety: string; transport: string; scams: string; connectivity: string; culture: string }> {
  const destFull = country ? `${destination}, ${country}` : destination;
  const natLabel = nationality || 'US citizen';

  // Determine which searches are needed based on selected topics
  const neededSearches = new Set<string>();
  if (!selectedTopics || selectedTopics.length === 0) {
    // Default: all searches
    ['visa', 'safety', 'transport', 'scams', 'connectivity', 'culture'].forEach(s => neededSearches.add(s));
  } else {
    for (const topic of selectedTopics) {
      const needs = TOPIC_SEARCH_NEEDS[topic] || [];
      needs.forEach(s => neededSearches.add(s));
    }
  }

  console.log(`Smart search: firing ${neededSearches.size} searches (${[...neededSearches].join(', ')}) for ${selectedTopics?.length || 'all'} topics`);

  // Only fire needed searches — skip the rest entirely
  const searches: Record<string, Promise<string>> = {};
  if (neededSearches.has('visa')) searches.visa = webSearch(`${natLabel} visa requirements ${destFull} 2026 entry rules passport laws`);
  if (neededSearches.has('safety')) searches.safety = webSearch(`${destFull} travel safety 2026 areas to avoid tourist warnings crime`);
  if (neededSearches.has('transport')) searches.transport = webSearch(`${destFull} airport to city center transport options cost metro taxi 2026`);
  if (neededSearches.has('scams')) searches.scams = webSearch(`${destFull} common tourist scams fraud dangers to avoid 2026`);
  if (neededSearches.has('connectivity')) searches.connectivity = webSearch(`${destFull} eSIM mobile data coverage wifi tourist SIM card cost 2026 apps`);
  if (neededSearches.has('culture')) searches.culture = webSearch(`${destFull} local customs etiquette tipping culture food prices daily budget 2026`);

  const results = await Promise.allSettled(Object.values(searches));
  const keys = Object.keys(searches);
  const resolved: Record<string, string> = {};
  results.forEach((r, i) => { resolved[keys[i]] = r.status === 'fulfilled' ? r.value : ''; });

  return {
    visa: resolved.visa || '',
    safety: resolved.safety || '',
    transport: resolved.transport || '',
    scams: resolved.scams || '',
    connectivity: resolved.connectivity || '',
    culture: resolved.culture || '',
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

// ─── Flight Search Fallback (SerpAPI Google Flights) ────

async function fetchFlightPreviewSerpAPI(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  adults: number,
  currency: string,
): Promise<FlightPreview | null> {
  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) { console.log('SerpAPI flights: SERPAPI_KEY not set'); return null; }

  try {
    const originCode = resolveIATA(origin);
    const destCode = resolveIATA(destination);
    console.log(`SerpAPI Flights fallback: ${originCode} → ${destCode}`);

    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: originCode,
      arrival_id: destCode,
      outbound_date: startDate,
      return_date: endDate,
      currency: currency,
      hl: 'en',
      api_key: apiKey,
      type: '1', // round trip
      adults: String(adults || 1),
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) { console.error('SerpAPI Flights failed:', res.status); return null; }

    const data = await res.json();
    if (data.error) { console.error('SerpAPI Flights error:', data.error); return null; }

    const bestFlights = data.best_flights || [];
    const otherFlights = data.other_flights || [];
    const allFlights = [...bestFlights, ...otherFlights];
    if (allFlights.length === 0) return null;

    console.log(`SerpAPI Flights: ${allFlights.length} results`);

    const parsed = allFlights.map((group: any) => {
      const segments = group.flights || [];
      const first = segments[0];
      const price = group.price || 0;
      const airline = first?.airline || first?.extensions?.[0] || 'Unknown';
      const stops = Math.max(0, segments.length - 1);
      const totalMin = group.total_duration || segments.reduce((s: number, seg: any) => s + (seg.duration || 0), 0);
      const hours = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      const duration = `${hours}h ${mins}m`;
      return { price, airline, stops, duration };
    }).filter((f: any) => f.price > 0);

    if (parsed.length === 0) return null;

    const sorted = [...parsed].sort((a: any, b: any) => a.price - b.price);
    const byDuration = [...parsed].sort((a: any, b: any) => {
      const durA = parseInt(a.duration) || 9999;
      const durB = parseInt(b.duration) || 9999;
      return durA - durB;
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
    console.error('SerpAPI Flights fallback error:', e);
    return null;
  }
}

// ─── Hotel Search Fallback (SerpAPI Google Hotels) ──────

async function fetchHotelTiersSerpAPI(
  destination: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  currency: string,
): Promise<HotelTiers | null> {
  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) { console.log('SerpAPI hotels: SERPAPI_KEY not set'); return null; }

  try {
    console.log(`SerpAPI Hotels fallback: ${destination}`);

    const params = new URLSearchParams({
      engine: 'google_hotels',
      q: `Hotels in ${destination}`,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: String(adults || 1),
      currency: currency,
      hl: 'en',
      gl: 'us',
      api_key: apiKey,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) { console.error('SerpAPI Hotels failed:', res.status); return null; }

    const data = await res.json();
    if (data.error) { console.error('SerpAPI Hotels error:', data.error); return null; }

    const properties = data.properties || [];
    if (properties.length === 0) return null;

    console.log(`SerpAPI Hotels: ${properties.length} properties`);

    const nights = Math.max(1, daysBetween(checkIn, checkOut));
    const parsed = properties.map((h: any) => {
      const perNight = h.rate_per_night?.extracted_lowest || 0;
      const rating = h.overall_rating || 0;
      return { perNight, rating, name: h.name || '' };
    }).filter((h: any) => h.perNight > 0 && h.perNight < 5000);

    if (parsed.length === 0) return null;

    parsed.sort((a: any, b: any) => a.perNight - b.perNight);
    const third = Math.ceil(parsed.length / 3);
    const budgetSlice = parsed.slice(0, third);
    const midSlice = parsed.slice(third, third * 2);
    const luxSlice = parsed.slice(third * 2);

    const avgPrice = (arr: any[]) => {
      if (arr.length === 0) return null;
      return Math.round(arr.reduce((s: number, h: any) => s + h.perNight, 0) / arr.length);
    };

    return {
      budget: avgPrice(budgetSlice) ? { avgPrice: avgPrice(budgetSlice)!, stars: 3, count: budgetSlice.length } : null,
      midRange: avgPrice(midSlice) ? { avgPrice: avgPrice(midSlice)!, stars: 4, count: midSlice.length } : null,
      luxury: avgPrice(luxSlice) ? { avgPrice: avgPrice(luxSlice)!, stars: 5, count: luxSlice.length } : null,
      currency,
    };
  } catch (e) {
    console.error('SerpAPI Hotels fallback error:', e);
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

// ─── AI Destination Intelligence (Gemini 3 Flash → Claude Haiku 4.5 fallback) ────

// 24 rich section templates — only the ones the user selected get included in the prompt
const SECTION_TEMPLATES: Record<string, (dest: string, nat: string, month: string) => string> = {
  customs: (d, n, m) => `{ "id": "customs", "icon": "people", "title": "Local Customs & Etiquette", "items": [
    { "label": "Greeting", "detail": "Write 4-6 sentences: How do locals in ${d} greet each other and visitors? Describe the specific greeting style (handshake, bow, kiss on cheek, namaste, etc.), whether it differs by gender, age, or formality level, and what tourists should do when meeting someone for the first time. Include any common mistakes foreigners make." },
    { "label": "Dress Expectations", "detail": "Write 4-6 sentences: What should tourists wear day-to-day in ${d}? Cover what's acceptable at religious sites (specific requirements like covered shoulders, knees, head coverings), at local markets, at upscale restaurants, and in general on the street. Mention if there are areas where casual Western clothing draws unwanted attention, and what locals typically wear." },
    { "label": "Photo Rules", "detail": "Write 4-6 sentences: Explain the photography culture in ${d}. Can you photograph locals without asking? What about government buildings, military areas, markets, and religious sites? Describe the ask-first norms, whether people expect payment for photos, and any legal restrictions on photography that tourists should know about." },
    { "label": "Haggling", "detail": "Write 4-6 sentences: Describe the haggling culture in ${d}. Is bargaining expected at markets, street vendors, or taxis? What's a good starting offer as a percentage of the asking price? Explain where haggling is appropriate vs. where prices are fixed (shops, malls, restaurants). Include tips on how to haggle politely and when to walk away." },
    { "label": "Queue & Personal Space", "detail": "Write 4-6 sentences: Describe the queuing and personal space culture in ${d}. Do people form orderly lines or is it more of a crowd? How close do people stand to each other? What are the noise expectations in public spaces, restaurants, and transit? Mention any cultural norms around pushing, cutting in line, or asserting yourself in crowds." },
    { "label": "Gift Giving", "detail": "Write 4-6 sentences: If a tourist is invited to a local home in ${d}, what should they bring as a gift? Describe appropriate gift options, how to present them (one hand or two, wrapped or unwrapped), and any taboo gifts to absolutely avoid (e.g., certain flowers, colors, numbers). Mention if there are gift-giving customs for other situations like meeting business contacts." }
  ] }`,
  social_norms: (d, n, m) => `{ "id": "social_norms", "icon": "nightlife", "title": "Nightlife & Social Norms", "items": [
    { "label": "Alcohol Laws", "detail": "Write 4-6 sentences: What is the legal drinking age in ${d}? Are there dry areas or zones where alcohol is banned? Describe public drinking laws — can you walk with a beer on the street? Are there specific days or times when alcohol sales are restricted? Mention any religious or cultural factors that affect alcohol availability." },
    { "label": "Nightlife Zones", "detail": "Write 4-6 sentences: Name the 2-3 best nightlife areas in ${d} with their specific vibes (trendy bars, dance clubs, live music, rooftop lounges). Describe what each area is known for, the typical crowd, price range for drinks, and what time things get going. Mention if there's a dress code culture at clubs or if it's casual." },
    { "label": "PDA Rules", "detail": "Write 4-6 sentences: Describe the social norms around public displays of affection in ${d}. Is hand-holding, kissing, or hugging in public accepted? Are there legal consequences for PDA? How do locals typically behave with partners in public, and how does this differ between tourist areas and more conservative neighborhoods?" },
    { "label": "LGBTQ+ Safety", "detail": "Write 4-6 sentences: What is the legal status of LGBTQ+ rights in ${d}? Describe the practical safety level for LGBTQ+ travelers — is it safe to be openly out? Are there known safe venues, bars, or neighborhoods? Mention any specific precautions LGBTQ+ travelers should take, and how accepting the general population is." },
    { "label": "Late Night Safety", "detail": "Write 4-6 sentences: Describe safety after midnight in ${d}. Which areas remain safe and lively late at night, and which should be avoided? What's the best way to get home — are ride-hail apps reliable at 2-3 AM? Do official taxis run all night? Mention any specific late-night risks and how to stay safe." }
  ] }`,
  dos_donts: (d, n, m) => `{ "id": "dos_donts", "icon": "document", "title": "Do's & Don'ts", "items": [
    { "label": "Do", "detail": "Write 4-6 sentences: List and explain 4-5 specific things tourists SHOULD do in ${d}. For each one, explain WHY it matters culturally. Examples might include removing shoes indoors, standing on the correct side of escalators, greeting shopkeepers, or specific polite gestures. Be hyper-specific to ${d}, not generic travel advice." },
    { "label": "Don't", "detail": "Write 4-6 sentences: List and explain 4-5 specific things tourists should NEVER do in ${d}. For each one, explain the cultural or legal reason behind it and what could happen if you break the rule. Examples might include touching someone's head, pointing feet at sacred objects, blowing your nose at the table, or disrespecting the monarchy/leaders." },
    { "label": "At the Table", "detail": "Write 4-6 sentences: Describe dining etiquette in ${d} in detail. Cover which utensils to use (fork, chopsticks, hands?), whether slurping is acceptable, whether you should finish all food on your plate or leave some, who typically pays the bill, and how to signal you're done eating. Include any unique local dining customs." },
    { "label": "In Public Transit", "detail": "Write 4-6 sentences: Explain the unwritten rules of public transit in ${d}. Cover priority seating etiquette, whether eating or drinking is allowed, phone call norms (silent car?), playing music on speakers, giving up seats for elderly/pregnant, and any other local transit behaviors that tourists should follow to avoid annoying locals." }
  ] }`,
  sacred_sites: (d, n, m) => `{ "id": "sacred_sites", "icon": "people", "title": "Religion & Sacred Sites", "items": [
    { "label": "Dress Code", "detail": "Write 4-6 sentences: Describe the exact dress code requirements at religious and sacred sites in ${d}. Cover whether shoulders and knees must be covered, if head coverings are required (for men, women, or both), whether shoes must be removed, and if sarongs or coverings are available to borrow or rent at the entrance. Mention if different sites have different rules." },
    { "label": "Behavior", "detail": "Write 4-6 sentences: Explain the expected behavior at sacred sites in ${d}. Cover silence rules, whether photography is allowed inside (with or without flash), the correct walking direction if any, whether you can touch statues or relics, and how to show respect. Mention if there are separate areas for men and women, and any rituals tourists might be invited to participate in." },
    { "label": "Donations", "detail": "Write 4-6 sentences: Describe the donation and entrance fee culture at religious sites in ${d}. Are donations expected or optional? How much is typical? Is there a formal entrance fee? Explain how to give respectfully (which hand, where to place money, donation boxes). Mention if monks or priests accept direct donations and the protocol for that." },
    { "label": "Key Sites", "detail": "Write 4-6 sentences: Name 2-3 of the most important religious or sacred sites in ${d} that tourists should visit. For each one, describe what makes it significant, what religion or tradition it belongs to, the best time to visit to avoid crowds, and one practical visitor tip (e.g., arrive early, bring a scarf, visit during a ceremony)." }
  ] }`,
  arrival: (d, n, m) => `{ "id": "arrival", "icon": "car", "title": "Airport Arrival Guide", "items": [
    { "label": "Immigration", "detail": "Write 4-6 sentences: Describe the immigration process at the main airport in ${d}. What's the typical wait time? Are there e-gates or automated passport control? What forms or cards need to be filled out before arrival? Mention tips to speed through (which lines are faster, pre-registration options). Note if there's a separate line for visa-on-arrival." },
    { "label": "SIM at Airport", "detail": "Write 4-6 sentences: Describe the SIM card and eSIM options available at the airport in ${d}. Name the specific provider kiosks located after arrivals, their tourist data plan prices, how much data you get, and which provider has the best coverage. Mention if eSIM is supported and whether it's cheaper to buy at the airport or in the city." },
    { "label": "Cheapest to City", "detail": "Write 4-6 sentences: Describe the cheapest way to get from the airport to the city center in ${d}. Name the specific train, bus, or shuttle service, the exact cost, how long it takes, where to catch it, and how often it runs. Mention if you need exact change, a specific card, or can pay contactless. Note the operating hours." },
    { "label": "Taxi/Rideshare", "detail": "Write 4-6 sentences: Compare official taxis vs ride-hail apps (Uber, Bolt, Grab, or local app) at the airport in ${d}. What's the typical fare to the city center for each? Where is the official taxi stand? Is there a flat rate or metered fare? Mention if you need to pre-book or can just walk up, and which option is generally safer and more reliable." },
    { "label": "Taxi Scams", "detail": "Write 4-6 sentences: Describe the most common airport taxi scams in ${d} and exactly how to avoid them. Cover rigged meters, fake taxis, scenic route overcharging, and any airport-specific tricks. Explain what a legitimate taxi looks like (color, markings, license) and what to do if you suspect you're being scammed." },
    { "label": "Pro Tip", "detail": "Write 4-6 sentences: Share one or two insider hacks specifically for arriving at the airport in ${d}. This could be about a faster exit route, a lounge with free access, the best currency exchange booth, which terminal has better facilities, or a little-known transport option. Make it genuinely useful, not generic advice." }
  ] }`,
  transit: (d, n, m) => `{ "id": "transit", "icon": "car", "title": "Public Transit Quick Start", "items": [
    { "label": "Main System", "detail": "Write 4-6 sentences: Describe the main public transit system in ${d}. Does the city have a metro, bus network, tram, BRT, or combination? How extensive is the coverage — can you get most places by transit? Rate the overall quality (clean, reliable, crowded?). Mention if it's tourist-friendly with English signage and announcements." },
    { "label": "How to Pay", "detail": "Write 4-6 sentences: Explain exactly how to pay for public transit in ${d}. Is it contactless (tap credit card), reloadable transit card, cash, or tokens? Describe how to buy a ticket or card for the first time. Mention day passes, weekly passes, or tourist cards that offer unlimited rides. Note if different transit types require different payment methods." },
    { "label": "Must-Have App", "detail": "Write 4-6 sentences: Name the single best app for navigating transit in ${d}. Is it Google Maps, Citymapper, a local transit app, or something else? Explain why this specific app is the best choice (real-time arrivals, offline maps, route planning). Mention a backup option and whether the app works offline for when you don't have data." },
    { "label": "Operating Hours", "detail": "Write 4-6 sentences: Describe when public transit runs in ${d}. What time does the first and last service operate? How frequent are trains/buses during peak vs off-peak hours? Mention if there's reduced weekend or holiday service. Explain what to do if you're stranded after the last train (night buses, taxis, ride apps)." },
    { "label": "Other Options", "detail": "Write 4-6 sentences: Describe alternative transport options in ${d} beyond the main transit system. Cover tuk-tuks, bike sharing programs, electric scooter rentals, water taxis, ferries, or any unique local transport. For each one, mention approximate costs, how to access them, and whether they're practical for tourists or more of a novelty." }
  ] }`,
  neighborhoods: (d, n, m) => `{ "id": "neighborhoods", "icon": "map", "title": "Neighborhood Guide", "items": [
    { "label": "[Name 1]", "detail": "Write 4-6 sentences: Describe this neighborhood's vibe, what it's like to walk around, the safety level day and night, and why it's best for first-timers or families. Mention the average hotel price per night, the types of restaurants and shops nearby, and how well-connected it is to transit and major attractions." },
    { "label": "[Name 2]", "detail": "Write 4-6 sentences: Describe this neighborhood's vibe, the nightlife and social scene, safety considerations, and why it appeals to young travelers and nightlife lovers. Include the average hotel price per night, the kind of bars and restaurants you'll find, and what the area feels like at different times of day." },
    { "label": "[Name 3]", "detail": "Write 4-6 sentences: Describe this neighborhood's authentic local character, the budget-friendly accommodation options, safety level, and what makes it a great choice for travelers seeking a genuine experience. Mention the average hotel or hostel price, local street food options, and whether English is widely spoken in this area." },
    { "label": "[Name 4]", "detail": "Write 4-6 sentences: Describe this upscale or quieter neighborhood, its luxury accommodation options, safety, and the type of traveler it suits best. Mention the average hotel price per night, fine dining options, spas or wellness facilities, and how peaceful or exclusive the area feels compared to more touristy zones." },
    { "label": "Avoid Staying In", "detail": "Write 4-6 sentences: Name a specific area in ${d} that tourists should avoid staying in and explain exactly why. Describe the safety concerns, what the area is like at night, and whether it's simply inconvenient or genuinely dangerous. Mention if it's okay to visit during the day but not to book a hotel there, and suggest the nearest better alternative." }
  ] }`,
  hours: (d, n, m) => `{ "id": "hours", "icon": "clock", "title": "Hours & Local Rhythm", "items": [
    { "label": "Store Hours", "detail": "Write 4-6 sentences: Describe the typical opening and closing hours for shops and malls in ${d}. What time do small shops open and close? What about larger shopping malls and supermarkets? Are there 24-hour convenience stores? Mention if Sunday hours differ significantly and whether there's a weekly market day with different hours." },
    { "label": "Restaurant Hours", "detail": "Write 4-6 sentences: Explain restaurant timing culture in ${d}. When does lunch service typically run, and when does dinner start? Is there a gap between lunch and dinner when kitchens close? What are the options for late-night food after 10-11 PM? Mention if restaurants have last-order times and whether reservations are needed for dinner." },
    { "label": "Siesta/Closure", "detail": "Write 4-6 sentences: Describe any afternoon closure or siesta culture in ${d}. Do shops and businesses close for a few hours in the afternoon? What days have reduced hours (Fridays, Saturdays, Sundays depending on culture)? Are there specific days when most things are closed? Explain how this affects tourist planning and what to do during these quiet hours." },
    { "label": "Holidays", "detail": "Write 4-6 sentences: List any public holidays or observances during ${m} that affect business hours and tourist activities in ${d}. Describe which things close (banks, government offices, shops, attractions) and what remains open. Mention if holidays cause unusually large crowds, higher prices, or special events that tourists might enjoy or need to plan around." }
  ] }`,
  safety: (d, n, m) => `{ "id": "safety", "icon": "shield", "title": "Safety & Emergency", "items": [
    { "label": "Safety Rating", "detail": "Write 4-6 sentences: Give an honest overall safety assessment of ${d} for tourists. Compare it to other destinations in the region. Describe the types of crime tourists are most likely to encounter (petty theft, scams, violent crime?). Mention if the safety level varies significantly between neighborhoods and whether it has improved or worsened recently." },
    { "label": "Day vs Night", "detail": "Write 4-6 sentences: Name specific areas in ${d} that are safe during the day but should be avoided at night. Explain what changes after dark in these areas (fewer people, poor lighting, increased crime). Contrast with areas that remain safe and lively at all hours. Give practical advice on what time to head back to safer zones." },
    { "label": "Emergency Number", "detail": "Write 3-4 sentences: Provide the local emergency number for ${d} (NOT 911 unless US/Canada). Mention if there's a dedicated tourist police number or office and where it's located. Note whether operators speak English and if there's an app or text-based emergency service available." },
    { "label": "Hospital", "detail": "Write 4-6 sentences: Name the best international or tourist-friendly hospital in ${d} with its approximate address or neighborhood. Describe the quality of care, whether English-speaking doctors are available, and if they accept international insurance directly. Mention approximate costs for a basic ER visit without insurance and whether there's a 24-hour pharmacy nearby." },
    { "label": "Insurance", "detail": "Write 4-6 sentences: Explain why travel insurance matters specifically for ${d}. Recommend a minimum coverage amount in USD and what it should cover (medical evacuation, hospitalization, theft). Mention if healthcare is expensive or affordable for foreigners, and whether your home country's insurance typically covers you in ${d}. Note any specific risks that make insurance especially important here." }
  ] }`,
  scams_crime: (d, n, m) => `{ "id": "scams_crime", "icon": "warning", "title": "Scams & Crime Patterns", "items": [
    { "label": "[Real Scam 1]", "detail": "Write 4-6 sentences: Describe a real, common scam that targets tourists in ${d}. Explain step by step how the scam works, where it typically happens, and how the scammer approaches you. Then explain exactly how to recognize it early and what to do to avoid falling for it. Use a real scam name, not a placeholder." },
    { "label": "[Real Scam 2]", "detail": "Write 4-6 sentences: Describe another real, common scam in ${d}. Walk through the setup, the trick, and the moment they try to take your money. Explain where this scam is most common (specific areas, markets, tourist attractions) and the best way to shut it down politely. Make it specific to ${d}, not a generic travel scam." },
    { "label": "[Real Scam 3]", "detail": "Write 4-6 sentences: Describe a third real scam or fraudulent practice tourists encounter in ${d}. This could be a taxi scam, restaurant overcharge scheme, fake ticket seller, or currency exchange trick. Explain how it works in detail and provide a concrete strategy for avoiding it. Mention if there are online reviews or forums that warn about this specific scam." },
    { "label": "Pickpocket Zones", "detail": "Write 4-6 sentences: Name the specific streets, metro lines, markets, and tourist attractions in ${d} where pickpockets are most active. Describe their common techniques (distraction teams, crowding, bump-and-grab). Explain which items are most targeted (phones, wallets, passports) and the best way to carry valuables in these areas. Mention if there are specific times of day when pickpocketing is worse." },
    { "label": "Prevention Tips", "detail": "Write 4-6 sentences: Provide 4-5 concrete, actionable prevention tips specifically for staying safe from crime and scams in ${d}. Go beyond generic advice — mention specific bag types, apps to use, how to handle ATMs, and what to do if you're targeted. Include a tip about what to do if something does happen (police report, embassy contact)." }
  ] }`,
  solo_female: (d, n, m) => `{ "id": "solo_female", "icon": "people", "title": "Solo Female Traveler Notes", "items": [
    { "label": "Overall Feel", "detail": "Write 4-6 sentences: Describe the overall experience of solo female travelers in ${d} based on common reports. Do women generally feel safe walking alone during the day? How about at night? Compare the experience to other destinations in the region. Mention if the level of attention or harassment varies by area, and whether locals are generally helpful if a woman needs assistance." },
    { "label": "Catcalling", "detail": "Write 4-6 sentences: Describe how common catcalling and street harassment is in ${d}. In which areas or situations is it most likely to happen? How do locals typically react when they witness it? Explain what the best response is (ignore, confront, seek help) and whether it's generally verbal only or can escalate. Mention if it varies by time of day." },
    { "label": "Clothing Comfort", "detail": "Write 4-6 sentences: Describe what women can comfortably wear in ${d} without attracting unwanted attention. Cover different contexts: walking around the city, visiting religious sites, going out at night, and at the beach. Mention if certain clothing choices draw significantly more attention in specific neighborhoods and what local women typically wear for reference." },
    { "label": "Safe Transport", "detail": "Write 4-6 sentences: Describe the safest transport options for women traveling alone at night in ${d}. Are there women-only train cars or taxi services? Which ride-hail apps have safety features (share trip, SOS button)? Explain whether it's safe to take regular taxis alone at night and any precautions to take (photo of license plate, share location with friend)." },
    { "label": "Recommended Areas", "detail": "Write 4-6 sentences: Name 2-3 specific neighborhoods in ${d} that are best for solo female travelers to stay in. For each one, explain why it's a good choice (well-lit, busy at night, close to transit, other travelers around, helpful locals). Mention the type of accommodation available and whether the area has a community of other solo travelers." }
  ] }`,
  health: (d, n, m) => `{ "id": "health", "icon": "shield", "title": "Health & Medication", "items": [
    { "label": "Vaccines", "detail": "Write 4-6 sentences: List the recommended vaccinations for traveling to ${d}, distinguishing between strongly recommended and optional. Mention any that are mandatory for entry (e.g., yellow fever). Describe how far in advance you should get vaccinated, whether you can get them at the airport or on arrival, and if there are any current disease outbreaks to be aware of in the region." },
    { "label": "Water Safety", "detail": "Write 4-6 sentences: Explain the tap water situation in ${d} in detail. Is it safe to drink from the tap? What about ice in drinks at restaurants and bars — is it made from purified water? Can you safely brush your teeth with tap water? Describe how locals handle water (do they drink tap or buy bottled?), the cost of bottled water, and whether filtered water stations are available." },
    { "label": "Restricted Meds", "detail": "Write 4-6 sentences: List specific common medications that are banned, restricted, or require special documentation in ${d}. Cover ADHD medications (Adderall, Ritalin), codeine-based painkillers, sleeping pills, and any other commonly carried medications that could cause problems at customs. Explain what documentation to bring (prescription letter, doctor's note) and the consequences of bringing restricted medications without proper paperwork." },
    { "label": "Street Food", "detail": "Write 4-6 sentences: Describe the street food safety situation in ${d}. Is it generally safe for tourists with Western stomachs? What should you look for as signs of safe vendors (crowds, high turnover, cooked-to-order)? What specific foods or preparations should be avoided? Mention the concept of building up tolerance gradually and whether taking probiotics before the trip is recommended." },
    { "label": "Pharmacy Access", "detail": "Write 4-6 sentences: Describe how pharmacies work in ${d}. Can you buy common medications (painkillers, antihistamines, antibiotics) over the counter without a prescription? Name a major pharmacy chain if one exists. Describe the typical hours, whether pharmacists speak English, and if there are 24-hour pharmacies. Mention approximate costs compared to Western countries." }
  ] }`,
  payments: (d, n, m) => `{ "id": "payments", "icon": "wallet", "title": "Payments & Banking", "items": [
    { "label": "Card vs Cash", "detail": "Write 4-6 sentences: Describe the payment landscape in ${d}. Is it primarily a cash-based or card-based society? What percentage of restaurants, shops, and transit accept credit or debit cards? Are there situations where cash is absolutely necessary (street vendors, small shops, taxis, tips)? Mention the local currency name and whether USD or EUR are accepted anywhere." },
    { "label": "ATM Tips", "detail": "Write 4-6 sentences: Explain how to use ATMs wisely in ${d}. Name the best bank ATM brands that charge low or no fees. Warn about predatory ATMs (like Euronet) and their high markup. Describe typical withdrawal fees, daily limits, and whether it's better to withdraw large amounts less frequently. Mention if ATMs are widely available or concentrated in certain areas." },
    { "label": "Apple/Google Pay", "detail": "Write 4-6 sentences: Describe the mobile payment situation in ${d}. Is Apple Pay or Google Pay widely accepted at shops, restaurants, and transit? Are there local mobile payment systems that tourists can use (WeChat Pay, Paytm, M-Pesa, etc.)? Explain where contactless payments work reliably and where you'll still need a physical card or cash." },
    { "label": "Tipping", "detail": "Write 4-6 sentences: Describe the complete tipping culture in ${d}. What's the expected tip percentage at restaurants? Is service charge already included on the bill? Cover tipping norms for taxis, hotel bellhops, tour guides, spa services, and food delivery. Mention if tipping is considered offensive or unusual, and whether tips should be in cash or can be added to card payments." },
    { "label": "DCC Warning", "detail": "Write 4-6 sentences: Explain the Dynamic Currency Conversion (DCC) trap that tourists encounter in ${d}. When a card terminal or ATM asks if you want to pay in your home currency, always choose the local currency instead. Explain why the DCC rate is typically 3-7% worse than your bank's rate. Mention specific situations where this comes up (hotels, restaurants, ATMs) and how to politely decline." }
  ] }`,
  price_feel: (d, n, m) => `{ "id": "price_feel", "icon": "wallet", "title": "Prices & Budget", "items": [
    { "label": "Coffee", "detail": "Write 3-4 sentences: What does a typical coffee or latte cost in ${d}? Compare a local cafe price vs an international chain like Starbucks if available. Mention if there's a strong local coffee culture and whether it's cheaper to drink at the counter vs sitting down." },
    { "label": "Cheap Meal", "detail": "Write 3-4 sentences: What does a budget meal cost in ${d}? Cover street food prices, fast casual restaurants, and local eateries. Name a specific popular cheap meal and its approximate cost in USD." },
    { "label": "Mid-Range Meal", "detail": "Write 3-4 sentences: What does a mid-range sit-down meal for two people with drinks cost in ${d}? Describe the type of restaurant this covers and what you'd typically get. Mention if wine or beer significantly increases the bill." },
    { "label": "Metro Ticket", "detail": "Write 3-4 sentences: What does a single transit ride cost in ${d}? Mention the day pass price if available. Compare the value to taxis for short trips." },
    { "label": "Taxi from Airport", "detail": "Write 3-4 sentences: What's the typical taxi or ride-hail fare from the main airport to the city center in ${d}? Mention if there's a flat rate or metered fare and how long the trip takes in normal traffic." },
    { "label": "Overall Feel", "detail": "Write 4-6 sentences: Give an overall sense of how expensive ${d} feels compared to a major US city. Is it a budget-friendly destination, mid-range, or expensive? Describe what a comfortable daily budget looks like in USD for a mid-range traveler (hotel, meals, transport, activities). Mention if there are ways to stretch your budget significantly or if certain things are surprisingly expensive." }
  ] }`,
  saving_tips: (d, n, m) => `{ "id": "saving_tips", "icon": "wallet", "title": "Money-Saving Tips", "items": [
    { "label": "Free Activities", "detail": "Write 4-6 sentences: Name the 3-4 best completely free things to do in ${d} with their specific names and locations. For each one, describe what makes it worth visiting, the best time to go, and any tips to enhance the experience. Include a mix of outdoor, cultural, and unique local experiences that most tourists don't know about." },
    { "label": "Tourist Trap", "detail": "Write 4-6 sentences: Name a specific overpriced tourist trap in ${d} that most visitors waste money on. Explain why it's not worth the cost and what the much better (and often cheaper) local alternative is. Describe where to find the alternative and how much you'll save. This should be genuinely useful insider knowledge." },
    { "label": "Discount Pass", "detail": "Write 4-6 sentences: Describe any city pass, tourist card, or discount program available in ${d}. Name it specifically, describe what it includes (attractions, transit, skip-the-line access), how much it costs, and how many days it covers. Calculate whether it's actually worth buying based on a typical tourist itinerary. If no pass exists, suggest the best way to buy attraction tickets at a discount." },
    { "label": "Pro Tip", "detail": "Write 4-6 sentences: Share 2-3 specific, actionable money-saving hacks for ${d} that most tourists don't know about. These should be genuinely useful tips like specific apps for discounts, happy hour culture, free walking tours, cheaper neighborhoods for dining, or timing tricks for cheaper flights within the country. Make each tip specific enough to act on immediately." }
  ] }`,
  visa_entry: (d, n, m) => `{ "id": "visa_entry", "icon": "document", "title": "Visa & Entry", "items": [
    { "label": "Visa Required?", "detail": "Write 4-6 sentences: Provide a specific answer for ${n} citizens traveling to ${d}. State clearly whether a visa is required, if visa-free entry is available and for how many days, or if a visa-on-arrival or e-visa is an option. Mention the cost of the visa if applicable, processing time, and the official website to apply. Note if the rules have changed recently." },
    { "label": "Passport", "detail": "Write 4-6 sentences: Describe the passport requirements for entering ${d}. What's the minimum validity required (e.g., 6 months beyond your stay)? How many blank pages are needed? Mention if there are any passport restrictions (e.g., Israeli stamps, certain nationalities). Explain what happens if your passport doesn't meet the requirements — will you be denied boarding or turned away at immigration?" },
    { "label": "On Arrival", "detail": "Write 4-6 sentences: Walk through the immigration process step by step when you land in ${d}. Are there arrival cards or health forms to fill out (paper or digital)? Is there a visa-on-arrival fee and what currency/payment method is accepted? Are there biometrics (fingerprints, photo)? Describe the typical wait time and whether there are faster lines for certain passport holders." },
    { "label": "Current Rules", "detail": "Write 4-6 sentences: Describe any current special entry rules, recent policy changes, or temporary requirements for entering ${d}. This might include COVID-related rules still in effect, new visa policies, electronic travel authorizations, health insurance requirements, or proof of onward travel. Mention the most reliable source to check for updates before traveling." }
  ] }`,
  laws: (d, n, m) => `{ "id": "laws", "icon": "document", "title": "Laws & Regulations", "items": [
    { "label": "ID to Carry", "detail": "Write 4-6 sentences: Explain the ID requirements for tourists in ${d}. Must you carry your actual passport at all times, or is a photocopy or digital photo acceptable? What happens if police ask for ID and you don't have it? Describe whether there are random ID checks and in what situations you're most likely to be asked. Recommend the safest approach (carry original vs. leave in hotel safe)." },
    { "label": "Photography", "detail": "Write 4-6 sentences: Describe the photography laws in ${d}. Is it illegal to photograph government buildings, military installations, airports, or police? Are drones legal for tourists and do you need a permit? Mention any specific locations where photography is strictly prohibited and the potential consequences (confiscation, fines, detention). Note if there are cultural sensitivities around photographing certain people or places." },
    { "label": "Surprising Laws", "detail": "Write 4-6 sentences: List 3-4 specific laws in ${d} that tourists commonly break without realizing it. For each one, explain what the law is, why it exists, and what the penalty could be. Examples might include vaping restrictions, jaywalking fines, chewing gum bans, public intoxication laws, or littering penalties. Focus on laws that are actually enforced against tourists, not just obscure rules on the books." },
    { "label": "Police", "detail": "Write 4-6 sentences: Describe the local police culture in ${d} and how they typically interact with tourists. Are police generally helpful, indifferent, or sometimes problematic? What should you do if stopped by police (show ID, remain calm, language tips)? Mention if police corruption or bribe-seeking is an issue and how to handle it. Note if there's a tourist police force and how to contact them." }
  ] }`,
  food: (d, n, m) => `{ "id": "food", "icon": "food", "title": "Food & Dining Guide", "items": [
    { "label": "Must Try", "detail": "Write 4-6 sentences: Name the top 3-4 iconic local dishes you absolutely must try in ${d} with their real local names. For each dish, describe what it is, what it tastes like, what ingredients it contains, and where to find the best version of it (name a specific restaurant, market, or neighborhood). Mention approximate prices and if any dishes are seasonal or available only at certain times." },
    { "label": "Street Food", "detail": "Write 4-6 sentences: Name the best specific street food market or food street in ${d} with its real name and neighborhood. Describe what you'll find there, the standout dishes to order, and the typical price range. Mention the best time to visit (morning, lunch, evening), whether it's tourist-friendly, and any vendor stalls that locals specifically recommend. Include practical tips like whether you can pay by card or need cash." },
    { "label": "Fine Dining", "detail": "Write 4-6 sentences: Recommend a notable restaurant or food neighborhood in ${d} for a special dining experience. Name a specific restaurant with its cuisine style, price range for a meal, and whether reservations are needed. Describe the neighborhood's food scene and what makes it worth visiting. Mention if there are any Michelin-starred or locally famous restaurants that offer a unique experience." },
    { "label": "Budget Meal", "detail": "Write 4-6 sentences: Describe budget dining options in ${d} with specific prices in USD. Cover street food costs, local canteens or cafeterias, and fast casual restaurants. Name a specific type of local budget meal and where to find it. Explain the difference in cost between eating where locals eat vs. tourist-area restaurants, and mention if lunch specials or set menus offer better value." },
    { "label": "Food Safety", "detail": "Write 4-6 sentences: Provide a comprehensive food safety guide for ${d}. Is tap water safe to drink? Is ice in drinks safe at restaurants? Is raw food (salads, sushi, fruit) generally safe? Describe specific things to watch out for and signs of a safe vs. risky food vendor. Mention if travelers commonly get stomach issues and what preventive measures to take (probiotics, avoiding certain foods initially)." }
  ] }`,
  food_culture: (d, n, m) => `{ "id": "food_culture", "icon": "food", "title": "Food Etiquette", "items": [
    { "label": "How to Eat", "detail": "Write 4-6 sentences: Describe the local eating customs in ${d}. What utensils do people use — fork and knife, chopsticks, or hands? If eating with hands, which hand is correct? Is bread used as a utensil? Describe any specific eating techniques or customs that tourists should learn to avoid embarrassing themselves, and whether it's acceptable to ask for Western utensils if you're struggling." },
    { "label": "Ordering", "detail": "Write 4-6 sentences: Explain how ordering food works in ${d}. Do restaurants have menus in English? Is it common to order at a counter, point at dishes, use a tablet or app, or wait for table service? Describe the typical restaurant flow from entering to paying. Mention if it's normal to share dishes family-style, whether you order all courses at once, and how to get the server's attention politely." },
    { "label": "Reservations", "detail": "Write 4-6 sentences: Describe the reservation culture in ${d}. Do popular restaurants require reservations and how far in advance should you book? What's the best way to make a reservation (phone, app, walk-in)? Mention if there are specific days or times that are hardest to get a table, and whether showing up without a reservation is generally fine at mid-range restaurants. Name a booking app if one is popular locally." },
    { "label": "Water & Ice", "detail": "Write 4-6 sentences: Explain the water and ice situation at restaurants in ${d} in detail. Is tap water served for free at restaurants, or must you order bottled water? Is the ice in drinks made from purified water at most establishments? Describe the typical cost of bottled water at a restaurant vs. a shop. Mention if there's a culture of ordering drinks with meals or if water is the default." }
  ] }`,
  weather: (d, n, m) => `{ "id": "weather", "icon": "sun", "title": "Weather & Packing", "items": [
    { "label": "Temperature", "detail": "Write 4-6 sentences: Describe the expected temperature range in ${d} during ${m} in both °F and °C. Cover daytime highs, nighttime lows, and how the temperature feels with humidity or wind chill factored in. Compare it to a familiar US city's weather if helpful. Mention if there's significant variation between different parts of the city or region." },
    { "label": "Conditions", "detail": "Write 4-6 sentences: Describe the specific weather conditions in ${d} during ${m}. Is it the rainy season, dry season, or transitional? How often does it rain and for how long (all-day drizzle vs. short afternoon downpours)? Describe the humidity level and UV index. Mention any extreme weather risks (typhoons, heat waves, sandstorms) that could affect travel plans." },
    { "label": "What to Pack", "detail": "Write 4-6 sentences: Provide a specific packing list of 6-8 items essential for ${d} in ${m}. Go beyond obvious items — mention specific types of clothing (breathable fabrics, layers, waterproof jacket), footwear (walking shoes, sandals for temples), and accessories (umbrella, sun hat, sunscreen SPF level). Explain why each item matters for the specific weather and activities. Mention anything you can skip to save luggage space." },
    { "label": "Best Time of Day", "detail": "Write 4-6 sentences: Describe the optimal daily schedule for ${d} during ${m} based on weather patterns. When is the best time for outdoor sightseeing, and when should you retreat to indoor activities? If there are afternoon rain showers, describe the typical timing so tourists can plan around them. Mention sunrise and sunset times, and whether early morning or golden hour offers the best experience for popular attractions." }
  ] }`,
  crowds: (d, n, m) => `{ "id": "crowds", "icon": "clock", "title": "Crowds & Reservations", "items": [
    { "label": "Book Ahead", "detail": "Write 4-6 sentences: Name specific attractions, tours, and restaurants in ${d} that absolutely MUST be booked in advance. For each one, mention how far ahead to book (days, weeks, months) and the best platform to book on. Explain what happens if you don't book ahead — will you be turned away, face long lines, or pay more? Mention if ${m} is particularly busy." },
    { "label": "Walk-In OK", "detail": "Write 4-6 sentences: Name popular spots in ${d} where you can comfortably show up without reservations. Describe the best times to arrive to avoid the worst crowds. Mention if there are skip-the-line options available on-site and whether buying tickets at the door costs more than online. Include both attractions and restaurants that are walk-in friendly." },
    { "label": "Busy vs Quiet", "detail": "Write 4-6 sentences: Describe the crowd patterns at major attractions in ${d}. What are the best days and times to visit popular sites to avoid long lines? Are weekdays significantly less crowded than weekends? Mention if there are early morning or late afternoon windows that offer a much better experience. Provide specific timing advice for the top 2-3 attractions." },
    { "label": "Sold Out Risk", "detail": "Write 4-6 sentences: Describe what's likely to be sold out or fully booked in ${d} during ${m}. Cover popular tours, events, shows, restaurants, and accommodation. Explain if ${m} is peak season, shoulder season, or off-season and how that affects availability. Mention any annual events, festivals, or conferences happening during this time that could make things unusually crowded or expensive." }
  ] }`,
  history: (d, n, m) => `{ "id": "history", "icon": "clock", "title": "History & Festivals", "items": [
    { "label": "History in 60s", "detail": "Write 5-7 sentences: Tell the story of ${d} through 4-5 key historical moments that explain why it is the way it is today. Cover founding, colonial or imperial history, independence or revolution, modern transformation, and current identity. Write it as an engaging narrative, not a dry timeline. Help the tourist understand the context of what they'll see and experience." },
    { "label": "Festivals", "detail": "Write 4-6 sentences: Describe any major festivals, events, or cultural celebrations happening in or near ${d} during ${m}. For each one, explain what it celebrates, what tourists can see or participate in, where the main events take place, and whether tickets or reservations are needed. If nothing major happens in ${m}, mention the closest upcoming festival and regular weekly events or markets that tourists can enjoy." },
    { "label": "Impact", "detail": "Write 4-6 sentences: Explain how any current festivals, events, or seasonal factors during ${m} affect the tourist experience in ${d}. Describe impacts on hotel prices, restaurant availability, attraction closures, public transport changes, and crowd levels. Mention if certain areas become pedestrian-only, if there are road closures, or if businesses extend or reduce their hours during these events." }
  ] }`,
  language: (d, n, m) => `{ "id": "language", "icon": "language", "title": "Language Cheat Sheet", "items": [
    { "label": "Hello", "detail": "Write 3-4 sentences: Provide the local word for hello in ${d} with a phonetic pronunciation guide. Mention if there are formal vs. informal versions and when to use each. Include any accompanying gestures (slight bow, hand on chest) that go with the greeting." },
    { "label": "Thank You", "detail": "Write 3-4 sentences: Provide the local word for thank you with phonetic pronunciation. Mention if there's a casual vs. very polite version. Explain if locals appreciate tourists making the effort and any common response you might hear back." },
    { "label": "Excuse Me / Sorry", "detail": "Write 3-4 sentences: Provide the local phrases for 'excuse me' (to get attention or pass by) and 'sorry' (to apologize) with phonetic pronunciations. Explain when to use each one and if there are different levels of formality. Mention if a physical gesture (hand wave, slight bow) accompanies the phrase." },
    { "label": "Yes / No", "detail": "Write 3-4 sentences: Provide the local words for yes and no with pronunciation. Mention if head gestures differ from Western norms (some cultures nod for no). Note any polite alternatives to saying a direct 'no' if the culture tends to avoid it." },
    { "label": "Help!", "detail": "Write 3-4 sentences: Provide the word or phrase for calling for help in an emergency with phonetic pronunciation. Include how to say 'I need a doctor', 'call the police', or 'I'm lost'. Mention if English is understood in emergencies and what phrase is most likely to get immediate attention from bystanders." },
    { "label": "English Level", "detail": "Write 4-6 sentences: Describe how widely English is spoken in ${d}. Is it common among younger people, hotel staff, taxi drivers, or shop owners? Are there areas where English is more or less understood? Mention the best translation app to use if there's a language barrier, whether Google Translate works well for the local language, and if restaurant menus and street signs typically have English translations." }
  ] }`,
  apps: (d, n, m) => `{ "id": "apps", "icon": "wifi", "title": "Essential Apps & SIM", "items": [
    { "label": "Ride-Hail", "detail": "Write 4-6 sentences: Name the best ride-hail app in ${d} — is it Uber, Bolt, Grab, or a local app? Explain which one is most reliable, cheapest, and safest. Mention if multiple apps operate and which is best for different situations (airport pickup vs. city rides). Describe typical wait times and whether the app works with international credit cards or requires local payment methods." },
    { "label": "Transit App", "detail": "Write 4-6 sentences: Name the best navigation and transit app for getting around ${d}. Is Google Maps reliable here, or is there a better local alternative (Citymapper, Moovit, Yandex Maps, etc.)? Explain what the app covers (bus, metro, walking, cycling routes) and whether it provides real-time arrival information. Mention if you should download offline maps before arriving and which app is best for that." },
    { "label": "Food Delivery", "detail": "Write 4-6 sentences: Name the food delivery apps that actually work well in ${d}. Describe which one has the best restaurant selection, fastest delivery, and is easiest for tourists to set up (language, payment). Mention if the app requires a local phone number or if international cards are accepted. Note any grocery delivery options that could be useful for longer stays." },
    { "label": "Super App", "detail": "Write 4-6 sentences: Describe any local super-app or essential payment app used in ${d} (WeChat, Paytm, GCash, M-Pesa, Revolut, etc.). Explain what it does, whether tourists can realistically set it up and use it, and how much of daily life depends on it. If no super-app exists, mention the most useful local app that tourists should download. Explain if not having the app puts you at a disadvantage." },
    { "label": "eSIM/SIM", "detail": "Write 4-6 sentences: Describe the best way to get mobile data in ${d}. Name the top 1-2 providers for tourist SIM cards or eSIMs, their prices for a typical tourist data plan (how much data, how many days), and where to buy them (airport, convenience stores, provider shops). Mention if eSIM is supported and recommend a specific provider like Airalo, Holafly, or a local one. Compare airport prices vs. city prices." },
    { "label": "Offline Survival", "detail": "Write 4-6 sentences: Describe how well you can survive in ${d} without data or internet. Can you navigate offline (which app to use for offline maps)? Does Google Translate work offline for the local language — and have you downloaded the language pack? Can you make contactless payments offline? Mention any specific areas with free WiFi and whether hotel/restaurant WiFi is generally reliable and fast." }
  ] }`,
};

function buildBriefPrompt(
  destination: string, startDate: string, endDate: string,
  travelers: { adults: number; children: number; infants: number },
  nights: number, costEstimate: CostEstimate,
  liveContext: { visa: string; safety: string; transport: string; scams: string; connectivity: string; culture: string },
  nationality: string,
  selectedTopics?: string[],
  preferences?: SnapshotRequest['userPreferences'],
): string {
  const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
  const totalTravelers = travelers.adults + travelers.children + travelers.infants;
  const prefsSection = preferences ? `\nTraveler preferences:\n- Budget: ${preferences.budgetAmount ? `$${preferences.budgetAmount}` : 'Not specified'}\n- Interests: ${preferences.interests?.join(', ') || 'General sightseeing'}\n- Travel style: ${preferences.travelStyle || 'Not specified'}` : '';

  // Only include live data that is non-empty
  const liveLines: string[] = [];
  if (liveContext.visa) liveLines.push(`VISA & ENTRY (for ${nationality || 'US citizen'}):\n${liveContext.visa}`);
  if (liveContext.safety) liveLines.push(`SAFETY & WARNINGS:\n${liveContext.safety}`);
  if (liveContext.transport) liveLines.push(`LOCAL TRANSPORT:\n${liveContext.transport}`);
  if (liveContext.scams) liveLines.push(`COMMON SCAMS:\n${liveContext.scams}`);
  if (liveContext.connectivity) liveLines.push(`CONNECTIVITY:\n${liveContext.connectivity}`);
  if (liveContext.culture) liveLines.push(`CULTURE, FOOD & PRICES:\n${liveContext.culture}`);

  const liveData = liveLines.length > 0
    ? `\n══ LIVE WEB DATA (use for accuracy) ══\n${liveLines.join('\n\n')}\n══════════════════════════════════════`
    : '';

  // Build section templates for only the selected topics
  const topics = selectedTopics && selectedTopics.length > 0
    ? selectedTopics
    : ['safety', 'visa_entry', 'food', 'arrival', 'price_feel', 'customs'];

  const sectionJsonBlocks = topics
    .map(t => SECTION_TEMPLATES[t]?.(destination, nationality || 'US citizen', month))
    .filter(Boolean);

  return `You are Guidera, the world's smartest AI travel assistant. Generate a destination intelligence brief as JSON.

Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights, ${month})
Travelers: ${totalTravelers} (${travelers.adults} adults${travelers.children ? `, ${travelers.children} children` : ''}${travelers.infants ? `, ${travelers.infants} infants` : ''})
Nationality: ${nationality || 'US citizen'}
Cost estimate: $${costEstimate.low} - $${costEstimate.high}
${prefsSection}
${liveData}

INSTRUCTIONS:
- Use live web data above for accuracy. Supplement with your knowledge where missing.
- Be HYPER-SPECIFIC: real names, real prices in USD, real places.
- Replace ALL bracketed placeholders with REAL names specific to ${destination}.
- CRITICAL: Each "detail" field MUST be a full paragraph of 4-6 sentences (except where 3-4 is specified). Do NOT write short 1-2 sentence responses. The user needs substantial, educational content they can actually learn from — not bullet points or fragments.

Return ONLY valid JSON (no markdown, no code fences):
{
  "overview": "A warm, specific 3-4 sentence summary highlighting what makes ${destination} special in ${month}. Include a practical tip or fun fact.",
  "sections": [
    ${sectionJsonBlocks.join(',\n    ')}
  ]
}

RULES:
1. Replace [Name 1], [Real Scam 1], etc. with REAL names specific to ${destination}.
2. Use REAL prices in USD.
3. Every detail must be actionable — a tourist should use it immediately.
4. For visa: specific to ${nationality || 'US'} citizens.
5. Each detail MUST be a full paragraph (4-6 sentences minimum). Short 1-2 sentence answers are NOT acceptable. Write rich, informative content.
6. Remove the "Write X sentences:" instruction prefix from your output — just write the content directly.
7. Return ONLY the JSON object.`;
}

async function tryGeminiBrief(prompt: string): Promise<string | null> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) { console.log('AI brief: GOOGLE_AI_API_KEY not set, skipping Gemini'); return null; }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16384 },
      }),
    },
  );

  if (!res.ok) {
    console.error('Gemini 3 Flash API error:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
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
      max_tokens: 16384,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('Claude Haiku API error:', res.status, await res.text().catch(() => ''));
    return null;
  }
  const data = await res.json();
  return data.content?.[0]?.text || null;
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
  liveContext: { visa: string; safety: string; transport: string; scams: string; connectivity: string; culture: string },
  nationality: string,
  selectedTopics?: string[],
  preferences?: SnapshotRequest['userPreferences'],
): Promise<DestinationIntelligence | null> {
  const prompt = buildBriefPrompt(destination, startDate, endDate, travelers, nights, costEstimate, liveContext, nationality, selectedTopics, preferences);
  console.log(`AI brief prompt: ${selectedTopics?.length || 6} topics, ~${prompt.length} chars`);

  // Try Gemini 3 Flash first (fastest, native JSON mode), then Claude Haiku 4.5 as fallback
  let raw = await tryGeminiBrief(prompt);
  if (raw) {
    const parsed = parseAIBriefJSON(raw);
    if (parsed) { console.log('AI brief: generated via Gemini 3 Flash'); return parsed; }
    console.error('AI brief: Gemini returned invalid JSON, trying Claude');
  }

  raw = await tryAnthropicBrief(prompt);
  if (raw) {
    const parsed = parseAIBriefJSON(raw);
    if (parsed) { console.log('AI brief: generated via Claude Haiku 4.5'); return parsed; }
    console.error('AI brief: Claude returned invalid JSON');
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
  // Flights (round trip per person) — fallback $300-$600 pp if no API data
  const flightLow = flights
    ? Math.round((flights.cheapest?.price || flights.avgPrice) * totalTravelers)
    : Math.round(300 * totalTravelers);
  const flightHigh = flights
    ? Math.round(flights.avgPrice * 1.3 * totalTravelers)
    : Math.round(600 * totalTravelers);

  // Hotels (per night × nights) — fallback $40-$100/night if no API data
  const capPerNight = (price: number) => Math.min(price, 2000);
  const hotelLow = hotels?.budget
    ? capPerNight(hotels.budget.avgPrice) * nights
    : Math.round(40 * nights);
  const hotelHigh = hotels?.midRange
    ? capPerNight(hotels.midRange.avgPrice) * nights
    : (hotelLow > 0 && hotels?.budget ? Math.round(hotelLow * 1.5) : Math.round(100 * nights));

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

// ─── Rate Limiting (in-memory, per-isolate) ─────────────

const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30_000; // 30 seconds between identical requests
const MAX_CONCURRENT = 5;
let activeConcurrent = 0;

function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, ts] of recentRequests) {
    if (now - ts > RATE_LIMIT_WINDOW_MS) recentRequests.delete(key);
  }
}

// ─── Main Handler ───────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SnapshotRequest = await req.json();
    const { destination, country, startDate, endDate, travelers, originCity, originAirport, currency = 'USD', nationality, selectedTopics, userPreferences } = body;

    if (!destination || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: destination, startDate, endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Rate limit: prevent duplicate rapid requests for the same destination + dates
    cleanupRateLimit();
    const rateKey = `${destination.toLowerCase().trim()}|${startDate}|${endDate}`;
    const lastRequest = recentRequests.get(rateKey);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (Date.now() - lastRequest)) / 1000);
      console.log(`Rate limited: ${rateKey} (${waitSec}s remaining)`);
      return new Response(
        JSON.stringify({ error: `Please wait ${waitSec} seconds before searching this destination again.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Concurrency guard
    if (activeConcurrent >= MAX_CONCURRENT) {
      console.log(`Concurrency limit reached: ${activeConcurrent}/${MAX_CONCURRENT}`);
      return new Response(
        JSON.stringify({ error: 'Server is busy. Please try again in a few moments.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    activeConcurrent++;
    recentRequests.set(rateKey, Date.now());

    try {
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
      fetchLiveContext(destination, country || '', nationality || 'US citizen', month, selectedTopics),
    ]);

    let flights = flightResult.status === 'fulfilled' ? flightResult.value : null;
    let hotels = hotelResult.status === 'fulfilled' ? hotelResult.value : null;
    const experiences = expResult.status === 'fulfilled' ? expResult.value : [];
    const events = eventResult.status === 'fulfilled' ? eventResult.value : [];
    const liveContext = liveCtxResult.status === 'fulfilled' ? liveCtxResult.value : { visa: '', safety: '', transport: '', scams: '', connectivity: '', culture: '' };

    // ─── SerpAPI Fallbacks (Google Flights & Hotels) ───
    const serpFallbacks: Promise<void>[] = [];
    if (!flights && resolvedOrigin) {
      console.log('Amadeus flights returned null — trying SerpAPI Google Flights fallback');
      serpFallbacks.push(
        fetchFlightPreviewSerpAPI(resolvedOrigin, destination, startDate, endDate, travelers?.adults || 1, currency)
          .then(result => { if (result) { flights = result; console.log('SerpAPI Flights fallback succeeded'); } })
      );
    }
    if (!hotels) {
      console.log('Amadeus hotels returned null — trying SerpAPI Google Hotels fallback');
      serpFallbacks.push(
        fetchHotelTiersSerpAPI(destination, startDate, endDate, travelers?.adults || 1, currency)
          .then(result => { if (result) { hotels = result; console.log('SerpAPI Hotels fallback succeeded'); } })
      );
    }
    if (serpFallbacks.length > 0) {
      await Promise.allSettled(serpFallbacks);
    }

    console.log(`Live context fetched: visa=${liveContext.visa.length}b, safety=${liveContext.safety.length}b, transport=${liveContext.transport.length}b, scams=${liveContext.scams.length}b, connectivity=${liveContext.connectivity.length}b, culture=${liveContext.culture.length}b`);
    console.log(`Selected topics: ${selectedTopics?.join(', ') || 'default set'}`);

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
        nights, costEstimate, liveContext, nationality || 'US citizen', selectedTopics, userPreferences,
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
    } finally {
      activeConcurrent--;
    }
  } catch (e) {
    console.error('Trip snapshot error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to generate trip snapshot', details: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
