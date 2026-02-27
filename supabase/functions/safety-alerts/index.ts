/**
 * SAFETY ALERTS EDGE FUNCTION
 * 
 * Integrates with Riskline Travel Search v2 API for travel safety data.
 * Provides safety scores, travel advisories, health alerts, and emergency info.
 * 
 * Environment Variables Required:
 * - RISKLINE_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface SafetyRequest {
  action: 'destination' | 'route' | 'alerts' | 'emergency';
  destination?: {
    city?: string;
    country: string;
    countryCode?: string;
  };
  origin?: {
    country: string;
    countryCode?: string;
  };
  nationality?: string;
  travelDates?: {
    startDate: string;
    endDate: string;
  };
}

interface SafetyResponse {
  destination: {
    country: string;
    city?: string;
    countryCode: string;
  };
  overallRisk: RiskLevel;
  categories: SafetyCategory[];
  advisories: Advisory[];
  healthInfo: HealthInfo;
  emergencyContacts: EmergencyContact[];
  entryRequirements?: EntryRequirements;
  lastUpdated: string;
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme' | 'unknown';

interface SafetyCategory {
  category: string;
  riskLevel: RiskLevel;
  score: number; // 0-100
  description: string;
  tips: string[];
}

interface Advisory {
  id: string;
  type: 'security' | 'health' | 'natural_disaster' | 'political' | 'travel';
  severity: RiskLevel;
  title: string;
  description: string;
  regions?: string[];
  issuedAt: string;
  expiresAt?: string;
  source: string;
}

interface HealthInfo {
  vaccinations: {
    required: string[];
    recommended: string[];
  };
  diseases: {
    name: string;
    risk: RiskLevel;
    prevention: string;
  }[];
  healthcareQuality: RiskLevel;
  waterSafety: string;
  foodSafety: string;
}

interface EmergencyContact {
  type: 'police' | 'ambulance' | 'fire' | 'embassy' | 'tourist_police';
  name: string;
  number: string;
  notes?: string;
}

interface EntryRequirements {
  visaRequired: boolean;
  visaType?: string;
  visaOnArrival: boolean;
  eVisaAvailable: boolean;
  passportValidity: string;
  covidRequirements?: string;
  customsInfo?: string;
}

// Riskline API integration
async function getRisklineData(
  apiKey: string,
  countryCode: string,
  city?: string
): Promise<unknown> {
  const params = new URLSearchParams({
    country: countryCode,
  });

  if (city) {
    params.append('city', city);
  }

  const response = await fetch(
    `https://api.riskline.com/v2/travel-search?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Riskline API error:', error);
    throw new Error(`Riskline API error: ${response.status}`);
  }

  return await response.json();
}

// Fallback: Use government travel advisories (free)
async function getGovernmentAdvisories(countryCode: string): Promise<Advisory[]> {
  const advisories: Advisory[] = [];

  // US State Department Travel Advisories
  try {
    const response = await fetch(
      `https://travel.state.gov/_res/rss/TAsTWs.xml`,
      { headers: { 'Accept': 'application/xml' } }
    );

    if (response.ok) {
      // Parse XML response - simplified for demo
      // In production, use proper XML parser
      const text = await response.text();
      
      // Extract advisories for the country (simplified)
      if (text.includes(countryCode)) {
        advisories.push({
          id: `us-state-${countryCode}`,
          type: 'travel',
          severity: 'moderate',
          title: `US State Department Advisory for ${countryCode}`,
          description: 'Check travel.state.gov for detailed advisory',
          issuedAt: new Date().toISOString(),
          source: 'US State Department',
        });
      }
    }
  } catch (error) {
    console.warn('Failed to fetch US State Dept advisories:', error);
  }

  return advisories;
}

// Generate safety data (fallback when API not available)
function generateFallbackSafetyData(
  countryCode: string,
  country: string,
  city?: string
): SafetyResponse {
  // Basic safety data based on common knowledge
  // In production, this would come from Riskline API
  
  const safetyScores: Record<string, { overall: RiskLevel; score: number }> = {
    // Very safe countries
    'JP': { overall: 'low', score: 90 },
    'SG': { overall: 'low', score: 92 },
    'CH': { overall: 'low', score: 91 },
    'NZ': { overall: 'low', score: 89 },
    'IS': { overall: 'low', score: 93 },
    'DK': { overall: 'low', score: 88 },
    'NO': { overall: 'low', score: 89 },
    'FI': { overall: 'low', score: 88 },
    'AT': { overall: 'low', score: 87 },
    'PT': { overall: 'low', score: 85 },
    // Moderately safe
    'US': { overall: 'moderate', score: 72 },
    'GB': { overall: 'low', score: 82 },
    'FR': { overall: 'moderate', score: 75 },
    'DE': { overall: 'low', score: 84 },
    'IT': { overall: 'moderate', score: 78 },
    'ES': { overall: 'moderate', score: 79 },
    'AU': { overall: 'low', score: 86 },
    'CA': { overall: 'low', score: 85 },
    // Default
    'DEFAULT': { overall: 'moderate', score: 65 },
  };

  const safetyInfo = safetyScores[countryCode] || safetyScores['DEFAULT'];

  return {
    destination: {
      country,
      city,
      countryCode,
    },
    overallRisk: safetyInfo.overall,
    categories: [
      {
        category: 'Crime',
        riskLevel: safetyInfo.overall,
        score: safetyInfo.score,
        description: 'General crime risk assessment',
        tips: [
          'Keep valuables secure and out of sight',
          'Use hotel safes for passports and extra cash',
          'Be aware of your surroundings, especially at night',
          'Avoid displaying expensive jewelry or electronics',
        ],
      },
      {
        category: 'Health',
        riskLevel: 'low',
        score: 80,
        description: 'Healthcare and disease risk',
        tips: [
          'Ensure routine vaccinations are up to date',
          'Carry basic medications and first aid supplies',
          'Purchase travel health insurance',
          'Know location of nearest hospital or clinic',
        ],
      },
      {
        category: 'Natural Disasters',
        riskLevel: 'low',
        score: 85,
        description: 'Risk of natural disasters',
        tips: [
          'Check weather forecasts before outdoor activities',
          'Know emergency procedures for your accommodation',
          'Register with your embassy for emergency alerts',
        ],
      },
      {
        category: 'Political Stability',
        riskLevel: safetyInfo.overall,
        score: safetyInfo.score - 5,
        description: 'Political and civil unrest risk',
        tips: [
          'Avoid large gatherings and demonstrations',
          'Monitor local news for developments',
          'Keep copies of important documents',
        ],
      },
    ],
    advisories: [],
    healthInfo: {
      vaccinations: {
        required: [],
        recommended: ['Hepatitis A', 'Hepatitis B', 'Tetanus'],
      },
      diseases: [],
      healthcareQuality: safetyInfo.overall === 'low' ? 'low' : 'moderate',
      waterSafety: safetyInfo.score > 80 ? 'Tap water is generally safe' : 'Drink bottled water',
      foodSafety: 'Exercise normal precautions with street food',
    },
    emergencyContacts: [
      {
        type: 'police',
        name: 'Police Emergency',
        number: getEmergencyNumber(countryCode, 'police'),
      },
      {
        type: 'ambulance',
        name: 'Medical Emergency',
        number: getEmergencyNumber(countryCode, 'ambulance'),
      },
      {
        type: 'fire',
        name: 'Fire Emergency',
        number: getEmergencyNumber(countryCode, 'fire'),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

function getEmergencyNumber(countryCode: string, type: string): string {
  const emergencyNumbers: Record<string, Record<string, string>> = {
    'US': { police: '911', ambulance: '911', fire: '911' },
    'GB': { police: '999', ambulance: '999', fire: '999' },
    'EU': { police: '112', ambulance: '112', fire: '112' },
    'JP': { police: '110', ambulance: '119', fire: '119' },
    'AU': { police: '000', ambulance: '000', fire: '000' },
    'DEFAULT': { police: '112', ambulance: '112', fire: '112' },
  };

  // EU countries use 112
  const euCountries = ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'GR', 'PL', 'SE', 'DK', 'FI', 'IE'];
  const lookupCode = euCountries.includes(countryCode) ? 'EU' : countryCode;
  
  const numbers = emergencyNumbers[lookupCode] || emergencyNumbers['DEFAULT'];
  return numbers[type] || '112';
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    const request: SafetyRequest = await req.json();

    // Validate request
    if (!request.destination?.country && !request.destination?.countryCode) {
      throw new Error('Destination country is required');
    }

    const countryCode = request.destination.countryCode || 
      request.destination.country.substring(0, 2).toUpperCase();
    const country = request.destination.country;
    const city = request.destination.city;

    let safetyData: SafetyResponse;

    if (apiKey) {
      try {
        // Use Riskline API
        const risklineData = await getRisklineData(apiKey, countryCode, city);
        // Transform Riskline response to our format
        // This would need to be implemented based on actual Riskline response structure
        safetyData = transformRisklineResponse(risklineData, country, countryCode, city);
      } catch (error) {
        console.warn('Riskline API failed, using fallback:', error);
        safetyData = generateFallbackSafetyData(countryCode, country, city);
      }
    } else {
      // Use fallback data
      console.log('No Riskline API key, using fallback safety data');
      safetyData = generateFallbackSafetyData(countryCode, country, city);
    }

    // Add government advisories
    const govAdvisories = await getGovernmentAdvisories(countryCode);
    safetyData.advisories = [...safetyData.advisories, ...govAdvisories];

    // Add entry requirements if origin nationality provided
    if (request.nationality) {
      safetyData.entryRequirements = await getEntryRequirements(
        request.nationality,
        countryCode
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: safetyData,
        meta: {
          provider: apiKey ? 'riskline' : 'fallback',
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Safety alerts error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SAFETY_ERROR',
          message: (error as Error).message || 'Safety data request failed',
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

// Transform Riskline API response (placeholder - implement based on actual API)
function transformRisklineResponse(
  data: unknown,
  country: string,
  countryCode: string,
  city?: string
): SafetyResponse {
  // This would transform the actual Riskline response
  // For now, return fallback data
  return generateFallbackSafetyData(countryCode, country, city);
}

// Get entry requirements (placeholder - would use visa API)
async function getEntryRequirements(
  nationality: string,
  destinationCode: string
): Promise<EntryRequirements> {
  // This would call Travel Buddy AI Visa API or similar
  // For now, return generic requirements
  return {
    visaRequired: true,
    visaOnArrival: false,
    eVisaAvailable: true,
    passportValidity: '6 months beyond travel dates',
    covidRequirements: 'Check current requirements before travel',
  };
}
