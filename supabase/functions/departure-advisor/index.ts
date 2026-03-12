/**
 * DEPARTURE ADVISOR EDGE FUNCTION
 *
 * Calculates the optimal time for a traveler to leave for the airport.
 * Uses Google Maps Directions API for real-time travel estimates,
 * AeroDataBox for flight status, and a built-in TSA/security estimation
 * engine that works with or without external API data.
 *
 * Actions:
 *   calculate    → Full departure advisory calculation
 *   feedback     → Record user feedback on prediction accuracy
 *
 * Required Secrets:
 *   GOOGLE_MAPS_API_KEY   — Google Directions API
 *   AERODATABOX_API_KEY   — Flight status (via RapidAPI)
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — DB access
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TYPES
// ============================================

interface CalculateRequest {
  action: 'calculate';
  tripId: string;
  bookingId?: string;
  flightNumber: string;
  departureAirport: string; // IATA code
  departureTime: string; // ISO 8601
  isInternational: boolean;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  preferences?: {
    tsaPrecheck?: boolean;
    clearMe?: boolean;
    parkingType?: 'self' | 'valet' | 'rideshare' | 'dropoff';
    comfortBuffer?: 'minimal' | 'standard' | 'generous';
  };
}

interface FeedbackRequest {
  action: 'feedback';
  advisoryId: string;
  rating: 'perfect' | 'too_early' | 'too_late' | 'didnt_go';
}

interface DepartureBreakdown {
  driveTime: number;
  trafficBuffer: number;
  parkingAndTransfer: number;
  checkinCutoff: number;
  securityEstimate: number;
  gateWalkTime: number;
  comfortBuffer: number;
  totalMinutes: number;
}

interface TransportOption {
  mode: 'drive' | 'rideshare' | 'transit';
  durationMinutes: number;
  distanceKm: number;
  estimatedCost?: { min: number; max: number; currency: string };
  trafficLevel: 'light' | 'moderate' | 'heavy';
  departBy: string; // ISO time
}

interface RiskLevel {
  category: string;
  level: 'low' | 'moderate' | 'high';
  detail: string;
}

interface AdvisoryResult {
  leaveByTime: string;
  boardingTime: string;
  totalMinutesNeeded: number;
  breakdown: DepartureBreakdown;
  transport: TransportOption[];
  risks: RiskLevel[];
  reasoning: string;
  flightStatus?: {
    status: string;
    delay?: number;
    gate?: string;
    terminal?: string;
  };
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// GOOGLE MAPS DIRECTIONS API
// ============================================

interface DirectionsResult {
  durationSeconds: number;
  durationInTrafficSeconds: number;
  distanceMeters: number;
  trafficLevel: 'light' | 'moderate' | 'heavy';
}

async function getDirections(
  apiKey: string,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' | 'transit' = 'driving',
  departureTime?: Date
): Promise<DirectionsResult | null> {
  try {
    const depTime = departureTime
      ? Math.floor(departureTime.getTime() / 1000)
      : 'now';

    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode,
      departure_time: String(depTime),
      key: apiKey,
    });

    if (mode === 'driving') {
      params.set('traffic_model', 'best_guess');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Google Directions API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes?.length) {
      console.error(`Google Directions: ${data.status}`);
      return null;
    }

    const leg = data.routes[0].legs[0];
    const baseDuration = leg.duration.value; // seconds
    const trafficDuration = leg.duration_in_traffic?.value || baseDuration;
    const distance = leg.distance.value; // meters

    // Determine traffic level
    const trafficRatio = trafficDuration / baseDuration;
    let trafficLevel: 'light' | 'moderate' | 'heavy' = 'light';
    if (trafficRatio > 1.5) trafficLevel = 'heavy';
    else if (trafficRatio > 1.2) trafficLevel = 'moderate';

    return {
      durationSeconds: baseDuration,
      durationInTrafficSeconds: trafficDuration,
      distanceMeters: distance,
      trafficLevel,
    };
  } catch (error) {
    console.error('Google Directions error:', error);
    return null;
  }
}

// ============================================
// AIRPORT COORDINATES LOOKUP
// ============================================

// Common airports with coordinates (fallback when API is unavailable)
const AIRPORT_COORDS: Record<string, { lat: number; lng: number; domestic_security_min: number; intl_security_min: number }> = {
  // US Major
  LAX: { lat: 33.9425, lng: -118.4081, domestic_security_min: 20, intl_security_min: 35 },
  JFK: { lat: 40.6413, lng: -73.7781, domestic_security_min: 25, intl_security_min: 40 },
  ORD: { lat: 41.9742, lng: -87.9073, domestic_security_min: 25, intl_security_min: 35 },
  SFO: { lat: 37.6213, lng: -122.3790, domestic_security_min: 20, intl_security_min: 30 },
  ATL: { lat: 33.6407, lng: -84.4277, domestic_security_min: 25, intl_security_min: 40 },
  DFW: { lat: 32.8998, lng: -97.0403, domestic_security_min: 20, intl_security_min: 30 },
  DEN: { lat: 39.8561, lng: -104.6737, domestic_security_min: 20, intl_security_min: 30 },
  SEA: { lat: 47.4502, lng: -122.3088, domestic_security_min: 20, intl_security_min: 30 },
  MIA: { lat: 25.7959, lng: -80.2870, domestic_security_min: 25, intl_security_min: 40 },
  EWR: { lat: 40.6895, lng: -74.1745, domestic_security_min: 25, intl_security_min: 40 },
  BOS: { lat: 42.3656, lng: -71.0096, domestic_security_min: 20, intl_security_min: 30 },
  IAD: { lat: 38.9531, lng: -77.4565, domestic_security_min: 20, intl_security_min: 30 },
  SAN: { lat: 32.7338, lng: -117.1933, domestic_security_min: 15, intl_security_min: 25 },
  IAH: { lat: 29.9902, lng: -95.3368, domestic_security_min: 20, intl_security_min: 35 },
  PHX: { lat: 33.4373, lng: -112.0078, domestic_security_min: 15, intl_security_min: 25 },
  LAS: { lat: 36.0840, lng: -115.1537, domestic_security_min: 25, intl_security_min: 35 },
  MCO: { lat: 28.4312, lng: -81.3081, domestic_security_min: 20, intl_security_min: 35 },
  MSP: { lat: 44.8848, lng: -93.2223, domestic_security_min: 15, intl_security_min: 25 },
  DTW: { lat: 42.2124, lng: -83.3534, domestic_security_min: 15, intl_security_min: 25 },
  CLT: { lat: 35.2140, lng: -80.9431, domestic_security_min: 15, intl_security_min: 25 },
  // International hubs
  LHR: { lat: 51.4700, lng: -0.4543, domestic_security_min: 25, intl_security_min: 40 },
  CDG: { lat: 49.0097, lng: 2.5479, domestic_security_min: 25, intl_security_min: 40 },
  DXB: { lat: 25.2532, lng: 55.3657, domestic_security_min: 20, intl_security_min: 35 },
  NRT: { lat: 35.7647, lng: 140.3864, domestic_security_min: 20, intl_security_min: 30 },
  HND: { lat: 35.5494, lng: 139.7798, domestic_security_min: 15, intl_security_min: 25 },
  SIN: { lat: 1.3644, lng: 103.9915, domestic_security_min: 15, intl_security_min: 25 },
  FRA: { lat: 50.0379, lng: 8.5622, domestic_security_min: 20, intl_security_min: 35 },
  AMS: { lat: 52.3105, lng: 4.7683, domestic_security_min: 20, intl_security_min: 35 },
  HKG: { lat: 22.3080, lng: 113.9185, domestic_security_min: 15, intl_security_min: 25 },
  ICN: { lat: 37.4602, lng: 126.4407, domestic_security_min: 15, intl_security_min: 25 },
  GRU: { lat: -23.4356, lng: -46.4731, domestic_security_min: 20, intl_security_min: 35 },
  MEX: { lat: 19.4363, lng: -99.0721, domestic_security_min: 20, intl_security_min: 30 },
  BOG: { lat: 4.7016, lng: -74.1469, domestic_security_min: 20, intl_security_min: 35 },
  SCL: { lat: -33.3930, lng: -70.7858, domestic_security_min: 15, intl_security_min: 30 },
  LIM: { lat: -12.0219, lng: -77.1143, domestic_security_min: 15, intl_security_min: 30 },
  CMN: { lat: 33.3675, lng: -7.5900, domestic_security_min: 15, intl_security_min: 30 },
  JNB: { lat: -26.1392, lng: 28.2460, domestic_security_min: 15, intl_security_min: 30 },
  CAI: { lat: 30.1219, lng: 31.4056, domestic_security_min: 20, intl_security_min: 35 },
  DLA: { lat: 4.0061, lng: 9.7194, domestic_security_min: 20, intl_security_min: 35 },
  NSI: { lat: 3.7226, lng: 11.5533, domestic_security_min: 20, intl_security_min: 35 },
  ABV: { lat: 9.0068, lng: 7.2632, domestic_security_min: 20, intl_security_min: 35 },
  LOS: { lat: 6.5774, lng: 3.3213, domestic_security_min: 25, intl_security_min: 40 },
};

async function getAirportCoords(
  airportCode: string,
  aeroApiKey?: string
): Promise<{ lat: number; lng: number } | null> {
  // Check local cache first
  const cached = AIRPORT_COORDS[airportCode.toUpperCase()];
  if (cached) return { lat: cached.lat, lng: cached.lng };

  // Try AeroDataBox API
  if (aeroApiKey) {
    try {
      const response = await fetch(
        `https://aerodatabox.p.rapidapi.com/airports/iata/${airportCode}`,
        {
          headers: {
            'X-RapidAPI-Key': aeroApiKey,
            'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.location) {
          return { lat: data.location.lat, lng: data.location.lon };
        }
      }
    } catch (e) {
      console.error('AeroDataBox airport lookup failed:', e);
    }
  }

  return null;
}

// ============================================
// FLIGHT STATUS
// ============================================

async function getFlightStatus(
  aeroApiKey: string,
  flightNumber: string,
  date: string
): Promise<{ status: string; delay?: number; gate?: string; terminal?: string } | null> {
  try {
    const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
    if (!match) return null;

    const response = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${flightNumber}/${date}`,
      {
        headers: {
          'X-RapidAPI-Key': aeroApiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const flights = Array.isArray(data) ? data : [data];
    if (flights.length === 0) return null;

    const f = flights[0];
    const dep = f.departure || {};
    const delay = dep.delay?.departure;

    return {
      status: f.status?.toLowerCase() || 'scheduled',
      delay: typeof delay === 'number' ? delay : undefined,
      gate: dep.gate || undefined,
      terminal: dep.terminal?.name || undefined,
    };
  } catch (e) {
    console.error('Flight status error:', e);
    return null;
  }
}

// ============================================
// TSA / SECURITY ESTIMATION ENGINE
// ============================================
// This engine works WITHOUT external APIs by using time-of-day,
// day-of-week, season, and airport-specific data.

interface SecurityEstimate {
  waitMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'api' | 'model';
  detail: string;
}

function estimateSecurityWait(
  airportCode: string,
  departureTime: Date,
  isInternational: boolean,
  tsaPrecheck: boolean,
  clearMe: boolean
): SecurityEstimate {
  const code = airportCode.toUpperCase();
  const hour = departureTime.getUTCHours();
  const dayOfWeek = departureTime.getUTCDay(); // 0=Sun
  const month = departureTime.getUTCMonth(); // 0=Jan

  // Base wait from airport data or defaults
  const airportData = AIRPORT_COORDS[code];
  let baseWait = isInternational
    ? (airportData?.intl_security_min || 30)
    : (airportData?.domestic_security_min || 20);

  // ─── TIME-OF-DAY MULTIPLIER ───
  // Peak hours: 5-8 AM (morning rush), 3-6 PM (afternoon rush)
  let timeMultiplier = 1.0;
  if (hour >= 5 && hour <= 8) timeMultiplier = 1.5; // Morning peak
  else if (hour >= 15 && hour <= 18) timeMultiplier = 1.3; // Afternoon peak
  else if (hour >= 9 && hour <= 11) timeMultiplier = 1.1; // Mid-morning
  else if (hour >= 19 && hour <= 22) timeMultiplier = 0.9; // Evening
  else if (hour >= 23 || hour <= 4) timeMultiplier = 0.6; // Late night / red-eye

  // ─── DAY-OF-WEEK MULTIPLIER ───
  // Fri/Sun busiest for leisure, Mon/Thu for business
  let dayMultiplier = 1.0;
  if (dayOfWeek === 0) dayMultiplier = 1.3; // Sunday
  else if (dayOfWeek === 1) dayMultiplier = 1.2; // Monday
  else if (dayOfWeek === 4) dayMultiplier = 1.2; // Thursday
  else if (dayOfWeek === 5) dayMultiplier = 1.4; // Friday
  else if (dayOfWeek === 6) dayMultiplier = 0.9; // Saturday (usually lighter)

  // ─── SEASONAL MULTIPLIER ───
  // Peak travel seasons
  let seasonMultiplier = 1.0;
  if (month === 5 || month === 6 || month === 7) seasonMultiplier = 1.3; // Jun-Aug summer
  else if (month === 11) seasonMultiplier = 1.4; // December holidays
  else if (month === 10 && departureTime.getUTCDate() >= 20) seasonMultiplier = 1.5; // Thanksgiving week
  else if (month === 2) seasonMultiplier = 1.2; // March spring break

  // ─── HOLIDAY DETECTION ───
  // Check for specific US holidays that spike airport traffic
  const md = `${month + 1}-${departureTime.getUTCDate()}`;
  const holidayDates = ['7-3', '7-4', '7-5', '12-23', '12-24', '12-26', '12-27', '1-1', '1-2', '11-22', '11-23', '11-24', '11-25', '11-26'];
  if (holidayDates.includes(md)) {
    seasonMultiplier = Math.max(seasonMultiplier, 1.6);
  }

  // ─── CALCULATE RAW WAIT ───
  let estimatedWait = Math.round(baseWait * timeMultiplier * dayMultiplier * seasonMultiplier);

  // ─── PRECHECK / CLEAR DISCOUNT ───
  if (clearMe) {
    estimatedWait = Math.max(5, Math.round(estimatedWait * 0.25)); // CLEAR is ~75% faster
  } else if (tsaPrecheck) {
    estimatedWait = Math.max(5, Math.round(estimatedWait * 0.4)); // PreCheck is ~60% faster
  }

  // Clamp to reasonable bounds
  estimatedWait = Math.max(5, Math.min(90, estimatedWait));

  // Confidence based on airport data availability
  const confidence = airportData ? 'medium' : 'low';

  const detail = `Estimated ${estimatedWait} min based on ${code} at ${hour}:00 ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}` +
    `${tsaPrecheck ? ' (TSA PreCheck)' : ''}${clearMe ? ' (CLEAR)' : ''}` +
    `. ${timeMultiplier > 1.2 ? 'Peak hour.' : ''} ${seasonMultiplier > 1.2 ? 'Busy season.' : ''}`;

  return {
    waitMinutes: estimatedWait,
    confidence,
    source: 'model',
    detail,
  };
}

// ============================================
// GATE WALK TIME ESTIMATION
// ============================================

function estimateGateWalkTime(airportCode: string): number {
  // Large airports need more walk time
  const largeAirports = ['ATL', 'DFW', 'DEN', 'ORD', 'LAX', 'JFK', 'CDG', 'LHR', 'DXB', 'FRA', 'AMS', 'ICN'];
  const mediumAirports = ['SFO', 'SEA', 'MIA', 'EWR', 'BOS', 'IAH', 'MCO', 'NRT', 'SIN', 'HKG', 'GRU'];

  const code = airportCode.toUpperCase();
  if (largeAirports.includes(code)) return 15;
  if (mediumAirports.includes(code)) return 10;
  return 8;
}

// ============================================
// PARKING & TRANSFER ESTIMATION
// ============================================

function estimateParkingTransfer(parkingType: string): number {
  switch (parkingType) {
    case 'valet': return 5;
    case 'self': return 15; // Park + shuttle to terminal
    case 'dropoff': return 5; // Curbside drop-off
    case 'rideshare': return 10; // Walk from rideshare zone
    default: return 12;
  }
}

// ============================================
// COMFORT BUFFER
// ============================================

function getComfortBuffer(preference: string): number {
  switch (preference) {
    case 'minimal': return 10;
    case 'standard': return 20;
    case 'generous': return 35;
    default: return 20;
  }
}

// ============================================
// RIDESHARE COST ESTIMATION
// ============================================

function estimateRideshareCost(distanceKm: number, durationMin: number, trafficLevel: string): { min: number; max: number } {
  // Base fare model (approximate Uber/Lyft pricing)
  const baseFare = 3.0;
  const perKm = 0.90;
  const perMin = 0.25;
  const bookingFee = 2.50;

  let cost = baseFare + (distanceKm * perKm) + (durationMin * perMin) + bookingFee;

  // Surge pricing estimate based on traffic
  if (trafficLevel === 'heavy') cost *= 1.4;
  else if (trafficLevel === 'moderate') cost *= 1.15;

  const min = Math.round(cost * 0.85);
  const max = Math.round(cost * 1.25);

  return { min: Math.max(8, min), max: Math.max(12, max) };
}

// ============================================
// REASONING ENGINE
// ============================================

function buildReasoning(
  breakdown: DepartureBreakdown,
  transport: TransportOption[],
  risks: RiskLevel[],
  securityEstimate: SecurityEstimate,
  airportCode: string,
  isInternational: boolean,
  preferences: CalculateRequest['preferences']
): string {
  const driveOption = transport.find(t => t.mode === 'drive');
  const parts: string[] = [];

  if (driveOption) {
    parts.push(
      `We calculated a ${driveOption.durationMinutes} minute drive to ${airportCode} based on current traffic conditions (${driveOption.trafficLevel}).`
    );
  }

  parts.push(securityEstimate.detail);

  if (isInternational) {
    parts.push(`International flights require check-in at least ${breakdown.checkinCutoff} minutes before departure.`);
  } else {
    parts.push(`Domestic flights recommend check-in at least ${breakdown.checkinCutoff} minutes before departure.`);
  }

  parts.push(`We added a ${breakdown.comfortBuffer} minute comfort buffer${preferences?.comfortBuffer === 'generous' ? ' (generous, as you prefer)' : ''}.`);

  const highRisks = risks.filter(r => r.level === 'high');
  if (highRisks.length > 0) {
    parts.push(`⚠️ ${highRisks.map(r => r.detail).join(' ')}`);
  }

  return parts.join(' ');
}

// ============================================
// MAIN CALCULATION
// ============================================

async function calculateDepartureAdvisory(
  req: CalculateRequest,
  googleApiKey: string,
  aeroApiKey: string
): Promise<AdvisoryResult> {
  const departureTime = new Date(req.departureTime);
  const preferences = req.preferences || {};
  const parkingType = preferences.parkingType || 'rideshare';
  const comfortPref = preferences.comfortBuffer || 'standard';
  const tsaPrecheck = preferences.tsaPrecheck || false;
  const clearMe = preferences.clearMe || false;

  // 1. Get airport coordinates
  const airportCoords = await getAirportCoords(req.departureAirport, aeroApiKey);
  if (!airportCoords) {
    throw new Error(`Unable to find coordinates for airport ${req.departureAirport}`);
  }

  // 2. Get driving directions (with traffic)
  const driveDirections = await getDirections(
    googleApiKey,
    { lat: req.userLocation.latitude, lng: req.userLocation.longitude },
    airportCoords,
    'driving',
    new Date() // Use current time for traffic
  );

  // 3. Get transit directions (optional, may not be available everywhere)
  const transitDirections = await getDirections(
    googleApiKey,
    { lat: req.userLocation.latitude, lng: req.userLocation.longitude },
    airportCoords,
    'transit'
  );

  // 4. Get flight status
  const flightDate = departureTime.toISOString().split('T')[0];
  const flightStatus = await getFlightStatus(aeroApiKey, req.flightNumber, flightDate);

  // 5. Estimate security wait
  const securityEstimate = estimateSecurityWait(
    req.departureAirport,
    departureTime,
    req.isInternational,
    tsaPrecheck,
    clearMe
  );

  // 6. Calculate all components
  const driveTimeMin = driveDirections
    ? Math.ceil(driveDirections.durationInTrafficSeconds / 60)
    : 45; // Fallback: assume 45 min

  const trafficBuffer = driveDirections
    ? Math.max(0, Math.ceil((driveDirections.durationInTrafficSeconds - driveDirections.durationSeconds) / 60))
    : 10;

  const distanceKm = driveDirections
    ? Math.round(driveDirections.distanceMeters / 1000)
    : 40;

  const trafficLevel = driveDirections?.trafficLevel || 'moderate';

  const parkingTransfer = estimateParkingTransfer(parkingType);
  const checkinCutoff = req.isInternational ? 60 : 45;
  const securityWait = securityEstimate.waitMinutes;
  const gateWalk = estimateGateWalkTime(req.departureAirport);
  const comfortBuffer = getComfortBuffer(comfortPref);

  // Account for flight delay (if delayed, we have more time)
  const flightDelayMinutes = flightStatus?.delay && flightStatus.delay > 0 ? flightStatus.delay : 0;

  const totalMinutes = driveTimeMin + trafficBuffer + parkingTransfer +
    checkinCutoff + securityWait + gateWalk + comfortBuffer - flightDelayMinutes;

  const breakdown: DepartureBreakdown = {
    driveTime: driveTimeMin,
    trafficBuffer,
    parkingAndTransfer: parkingTransfer,
    checkinCutoff,
    securityEstimate: securityWait,
    gateWalkTime: gateWalk,
    comfortBuffer,
    totalMinutes: Math.max(60, totalMinutes), // Minimum 1 hour
  };

  // 7. Calculate leave-by time
  // Boarding is typically 30-45 min before departure
  const boardingMinutesBefore = req.isInternational ? 45 : 30;
  const boardingTime = new Date(departureTime.getTime() - boardingMinutesBefore * 60000 + flightDelayMinutes * 60000);
  const leaveByTime = new Date(boardingTime.getTime() - breakdown.totalMinutes * 60000);

  // 8. Build transport options
  const transport: TransportOption[] = [];

  // Drive option
  transport.push({
    mode: 'drive',
    durationMinutes: driveTimeMin + trafficBuffer,
    distanceKm,
    trafficLevel,
    departBy: new Date(boardingTime.getTime() - (driveTimeMin + trafficBuffer + parkingTransfer + checkinCutoff + securityWait + gateWalk) * 60000).toISOString(),
  });

  // Rideshare option
  const rideshareCost = estimateRideshareCost(distanceKm, driveTimeMin, trafficLevel);
  transport.push({
    mode: 'rideshare',
    durationMinutes: driveTimeMin + trafficBuffer + 8, // +8 min for pickup wait
    distanceKm,
    estimatedCost: { ...rideshareCost, currency: 'USD' },
    trafficLevel,
    departBy: new Date(boardingTime.getTime() - (driveTimeMin + trafficBuffer + 8 + 10 + checkinCutoff + securityWait + gateWalk) * 60000).toISOString(),
  });

  // Transit option (if available)
  if (transitDirections) {
    const transitMin = Math.ceil(transitDirections.durationSeconds / 60);
    transport.push({
      mode: 'transit',
      durationMinutes: transitMin,
      distanceKm: Math.round(transitDirections.distanceMeters / 1000),
      trafficLevel: 'light', // Transit is usually predictable
      departBy: new Date(boardingTime.getTime() - (transitMin + checkinCutoff + securityWait + gateWalk + 5) * 60000).toISOString(),
    });
  }

  // 9. Risk assessment
  const risks: RiskLevel[] = [];

  // Traffic risk
  risks.push({
    category: 'Traffic',
    level: trafficLevel === 'heavy' ? 'high' : trafficLevel === 'moderate' ? 'moderate' : 'low',
    detail: trafficLevel === 'heavy'
      ? 'Heavy traffic detected on your route. Leave extra time.'
      : trafficLevel === 'moderate'
      ? 'Moderate traffic on your route.'
      : 'Traffic is light — smooth drive expected.',
  });

  // Security risk
  const securityRisk = securityWait > 35 ? 'high' : securityWait > 20 ? 'moderate' : 'low';
  risks.push({
    category: 'Security',
    level: securityRisk,
    detail: `TSA estimated at ${securityWait} min${tsaPrecheck ? ' (PreCheck)' : ''}.`,
  });

  // Flight status risk
  if (flightStatus) {
    const flightRisk = flightStatus.status === 'cancelled' ? 'high'
      : (flightStatus.delay && flightStatus.delay > 30) ? 'high'
      : (flightStatus.delay && flightStatus.delay > 0) ? 'moderate'
      : 'low';
    risks.push({
      category: 'Flight',
      level: flightRisk,
      detail: flightStatus.status === 'cancelled'
        ? '⚠️ Flight is CANCELLED. Check with your airline.'
        : flightStatus.delay
        ? `Flight delayed ${flightStatus.delay} min. We adjusted your leave time.`
        : 'Flight is on time.',
    });
  } else {
    risks.push({
      category: 'Flight',
      level: 'low',
      detail: 'Flight status not yet available. We assume on time.',
    });
  }

  // 10. Build reasoning
  const reasoning = buildReasoning(
    breakdown, transport, risks, securityEstimate,
    req.departureAirport, req.isInternational, preferences
  );

  // 11. Confidence
  const confidence = driveDirections && flightStatus ? 'high'
    : driveDirections || flightStatus ? 'medium'
    : 'low';

  return {
    leaveByTime: leaveByTime.toISOString(),
    boardingTime: boardingTime.toISOString(),
    totalMinutesNeeded: breakdown.totalMinutes,
    breakdown,
    transport,
    risks,
    reasoning,
    flightStatus: flightStatus || undefined,
    confidence,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
    const aeroApiKey = Deno.env.get('AERODATABOX_API_KEY') || '';

    if (action === 'calculate') {
      const request = body as CalculateRequest;

      if (!request.flightNumber || !request.departureAirport || !request.departureTime || !request.userLocation) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: flightNumber, departureAirport, departureTime, userLocation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await calculateDepartureAdvisory(request, googleApiKey, aeroApiKey);

      // Save to database
      const { data: advisory, error: dbError } = await supabase
        .from('departure_advisories')
        .upsert({
          trip_id: request.tripId || null,
          booking_id: request.bookingId || null,
          flight_number: request.flightNumber,
          departure_airport: request.departureAirport,
          departure_time: request.departureTime,
          user_location_lat: request.userLocation.latitude,
          user_location_lng: request.userLocation.longitude,
          leave_by_time: result.leaveByTime,
          total_minutes_needed: result.totalMinutesNeeded,
          breakdown: result.breakdown,
          transport_options: result.transport,
          risk_levels: result.risks,
          reasoning: result.reasoning,
          flight_status: result.flightStatus || null,
          confidence: result.confidence,
          calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'trip_id,flight_number',
        })
        .select('id')
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          advisoryId: advisory?.id || null,
          ...result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'feedback') {
      const { advisoryId, rating } = body as FeedbackRequest;

      if (!advisoryId || !rating) {
        return new Response(
          JSON.stringify({ error: 'Missing advisoryId or rating' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('departure_advisories')
        .update({
          user_rating: rating,
          rated_at: new Date().toISOString(),
        })
        .eq('id', advisoryId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Departure advisor error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
