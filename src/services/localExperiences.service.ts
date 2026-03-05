/**
 * LOCAL EXPERIENCES SERVICE
 * 
 * Client-side service for fetching local experiences from the
 * local-experiences Edge Function (backed by Viator Partner API).
 */

import { supabase } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────

export interface LocalExperience {
  id: string;
  productCode: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  heroImage: string;
  images: Array<{ url: string; caption?: string }>;
  duration: {
    value: number;
    unit: 'hours' | 'minutes' | 'days';
    formatted: string;
  };
  rating: {
    score: number;
    maxScore: number;
    reviewCount: number;
  };
  price: {
    amount: number;
    currency: string;
    formatted: string;
    perPerson: boolean;
    originalPrice?: number;
    discountPercent?: number;
  };
  location: {
    city: string;
    country: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  freeCancellation: boolean;
  instantConfirmation: boolean;
  bookingUrl: string;
  tags: string[];
  tagIds?: number[];
  maxGroupSize?: number;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  languages: string[];
}

export interface ExperienceCategory {
  tagId: number | null;
  name: string;
}

// ─── Service ──────────────────────────────────────

class LocalExperiencesService {
  private categoriesCache: ExperienceCategory[] | null = null;
  private experienceCache = new Map<string, LocalExperience>();

  /**
   * Search experiences by city with optional category filter.
   */
  async searchExperiences(params: {
    city: string;
    lat?: number;
    lng?: number;
    tagId?: number | null;
    limit?: number;
    start?: number;
    sortBy?: 'default' | 'price' | 'rating';
  }): Promise<{ experiences: LocalExperience[]; total: number; searchedCity: string; usedFallback: boolean }> {
    const { data, error } = await supabase.functions.invoke('local-experiences', {
      body: {
        action: 'search',
        city: params.city,
        lat: params.lat,
        lng: params.lng,
        tagId: params.tagId || undefined,
        limit: params.limit || 15,
        start: params.start || 1,
        sortBy: params.sortBy || 'default',
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Search failed');

    const experiences: LocalExperience[] = data.experiences || [];

    // Cache each experience by productCode for fast detail lookups
    for (const exp of experiences) {
      if (exp.productCode) {
        this.experienceCache.set(exp.productCode, exp);
      }
    }

    return {
      experiences,
      total: data.total || 0,
      searchedCity: data.searchedCity || params.city,
      usedFallback: data.usedFallback || false,
    };
  }

  /**
   * Get available experience categories (Viator tags).
   * Cached after first call.
   */
  async getCategories(): Promise<ExperienceCategory[]> {
    if (this.categoriesCache) return this.categoriesCache;

    const { data, error } = await supabase.functions.invoke('local-experiences', {
      body: { action: 'categories' },
    });

    if (error) {
      console.warn('Failed to fetch categories:', error);
      return this.getFallbackCategories();
    }

    if (!data?.success || !data?.categories?.length) {
      return this.getFallbackCategories();
    }

    this.categoriesCache = data.categories;
    return this.categoriesCache!;
  }

  /**
   * Get detailed info for a single experience.
   * Tries the API first for full data (all images, highlights, inclusions),
   * then falls back to cached search data if API fails.
   */
  async getExperienceDetail(productCode: string): Promise<LocalExperience | null> {
    const cached = this.experienceCache.get(productCode);

    try {
      // Always try API for the richest data (all images, full descriptions)
      const { data, error } = await supabase.functions.invoke('local-experiences', {
        body: { action: 'detail', productCode },
      });

      if (!error && data?.experience) {
        const experience = data.experience;
        this.experienceCache.set(experience.productCode, experience);
        return experience;
      }
    } catch (err) {
      console.warn('Detail API failed, using cache:', err);
    }

    // Fall back to cached search data
    return cached || null;
  }

  /**
   * Clear cached categories (e.g., on language change).
   */
  clearCache() {
    this.categoriesCache = null;
    this.experienceCache.clear();
  }

  /**
   * Fallback categories if the API call fails.
   * These are common Viator top-level categories.
   */
  private getFallbackCategories(): ExperienceCategory[] {
    return [
      { tagId: null, name: 'All' },
      { tagId: 21972, name: 'Tours & Sightseeing' },
      { tagId: 11889, name: 'Outdoor & Nature' },
      { tagId: 21486, name: 'Food & Drink' },
      { tagId: 21480, name: 'Water Activities' },
      { tagId: 21484, name: 'Day Trips' },
      { tagId: 21514, name: 'Shows & Entertainment' },
    ];
  }
}

export const localExperiencesService = new LocalExperiencesService();
