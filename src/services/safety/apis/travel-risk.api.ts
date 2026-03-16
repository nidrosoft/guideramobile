/**
 * TRAVEL RISK API CLIENT
 *
 * Queries travelriskapi.com for country-level risk scores and active alerts.
 * Free tier: 100 requests/day.
 *
 * 🔑 Requires EXPO_PUBLIC_TRAVEL_RISK_API_KEY in .env
 */

import { TravelRiskResponse } from '../types/safety.types';

/**
 * Base URL: https://travelriskapi.com/api/v1
 * Auth: X-API-Key header
 * Endpoints:
 *   /countries — list all countries with risk levels
 *   /countries/{iso_code} — single country detail
 *   /alerts — active disaster alerts (filterable)
 *   /risk-score/{iso_code} — composite risk score 1-5
 */
const BASE_URL = 'https://travelriskapi.com/api/v1';

export class TravelRiskAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 5;
  }

  private get headers() {
    return { 'X-API-Key': this.apiKey, 'Accept': 'application/json' };
  }

  /**
   * Get risk score for a country (ISO 3-letter code)
   */
  async getRiskByCountry(countryCode: string): Promise<TravelRiskResponse | null> {
    if (!this.isConfigured) return null;
    try {
      // Get composite risk score
      const res = await fetch(`${BASE_URL}/risk-score/${countryCode.toUpperCase()}`, {
        headers: this.headers,
      });
      if (!res.ok) return null;
      const data = await res.json();

      // Also fetch active alerts for this country
      const alertsRes = await fetch(`${BASE_URL}/alerts?country_iso=${countryCode.toUpperCase()}&limit=10`, {
        headers: this.headers,
      });
      const alertsData = alertsRes.ok ? await alertsRes.json() : { data: [] };

      return {
        country: data.name || countryCode,
        riskLevel: data.risk_score || data.advisory_level || 1,
        advisories: (alertsData.data || []).map((a: any) => ({
          type: a.alert_type || 'general',
          severity: a.severity || 'Low',
          description: a.description || '',
          location: a.location,
          coordinates: a.latitude && a.longitude ? { lat: a.latitude, lng: a.longitude } : undefined,
        })),
      };
    } catch (e) {
      if (__DEV__) console.warn('TravelRisk API error:', e);
      return null;
    }
  }

  /**
   * Get alerts near coordinates — queries /alerts and filters by proximity
   */
  async getRiskByCoordinates(lat: number, lng: number): Promise<TravelRiskResponse | null> {
    if (!this.isConfigured) return null;
    try {
      // Fetch all recent alerts and filter by distance
      const res = await fetch(`${BASE_URL}/alerts?limit=50`, {
        headers: this.headers,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const alerts = (data.data || []).filter((a: any) => {
        if (!a.latitude || !a.longitude) return false;
        const dist = haversine(lat, lng, a.latitude, a.longitude);
        return dist < 500; // 500km radius
      });

      return {
        country: 'Nearby',
        riskLevel: alerts.length > 0 ? Math.max(...alerts.map((a: any) => severityToScore(a.severity))) : 1,
        advisories: alerts.map((a: any) => ({
          type: a.alert_type || 'general',
          severity: a.severity || 'Low',
          description: a.description || '',
          location: a.location,
          coordinates: { lat: a.latitude, lng: a.longitude },
        })),
      };
    } catch (e) {
      if (__DEV__) console.warn('TravelRisk API coordinates error:', e);
      return null;
    }
  }

  /**
   * Get all active disaster alerts (optionally filtered)
   */
  async getAlerts(options?: { severity?: string; type?: string; countryIso?: string }): Promise<any[]> {
    if (!this.isConfigured) return [];
    try {
      let url = `${BASE_URL}/alerts?limit=20`;
      if (options?.severity) url += `&severity=${options.severity}`;
      if (options?.type) url += `&alert_type=${options.type}`;
      if (options?.countryIso) url += `&country_iso=${options.countryIso}`;

      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      if (__DEV__) console.warn('TravelRisk alerts error:', e);
      return [];
    }
  }
}

function severityToScore(severity: string): number {
  switch (severity?.toLowerCase()) {
    case 'critical': return 5;
    case 'high': return 4;
    case 'medium': return 3;
    case 'low': return 2;
    default: return 1;
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const API_KEY = process.env.EXPO_PUBLIC_TRAVEL_RISK_API_KEY || '';
export const travelRiskAPI = new TravelRiskAPI(API_KEY);
