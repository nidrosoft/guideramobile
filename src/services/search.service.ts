/**
 * SEARCH SERVICE
 * 
 * Handles search functionality including:
 * - Recent searches storage
 * - Search suggestions
 * - Search results aggregation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@guidera_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface SearchResult {
  id: string;
  type: 'destination' | 'hotel' | 'flight' | 'experience' | 'place' | 'deal';
  title: string;
  subtitle: string;
  image: string;
  rating?: number;
  price?: number;
  currency?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'destination' | 'hotel' | 'experience' | 'recent';
  icon?: string;
}

export interface SearchFilters {
  category: 'all' | 'destinations' | 'hotels' | 'flights' | 'experiences' | 'deals';
  priceRange: 'all' | 'budget' | 'mid' | 'luxury';
  rating: number | null; // minimum rating (3, 4, 4.5)
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity';
}

export const DEFAULT_FILTERS: SearchFilters = {
  category: 'all',
  priceRange: 'all',
  rating: null,
  sortBy: 'relevance',
};

// Mock data for search results
const MOCK_DESTINATIONS: SearchResult[] = [
  {
    id: 'dest-1',
    type: 'destination',
    title: 'London',
    subtitle: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    rating: 4.8,
  },
  {
    id: 'dest-2',
    type: 'destination',
    title: 'Paris',
    subtitle: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    rating: 4.9,
  },
  {
    id: 'dest-3',
    type: 'destination',
    title: 'Tokyo',
    subtitle: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    rating: 4.7,
  },
  {
    id: 'dest-4',
    type: 'destination',
    title: 'New York',
    subtitle: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    rating: 4.6,
  },
  {
    id: 'dest-5',
    type: 'destination',
    title: 'Dubai',
    subtitle: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    rating: 4.5,
  },
  {
    id: 'dest-6',
    type: 'destination',
    title: 'Singapore',
    subtitle: 'Singapore',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
    rating: 4.8,
  },
];

const MOCK_HOTELS: SearchResult[] = [
  {
    id: 'hotel-1',
    type: 'hotel',
    title: 'The Ritz London',
    subtitle: '5-star luxury hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    rating: 4.9,
    price: 450,
    currency: 'USD',
    location: 'London, UK',
  },
  {
    id: 'hotel-2',
    type: 'hotel',
    title: 'Park Hyatt Tokyo',
    subtitle: '5-star hotel with city views',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    rating: 4.8,
    price: 380,
    currency: 'USD',
    location: 'Tokyo, Japan',
  },
  {
    id: 'hotel-3',
    type: 'hotel',
    title: 'Burj Al Arab',
    subtitle: '7-star iconic hotel',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
    rating: 5.0,
    price: 1200,
    currency: 'USD',
    location: 'Dubai, UAE',
  },
  {
    id: 'hotel-4',
    type: 'hotel',
    title: 'Marina Bay Sands',
    subtitle: 'Iconic rooftop infinity pool',
    image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=400',
    rating: 4.7,
    price: 320,
    currency: 'USD',
    location: 'Singapore',
  },
];

const MOCK_EXPERIENCES: SearchResult[] = [
  {
    id: 'exp-1',
    type: 'experience',
    title: 'London Eye Experience',
    subtitle: 'Iconic observation wheel',
    image: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=400',
    rating: 4.6,
    price: 35,
    currency: 'USD',
    location: 'London, UK',
  },
  {
    id: 'exp-2',
    type: 'experience',
    title: 'Tokyo Food Tour',
    subtitle: 'Authentic Japanese cuisine',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    rating: 4.9,
    price: 85,
    currency: 'USD',
    location: 'Tokyo, Japan',
  },
  {
    id: 'exp-3',
    type: 'experience',
    title: 'Desert Safari Dubai',
    subtitle: 'Dune bashing & BBQ dinner',
    image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=400',
    rating: 4.7,
    price: 65,
    currency: 'USD',
    location: 'Dubai, UAE',
  },
  {
    id: 'exp-4',
    type: 'experience',
    title: 'Eiffel Tower Skip-the-Line',
    subtitle: 'Summit access included',
    image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=400',
    rating: 4.8,
    price: 45,
    currency: 'USD',
    location: 'Paris, France',
  },
];

const MOCK_PLACES: SearchResult[] = [
  {
    id: 'place-1',
    type: 'place',
    title: 'Tower of London',
    subtitle: 'Historic castle & fortress',
    image: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400',
    rating: 4.7,
    location: 'London, UK',
  },
  {
    id: 'place-2',
    type: 'place',
    title: 'Louvre Museum',
    subtitle: 'World\'s largest art museum',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    rating: 4.8,
    location: 'Paris, France',
  },
  {
    id: 'place-3',
    type: 'place',
    title: 'Senso-ji Temple',
    subtitle: 'Ancient Buddhist temple',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
    rating: 4.6,
    location: 'Tokyo, Japan',
  },
  {
    id: 'place-4',
    type: 'place',
    title: 'Statue of Liberty',
    subtitle: 'Iconic American landmark',
    image: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=400',
    rating: 4.5,
    location: 'New York, USA',
  },
];

class SearchService {
  /**
   * Get recent searches from storage
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  /**
   * Add a search term to recent searches
   */
  async addRecentSearch(term: string): Promise<void> {
    try {
      const trimmed = term.trim();
      if (!trimmed) return;

      const recent = await this.getRecentSearches();
      
      // Remove if already exists (to move to top)
      const filtered = recent.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      
      // Add to beginning
      filtered.unshift(trimmed);
      
      // Keep only max items
      const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Error adding recent search:', error);
    }
  }

  /**
   * Remove a search term from recent searches
   */
  async removeRecentSearch(term: string): Promise<void> {
    try {
      const recent = await this.getRecentSearches();
      const filtered = recent.filter(s => s.toLowerCase() !== term.toLowerCase());
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  /**
   * Get search suggestions based on query
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const suggestions: SearchSuggestion[] = [];

    // Search destinations
    MOCK_DESTINATIONS.forEach(dest => {
      if (dest.title.toLowerCase().includes(trimmed) || 
          dest.subtitle.toLowerCase().includes(trimmed)) {
        suggestions.push({
          id: dest.id,
          text: `${dest.title}, ${dest.subtitle}`,
          type: 'destination',
        });
      }
    });

    // Search hotels
    MOCK_HOTELS.forEach(hotel => {
      if (hotel.title.toLowerCase().includes(trimmed) || 
          hotel.location?.toLowerCase().includes(trimmed)) {
        suggestions.push({
          id: hotel.id,
          text: hotel.title,
          type: 'hotel',
        });
      }
    });

    // Search experiences
    MOCK_EXPERIENCES.forEach(exp => {
      if (exp.title.toLowerCase().includes(trimmed) || 
          exp.location?.toLowerCase().includes(trimmed)) {
        suggestions.push({
          id: exp.id,
          text: exp.title,
          type: 'experience',
        });
      }
    });

    return suggestions.slice(0, 8);
  }

  /**
   * Search all content
   */
  async search(query: string, filters: SearchFilters = DEFAULT_FILTERS): Promise<{
    destinations: SearchResult[];
    hotels: SearchResult[];
    experiences: SearchResult[];
    places: SearchResult[];
    totalCount: number;
  }> {
    const trimmed = query.trim().toLowerCase();
    
    // Filter destinations
    let destinations = MOCK_DESTINATIONS.filter(dest => 
      dest.title.toLowerCase().includes(trimmed) || 
      dest.subtitle.toLowerCase().includes(trimmed)
    );

    // Filter hotels
    let hotels = MOCK_HOTELS.filter(hotel => 
      hotel.title.toLowerCase().includes(trimmed) || 
      hotel.location?.toLowerCase().includes(trimmed) ||
      hotel.subtitle.toLowerCase().includes(trimmed)
    );

    // Filter experiences
    let experiences = MOCK_EXPERIENCES.filter(exp => 
      exp.title.toLowerCase().includes(trimmed) || 
      exp.location?.toLowerCase().includes(trimmed) ||
      exp.subtitle.toLowerCase().includes(trimmed)
    );

    // Filter places
    let places = MOCK_PLACES.filter(place => 
      place.title.toLowerCase().includes(trimmed) || 
      place.location?.toLowerCase().includes(trimmed) ||
      place.subtitle.toLowerCase().includes(trimmed)
    );

    // Apply category filter
    if (filters.category !== 'all') {
      switch (filters.category) {
        case 'destinations':
          hotels = [];
          experiences = [];
          places = [];
          break;
        case 'hotels':
          destinations = [];
          experiences = [];
          places = [];
          break;
        case 'experiences':
          destinations = [];
          hotels = [];
          places = [];
          break;
      }
    }

    // Apply rating filter
    if (filters.rating) {
      destinations = destinations.filter(d => (d.rating || 0) >= filters.rating!);
      hotels = hotels.filter(h => (h.rating || 0) >= filters.rating!);
      experiences = experiences.filter(e => (e.rating || 0) >= filters.rating!);
      places = places.filter(p => (p.rating || 0) >= filters.rating!);
    }

    // Apply price filter for hotels and experiences
    if (filters.priceRange !== 'all') {
      const priceFilter = (item: SearchResult) => {
        if (!item.price) return true;
        switch (filters.priceRange) {
          case 'budget': return item.price < 100;
          case 'mid': return item.price >= 100 && item.price < 300;
          case 'luxury': return item.price >= 300;
          default: return true;
        }
      };
      hotels = hotels.filter(priceFilter);
      experiences = experiences.filter(priceFilter);
    }

    // Apply sorting
    const sortFn = (a: SearchResult, b: SearchResult) => {
      switch (filters.sortBy) {
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    };

    hotels.sort(sortFn);
    experiences.sort(sortFn);

    const totalCount = destinations.length + hotels.length + experiences.length + places.length;

    return {
      destinations,
      hotels,
      experiences,
      places,
      totalCount,
    };
  }

  /**
   * Get popular/trending searches
   */
  getPopularSearches(): string[] {
    return [
      'London',
      'Paris',
      'Tokyo',
      'New York',
      'Dubai',
      'Bali',
      'Singapore',
      'Barcelona',
    ];
  }
}

export const searchService = new SearchService();
