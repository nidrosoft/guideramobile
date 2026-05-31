#!/usr/bin/env node

/**
 * SHARED LOAD-TEST HARNESS
 *
 * Reusable runner for the Phase 7 load-test scripts. Each domain script
 * supplies an endpoint + a per-request builder, and this harness handles
 * concurrency, hot/cold cache mixing, same-key concurrency, retries,
 * percentiles, and a reproducible JSON report.
 */

import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

export function readEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    // Env may be injected by CI; ignore a missing .env file.
  }
  return env;
}

export function arg(name, fallback) {
  const flag = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(flag));
  return found ? found.slice(flag.length) : fallback;
}

export function commonOptions() {
  return {
    requests: Number(arg('requests', '100')),
    concurrency: Number(arg('concurrency', '25')),
    coldRatio: Math.max(0, Math.min(1, Number(arg('cold-ratio', '0.1')))),
    distinctUsers: arg('distinct-users', 'true') !== 'false',
    retries: Number(arg('retries', '2')),
    sameKey: arg('same-key', 'false') === 'true',
    timeoutMs: Number(arg('timeout-ms', '30000')),
  };
}

function percentileFactory(sorted) {
  return (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run a load test.
 *
 * @param {object} config
 * @param {string} config.name            Domain name for the report.
 * @param {string} config.url             Full endpoint URL.
 * @param {(ctx: { index: number, isCold: boolean, options: object }) => object} config.buildRequest
 *        Returns `{ method?, headers?, body?, clientId? }` for the request.
 * @param {string} [config.cacheHeader]   Response header that signals cache state.
 * @param {object} [config.options]       Overrides for commonOptions().
 */
export async function runLoad(config) {
  const options = { ...commonOptions(), ...(config.options || {}) };
  const { requests, concurrency, coldRatio, distinctUsers, retries, sameKey, timeoutMs } = options;

  async function runOne(index) {
    const started = performance.now();
    const isCold = index % 100 < coldRatio * 100;
    const spec = config.buildRequest({ index, isCold, options });
    let lastError = '';

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(5000, 500 * 2 ** attempt)));
      }
      try {
        const clientId = sameKey ? 'load-shared-key' : spec.clientId || `load-user-${index}`;
        const response = await fetchWithTimeout(
          config.url,
          {
            method: spec.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(spec.headers || {}),
              ...(distinctUsers || sameKey ? { 'X-Guidera-Client-Id': clientId } : {}),
            },
            body: spec.body !== undefined ? JSON.stringify(spec.body) : undefined,
          },
          timeoutMs
        );
        await response.text();
        const shouldRetry = [429, 502, 503, 504].includes(response.status) && attempt < retries;
        if (shouldRetry) continue;
        return {
          ok: response.ok,
          status: response.status,
          cache: config.cacheHeader
            ? response.headers.get(config.cacheHeader) || 'none'
            : 'n/a',
          rateLimited: response.status === 429,
          ms: performance.now() - started,
          attempts: attempt + 1,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < retries) continue;
      }
    }
    return {
      ok: false,
      status: 0,
      cache: 'network_error',
      rateLimited: false,
      ms: performance.now() - started,
      attempts: retries + 1,
      error: lastError,
    };
  }

  const results = [];
  let next = 0;
  async function worker() {
    while (next < requests) {
      const index = next++;
      results[index] = await runOne(index);
      if ((index + 1) % 100 === 0 || index + 1 === requests) {
        process.stderr.write(`\r${config.name}: completed ${index + 1}/${requests}`);
      }
    }
  }

  const started = performance.now();
  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, () => worker()));
  process.stderr.write('\n');

  const sorted = results.map((r) => r.ms).sort((a, b) => a - b);
  const percentile = percentileFactory(sorted);
  const tally = (key) =>
    results.reduce((acc, r) => {
      acc[r[key]] = (acc[r[key]] || 0) + 1;
      return acc;
    }, {});

  const report = {
    domain: config.name,
    url: config.url,
    requests,
    concurrency,
    coldRatio,
    distinctUsers,
    sameKey,
    retries,
    elapsedSeconds: Number(((performance.now() - started) / 1000).toFixed(2)),
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    rateLimited: results.filter((r) => r.rateLimited).length,
    byStatus: tally('status'),
    byCache: tally('cache'),
    latencyMs: {
      p50: Math.round(percentile(0.5)),
      p95: Math.round(percentile(0.95)),
      p99: Math.round(percentile(0.99)),
      max: Math.round(sorted.at(-1) || 0),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  return report;
}

export function requireSupabaseEnv(env) {
  const supabaseUrl = (env.SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = env.SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }
  return { supabaseUrl, anonKey };
}
