/**
 * SECTIONS CONFIGURATION
 *
 * Centralized configuration for all homepage sections.
 * This makes it easy to add, remove, or reorder sections.
 *
 * `titleKey` and `descriptionKey` are i18n translation keys resolved at
 * render time in SectionRenderer via `useTranslation()`.
 */

export interface SectionConfig {
  id: number;
  /** i18n key for the section title (e.g. "sections.deals.title") */
  titleKey: string;
  /** i18n key for the section description */
  descriptionKey: string;
  /** Hardcoded English fallback used when translation is missing */
  title: string;
  description: string;
  viewAllRoute: string;
  componentType: 'deals' | 'destinations' | 'places' | 'events' | 'mustSee' |
                 'editorChoices' | 'trending' | 'bestDiscover' | 'budgetFriendly' |
                 'luxuryEscapes' | 'localExperiences' | 'familyFriendly';
}

export const SECTIONS_CONFIG: SectionConfig[] = [
  {
    id: 1,
    titleKey: 'sections.deals.title',
    descriptionKey: 'sections.deals.description',
    title: 'See Our Deals',
    description: 'Exclusive offers just for you',
    viewAllRoute: '/deals/view-all',
    componentType: 'deals',
  },
  {
    id: 2,
    titleKey: 'sections.destinations.title',
    descriptionKey: 'sections.destinations.description',
    title: 'Popular Destinations',
    description: 'Trending places to visit',
    viewAllRoute: '/destinations/view-all',
    componentType: 'destinations',
  },
  {
    id: 3,
    titleKey: 'sections.places.title',
    descriptionKey: 'sections.places.description',
    title: 'Popular Places',
    description: 'Most visited attractions',
    viewAllRoute: '/places/view-all',
    componentType: 'places',
  },
  {
    id: 4,
    titleKey: 'sections.events.title',
    descriptionKey: 'sections.events.description',
    title: 'Events You May Like',
    description: 'Upcoming events near you',
    viewAllRoute: '/events/view-all',
    componentType: 'events',
  },
  {
    id: 5,
    titleKey: 'sections.mustSee.title',
    descriptionKey: 'sections.mustSee.description',
    title: 'You Must See',
    description: 'Iconic landmarks worldwide',
    viewAllRoute: '/must-see/view-all',
    componentType: 'mustSee',
  },
  {
    id: 6,
    titleKey: 'sections.editorChoices.title',
    descriptionKey: 'sections.editorChoices.description',
    title: "Editor's Choices",
    description: 'Handpicked by our experts',
    viewAllRoute: '/editor-choices/view-all',
    componentType: 'editorChoices',
  },
  {
    id: 7,
    titleKey: 'sections.trending.title',
    descriptionKey: 'sections.trending.description',
    title: 'Trending Locations',
    description: 'Hot spots right now',
    viewAllRoute: '/trending-locations/view-all',
    componentType: 'trending',
  },
  {
    id: 8,
    titleKey: 'sections.bestDiscover.title',
    descriptionKey: 'sections.bestDiscover.description',
    title: 'Best Discover',
    description: 'Hidden gems to explore',
    viewAllRoute: '/best-discover/view-all',
    componentType: 'bestDiscover',
  },
  {
    id: 9,
    titleKey: 'sections.budgetFriendly.title',
    descriptionKey: 'sections.budgetFriendly.description',
    title: 'Budget Friendly',
    description: 'Affordable travel options',
    viewAllRoute: '/budget-friendly/view-all',
    componentType: 'budgetFriendly',
  },
  {
    id: 10,
    titleKey: 'sections.luxuryEscapes.title',
    descriptionKey: 'sections.luxuryEscapes.description',
    title: 'Luxury Escapes',
    description: 'Premium experiences',
    viewAllRoute: '/luxury-escapes/view-all',
    componentType: 'luxuryEscapes',
  },
  {
    id: 11,
    titleKey: 'sections.localExperiences.title',
    descriptionKey: 'sections.localExperiences.description',
    title: 'Local Experiences',
    description: 'Authentic local activities',
    viewAllRoute: '/local-experiences/view-all',
    componentType: 'localExperiences',
  },
  {
    id: 12,
    titleKey: 'sections.familyFriendly.title',
    descriptionKey: 'sections.familyFriendly.description',
    title: 'Family Friendly',
    description: 'Perfect for all ages',
    viewAllRoute: '/family-friendly/view-all',
    componentType: 'familyFriendly',
  },
];

/**
 * Get section configuration by ID
 */
export const getSectionById = (id: number): SectionConfig | undefined => {
  return SECTIONS_CONFIG.find(section => section.id === id);
};

/**
 * Get section configuration by component type
 */
export const getSectionByType = (type: string): SectionConfig | undefined => {
  return SECTIONS_CONFIG.find(section => section.componentType === type);
};
