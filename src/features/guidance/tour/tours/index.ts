/**
 * Tour definitions (spec §3.3). Copy lives in i18n under
 * guidance.tours.<tourId>.<stepId>.{title,body}.
 */
import type { Tour, TourId } from '../../types';

const k = (tour: string, step: string, kind: 'title' | 'body') =>
  `guidance.tours.${tour}.${step}.${kind}`;

export const heroTour: Tour = {
  id: 'hero',
  steps: [
    {
      id: 'welcome',
      anchorId: 'home.header',
      titleKey: k('hero', 'welcome', 'title'),
      bodyKey: k('hero', 'welcome', 'body'),
    },
    {
      id: 'search',
      anchorId: 'home.search',
      titleKey: k('hero', 'search', 'title'),
      bodyKey: k('hero', 'search', 'body'),
    },
    {
      id: 'deals',
      anchorId: 'home.section.deals',
      preAction: { type: 'scrollHomeToSection', sectionId: 'deals' },
      titleKey: k('hero', 'deals', 'title'),
      bodyKey: k('hero', 'deals', 'body'),
    },
    {
      id: 'journeys',
      anchorId: 'home.section.journeys',
      preAction: { type: 'scrollHomeToSection', sectionId: 'journeys' },
      titleKey: k('hero', 'journeys', 'title'),
      bodyKey: k('hero', 'journeys', 'body'),
    },
    {
      id: 'launcher',
      anchorId: 'tabbar.launcher',
      preAction: { type: 'scrollHomeToTop' },
      tapTargetToAdvance: true,
      titleKey: k('hero', 'launcher', 'title'),
      bodyKey: k('hero', 'launcher', 'body'),
    },
    {
      id: 'launcherSheet',
      anchorId: 'launcher.sheet',
      preAction: { type: 'openLauncher' },
      titleKey: k('hero', 'launcherSheet', 'title'),
      bodyKey: k('hero', 'launcherSheet', 'body'),
    },
    {
      id: 'trips',
      anchorId: 'tabbar.trips',
      preAction: { type: 'closeLauncher' },
      titleKey: k('hero', 'trips', 'title'),
      bodyKey: k('hero', 'trips', 'body'),
      ctaLabelKey: 'guidance.tours.hero.trips.cta',
      ctaRoute: '/account/travel-preferences?source=hero_tour',
    },
  ],
};

export const tripsTour: Tour = {
  id: 'trips',
  steps: [
    {
      id: 'create',
      anchorId: 'trips.createButton',
      titleKey: k('trips', 'create', 'title'),
      bodyKey: k('trips', 'create', 'body'),
    },
    {
      id: 'import',
      anchorId: 'tabbar.launcher',
      titleKey: k('trips', 'import', 'title'),
      bodyKey: k('trips', 'import', 'body'),
    },
    {
      id: 'states',
      anchorId: 'trips.stateTabs',
      titleKey: k('trips', 'states', 'title'),
      bodyKey: k('trips', 'states', 'body'),
      ctaLabelKey: 'guidance.tours.trips.states.cta',
    },
  ],
};

export const tripDetailTour: Tour = {
  id: 'tripDetail',
  steps: [
    {
      id: 'smartPlan',
      anchorId: 'trip.smartPlan',
      titleKey: k('tripDetail', 'smartPlan', 'title'),
      bodyKey: k('tripDetail', 'smartPlan', 'body'),
    },
    {
      id: 'modules',
      anchorId: 'trip.moduleGrid',
      titleKey: k('tripDetail', 'modules', 'title'),
      bodyKey: k('tripDetail', 'modules', 'body'),
    },
    {
      id: 'invite',
      anchorId: 'trip.invite',
      titleKey: k('tripDetail', 'invite', 'title'),
      bodyKey: k('tripDetail', 'invite', 'body'),
    },
    {
      id: 'snapshot',
      anchorId: 'trip.snapshot',
      titleKey: k('tripDetail', 'snapshot', 'title'),
      bodyKey: k('tripDetail', 'snapshot', 'body'),
      ctaLabelKey: 'guidance.tours.tripDetail.snapshot.cta',
    },
  ],
};

export const connectTour: Tour = {
  id: 'connect',
  steps: [
    {
      id: 'tabs',
      anchorId: 'connect.tabs',
      titleKey: k('connect', 'tabs', 'title'),
      bodyKey: k('connect', 'tabs', 'body'),
    },
    {
      id: 'pulse',
      anchorId: 'connect.pulse',
      titleKey: k('connect', 'pulse', 'title'),
      bodyKey: k('connect', 'pulse', 'body'),
    },
    {
      id: 'guides',
      anchorId: 'connect.guides',
      titleKey: k('connect', 'guides', 'title'),
      bodyKey: k('connect', 'guides', 'body'),
    },
  ],
};

export const journeysTour: Tour = {
  id: 'journeys',
  steps: [
    {
      id: 'categories',
      anchorId: 'journeys.categories',
      titleKey: k('journeys', 'categories', 'title'),
      bodyKey: k('journeys', 'categories', 'body'),
    },
    {
      id: 'briefing',
      anchorId: 'journeys.briefing',
      titleKey: k('journeys', 'briefing', 'title'),
      bodyKey: k('journeys', 'briefing', 'body'),
    },
  ],
};

export const searchTour: Tour = {
  id: 'search',
  steps: [
    {
      id: 'input',
      anchorId: 'search.input',
      titleKey: k('search', 'input', 'title'),
      bodyKey: k('search', 'input', 'body'),
    },
    {
      id: 'snapshotHint',
      anchorId: 'search.snapshotHint',
      titleKey: k('search', 'snapshotHint', 'title'),
      bodyKey: k('search', 'snapshotHint', 'body'),
    },
  ],
};

export const detailTour: Tour = {
  id: 'detail',
  steps: [
    { id: 'header', anchorId: 'detail.header', titleKey: k('detail', 'header', 'title'), bodyKey: k('detail', 'header', 'body') },
    { id: 'save', anchorId: 'detail.save', titleKey: k('detail', 'save', 'title'), bodyKey: k('detail', 'save', 'body') },
    { id: 'share', anchorId: 'detail.share', titleKey: k('detail', 'share', 'title'), bodyKey: k('detail', 'share', 'body') },
    { id: 'insights', anchorId: 'detail.insights', preAction: { type: 'scrollToAnchor', anchorId: 'detail.insights' }, titleKey: k('detail', 'insights', 'title'), bodyKey: k('detail', 'insights', 'body') },
    { id: 'practical', anchorId: 'detail.practical', preAction: { type: 'scrollToAnchor', anchorId: 'detail.practical' }, titleKey: k('detail', 'practical', 'title'), bodyKey: k('detail', 'practical', 'body') },
    { id: 'safety', anchorId: 'detail.safety', preAction: { type: 'scrollToAnchor', anchorId: 'detail.safety' }, titleKey: k('detail', 'safety', 'title'), bodyKey: k('detail', 'safety', 'body') },
    { id: 'creators', anchorId: 'detail.creators', preAction: { type: 'scrollToAnchor', anchorId: 'detail.creators' }, titleKey: k('detail', 'creators', 'title'), bodyKey: k('detail', 'creators', 'body') },
    { id: 'vibes', anchorId: 'detail.vibes', preAction: { type: 'scrollToAnchor', anchorId: 'detail.vibes' }, titleKey: k('detail', 'vibes', 'title'), bodyKey: k('detail', 'vibes', 'body') },
  ],
};

export const snapshotTour: Tour = {
  id: 'snapshot',
  steps: [
    { id: 'overview', anchorId: 'snapshot.overview', titleKey: k('snapshot', 'overview', 'title'), bodyKey: k('snapshot', 'overview', 'body') },
    { id: 'cost', anchorId: 'snapshot.cost', preAction: { type: 'scrollToAnchor', anchorId: 'snapshot.cost' }, titleKey: k('snapshot', 'cost', 'title'), bodyKey: k('snapshot', 'cost', 'body') },
    { id: 'weather', anchorId: 'snapshot.weather', preAction: { type: 'scrollToAnchor', anchorId: 'snapshot.weather' }, titleKey: k('snapshot', 'weather', 'title'), bodyKey: k('snapshot', 'weather', 'body') },
    { id: 'safety', anchorId: 'snapshot.safety', preAction: { type: 'scrollToAnchor', anchorId: 'snapshot.safety' }, titleKey: k('snapshot', 'safety', 'title'), bodyKey: k('snapshot', 'safety', 'body') },
    { id: 'cta', anchorId: 'snapshot.cta', preAction: { type: 'scrollToAnchor', anchorId: 'snapshot.cta' }, titleKey: k('snapshot', 'cta', 'title'), bodyKey: k('snapshot', 'cta', 'body') },
  ],
};

export const TOURS: Record<TourId, Tour> = {
  hero: heroTour,
  trips: tripsTour,
  tripDetail: tripDetailTour,
  connect: connectTour,
  journeys: journeysTour,
  search: searchTour,
  detail: detailTour,
  snapshot: snapshotTour,
};
