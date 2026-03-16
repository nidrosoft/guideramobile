/**
 * GDACS API CLIENT
 *
 * Queries the UN Global Disaster Alert and Coordination System.
 * Real-time alerts for earthquakes, floods, cyclones, volcanoes, tsunamis.
 * Completely free, no auth required, unlimited requests.
 */

import { GDACSDisaster } from '../types/safety.types';

const GDACS_JSON_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

export class GDACSAPI {
  /**
   * Get active disasters near coordinates within a radius
   */
  async getActiveDisasters(
    lat: number,
    lng: number,
    radiusKm: number = 500
  ): Promise<GDACSDisaster[]> {
    try {
      // GDACS API — query recent events
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fromDate = weekAgo.toISOString().split('T')[0];
      const toDate = now.toISOString().split('T')[0];

      const res = await fetch(
        `${GDACS_JSON_URL}?fromDate=${fromDate}&toDate=${toDate}&alertlevel=Green;Orange;Red&eventlist=EQ;FL;TC;VO;TS;WF&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!res.ok) {
        // Fallback: try RSS feed
        return await this.getFromRSS(lat, lng, radiusKm);
      }

      const data = await res.json();
      const features = data.features || [];

      // Filter by distance from user
      return features
        .filter((f: any) => {
          const coords = f.geometry?.coordinates;
          if (!coords) return false;
          const dist = haversineDistance(lat, lng, coords[1], coords[0]);
          return dist <= radiusKm;
        })
        .map((f: any) => ({
          id: f.properties?.eventid || f.id || String(Date.now()),
          type: mapEventType(f.properties?.eventtype),
          severity: f.properties?.alertlevel || 'Green',
          title: f.properties?.name || f.properties?.eventtype || 'Disaster Alert',
          description: f.properties?.description || f.properties?.htmldescription || '',
          coordinates: {
            latitude: f.geometry?.coordinates?.[1] || 0,
            longitude: f.geometry?.coordinates?.[0] || 0,
          },
          magnitude: f.properties?.severitydata?.severity,
          date: new Date(f.properties?.fromdate || Date.now()),
        }));
    } catch (e) {
      if (__DEV__) console.warn('GDACS API error:', e);
      return [];
    }
  }

  /**
   * Fallback: parse GDACS RSS feed
   */
  private async getFromRSS(lat: number, lng: number, radiusKm: number): Promise<GDACSDisaster[]> {
    try {
      const res = await fetch('https://www.gdacs.org/xml/rss.xml');
      if (!res.ok) return [];
      // RSS parsing would need xml2js — return empty for now, JSON endpoint is primary
      return [];
    } catch {
      return [];
    }
  }
}

function mapEventType(type: string): GDACSDisaster['type'] {
  const map: Record<string, GDACSDisaster['type']> = {
    EQ: 'earthquake', FL: 'flood', TC: 'cyclone', VO: 'volcano', TS: 'tsunami', WF: 'wildfire',
  };
  return map[type] || 'earthquake';
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const gdacsAPI = new GDACSAPI();
