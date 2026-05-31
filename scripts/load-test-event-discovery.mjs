#!/usr/bin/env node

/**
 * LOAD TEST — event-discovery
 *
 * Exercises the cached discovery path. Hot requests reuse a small set of
 * cities (cache hits); cold requests rotate cities and force refresh.
 *
 * Usage:
 *   node scripts/load-test-event-discovery.mjs --requests=100 --concurrency=25 \
 *     --cold-ratio=0.15 --same-key=false
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);

const hotCities = [
  { city: 'Paris', country: 'France' },
  { city: 'Tokyo', country: 'Japan' },
  { city: 'New York', country: 'United States' },
  { city: 'Cape Town', country: 'South Africa' },
  { city: 'Bangkok', country: 'Thailand' },
];

const coldCities = [
  { city: 'Lisbon', country: 'Portugal' },
  { city: 'Nairobi', country: 'Kenya' },
  { city: 'Lima', country: 'Peru' },
  { city: 'Hanoi', country: 'Vietnam' },
  { city: 'Reykjavik', country: 'Iceland' },
];

await runLoad({
  name: 'event-discovery',
  url: `${supabaseUrl}/functions/v1/event-discovery`,
  buildRequest: ({ index, isCold }) => {
    const pool = isCold ? coldCities : hotCities;
    const place = pool[index % pool.length];
    return {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: {
        action: isCold ? 'refresh' : 'discover',
        city: place.city,
        country: place.country,
        forceRefresh: isCold,
      },
    };
  },
});
