/**
 * Journeys routes + deep-link helpers (spec §3.3), adapted to expo-router.
 * The actual route files live under src/app/journeys/*; this module only
 * knows the hrefs, keeping it navigation-agnostic.
 */
type Pushable = { push: (href: any) => void };

export const JOURNEYS_ROUTES = {
  Hub: '/journeys',
  Guide: '/journeys/guide',
  Search: '/journeys/search',
  Toolkit: '/journeys/toolkit',
  Chat: '/journeys/chat',
} as const;

export function openJourneysHub(router: Pushable, opts?: { categorySlug?: string; continent?: string }) {
  const qs = new URLSearchParams();
  if (opts?.categorySlug) qs.set('category', opts.categorySlug);
  if (opts?.continent) qs.set('continent', opts.continent);
  const q = qs.toString();
  router.push(`${JOURNEYS_ROUTES.Hub}${q ? `?${q}` : ''}`);
}

export function openJourney(router: Pushable, categorySlug: string) {
  openJourneysHub(router, { categorySlug });
}

export function openGuide(
  router: Pushable,
  categorySlug: string,
  countryCode: string,
  subhubSlug?: string
) {
  const qs = new URLSearchParams({ category: categorySlug, country: countryCode });
  if (subhubSlug) qs.set('subhub', subhubSlug);
  router.push(`${JOURNEYS_ROUTES.Guide}?${qs.toString()}`);
}

export function openToolkit(router: Pushable, opts?: { categorySlug?: string; countryCode?: string }) {
  const qs = new URLSearchParams();
  if (opts?.categorySlug) qs.set('category', opts.categorySlug);
  if (opts?.countryCode) qs.set('country', opts.countryCode);
  const q = qs.toString();
  router.push(`${JOURNEYS_ROUTES.Toolkit}${q ? `?${q}` : ''}`);
}

export function openChat(router: Pushable, categorySlug: string, countryCode: string) {
  const qs = new URLSearchParams({ category: categorySlug, country: countryCode });
  router.push(`${JOURNEYS_ROUTES.Chat}?${qs.toString()}`);
}
