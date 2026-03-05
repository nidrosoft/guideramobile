/**
 * HOTEL SERVICE
 * 
 * Client-side hotel search service.
 * Delegates to provider-manager.service.ts which calls the provider-manager edge function.
 * This file exists for module consistency — the actual search logic is in:
 *   - Hook: src/hooks/useProviderSearch.ts (useHotelSearch)
 *   - Service: src/services/provider-manager.service.ts (searchHotels)
 *   - Edge Function: supabase/functions/provider-manager/index.ts
 *   - Adapters: supabase/functions/_shared/providers/expedia.ts (Booking.com)
 */

import { providerManagerService } from './provider-manager.service';
import type { HotelSearchParams } from '@/types/unified';

export class HotelService {
  async search(params: HotelSearchParams) {
    return providerManagerService.searchHotels(params);
  }
}

export const hotelService = new HotelService();
