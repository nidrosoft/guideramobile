#!/usr/bin/env node

/**
 * LOAD TEST — homepage
 *
 * Exercises the location-aware homepage cache. Hot requests reuse a small set
 * of coordinates (cache hits); cold requests rotate coordinates and refresh.
 *
 * Usage:
 *   node scripts/load-test-homepage.mjs --requests=100 --concurrency=25 \
 *     --cold-ratio=0.15 --same-key=false
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);

const hotCoords = [
  { lat: 40.7128, lng: -74.006 }, // New York
  { lat: 48.8566, lng: 2.3522 }, // Paris
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: -33.9249, lng: 18.4241 }, // Cape Town
  { lat: 51.5074, lng: -0.1278 }, // London
];

const coldCoords = [
  { lat: -1.2921, lng: 36.8219 }, // Nairobi
  { lat: -12.0464, lng: -77.0428 }, // Lima
  { lat: 21.0278, lng: 105.8342 }, // Hanoi
  { lat: 64.1466, lng: -21.9426 }, // Reykjavik
  { lat: 38.7223, lng: -9.1393 }, // Lisbon
];

await runLoad({
  name: 'homepage',
  url: `${supabaseUrl}/functions/v1/homepage`,
  buildRequest: ({ index, isCold }) => {
    const pool = isCold ? coldCoords : hotCoords;
    const coord = pool[index % pool.length];
    return {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: { lat: coord.lat, lng: coord.lng, refresh: isCold },
    };
  },
});
