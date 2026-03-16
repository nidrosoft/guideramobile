/**
 * US STATE DEPARTMENT ADVISORY API
 *
 * Fetches country-level travel advisories (Level 1-4).
 * Completely free, no auth required, no rate limits.
 */

import { StateDeptAdvisory } from '../types/safety.types';

const BASE_URL = 'https://travel.state.gov/content/dam/tsg-global/json/advisory-data.json';

// Cache advisories for 24 hours since they update daily
let cachedAdvisories: StateDeptAdvisory[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export class StateDeptAPI {
  async getAdvisory(countryCode: string): Promise<StateDeptAdvisory | null> {
    const advisories = await this.getAllAdvisories();
    return advisories.find(a => a.countryCode.toUpperCase() === countryCode.toUpperCase()) || null;
  }

  async getAllAdvisories(): Promise<StateDeptAdvisory[]> {
    if (cachedAdvisories && Date.now() - cacheTimestamp < CACHE_TTL) {
      return cachedAdvisories;
    }

    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) return cachedAdvisories || [];
      const data = await res.json();

      const advisories: StateDeptAdvisory[] = (data || []).map((item: any) => ({
        countryCode: item.iso_code || item.country_code || '',
        countryName: item.country || item.name || '',
        level: parseInt(item.advisory_level || item.level || '1', 10),
        levelDescription: mapAdvisoryLevel(parseInt(item.advisory_level || item.level || '1', 10)),
        lastUpdated: item.date_updated || item.last_updated || '',
      })).filter((a: StateDeptAdvisory) => a.countryCode);

      cachedAdvisories = advisories;
      cacheTimestamp = Date.now();
      return advisories;
    } catch (e) {
      if (__DEV__) console.warn('State Dept API error:', e);
      return cachedAdvisories || [];
    }
  }
}

function mapAdvisoryLevel(level: number): string {
  switch (level) {
    case 1: return 'Exercise Normal Precautions';
    case 2: return 'Exercise Increased Caution';
    case 3: return 'Reconsider Travel';
    case 4: return 'Do Not Travel';
    default: return 'Unknown';
  }
}

export const stateDeptAPI = new StateDeptAPI();
