/**
 * FLIGHT SERVICE
 * 
 * Client-side flight search service.
 * Delegates to provider-manager.service.ts which calls the provider-manager edge function.
 * This file exists for module consistency — the actual search logic is in:
 *   - Hook: src/hooks/useProviderSearch.ts (useFlightSearch)
 *   - Service: src/services/provider-manager.service.ts (searchFlights)
 *   - Edge Function: supabase/functions/provider-manager/index.ts
 *   - Adapters: supabase/functions/_shared/providers/amadeus.ts, kiwi.ts
 */

import { providerManagerService } from './provider-manager.service';
import type { FlightSearchParams } from '@/types/unified';

export class FlightService {
  async search(params: FlightSearchParams) {
    return providerManagerService.searchFlights(params);
  }
}

export const flightService = new FlightService();
