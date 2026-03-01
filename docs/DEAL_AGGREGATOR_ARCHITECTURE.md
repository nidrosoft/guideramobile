# Guidera: Deal Aggregator & Metasearch Architecture

## Executive Summary

Guidera is pivoting from a **full OTA (Online Travel Agency)** model — where we handle payments, bookings, refunds, and disputes — to a **metasearch/deal aggregator** model, similar to how **Skyscanner, Kayak, Google Flights, and AirClub** operate.

**The new model:** Users search for flights, hotels, cars, and experiences inside the app. We aggregate results from multiple providers, surface the best deals, and when users are ready to book, we redirect them to the external provider's website/app via deep links or affiliate URLs. **We never handle payment or booking fulfillment.**

This eliminates the need for Stripe integration, cart/checkout systems, booking management, refunds, disputes, and all the complexity that comes with being an OTA.

**Revenue model:** Affiliate commissions (CPA/CPC) from travel partners via Travelpayouts, direct affiliate programs (Booking.com, Kiwi.com), and potentially sponsored placements.

---

## Part 1: Current System Audit — What Exists Today

### 1.1 Database Tables to DROP (Booking/Payment Related)

These tables are purely for OTA booking management and have **no role** in a metasearch model:

| Table | Rows | Purpose | Action |
|-------|------|---------|--------|
| `carts` | 0 | Shopping cart | **DROP** |
| `cart_items` | 0 | Cart line items | **DROP** |
| `checkout_sessions` | 0 | Checkout flow state | **DROP** |
| `payment_transactions` | 0 | Stripe payments | **DROP** |
| `stripe_webhook_events` | 0 | Stripe event log | **DROP** |
| `user_payment_methods` | 0 | Saved cards | **DROP** |
| `stripe_customers` | 0 | Stripe customer mapping | **DROP** |
| `booking_items` | 0 | Booking line items | **DROP** |
| `booking_status_history` | 0 | Status audit trail | **DROP** |
| `booking_modifications` | 0 | Name/date changes | **DROP** |
| `cancellation_requests` | 0 | Cancellation flow | **DROP** |
| `refunds` | 0 | Refund tracking | **DROP** |
| `disputes` | 0 | Stripe disputes | **DROP** |
| `booking_communications` | 0 | Email/SMS logs | **DROP** |
| `provider_webhooks` | 0 | Provider callback logs | **DROP** |
| `manual_follow_ups` | 0 | Support follow-ups | **DROP** |
| `system_alerts` | 0 | System alerts for ops | **DROP** |

### 1.2 Database Tables to REPURPOSE

| Table | Current Purpose | New Purpose | Action |
|-------|----------------|-------------|--------|
| `bookings` | Full booking records with payment | Lightweight "saved deals" / "deal clicks" tracking | **REPURPOSE** → rename to `deal_clicks` or create new table |
| `flight_bookings` | Flight booking details | Not needed | **DROP** |
| `hotel_bookings` | Hotel booking details | Not needed | **DROP** |
| `car_bookings` | Car booking details | Not needed | **DROP** |
| `experience_bookings` | Experience booking details | Not needed | **DROP** |
| `search_sessions` | Search session tracking | **KEEP** — still needed for search | **KEEP** |
| `search_results` | Cached search results | **KEEP** — still needed | **KEEP** |
| `popular_searches` | Trending searches | **KEEP** — still needed | **KEEP** |
| `price_alerts` | Price tracking | **KEEP & ENHANCE** — core feature now | **ENHANCE** |
| `destination_intelligence` | Destination metadata | **KEEP** — still needed | **KEEP** |

### 1.3 Database Tables to KEEP (Non-Booking)

All community, trip planning, AI, profile, and social tables remain untouched. They are independent of the booking system.

### 1.4 New Database Tables Needed

| Table | Purpose |
|-------|---------|
| `deal_clicks` | Track when user clicks "Book on [Provider]" — for analytics & affiliate attribution |
| `saved_deals` | User's saved/favorited deals (replaces bookmarks) |
| `deal_cache` | Cached deal results from background scanning (for proactive deal alerts) |
| `price_history` | Historical price data points for price trend graphs |
| `affiliate_config` | Provider affiliate link templates, commission rates, deep link patterns |

### 1.5 Edge Functions to DELETE

| Function | Purpose | Action |
|----------|---------|--------|
| `create-payment-intent` | Stripe PaymentIntent creation | **DELETE** |
| `stripe-webhook` | Stripe webhook handler | **DELETE** |
| `complete-flight-booking` | Amadeus booking confirmation | **DELETE** |
| `flight-offer-price` | Amadeus price confirmation (for booking) | **REPURPOSE** → price verification for display only |

### 1.6 Edge Functions to KEEP

| Function | Purpose | Notes |
|----------|---------|-------|
| `flight-search` | Search flights | Keep, enhance with deep_link/affiliate URL |
| `hotel-search` | Search hotels | Keep, enhance with deep_link/affiliate URL |
| `provider-manager` | Multi-provider orchestration | Keep, enhance |
| `search` | Unified search | Keep |
| `homepage` | Homepage personalization | Keep |
| `ai-generation` | AI trip content | Keep |
| `weather` | Weather data | Keep |
| `safety-alerts` | Safety data | Keep |
| `currency` | Currency conversion | Keep |
| `translation` | Translation | Keep |
| `places` | Google Places | Keep |
| `flight-tracking` | Flight status | Keep |
| `scheduled-jobs` | Background jobs | Keep, modify (remove booking sync jobs) |

### 1.7 New Edge Functions Needed

| Function | Purpose |
|----------|---------|
| `deal-scanner` | Background deal scanning — polls APIs for price drops on watched routes |
| `generate-affiliate-link` | Generates proper affiliate/deep link URLs for each provider |
| `price-monitor` | Monitors prices for user-set alerts, sends push notifications on drops |

### 1.8 Frontend Files to DELETE

**Services (full delete):**
- `src/services/stripe.service.ts`
- `src/services/booking/booking-coordinator.ts`
- `src/services/booking/booking-lifecycle.service.ts`
- `src/services/booking/cancellation.service.ts`
- `src/services/booking/modification.service.ts`
- `src/services/cart/cart.service.ts`
- `src/services/cart/cart.types.ts`
- `src/services/cart/index.ts`
- `src/services/checkout/checkout.service.ts`
- `src/services/checkout/checkout.types.ts`
- `src/services/checkout/index.ts`
- `src/services/documents/document.service.ts` (e-tickets, vouchers — we won't generate these)
- `src/services/documents/document.types.ts`
- `src/services/documents/index.ts`
- `src/services/communications/communication.service.ts` (booking confirmations)
- `src/services/communications/communication.types.ts`
- `src/services/communications/index.ts`
- `src/services/compensation.service.ts`
- `src/services/flight-offer-price.service.ts` (Amadeus pricing for booking)

**Hooks (full delete):**
- `src/hooks/useCart.ts`
- `src/hooks/useCheckout.ts`

**Screens/Routes (delete):**
- `src/app/booking/flights/checkout.tsx`
- `src/app/booking/hotels/checkout.tsx`
- `src/app/account/payment-methods.tsx`
- `src/app/account/transactions.tsx`

**Booking Flow Screens (refactor, not full delete — see Part 3):**
- All `*CheckoutScreen.tsx` files → Replace with `*DealScreen.tsx` (deal summary + redirect)
- All `PaymentSheet.tsx` files → Delete
- All `TravelerDetailsSheet.tsx` files → Delete (no longer collecting traveler data)
- `HotelConfirmationScreen.tsx` → Delete

### 1.9 Frontend Files to HEAVILY REFACTOR

| File | Current | New |
|------|---------|-----|
| `src/services/booking.service.ts` | Full CRUD for bookings, payments, transactions | Slim: track deal clicks, saved deals only |
| `src/services/booking/booking.types.ts` | 358 lines of OTA types | Slim: DealClick, SavedDeal types only |
| `src/hooks/useBookings.ts` | Full booking management | Replace with `useDeals.ts` — saved deals, deal clicks |
| `src/app/account/bookings.tsx` | Booking list screen | Replace with "Saved Deals" / "Recent Searches" screen |
| `src/app/account/booking-detail.tsx` | Booking detail screen | Replace with "Deal Detail" screen |
| Each `*CheckoutScreen.tsx` | Payment flow | "Deal Summary" → "Book on [Provider]" redirect button |
| `FlightCheckoutScreenV2.tsx` / `V3.tsx` | Legacy checkout variants | Delete |

---

## Part 2: New Architecture — The Deal Aggregator Model

### 2.1 How It Works (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW                                                       │
│                                                                   │
│  1. Search: "Flights NYC → Paris, Mar 15-22, 2 adults"          │
│     ↓                                                             │
│  2. Results: Aggregated from Kiwi.com + Amadeus + Google Flights │
│     - Shows price, airline, stops, duration                       │
│     - "Best Deal" badge on cheapest option                        │
│     - Price trend indicator (↓ price dropped 15%)                 │
│     ↓                                                             │
│  3. Deal Detail: Full flight info + price breakdown               │
│     - "View on Kiwi.com" / "View on Google Flights" button       │
│     - Price alert: "Notify me if price drops below $400"          │
│     - Save deal to favorites                                      │
│     ↓                                                             │
│  4. Redirect: Opens provider website/app via deep link            │
│     - User completes booking on provider's platform               │
│     - We earn affiliate commission (CPA/CPC)                      │
│     ↓                                                             │
│  5. Post-Redirect: User returns to app                            │
│     - "Did you book this flight?" prompt                          │
│     - If yes → add to trip planner (manual entry)                 │
│     - Trip planning features still work                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Provider & Affiliate Strategy

#### Flights
| Provider | API | Deep Link | Commission Model | Notes |
|----------|-----|-----------|-----------------|-------|
| **Kiwi.com (via Travelpayouts)** | Tequila API `/v2/search` | `deep_link` field in API response | CPA (per booking) | **Primary** — already integrated, response includes `deep_link` |
| **Skyscanner (Redirect API)** | Partners API | Redirect URL with affiliate ID | CPC (per click) | Apply for partner access |
| **Google Flights** | No API — construct URL | `https://www.google.com/travel/flights?q=...` | No commission (free traffic) | Fallback — construct search URL from params |
| **Amadeus** | Flight Offers Search | No direct booking link (GDS) | N/A | Use for data enrichment only, redirect to airline website |

#### Hotels
| Provider | API | Deep Link | Commission Model |
|----------|-----|-----------|-----------------|
| **Booking.com (via Travelpayouts)** | RapidAPI | `url` field in API response | CPA 4-5% per booking |
| **Hotels.com (via Expedia Affiliate)** | EAN API | Affiliate deep link | CPA 3-4% |
| **Agoda** | Via Travelpayouts | Affiliate link | CPA |

#### Cars
| Provider | API | Deep Link | Commission Model |
|----------|-----|-----------|-----------------|
| **Rentalcars.com / DiscoverCars** | Via Travelpayouts | Affiliate link | CPA |
| **Kayak Cars** | Redirect API | Affiliate URL | CPC |

#### Experiences
| Provider | API | Deep Link | Commission Model |
|----------|-----|-----------|-----------------|
| **GetYourGuide** | Affiliate API | Deep link with partner ID | CPA 8% |
| **Viator (TripAdvisor)** | Affiliate API | Deep link | CPA 8% |

### 2.3 Affiliate Link Generation

Every search result includes a `bookingUrl` or `deepLink` field. The system constructs these URLs with our affiliate tracking parameters:

```typescript
// Example: Kiwi.com flight
// API already returns: flight.deep_link = "https://www.kiwi.com/deep?..."
// We append our affiliate marker:
const affiliateUrl = `${flight.deep_link}&affid=GUIDERA_AFF_ID`

// Example: Booking.com hotel
// API returns: hotel.url = "https://www.booking.com/hotel/..."
// We construct affiliate link:
const affiliateUrl = `https://www.booking.com/hotel/${hotelSlug}.html?aid=GUIDERA_BOOKING_AID&...`

// Example: Google Flights (no API, construct URL)
const googleFlightsUrl = `https://www.google.com/travel/flights?q=Flights+to+${destination}+from+${origin}+on+${date}`
```

### 2.4 The Deal Engine — Background Price Scanning

This is the "smart" part that makes users say **"damn, this app really finds the best deals."**

#### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  DEAL ENGINE (Runs on Railway/Supabase Edge Cron)            │
│                                                                │
│  ┌─────────────────┐    ┌──────────────────┐                 │
│  │  Route Monitor   │    │  Price Tracker    │                 │
│  │                  │    │                   │                 │
│  │  - Popular routes│    │  - User alerts    │                 │
│  │  - User home     │    │  - Saved deals    │                 │
│  │    airports      │    │  - Trip routes    │                 │
│  │  - Trending      │    │                   │                 │
│  │    destinations  │    │                   │                 │
│  └────────┬─────────┘    └────────┬──────────┘                │
│           │                       │                            │
│           ▼                       ▼                            │
│  ┌─────────────────────────────────────────┐                  │
│  │         API Poller (Every 6-12 hours)    │                  │
│  │                                          │                  │
│  │  1. Query Kiwi.com for each route        │                  │
│  │  2. Query Booking.com for each city      │                  │
│  │  3. Compare with previous prices         │                  │
│  │  4. Detect significant drops (>15%)      │                  │
│  │  5. Store in deal_cache + price_history  │                  │
│  └────────────────────┬─────────────────────┘                  │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                  │
│  │         Deal Scorer & Ranker             │                  │
│  │                                          │                  │
│  │  Score = f(                               │                  │
│  │    price_drop_pct,       // 30% weight   │                  │
│  │    historical_low,       // 20% weight   │                  │
│  │    time_sensitivity,     // 15% weight   │                  │
│  │    user_interest_match,  // 20% weight   │                  │
│  │    route_popularity      // 15% weight   │                  │
│  │  )                                        │                  │
│  └────────────────────┬─────────────────────┘                  │
│                       │                                        │
│                       ▼                                        │
│  ┌─────────────────────────────────────────┐                  │
│  │         Notification Dispatcher          │                  │
│  │                                          │                  │
│  │  - Push notification: "NYC→Paris $389!   │                  │
│  │    Price dropped 22% — usually $499"     │                  │
│  │  - In-app deal feed                      │                  │
│  │  - Homepage "Hot Deals" section          │                  │
│  └──────────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

#### How the Deal Engine Detects "Great Deals"

1. **Historical Price Baseline**: For popular routes, we store 30-90 days of price history. We know the median, P25, and P10 prices for each route/date combination.

2. **Drop Detection**: When a new scan returns a price that is:
   - **>15% below median** → "Good Deal" badge
   - **>25% below median** → "Great Deal" badge  
   - **At or near historical low** → "Lowest Price We've Seen" badge
   - **Within 10% of historical low** → "Near Record Low" badge

3. **Urgency Signals**: 
   - Prices that dropped in the last 24h → "Price just dropped"
   - Limited availability signals from API → "Only X left at this price"
   - Date proximity → "For travel next week"

4. **Personalization**: Cross-reference with user's:
   - Home airport (from profile)
   - Travel preferences (from `travel_preferences`)
   - Past searches (from `search_sessions`)
   - Saved destinations
   - Trip dates (from `trips` table)

#### Technical Implementation

The deal scanner is a **Supabase Edge Function triggered by cron** (via `scheduled-jobs`):

```
Schedule:
- Every 6 hours: Scan top 50 popular routes from user data
- Every 12 hours: Scan user-specific price alerts
- Every 24 hours: Full scan of trending destinations × user home airports
- Real-time: On-demand when user searches (always fresh)
```

This is lightweight enough for Supabase Edge Functions. If we need heavier workloads later (e.g., scanning 10,000+ routes), we can move to a **Railway background worker** that writes results to Supabase.

---

## Part 3: Implementation Plan — Phased Approach

### Phase 1: Database Cleanup (Day 1)
**Goal:** Remove all payment/booking tables, create new deal tables.

**Steps:**
1. Drop 17 payment/booking tables (all have 0 rows, safe to drop)
2. Drop `flight_bookings`, `hotel_bookings`, `car_bookings`, `experience_bookings`
3. Repurpose/recreate `bookings` → `deal_clicks`
4. Create new tables: `saved_deals`, `deal_cache`, `price_history`, `affiliate_config`
5. Enhance `price_alerts` table with more fields
6. Remove booking-related scheduled jobs from `scheduled_jobs`

### Phase 2: Edge Function Cleanup (Day 1-2)
**Goal:** Delete payment functions, enhance search functions with affiliate links.

**Steps:**
1. Delete `create-payment-intent`, `stripe-webhook`, `complete-flight-booking`
2. Update `provider-manager` to include `bookingUrl`/`deepLink` in all results
3. Update `flight-search` — ensure Kiwi `deep_link` is passed through
4. Update `hotel-search` — ensure Booking.com `url` is passed through
5. Update `scheduled-jobs` — remove booking sync, add deal scanning
6. Create `deal-scanner` edge function
7. Create `price-monitor` edge function

### Phase 3: Frontend Service Cleanup (Day 2-3)
**Goal:** Delete payment/booking services, create deal services.

**Steps:**
1. Delete: `stripe.service.ts`, `cart/`, `checkout/`, `documents/`, `communications/`, `compensation.service.ts`, `flight-offer-price.service.ts`
2. Delete: `booking/booking-coordinator.ts`, `booking/booking-lifecycle.service.ts`, `booking/cancellation.service.ts`, `booking/modification.service.ts`
3. Rewrite `booking.service.ts` → `deal.service.ts` (track clicks, saved deals)
4. Rewrite `booking/booking.types.ts` → `deal.types.ts` (DealClick, SavedDeal, PriceAlert types)
5. Delete hooks: `useCart.ts`, `useCheckout.ts`
6. Rewrite `useBookings.ts` → `useDeals.ts`
7. Create `usePriceAlerts.ts` hook

### Phase 4: Frontend Flow Refactor (Day 3-5)
**Goal:** Transform checkout screens into deal summary + redirect screens.

**For each booking flow (flight, hotel, car, experience):**

**Current flow:**
```
Search → Results → Checkout (traveler details, payment, confirm) → Booking confirmation
```

**New flow:**
```
Search → Results → Deal Summary → "Book on [Provider]" (opens browser/app)
```

**Specific changes per flow:**

#### Flights
- `FlightSearchScreen.tsx` — **KEEP** as-is
- `FlightSearchLoadingScreen.tsx` — **KEEP** as-is
- `FlightResultsScreen.tsx` — **KEEP**, add "Best Deal" badges, price trend indicators
- `FlightCheckoutScreen.tsx` → **REPLACE** with `FlightDealScreen.tsx`:
  - Shows flight summary (airline, times, stops, duration)
  - Shows price with deal badge ("22% below average")
  - Price history mini-chart
  - "Set Price Alert" button
  - "Save Deal" button
  - **"Book on Kiwi.com →" / "Book on Google Flights →"** primary CTA
  - Opens `Linking.openURL(affiliateUrl)` or in-app browser
- **DELETE**: `FlightCheckoutScreenV2.tsx`, `FlightCheckoutScreenV3.tsx`
- **DELETE**: `PaymentSheet.tsx` (flight), `ExtrasSheet.tsx`, `SeatSelectionSheet.tsx`, `BaggageSheet.tsx`
- **DELETE**: `TravelerDetailsSheet.tsx`
- **KEEP**: `FlightDetailSheet.tsx` / `FlightDetailSheetDark.tsx` (useful for viewing details)
- **DELETE**: `checkout/` components folder, `context/CheckoutContext.tsx`, `types/checkout.types.ts`, `utils/checkout-validation.ts`

#### Hotels
- `HotelSearchScreen.tsx` — **KEEP**
- `HotelSearchLoadingScreen.tsx` — **KEEP**
- `HotelResultsScreen.tsx` — **KEEP**, add deal badges
- `HotelDetailScreen.tsx` — **KEEP**, this becomes the deal summary screen
- `HotelCheckoutScreen.tsx` → **REPLACE** with redirect logic in `HotelDetailScreen`
- **DELETE**: `HotelConfirmationScreen.tsx`, `PaymentSheet.tsx`, `GuestDetailsSheet.tsx`
- **KEEP**: `RoomDetailSheet.tsx`, `HotelBookingSummarySheet.tsx` (repurpose as deal summary)

#### Cars
- `CarSearchScreen.tsx` — **KEEP**
- `CarSearchLoadingScreen.tsx` — **KEEP**
- `CarResultsScreen.tsx` — **KEEP**, add deal badges
- `CarCheckoutScreen.tsx` → **REPLACE** with `CarDealScreen.tsx`
- **DELETE**: `PaymentSheet.tsx`, `DriverDetailsSheet.tsx`
- **KEEP**: `CarDetailSheet.tsx`

#### Experiences
- `ExperienceSearchScreen.tsx` — **KEEP**
- `ExperienceSearchLoadingScreen.tsx` — **KEEP**
- `ExperienceResultsScreen.tsx` — **KEEP**, add deal badges
- `ExperienceCheckoutScreen.tsx` → **REPLACE** with `ExperienceDealScreen.tsx`

#### Packages
- **DELETE entire package flow** — packages require coordinated multi-provider booking which doesn't work in a redirect model. Users can search individual categories instead.
- OR: **REPURPOSE** as "Trip Bundle Builder" that links out to each provider separately.

### Phase 5: Account Section Cleanup (Day 5-6)
**Goal:** Replace booking management screens with deal tracking.

**Changes:**
- `src/app/account/bookings.tsx` → Rename to "My Deals" — shows saved deals, recent deal clicks, price alerts
- `src/app/account/booking-detail.tsx` → Rename to deal detail — shows deal info + "Book on [Provider]" button
- **DELETE**: `src/app/account/payment-methods.tsx` — no payment methods needed
- **DELETE**: `src/app/account/transactions.tsx` — no transactions
- Update `AccountScreen.tsx` — remove "Payment Methods", "Transactions" menu items; rename "Bookings" to "My Deals"

### Phase 6: Deal Engine Implementation (Day 6-8)
**Goal:** Build the background deal scanning system.

**Steps:**
1. Implement `deal-scanner` edge function:
   - Scans top routes based on user data
   - Stores results in `deal_cache`
   - Stores price points in `price_history`
2. Implement `price-monitor` edge function:
   - Checks user `price_alerts`
   - Sends push notifications via existing alert system
3. Add deal scanning jobs to `scheduled-jobs`
4. Build deal scoring algorithm
5. Add "Hot Deals" section to homepage
6. Add price history charts to deal screens

### Phase 7: Stripe & Dependencies Cleanup (Day 8)
**Goal:** Remove all Stripe dependencies.

**Steps:**
1. Remove `@stripe/stripe-react-native` from `package.json`
2. Remove `StripeProvider` from `src/app/_layout.tsx`
3. Remove `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` from `.env`
4. Remove Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
5. Clean up any remaining Stripe imports across the codebase

---

## Part 4: New Database Schema

### 4.1 `deal_clicks` (replaces `bookings`)

```sql
CREATE TABLE deal_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  provider TEXT NOT NULL,             -- 'kiwi', 'booking', 'google_flights', etc.
  affiliate_url TEXT NOT NULL,        -- The URL we redirected to
  deal_snapshot JSONB NOT NULL,       -- Snapshot of deal at click time (price, details)
  price_amount NUMERIC NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  search_session_id UUID REFERENCES search_sessions(id),
  clicked_at TIMESTAMPTZ DEFAULT now(),
  -- Attribution
  source TEXT,                        -- 'search', 'deal_feed', 'price_alert', 'homepage'
  campaign TEXT,                       -- For tracking which feature drove the click
  -- Post-click tracking
  user_confirmed_booking BOOLEAN DEFAULT false, -- User said "yes I booked"
  confirmed_at TIMESTAMPTZ
);
```

### 4.2 `saved_deals`

```sql
CREATE TABLE saved_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  provider TEXT NOT NULL,
  deal_snapshot JSONB NOT NULL,       -- Full deal data at save time
  affiliate_url TEXT,
  price_at_save NUMERIC NOT NULL,
  current_price NUMERIC,              -- Updated by price monitor
  price_currency TEXT DEFAULT 'USD',
  price_changed BOOLEAN DEFAULT false,
  price_change_pct NUMERIC,
  route_key TEXT,                     -- e.g., 'JFK-CDG-2025-03-15' for dedup
  is_expired BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, route_key)
);
```

### 4.3 `deal_cache`

```sql
CREATE TABLE deal_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_type TEXT NOT NULL,
  route_key TEXT NOT NULL,            -- 'JFK-CDG' or 'hotel-paris'
  provider TEXT NOT NULL,
  date_range TEXT,                    -- '2025-03-15:2025-03-22'
  deal_data JSONB NOT NULL,           -- Full deal data
  price_amount NUMERIC NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  deal_score NUMERIC,                 -- 0-100, higher = better deal
  deal_badges TEXT[],                 -- ['best_price', 'price_drop', 'trending']
  scanned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '12 hours',
  UNIQUE(deal_type, route_key, provider, date_range)
);
```

### 4.4 `price_history`

```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key TEXT NOT NULL,            -- 'JFK-CDG' or 'hotel-paris-hilton'
  deal_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  date_range TEXT,
  price_amount NUMERIC NOT NULL,
  price_currency TEXT DEFAULT 'USD',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_price_history_route_date ON price_history(route_key, deal_type, recorded_at DESC);
-- Partition or auto-delete after 90 days to keep table small
```

### 4.5 Enhanced `price_alerts`

```sql
-- price_alerts table already exists, add these columns:
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS
  target_price NUMERIC,               -- Alert when price drops below this
  current_price NUMERIC,
  lowest_seen_price NUMERIC,
  highest_seen_price NUMERIC,
  price_checks_count INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  alert_type TEXT DEFAULT 'price_drop' CHECK (alert_type IN ('price_drop', 'any_change', 'target_price'));
```

### 4.6 `affiliate_config`

```sql
CREATE TABLE affiliate_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  deal_types TEXT[] NOT NULL,         -- ['flight'], ['hotel'], ['car', 'experience']
  affiliate_id TEXT,                   -- Our affiliate ID with this provider
  link_template TEXT,                  -- URL template with {placeholders}
  commission_model TEXT,               -- 'cpa', 'cpc', 'revenue_share'
  commission_rate NUMERIC,             -- e.g., 0.04 for 4%
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,          -- Higher = preferred provider
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Part 5: Affiliate Link Strategy

### 5.1 Already Available in Current API Responses

**Kiwi.com flights:** The `deep_link` field in every search result is a ready-to-use booking URL. Line 223 of `kiwi.ts` already maps this: `bookingUrl: flight.deep_link || flight.booking_token`. We just need to append our Travelpayouts affiliate marker.

**Booking.com hotels:** The `url` field is mapped on line 379 of `expedia.ts`: `deepLink: hotel.url`. This is a direct Booking.com hotel page URL. We append our affiliate AID.

### 5.2 Google Flights (Constructed URL)

For Amadeus results (which don't have booking links since it's a GDS), we construct a Google Flights URL:

```
https://www.google.com/travel/flights/search?tfs=CBwQ...
```

Or simpler:
```
https://www.google.com/travel/flights?q=Flights+from+JFK+to+CDG+on+Mar+15+returning+Mar+22
```

### 5.3 Provider Priority for Redirect

When multiple providers have the same flight:
1. **Kiwi.com** — Has native deep_link, we earn commission
2. **Google Flights** — No commission but trusted by users
3. **Airline direct** — Construct airline website URL (e.g., `delta.com/flight/...`)

---

## Part 6: File-Level Cleanup Checklist

### DELETE (Services — 18 files)
```
src/services/stripe.service.ts
src/services/booking/booking-coordinator.ts
src/services/booking/booking-lifecycle.service.ts
src/services/booking/cancellation.service.ts
src/services/booking/modification.service.ts
src/services/cart/cart.service.ts
src/services/cart/cart.types.ts
src/services/cart/index.ts
src/services/checkout/checkout.service.ts
src/services/checkout/checkout.types.ts
src/services/checkout/index.ts
src/services/documents/document.service.ts
src/services/documents/document.types.ts
src/services/documents/index.ts
src/services/communications/communication.service.ts
src/services/communications/communication.types.ts
src/services/communications/index.ts
src/services/compensation.service.ts
src/services/flight-offer-price.service.ts
```

### DELETE (Hooks — 2 files)
```
src/hooks/useCart.ts
src/hooks/useCheckout.ts
```

### DELETE (Edge Functions — 3 functions)
```
supabase/functions/create-payment-intent/
supabase/functions/stripe-webhook/
supabase/functions/complete-flight-booking/
```

### DELETE (Flight checkout components — 10+ files)
```
src/features/booking/flows/flight/screens/FlightCheckoutScreen.tsx
src/features/booking/flows/flight/screens/FlightCheckoutScreen.styles.ts
src/features/booking/flows/flight/screens/FlightCheckoutScreenV2.tsx
src/features/booking/flows/flight/screens/FlightCheckoutScreenV3.tsx
src/features/booking/flows/flight/sheets/BaggageSheet.tsx
src/features/booking/flows/flight/sheets/ExtrasSheet.tsx
src/features/booking/flows/flight/sheets/SeatSelectionSheet.tsx
src/features/booking/flows/flight/sheets/TravelerDetailsSheet.tsx
src/features/booking/flows/flight/sheets/TravelerDetailsSheet.styles.ts
src/features/booking/flows/flight/components/checkout/ (entire folder)
src/features/booking/flows/flight/context/CheckoutContext.tsx
src/features/booking/flows/flight/types/checkout.types.ts
src/features/booking/flows/flight/utils/checkout-validation.ts
```

### DELETE (Hotel checkout — 4+ files)
```
src/features/booking/flows/hotel/screens/HotelCheckoutScreen.tsx
src/features/booking/flows/hotel/screens/HotelCheckoutScreen.styles.ts
src/features/booking/flows/hotel/screens/HotelConfirmationScreen.tsx
src/features/booking/flows/hotel/sheets/PaymentSheet.tsx
src/features/booking/flows/hotel/sheets/GuestDetailsSheet.tsx
src/features/booking/flows/hotel/sheets/GuestDetailsSheet.styles.ts
```

### DELETE (Car checkout — 3+ files)
```
src/features/booking/flows/car/screens/CarCheckoutScreen.tsx
src/features/booking/flows/car/screens/CarCheckoutScreen.styles.ts
src/features/booking/flows/car/sheets/PaymentSheet.tsx
src/features/booking/flows/car/sheets/DriverDetailsSheet.tsx
src/features/booking/flows/car/sheets/ProtectionSheet.tsx
```

### DELETE (Experience checkout — 2+ files)
```
src/features/booking/flows/experience/screens/ExperienceCheckoutScreen.tsx
src/features/booking/flows/experience/screens/ExperienceCheckoutScreen.styles.ts
```

### DELETE (Package flow — entire directory, 18 files)
```
src/features/booking/flows/package/ (entire directory)
```

### DELETE (Account screens — 2 files)
```
src/app/account/payment-methods.tsx
src/app/account/transactions.tsx
```

### DELETE (Route files — 2 files)
```
src/app/booking/flights/checkout.tsx
src/app/booking/hotels/checkout.tsx
```

### REWRITE (8 files)
```
src/services/booking.service.ts → src/services/deal.service.ts
src/services/booking/booking.types.ts → src/services/deal/deal.types.ts
src/services/booking/index.ts → src/services/deal/index.ts
src/hooks/useBookings.ts → src/hooks/useDeals.ts
src/app/account/bookings.tsx → "My Deals" screen
src/app/account/booking-detail.tsx → "Deal Detail" screen
```

### CREATE (New files — ~15 files)
```
src/services/deal/deal.service.ts
src/services/deal/deal.types.ts
src/services/deal/affiliate.service.ts
src/services/deal/price-alert.service.ts
src/services/deal/index.ts
src/hooks/useDeals.ts
src/hooks/usePriceAlerts.ts
src/features/booking/flows/flight/screens/FlightDealScreen.tsx
src/features/booking/flows/flight/screens/FlightDealScreen.styles.ts
src/features/booking/flows/hotel/screens/HotelDealScreen.tsx (or enhance HotelDetailScreen)
src/features/booking/flows/car/screens/CarDealScreen.tsx
src/features/booking/flows/car/screens/CarDealScreen.styles.ts
src/features/booking/flows/experience/screens/ExperienceDealScreen.tsx
src/features/booking/components/shared/DealBadge.tsx
src/features/booking/components/shared/PriceHistoryChart.tsx
src/features/booking/components/shared/BookOnProviderButton.tsx
src/features/booking/components/shared/PriceAlertButton.tsx
supabase/functions/deal-scanner/index.ts
supabase/functions/price-monitor/index.ts
```

---

## Part 7: Estimated Timeline

| Phase | Work | Duration |
|-------|------|----------|
| Phase 1 | Database cleanup (drop tables, create new) | 1 day |
| Phase 2 | Edge function cleanup & enhancement | 1-2 days |
| Phase 3 | Frontend service/hook cleanup | 1-2 days |
| Phase 4 | Frontend flow refactor (4 booking flows) | 2-3 days |
| Phase 5 | Account section cleanup | 1 day |
| Phase 6 | Deal engine (scanner, price monitor, alerts) | 2-3 days |
| Phase 7 | Stripe removal & final cleanup | 0.5 day |
| **Total** | | **8-12 days** |

---

## Part 8: What We Keep & Why

- **Search flows** (search screen → loading → results) — Core value prop, untouched
- **Trip planning system** — Users still plan trips, they just book externally
- **AI generation engine** — Packing lists, dos/donts still work
- **Community & social** — Completely independent
- **Homepage personalization** — Still works, add "Hot Deals" section
- **Price alerts** — Enhanced, now core feature
- **All provider APIs** (Kiwi, Amadeus, Booking.com) — Still used for search, just no booking
- **Flight tracking** — Users can still track flights they booked externally

---

## Part 9: Revenue Model

| Source | How | Expected |
|--------|-----|----------|
| **Kiwi.com CPA** | Commission per flight booked via our link | ~$2-8 per booking |
| **Booking.com CPA** | 4-5% of hotel booking value | ~$5-25 per booking |
| **GetYourGuide CPA** | 8% of experience value | ~$3-15 per booking |
| **Rentalcars.com CPA** | Commission per car rental | ~$3-10 per booking |
| **Sponsored placements** | Providers pay for prominent placement | Negotiated |
| **Premium features** | Price alert limits, historical data access | Subscription |

At 10K MAU with 5% conversion to click-through and 10% of those completing bookings:
- 10,000 × 5% × 10% = 50 bookings/month
- Average commission $10 = **$500/month baseline**
- Scales linearly with users

---

## Summary

This pivot dramatically simplifies the tech stack while keeping the core value (finding great travel deals) and adds a new value layer (proactive deal finding). The user experience actually improves because:

1. **Faster** — No checkout friction, no forms to fill
2. **Trustworthy** — Users book on platforms they already trust (Booking.com, Google Flights)
3. **Smarter** — The deal engine proactively finds savings users wouldn't find on their own
4. **Lighter** — No payment PCI compliance, no refund handling, no dispute management

---

## Part 10: Implementation Status (COMPLETED Feb 28, 2026)

### Database ✅
- Dropped 23 payment/booking tables
- Created 5 new tables: `deal_clicks`, `saved_deals`, `deal_cache`, `price_history`, `affiliate_config`
- Enhanced `price_alerts` with target/current/lowest/highest price tracking
- Seeded 6 providers in `affiliate_config`

### Edge Functions ✅
- Deleted: `create-payment-intent`, `stripe-webhook`, `complete-flight-booking`, `flight-offer-price`
- Rewrote: `scheduled-jobs` (deal scanning, price alerts, saved deal updates, trip transitions, cleanup)
- Updated: `provider-manager` (removed `book` action)

### Frontend Services ✅
- Created: `src/services/deal/` (deal.types.ts, deal.service.ts, affiliate.service.ts, price-alert.service.ts)
- Deleted: stripe, cart, checkout, documents, communications, payment, booking (coordinator/lifecycle/cancellation/modification)
- Deleted: useBookingStore, usePackageStore (dead code)

### Frontend Hooks ✅
- Created: `useDeals.ts` (useSavedDeals, useRecentClicks, useHotDeals, useDealRedirect, usePriceHistory, useIsDealSaved)
- Created: `usePriceAlerts.ts` (usePriceAlerts, useHasAlert)
- Deleted: useCart, useCheckout, useBookings

### Shared Components ✅
- `DealBadge` — Deal quality indicators (best_price, price_drop, near_record_low, etc.)
- `BookOnProviderButton` — Primary CTA with provider color + haptic + Linking.openURL
- `PriceAlertButton` — Toggle alert on/off
- `PriceHistoryChart` — Mini sparkline bar chart with low/avg/high stats

### Flow Screens ✅
- `FlightDealScreen` — Full deal summary replacing FlightCheckoutScreen
- `HotelDetailScreen` — "Continue" → BookOnProviderButton (Booking.com)
- `CarDetailSheet` — "Select This Car" → BookOnProviderButton (Rentalcars.com)
- `ExperienceDetailSheet` — "Check Availability" → BookOnProviderButton (GetYourGuide)
- All 4 flow orchestrators updated (checkout steps removed)
- Package flow deleted entirely (18 files)

### Account Section ✅
- `bookings.tsx` → "My Deals" (Saved + Recent tabs)
- `booking-detail.tsx` → Full Deal Detail screen (snapshot, price change, history, redirect)
- Account sections config: "Bookings & Payments" → "My Deals"
- Deleted: payment-methods.tsx, transactions.tsx

### Homepage ✅
- `DealsSection.tsx` → Shows real hot deals from `deal_cache` table
- PackageBookingFlow removed from home screen

### Dependencies ✅
- `@stripe/stripe-react-native` removed from package.json
- `StripeProvider` removed from _layout.tsx
- `npm install` confirmed: "removed 1 package"
