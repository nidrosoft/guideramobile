/**
 * CITY NAVIGATOR CATEGORY UTILITIES
 * 
 * Color and icon mappings for POI categories.
 * Extracted from mock data file for production use.
 */

/**
 * Get category icon name for iconsax
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    landmark: 'building-4',
    restaurant: 'reserve',
    cafe: 'coffee',
    hotel: 'building',
    museum: 'gallery',
    park: 'tree',
    shopping: 'bag-2',
    transport: 'bus',
    attraction: 'star',
    nightlife: 'music',
    health: 'hospital',
    service: 'setting-2',
  };
  return icons[category] || 'location';
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    landmark: '#7257FF',
    restaurant: '#EF4444',
    cafe: '#F59E0B',
    hotel: '#3B82F6',
    museum: '#8B5CF6',
    park: '#10B981',
    shopping: '#EC4899',
    transport: '#6366F1',
    attraction: '#F97316',
    nightlife: '#A855F7',
    health: '#14B8A6',
    service: '#6B7280',
  };
  return categoryColors[category] || '#7257FF';
}
