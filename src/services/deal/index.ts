/**
 * DEAL SERVICE - Barrel Exports
 */

// Types
export type {
  DealType,
  DealBadge,
  AlertType,
  DealClick,
  CreateDealClickInput,
  SavedDeal,
  CreateSavedDealInput,
  DealSnapshot,
  FlightLegSnapshot,
  PriceAlert,
  CreatePriceAlertInput,
  CachedDeal,
  PriceHistoryPoint,
  AffiliateConfig,
  GenerateAffiliateLinkParams,
} from './deal.types';

export type { PersonalizedDeal } from './deal.service';

// Deal service
export {
  trackDealClick,
  confirmBooking,
  getRecentClicks,
  saveDeal,
  unsaveDeal,
  getSavedDeals,
  isDealSaved,
  getHotDeals,
  getPriceHistory,
  getPersonalizedDeals,
} from './deal.service';

// Affiliate service
export {
  getAffiliateConfigs,
  getProviderConfig,
  generateAffiliateLink,
  getProviderDisplayName,
  getProviderColor,
} from './affiliate.service';

// Price alert service
export {
  createPriceAlert,
  getUserAlerts,
  deactivateAlert,
  deleteAlert,
  hasAlertForRoute,
  buildFlightRouteKey,
  buildHotelRouteKey,
  buildCarRouteKey,
  buildExperienceRouteKey,
} from './price-alert.service';
