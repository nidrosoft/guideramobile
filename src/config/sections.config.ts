/**
 * SECTIONS CONFIGURATION
 * 
 * Centralized configuration for all homepage sections.
 * This makes it easy to add, remove, or reorder sections.
 */

export interface SectionConfig {
  id: number;
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
    title: 'See Our Deals',
    description: 'Exclusive offers just for you',
    viewAllRoute: '/deals/view-all',
    componentType: 'deals',
  },
  {
    id: 2,
    title: 'Popular Destinations',
    description: 'Trending places to visit',
    viewAllRoute: '/destinations/view-all',
    componentType: 'destinations',
  },
  {
    id: 3,
    title: 'Popular Places',
    description: 'Most visited attractions',
    viewAllRoute: '/places/view-all',
    componentType: 'places',
  },
  {
    id: 4,
    title: 'Events You May Like',
    description: 'Upcoming events near you',
    viewAllRoute: '/events/view-all',
    componentType: 'events',
  },
  {
    id: 5,
    title: 'You Must See',
    description: 'Iconic landmarks worldwide',
    viewAllRoute: '/must-see/view-all',
    componentType: 'mustSee',
  },
  {
    id: 6,
    title: "Editor's Choices",
    description: 'Handpicked by our experts',
    viewAllRoute: '/editor-choices/view-all',
    componentType: 'editorChoices',
  },
  {
    id: 7,
    title: 'Trending Locations',
    description: 'Hot spots right now',
    viewAllRoute: '/trending-locations/view-all',
    componentType: 'trending',
  },
  {
    id: 8,
    title: 'Best Discover',
    description: 'Hidden gems to explore',
    viewAllRoute: '/best-discover/view-all',
    componentType: 'bestDiscover',
  },
  {
    id: 9,
    title: 'Budget Friendly',
    description: 'Affordable travel options',
    viewAllRoute: '/budget-friendly/view-all',
    componentType: 'budgetFriendly',
  },
  {
    id: 10,
    title: 'Luxury Escapes',
    description: 'Premium experiences',
    viewAllRoute: '/luxury-escapes/view-all',
    componentType: 'luxuryEscapes',
  },
  {
    id: 11,
    title: 'Local Experiences',
    description: 'Authentic local activities',
    viewAllRoute: '/local-experiences/view-all',
    componentType: 'localExperiences',
  },
  {
    id: 12,
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
