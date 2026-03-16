/**
 * CRIMEOMETER API CLIENT
 *
 * Queries CrimeoMeter for neighborhood-level crime data by GPS coordinates.
 * Available on RapidAPI with a free developer tier.
 *
 * 🔑 Requires EXPO_PUBLIC_CRIMEOMETER_API_KEY in .env
 */

import { CrimeData } from '../types/safety.types';

const BASE_URL = 'https://crimeometer.p.rapidapi.com/v1/incidents/raw-data';
const RAPID_API_HOST = 'crimeometer.p.rapidapi.com';

export class CrimeoMeterAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 5;
  }

  /**
   * Get crime incidents near coordinates within a radius
   * @param radiusMiles — search radius in miles (default 1 mile)
   */
  async getCrimeData(
    lat: number,
    lng: number,
    radiusMiles: number = 1
  ): Promise<CrimeData | null> {
    if (!this.isConfigured) return null;
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dtStart = monthAgo.toISOString().split('T')[0];
      const dtEnd = now.toISOString().split('T')[0];

      const url = `${BASE_URL}?lat=${lat}&lon=${lng}&distance=${radiusMiles}mi&datetime_ini=${dtStart}&datetime_end=${dtEnd}&page=1`;

      const res = await fetch(url, {
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': RAPID_API_HOST,
        },
      });

      if (!res.ok) return null;
      const data = await res.json();

      const incidents = (data.incidents || []).map((inc: any) => ({
        type: inc.incident_offense || inc.incident_code || 'Unknown',
        description: inc.incident_offense_description || inc.incident_offense || '',
        coordinates: inc.incident_latitude && inc.incident_longitude
          ? { latitude: parseFloat(inc.incident_latitude), longitude: parseFloat(inc.incident_longitude) }
          : undefined,
        date: inc.incident_date,
      }));

      const totalIncidents = incidents.length;
      // Simple crime score: normalize incidents per radius
      // 0 incidents = 0, 10+ = 50, 30+ = 80, 50+ = 100
      const crimeScore = Math.min(100, Math.round((totalIncidents / 50) * 100));

      return { totalIncidents, crimeScore, incidents: incidents.slice(0, 20) };
    } catch (e) {
      if (__DEV__) console.warn('CrimeoMeter API error:', e);
      return null;
    }
  }
}

const API_KEY = process.env.EXPO_PUBLIC_CRIMEOMETER_API_KEY || '';
export const crimeoMeterAPI = new CrimeoMeterAPI(API_KEY);
