/**
 * AFFILIATE LINK SERVICE
 *
 * Generates affiliate/redirect URLs for each provider.
 * Handles deep link construction and tracking parameter injection.
 */

import { supabase } from '@/lib/supabase/client';
import type { AffiliateConfig, GenerateAffiliateLinkParams } from './deal.types';

let configCache: AffiliateConfig[] | null = null;
let configCacheExpiry = 0;

// ============================================
// CONFIG LOADING
// ============================================

export async function getAffiliateConfigs(): Promise<AffiliateConfig[]> {
  if (configCache && Date.now() < configCacheExpiry) {
    return configCache;
  }

  try {
    const { data, error } = await supabase
      .from('affiliate_config')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error || !data) return configCache || [];

    configCache = data;
    configCacheExpiry = Date.now() + 30 * 60 * 1000; // 30 min cache
    return data;
  } catch {
    return configCache || [];
  }
}

export async function getProviderConfig(
  provider: string
): Promise<AffiliateConfig | null> {
  const configs = await getAffiliateConfigs();
  return configs.find((c) => c.provider === provider) || null;
}

// ============================================
// LINK GENERATION
// ============================================

export function generateAffiliateLink(
  params: GenerateAffiliateLinkParams,
  config?: AffiliateConfig | null
): string {
  const { provider, deep_link } = params;

  // If provider returned a deep_link, use it directly
  // (Kiwi.com and Booking.com both do this)
  if (deep_link) {
    return injectAffiliateId(deep_link, provider, config?.affiliate_id);
  }

  // Construct URL from template
  if (config?.link_template) {
    return buildFromTemplate(config.link_template, params, config.affiliate_id);
  }

  // Fallback: construct provider-specific URLs
  return buildFallbackUrl(params);
}

function injectAffiliateId(
  url: string,
  provider: string,
  affiliateId?: string | null
): string {
  if (!affiliateId) return url;

  const separator = url.includes('?') ? '&' : '?';

  switch (provider) {
    case 'kiwi':
      return `${url}${separator}affid=${affiliateId}`;
    case 'booking':
      return `${url}${separator}aid=${affiliateId}`;
    default:
      return `${url}${separator}ref=${affiliateId}`;
  }
}

function buildFromTemplate(
  template: string,
  params: GenerateAffiliateLinkParams,
  affiliateId?: string | null
): string {
  let url = template;

  const replacements: Record<string, string | undefined> = {
    '{deep_link}': params.deep_link,
    '{origin}': params.origin,
    '{destination}': params.destination,
    '{date}': params.date,
    '{return_date}': params.return_date,
    '{query}': params.query ? encodeURIComponent(params.query) : undefined,
    '{location}': params.location
      ? encodeURIComponent(params.location)
      : undefined,
    '{affiliate_id}': affiliateId || '',
  };

  for (const [key, value] of Object.entries(replacements)) {
    if (value !== undefined) {
      url = url.replace(key, value);
    }
  }

  return url;
}

function buildFallbackUrl(params: GenerateAffiliateLinkParams): string {
  const { provider, origin, destination, date, return_date } = params;

  switch (provider) {
    case 'google_flights': {
      const parts = ['Flights'];
      if (origin) parts.push(`from ${origin}`);
      if (destination) parts.push(`to ${destination}`);
      if (date) parts.push(`on ${date}`);
      if (return_date) parts.push(`returning ${return_date}`);
      return `https://www.google.com/travel/flights?q=${encodeURIComponent(parts.join(' '))}`;
    }

    case 'kiwi':
      return `https://www.kiwi.com/en/search/results/${origin || ''}/${destination || ''}/${date || ''}`;

    case 'booking':
      return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination || '')}`;

    case 'rentalcars':
      return `https://www.rentalcars.com/search-results?location=${encodeURIComponent(params.location || destination || '')}`;

    case 'getyourguide':
      return `https://www.getyourguide.com/s/?q=${encodeURIComponent(params.query || destination || '')}`;

    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${destination} ${provider} deals`)}`;
  }
}

// ============================================
// PROVIDER DISPLAY HELPERS
// ============================================

export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    kiwi: 'Kiwi.com',
    booking: 'Booking.com',
    google_flights: 'Google Flights',
    amadeus: 'Amadeus',
    getyourguide: 'GetYourGuide',
    viator: 'Viator',
    rentalcars: 'Rentalcars.com',
  };
  return names[provider] || provider;
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    kiwi: '#00A991',
    booking: '#003580',
    google_flights: '#4285F4',
    getyourguide: '#FF5533',
    viator: '#2B1160',
    rentalcars: '#F7941D',
  };
  return colors[provider] || '#333333';
}
