#!/usr/bin/env node

/**
 * LOAD TEST — connect discover feed
 *
 * Drives the bundled `connect_discover_feed` RPC through PostgREST, the same
 * path the Connect Discover tab uses. The RPC consumes a durable read rate
 * bucket server-side, so high concurrency exercises both caching upstream and
 * the rate limiter.
 *
 * Provide LOAD_TEST_USER_ID (a profiles.id UUID) to attribute reads to a user;
 * otherwise reads run anonymously (null user) which still validates throughput.
 *
 * Usage:
 *   LOAD_TEST_USER_ID=<profileUuid> node scripts/load-test-connect.mjs \
 *     --requests=100 --concurrency=25 --same-key=true
 */

import { readEnv, requireSupabaseEnv, runLoad } from './lib/loadHarness.mjs';

const env = readEnv();
const { supabaseUrl, anonKey } = requireSupabaseEnv(env);
const bearer = env.LOAD_TEST_BEARER || anonKey;
const userId = env.LOAD_TEST_USER_ID || null;

await runLoad({
  name: 'connect-discover-feed',
  url: `${supabaseUrl}/rest/v1/rpc/connect_discover_feed`,
  buildRequest: () => ({
    headers: { apikey: anonKey, Authorization: `Bearer ${bearer}` },
    body: {
      p_user_id: userId,
      p_groups_limit: 10,
      p_groups_cursor: null,
      p_events_limit: 10,
      p_events_cursor: null,
      p_destinations_limit: 10,
      p_destinations_cursor: null,
    },
  }),
});
