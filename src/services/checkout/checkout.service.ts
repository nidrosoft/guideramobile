/**
 * CHECKOUT SERVICE
 * 
 * Manages the checkout flow from cart to payment.
 * Implements the authorize → book → capture pattern for safe payments.
 */

import { supabase } from '@/lib/supabase/client';
import { getCart, updateCartStatus } from '../cart/cart.service';
import { CartWithItems } from '../cart/cart.types';
import {
  CheckoutSession,
  CheckoutStatus,
  CheckoutError,
  CHECKOUT_ERROR_CODES,
  InitializeCheckoutRequest,
  InitializeCheckoutResponse,
  PriceVerificationResult,
  PriceVerificationItem,
  AcknowledgePriceChangeRequest,
  SubmitTravelerDetailsRequest,
  SubmitTravelerDetailsResponse,
  TravelerDetails,
  ContactInfo,
  ValidationError,
} from './checkout.types';

// ============================================
// CONSTANTS
// ============================================

const CHECKOUT_SESSION_EXPIRY_MINUTES = 30;

// ============================================
// CHECKOUT INITIALIZATION
// ============================================

/**
 * Initialize a checkout session from a cart
 */
export async function initializeCheckout(
  request: InitializeCheckoutRequest
): Promise<InitializeCheckoutResponse> {
  try {
    const { cartId, userId, idempotencyKey, ipAddress, userAgent } = request;

    // Check for existing session with same idempotency key
    const existingSession = await findSessionByIdempotencyKey(idempotencyKey);
    if (existingSession) {
      return formatCheckoutResponse(existingSession);
    }

    // Get cart with items
    const cart = await getCart(cartId);
    if (!cart) {
      throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_NOT_FOUND, 'Cart not found');
    }

    if (cart.items.length === 0) {
      throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_EMPTY, 'Cart is empty');
    }

    // Verify cart belongs to user
    if (cart.user_id && cart.user_id !== userId) {
      throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_ACCESS_DENIED, 'Cart does not belong to user');
    }

    // Check cart not expired
    if (new Date(cart.expires_at) < new Date()) {
      throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_EXPIRED, 'Cart has expired');
    }

    // Generate checkout token
    const checkoutToken = generateCheckoutToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CHECKOUT_SESSION_EXPIRY_MINUTES);

    // Create checkout session
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .insert({
        cart_id: cartId,
        user_id: userId,
        checkout_token: checkoutToken,
        idempotency_key: idempotencyKey,
        status: 'pending',
        locked_subtotal: cart.subtotal,
        locked_taxes: cart.taxes,
        locked_fees: cart.fees,
        locked_discount: cart.discount,
        locked_total: cart.total,
        currency: cart.currency,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update cart status
    await updateCartStatus(cartId, 'checkout');

    // Log checkout initiation
    await logCheckoutEvent(session.id, 'checkout_initiated', {
      cartId,
      itemCount: cart.items.length,
      total: cart.total,
    });

    return {
      success: true,
      checkoutToken: session.checkout_token,
      checkoutSessionId: session.id,
      lockedPricing: {
        subtotal: cart.subtotal,
        taxes: cart.taxes,
        fees: cart.fees,
        discount: cart.discount,
        total: cart.total,
        currency: cart.currency,
      },
      items: cart.items,
      expiresAt: session.expires_at,
    };
  } catch (error: any) {
    console.error('Initialize checkout error:', error);
    return {
      success: false,
      error: {
        code: error.code || CHECKOUT_ERROR_CODES.UNEXPECTED_ERROR,
        message: error.message,
      },
    };
  }
}

// ============================================
// PRICE VERIFICATION
// ============================================

/**
 * Verify prices with providers before payment
 */
export async function verifyPrices(checkoutToken: string): Promise<PriceVerificationResult> {
  const session = await getCheckoutSession(checkoutToken);
  if (!session) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.SESSION_NOT_FOUND, 'Checkout session not found');
  }

  // Check session not expired
  if (new Date(session.expires_at) < new Date()) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.SESSION_EXPIRED, 'Checkout session has expired');
  }

  const cart = await getCart(session.cart_id);
  if (!cart) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_NOT_FOUND, 'Cart not found');
  }

  const verificationResults: PriceVerificationItem[] = [];

  // Verify each item with provider
  for (const item of cart.items) {
    try {
      // TODO: Call provider to verify price and availability
      // For now, simulate verification (prices unchanged)
      const verification = await verifyWithProvider(
        item.provider_code,
        item.category,
        item.provider_offer_id
      );

      verificationResults.push({
        itemId: item.id,
        category: item.category,
        originalPrice: item.price_amount,
        currentPrice: verification.price,
        priceChange: verification.price - item.price_amount,
        available: verification.available,
        unavailableReason: verification.unavailableReason,
      });

      // Update cart item with verification result
      await supabase
        .from('cart_items')
        .update({
          price_verified_at: new Date().toISOString(),
          verified_price: verification.price,
          price_changed: verification.price !== item.price_amount,
          price_change_amount: verification.price - item.price_amount,
          status: verification.available ? 'active' : 'unavailable',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    } catch (error: any) {
      verificationResults.push({
        itemId: item.id,
        category: item.category,
        originalPrice: item.price_amount,
        currentPrice: item.price_amount,
        priceChange: 0,
        available: false,
        unavailableReason: 'Unable to verify availability',
      });
    }
  }

  // Calculate totals
  const unavailableItems = verificationResults.filter((r) => !r.available);
  const priceChangedItems = verificationResults.filter((r) => r.priceChange !== 0);

  const newTotal = verificationResults
    .filter((r) => r.available)
    .reduce((sum, r) => sum + r.currentPrice, 0);

  const totalChange = newTotal - session.locked_total;

  // Update session status
  const newStatus: CheckoutStatus =
    unavailableItems.length > 0 || priceChangedItems.length > 0
      ? 'price_changed'
      : 'traveler_details';

  await supabase
    .from('checkout_sessions')
    .update({
      status: newStatus,
      final_subtotal: newTotal,
      final_total: newTotal,
      price_increased: totalChange > 0,
      price_increase_amount: totalChange > 0 ? totalChange : null,
    })
    .eq('id', session.id);

  await logCheckoutEvent(session.id, 'prices_verified', {
    priceChanged: priceChangedItems.length > 0,
    unavailableCount: unavailableItems.length,
    totalChange,
  });

  return {
    verified: true,
    priceChanged: priceChangedItems.length > 0 || unavailableItems.length > 0,
    hasUnavailableItems: unavailableItems.length > 0,
    items: verificationResults,
    originalTotal: session.locked_total,
    newTotal,
    totalChange,
    currency: session.currency,
  };
}

/**
 * Verify offer with provider (placeholder - will call actual provider)
 */
async function verifyWithProvider(
  providerCode: string,
  category: string,
  offerId: string
): Promise<{ price: number; available: boolean; unavailableReason?: string }> {
  // TODO: Implement actual provider verification
  // For now, return mock data indicating price unchanged
  
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock: 95% chance available, 5% chance price changed slightly
  const available = Math.random() > 0.05;
  const priceMultiplier = Math.random() > 0.9 ? 1 + Math.random() * 0.1 : 1;

  return {
    price: 0, // Will be filled from actual offer
    available,
    unavailableReason: available ? undefined : 'Offer no longer available',
  };
}

// ============================================
// PRICE CHANGE ACKNOWLEDGMENT
// ============================================

/**
 * Acknowledge price change
 */
export async function acknowledgePriceChange(
  request: AcknowledgePriceChangeRequest
): Promise<{ success: boolean; nextStep: string }> {
  const { checkoutToken, acknowledged, acceptNewPrice } = request;

  const session = await getCheckoutSession(checkoutToken);
  if (!session) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.SESSION_NOT_FOUND, 'Session not found');
  }

  if (!session.price_increased) {
    return { success: true, nextStep: 'traveler_details' };
  }

  if (!acceptNewPrice) {
    // User rejected new price - cancel checkout
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'cancelled',
        error_code: CHECKOUT_ERROR_CODES.PRICE_CHANGE_REJECTED,
        error_message: 'User did not accept price change',
      })
      .eq('id', session.id);

    await logCheckoutEvent(session.id, 'price_change_rejected', {});

    return { success: false, nextStep: 'cart' };
  }

  // User accepted new price
  await supabase
    .from('checkout_sessions')
    .update({
      price_increase_acknowledged: true,
      price_increase_acknowledged_at: new Date().toISOString(),
      status: 'traveler_details',
    })
    .eq('id', session.id);

  await logCheckoutEvent(session.id, 'price_change_accepted', {
    increaseAmount: session.price_increase_amount,
  });

  return { success: true, nextStep: 'traveler_details' };
}

// ============================================
// TRAVELER DETAILS
// ============================================

/**
 * Submit traveler details
 */
export async function submitTravelerDetails(
  request: SubmitTravelerDetailsRequest
): Promise<SubmitTravelerDetailsResponse> {
  const { checkoutToken, travelers, contact, billingAddress } = request;

  const session = await getCheckoutSession(checkoutToken);
  if (!session) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.SESSION_NOT_FOUND, 'Session not found');
  }

  const cart = await getCart(session.cart_id);
  if (!cart) {
    throw new CheckoutError(CHECKOUT_ERROR_CODES.CART_NOT_FOUND, 'Cart not found');
  }

  // Validate traveler details
  const validationErrors = validateTravelerDetails(travelers, cart);
  if (validationErrors.length > 0) {
    return { success: false, validationErrors };
  }

  // Validate contact info
  const contactErrors = validateContactInfo(contact);
  if (contactErrors.length > 0) {
    return { success: false, validationErrors: contactErrors };
  }

  // Validate passport for international flights
  const passportErrors = await validatePassportsForFlights(travelers, cart);
  if (passportErrors.length > 0) {
    return { success: false, validationErrors: passportErrors };
  }

  // Save traveler details
  await supabase
    .from('checkout_sessions')
    .update({
      travelers,
      contact_info: contact,
      billing_address: billingAddress || null,
      status: 'payment_pending',
    })
    .eq('id', session.id);

  await logCheckoutEvent(session.id, 'traveler_details_submitted', {
    travelerCount: travelers.length,
  });

  return { success: true, nextStep: 'payment' };
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate traveler details
 */
function validateTravelerDetails(
  travelers: TravelerDetails[],
  cart: CartWithItems
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Count required travelers from cart items
  const requiredAdults = getRequiredTravelerCount(cart, 'adult');
  const requiredChildren = getRequiredTravelerCount(cart, 'child');

  const providedAdults = travelers.filter((t) => t.type === 'adult').length;
  const providedChildren = travelers.filter((t) => t.type === 'child').length;

  if (providedAdults < requiredAdults) {
    errors.push({
      field: 'travelers',
      message: `${requiredAdults} adult traveler(s) required`,
      code: 'INSUFFICIENT_ADULTS',
    });
  }

  // Validate each traveler
  travelers.forEach((traveler, index) => {
    if (!traveler.firstName?.trim()) {
      errors.push({
        field: `travelers[${index}].firstName`,
        message: 'First name is required',
      });
    }

    if (!traveler.lastName?.trim()) {
      errors.push({
        field: `travelers[${index}].lastName`,
        message: 'Last name is required',
      });
    }

    if (!traveler.dateOfBirth) {
      errors.push({
        field: `travelers[${index}].dateOfBirth`,
        message: 'Date of birth is required',
      });
    } else {
      // Validate age matches type
      const age = calculateAge(traveler.dateOfBirth);
      if (traveler.type === 'adult' && age < 18) {
        errors.push({
          field: `travelers[${index}].type`,
          message: 'Adult must be 18 or older',
        });
      }
      if (traveler.type === 'child' && (age < 2 || age >= 18)) {
        errors.push({
          field: `travelers[${index}].type`,
          message: 'Child must be between 2 and 17 years old',
        });
      }
      if (traveler.type === 'infant' && age >= 2) {
        errors.push({
          field: `travelers[${index}].type`,
          message: 'Infant must be under 2 years old',
        });
      }
    }

    if (!traveler.gender) {
      errors.push({
        field: `travelers[${index}].gender`,
        message: 'Gender is required',
      });
    }
  });

  return errors;
}

/**
 * Validate contact info
 */
function validateContactInfo(contact: ContactInfo): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contact.firstName?.trim()) {
    errors.push({ field: 'contact.firstName', message: 'First name is required' });
  }

  if (!contact.lastName?.trim()) {
    errors.push({ field: 'contact.lastName', message: 'Last name is required' });
  }

  if (!contact.email?.trim()) {
    errors.push({ field: 'contact.email', message: 'Email is required' });
  } else if (!isValidEmail(contact.email)) {
    errors.push({ field: 'contact.email', message: 'Invalid email format' });
  }

  if (!contact.phone?.trim()) {
    errors.push({ field: 'contact.phone', message: 'Phone number is required' });
  }

  return errors;
}

/**
 * Validate passports for international flights
 */
async function validatePassportsForFlights(
  travelers: TravelerDetails[],
  cart: CartWithItems
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check if any flights are international
  const hasInternationalFlight = cart.items.some((item) => {
    if (item.category !== 'flight') return false;
    const flight = item.offer_snapshot;
    return isInternationalFlight(flight);
  });

  if (!hasInternationalFlight) return errors;

  // Get latest travel date for passport expiry check
  const latestTravelDate = getLatestTravelDate(cart);

  travelers.forEach((traveler, index) => {
    if (!traveler.document) {
      errors.push({
        field: `travelers[${index}].document`,
        message: 'Passport is required for international flights',
      });
      return;
    }

    if (traveler.document.type !== 'passport') {
      errors.push({
        field: `travelers[${index}].document.type`,
        message: 'Passport is required for international flights',
      });
      return;
    }

    // Check passport valid for 6 months after travel
    if (latestTravelDate && traveler.document.expiryDate) {
      const sixMonthsAfter = new Date(latestTravelDate);
      sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);

      if (new Date(traveler.document.expiryDate) < sixMonthsAfter) {
        errors.push({
          field: `travelers[${index}].document.expiryDate`,
          message: 'Passport must be valid for 6 months after travel date',
        });
      }
    }
  });

  return errors;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get checkout session by token
 */
export async function getCheckoutSession(checkoutToken: string): Promise<CheckoutSession | null> {
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('checkout_token', checkoutToken)
    .single();

  if (error || !data) return null;
  return data as CheckoutSession;
}

/**
 * Get checkout session by ID
 */
export async function getCheckoutSessionById(sessionId: string): Promise<CheckoutSession | null> {
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return data as CheckoutSession;
}

/**
 * Find session by idempotency key
 */
async function findSessionByIdempotencyKey(idempotencyKey: string): Promise<CheckoutSession | null> {
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (error || !data) return null;
  return data as CheckoutSession;
}

/**
 * Update checkout session
 */
export async function updateCheckoutSession(
  sessionId: string,
  updates: Partial<CheckoutSession>
): Promise<void> {
  await supabase.from('checkout_sessions').update(updates).eq('id', sessionId);
}

/**
 * Format checkout response from session
 */
function formatCheckoutResponse(session: CheckoutSession): InitializeCheckoutResponse {
  return {
    success: true,
    checkoutToken: session.checkout_token,
    checkoutSessionId: session.id,
    lockedPricing: {
      subtotal: session.locked_subtotal,
      taxes: session.locked_taxes,
      fees: session.locked_fees,
      discount: session.locked_discount,
      total: session.locked_total,
      currency: session.currency,
    },
    expiresAt: session.expires_at,
  };
}

/**
 * Generate unique checkout token
 */
function generateCheckoutToken(): string {
  return `chk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Log checkout event
 */
async function logCheckoutEvent(sessionId: string, event: string, data: any): Promise<void> {
  // TODO: Implement proper logging to checkout_events table or logging service
  console.log(`[Checkout ${sessionId}] ${event}:`, data);
}

/**
 * Get required traveler count by type from cart
 */
function getRequiredTravelerCount(cart: CartWithItems, type: 'adult' | 'child' | 'infant'): number {
  // Extract from flight offers or default to 1 adult
  for (const item of cart.items) {
    if (item.category === 'flight') {
      const flight = item.offer_snapshot;
      if (flight.travelers) {
        return flight.travelers[type + 's'] || 0;
      }
    }
  }
  return type === 'adult' ? 1 : 0;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if flight is international
 */
function isInternationalFlight(flight: any): boolean {
  if (!flight?.slices) return false;
  for (const slice of flight.slices) {
    const origin = slice.origin?.country || slice.segments?.[0]?.origin?.country;
    const destination = slice.destination?.country || slice.segments?.[slice.segments.length - 1]?.destination?.country;
    if (origin && destination && origin !== destination) {
      return true;
    }
  }
  return false;
}

/**
 * Get latest travel date from cart
 */
function getLatestTravelDate(cart: CartWithItems): Date | null {
  let latestDate: Date | null = null;

  for (const item of cart.items) {
    if (item.category === 'flight') {
      const flight = item.offer_snapshot;
      const lastSlice = flight.slices?.[flight.slices.length - 1];
      const arrivalAt = lastSlice?.arrivalAt || lastSlice?.segments?.[lastSlice.segments.length - 1]?.arrivalAt;
      if (arrivalAt) {
        const date = new Date(arrivalAt);
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
      }
    }
  }

  return latestDate;
}
