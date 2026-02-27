# Document 10: Checkout & Payment System

## Purpose

This document defines the complete checkout and payment system for Guidera — the secure, reliable process that takes users from "I want this" to "It's booked." This system handles price verification, payment processing via Stripe, provider booking coordination, and all the edge cases that can (and will) go wrong.

As a **merchant model** business, Guidera collects payment from users and pays providers. This means we own the payment relationship, handle refunds, and manage disputes. This document ensures we do it flawlessly.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHECKOUT & PAYMENT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         CHECKOUT FLOW                                │   │
│   │                                                                      │   │
│   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │   │
│   │  │  Cart    │──▶│  Price   │──▶│ Traveler │──▶│ Payment  │        │   │
│   │  │ Review   │   │  Verify  │   │  Details │   │  Entry   │        │   │
│   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘        │   │
│   │                                                     │               │   │
│   │                                                     ▼               │   │
│   │                                              ┌──────────┐          │   │
│   │                                              │ Confirm  │          │   │
│   │                                              │ & Book   │          │   │
│   │                                              └──────────┘          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      PAYMENT PROCESSOR                               │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Stripe     │  │   Payment    │  │    3D        │              │   │
│   │  │   Intent     │  │   Methods    │  │   Secure     │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Webhook    │  │   Refund     │  │   Dispute    │              │   │
│   │  │   Handler    │  │   Manager    │  │   Handler    │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   BOOKING COORDINATOR                                │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Provider   │  │   Rollback   │  │ Confirmation │              │   │
│   │  │   Booking    │  │   Handler    │  │   Sender     │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Design Principles

### 1. Never Capture Payment Before Provider Confirmation
```
WRONG: Charge card → Book with provider → Provider fails → Manual refund needed
RIGHT: Authorize card → Book with provider → Provider confirms → Capture payment
```

### 2. Idempotency Everywhere
Every booking request must include an idempotency key. If a request is retried (network timeout, user double-click), the same result is returned without double-booking.

### 3. Price Lock with Verification
When user starts checkout, we "lock" the price for 15 minutes. Before final booking, we re-verify with provider. If price changed, user must acknowledge.

### 4. Atomic Multi-Item Bookings
For packages (flight + hotel), either ALL items book successfully, or NONE do. No partial bookings that leave users stranded.

### 5. Comprehensive Logging
Every step is logged for debugging and dispute resolution. We can reconstruct exactly what happened months later.

---

## Database Schema

### Shopping Cart

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Cart identity
  session_token VARCHAR(100),                  -- For anonymous users
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',         -- 'active', 'checkout', 'completed', 'abandoned'
  
  -- Totals (denormalized for display)
  subtotal DECIMAL(12,2) DEFAULT 0,
  taxes DECIMAL(12,2) DEFAULT 0,
  fees DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Promo
  promo_code VARCHAR(50),
  promo_discount DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  -- Checkout tracking
  checkout_started_at TIMESTAMPTZ,
  checkout_completed_at TIMESTAMPTZ
);

CREATE INDEX idx_carts_user ON carts(user_id) WHERE status = 'active';
CREATE INDEX idx_carts_session ON carts(session_token) WHERE status = 'active';
```

### Cart Items

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  
  -- Item identity
  category VARCHAR(50) NOT NULL,               -- 'flight', 'hotel', 'car', 'experience'
  
  -- Provider info
  provider_code VARCHAR(50) NOT NULL,
  provider_offer_id VARCHAR(255) NOT NULL,
  
  -- Offer snapshot (full data at time of add)
  offer_snapshot JSONB NOT NULL,
  
  -- Pricing at time of add
  price_amount DECIMAL(12,2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL,
  price_breakdown JSONB,
  
  -- Quantity
  quantity INTEGER DEFAULT 1,
  
  -- Travelers (which travelers this item is for)
  traveler_indices INTEGER[],                  -- [0, 1] = first two travelers
  
  -- Room assignment (for hotels)
  room_index INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',         -- 'active', 'removed', 'unavailable', 'price_changed'
  
  -- Price verification
  price_verified_at TIMESTAMPTZ,
  verified_price DECIMAL(12,2),
  price_changed BOOLEAN DEFAULT FALSE,
  price_change_amount DECIMAL(12,2),
  
  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id) WHERE status = 'active';
```

### Checkout Sessions

```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Session identity
  checkout_token VARCHAR(100) UNIQUE NOT NULL,
  idempotency_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  /*
    'pending' - Checkout started
    'price_verification' - Verifying prices with providers
    'price_changed' - Prices changed, awaiting user acknowledgment
    'traveler_details' - Collecting traveler info
    'payment_pending' - Awaiting payment
    'payment_processing' - Payment being processed
    'payment_authorized' - Payment authorized, not yet captured
    'booking_in_progress' - Booking with providers
    'booking_partial' - Some bookings succeeded (edge case)
    'completed' - All successful
    'failed' - Failed
    'expired' - Session expired
    'cancelled' - User cancelled
  */
  
  -- Pricing (locked at checkout start)
  locked_subtotal DECIMAL(12,2),
  locked_taxes DECIMAL(12,2),
  locked_fees DECIMAL(12,2),
  locked_discount DECIMAL(12,2),
  locked_total DECIMAL(12,2),
  currency VARCHAR(3),
  
  -- Final pricing (after verification)
  final_subtotal DECIMAL(12,2),
  final_taxes DECIMAL(12,2),
  final_fees DECIMAL(12,2),
  final_total DECIMAL(12,2),
  
  -- Price change tracking
  price_increased BOOLEAN DEFAULT FALSE,
  price_increase_amount DECIMAL(12,2),
  price_increase_acknowledged BOOLEAN DEFAULT FALSE,
  price_increase_acknowledged_at TIMESTAMPTZ,
  
  -- Traveler details
  travelers JSONB,                             -- Array of traveler details
  contact_info JSONB,                          -- Contact person details
  
  -- Payment
  stripe_customer_id VARCHAR(100),
  stripe_payment_intent_id VARCHAR(100),
  stripe_payment_method_id VARCHAR(100),
  payment_status VARCHAR(50),
  payment_authorized_at TIMESTAMPTZ,
  payment_captured_at TIMESTAMPTZ,
  payment_amount DECIMAL(12,2),
  
  -- Booking results
  booking_results JSONB DEFAULT '[]',          -- Results per item
  all_bookings_successful BOOLEAN,
  
  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  completed_at TIMESTAMPTZ,
  
  -- Audit
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255)
);

CREATE INDEX idx_checkout_token ON checkout_sessions(checkout_token);
CREATE INDEX idx_checkout_payment_intent ON checkout_sessions(stripe_payment_intent_id);
CREATE INDEX idx_checkout_status ON checkout_sessions(status);
```

### Payment Transactions

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  booking_id UUID,                             -- Set after booking created
  user_id UUID REFERENCES auth.users(id),
  
  -- Transaction identity
  transaction_reference VARCHAR(100) UNIQUE NOT NULL,
  
  -- Stripe references
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  stripe_payment_method_id VARCHAR(100),
  
  -- Transaction type
  transaction_type VARCHAR(50) NOT NULL,       -- 'charge', 'refund', 'capture', 'void'
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL,
  /*
    'pending'
    'requires_action' - 3D Secure needed
    'processing'
    'authorized' - Authorized but not captured
    'succeeded'
    'failed'
    'cancelled'
    'refunded'
    'partially_refunded'
    'disputed'
  */
  
  -- Failure details
  failure_code VARCHAR(100),
  failure_message TEXT,
  decline_code VARCHAR(100),
  
  -- Refund tracking (if this is a refund)
  original_transaction_id UUID REFERENCES payment_transactions(id),
  refund_reason VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  authorized_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_checkout ON payment_transactions(checkout_session_id);
CREATE INDEX idx_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX idx_transactions_stripe_pi ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
```

### Stripe Webhooks Log

```sql
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe event
  stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Related records
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  booking_id UUID,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Idempotency
  idempotency_processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_webhook_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_unprocessed ON stripe_webhook_events(processed) WHERE processed = FALSE;
```

---

## Checkout Flow

### Step 1: Initialize Checkout

```typescript
interface InitializeCheckoutRequest {
  cartId: string
  userId?: string
  idempotencyKey: string
}

interface InitializeCheckoutResponse {
  checkoutToken: string
  checkoutSessionId: string
  lockedPricing: {
    subtotal: number
    taxes: number
    fees: number
    total: number
    currency: string
  }
  items: CartItemSummary[]
  expiresAt: string
}

async function initializeCheckout(
  request: InitializeCheckoutRequest
): Promise<InitializeCheckoutResponse> {
  
  const { cartId, userId, idempotencyKey } = request
  
  // 1. Check idempotency - return existing session if found
  const existingSession = await findSessionByIdempotencyKey(idempotencyKey)
  if (existingSession) {
    return formatCheckoutResponse(existingSession)
  }
  
  // 2. Get cart with items
  const cart = await getCartWithItems(cartId)
  if (!cart || cart.items.length === 0) {
    throw new CheckoutError('EMPTY_CART', 'Cart is empty or not found')
  }
  
  // 3. Verify cart belongs to user
  if (cart.user_id && cart.user_id !== userId) {
    throw new CheckoutError('CART_ACCESS_DENIED', 'Cart does not belong to user')
  }
  
  // 4. Check cart not expired
  if (new Date(cart.expires_at) < new Date()) {
    throw new CheckoutError('CART_EXPIRED', 'Cart has expired')
  }
  
  // 5. Create checkout session
  const checkoutSession = await createCheckoutSession({
    cartId,
    userId,
    idempotencyKey,
    lockedPricing: {
      subtotal: cart.subtotal,
      taxes: cart.taxes,
      fees: cart.fees,
      discount: cart.discount,
      total: cart.total,
      currency: cart.currency
    }
  })
  
  // 6. Update cart status
  await updateCart(cartId, { status: 'checkout', checkout_started_at: new Date() })
  
  // 7. Log checkout initiation
  await logCheckoutEvent(checkoutSession.id, 'checkout_initiated', {
    cartId,
    itemCount: cart.items.length,
    total: cart.total
  })
  
  return formatCheckoutResponse(checkoutSession)
}
```

### Step 2: Verify Prices

```typescript
interface PriceVerificationResult {
  verified: boolean
  priceChanged: boolean
  items: {
    itemId: string
    originalPrice: number
    currentPrice: number
    priceChange: number
    available: boolean
    unavailableReason?: string
  }[]
  originalTotal: number
  newTotal: number
  totalChange: number
}

async function verifyPrices(
  checkoutToken: string
): Promise<PriceVerificationResult> {
  
  const session = await getCheckoutSession(checkoutToken)
  if (!session) {
    throw new CheckoutError('SESSION_NOT_FOUND', 'Checkout session not found')
  }
  
  // Check session not expired
  if (new Date(session.expires_at) < new Date()) {
    throw new CheckoutError('SESSION_EXPIRED', 'Checkout session has expired')
  }
  
  const cart = await getCartWithItems(session.cart_id)
  const verificationResults: PriceVerificationResult['items'] = []
  
  // Verify each item with provider
  for (const item of cart.items) {
    try {
      // Call provider to verify price and availability
      const verification = await verifyWithProvider(
        item.provider_code,
        item.category,
        item.provider_offer_id
      )
      
      verificationResults.push({
        itemId: item.id,
        originalPrice: item.price_amount,
        currentPrice: verification.price,
        priceChange: verification.price - item.price_amount,
        available: verification.available,
        unavailableReason: verification.unavailableReason
      })
      
      // Update cart item
      await updateCartItem(item.id, {
        price_verified_at: new Date(),
        verified_price: verification.price,
        price_changed: verification.price !== item.price_amount,
        price_change_amount: verification.price - item.price_amount,
        status: verification.available ? 'active' : 'unavailable'
      })
      
    } catch (error) {
      // Provider verification failed - mark as needing manual check
      verificationResults.push({
        itemId: item.id,
        originalPrice: item.price_amount,
        currentPrice: item.price_amount,
        priceChange: 0,
        available: false,
        unavailableReason: 'Unable to verify availability'
      })
    }
  }
  
  // Calculate totals
  const unavailableItems = verificationResults.filter(r => !r.available)
  const priceChangedItems = verificationResults.filter(r => r.priceChange !== 0)
  
  const newTotal = verificationResults
    .filter(r => r.available)
    .reduce((sum, r) => sum + r.currentPrice, 0)
  
  const totalChange = newTotal - session.locked_total
  
  // Update session
  await updateCheckoutSession(session.id, {
    status: unavailableItems.length > 0 ? 'price_changed' : 'price_verification',
    final_subtotal: newTotal,
    final_total: newTotal, // Simplified - should include taxes/fees
    price_increased: totalChange > 0,
    price_increase_amount: totalChange > 0 ? totalChange : 0
  })
  
  return {
    verified: true,
    priceChanged: priceChangedItems.length > 0 || unavailableItems.length > 0,
    items: verificationResults,
    originalTotal: session.locked_total,
    newTotal,
    totalChange
  }
}

async function verifyWithProvider(
  providerCode: string,
  category: string,
  offerId: string
): Promise<{ price: number; available: boolean; unavailableReason?: string }> {
  
  const adapter = getProviderAdapter(providerCode)
  
  try {
    const offer = await adapter.verifyOffer(category, offerId)
    
    return {
      price: offer.price.amount,
      available: offer.available,
      unavailableReason: offer.available ? undefined : offer.unavailableReason
    }
  } catch (error) {
    // Log error
    await logProviderError(providerCode, 'verify_offer', error)
    
    throw error
  }
}
```

### Step 3: Acknowledge Price Change (if needed)

```typescript
interface AcknowledgePriceChangeRequest {
  checkoutToken: string
  acknowledged: boolean
  acceptNewPrice: boolean
}

async function acknowledgePriceChange(
  request: AcknowledgePriceChangeRequest
): Promise<{ success: boolean; nextStep: string }> {
  
  const { checkoutToken, acknowledged, acceptNewPrice } = request
  
  const session = await getCheckoutSession(checkoutToken)
  
  if (!session.price_increased) {
    return { success: true, nextStep: 'traveler_details' }
  }
  
  if (!acceptNewPrice) {
    // User rejected new price - cancel checkout
    await updateCheckoutSession(session.id, {
      status: 'cancelled',
      error_code: 'PRICE_CHANGE_REJECTED',
      error_message: 'User did not accept price change'
    })
    
    return { success: false, nextStep: 'cart' }
  }
  
  // User accepted new price
  await updateCheckoutSession(session.id, {
    price_increase_acknowledged: true,
    price_increase_acknowledged_at: new Date(),
    status: 'traveler_details'
  })
  
  return { success: true, nextStep: 'traveler_details' }
}
```

### Step 4: Submit Traveler Details

```typescript
interface TravelerDetails {
  type: 'adult' | 'child' | 'infant'
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  email?: string
  phone?: string
  document?: {
    type: 'passport' | 'national_id'
    number: string
    issuingCountry: string
    expiryDate: string
  }
  loyaltyPrograms?: {
    programCode: string
    memberId: string
  }[]
  seatPreference?: 'window' | 'aisle' | 'middle' | 'no_preference'
  mealPreference?: string
  specialAssistance?: string[]
}

interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  countryCode: string
}

interface SubmitTravelerDetailsRequest {
  checkoutToken: string
  travelers: TravelerDetails[]
  contact: ContactInfo
}

async function submitTravelerDetails(
  request: SubmitTravelerDetailsRequest
): Promise<{ success: boolean; validationErrors?: ValidationError[] }> {
  
  const { checkoutToken, travelers, contact } = request
  
  const session = await getCheckoutSession(checkoutToken)
  const cart = await getCartWithItems(session.cart_id)
  
  // Validate traveler details
  const validationErrors = validateTravelerDetails(travelers, cart)
  if (validationErrors.length > 0) {
    return { success: false, validationErrors }
  }
  
  // Validate contact info
  const contactErrors = validateContactInfo(contact)
  if (contactErrors.length > 0) {
    return { success: false, validationErrors: contactErrors }
  }
  
  // Validate passport expiry for international flights
  for (const item of cart.items) {
    if (item.category === 'flight') {
      const flight = item.offer_snapshot as UnifiedFlight
      const isInternational = isInternationalFlight(flight)
      
      if (isInternational) {
        for (const traveler of travelers) {
          if (!traveler.document) {
            return {
              success: false,
              validationErrors: [{
                field: 'document',
                message: 'Passport required for international flights'
              }]
            }
          }
          
          // Check passport valid for 6 months after travel
          const travelDate = new Date(flight.slices[flight.slices.length - 1].arrivalAt)
          const sixMonthsAfter = new Date(travelDate)
          sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6)
          
          if (new Date(traveler.document.expiryDate) < sixMonthsAfter) {
            return {
              success: false,
              validationErrors: [{
                field: 'document.expiryDate',
                message: 'Passport must be valid for 6 months after travel date'
              }]
            }
          }
        }
      }
    }
  }
  
  // Save traveler details
  await updateCheckoutSession(session.id, {
    travelers: travelers,
    contact_info: contact,
    status: 'payment_pending'
  })
  
  return { success: true }
}

function validateTravelerDetails(
  travelers: TravelerDetails[],
  cart: CartWithItems
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Count required travelers
  const requiredAdults = getRequiredAdults(cart)
  const requiredChildren = getRequiredChildren(cart)
  const requiredInfants = getRequiredInfants(cart)
  
  const providedAdults = travelers.filter(t => t.type === 'adult').length
  const providedChildren = travelers.filter(t => t.type === 'child').length
  const providedInfants = travelers.filter(t => t.type === 'infant').length
  
  if (providedAdults < requiredAdults) {
    errors.push({ field: 'travelers', message: `${requiredAdults} adult traveler(s) required` })
  }
  
  // Validate each traveler
  travelers.forEach((traveler, index) => {
    if (!traveler.firstName?.trim()) {
      errors.push({ field: `travelers[${index}].firstName`, message: 'First name required' })
    }
    if (!traveler.lastName?.trim()) {
      errors.push({ field: `travelers[${index}].lastName`, message: 'Last name required' })
    }
    if (!traveler.dateOfBirth) {
      errors.push({ field: `travelers[${index}].dateOfBirth`, message: 'Date of birth required' })
    }
    
    // Validate age matches type
    const age = calculateAge(traveler.dateOfBirth)
    if (traveler.type === 'adult' && age < 18) {
      errors.push({ field: `travelers[${index}].type`, message: 'Adult must be 18 or older' })
    }
    if (traveler.type === 'child' && (age < 2 || age >= 18)) {
      errors.push({ field: `travelers[${index}].type`, message: 'Child must be between 2 and 17' })
    }
    if (traveler.type === 'infant' && age >= 2) {
      errors.push({ field: `travelers[${index}].type`, message: 'Infant must be under 2' })
    }
  })
  
  return errors
}
```

### Step 5: Create Payment Intent

```typescript
interface CreatePaymentIntentRequest {
  checkoutToken: string
  paymentMethodId?: string  // If user has saved payment method
}

interface CreatePaymentIntentResponse {
  paymentIntentId: string
  clientSecret: string
  amount: number
  currency: string
  requiresAction: boolean
  status: string
}

async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  
  const { checkoutToken, paymentMethodId } = request
  
  const session = await getCheckoutSession(checkoutToken)
  
  // Validate session state
  if (session.status !== 'payment_pending') {
    throw new CheckoutError('INVALID_STATE', `Cannot create payment in state: ${session.status}`)
  }
  
  // Get or create Stripe customer
  let stripeCustomerId = session.stripe_customer_id
  if (!stripeCustomerId && session.user_id) {
    stripeCustomerId = await getOrCreateStripeCustomer(session.user_id, session.contact_info)
  }
  
  // Calculate final amount
  const amount = Math.round(session.final_total * 100) // Stripe uses cents
  
  // Create Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: session.currency.toLowerCase(),
    customer: stripeCustomerId,
    payment_method: paymentMethodId,
    capture_method: 'manual',  // IMPORTANT: Authorize only, capture after booking
    confirmation_method: 'manual',
    metadata: {
      checkout_session_id: session.id,
      cart_id: session.cart_id,
      user_id: session.user_id,
      idempotency_key: session.idempotency_key
    },
    description: `Guidera Booking - ${session.id}`,
    statement_descriptor: 'GUIDERA TRAVEL',
    statement_descriptor_suffix: 'BOOKING',
    
    // Enable 3D Secure if required
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic'
      }
    }
  }, {
    idempotencyKey: `pi_${session.idempotency_key}`
  })
  
  // Update session
  await updateCheckoutSession(session.id, {
    stripe_customer_id: stripeCustomerId,
    stripe_payment_intent_id: paymentIntent.id,
    status: 'payment_processing'
  })
  
  // Create transaction record
  await createPaymentTransaction({
    checkout_session_id: session.id,
    user_id: session.user_id,
    transaction_reference: generateTransactionReference(),
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: stripeCustomerId,
    transaction_type: 'charge',
    amount: session.final_total,
    currency: session.currency,
    status: mapStripeStatus(paymentIntent.status)
  })
  
  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: session.final_total,
    currency: session.currency,
    requiresAction: paymentIntent.status === 'requires_action',
    status: paymentIntent.status
  }
}
```

### Step 6: Confirm Payment & Book

```typescript
interface ConfirmPaymentRequest {
  checkoutToken: string
  paymentIntentId: string
  paymentMethodId: string
}

interface ConfirmPaymentResponse {
  success: boolean
  requiresAction: boolean
  actionUrl?: string
  bookingReference?: string
  bookings?: BookingConfirmation[]
  error?: {
    code: string
    message: string
  }
}

async function confirmPaymentAndBook(
  request: ConfirmPaymentRequest
): Promise<ConfirmPaymentResponse> {
  
  const { checkoutToken, paymentIntentId, paymentMethodId } = request
  
  const session = await getCheckoutSession(checkoutToken)
  
  // Validate payment intent matches session
  if (session.stripe_payment_intent_id !== paymentIntentId) {
    throw new CheckoutError('PAYMENT_MISMATCH', 'Payment intent does not match session')
  }
  
  try {
    // Step 1: Confirm the payment intent (authorizes the card)
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${APP_URL}/checkout/3ds-callback?session=${checkoutToken}`
    }, {
      idempotencyKey: `confirm_${session.idempotency_key}`
    })
    
    // Check if 3D Secure is required
    if (paymentIntent.status === 'requires_action') {
      await updateCheckoutSession(session.id, {
        status: 'payment_processing',
        payment_status: 'requires_action'
      })
      
      return {
        success: false,
        requiresAction: true,
        actionUrl: paymentIntent.next_action?.redirect_to_url?.url
      }
    }
    
    // Check if payment failed
    if (paymentIntent.status === 'requires_payment_method') {
      const error = paymentIntent.last_payment_error
      
      await updateCheckoutSession(session.id, {
        status: 'failed',
        payment_status: 'failed',
        error_code: error?.code,
        error_message: error?.message
      })
      
      await updatePaymentTransaction(paymentIntent.id, {
        status: 'failed',
        failure_code: error?.code,
        failure_message: error?.message,
        decline_code: error?.decline_code,
        failed_at: new Date()
      })
      
      return {
        success: false,
        requiresAction: false,
        error: {
          code: error?.code || 'PAYMENT_FAILED',
          message: getPaymentErrorMessage(error)
        }
      }
    }
    
    // Payment authorized successfully
    if (paymentIntent.status === 'requires_capture') {
      // Update session
      await updateCheckoutSession(session.id, {
        payment_status: 'authorized',
        payment_authorized_at: new Date()
      })
      
      await updatePaymentTransaction(paymentIntent.id, {
        status: 'authorized',
        authorized_at: new Date()
      })
      
      // Step 2: Book with providers
      const bookingResults = await bookWithProviders(session)
      
      // Step 3: Handle booking results
      if (bookingResults.allSuccessful) {
        // Capture payment
        const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId, {}, {
          idempotencyKey: `capture_${session.idempotency_key}`
        })
        
        // Update records
        await updateCheckoutSession(session.id, {
          status: 'completed',
          payment_status: 'captured',
          payment_captured_at: new Date(),
          all_bookings_successful: true,
          booking_results: bookingResults.results,
          completed_at: new Date()
        })
        
        await updatePaymentTransaction(paymentIntent.id, {
          status: 'succeeded',
          captured_at: new Date()
        })
        
        // Create booking records
        const bookings = await createBookingRecords(session, bookingResults)
        
        // Send confirmation emails
        await sendBookingConfirmations(session, bookings)
        
        return {
          success: true,
          requiresAction: false,
          bookingReference: bookings[0].booking_reference,
          bookings
        }
        
      } else {
        // Booking failed - cancel payment authorization
        await stripe.paymentIntents.cancel(paymentIntentId, {
          cancellation_reason: 'abandoned'
        }, {
          idempotencyKey: `cancel_${session.idempotency_key}`
        })
        
        await updateCheckoutSession(session.id, {
          status: 'failed',
          payment_status: 'cancelled',
          all_bookings_successful: false,
          booking_results: bookingResults.results,
          error_code: 'BOOKING_FAILED',
          error_message: bookingResults.errors.join('; ')
        })
        
        await updatePaymentTransaction(paymentIntent.id, {
          status: 'cancelled',
          failure_message: 'Booking with provider failed'
        })
        
        return {
          success: false,
          requiresAction: false,
          error: {
            code: 'BOOKING_FAILED',
            message: 'Unable to complete booking. Your card has not been charged.'
          }
        }
      }
    }
    
    // Unexpected status
    throw new CheckoutError('UNEXPECTED_STATUS', `Unexpected payment status: ${paymentIntent.status}`)
    
  } catch (error) {
    // Log error
    await logCheckoutError(session.id, error)
    
    // Update session
    await updateCheckoutSession(session.id, {
      status: 'failed',
      error_code: error.code || 'CHECKOUT_ERROR',
      error_message: error.message
    })
    
    throw error
  }
}
```

### Book with Providers (Atomic)

```typescript
interface BookingResult {
  itemId: string
  provider: string
  category: string
  success: boolean
  providerReference?: string
  confirmationNumber?: string
  error?: string
}

interface BookingResults {
  allSuccessful: boolean
  results: BookingResult[]
  errors: string[]
}

async function bookWithProviders(
  session: CheckoutSession
): Promise<BookingResults> {
  
  const cart = await getCartWithItems(session.cart_id)
  const results: BookingResult[] = []
  const errors: string[] = []
  
  // For packages, we need atomic booking
  // Strategy: Book in order of cancellation difficulty
  // 1. Flights (hardest to cancel) last
  // 2. Experiences (easiest) first
  // 3. Hotels in middle
  // 4. Cars in middle
  
  const orderedItems = orderItemsForBooking(cart.items)
  const bookedItems: { itemId: string; providerReference: string }[] = []
  
  try {
    for (const item of orderedItems) {
      // Create booking request
      const bookingRequest = buildProviderBookingRequest(
        item,
        session.travelers,
        session.contact_info
      )
      
      // Book with provider
      const adapter = getProviderAdapter(item.provider_code)
      const bookingResponse = await adapter.createBooking(bookingRequest)
      
      if (bookingResponse.success) {
        results.push({
          itemId: item.id,
          provider: item.provider_code,
          category: item.category,
          success: true,
          providerReference: bookingResponse.providerReference,
          confirmationNumber: bookingResponse.confirmationNumber
        })
        
        bookedItems.push({
          itemId: item.id,
          providerReference: bookingResponse.providerReference
        })
        
      } else {
        // Booking failed - need to rollback previous bookings
        results.push({
          itemId: item.id,
          provider: item.provider_code,
          category: item.category,
          success: false,
          error: bookingResponse.error
        })
        
        errors.push(`${item.category} booking failed: ${bookingResponse.error}`)
        
        // Rollback already booked items
        await rollbackBookings(bookedItems, cart.items)
        
        return {
          allSuccessful: false,
          results,
          errors
        }
      }
    }
    
    // All bookings successful
    return {
      allSuccessful: true,
      results,
      errors: []
    }
    
  } catch (error) {
    // Unexpected error - rollback
    await rollbackBookings(bookedItems, cart.items)
    
    return {
      allSuccessful: false,
      results,
      errors: [`Unexpected error: ${error.message}`]
    }
  }
}

async function rollbackBookings(
  bookedItems: { itemId: string; providerReference: string }[],
  allItems: CartItem[]
): Promise<void> {
  
  for (const booked of bookedItems) {
    const item = allItems.find(i => i.id === booked.itemId)
    if (!item) continue
    
    try {
      const adapter = getProviderAdapter(item.provider_code)
      await adapter.cancelBooking(booked.providerReference)
      
      // Log successful rollback
      await logRollback(item.id, booked.providerReference, 'success')
      
    } catch (error) {
      // Log failed rollback - needs manual intervention
      await logRollback(item.id, booked.providerReference, 'failed', error.message)
      
      // Alert for manual follow-up
      await sendAlert({
        type: 'rollback_failed',
        severity: 'critical',
        message: `Failed to cancel booking ${booked.providerReference}`,
        data: { itemId: item.id, provider: item.provider_code, error: error.message }
      })
    }
  }
}

function orderItemsForBooking(items: CartItem[]): CartItem[] {
  // Order by cancellation difficulty (easiest first)
  const order = {
    experience: 1,
    car: 2,
    hotel: 3,
    flight: 4
  }
  
  return [...items].sort((a, b) => 
    (order[a.category] || 5) - (order[b.category] || 5)
  )
}
```

---

## Stripe Webhook Handler

```typescript
// supabase/functions/stripe-webhook/index.ts

import Stripe from 'stripe'

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response('Webhook Error', { status: 400 })
  }
  
  // Check for duplicate event
  const existingEvent = await findWebhookEvent(event.id)
  if (existingEvent?.processed) {
    return new Response('Already processed', { status: 200 })
  }
  
  // Store event
  await storeWebhookEvent(event)
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
        
      case 'charge.refund.updated':
        await handleRefundUpdated(event.data.object as Stripe.Refund)
        break
        
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break
        
      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object as Stripe.Dispute)
        break
        
      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    // Mark as processed
    await markWebhookProcessed(event.id)
    
    return new Response('OK', { status: 200 })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Store error for retry
    await markWebhookError(event.id, error.message)
    
    return new Response('Processing error', { status: 500 })
  }
})

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata.checkout_session_id
  if (!sessionId) return
  
  const session = await getCheckoutSessionById(sessionId)
  if (!session) return
  
  // Update transaction
  await updatePaymentTransactionByPI(paymentIntent.id, {
    status: 'succeeded',
    stripe_charge_id: paymentIntent.latest_charge as string,
    captured_at: new Date()
  })
  
  // Log
  await logCheckoutEvent(sessionId, 'payment_succeeded', {
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency
  })
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata.checkout_session_id
  if (!sessionId) return
  
  const error = paymentIntent.last_payment_error
  
  await updateCheckoutSession(sessionId, {
    status: 'failed',
    payment_status: 'failed',
    error_code: error?.code,
    error_message: error?.message
  })
  
  await updatePaymentTransactionByPI(paymentIntent.id, {
    status: 'failed',
    failure_code: error?.code,
    failure_message: error?.message,
    decline_code: error?.decline_code,
    failed_at: new Date()
  })
  
  // Send failure notification
  await sendPaymentFailedNotification(sessionId, error)
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = dispute.charge as string
  
  // Find related booking
  const transaction = await findTransactionByChargeId(chargeId)
  if (!transaction?.booking_id) return
  
  // Create dispute record
  await createDispute({
    booking_id: transaction.booking_id,
    stripe_dispute_id: dispute.id,
    stripe_charge_id: chargeId,
    amount: dispute.amount / 100,
    currency: dispute.currency,
    reason: dispute.reason,
    status: dispute.status,
    evidence_due_by: new Date(dispute.evidence_details.due_by * 1000)
  })
  
  // Update booking status
  await updateBooking(transaction.booking_id, {
    has_dispute: true,
    dispute_status: dispute.status
  })
  
  // CRITICAL ALERT - Disputes need immediate attention
  await sendAlert({
    type: 'dispute_created',
    severity: 'critical',
    message: `New dispute: ${dispute.reason} for $${dispute.amount / 100}`,
    data: {
      bookingId: transaction.booking_id,
      disputeId: dispute.id,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      evidenceDueBy: dispute.evidence_details.due_by
    }
  })
  
  // Auto-gather evidence
  await gatherDisputeEvidence(transaction.booking_id, dispute.id)
}
```

---

## Payment Error Handling

```typescript
const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  // Card errors
  'card_declined': 'Your card was declined. Please try a different card.',
  'insufficient_funds': 'Your card has insufficient funds. Please try a different card.',
  'expired_card': 'Your card has expired. Please use a different card.',
  'incorrect_cvc': 'The security code (CVC) is incorrect. Please check and try again.',
  'incorrect_number': 'The card number is incorrect. Please check and try again.',
  'processing_error': 'An error occurred processing your card. Please try again.',
  
  // 3D Secure
  'authentication_required': 'Additional authentication is required. Please complete the verification.',
  'card_not_supported': 'This card does not support the required authentication.',
  
  // Rate limiting
  'rate_limit': 'Too many attempts. Please wait a moment and try again.',
  
  // Generic
  'generic_decline': 'Your card was declined. Please contact your bank or try a different card.',
  'try_again_later': 'Unable to process payment at this time. Please try again later.',
  
  // Fraud
  'fraudulent': 'This payment has been flagged. Please contact support.',
  
  // Default
  'default': 'Payment failed. Please try a different payment method.'
}

function getPaymentErrorMessage(error: Stripe.PaymentIntent.LastPaymentError | null): string {
  if (!error) return PAYMENT_ERROR_MESSAGES.default
  
  // Check decline code first (more specific)
  if (error.decline_code && PAYMENT_ERROR_MESSAGES[error.decline_code]) {
    return PAYMENT_ERROR_MESSAGES[error.decline_code]
  }
  
  // Check error code
  if (error.code && PAYMENT_ERROR_MESSAGES[error.code]) {
    return PAYMENT_ERROR_MESSAGES[error.code]
  }
  
  // Check error type
  if (error.type === 'card_error') {
    return PAYMENT_ERROR_MESSAGES.generic_decline
  }
  
  return PAYMENT_ERROR_MESSAGES.default
}
```

---

## 3D Secure Handling

```typescript
// After 3D Secure redirect callback

async function handle3DSCallback(
  checkoutToken: string,
  paymentIntentId: string
): Promise<ConfirmPaymentResponse> {
  
  const session = await getCheckoutSession(checkoutToken)
  
  // Retrieve payment intent to check status
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  
  if (paymentIntent.status === 'requires_capture') {
    // 3D Secure succeeded - proceed with booking
    return await completeBookingAfter3DS(session, paymentIntent)
  }
  
  if (paymentIntent.status === 'requires_payment_method') {
    // 3D Secure failed
    const error = paymentIntent.last_payment_error
    
    await updateCheckoutSession(session.id, {
      status: 'failed',
      payment_status: 'failed',
      error_code: '3ds_failed',
      error_message: 'Card authentication failed'
    })
    
    return {
      success: false,
      requiresAction: false,
      error: {
        code: '3DS_FAILED',
        message: 'Card authentication failed. Please try again or use a different card.'
      }
    }
  }
  
  // Unexpected status
  throw new CheckoutError('UNEXPECTED_3DS_STATUS', `Unexpected status after 3DS: ${paymentIntent.status}`)
}

async function completeBookingAfter3DS(
  session: CheckoutSession,
  paymentIntent: Stripe.PaymentIntent
): Promise<ConfirmPaymentResponse> {
  
  // Update session
  await updateCheckoutSession(session.id, {
    payment_status: 'authorized',
    payment_authorized_at: new Date()
  })
  
  // Proceed with booking (same as regular flow)
  const bookingResults = await bookWithProviders(session)
  
  if (bookingResults.allSuccessful) {
    // Capture payment
    await stripe.paymentIntents.capture(paymentIntent.id)
    
    // Create booking records
    const bookings = await createBookingRecords(session, bookingResults)
    
    // Update session
    await updateCheckoutSession(session.id, {
      status: 'completed',
      payment_status: 'captured',
      payment_captured_at: new Date(),
      all_bookings_successful: true,
      completed_at: new Date()
    })
    
    // Send confirmations
    await sendBookingConfirmations(session, bookings)
    
    return {
      success: true,
      requiresAction: false,
      bookingReference: bookings[0].booking_reference,
      bookings
    }
    
  } else {
    // Booking failed - cancel payment
    await stripe.paymentIntents.cancel(paymentIntent.id)
    
    await updateCheckoutSession(session.id, {
      status: 'failed',
      payment_status: 'cancelled',
      error_code: 'BOOKING_FAILED'
    })
    
    return {
      success: false,
      requiresAction: false,
      error: {
        code: 'BOOKING_FAILED',
        message: 'Unable to complete booking. Your card has not been charged.'
      }
    }
  }
}
```

---

## Refund Processing

```typescript
interface RefundRequest {
  bookingId: string
  reason: string
  requestedBy: 'user' | 'system' | 'support'
  refundType: 'full' | 'partial'
  partialAmount?: number
  itemsToRefund?: string[]  // For partial refunds by item
}

interface RefundResult {
  success: boolean
  refundId?: string
  refundedAmount?: number
  error?: string
}

async function processRefund(request: RefundRequest): Promise<RefundResult> {
  const { bookingId, reason, requestedBy, refundType, partialAmount, itemsToRefund } = request
  
  // Get booking
  const booking = await getBooking(bookingId)
  if (!booking) {
    throw new RefundError('BOOKING_NOT_FOUND', 'Booking not found')
  }
  
  // Check if refundable
  if (!booking.is_refundable && refundType === 'full') {
    // Check cancellation policy
    const policy = await evaluateCancellationPolicy(booking)
    if (!policy.refundable) {
      return {
        success: false,
        error: `Booking is non-refundable. ${policy.reason}`
      }
    }
  }
  
  // Calculate refund amount
  let refundAmount: number
  if (refundType === 'full') {
    refundAmount = await calculateFullRefund(booking)
  } else {
    refundAmount = partialAmount || await calculatePartialRefund(booking, itemsToRefund)
  }
  
  // Get original charge
  const originalTransaction = await getOriginalChargeTransaction(bookingId)
  if (!originalTransaction?.stripe_charge_id) {
    throw new RefundError('NO_CHARGE_FOUND', 'No charge found for this booking')
  }
  
  // Check if already refunded
  const existingRefunds = await getRefundsByBooking(bookingId)
  const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0)
  
  if (totalRefunded + refundAmount > booking.total_amount) {
    return {
      success: false,
      error: 'Refund amount exceeds original charge'
    }
  }
  
  try {
    // Create Stripe refund
    const refund = await stripe.refunds.create({
      charge: originalTransaction.stripe_charge_id,
      amount: Math.round(refundAmount * 100), // Cents
      reason: mapRefundReason(reason),
      metadata: {
        booking_id: bookingId,
        requested_by: requestedBy,
        refund_type: refundType
      }
    }, {
      idempotencyKey: `refund_${bookingId}_${Date.now()}`
    })
    
    // Create refund record
    const refundRecord = await createRefundRecord({
      booking_id: bookingId,
      original_transaction_id: originalTransaction.id,
      stripe_refund_id: refund.id,
      amount: refundAmount,
      currency: booking.currency,
      reason,
      requested_by: requestedBy,
      status: refund.status
    })
    
    // Update booking
    const newStatus = refundType === 'full' ? 'refunded' : 'partially_refunded'
    await updateBooking(bookingId, {
      status: newStatus,
      refunded_amount: totalRefunded + refundAmount
    })
    
    // Send notification
    await sendRefundNotification(booking, refundAmount, reason)
    
    // Log
    await logBookingEvent(bookingId, 'refund_processed', {
      amount: refundAmount,
      type: refundType,
      stripeRefundId: refund.id
    })
    
    return {
      success: true,
      refundId: refundRecord.id,
      refundedAmount: refundAmount
    }
    
  } catch (error) {
    // Log failure
    await logBookingEvent(bookingId, 'refund_failed', {
      error: error.message,
      amount: refundAmount
    })
    
    return {
      success: false,
      error: `Refund failed: ${error.message}`
    }
  }
}

async function calculateFullRefund(booking: Booking): Promise<number> {
  // Check cancellation policy
  const policy = booking.cancellation_policy
  const now = new Date()
  
  // Find applicable rule
  for (const rule of policy.rules || []) {
    const deadline = new Date(rule.deadline)
    if (now < deadline) {
      // This rule applies
      if (rule.penaltyType === 'percentage') {
        return booking.total_amount * (1 - rule.penaltyValue / 100)
      } else if (rule.penaltyType === 'fixed') {
        return booking.total_amount - rule.penaltyValue
      } else if (rule.penaltyType === 'nights') {
        const perNight = booking.total_amount / (booking.nights || 1)
        return booking.total_amount - (perNight * rule.penaltyValue)
      }
    }
  }
  
  // Past all deadlines - check if any refund allowed
  if (policy.nonRefundableAfterDeadline) {
    return 0
  }
  
  return booking.total_amount
}

function mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
  const mapping: Record<string, Stripe.RefundCreateParams.Reason> = {
    'user_requested': 'requested_by_customer',
    'duplicate': 'duplicate',
    'fraudulent': 'fraudulent',
    'provider_cancelled': 'requested_by_customer'
  }
  return mapping[reason] || 'requested_by_customer'
}
```

---

## Dispute Handling

```typescript
interface DisputeEvidence {
  bookingId: string
  customerEmail: string
  customerName: string
  bookingDate: string
  serviceDate: string
  serviceDescription: string
  billingAddress?: string
  customerSignature?: string  // Base64 of signed terms
  receipt?: string           // URL to receipt
  additionalEvidence: string
}

async function gatherDisputeEvidence(
  bookingId: string,
  disputeId: string
): Promise<void> {
  
  const booking = await getBookingWithDetails(bookingId)
  const checkoutSession = await getCheckoutSessionByBooking(bookingId)
  
  // Build evidence
  const evidence: DisputeEvidence = {
    bookingId: booking.booking_reference,
    customerEmail: checkoutSession.contact_info.email,
    customerName: `${checkoutSession.contact_info.firstName} ${checkoutSession.contact_info.lastName}`,
    bookingDate: booking.created_at,
    serviceDate: booking.travel_start_date,
    serviceDescription: buildServiceDescription(booking),
    billingAddress: formatBillingAddress(checkoutSession.billing_address),
    additionalEvidence: buildAdditionalEvidence(booking)
  }
  
  // Store evidence
  await storeDisputeEvidence(disputeId, evidence)
  
  // Auto-submit if we have strong evidence
  if (await hasStrongEvidence(booking)) {
    await submitDisputeEvidence(disputeId, evidence)
  } else {
    // Alert for manual review
    await sendAlert({
      type: 'dispute_needs_review',
      severity: 'high',
      message: `Dispute ${disputeId} needs manual evidence review`,
      data: { bookingId, disputeId }
    })
  }
}

async function submitDisputeEvidence(
  disputeId: string,
  evidence: DisputeEvidence
): Promise<void> {
  
  const dispute = await getDispute(disputeId)
  
  await stripe.disputes.update(dispute.stripe_dispute_id, {
    evidence: {
      customer_email_address: evidence.customerEmail,
      customer_name: evidence.customerName,
      billing_address: evidence.billingAddress,
      product_description: evidence.serviceDescription,
      service_date: evidence.serviceDate,
      uncategorized_text: evidence.additionalEvidence
    },
    submit: true
  })
  
  await updateDispute(disputeId, {
    evidence_submitted: true,
    evidence_submitted_at: new Date()
  })
  
  await logDisputeEvent(disputeId, 'evidence_submitted')
}

function buildServiceDescription(booking: Booking): string {
  const items = booking.items || []
  const descriptions: string[] = []
  
  for (const item of items) {
    if (item.category === 'flight') {
      const flight = item.details as UnifiedFlight
      descriptions.push(
        `Flight booking: ${flight.slices[0]?.origin.code} to ${flight.slices[0]?.destination.code} ` +
        `on ${flight.slices[0]?.departureAt.split('T')[0]}`
      )
    } else if (item.category === 'hotel') {
      const hotel = item.details as UnifiedHotel
      descriptions.push(
        `Hotel booking: ${hotel.name} in ${hotel.location.city}, ` +
        `${booking.nights} night(s) from ${booking.travel_start_date}`
      )
    }
  }
  
  return descriptions.join('. ')
}
```

---

## Apple Pay & Google Pay

```typescript
// Apple Pay setup
async function createApplePaySession(
  checkoutToken: string,
  applePayPaymentRequest: ApplePayPaymentRequest
): Promise<{ paymentRequest: any }> {
  
  const session = await getCheckoutSession(checkoutToken)
  
  const paymentRequest = {
    countryCode: 'US',
    currencyCode: session.currency,
    total: {
      label: 'Guidera Travel',
      amount: session.final_total.toString()
    },
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'discover']
  }
  
  return { paymentRequest }
}

// Process Apple Pay / Google Pay payment
async function processWalletPayment(
  checkoutToken: string,
  paymentMethodId: string,  // Created from Apple Pay / Google Pay token
  walletType: 'apple_pay' | 'google_pay'
): Promise<ConfirmPaymentResponse> {
  
  // Same flow as regular card payment
  // The paymentMethodId is created by Stripe.js from the wallet token
  
  return await confirmPaymentAndBook({
    checkoutToken,
    paymentIntentId: session.stripe_payment_intent_id,
    paymentMethodId
  })
}
```

---

## Saved Payment Methods

```typescript
async function savePaymentMethod(
  userId: string,
  paymentMethodId: string,
  setAsDefault: boolean
): Promise<void> {
  
  // Get or create Stripe customer
  const stripeCustomerId = await getOrCreateStripeCustomer(userId)
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomerId
  })
  
  // Set as default if requested
  if (setAsDefault) {
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })
  }
  
  // Store in our database
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  
  await createUserPaymentMethod({
    user_id: userId,
    stripe_payment_method_id: paymentMethodId,
    type: paymentMethod.type,
    card_brand: paymentMethod.card?.brand,
    card_last4: paymentMethod.card?.last4,
    card_exp_month: paymentMethod.card?.exp_month,
    card_exp_year: paymentMethod.card?.exp_year,
    is_default: setAsDefault
  })
}

async function getUserPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
  const { data } = await supabase
    .from('user_payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
  
  return data || []
}
```

---

## Currency Conversion

```typescript
interface CurrencyRate {
  from: string
  to: string
  rate: number
  timestamp: Date
}

class CurrencyConverter {
  private rates: Map<string, CurrencyRate> = new Map()
  private lastFetch: Date | null = null
  
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number }> {
    
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1 }
    }
    
    const rate = await this.getRate(fromCurrency, toCurrency)
    const converted = amount * rate
    
    return {
      amount: Math.round(converted * 100) / 100, // Round to 2 decimals
      rate
    }
  }
  
  private async getRate(from: string, to: string): Promise<number> {
    const key = `${from}_${to}`
    
    // Check cache
    const cached = this.rates.get(key)
    if (cached && this.isRateFresh(cached)) {
      return cached.rate
    }
    
    // Fetch fresh rates
    await this.fetchRates()
    
    const rate = this.rates.get(key)
    if (!rate) {
      throw new Error(`No rate available for ${from} to ${to}`)
    }
    
    return rate.rate
  }
  
  private async fetchRates(): Promise<void> {
    // Use a currency API or Stripe's automatic conversion
    // For now, store rates in database and update daily
    const { data: rates } = await supabase
      .from('currency_rates')
      .select('*')
    
    for (const rate of rates || []) {
      this.rates.set(`${rate.from_currency}_${rate.to_currency}`, {
        from: rate.from_currency,
        to: rate.to_currency,
        rate: rate.rate,
        timestamp: new Date(rate.updated_at)
      })
    }
    
    this.lastFetch = new Date()
  }
  
  private isRateFresh(rate: CurrencyRate): boolean {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return rate.timestamp > hourAgo
  }
}
```

---

## Edge Cases & Error Recovery

### Double-Click Prevention

```typescript
// Every checkout action uses idempotency
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key']
  
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency key required' })
  }
  
  // Check if we've processed this before
  const cached = await getIdempotencyResult(idempotencyKey)
  if (cached) {
    return res.status(cached.statusCode).json(cached.body)
  }
  
  // Store that we're processing
  await markIdempotencyProcessing(idempotencyKey)
  
  next()
}
```

### Session Recovery

```typescript
async function recoverCheckoutSession(
  checkoutToken: string
): Promise<RecoveryResult> {
  
  const session = await getCheckoutSession(checkoutToken)
  if (!session) {
    return { recoverable: false, reason: 'Session not found' }
  }
  
  switch (session.status) {
    case 'payment_processing':
      // Check Stripe for payment status
      const paymentIntent = await stripe.paymentIntents.retrieve(session.stripe_payment_intent_id)
      
      if (paymentIntent.status === 'requires_capture') {
        // Payment authorized but booking not complete
        // Resume booking
        return { recoverable: true, action: 'resume_booking', session }
      }
      
      if (paymentIntent.status === 'requires_action') {
        // 3D Secure not completed
        return { recoverable: true, action: 'complete_3ds', session, actionUrl: paymentIntent.next_action?.redirect_to_url?.url }
      }
      
      break
      
    case 'booking_in_progress':
      // Check provider booking status
      const bookingStatus = await checkProviderBookingStatus(session)
      
      if (bookingStatus.completed) {
        // Booking completed but session not updated
        await updateCheckoutSession(session.id, { status: 'completed' })
        return { recoverable: true, action: 'show_confirmation', session, bookings: bookingStatus.bookings }
      }
      
      break
      
    case 'expired':
      return { recoverable: false, reason: 'Session expired. Please start a new checkout.' }
  }
  
  return { recoverable: false, reason: 'Unable to recover session' }
}
```

### Provider Timeout Recovery

```typescript
async function handleProviderTimeout(
  session: CheckoutSession,
  provider: string,
  item: CartItem
): Promise<BookingResult> {
  
  // 1. Wait and retry once
  await sleep(5000)
  
  try {
    const retryResult = await bookWithProviderTimeout(provider, item, 30000)
    if (retryResult.success) {
      return retryResult
    }
  } catch (e) {
    // Retry failed
  }
  
  // 2. Check if booking actually went through
  const existingBooking = await checkProviderForBooking(provider, item, session)
  if (existingBooking) {
    return {
      success: true,
      providerReference: existingBooking.reference,
      confirmationNumber: existingBooking.confirmation
    }
  }
  
  // 3. Log for manual follow-up
  await createManualFollowUp({
    type: 'provider_timeout',
    session_id: session.id,
    provider,
    item_id: item.id,
    details: 'Provider timed out during booking. Manual verification required.'
  })
  
  // 4. Alert
  await sendAlert({
    type: 'provider_timeout',
    severity: 'high',
    message: `Provider ${provider} timed out during booking`,
    data: { sessionId: session.id, itemId: item.id }
  })
  
  return {
    success: false,
    error: 'Provider timeout - booking status uncertain'
  }
}
```

---

## Implementation Checklist

### Phase 1: Database
- [ ] Create carts table
- [ ] Create cart_items table
- [ ] Create checkout_sessions table
- [ ] Create payment_transactions table
- [ ] Create stripe_webhook_events table
- [ ] Create indexes

### Phase 2: Cart Management
- [ ] Add to cart
- [ ] Remove from cart
- [ ] Update quantity
- [ ] Cart expiry cleanup job

### Phase 3: Checkout Flow
- [ ] Initialize checkout
- [ ] Price verification
- [ ] Traveler details validation
- [ ] Session management

### Phase 4: Payment Processing
- [ ] Stripe integration
- [ ] Payment Intent creation
- [ ] Payment confirmation
- [ ] 3D Secure handling
- [ ] Apple Pay / Google Pay

### Phase 5: Provider Booking
- [ ] Atomic booking coordination
- [ ] Rollback handling
- [ ] Timeout handling
- [ ] Confirmation sending

### Phase 6: Webhooks
- [ ] Webhook endpoint
- [ ] Event handlers
- [ ] Idempotency handling

### Phase 7: Refunds
- [ ] Refund calculation
- [ ] Refund processing
- [ ] Partial refunds

### Phase 8: Disputes
- [ ] Dispute detection
- [ ] Evidence gathering
- [ ] Auto-submission

---

**This Checkout & Payment System ensures users can book confidently while protecting the business from fraud, chargebacks, and provider failures. Every edge case is handled.**
