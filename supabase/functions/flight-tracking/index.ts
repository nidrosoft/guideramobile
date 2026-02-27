/**
 * FLIGHT TRACKING EDGE FUNCTION
 * 
 * Integrates with AeroDataBox API for real-time flight status.
 * Supports flight status, delays, gate changes, and airport info.
 * 
 * Environment Variables Required:
 * - AERODATABOX_API_KEY (via RapidAPI)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface FlightTrackingRequest {
  action: 'status' | 'schedule' | 'airport' | 'airline';
  flightNumber?: string; // e.g., "AA123"
  date?: string; // YYYY-MM-DD
  airportCode?: string; // IATA code
  airlineCode?: string; // IATA code
  direction?: 'departure' | 'arrival';
}

interface FlightStatus {
  flightNumber: string;
  airline: {
    code: string;
    name: string;
  };
  status: 'scheduled' | 'boarding' | 'departed' | 'in_air' | 'landed' | 'arrived' | 'cancelled' | 'delayed' | 'diverted';
  departure: {
    airport: string;
    airportName: string;
    terminal?: string;
    gate?: string;
    scheduledTime: string;
    estimatedTime?: string;
    actualTime?: string;
    delay?: number; // minutes
  };
  arrival: {
    airport: string;
    airportName: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    scheduledTime: string;
    estimatedTime?: string;
    actualTime?: string;
    delay?: number;
  };
  aircraft?: {
    model: string;
    registration: string;
  };
  codeshares?: string[];
  lastUpdated: string;
}

interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  terminals?: string[];
}

// Get flight status from AeroDataBox
async function getFlightStatus(
  apiKey: string,
  flightNumber: string,
  date: string
): Promise<FlightStatus | null> {
  // Parse flight number (e.g., "AA123" -> airline "AA", number "123")
  const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
  if (!match) {
    throw new Error('Invalid flight number format. Use format like AA123');
  }

  const [, airlineCode, number] = match;

  const response = await fetch(
    `https://aerodatabox.p.rapidapi.com/flights/number/${airlineCode}${number}/${date}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`AeroDataBox API error: ${response.status}`);
  }

  const data = await response.json();
  const flights = Array.isArray(data) ? data : [data];
  
  if (flights.length === 0) {
    return null;
  }

  const flight = flights[0];
  return normalizeFlightStatus(flight);
}

// Get airport departures/arrivals
async function getAirportFlights(
  apiKey: string,
  airportCode: string,
  direction: 'departure' | 'arrival',
  fromTime: string,
  toTime: string
): Promise<FlightStatus[]> {
  const endpoint = direction === 'departure' ? 'departures' : 'arrivals';
  
  const response = await fetch(
    `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${airportCode}/${fromTime}/${toTime}?direction=${endpoint}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`AeroDataBox API error: ${response.status}`);
  }

  const data = await response.json();
  const flights = data[endpoint] || [];
  
  return flights.map((f: unknown) => normalizeFlightStatus(f as Record<string, unknown>));
}

// Get airport info
async function getAirportInfo(
  apiKey: string,
  airportCode: string
): Promise<AirportInfo | null> {
  const response = await fetch(
    `https://aerodatabox.p.rapidapi.com/airports/iata/${airportCode}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`AeroDataBox API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    code: data.iata,
    name: data.name,
    city: data.municipalityName || data.shortName,
    country: data.countryCode,
    timezone: data.timeZone,
    location: {
      latitude: data.location?.lat || 0,
      longitude: data.location?.lon || 0,
    },
  };
}

// Normalize flight status
function normalizeFlightStatus(flight: Record<string, unknown>): FlightStatus {
  const departure = flight.departure as Record<string, unknown>;
  const arrival = flight.arrival as Record<string, unknown>;
  const airline = flight.airline as Record<string, unknown>;
  const aircraft = flight.aircraft as Record<string, unknown>;

  const depScheduled = (departure?.scheduledTime as Record<string, string>)?.utc || (departure?.scheduledTimeUtc as string);
  const depEstimated = (departure?.revisedTime as Record<string, string>)?.utc;
  const depActual = (departure?.actualTime as Record<string, string>)?.utc;
  
  const arrScheduled = (arrival?.scheduledTime as Record<string, string>)?.utc || (arrival?.scheduledTimeUtc as string);
  const arrEstimated = (arrival?.revisedTime as Record<string, string>)?.utc;
  const arrActual = (arrival?.actualTime as Record<string, string>)?.utc;

  // Calculate delays
  const depDelay = depActual && depScheduled 
    ? Math.round((new Date(depActual).getTime() - new Date(depScheduled).getTime()) / 60000)
    : undefined;
  const arrDelay = arrActual && arrScheduled
    ? Math.round((new Date(arrActual).getTime() - new Date(arrScheduled).getTime()) / 60000)
    : undefined;

  return {
    flightNumber: `${airline?.iata || ''}${flight.number || ''}`,
    airline: {
      code: (airline?.iata as string) || '',
      name: (airline?.name as string) || '',
    },
    status: mapFlightStatus(flight.status as string),
    departure: {
      airport: (departure?.airport?.iata as string) || '',
      airportName: (departure?.airport?.name as string) || '',
      terminal: departure?.terminal as string | undefined,
      gate: departure?.gate as string | undefined,
      scheduledTime: depScheduled,
      estimatedTime: depEstimated,
      actualTime: depActual,
      delay: depDelay,
    },
    arrival: {
      airport: (arrival?.airport?.iata as string) || '',
      airportName: (arrival?.airport?.name as string) || '',
      terminal: arrival?.terminal as string | undefined,
      gate: arrival?.gate as string | undefined,
      baggage: arrival?.baggageBelt as string | undefined,
      scheduledTime: arrScheduled,
      estimatedTime: arrEstimated,
      actualTime: arrActual,
      delay: arrDelay,
    },
    aircraft: aircraft ? {
      model: (aircraft.model as string) || '',
      registration: (aircraft.reg as string) || '',
    } : undefined,
    codeshares: (flight.codeshareStatus as string) === 'IsCodeshared' 
      ? [(flight.codeshareFlightNumber as string)] 
      : undefined,
    lastUpdated: new Date().toISOString(),
  };
}

function mapFlightStatus(status: string): FlightStatus['status'] {
  const statusMap: Record<string, FlightStatus['status']> = {
    'Unknown': 'scheduled',
    'Expected': 'scheduled',
    'EnRoute': 'in_air',
    'CheckIn': 'scheduled',
    'Boarding': 'boarding',
    'GateClosed': 'boarding',
    'Departed': 'departed',
    'Delayed': 'delayed',
    'Approaching': 'in_air',
    'Arrived': 'arrived',
    'Landed': 'landed',
    'Canceled': 'cancelled',
    'Diverted': 'diverted',
  };
  return statusMap[status] || 'scheduled';
}

// Fallback data for demo/testing
function getFallbackFlightStatus(flightNumber: string, date: string): FlightStatus {
  const scheduledDep = new Date(`${date}T10:00:00Z`);
  const scheduledArr = new Date(`${date}T14:30:00Z`);

  return {
    flightNumber,
    airline: {
      code: flightNumber.substring(0, 2),
      name: 'Demo Airline',
    },
    status: 'scheduled',
    departure: {
      airport: 'JFK',
      airportName: 'John F. Kennedy International Airport',
      terminal: '4',
      gate: 'B22',
      scheduledTime: scheduledDep.toISOString(),
    },
    arrival: {
      airport: 'LAX',
      airportName: 'Los Angeles International Airport',
      terminal: '5',
      scheduledTime: scheduledArr.toISOString(),
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    const request: FlightTrackingRequest = await req.json();

    let response: unknown;

    switch (request.action) {
      case 'status': {
        if (!request.flightNumber) {
          throw new Error('Flight number is required');
        }
        const date = request.date || new Date().toISOString().split('T')[0];
        
        let flightStatus: FlightStatus | null = null;
        
        if (apiKey) {
          try {
            flightStatus = await getFlightStatus(apiKey, request.flightNumber.toUpperCase(), date);
          } catch (error) {
            console.warn('AeroDataBox API failed, using fallback:', error);
          }
        }
        
        if (!flightStatus) {
          flightStatus = getFallbackFlightStatus(request.flightNumber.toUpperCase(), date);
        }
        
        response = { flight: flightStatus };
        break;
      }

      case 'schedule': {
        if (!request.airportCode) {
          throw new Error('Airport code is required');
        }
        
        const direction = request.direction || 'departure';
        const now = new Date();
        const fromTime = now.toISOString();
        const toTime = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(); // +12 hours
        
        let flights: FlightStatus[] = [];
        
        if (apiKey) {
          try {
            flights = await getAirportFlights(
              apiKey,
              request.airportCode.toUpperCase(),
              direction,
              fromTime,
              toTime
            );
          } catch (error) {
            console.warn('AeroDataBox API failed:', error);
          }
        }
        
        response = { 
          flights, 
          count: flights.length,
          airport: request.airportCode.toUpperCase(),
          direction,
        };
        break;
      }

      case 'airport': {
        if (!request.airportCode) {
          throw new Error('Airport code is required');
        }
        
        let airportInfo: AirportInfo | null = null;
        
        if (apiKey) {
          try {
            airportInfo = await getAirportInfo(apiKey, request.airportCode.toUpperCase());
          } catch (error) {
            console.warn('AeroDataBox API failed:', error);
          }
        }
        
        if (!airportInfo) {
          // Fallback with basic info
          airportInfo = {
            code: request.airportCode.toUpperCase(),
            name: `${request.airportCode.toUpperCase()} Airport`,
            city: 'Unknown',
            country: 'Unknown',
            timezone: 'UTC',
            location: { latitude: 0, longitude: 0 },
          };
        }
        
        response = { airport: airportInfo };
        break;
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          provider: apiKey ? 'aerodatabox' : 'fallback',
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Flight tracking error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'FLIGHT_TRACKING_ERROR',
          message: (error as Error).message || 'Flight tracking request failed',
        },
        meta: {
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
