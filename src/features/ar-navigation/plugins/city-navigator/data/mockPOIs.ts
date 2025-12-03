/**
 * MOCK POI DATA
 * 
 * Sample points of interest for the City Navigator.
 * POIs are generated RELATIVE to user's location for demo purposes.
 * In production, this would come from Google Places API.
 */

import { POI, DangerZone, Coordinates } from '../types/cityNavigator.types';

// POI templates - coordinates will be offset from user location
const POI_TEMPLATES = [
  {
    id: 'poi-1',
    name: 'City Art Museum',
    category: 'museum' as const,
    address: 'Main Street',
    rating: 4.9,
    reviewCount: 12200,
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    description: 'World-class art museum with stunning collections',
    openingHours: '9:00 AM - 6:00 PM',
    priceLevel: 2 as const,
    isOpen: true,
    tags: ['art', 'history', 'culture'],
    offset: { lat: 0.003, lng: 0.002 }, // ~300m away
  },
  {
    id: 'poi-2',
    name: 'Historic Cathedral',
    category: 'landmark' as const,
    address: 'Cathedral Square',
    rating: 4.8,
    reviewCount: 8500,
    imageUrl: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400',
    description: 'Beautiful historic cathedral with stunning architecture',
    openingHours: '6:00 AM - 10:30 PM',
    isOpen: true,
    tags: ['church', 'viewpoint', 'architecture'],
    offset: { lat: -0.002, lng: 0.004 },
  },
  {
    id: 'poi-3',
    name: 'Sunrise Café',
    category: 'cafe' as const,
    address: 'Oak Avenue',
    rating: 4.3,
    reviewCount: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    description: 'Cozy café with amazing coffee and pastries',
    openingHours: '7:00 AM - 10:00 PM',
    priceLevel: 2 as const,
    isOpen: true,
    tags: ['coffee', 'breakfast', 'cozy'],
    offset: { lat: 0.001, lng: -0.002 },
  },
  {
    id: 'poi-4',
    name: 'The Jazz Club',
    category: 'nightlife' as const,
    address: 'Downtown Boulevard',
    rating: 4.5,
    reviewCount: 5600,
    imageUrl: 'https://images.unsplash.com/photo-1551634979-2b11f8c946fe?w=400',
    description: 'Live jazz music and great cocktails',
    openingHours: '7:00 PM - 2:00 AM',
    priceLevel: 3 as const,
    isOpen: false,
    tags: ['entertainment', 'music', 'nightlife'],
    offset: { lat: -0.003, lng: -0.001 },
  },
  {
    id: 'poi-5',
    name: 'Central Park',
    category: 'park' as const,
    address: 'Park Lane',
    rating: 4.7,
    reviewCount: 3200,
    description: 'Beautiful urban park with walking trails',
    isOpen: true,
    tags: ['nature', 'walking', 'relaxation'],
    offset: { lat: 0.002, lng: -0.003 },
  },
  {
    id: 'poi-6',
    name: 'Bella Italia',
    category: 'restaurant' as const,
    address: 'Restaurant Row',
    rating: 4.4,
    reviewCount: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    description: 'Authentic Italian cuisine in a cozy setting',
    openingHours: '12:00 PM - 11:00 PM',
    priceLevel: 3 as const,
    isOpen: true,
    tags: ['italian', 'pasta', 'wine'],
    offset: { lat: -0.001, lng: 0.003 },
  },
  {
    id: 'poi-7',
    name: 'City Library',
    category: 'landmark' as const,
    address: 'Library Street',
    rating: 4.6,
    reviewCount: 1200,
    description: 'Historic library with rare book collections',
    openingHours: '8:00 AM - 8:00 PM',
    isOpen: true,
    tags: ['books', 'history', 'quiet'],
    offset: { lat: 0.004, lng: 0.001 },
  },
  {
    id: 'poi-8',
    name: 'Metro Station',
    category: 'transport' as const,
    address: 'Transit Plaza',
    rating: 4.1,
    reviewCount: 500,
    description: 'Main transit hub with multiple lines',
    isOpen: true,
    tags: ['metro', 'transport', 'transit'],
    offset: { lat: -0.001, lng: -0.001 },
  },
  {
    id: 'poi-9',
    name: 'Artisan Market',
    category: 'shopping' as const,
    address: 'Market Square',
    rating: 4.5,
    reviewCount: 2800,
    imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400',
    description: 'Local artisan goods and handmade crafts',
    openingHours: '10:00 AM - 6:00 PM',
    priceLevel: 2 as const,
    isOpen: true,
    tags: ['shopping', 'local', 'crafts'],
    offset: { lat: 0.002, lng: 0.002 },
  },
  {
    id: 'poi-10',
    name: 'Viewpoint Tower',
    category: 'attraction' as const,
    address: 'Tower Hill',
    rating: 4.8,
    reviewCount: 9500,
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',
    description: 'Panoramic city views from observation deck',
    openingHours: '10:00 AM - 10:00 PM',
    priceLevel: 2 as const,
    isOpen: true,
    tags: ['views', 'photography', 'landmark'],
    offset: { lat: -0.004, lng: 0.002 },
  },
];

/**
 * Generate POIs around a given location
 */
export function generatePOIsAroundLocation(userLocation: Coordinates): POI[] {
  return POI_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name,
    category: template.category,
    coordinates: {
      latitude: userLocation.latitude + template.offset.lat,
      longitude: userLocation.longitude + template.offset.lng,
    },
    address: template.address,
    city: 'Current City',
    country: 'Current Country',
    rating: template.rating,
    reviewCount: template.reviewCount,
    imageUrl: template.imageUrl,
    description: template.description,
    openingHours: template.openingHours,
    priceLevel: template.priceLevel,
    isOpen: template.isOpen,
    tags: template.tags,
  }));
}

/**
 * Generate danger zones around a given location
 */
export function generateDangerZonesAroundLocation(userLocation: Coordinates): DangerZone[] {
  return [
    {
      id: 'danger-1',
      coordinates: {
        latitude: userLocation.latitude + 0.003,
        longitude: userLocation.longitude - 0.002,
      },
      radius: 150,
      level: 'medium',
      type: 'scam',
      description: 'Tourist scam hotspot - beware of petition scammers',
      reportCount: 45,
      lastReported: new Date(),
    },
    {
      id: 'danger-2',
      coordinates: {
        latitude: userLocation.latitude - 0.002,
        longitude: userLocation.longitude + 0.003,
      },
      radius: 200,
      level: 'high',
      type: 'crime',
      description: 'Pickpocket activity reported - keep valuables secure',
      reportCount: 78,
      lastReported: new Date(),
    },
    {
      id: 'danger-3',
      coordinates: {
        latitude: userLocation.latitude + 0.001,
        longitude: userLocation.longitude + 0.004,
      },
      radius: 100,
      level: 'low',
      type: 'unsafe_area',
      description: 'Poorly lit area at night - use caution after dark',
      reportCount: 12,
      lastReported: new Date(),
    },
  ];
}

// Legacy exports for backwards compatibility (will use default Paris location)
export const MOCK_POIS: POI[] = generatePOIsAroundLocation({ latitude: 48.8566, longitude: 2.3522 });
export const MOCK_DANGER_ZONES: DangerZone[] = generateDangerZonesAroundLocation({ latitude: 48.8566, longitude: 2.3522 });

// Get category icon name
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

// Get category color
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
