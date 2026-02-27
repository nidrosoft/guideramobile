/**
 * CART TYPES
 * 
 * Type definitions for the shopping cart system.
 */

// ============================================
// CART TYPES
// ============================================

export type CartStatus = 'active' | 'checkout' | 'completed' | 'abandoned' | 'expired';
export type CartItemStatus = 'active' | 'removed' | 'unavailable' | 'price_changed';
export type CartItemCategory = 'flight' | 'hotel' | 'car' | 'experience';

export interface Cart {
  id: string;
  user_id: string | null;
  session_token: string | null;
  status: CartStatus;
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  promo_code: string | null;
  promo_discount: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
  checkout_started_at: string | null;
  checkout_completed_at: string | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  category: CartItemCategory;
  provider_code: string;
  provider_offer_id: string;
  offer_snapshot: any;
  price_amount: number;
  price_currency: string;
  price_breakdown: PriceBreakdown | null;
  quantity: number;
  traveler_indices: number[] | null;
  room_index: number | null;
  status: CartItemStatus;
  price_verified_at: string | null;
  verified_price: number | null;
  price_changed: boolean;
  price_change_amount: number | null;
  added_at: string;
  updated_at: string;
}

export interface PriceBreakdown {
  base: number;
  taxes: number;
  fees: number;
  discount?: number;
  items?: {
    description: string;
    amount: number;
    type: 'base' | 'tax' | 'fee' | 'discount';
  }[];
}

export interface CartWithItems extends Cart {
  items: CartItem[];
}

export interface CartTotals {
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  itemCount: number;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateCartRequest {
  userId?: string;
  sessionToken?: string;
  currency?: string;
}

export interface AddToCartRequest {
  category: CartItemCategory;
  providerCode: string;
  providerOfferId: string;
  offerSnapshot: any;
  priceAmount: number;
  priceCurrency: string;
  priceBreakdown?: PriceBreakdown;
  quantity?: number;
  travelerIndices?: number[];
  roomIndex?: number;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  travelerIndices?: number[];
  roomIndex?: number;
}

export interface ApplyPromoRequest {
  promoCode: string;
}

export interface CartOperationResult {
  success: boolean;
  cart?: CartWithItems;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// CART ITEM DISPLAY HELPERS
// ============================================

export interface CartItemDisplay {
  id: string;
  category: CartItemCategory;
  title: string;
  subtitle: string;
  imageUrl?: string;
  price: number;
  currency: string;
  details: CartItemDetails;
  status: CartItemStatus;
  priceChanged: boolean;
  priceChangeAmount?: number;
}

export interface CartItemDetails {
  // Flight
  airline?: string;
  flightNumber?: string;
  departure?: { airport: string; time: string; date: string };
  arrival?: { airport: string; time: string; date: string };
  cabinClass?: string;
  stops?: number;
  
  // Hotel
  hotelName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  
  // Car
  carType?: string;
  carCompany?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  dropoffDate?: string;
  
  // Experience
  experienceName?: string;
  experienceDate?: string;
  experienceTime?: string;
  duration?: string;
  participants?: number;
}
