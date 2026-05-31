# Destination Search — Feature Plan & Process

**Status:** Exploration / not yet implemented
**Owner:** TBD
**Last updated:** May 30, 2026

> This document is intentionally kept at the project root (outside `docs/`) because it
> describes an in-flight feature we will return to. Move it into `docs/` once the
> feature ships.

---

## 1. The idea

Add a **search bar** on the homepage "View All" section screens (Popular Destinations,
Editor's Choices, Trending, etc.). Today each View All screen only shows a pre-curated
list filtered by continent. Users who want to look up a *specific* place — including one
we did not pre-select — have no way to do so.

When a user searches a city, we show them the **same rich destination detail page** that
curated destinations already use: hero gallery, visitor count, places to visit,
practical info, creator content, vibes, reviews, and "you might also like."

---

## 2. What already exists (no need to rebuild)

- **View All screens** — `src/components/common/SectionViewAll.tsx`, fed by
  `src/hooks/useSectionDestinations.ts`, reading the `curated_destinations` table
  (**201 published cities**). Continent filtering is client-side. No search bar yet.
- **Detail page** — `src/app/destinations/[id].tsx` + `DetailPageTemplate`. Needs a
  `curated_destinations` row (by `id`) and enriches it via:
  - `destination-details` edge function → Google Places (POIs, reviews, photos) +
    Gemini (safety + practical tips). Already has a **7-day DB cache**
    (`destination_detail_cache`), **request coalescing via edge locks**, **rate
    limiting**, and **metrics** (`edge_request_metrics`).
  - `CreatorsContentSection` → live TikTok by destination name.
  - `useEvents` → AI event discovery.
- **City autocomplete** — `google-api-proxy` already exposes a `places_autocomplete`
  action (`types=(cities)`) with in-memory + durable caching and rate limiting.

---

## 3. Cost reality (the main concern)

Because of the 7-day cache + edge-lock coalescing, **cost scales with the number of
distinct, never-cached cities opened per week — NOT with user count.** 500 users
opening "Paris" trigger exactly one live fetch (~3.3s measured), then everyone is served
from cache (~275ms measured).

Rough cost per **uncached** city detail (Google Places legacy pricing):

| Call | Volume | $/1k | Cost |
|---|---|---|---|
| Nearby Search | 3 | $32 | ~$0.096 |
| Text Search | 1–2 | $32 | ~$0.03–0.06 |
| Place Details (reviews) | ≤4 | $17 | ~$0.07 |
| Place Photo | ~15–23 | $7 | ~$0.11–0.16 |
| Gemini 2.0 Flash | 1 | — | ~$0.001 |

**≈ $0.30–0.45 per unique uncached city, once per 7 days. Photos dominate.**
Autocomplete is cheap/cached; AI is negligible. The only blow-up risk is the unbounded
long-tail of obscure places × the photo calls.

---

## 4. Proposed approach (cheapest → highest leverage)

1. **Two-tier search.**
   - *Tier 1 (free):* instant fuzzy search over the 201 curated cities already in
     memory, ranked by `popularity_score`. Covers ~90% of "find a popular place" intent
     with zero new API cost.
   - *Tier 2 (gated):* only when there's no curated match, show an explicit
     "Search {city} live →" affordance.
2. **Never call the heavy detail API on keystroke.** Autocomplete on type (cached);
   trigger the expensive detail fetch only on an explicit tap.
3. **Persist searched cities.** When a non-curated city is opened live, write a
   lightweight `curated_destinations` row (e.g. `status='user_generated'`) using lat/lng
   from the autocomplete selection. One-time cost becomes a permanent cache hit and grows
   the catalog organically.
4. **Cap photos at ~5** (from ~23) → cuts the dominant cost ~70%.
5. **Pre-warm the top ~200 curated cities** (only 17 are warm today) so popular searches
   are always cache hits.
6. **Tiered TTLs + global daily budget cap.** Static info (safety/practical) caches
   30–90 days; POIs/reviews shorter. Beyond a daily live-fetch cap, serve a lightweight
   "preview" (autocomplete + 1 photo + AI summary) and skip Places Details/Photos.

---

## 5. Implementation process (when we pick this up)

1. **Measure first.** Pull a 30-day breakdown from `edge_request_metrics`: distinct
   cities, true cache-hit rate, projected monthly Google spend. Decide go/no-go on the
   live tier with real numbers.
2. **Ship Tier 1 only.** Add the search bar to `SectionViewAll` doing client-side fuzzy
   ranking over already-loaded curated destinations. No backend work, no cost. Validate
   that users actually use search before spending on the live tier.
3. **Add autocomplete (Tier 2 entry).** Wire the search bar to `google-api-proxy`
   `places_autocomplete` with debounce; show "Search live" only on no curated match.
4. **Generalize the detail page for non-curated cities.** Either (a) create the
   lightweight `curated_destinations` row on selection so `/destinations/[id]` works
   unchanged, or (b) add a `place_id`-based path through `destination-details`.
5. **Add cost guardrails.** Photo cap, daily budget cap, per-user rate limit (infra
   already exists), tiered cache TTLs.
6. **Pre-warm + monitor.** Backfill detail cache for the top curated cities; watch
   `edge_request_metrics` hit-rate and spend dashboards post-launch.

---

## 6. Open questions

- Should the live tier be available to all users or gated (e.g. Pro / signed-in)?
- What's the acceptable monthly Google Places budget ceiling?
- Do we surface "live" results as full detail pages immediately, or as a preview that
  upgrades to full detail on a second tap (cheaper)?
