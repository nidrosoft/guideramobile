/**
 * SEARCH & COMPARISON ENGINE - Edge Function
 * 
 * Unified search endpoint that orchestrates multi-provider searches,
 * handles session management, and provides filtering/sorting capabilities.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SearchRequest {
  action: 'search' | 'continue' | 'autocomplete' | 'trending';
  mode?: 'unified' | 'flight' | 'hotel' | 'car' | 'experience' | 'package';
  destination?: {
    query?: string;
    code?: string;
    type?: 'city' | 'airport' | 'nearby';
  };
  origin?: {
    query?: string;
    code?: string;
  };
  dates?: {
    startDate: string;
    endDate?: string;
    flexible?: boolean;
  };
  travelers?: {
    adults: number;
    children: number;
    infants: number;
  };
  rooms?: number;
  cabinClass?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sessionToken?: string;
  category?: string;
  query?: string;
  limit?: number;
  userId?: string;
}

// Initialize Supabase client
function getSupabaseClient(authHeader?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

// Generate session token
function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Resolve destination from query or code
async function resolveDestination(
  supabase: ReturnType<typeof createClient>,
  input: SearchRequest['destination']
) {
  if (!input) return null;

  const searchValue = input.code || input.query || '';
  
  const { data } = await supabase
    .from('destination_intelligence')
    .select('*')
    .or(`destination_code.ilike.${searchValue},destination_name.ilike.%${searchValue}%`)
    .limit(1)
    .single();

  if (data) {
    return {
      code: data.destination_code,
      name: data.destination_name,
      fullName: `${data.destination_name}, ${data.country_code}`,
      type: data.destination_type,
      countryCode: data.country_code,
      intelligence: {
        tagline: data.tagline,
        emoji: data.emoji,
        bestMonths: data.best_months,
        budgetLevel: data.budget_level,
        goodFor: data.good_for,
      },
    };
  }

  return {
    code: input.code || searchValue.substring(0, 3).toUpperCase(),
    name: searchValue,
    fullName: searchValue,
    type: input.type || 'city',
    countryCode: 'XX',
  };
}

// Call Provider Manager for search
async function callProviderManager(
  category: string,
  params: Record<string, unknown>
) {
  const providerManagerUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/provider-manager';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const response = await fetch(providerManagerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'search',
        category,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Provider Manager error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Provider Manager call failed for ${category}:`, error);
    return { success: false, error: { message: (error as Error).message } };
  }
}

// Build search params for each category
function buildFlightParams(request: SearchRequest) {
  return {
    tripType: request.dates?.endDate ? 'round_trip' : 'one_way',
    segments: [
      {
        origin: request.origin?.code || '',
        destination: request.destination?.code || '',
        departureDate: request.dates?.startDate || '',
      },
      ...(request.dates?.endDate ? [{
        origin: request.destination?.code || '',
        destination: request.origin?.code || '',
        departureDate: request.dates.endDate,
      }] : []),
    ],
    travelers: request.travelers || { adults: 1, children: 0, infants: 0 },
    cabinClass: request.cabinClass || 'economy',
  };
}

function buildHotelParams(request: SearchRequest, destination: { name: string }) {
  return {
    destination: {
      type: 'city',
      value: destination.name,
    },
    checkInDate: request.dates?.startDate || '',
    checkOutDate: request.dates?.endDate || request.dates?.startDate || '',
    rooms: request.rooms || 1,
    guests: request.travelers || { adults: 1, children: 0 },
  };
}

function buildExperienceParams(request: SearchRequest, destination: { name: string }) {
  return {
    destination: {
      type: 'city',
      value: destination.name,
    },
    dates: {
      startDate: request.dates?.startDate || '',
      endDate: request.dates?.endDate,
    },
    participants: request.travelers || { adults: 1, children: 0 },
  };
}

// Deduplicate results
function deduplicateResults(results: unknown[], category: string): unknown[] {
  const seen = new Map<string, unknown>();
  
  for (const result of results) {
    const r = result as Record<string, unknown>;
    const price = r.price as { amount: number } | undefined;
    const key = `${category}-${r.id || ''}-${price?.amount || 0}`;
    
    if (!seen.has(key)) {
      seen.set(key, result);
    }
  }
  
  return Array.from(seen.values());
}

// Rank results
function rankResults(results: unknown[]): unknown[] {
  return results.map((result, index) => {
    const r = result as Record<string, unknown>;
    const price = r.price as { amount: number } | undefined;
    
    // Simple ranking based on price
    const priceScore = price ? Math.max(0, 100 - (price.amount / 100)) : 50;
    
    return {
      ...r,
      ranking: {
        priceScore,
        totalScore: priceScore,
        rank: index + 1,
      },
    };
  }).sort((a, b) => {
    const aRank = (a as Record<string, unknown>).ranking as { totalScore: number };
    const bRank = (b as Record<string, unknown>).ranking as { totalScore: number };
    return bRank.totalScore - aRank.totalScore;
  });
}

// Handle unified search
async function handleSearch(
  supabase: ReturnType<typeof createClient>,
  request: SearchRequest
) {
  const startTime = Date.now();
  const sessionToken = generateSessionToken();

  // Resolve destination
  const destination = await resolveDestination(supabase, request.destination);
  if (!destination) {
    return { success: false, error: { code: 'INVALID_DESTINATION', message: 'Destination is required' } };
  }

  // Determine categories to search
  const mode = request.mode || 'unified';
  const hasOrigin = !!request.origin?.code;
  
  let categories: string[] = [];
  switch (mode) {
    case 'unified':
      categories = hasOrigin ? ['flights', 'hotels', 'experiences'] : ['hotels', 'experiences'];
      break;
    case 'flight':
      categories = ['flights'];
      break;
    case 'hotel':
      categories = ['hotels'];
      break;
    case 'experience':
      categories = ['experiences'];
      break;
    default:
      categories = ['flights', 'hotels'];
  }

  // Execute parallel searches
  const searchPromises = categories.map(async (category) => {
    let params: Record<string, unknown>;
    
    switch (category) {
      case 'flights':
        params = buildFlightParams(request);
        break;
      case 'hotels':
        params = buildHotelParams(request, destination);
        break;
      case 'experiences':
        params = buildExperienceParams(request, destination);
        break;
      default:
        params = {};
    }

    const result = await callProviderManager(category, params);
    return { category, result };
  });

  const searchResults = await Promise.all(searchPromises);

  // Process results
  const results: Record<string, unknown> = {};
  const providers: { code: string; responseTime: number; resultCount: number }[] = [];

  for (const { category, result } of searchResults) {
    if (result.success && result.data?.results) {
      const deduped = deduplicateResults(result.data.results, category);
      const ranked = rankResults(deduped);

      results[category] = {
        items: ranked,
        totalCount: ranked.length,
        pageInfo: {
          page: 1,
          pageSize: 50,
          totalPages: Math.ceil(ranked.length / 50),
          hasMore: ranked.length > 50,
        },
        providers: result.data.providers || [],
      };

      if (result.data.providers) {
        providers.push(...result.data.providers);
      }
    } else {
      results[category] = {
        items: [],
        totalCount: 0,
        pageInfo: { page: 1, pageSize: 50, totalPages: 0, hasMore: false },
        providers: [],
        error: result.error?.message,
      };
    }
  }

  // Save session
  await supabase.from('search_sessions').insert({
    session_token: sessionToken,
    user_id: request.userId,
    search_mode: mode,
    search_params: request,
    destination_city: destination.name,
    destination_code: destination.code,
    origin_code: request.origin?.code,
    start_date: request.dates?.startDate,
    end_date: request.dates?.endDate,
    adults: request.travelers?.adults || 1,
    children: request.travelers?.children || 0,
    infants: request.travelers?.infants || 0,
    rooms: request.rooms || 1,
    total_results: Object.values(results).reduce((sum: number, r) => {
      const cat = r as { totalCount: number };
      return sum + (cat.totalCount || 0);
    }, 0),
    results_by_category: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, (v as { totalCount: number }).totalCount])
    ),
    status: 'completed',
    search_started_at: new Date(startTime).toISOString(),
    search_completed_at: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  });

  return {
    success: true,
    data: {
      sessionToken,
      results,
      query: {
        destination,
        origin: request.origin,
        dates: request.dates,
        travelers: request.travelers,
      },
      filters: {},
      sorts: {},
      suggestions: [],
      destinationInfo: destination.intelligence,
      meta: {
        searchDuration: Date.now() - startTime,
        providers,
        cacheHits: 0,
        resultSources: { cached: 0, live: providers.length },
      },
    },
  };
}

// Handle autocomplete
async function handleAutocomplete(
  supabase: ReturnType<typeof createClient>,
  query: string
) {
  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  const searchQuery = query.toLowerCase().trim();

  const { data: destinations } = await supabase
    .from('destination_intelligence')
    .select('*')
    .or(`destination_name.ilike.%${searchQuery}%,destination_code.ilike.${searchQuery}%`)
    .order('popularity_score', { ascending: false })
    .limit(8);

  const results = (destinations || []).map((dest: Record<string, unknown>) => ({
    type: dest.destination_type,
    code: dest.destination_code,
    name: dest.destination_name,
    fullName: `${dest.destination_name}, ${dest.country_code}`,
    emoji: dest.emoji,
    subtitle: dest.tagline,
  }));

  return { success: true, data: results };
}

// Handle trending destinations
async function handleTrending(
  supabase: ReturnType<typeof createClient>,
  limit: number = 10
) {
  const { data } = await supabase
    .from('destination_intelligence')
    .select('*')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  const results = (data || []).map((dest: Record<string, unknown>) => ({
    code: dest.destination_code,
    name: dest.destination_name,
    type: dest.destination_type,
    countryCode: dest.country_code,
    tagline: dest.tagline,
    emoji: dest.emoji,
    heroImageUrl: dest.hero_image_url,
    bestMonths: dest.best_months,
    budgetLevel: dest.budget_level,
    goodFor: dest.good_for,
    popularityScore: dest.popularity_score,
  }));

  return { success: true, data: results };
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader || undefined);
    
    const request: SearchRequest = await req.json();
    
    let response;
    
    switch (request.action) {
      case 'search':
        response = await handleSearch(supabase, request);
        break;
      case 'autocomplete':
        response = await handleAutocomplete(supabase, request.query || '');
        break;
      case 'trending':
        response = await handleTrending(supabase, request.limit);
        break;
      default:
        response = { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Search function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message || 'An internal error occurred',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
