#!/usr/bin/env node

/**
 * ONE-TIME BACKFILL — persist destination cover images to Supabase Storage.
 *
 * Google Places photo URLs (lh3.googleusercontent.com/place-photos/...) expire,
 * which leaves home cards blank. This script resolves a fresh photo per
 * destination via the google-api-proxy, downloads the bytes, uploads them to
 * the public `destination-images` Storage bucket, and points
 * hero_image_url / thumbnail_url at the permanent Storage URL.
 *
 * Auth: reads the service-role key from /tmp/.guidera_srk (not committed).
 *
 * Usage: node scripts/backfill-destination-images.mjs [--limit=999] [--concurrency=4] [--force]
 */

import { readFileSync } from 'node:fs';

function readEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const [k, ...rest] = line.split('=');
      env[k.trim()] = rest.join('=').trim();
    }
  } catch { /* ignore */ }
  return env;
}
function arg(name, fallback) {
  const f = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(f));
  return found ? found.slice(f.length) : fallback;
}

const env = readEnv();
const SUPABASE_URL = (env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '').replace(/\/$/, '');
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const SRK = readFileSync('/tmp/.guidera_srk', 'utf8').trim();
const BUCKET = 'destination-images';
const limit = Number(arg('limit', '999'));
const concurrency = Number(arg('concurrency', '4'));
const force = process.argv.includes('--force');

if (!SUPABASE_URL || !ANON || !SRK) {
  console.error('Missing SUPABASE_URL / ANON / service key');
  process.exit(1);
}

const proxy = `${SUPABASE_URL}/functions/v1/google-api-proxy`;

async function proxyJson(body, clientId) {
  const res = await fetch(proxy, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, 'X-Guidera-Client-Id': clientId },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`proxy ${body.action} ${res.status}`);
  return res.json();
}

function queriesFor(city, country) {
  const dest = [city, country].filter(Boolean).join(' ');
  return [
    `tourist attractions in ${dest}`,
    `${dest} scenic viewpoint`,
    `${dest} famous landmark`,
    dest,
  ];
}

async function resolveFreshPhotoUrl(city, country, clientId) {
  for (const query of queriesFor(city, country)) {
    try {
      const data = await proxyJson({ action: 'places_search', query }, clientId);
      const results = data.results || [];
      for (const r of results.slice(0, 5)) {
        const ref = r.photos?.[0]?.photo_reference;
        if (!ref) continue;
        const photo = await proxyJson({ action: 'place_photo', photoReference: ref, maxWidth: 1200 }, clientId);
        if (photo.url) return photo.url;
      }
    } catch { /* try next query */ }
  }
  return null;
}

async function downloadBytes(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.startsWith('image')) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 1024) return null;
  return { buf, ct };
}

async function uploadToStorage(path, buf, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buf,
  });
  return res.ok;
}

async function updateRow(id, url) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/curated_destinations?id=eq.${id}`, {
    method: 'PATCH',
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ hero_image_url: url, thumbnail_url: url }),
  });
  return res.ok;
}

async function fetchDestinations() {
  const notPersisted = force
    ? ''
    : `&hero_image_url=not.ilike.*${encodeURIComponent(`/storage/v1/object/public/${BUCKET}/`)}*`;
  const url = `${SUPABASE_URL}/rest/v1/curated_destinations?select=id,title,city,country,hero_image_url&status=eq.published${notPersisted}&limit=${limit}`;
  const res = await fetch(url, { headers: { apikey: SRK, Authorization: `Bearer ${SRK}` } });
  if (!res.ok) throw new Error(`fetch destinations ${res.status}`);
  return res.json();
}

async function processOne(dest, i) {
  const city = dest.city || (dest.title || '').split(' - ')[0] || dest.title;
  const country = dest.country || '';
  const clientId = `backfill-img-${i}-${dest.id.slice(0, 8)}`;
  try {
    const fresh = await resolveFreshPhotoUrl(city, country, clientId);
    if (!fresh) return { id: dest.id, title: dest.title, status: 'no_photo' };
    const dl = await downloadBytes(fresh);
    if (!dl) return { id: dest.id, title: dest.title, status: 'download_failed' };
    const ext = dl.ct.includes('png') ? 'png' : dl.ct.includes('webp') ? 'webp' : 'jpg';
    const path = `destinations/${dest.id}.${ext}`;
    if (!(await uploadToStorage(path, dl.buf, dl.ct))) return { id: dest.id, title: dest.title, status: 'upload_failed' };
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    if (!(await updateRow(dest.id, publicUrl))) return { id: dest.id, title: dest.title, status: 'db_failed' };
    return { id: dest.id, title: dest.title, status: 'ok' };
  } catch (e) {
    return { id: dest.id, title: dest.title, status: 'error', error: String(e) };
  }
}

async function main() {
  const dests = await fetchDestinations();
  console.log(`Backfilling ${dests.length} destinations (concurrency=${concurrency})...`);
  const results = [];
  let next = 0;
  async function worker() {
    while (next < dests.length) {
      const i = next++;
      const r = await processOne(dests[i], i);
      results[i] = r;
      const done = results.filter(Boolean).length;
      if (r.status !== 'ok') process.stderr.write(`\n  [${r.status}] ${r.title}`);
      if (done % 10 === 0 || done === dests.length) process.stderr.write(`\r  progress ${done}/${dests.length}   `);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, dests.length || 1) }, worker));
  process.stderr.write('\n');
  const by = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  console.log('Done:', JSON.stringify(by, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
