/**
 * WEATHER EDGE FUNCTION
 * 
 * Integrates with Tomorrow.io for weather forecasts and alerts.
 * Supports current conditions, daily forecasts, and severe weather alerts.
 * 
 * Environment Variables Required:
 * - TOMORROW_IO_API_KEY
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface WeatherRequest {
  action: 'current' | 'forecast' | 'alerts' | 'historical';
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  units?: 'metric' | 'imperial';
  days?: number; // For forecast (1-14)
  startDate?: string; // For historical
  endDate?: string;
}

interface WeatherResponse {
  current?: CurrentWeather;
  forecast?: DailyForecast[];
  alerts?: WeatherAlert[];
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  observationTime: string;
}

interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  temperatureAvg: number;
  humidity: number;
  windSpeed: number;
  precipitationProbability: number;
  precipitationAmount: number;
  uvIndexMax: number;
  sunriseTime: string;
  sunsetTime: string;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  source: string;
}

// Weather code to description mapping
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Unknown', icon: 'unknown' },
  1000: { description: 'Clear', icon: 'clear_day' },
  1001: { description: 'Cloudy', icon: 'cloudy' },
  1100: { description: 'Mostly Clear', icon: 'mostly_clear_day' },
  1101: { description: 'Partly Cloudy', icon: 'partly_cloudy_day' },
  1102: { description: 'Mostly Cloudy', icon: 'mostly_cloudy' },
  2000: { description: 'Fog', icon: 'fog' },
  2100: { description: 'Light Fog', icon: 'fog_light' },
  3000: { description: 'Light Wind', icon: 'wind_light' },
  3001: { description: 'Wind', icon: 'wind' },
  3002: { description: 'Strong Wind', icon: 'wind_strong' },
  4000: { description: 'Drizzle', icon: 'drizzle' },
  4001: { description: 'Rain', icon: 'rain' },
  4200: { description: 'Light Rain', icon: 'rain_light' },
  4201: { description: 'Heavy Rain', icon: 'rain_heavy' },
  5000: { description: 'Snow', icon: 'snow' },
  5001: { description: 'Flurries', icon: 'flurries' },
  5100: { description: 'Light Snow', icon: 'snow_light' },
  5101: { description: 'Heavy Snow', icon: 'snow_heavy' },
  6000: { description: 'Freezing Drizzle', icon: 'freezing_drizzle' },
  6001: { description: 'Freezing Rain', icon: 'freezing_rain' },
  6200: { description: 'Light Freezing Rain', icon: 'freezing_rain_light' },
  6201: { description: 'Heavy Freezing Rain', icon: 'freezing_rain_heavy' },
  7000: { description: 'Ice Pellets', icon: 'ice_pellets' },
  7101: { description: 'Heavy Ice Pellets', icon: 'ice_pellets_heavy' },
  7102: { description: 'Light Ice Pellets', icon: 'ice_pellets_light' },
  8000: { description: 'Thunderstorm', icon: 'tstorm' },
};

function getWeatherInfo(code: number): { description: string; icon: string } {
  return WEATHER_CODES[code] || WEATHER_CODES[0];
}

// Get current weather
async function getCurrentWeather(
  apiKey: string,
  lat: number,
  lon: number,
  units: string
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    units,
    apikey: apiKey,
  });

  const response = await fetch(
    `https://api.tomorrow.io/v4/weather/realtime?${params}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Tomorrow.io API error: ${response.status}`);
  }

  const data = await response.json();
  const values = data.data?.values || {};
  const weatherInfo = getWeatherInfo(values.weatherCode);

  return {
    temperature: values.temperature,
    feelsLike: values.temperatureApparent,
    humidity: values.humidity,
    windSpeed: values.windSpeed,
    windDirection: values.windDirection,
    uvIndex: values.uvIndex,
    visibility: values.visibility,
    cloudCover: values.cloudCover,
    precipitationProbability: values.precipitationProbability || 0,
    weatherCode: values.weatherCode,
    weatherDescription: weatherInfo.description,
    icon: weatherInfo.icon,
    observationTime: data.data?.time,
  };
}

// Get daily forecast
async function getDailyForecast(
  apiKey: string,
  lat: number,
  lon: number,
  units: string,
  days: number
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    units,
    apikey: apiKey,
    timesteps: '1d',
  });

  const response = await fetch(
    `https://api.tomorrow.io/v4/weather/forecast?${params}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Tomorrow.io API error: ${response.status}`);
  }

  const data = await response.json();
  const timelines = data.timelines?.daily || [];

  return timelines.slice(0, days).map((day: Record<string, unknown>) => {
    const values = day.values as Record<string, number>;
    const weatherInfo = getWeatherInfo(values.weatherCodeMax || values.weatherCode);

    return {
      date: day.time,
      temperatureMax: values.temperatureMax,
      temperatureMin: values.temperatureMin,
      temperatureAvg: values.temperatureAvg,
      humidity: values.humidityAvg,
      windSpeed: values.windSpeedAvg,
      precipitationProbability: values.precipitationProbabilityAvg || 0,
      precipitationAmount: values.precipitationIntensityAvg || 0,
      uvIndexMax: values.uvIndexMax,
      sunriseTime: values.sunriseTime,
      sunsetTime: values.sunsetTime,
      weatherCode: values.weatherCodeMax || values.weatherCode,
      weatherDescription: weatherInfo.description,
      icon: weatherInfo.icon,
    };
  });
}

// Get weather alerts
async function getWeatherAlerts(
  apiKey: string,
  lat: number,
  lon: number
): Promise<WeatherAlert[]> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    apikey: apiKey,
  });

  const response = await fetch(
    `https://api.tomorrow.io/v4/alerts?${params}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    // Alerts endpoint may not be available in all regions
    console.warn('Weather alerts not available for this location');
    return [];
  }

  const data = await response.json();
  const alerts = data.data?.alerts || [];

  return alerts.map((alert: Record<string, unknown>) => ({
    id: alert.id || crypto.randomUUID(),
    type: alert.type,
    severity: mapSeverity(alert.severity as string),
    title: alert.title,
    description: alert.description,
    startTime: alert.startTime,
    endTime: alert.endTime,
    source: alert.source || 'Tomorrow.io',
  }));
}

function mapSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
  const severityMap: Record<string, 'minor' | 'moderate' | 'severe' | 'extreme'> = {
    minor: 'minor',
    moderate: 'moderate',
    severe: 'severe',
    extreme: 'extreme',
    unknown: 'minor',
  };
  return severityMap[severity?.toLowerCase()] || 'minor';
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const apiKey = Deno.env.get('TOMORROW_IO_API_KEY');
    if (!apiKey) {
      throw new Error('Tomorrow.io API key not configured');
    }

    const request: WeatherRequest = await req.json();
    
    // Validate request
    if (!request.location?.latitude || !request.location?.longitude) {
      throw new Error('Location coordinates are required');
    }

    const { latitude, longitude, name } = request.location;
    const units = request.units || 'metric';
    const days = Math.min(request.days || 7, 14);

    const response: WeatherResponse = {
      location: {
        name: name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
      },
    };

    switch (request.action) {
      case 'current':
        response.current = await getCurrentWeather(apiKey, latitude, longitude, units);
        break;

      case 'forecast':
        response.forecast = await getDailyForecast(apiKey, latitude, longitude, units, days);
        break;

      case 'alerts':
        response.alerts = await getWeatherAlerts(apiKey, latitude, longitude);
        break;

      default:
        // Return both current and forecast by default
        const [current, forecast, alerts] = await Promise.all([
          getCurrentWeather(apiKey, latitude, longitude, units),
          getDailyForecast(apiKey, latitude, longitude, units, days),
          getWeatherAlerts(apiKey, latitude, longitude),
        ]);
        response.current = current;
        response.forecast = forecast;
        response.alerts = alerts;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        meta: {
          units,
          provider: 'tomorrow.io',
          requestDuration: Date.now() - startTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Weather function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'WEATHER_ERROR',
          message: (error as Error).message || 'Weather request failed',
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
