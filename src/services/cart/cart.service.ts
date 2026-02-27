/**
 * CART SERVICE
 * 
 * Manages shopping cart operations for the checkout system.
 * Handles cart creation, item management, and totals calculation.
 */

import { supabase } from '@/lib/supabase/client';
import {
  Cart,
  CartItem,
  CartWithItems,
  CartTotals,
  CartStatus,
  CartItemStatus,
  CreateCartRequest,
  AddToCartRequest,
  UpdateCartItemRequest,
  CartOperationResult,
  CartItemDisplay,
} from './cart.types';

// ============================================
// CONSTANTS
// ============================================

const CART_EXPIRY_HOURS = 24;
const MAX_CART_ITEMS = 20;

// ============================================
// CART OPERATIONS
// ============================================

/**
 * Create a new cart
 */
export async function createCart(request: CreateCartRequest): Promise<CartOperationResult> {
  try {
    const { userId, sessionToken, currency = 'USD' } = request;

    // Check for existing active cart
    if (userId) {
      const existingCart = await getActiveCartByUser(userId);
      if (existingCart) {
        return { success: true, cart: existingCart };
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CART_EXPIRY_HOURS);

    const { data, error } = await supabase
      .from('carts')
      .insert({
        user_id: userId || null,
        session_token: sessionToken || null,
        status: 'active',
        currency,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      cart: { ...data, items: [] } as CartWithItems,
    };
  } catch (error: any) {
    console.error('Create cart error:', error);
    return {
      success: false,
      error: { code: 'CREATE_CART_FAILED', message: error.message },
    };
  }
}

/**
 * Get cart by ID with items
 */
export async function getCart(cartId: string): Promise<CartWithItems | null> {
  try {
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single();

    if (cartError || !cart) return null;

    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('status', 'active')
      .order('added_at', { ascending: true });

    if (itemsError) throw itemsError;

    return { ...cart, items: items || [] } as CartWithItems;
  } catch (error) {
    console.error('Get cart error:', error);
    return null;
  }
}

/**
 * Get active cart for user
 */
export async function getActiveCartByUser(userId: string): Promise<CartWithItems | null> {
  try {
    const { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !cart) return null;

    return getCart(cart.id);
  } catch (error) {
    console.error('Get active cart error:', error);
    return null;
  }
}

/**
 * Get or create cart for user
 */
export async function getOrCreateCart(userId: string): Promise<CartOperationResult> {
  const existingCart = await getActiveCartByUser(userId);
  if (existingCart) {
    return { success: true, cart: existingCart };
  }
  return createCart({ userId });
}

/**
 * Add item to cart
 */
export async function addToCart(
  cartId: string,
  request: AddToCartRequest
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(cartId);
    if (!cart) {
      return {
        success: false,
        error: { code: 'CART_NOT_FOUND', message: 'Cart not found' },
      };
    }

    // Check cart status
    if (cart.status !== 'active') {
      return {
        success: false,
        error: { code: 'CART_NOT_ACTIVE', message: 'Cart is not active' },
      };
    }

    // Check cart expiry
    if (new Date(cart.expires_at) < new Date()) {
      return {
        success: false,
        error: { code: 'CART_EXPIRED', message: 'Cart has expired' },
      };
    }

    // Check max items
    if (cart.items.length >= MAX_CART_ITEMS) {
      return {
        success: false,
        error: { code: 'CART_FULL', message: 'Cart has reached maximum items' },
      };
    }

    // Check for duplicate offer
    const existingItem = cart.items.find(
      (item) =>
        item.provider_code === request.providerCode &&
        item.provider_offer_id === request.providerOfferId
    );

    if (existingItem) {
      // Update quantity instead of adding duplicate
      return updateCartItem(cartId, existingItem.id, {
        quantity: (existingItem.quantity || 1) + (request.quantity || 1),
      });
    }

    // Add new item
    const { data: newItem, error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        category: request.category,
        provider_code: request.providerCode,
        provider_offer_id: request.providerOfferId,
        offer_snapshot: request.offerSnapshot,
        price_amount: request.priceAmount,
        price_currency: request.priceCurrency,
        price_breakdown: request.priceBreakdown || null,
        quantity: request.quantity || 1,
        traveler_indices: request.travelerIndices || null,
        room_index: request.roomIndex || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate totals
    await recalculateCartTotals(cartId);

    // Return updated cart
    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Add to cart error:', error);
    return {
      success: false,
      error: { code: 'ADD_TO_CART_FAILED', message: error.message },
    };
  }
}

/**
 * Update cart item
 */
export async function updateCartItem(
  cartId: string,
  itemId: string,
  updates: UpdateCartItemRequest
): Promise<CartOperationResult> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({
        ...updates,
        traveler_indices: updates.travelerIndices,
        room_index: updates.roomIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('cart_id', cartId);

    if (error) throw error;

    await recalculateCartTotals(cartId);

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Update cart item error:', error);
    return {
      success: false,
      error: { code: 'UPDATE_ITEM_FAILED', message: error.message },
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartId: string,
  itemId: string
): Promise<CartOperationResult> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('cart_id', cartId);

    if (error) throw error;

    await recalculateCartTotals(cartId);

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Remove from cart error:', error);
    return {
      success: false,
      error: { code: 'REMOVE_ITEM_FAILED', message: error.message },
    };
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(cartId: string): Promise<CartOperationResult> {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('cart_id', cartId)
      .eq('status', 'active');

    if (error) throw error;

    await recalculateCartTotals(cartId);

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Clear cart error:', error);
    return {
      success: false,
      error: { code: 'CLEAR_CART_FAILED', message: error.message },
    };
  }
}

/**
 * Update cart status
 */
export async function updateCartStatus(
  cartId: string,
  status: CartStatus
): Promise<CartOperationResult> {
  try {
    const updates: Partial<Cart> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'checkout') {
      updates.checkout_started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.checkout_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('carts')
      .update(updates)
      .eq('id', cartId);

    if (error) throw error;

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Update cart status error:', error);
    return {
      success: false,
      error: { code: 'UPDATE_STATUS_FAILED', message: error.message },
    };
  }
}

// ============================================
// TOTALS CALCULATION
// ============================================

/**
 * Calculate cart totals
 */
export async function calculateCartTotals(cartId: string): Promise<CartTotals | null> {
  try {
    const cart = await getCart(cartId);
    if (!cart) return null;

    let subtotal = 0;
    let taxes = 0;
    let fees = 0;

    for (const item of cart.items) {
      const quantity = item.quantity || 1;
      subtotal += item.price_amount * quantity;

      if (item.price_breakdown) {
        taxes += (item.price_breakdown.taxes || 0) * quantity;
        fees += (item.price_breakdown.fees || 0) * quantity;
      }
    }

    const discount = cart.promo_discount || 0;
    const total = subtotal + taxes + fees - discount;

    return {
      subtotal,
      taxes,
      fees,
      discount,
      total,
      currency: cart.currency,
      itemCount: cart.items.length,
    };
  } catch (error) {
    console.error('Calculate totals error:', error);
    return null;
  }
}

/**
 * Recalculate and update cart totals in database
 */
async function recalculateCartTotals(cartId: string): Promise<void> {
  const totals = await calculateCartTotals(cartId);
  if (!totals) return;

  await supabase
    .from('carts')
    .update({
      subtotal: totals.subtotal,
      taxes: totals.taxes,
      fees: totals.fees,
      total: totals.total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cartId);
}

// ============================================
// PROMO CODES
// ============================================

/**
 * Apply promo code to cart
 */
export async function applyPromoCode(
  cartId: string,
  promoCode: string
): Promise<CartOperationResult> {
  try {
    // TODO: Validate promo code against promo_codes table
    // For now, just store the code
    const { error } = await supabase
      .from('carts')
      .update({
        promo_code: promoCode,
        // promo_discount would be calculated based on promo rules
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId);

    if (error) throw error;

    await recalculateCartTotals(cartId);

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Apply promo error:', error);
    return {
      success: false,
      error: { code: 'APPLY_PROMO_FAILED', message: error.message },
    };
  }
}

/**
 * Remove promo code from cart
 */
export async function removePromoCode(cartId: string): Promise<CartOperationResult> {
  try {
    const { error } = await supabase
      .from('carts')
      .update({
        promo_code: null,
        promo_discount: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId);

    if (error) throw error;

    await recalculateCartTotals(cartId);

    const updatedCart = await getCart(cartId);
    return { success: true, cart: updatedCart! };
  } catch (error: any) {
    console.error('Remove promo error:', error);
    return {
      success: false,
      error: { code: 'REMOVE_PROMO_FAILED', message: error.message },
    };
  }
}

// ============================================
// CART ITEM DISPLAY HELPERS
// ============================================

/**
 * Format cart item for display
 */
export function formatCartItemForDisplay(item: CartItem): CartItemDisplay {
  const snapshot = item.offer_snapshot;
  let title = '';
  let subtitle = '';
  let imageUrl: string | undefined;
  const details: CartItemDisplay['details'] = {};

  switch (item.category) {
    case 'flight':
      const flight = snapshot;
      const firstSlice = flight.slices?.[0];
      const firstSegment = firstSlice?.segments?.[0];
      title = `${firstSlice?.origin?.code || ''} → ${firstSlice?.destination?.code || ''}`;
      subtitle = `${firstSegment?.marketingCarrier?.name || 'Flight'} • ${flight.cabinClass || 'Economy'}`;
      imageUrl = firstSegment?.marketingCarrier?.logoUrl;
      details.airline = firstSegment?.marketingCarrier?.name;
      details.flightNumber = firstSegment?.flightNumber;
      details.departure = {
        airport: firstSlice?.origin?.name || '',
        time: formatTime(firstSegment?.departureAt),
        date: formatDate(firstSegment?.departureAt),
      };
      details.arrival = {
        airport: firstSlice?.destination?.name || '',
        time: formatTime(firstSegment?.arrivalAt),
        date: formatDate(firstSegment?.arrivalAt),
      };
      details.cabinClass = flight.cabinClass;
      details.stops = (firstSlice?.segments?.length || 1) - 1;
      break;

    case 'hotel':
      const hotel = snapshot;
      title = hotel.name || 'Hotel';
      subtitle = `${hotel.location?.city || ''} • ${hotel.rooms?.[0]?.name || 'Room'}`;
      imageUrl = hotel.images?.[0]?.url;
      details.hotelName = hotel.name;
      details.roomType = hotel.rooms?.[0]?.name;
      details.checkIn = formatDate(hotel.checkIn);
      details.checkOut = formatDate(hotel.checkOut);
      details.nights = hotel.nights;
      details.guests = hotel.guests;
      break;

    case 'car':
      const car = snapshot;
      title = `${car.vehicle?.make || ''} ${car.vehicle?.model || car.vehicle?.category || 'Car'}`;
      subtitle = `${car.company?.name || 'Rental'} • ${car.pickupLocation?.name || ''}`;
      imageUrl = car.vehicle?.imageUrl;
      details.carType = car.vehicle?.category;
      details.carCompany = car.company?.name;
      details.pickupLocation = car.pickupLocation?.name;
      details.dropoffLocation = car.dropoffLocation?.name;
      details.pickupDate = formatDate(car.pickupDateTime);
      details.dropoffDate = formatDate(car.dropoffDateTime);
      break;

    case 'experience':
      const exp = snapshot;
      title = exp.name || 'Experience';
      subtitle = `${exp.location?.city || ''} • ${exp.duration || ''}`;
      imageUrl = exp.images?.[0]?.url;
      details.experienceName = exp.name;
      details.experienceDate = formatDate(exp.date);
      details.experienceTime = exp.time;
      details.duration = exp.duration;
      details.participants = exp.participants;
      break;
  }

  return {
    id: item.id,
    category: item.category,
    title,
    subtitle,
    imageUrl,
    price: item.price_amount,
    currency: item.price_currency,
    details,
    status: item.status,
    priceChanged: item.price_changed,
    priceChangeAmount: item.price_change_amount || undefined,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatTime(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Generate a unique session token for anonymous carts
 */
export function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Merge anonymous cart into user cart after login
 */
export async function mergeAnonymousCart(
  sessionToken: string,
  userId: string
): Promise<CartOperationResult> {
  try {
    // Get anonymous cart
    const { data: anonCart } = await supabase
      .from('carts')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('status', 'active')
      .single();

    if (!anonCart) {
      return { success: true }; // No anonymous cart to merge
    }

    // Get or create user cart
    const userCartResult = await getOrCreateCart(userId);
    if (!userCartResult.success || !userCartResult.cart) {
      return userCartResult;
    }

    // Get anonymous cart items
    const { data: anonItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', anonCart.id)
      .eq('status', 'active');

    // Move items to user cart
    if (anonItems && anonItems.length > 0) {
      for (const item of anonItems) {
        await addToCart(userCartResult.cart.id, {
          category: item.category,
          providerCode: item.provider_code,
          providerOfferId: item.provider_offer_id,
          offerSnapshot: item.offer_snapshot,
          priceAmount: item.price_amount,
          priceCurrency: item.price_currency,
          priceBreakdown: item.price_breakdown,
          quantity: item.quantity,
          travelerIndices: item.traveler_indices,
          roomIndex: item.room_index,
        });
      }
    }

    // Mark anonymous cart as abandoned
    await supabase
      .from('carts')
      .update({ status: 'abandoned' })
      .eq('id', anonCart.id);

    const mergedCart = await getCart(userCartResult.cart.id);
    return { success: true, cart: mergedCart! };
  } catch (error: any) {
    console.error('Merge cart error:', error);
    return {
      success: false,
      error: { code: 'MERGE_CART_FAILED', message: error.message },
    };
  }
}
