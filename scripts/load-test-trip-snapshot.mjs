#!/usr/bin/env node

/**
 * LOAD TEST — trip-snapshot
 *
 * Usage:
 *   node scripts/load-test-trip-snapshot.mjs --requests=100 --concurrency=25 \
 *     --cold-ratio=0.1 --same-key=false
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);

const hotSearches = [
  { destination: 'Douala', country: 'Cameroon', originCity: 'New York' },
  { destination: 'Johannesburg', country: 'South Africa', originCity: 'New York' },
  { destination: 'Paris', country: 'France', originCity: 'New York' },
  { destination: 'Tokyo', country: 'Japan', originCity: 'Los Angeles' },
  { destination: 'Bangkok', country: 'Thailand', originCity: 'London' },
];

await runLoad({
  name: 'trip-snapshot',
  url: `${supabaseUrl}/functions/v1/trip-snapshot`,
  cacheHeader: 'x-snapshot-cache',
  buildRequest: ({ index, isCold }) => {
    const base = hotSearches[index % hotSearches.length];
    const dayOffset = isCold ? 20 + (index % 120) : 10;
    const start = new Date(Date.UTC(2026, 5, dayOffset));
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 5);
    return {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: {
        ...base,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        travelers: { adults: 1, children: 0, infants: 0 },
        nationality: 'US citizen',
        selectedTopics: ['safety', 'visa_entry', 'food', 'arrival'],
        currency: 'USD',
        phase: 'data',
      },
    };
  },
});
