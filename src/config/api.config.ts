/**
 * API CONFIGURATION
 * 
 * Central configuration for all API endpoints and services.
 * The app uses Supabase Edge Functions via provider-manager for all search operations.
 * Client-side services are thin wrappers around the provider-manager.service.
 */

export const apiConfig = {
  // Supabase Edge Function endpoints (called via supabase.functions.invoke)
  edgeFunctions: {
    providerManager: 'provider-manager',
    flightSearch: 'flight-search',
    hotelSearch: 'hotel-search',
    unifiedSearch: 'search',
    aiGeneration: 'ai-generation',
  },

  // Search defaults
  search: {
    defaultCurrency: 'USD',
    defaultLanguage: 'en',
    defaultLimit: 20,
    timeoutMs: 30000,
    maxRetries: 2,
  },

  // Provider configuration
  providers: {
    flights: ['amadeus', 'kiwi'],
    hotels: ['booking'],
    cars: ['booking_cars'],
    experiences: ['booking_attractions', 'getyourguide'],
  },

  // Affiliate/redirect configuration
  affiliate: {
    providers: {
      kiwi: { name: 'Kiwi.com', color: '#00A991' },
      booking: { name: 'Booking.com', color: '#003580' },
      google_flights: { name: 'Google Flights', color: '#4285F4' },
      rentalcars: { name: 'Rentalcars.com', color: '#FF6B00' },
      getyourguide: { name: 'GetYourGuide', color: '#FF5533' },
      expedia: { name: 'Expedia', color: '#00355F' },
    },
  },

  // Cache settings
  cache: {
    searchTtlSeconds: 900, // 15 minutes
    destinationTtlSeconds: 86400, // 24 hours
  },
};
