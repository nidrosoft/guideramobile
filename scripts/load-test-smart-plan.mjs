#!/usr/bin/env node

/**
 * LOAD TEST — smart-plan-generate
 *
 * Smart Plan is owner-scoped: it requires a real user JWT (LOAD_TEST_BEARER)
 * and a trip the user owns (LOAD_TEST_TRIP_ID). The most important property to
 * load test is that concurrent starts coalesce instead of fanning out 6x AI
 * work, so run this with --same-key=true to hammer one trip.
 *
 * Usage:
 *   LOAD_TEST_BEARER=<userJwt> LOAD_TEST_TRIP_ID=<tripId> \
 *     node scripts/load-test-smart-plan.mjs --requests=50 --concurrency=25 --same-key=true
 *
 * Without credentials this measures the auth/ownership guard (expected 401/403).
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);
const bearer = env.LOAD_TEST_BEARER || anonKey;
const tripId = env.LOAD_TEST_TRIP_ID || '00000000-0000-0000-0000-000000000000';

await runLoad({
  name: 'smart-plan-generate',
  url: `${supabaseUrl}/functions/v1/smart-plan-generate`,
  options: { sameKey: true },
  buildRequest: () => ({
    headers: { apikey: anonKey, Authorization: `Bearer ${bearer}` },
    body: { tripId, forceRefresh: false },
  }),
});
