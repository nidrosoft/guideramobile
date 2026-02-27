/**
 * FLIGHT SEARCH EDGE FUNCTION
 * 
 * Integrates with Amadeus and Kiwi.com APIs for flight search.
 * Supports one-way, round-trip, and multi-city searches.
 * 
 * Environment Variables Required:
 * - AMADEUS_CLIENT_ID
 * - AMADEUS_CLIENT_SECRET
 * - KIWI_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface FlightSearchRequest {
  provider: 'amadeus' | 'kiwi' | 'auto';
  tripType: 'one_way' | 'round_trip' | 'multi_city';
  segments: FlightSegment[];
  travelers?: {
    adults: number;
    children?: number;
    infants?: number;
  };
  passengers?: {
    adults: number;
    children?: number;
    infants?: number;
  };
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  directOnly?: boolean;
  maxStops?: number;
  maxPrice?: number;
  currency?: string;
  limit?: number;
}

interface FlightSegment {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
}

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

// Cache for Amadeus token
let amadeusTokenCache: AmadeusToken | null = null;

// Get Amadeus access token
async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
  const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Amadeus credentials not configured');
  }

  // Check cache
  if (amadeusTokenCache && amadeusTokenCache.expires_at > Date.now()) {
    return amadeusTokenCache.access_token;
  }

  // Get new token - use test.api.amadeus.com for test credentials
  const baseUrl = Deno.env.get('AMADEUS_ENV') === 'production' 
    ? 'https://api.amadeus.com' 
    : 'https://test.api.amadeus.com';
  
  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json();
  
  amadeusTokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
  };

  return data.access_token;
}

// Helper to get travelers from request (supports both 'travelers' and 'passengers')
function getTravelers(request: FlightSearchRequest) {
  const t = request.travelers || request.passengers || { adults: 1 };
  return {
    adults: t.adults || 1,
    children: t.children || 0,
    infants: t.infants || 0,
  };
}

// Search flights with Amadeus
async function searchAmadeus(request: FlightSearchRequest): Promise<unknown[]> {
  const token = await getAmadeusToken();
  const travelers = getTravelers(request);
  
  const segment = request.segments[0];
  const params = new URLSearchParams({
    originLocationCode: segment.origin,
    destinationLocationCode: segment.destination,
    departureDate: segment.departureDate,
    adults: String(travelers.adults),
    currencyCode: request.currency || 'USD',
    max: String(request.limit || 50),
  });

  if (travelers.children > 0) {
    params.append('children', String(travelers.children));
  }
  if (travelers.infants > 0) {
    params.append('infants', String(travelers.infants));
  }
  if (request.tripType === 'round_trip' && request.segments[1]?.departureDate) {
    params.append('returnDate', request.segments[1].departureDate);
  }
  if (request.cabinClass !== 'economy') {
    const cabinMap: Record<string, string> = {
      premium_economy: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    };
    params.append('travelClass', cabinMap[request.cabinClass] || 'ECONOMY');
  }
  if (request.directOnly) {
    params.append('nonStop', 'true');
  }
  if (request.maxPrice) {
    params.append('maxPrice', String(request.maxPrice));
  }

  const baseUrl = Deno.env.get('AMADEUS_ENV') === 'production' 
    ? 'https://api.amadeus.com' 
    : 'https://test.api.amadeus.com';
    
  const response = await fetch(
    `${baseUrl}/v2/shopping/flight-offers?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Amadeus search error:', error);
    throw new Error(`Amadeus search failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeAmadeusResults(data.data || []);
}

// Normalize Amadeus results to common format
function normalizeAmadeusResults(offers: unknown[]): unknown[] {
  return offers.map((offer: unknown) => {
    const o = offer as Record<string, unknown>;
    const itineraries = o.itineraries as Array<{
      duration: string;
      segments: Array<{
        departure: { iataCode: string; at: string; terminal?: string };
        arrival: { iataCode: string; at: string; terminal?: string };
        carrierCode: string;
        number: string;
        aircraft: { code: string };
        duration: string;
        numberOfStops: number;
      }>;
    }>;
    const price = o.price as { total: string; currency: string; grandTotal: string };
    const travelerPricings = o.travelerPricings as Array<{
      fareDetailsBySegment: Array<{ cabin: string; class: string }>;
    }>;

    const outbound = itineraries[0];
    const inbound = itineraries[1];

    return {
      id: o.id,
      provider: { code: 'amadeus', name: 'Amadeus' },
      type: 'flight',
      tripType: inbound ? 'round_trip' : 'one_way',
      price: {
        amount: parseFloat(price.grandTotal),
        currency: price.currency,
        formatted: `${price.currency} ${price.grandTotal}`,
        breakdown: {
          base: parseFloat(price.total),
          taxes: parseFloat(price.grandTotal) - parseFloat(price.total),
        },
      },
      outbound: {
        departure: {
          airport: outbound.segments[0].departure.iataCode,
          time: outbound.segments[0].departure.at,
          terminal: outbound.segments[0].departure.terminal,
        },
        arrival: {
          airport: outbound.segments[outbound.segments.length - 1].arrival.iataCode,
          time: outbound.segments[outbound.segments.length - 1].arrival.at,
          terminal: outbound.segments[outbound.segments.length - 1].arrival.terminal,
        },
        duration: parseDuration(outbound.duration),
        stops: outbound.segments.length - 1,
        segments: outbound.segments.map(seg => ({
          carrier: seg.carrierCode,
          flightNumber: `${seg.carrierCode}${seg.number}`,
          aircraft: seg.aircraft.code,
          departure: {
            airport: seg.departure.iataCode,
            time: seg.departure.at,
          },
          arrival: {
            airport: seg.arrival.iataCode,
            time: seg.arrival.at,
          },
          duration: parseDuration(seg.duration),
        })),
      },
      inbound: inbound ? {
        departure: {
          airport: inbound.segments[0].departure.iataCode,
          time: inbound.segments[0].departure.at,
          terminal: inbound.segments[0].departure.terminal,
        },
        arrival: {
          airport: inbound.segments[inbound.segments.length - 1].arrival.iataCode,
          time: inbound.segments[inbound.segments.length - 1].arrival.at,
          terminal: inbound.segments[inbound.segments.length - 1].arrival.terminal,
        },
        duration: parseDuration(inbound.duration),
        stops: inbound.segments.length - 1,
        segments: inbound.segments.map(seg => ({
          carrier: seg.carrierCode,
          flightNumber: `${seg.carrierCode}${seg.number}`,
          aircraft: seg.aircraft.code,
          departure: {
            airport: seg.departure.iataCode,
            time: seg.departure.at,
          },
          arrival: {
            airport: seg.arrival.iataCode,
            time: seg.arrival.at,
          },
          duration: parseDuration(seg.duration),
        })),
      } : null,
      cabin: travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
      bookingClass: travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.class,
      seatsAvailable: (o.numberOfBookableSeats as number) || null,
      validatingCarrier: (o.validatingAirlineCodes as string[])?.[0],
      lastTicketingDate: o.lastTicketingDate,
      raw: o,
    };
  });
}

// Search flights with Kiwi.com (for cheapest options via virtual interlining)
async function searchKiwi(request: FlightSearchRequest): Promise<unknown[]> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY');
  
  if (!apiKey) {
    throw new Error('RapidAPI key not configured for Kiwi');
  }

  const segment = request.segments[0];
  const travelers = getTravelers(request);
  
  // Format date as DD/MM/YYYY for Kiwi API
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  // RapidAPI Kiwi.com uses fly_from, fly_to, date_from format
  const params = new URLSearchParams({
    fly_from: segment.origin,
    fly_to: segment.destination,
    date_from: formatDate(segment.departureDate),
    date_to: formatDate(segment.departureDate),
    adults: String(travelers.adults),
    children: String(travelers.children),
    infants: String(travelers.infants),
    curr: request.currency || 'USD',
    limit: '50',
    sort: 'price',
  });

  // Add return date for round trips
  if (request.tripType === 'round_trip' && request.segments[1]?.departureDate) {
    params.append('return_from', formatDate(request.segments[1].departureDate));
    params.append('return_to', formatDate(request.segments[1].departureDate));
  }

  // Cabin class mapping for Kiwi
  const cabinMap: Record<string, string> = {
    economy: 'M',
    premium_economy: 'W',
    business: 'C',
    first: 'F',
  };
  params.append('selected_cabins', cabinMap[request.cabinClass || 'economy'] || 'M');

  // Determine endpoint based on trip type
  const endpoint = request.tripType === 'round_trip' ? 'round-trip' : 'one-way';

  // Use RapidAPI endpoint for Kiwi.com
  const response = await fetch(
    `https://kiwi-com-cheap-flights.p.rapidapi.com/${endpoint}?${params}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'kiwi-com-cheap-flights.p.rapidapi.com',
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Kiwi search error:', error);
    throw new Error(`Kiwi search failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Kiwi RapidAPI response keys:', Object.keys(data));
  
  // RapidAPI Kiwi returns data in 'itineraries' or 'data' format
  const flights = data.itineraries || data.data || data.results || data.flights || [];
  
  // If no results from API, return empty (fallback will be used)
  if (!Array.isArray(flights) || flights.length === 0) {
    console.log('Kiwi returned no results, using fallback');
    return [];
  }
  
  return normalizeKiwiResults(flights);
}

// Normalize Kiwi RapidAPI results to common format
// RapidAPI Kiwi returns itineraries with sectors/segments structure
function normalizeKiwiResults(flights: unknown[]): unknown[] {
  return flights.map((flight: unknown, index: number) => {
    const f = flight as Record<string, unknown>;
    
    // RapidAPI Kiwi format has different structure
    // Try to extract from various possible formats
    const id = f.id || f.__id || `kiwi-${index}`;
    
    // Price extraction - RapidAPI format
    const priceObj = f.price as Record<string, unknown> | undefined;
    const priceAmount = priceObj?.amount || priceObj?.total || f.price || 0;
    const currency = (priceObj?.currency || f.currency || 'USD') as string;
    
    // Sectors/segments extraction for RapidAPI format
    const sectors = f.sectors || f.sector || [];
    const sectorArray = Array.isArray(sectors) ? sectors : [sectors];
    
    // Legacy format support (direct Kiwi API)
    const route = f.route as Array<{
      flyFrom: string;
      flyTo: string;
      local_departure: string;
      local_arrival: string;
      airline: string;
      flight_no: number;
      return: number;
    }> | undefined;

    // If we have route (legacy format)
    if (route && Array.isArray(route) && route.length > 0) {
      const outboundSegments = route.filter(r => r.return === 0);
      const inboundSegments = route.filter(r => r.return === 1);

      const calculateDuration = (segments: typeof route) => {
        if (segments.length === 0) return 0;
        const start = new Date(segments[0].local_departure).getTime();
        const end = new Date(segments[segments.length - 1].local_arrival).getTime();
        return Math.round((end - start) / 60000);
      };

      return {
        id,
        provider: { code: 'kiwi', name: 'Kiwi.com' },
        type: 'flight',
        tripType: inboundSegments.length > 0 ? 'round_trip' : 'one_way',
        price: {
          amount: priceAmount as number,
          currency,
          formatted: `${currency} ${priceAmount}`,
        },
        outbound: {
          departure: {
            airport: outboundSegments[0]?.flyFrom,
            time: outboundSegments[0]?.local_departure,
          },
          arrival: {
            airport: outboundSegments[outboundSegments.length - 1]?.flyTo,
            time: outboundSegments[outboundSegments.length - 1]?.local_arrival,
          },
          duration: calculateDuration(outboundSegments),
          stops: outboundSegments.length - 1,
          segments: outboundSegments.map(seg => ({
            carrier: seg.airline,
            flightNumber: `${seg.airline}${seg.flight_no}`,
            departure: { airport: seg.flyFrom, time: seg.local_departure },
            arrival: { airport: seg.flyTo, time: seg.local_arrival },
          })),
        },
        inbound: inboundSegments.length > 0 ? {
          departure: {
            airport: inboundSegments[0]?.flyFrom,
            time: inboundSegments[0]?.local_departure,
          },
          arrival: {
            airport: inboundSegments[inboundSegments.length - 1]?.flyTo,
            time: inboundSegments[inboundSegments.length - 1]?.local_arrival,
          },
          duration: calculateDuration(inboundSegments),
          stops: inboundSegments.length - 1,
          segments: inboundSegments.map(seg => ({
            carrier: seg.airline,
            flightNumber: `${seg.airline}${seg.flight_no}`,
            departure: { airport: seg.flyFrom, time: seg.local_departure },
            arrival: { airport: seg.flyTo, time: seg.local_arrival },
          })),
        } : null,
        deepLink: f.deep_link || f.deepLink,
        bookingToken: f.booking_token || f.bookingToken,
        virtualInterlining: f.virtual_interlining || f.virtualInterlining,
        raw: f,
      };
    }

    // RapidAPI format with sectors
    const outboundSector = sectorArray[0] as Record<string, unknown> | undefined;
    const inboundSector = sectorArray[1] as Record<string, unknown> | undefined;
    
    const extractSegmentInfo = (sector: Record<string, unknown> | undefined) => {
      if (!sector) return null;
      const segments = (sector.segments || sector.segment || []) as Array<Record<string, unknown>>;
      const segArray = Array.isArray(segments) ? segments : [segments];
      
      if (segArray.length === 0) return null;
      
      const firstSeg = segArray[0];
      const lastSeg = segArray[segArray.length - 1];
      const dep = (firstSeg.departure || {}) as Record<string, unknown>;
      const arr = (lastSeg.arrival || {}) as Record<string, unknown>;
      const depStation = (dep.station || {}) as Record<string, unknown>;
      const arrStation = (arr.station || {}) as Record<string, unknown>;
      
      return {
        departure: {
          airport: depStation.code || dep.airport || dep.iata || '',
          time: dep.time || dep.datetime || dep.at || '',
        },
        arrival: {
          airport: arrStation.code || arr.airport || arr.iata || '',
          time: arr.time || arr.datetime || arr.at || '',
        },
        duration: sector.duration as number || 0,
        stops: segArray.length - 1,
        segments: segArray.map((seg: Record<string, unknown>) => {
          const segDep = (seg.departure || {}) as Record<string, unknown>;
          const segArr = (seg.arrival || {}) as Record<string, unknown>;
          const carrier = (seg.carrier || {}) as Record<string, unknown>;
          const segDepStation = (segDep.station || {}) as Record<string, unknown>;
          const segArrStation = (segArr.station || {}) as Record<string, unknown>;
          return {
            carrier: carrier.code || seg.airline || seg.marketingCarrier || '',
            flightNumber: seg.flightNumber || `${carrier.code || ''}${seg.number || ''}`,
            departure: {
              airport: segDepStation.code || segDep.airport || '',
              time: segDep.time || segDep.datetime || '',
            },
            arrival: {
              airport: segArrStation.code || segArr.airport || '',
              time: segArr.time || segArr.datetime || '',
            },
          };
        }),
      };
    };

    return {
      id,
      provider: { code: 'kiwi', name: 'Kiwi.com' },
      type: 'flight',
      tripType: inboundSector ? 'round_trip' : 'one_way',
      price: {
        amount: priceAmount as number,
        currency,
        formatted: `${currency} ${priceAmount}`,
      },
      outbound: extractSegmentInfo(outboundSector),
      inbound: extractSegmentInfo(inboundSector),
      deepLink: f.deep_link || f.deepLink || f.shareUrl,
      bookingToken: f.booking_token || f.bookingToken || f.token,
      virtualInterlining: f.virtual_interlining || f.isVirtualInterlining,
      raw: f,
    };
  });
}

// Generate fallback mock flights for testing when APIs don't return data
function generateFallbackFlights(request: FlightSearchRequest): unknown[] {
  const segment = request.segments[0];
  const travelers = getTravelers(request);
  const currency = request.currency || 'USD';
  
  // Airlines with realistic pricing
  const airlines = [
    { code: 'AA', name: 'American Airlines', basePrice: 180 },
    { code: 'UA', name: 'United Airlines', basePrice: 195 },
    { code: 'DL', name: 'Delta Air Lines', basePrice: 210 },
    { code: 'WN', name: 'Southwest Airlines', basePrice: 150 },
    { code: 'B6', name: 'JetBlue Airways', basePrice: 165 },
  ];

  const departureDate = new Date(segment.departureDate);
  
  return airlines.map((airline, index) => {
    const price = airline.basePrice + Math.floor(Math.random() * 100) - 30;
    const totalPrice = price * travelers.adults;
    const departureHour = 6 + index * 3; // Stagger departures
    const flightDuration = 300 + Math.floor(Math.random() * 60); // 5-6 hours
    
    const depTime = new Date(departureDate);
    depTime.setHours(departureHour, Math.floor(Math.random() * 60));
    
    const arrTime = new Date(depTime.getTime() + flightDuration * 60000);
    
    return {
      id: `fallback-${airline.code}-${index}`,
      provider: { code: 'fallback', name: 'Demo Data' },
      type: 'flight',
      tripType: request.tripType || 'one_way',
      price: {
        amount: totalPrice,
        currency,
        formatted: `${currency} ${totalPrice}`,
      },
      outbound: {
        departure: {
          airport: segment.origin,
          time: depTime.toISOString(),
        },
        arrival: {
          airport: segment.destination,
          time: arrTime.toISOString(),
        },
        duration: flightDuration,
        stops: index % 3 === 0 ? 0 : 1,
        segments: [{
          carrier: airline.code,
          carrierName: airline.name,
          flightNumber: `${airline.code}${100 + index * 11}`,
          departure: {
            airport: segment.origin,
            time: depTime.toISOString(),
          },
          arrival: {
            airport: segment.destination,
            time: arrTime.toISOString(),
          },
          duration: flightDuration,
          aircraft: 'Boeing 737-800',
        }],
      },
      inbound: null,
      cabinClass: request.cabinClass || 'economy',
      seatsAvailable: 5 + Math.floor(Math.random() * 10),
      isDemo: true,
    };
  });
}

// Parse ISO 8601 duration to minutes
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const request: FlightSearchRequest = await req.json();
    
    // Validate request
    if (!request.segments || request.segments.length === 0) {
      throw new Error('At least one flight segment is required');
    }

    let results: unknown[] = [];
    const providers: { code: string; responseTime: number; resultCount: number }[] = [];

    // Determine which provider(s) to use
    const provider = request.provider || 'auto';

    if (provider === 'amadeus' || provider === 'auto') {
      try {
        const amadeusStart = Date.now();
        const amadeusResults = await searchAmadeus(request);
        providers.push({
          code: 'amadeus',
          responseTime: Date.now() - amadeusStart,
          resultCount: amadeusResults.length,
        });
        results = results.concat(amadeusResults);
      } catch (error) {
        console.error('Amadeus error:', error);
        if (provider === 'amadeus') throw error;
      }
    }

    if (provider === 'kiwi' || provider === 'auto') {
      try {
        const kiwiStart = Date.now();
        const kiwiResults = await searchKiwi(request);
        providers.push({
          code: 'kiwi',
          responseTime: Date.now() - kiwiStart,
          resultCount: kiwiResults.length,
        });
        results = results.concat(kiwiResults);
      } catch (error) {
        console.error('Kiwi error:', error);
        if (provider === 'kiwi') throw error;
      }
    }

    // If no results from any provider, use fallback mock data for testing
    if (results.length === 0) {
      console.log('No results from APIs, using fallback mock data');
      const fallbackResults = generateFallbackFlights(request);
      providers.push({
        code: 'fallback',
        responseTime: 0,
        resultCount: fallbackResults.length,
      });
      results = fallbackResults;
    }

    // Sort by price
    results.sort((a, b) => {
      const priceA = (a as { price: { amount: number } }).price.amount;
      const priceB = (b as { price: { amount: number } }).price.amount;
      return priceA - priceB;
    });

    // Calculate price range
    const prices = results.map(r => (r as { price: { amount: number } }).price.amount);
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    } : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results,
          totalCount: results.length,
          providers,
          priceRange,
          searchDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Flight search error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'FLIGHT_SEARCH_ERROR',
          message: (error as Error).message || 'Flight search failed',
        },
        searchDuration: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
