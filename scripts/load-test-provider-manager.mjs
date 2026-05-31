#!/usr/bin/env node

/**
 * LOAD TEST — provider-manager
 *
 * The search/package_search actions require a real authenticated user. Provide
 * a Clerk-issued user JWT via LOAD_TEST_BEARER for a meaningful provider path;
 * without it requests exercise the auth gate (expected 401) which still
 * validates throughput and rate-limit behavior.
 *
 * Usage:
 *   LOAD_TEST_BEARER=<userJwt> node scripts/load-test-provider-manager.mjs \
 *     --requests=100 --concurrency=25 --cold-ratio=0.2 --same-key=false
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);
const bearer = env.LOAD_TEST_BEARER || anonKey;

const routes = [
  { origin: 'JFK', destination: 'CDG' },
  { origin: 'LAX', destination: 'NRT' },
  { origin: 'LHR', destination: 'BKK' },
  { origin: 'JFK', destination: 'JNB' },
  { origin: 'EWR', destination: 'DLA' },
];

await runLoad({
  name: 'provider-manager',
  url: `${supabaseUrl}/functions/v1/provider-manager`,
  buildRequest: ({ index, isCold }) => {
    const route = routes[index % routes.length];
    const dayOffset = isCold ? 30 + (index % 120) : 14;
    const depart = new Date(Date.UTC(2026, 6, dayOffset));
    return {
      headers: { apikey: anonKey, Authorization: `Bearer ${bearer}` },
      body: {
        action: 'search',
        category: 'flights',
        params: {
          origin: route.origin,
          destination: route.destination,
          departureDate: depart.toISOString().slice(0, 10),
          adults: 1,
          cabinClass: 'economy',
        },
        sessionId: `load-session-${index}`,
      },
    };
  },
});
