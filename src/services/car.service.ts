/**
 * CAR RENTAL SERVICE
 * 
 * Client-side car rental search service.
 * Delegates to provider-manager.service.ts which calls the provider-manager edge function.
 * This file exists for module consistency — the actual search logic is in:
 *   - Hook: src/hooks/useProviderSearch.ts (useCarSearch)
 *   - Service: src/services/provider-manager.service.ts (searchCars)
 *   - Edge Function: supabase/functions/provider-manager/index.ts
 *   - Adapters: supabase/functions/_shared/providers/cars.ts
 */

import { providerManagerService } from './provider-manager.service';
import type { CarSearchParams } from '@/types/unified';

export class CarService {
  async search(params: CarSearchParams) {
    return providerManagerService.searchCars(params);
  }
}

export const carService = new CarService();
