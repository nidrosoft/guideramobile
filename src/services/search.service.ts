/**
 * SEARCH SERVICE
 * 
 * Handles search functionality including:
 * - Recent searches storage (AsyncStorage)
 * - Search suggestions (from curated_destinations)
 * - Search results aggregation (from Supabase)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase/client';

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
  rating: number | null;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity';
}

export const DEFAULT_FILTERS: SearchFilters = {
  category: 'all',
  priceRange: 'all',
  rating: null,
  sortBy: 'relevance',
};

class SearchService {
  /**
   * Get recent searches from storage
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
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
      const filtered = recent.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      filtered.unshift(trimmed);
      const limited = filtered.slice(0, MAX_RECENT_SEARCHES);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
    } catch { /* non-critical */ }
  }

  /**
   * Remove a search term from recent searches
   */
  async removeRecentSearch(term: string): Promise<void> {
    try {
      const recent = await this.getRecentSearches();
      const filtered = recent.filter(s => s.toLowerCase() !== term.toLowerCase());
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
    } catch { /* non-critical */ }
  }

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch { /* non-critical */ }
  }

  /**
   * Get search suggestions from curated_destinations
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    try {
      const { data } = await supabase
        .from('curated_destinations')
        .select('id, name, country')
        .or(`name.ilike.%${trimmed}%,country.ilike.%${trimmed}%`)
        .eq('status', 'active')
        .order('popularity_score', { ascending: false })
        .limit(8);

      return (data || []).map(d => ({
        id: d.id,
        text: `${d.name}, ${d.country}`,
        type: 'destination' as const,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Search all content from Supabase
   */
  async search(query: string, filters: SearchFilters = DEFAULT_FILTERS): Promise<{
    destinations: SearchResult[];
    hotels: SearchResult[];
    experiences: SearchResult[];
    places: SearchResult[];
    totalCount: number;
  }> {
    const trimmed = query.trim().toLowerCase();
    let destinations: SearchResult[] = [];
    let hotels: SearchResult[] = [];
    let experiences: SearchResult[] = [];
    let places: SearchResult[] = [];

    try {
      // Search curated destinations
      if (filters.category === 'all' || filters.category === 'destinations') {
        const { data } = await supabase
          .from('curated_destinations')
          .select('id, name, country, gallery_images, editor_rating, budget_level')
          .or(`name.ilike.%${trimmed}%,country.ilike.%${trimmed}%,tags.cs.{${trimmed}}`)
          .eq('status', 'active')
          .order('popularity_score', { ascending: false })
          .limit(10);

        destinations = (data || []).map(d => ({
          id: d.id,
          type: 'destination' as const,
          title: d.name,
          subtitle: d.country,
          image: d.gallery_images?.[0] || '',
          rating: Number(d.editor_rating) || 0,
        }));

        // Apply rating filter
        if (filters.rating) {
          destinations = destinations.filter(d => (d.rating || 0) >= filters.rating!);
        }
      }

      // Search deals from deal_cache
      if (filters.category === 'all' || filters.category === 'deals') {
        const { data } = await supabase
          .from('deal_cache')
          .select('id, title, destination_city, destination_country, price, currency, image_url, deal_type')
          .or(`title.ilike.%${trimmed}%,destination_city.ilike.%${trimmed}%,destination_country.ilike.%${trimmed}%`)
          .order('price', { ascending: true })
          .limit(10);

        // Map deals into the appropriate category based on deal_type
        (data || []).forEach(d => {
          const result: SearchResult = {
            id: d.id,
            type: d.deal_type === 'hotel' ? 'hotel' : d.deal_type === 'experience' ? 'experience' : 'deal',
            title: d.title || '',
            subtitle: `${d.destination_city}, ${d.destination_country}`,
            image: d.image_url || '',
            price: d.price,
            currency: d.currency || 'USD',
            location: `${d.destination_city}, ${d.destination_country}`,
          };
          if (d.deal_type === 'hotel' && (filters.category === 'all' || filters.category === 'hotels')) {
            hotels.push(result);
          } else if (d.deal_type === 'experience' && (filters.category === 'all' || filters.category === 'experiences')) {
            experiences.push(result);
          } else if (filters.category === 'all' || filters.category === 'deals') {
            places.push(result);
          }
        });
      }

      // Apply price filter
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
          case 'price_low': return (a.price || 0) - (b.price || 0);
          case 'price_high': return (b.price || 0) - (a.price || 0);
          case 'rating': return (b.rating || 0) - (a.rating || 0);
          default: return 0;
        }
      };
      hotels.sort(sortFn);
      experiences.sort(sortFn);
    } catch (err) {
      if (__DEV__) console.warn('Search failed:', err);
    }

    const totalCount = destinations.length + hotels.length + experiences.length + places.length;
    return { destinations, hotels, experiences, places, totalCount };
  }

  /**
   * Get popular/trending searches
   */
  getPopularSearches(): string[] {
    return ['London', 'Paris', 'Tokyo', 'New York', 'Dubai', 'Bali', 'Singapore', 'Barcelona'];
  }
}

export const searchService = new SearchService();
