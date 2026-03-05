/**
 * CATEGORY FILTER UTILITY
 * 
 * Shared helper for filtering homepage content items by category pill selection.
 * Matches against tags, category fields, section slugs, and deal types.
 */

/**
 * Category keyword mappings — each pill ID maps to keywords that match
 * against item tags, categories, names, and locations.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  museum: ['museum', 'art', 'gallery', 'history', 'cultural', 'heritage', 'exhibition'],
  safari: ['safari', 'wildlife', 'jungle', 'nature', 'national park', 'animal', 'reserve'],
  mountain: ['mountain', 'hiking', 'trekking', 'alpine', 'summit', 'hill', 'volcano', 'canyon'],
  beach: ['beach', 'coastal', 'ocean', 'island', 'seaside', 'marine', 'snorkeling', 'diving', 'surf'],
  adventure: ['adventure', 'extreme', 'outdoor', 'rafting', 'climbing', 'zipline', 'paragliding', 'skydiving', 'bungee'],
  food: ['food', 'culinary', 'restaurant', 'cuisine', 'cooking', 'gastronomy', 'wine', 'market', 'tasting', 'street food'],
  shopping: ['shopping', 'market', 'bazaar', 'mall', 'boutique', 'souvenir', 'retail'],
  events: ['event', 'festival', 'concert', 'show', 'performance', 'carnival', 'celebration'],
  family: ['family', 'kid', 'children', 'child', 'theme park', 'amusement', 'zoo', 'aquarium', 'playground', 'waterpark', 'family-friendly', 'kid-friendly'],
  nature: ['nature', 'forest', 'lake', 'waterfall', 'river', 'botanical', 'garden', 'park', 'scenic', 'landscape', 'countryside', 'valley', 'wilderness', 'eco', 'flora', 'fauna'],
  historical: ['historical', 'ancient', 'ruins', 'castle', 'palace', 'temple', 'shrine', 'church', 'cathedral', 'monument', 'archaeological', 'unesco', 'heritage site', 'medieval', 'fortress', 'old town', 'colonial'],
  nightlife: ['nightlife', 'club', 'bar', 'pub', 'lounge', 'rooftop', 'dj', 'late night', 'party', 'disco'],
  wellness: ['spa', 'wellness', 'yoga', 'meditation', 'retreat', 'hot spring', 'thermal', 'massage', 'relaxation', 'zen', 'healing', 'ayurveda'],
  tours: ['tour', 'sightseeing', 'guided', 'walking tour', 'city tour', 'day trip', 'excursion', 'cruise', 'boat tour', 'bus tour', 'hop-on', 'private tour'],
  romantic: ['romantic', 'couple', 'honeymoon', 'valentine', 'intimate', 'candlelight', 'sunset', 'boutique hotel', 'getaway', 'anniversary'],
  sports: ['sport', 'stadium', 'football', 'soccer', 'basketball', 'golf', 'tennis', 'skiing', 'ski', 'snowboard', 'marathon', 'race', 'surfing', 'cricket', 'rugby', 'swimming', 'cycling', 'fitness'],
};

/**
 * Check if a single item matches the active category.
 * Works with ContentItem shape or any object with tags/category/name fields.
 */
export function matchesCategory(
  item: {
    tags?: string[];
    category?: string;
    title?: string;
    name?: string;
    type?: string;
    deal_type?: string;
    bestFor?: string[];
  },
  activeCategory: string
): boolean {
  if (activeCategory === 'all') return true;

  const keywords = CATEGORY_KEYWORDS[activeCategory];
  if (!keywords) return true;

  // Check tags array
  if (item.tags?.length) {
    const tagsLower = item.tags.map(t => t.toLowerCase());
    if (keywords.some(kw => tagsLower.some(tag => tag.includes(kw)))) return true;
  }

  // Check category field
  if (item.category) {
    const catLower = item.category.toLowerCase();
    if (keywords.some(kw => catLower.includes(kw))) return true;
  }

  // Check bestFor array (e.g. ['families', 'couples'])
  if (item.bestFor?.length) {
    const bestLower = item.bestFor.map(b => b.toLowerCase());
    if (keywords.some(kw => bestLower.some(b => b.includes(kw)))) return true;
  }

  // Check title/name
  const text = (item.title || item.name || '').toLowerCase();
  if (keywords.some(kw => text.includes(kw))) return true;

  // Check deal type for "events" → "experience"
  if (activeCategory === 'events' && (item.type === 'experience' || item.deal_type === 'experience')) {
    return true;
  }

  return false;
}

/**
 * Filter an array of items by the active category.
 * Returns the full array if activeCategory is 'all'.
 */
export function filterByCategory<T extends { tags?: string[]; category?: string; title?: string; name?: string; type?: string; bestFor?: string[] }>(
  items: T[],
  activeCategory: string
): T[] {
  if (activeCategory === 'all') return items;
  return items.filter(item => matchesCategory(item, activeCategory));
}
