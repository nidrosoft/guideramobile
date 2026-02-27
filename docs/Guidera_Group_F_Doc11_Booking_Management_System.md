# Document 11: Booking Management System

## Purpose

This document defines the complete booking management system for Guidera — everything that happens AFTER a booking is confirmed. This includes status tracking, modifications, cancellations, refunds, customer communication, document delivery, and handling the countless things that can go wrong with multi-provider travel bookings.

As a **solo founder**, you need systems that run themselves. This document provides automation, self-service, and intelligent escalation so you only get involved when truly necessary.

---

## What Can Go Wrong (And Will)

### Provider-Side Issues
- ✈️ **Flight schedule changes** — Airlines change departure times daily
- ✈️ **Flight cancellations** — Weather, mechanical, low load factors
- ✈️ **Overbooking** — Airline sold more seats than available
- 🏨 **Hotel overbooking** — Property overcommitted
- 🏨 **Hotel relocation** — Walked to different property
- 🏨 **Room type unavailable** — Booked deluxe, only standard available
- 🚗 **Car not available** — Vehicle not at pickup location
- 🚗 **Wrong car category** — Reserved SUV, got compact
- 🎫 **Experience cancellation** — Weather, minimum participants not met
- 🎫 **Experience schedule change** — Time slot moved
- 💀 **Provider bankruptcy** — Tour company goes out of business
- 🌍 **Force majeure** — Natural disasters, pandemics, political unrest

### User-Side Issues
- 👤 **Name change requests** — Typo in booking, name doesn't match passport
- 📅 **Date change requests** — Plans changed, need different dates
- 🚫 **Cancellation requests** — Trip cancelled entirely
- ➕ **Add travelers** — Need to add another person
- ➖ **Remove travelers** — Someone dropped out
- 🛫 **Upgrade requests** — Want better cabin/room
- 📝 **Special requests** — Wheelchair, dietary, late checkout
- 🤔 **No-show** — User doesn't show up

### System Issues
- 🔄 **Sync failures** — Provider status doesn't update
- 📧 **Email delivery failures** — Confirmations bounced
- 📱 **Push notification failures** — User didn't get alert
- 🎫 **Document delivery failures** — E-ticket not generated
- 💰 **Refund processing failures** — Stripe declined refund
- 🔗 **Provider API outages** — Can't get status updates

### Financial Issues
- 💳 **Chargebacks** — User disputes charge
- 💸 **Partial refunds** — Complex multi-item calculations
- 💵 **Currency fluctuation** — Booked in EUR, refunding in USD
- 🏷️ **Promo code abuse** — Trying to get double refund
- 🏦 **Provider payout disputes** — Provider says we owe more/less

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BOOKING MANAGEMENT SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    BOOKING LIFECYCLE ENGINE                          │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Status     │  │   Sync       │  │   Alert      │              │   │
│   │  │   Tracker    │  │   Engine     │  │   Manager    │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│   ┌──────────────┬──────────────┬────┴─────┬──────────────┬────────────┐   │
│   │              │              │          │              │            │   │
│   ▼              ▼              ▼          ▼              ▼            ▼   │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│ │Modifi- │  │Cancel- │  │ Refund │  │Document│  │ Comms  │  │Dispute │   │
│ │cation  │  │lation  │  │Manager │  │Manager │  │ Engine │  │Handler │   │
│ │Handler │  │Handler │  │        │  │        │  │        │  │        │   │
│ └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     AUTOMATION ENGINE                                │   │
│   │                                                                      │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│   │  │   Self-      │  │   Auto-      │  │   Smart      │              │   │
│   │  │   Service    │  │   Resolution │  │   Escalation │              │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Booking identity
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  
  -- Type
  booking_type VARCHAR(50) NOT NULL,           -- 'single', 'package'
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  /*
    'pending' - Waiting for provider confirmation
    'confirmed' - Fully confirmed
    'ticketed' - Tickets/vouchers issued
    'modified' - Booking has been modified
    'partially_cancelled' - Some items cancelled
    'cancelled' - Fully cancelled
    'completed' - Travel completed
    'no_show' - User didn't show
    'disputed' - Under dispute
    'refunded' - Fully refunded
  */
  
  previous_status VARCHAR(50),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_change_reason TEXT,
  
  -- Payment
  total_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_refunded DECIMAL(12,2) DEFAULT 0,
  
  -- Travelers
  travelers JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  
  -- Travel dates
  travel_start_date DATE,
  travel_end_date DATE,
  
  -- Cancellation
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_by VARCHAR(50),                    -- 'user', 'provider', 'system', 'support'
  cancellation_reason TEXT,
  
  -- Refund
  is_refundable BOOLEAN DEFAULT TRUE,
  refund_deadline TIMESTAMPTZ,
  cancellation_policy JSONB,
  
  -- Modification
  is_modifiable BOOLEAN DEFAULT TRUE,
  modification_deadline TIMESTAMPTZ,
  modification_count INTEGER DEFAULT 0,
  
  -- Documents
  documents_generated BOOLEAN DEFAULT FALSE,
  documents JSONB DEFAULT '[]',
  
  -- Communication
  confirmation_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Issues
  has_issue BOOLEAN DEFAULT FALSE,
  issue_type VARCHAR(100),
  issue_description TEXT,
  issue_resolved BOOLEAN DEFAULT FALSE,
  issue_resolved_at TIMESTAMPTZ,
  
  -- Dispute
  has_dispute BOOLEAN DEFAULT FALSE,
  dispute_id UUID,
  dispute_status VARCHAR(50),
  
  -- Provider sync
  last_synced_at TIMESTAMPTZ,
  sync_status VARCHAR(50) DEFAULT 'synced',    -- 'synced', 'pending', 'error'
  sync_error TEXT,
  
  -- Metadata
  source VARCHAR(50),                          -- 'web', 'ios', 'android'
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(travel_start_date, travel_end_date);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_issues ON bookings(has_issue) WHERE has_issue = TRUE;
CREATE INDEX idx_bookings_sync ON bookings(sync_status) WHERE sync_status != 'synced';
```

### Booking Items Table

```sql
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Item identity
  category VARCHAR(50) NOT NULL,               -- 'flight', 'hotel', 'car', 'experience'
  
  -- Provider
  provider_code VARCHAR(50) NOT NULL,
  provider_booking_id VARCHAR(255),
  provider_confirmation_number VARCHAR(100),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  /*
    'pending' - Waiting for confirmation
    'confirmed' - Provider confirmed
    'ticketed' - Ticket/voucher issued
    'modified' - Item modified
    'cancelled' - Item cancelled
    'completed' - Service delivered
    'no_show' - User didn't show
    'provider_cancelled' - Provider cancelled
    'schedule_changed' - Schedule was changed
  */
  
  previous_status VARCHAR(50),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Item details (snapshot at booking)
  item_details JSONB NOT NULL,                 -- Full UnifiedFlight/Hotel/etc
  
  -- Pricing
  price_amount DECIMAL(12,2) NOT NULL,
  price_currency VARCHAR(3) NOT NULL,
  
  -- Dates/times
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  
  -- Documents
  documents JSONB DEFAULT '[]',                -- [{type, url, generated_at}]
  
  -- Traveler assignment
  traveler_indices INTEGER[],
  
  -- Cancellation
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_fee DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  
  -- Provider sync
  last_synced_at TIMESTAMPTZ,
  provider_status VARCHAR(100),
  provider_raw_status JSONB,
  
  -- Schedule changes
  original_details JSONB,                      -- If schedule changed, original details
  schedule_change_detected_at TIMESTAMPTZ,
  schedule_change_acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_provider ON booking_items(provider_code, provider_booking_id);
CREATE INDEX idx_booking_items_status ON booking_items(status);
CREATE INDEX idx_booking_items_dates ON booking_items(start_datetime);
```

### Booking Status History

```sql
CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_item_id UUID REFERENCES booking_items(id) ON DELETE CASCADE,
  
  -- Status change
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  
  -- Context
  changed_by VARCHAR(50),                      -- 'user', 'provider', 'system', 'support', 'webhook'
  change_reason TEXT,
  
  -- Provider info
  provider_event_type VARCHAR(100),
  provider_raw_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_status_history_booking ON booking_status_history(booking_id, created_at DESC);
```

### Booking Modifications

```sql
CREATE TABLE booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_item_id UUID REFERENCES booking_items(id),
  
  -- Modification type
  modification_type VARCHAR(100) NOT NULL,
  /*
    'name_change'
    'date_change'
    'time_change'
    'add_traveler'
    'remove_traveler'
    'upgrade'
    'downgrade'
    'special_request'
    'contact_update'
  */
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  /*
    'pending' - Awaiting processing
    'submitted' - Sent to provider
    'confirmed' - Provider confirmed
    'rejected' - Provider rejected
    'failed' - Processing failed
    'cancelled' - User cancelled request
  */
  
  -- Request details
  requested_by VARCHAR(50),                    -- 'user', 'support', 'system'
  request_details JSONB NOT NULL,              -- What was requested
  
  -- Before/after
  original_data JSONB,
  modified_data JSONB,
  
  -- Provider interaction
  provider_code VARCHAR(50),
  provider_modification_id VARCHAR(255),
  provider_response JSONB,
  
  -- Pricing
  price_difference DECIMAL(12,2),
  fee_amount DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  payment_required BOOLEAN DEFAULT FALSE,
  payment_transaction_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  user_notes TEXT
);

CREATE INDEX idx_modifications_booking ON booking_modifications(booking_id);
CREATE INDEX idx_modifications_status ON booking_modifications(status);
```

### Cancellation Requests

```sql
CREATE TABLE cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Request details
  requested_by VARCHAR(50) NOT NULL,           -- 'user', 'provider', 'system', 'support'
  request_reason VARCHAR(255),
  request_notes TEXT,
  
  -- Scope
  cancellation_type VARCHAR(50) NOT NULL,      -- 'full', 'partial'
  items_to_cancel UUID[],                      -- booking_item_ids (for partial)
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  /*
    'pending' - Awaiting processing
    'calculating' - Calculating refund
    'awaiting_confirmation' - User must confirm
    'processing' - Processing with providers
    'completed' - Fully cancelled
    'partial' - Partially completed
    'rejected' - Cannot be cancelled
    'failed' - Processing failed
  */
  
  -- Refund calculation
  refund_calculation JSONB,
  /*
    {
      total_eligible: 500,
      cancellation_fee: 50,
      refund_amount: 450,
      items: [
        { item_id, original_amount, fee, refund }
      ]
    }
  */
  
  -- Policy applied
  policy_applied JSONB,
  
  -- Provider cancellations
  provider_cancellations JSONB DEFAULT '[]',
  /*
    [
      { provider, item_id, status, reference, cancelled_at }
    ]
  */
  
  -- Refund
  refund_id UUID REFERENCES refunds(id),
  refund_status VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Automation
  auto_processed BOOLEAN DEFAULT FALSE,
  auto_process_reason VARCHAR(255)
);

CREATE INDEX idx_cancellations_booking ON cancellation_requests(booking_id);
CREATE INDEX idx_cancellations_status ON cancellation_requests(status);
```

### Refunds Table

```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  booking_id UUID REFERENCES bookings(id),
  cancellation_request_id UUID REFERENCES cancellation_requests(id),
  original_transaction_id UUID REFERENCES payment_transactions(id),
  
  -- Refund identity
  refund_reference VARCHAR(50) UNIQUE NOT NULL,
  
  -- Stripe
  stripe_refund_id VARCHAR(100),
  stripe_status VARCHAR(50),
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Breakdown
  refund_breakdown JSONB,
  /*
    {
      base_amount: 500,
      cancellation_fee: 50,
      processing_fee: 5,
      final_refund: 445,
      items: [...]
    }
  */
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  /*
    'pending' - Not yet processed
    'processing' - Being processed
    'succeeded' - Refund completed
    'failed' - Refund failed
    'cancelled' - Refund cancelled
  */
  
  -- Reason
  reason VARCHAR(255),
  requested_by VARCHAR(50),
  
  -- Processing
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Estimated arrival
  estimated_arrival DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_stripe ON refunds(stripe_refund_id);
```

### Disputes Table

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  
  -- Stripe
  stripe_dispute_id VARCHAR(100) UNIQUE,
  stripe_charge_id VARCHAR(100),
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Dispute details
  reason VARCHAR(100),                         -- Stripe dispute reason
  status VARCHAR(50),                          -- Stripe dispute status
  
  -- Evidence
  evidence_due_by TIMESTAMPTZ,
  evidence_submitted BOOLEAN DEFAULT FALSE,
  evidence_submitted_at TIMESTAMPTZ,
  evidence_data JSONB,
  
  -- Outcome
  outcome VARCHAR(50),                         -- 'won', 'lost', 'pending'
  outcome_reason TEXT,
  
  -- Internal tracking
  assigned_to VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'high',
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_evidence_due ON disputes(evidence_due_by) WHERE NOT evidence_submitted;
```

### Booking Communications

```sql
CREATE TABLE booking_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Communication type
  type VARCHAR(50) NOT NULL,
  /*
    'confirmation_email'
    'confirmation_sms'
    'reminder_email'
    'schedule_change_alert'
    'cancellation_notice'
    'refund_confirmation'
    'modification_confirmation'
    'document_delivery'
    'trip_reminder'
    'review_request'
  */
  
  -- Channel
  channel VARCHAR(20) NOT NULL,                -- 'email', 'sms', 'push'
  
  -- Recipient
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  recipient_user_id UUID,
  
  -- Content
  subject VARCHAR(255),
  template_id VARCHAR(100),
  template_data JSONB,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  /*
    'pending' - Not yet sent
    'sent' - Sent successfully
    'delivered' - Delivery confirmed
    'opened' - Email opened
    'clicked' - Link clicked
    'bounced' - Email bounced
    'failed' - Failed to send
  */
  
  -- Provider (SendGrid, Twilio, etc)
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  
  -- Delivery info
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communications_booking ON booking_communications(booking_id);
CREATE INDEX idx_communications_status ON booking_communications(status);
CREATE INDEX idx_communications_pending ON booking_communications(status, next_retry_at) 
  WHERE status IN ('pending', 'failed') AND retry_count < 3;
```

### Provider Webhooks

```sql
CREATE TABLE provider_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider
  provider_code VARCHAR(50) NOT NULL,
  
  -- Webhook identity
  webhook_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Matching
  booking_id UUID REFERENCES bookings(id),
  booking_item_id UUID REFERENCES booking_items(id),
  matched BOOLEAN DEFAULT FALSE,
  match_attempted_at TIMESTAMPTZ,
  match_error TEXT,
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Action taken
  action_taken VARCHAR(100),
  action_details JSONB,
  
  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_webhooks_booking ON provider_webhooks(booking_id);
CREATE INDEX idx_provider_webhooks_unprocessed ON provider_webhooks(processed, received_at) 
  WHERE NOT processed;
```

---

## Booking Lifecycle Engine

### Status Tracker

```typescript
interface BookingStatusUpdate {
  bookingId: string
  newStatus: BookingStatus
  changedBy: 'user' | 'provider' | 'system' | 'support' | 'webhook'
  reason?: string
  providerData?: any
}

async function updateBookingStatus(update: BookingStatusUpdate): Promise<void> {
  const { bookingId, newStatus, changedBy, reason, providerData } = update
  
  // Get current booking
  const booking = await getBooking(bookingId)
  if (!booking) {
    throw new BookingError('BOOKING_NOT_FOUND', 'Booking not found')
  }
  
  // Validate status transition
  if (!isValidStatusTransition(booking.status, newStatus)) {
    throw new BookingError('INVALID_TRANSITION', 
      `Cannot transition from ${booking.status} to ${newStatus}`)
  }
  
  // Update booking
  await supabase
    .from('bookings')
    .update({
      status: newStatus,
      previous_status: booking.status,
      status_changed_at: new Date().toISOString(),
      status_change_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
  
  // Record history
  await supabase
    .from('booking_status_history')
    .insert({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: newStatus,
      changed_by: changedBy,
      change_reason: reason,
      provider_raw_data: providerData
    })
  
  // Trigger side effects
  await handleStatusChange(booking, newStatus, changedBy)
  
  // Log
  await logBookingEvent(bookingId, 'status_changed', {
    from: booking.status,
    to: newStatus,
    changedBy,
    reason
  })
}

function isValidStatusTransition(from: BookingStatus, to: BookingStatus): boolean {
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    'pending': ['confirmed', 'cancelled', 'failed'],
    'confirmed': ['ticketed', 'modified', 'cancelled', 'completed', 'no_show', 'disputed'],
    'ticketed': ['modified', 'cancelled', 'completed', 'no_show', 'disputed'],
    'modified': ['ticketed', 'cancelled', 'completed', 'no_show', 'disputed'],
    'partially_cancelled': ['cancelled', 'completed', 'disputed'],
    'cancelled': ['refunded', 'disputed'],
    'completed': ['disputed'],
    'no_show': ['disputed'],
    'disputed': ['confirmed', 'cancelled', 'refunded'],
    'refunded': []
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

async function handleStatusChange(
  booking: Booking,
  newStatus: BookingStatus,
  changedBy: string
): Promise<void> {
  
  switch (newStatus) {
    case 'confirmed':
      await sendConfirmationEmail(booking)
      await generateDocuments(booking)
      await scheduleReminders(booking)
      break
      
    case 'ticketed':
      await deliverDocuments(booking)
      break
      
    case 'cancelled':
      await processCancellationEffects(booking)
      await sendCancellationNotice(booking)
      break
      
    case 'completed':
      await scheduleReviewRequest(booking)
      await updateUserStats(booking)
      break
      
    case 'no_show':
      await handleNoShow(booking)
      break
      
    case 'disputed':
      await createDisputeAlert(booking)
      break
  }
}
```

### Sync Engine

Periodically syncs booking status with providers.

```typescript
interface SyncResult {
  bookingId: string
  itemId: string
  synced: boolean
  statusChanged: boolean
  newStatus?: string
  error?: string
}

async function syncBookingWithProviders(bookingId: string): Promise<SyncResult[]> {
  const booking = await getBookingWithItems(bookingId)
  const results: SyncResult[] = []
  
  for (const item of booking.items) {
    try {
      // Get status from provider
      const adapter = getProviderAdapter(item.provider_code)
      const providerStatus = await adapter.getBookingStatus(item.provider_booking_id)
      
      // Check for changes
      if (providerStatus.status !== item.provider_status) {
        // Status changed
        const newStatus = mapProviderStatus(item.provider_code, providerStatus.status)
        
        await updateBookingItemStatus(item.id, {
          status: newStatus,
          provider_status: providerStatus.status,
          provider_raw_status: providerStatus,
          last_synced_at: new Date()
        })
        
        // Handle specific changes
        if (providerStatus.scheduleChanged) {
          await handleScheduleChange(item, providerStatus)
        }
        
        if (providerStatus.cancelled) {
          await handleProviderCancellation(booking, item, providerStatus)
        }
        
        results.push({
          bookingId,
          itemId: item.id,
          synced: true,
          statusChanged: true,
          newStatus
        })
        
      } else {
        // No change
        await updateBookingItem(item.id, { last_synced_at: new Date() })
        
        results.push({
          bookingId,
          itemId: item.id,
          synced: true,
          statusChanged: false
        })
      }
      
    } catch (error) {
      results.push({
        bookingId,
        itemId: item.id,
        synced: false,
        error: error.message
      })
      
      // Update sync error
      await updateBookingItem(item.id, {
        sync_status: 'error',
        sync_error: error.message
      })
    }
  }
  
  // Update booking sync status
  const allSynced = results.every(r => r.synced)
  await updateBooking(bookingId, {
    last_synced_at: new Date(),
    sync_status: allSynced ? 'synced' : 'error'
  })
  
  return results
}

// Scheduled job: Sync all bookings
async function syncAllActiveBookings(): Promise<void> {
  // Get bookings that need sync
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .in('status', ['confirmed', 'ticketed', 'modified'])
    .gt('travel_end_date', new Date().toISOString())
    .or(`last_synced_at.is.null,last_synced_at.lt.${getHoursAgo(6)}`)
    .limit(100)
  
  for (const booking of bookings || []) {
    try {
      await syncBookingWithProviders(booking.id)
    } catch (error) {
      console.error(`Sync failed for booking ${booking.id}:`, error)
    }
  }
}
```

### Schedule Change Handler

```typescript
interface ScheduleChange {
  itemId: string
  changeType: 'time_change' | 'date_change' | 'route_change' | 'cancellation'
  original: any
  updated: any
  significance: 'minor' | 'major' | 'critical'
}

async function handleScheduleChange(
  item: BookingItem,
  providerStatus: ProviderStatus
): Promise<void> {
  
  const change = detectScheduleChange(item, providerStatus)
  
  // Save original details
  await updateBookingItem(item.id, {
    original_details: item.item_details,
    item_details: providerStatus.updatedDetails,
    schedule_change_detected_at: new Date(),
    status: 'schedule_changed'
  })
  
  // Record the change
  await recordScheduleChange(item.booking_id, item.id, change)
  
  // Notify based on significance
  if (change.significance === 'critical') {
    // Flight cancelled or major route change
    await sendCriticalChangeAlert(item.booking_id, change)
    await createUrgentAlert({
      type: 'critical_schedule_change',
      bookingId: item.booking_id,
      change
    })
    
  } else if (change.significance === 'major') {
    // Time change > 2 hours
    await sendMajorChangeNotification(item.booking_id, change)
    
  } else {
    // Minor time change
    await sendMinorChangeNotification(item.booking_id, change)
  }
  
  // Check if change affects connected items
  if (item.category === 'flight') {
    await checkConnectedItemsForConflict(item.booking_id, item.id, change)
  }
}

function detectScheduleChange(
  item: BookingItem,
  providerStatus: ProviderStatus
): ScheduleChange {
  
  const original = item.item_details
  const updated = providerStatus.updatedDetails
  
  if (item.category === 'flight') {
    const originalFlight = original as UnifiedFlight
    const updatedFlight = updated as UnifiedFlight
    
    // Check for cancellation
    if (providerStatus.cancelled) {
      return {
        itemId: item.id,
        changeType: 'cancellation',
        original,
        updated,
        significance: 'critical'
      }
    }
    
    // Check departure time change
    const originalDep = new Date(originalFlight.slices[0].departureAt)
    const updatedDep = new Date(updatedFlight.slices[0].departureAt)
    const timeDiffHours = Math.abs(updatedDep.getTime() - originalDep.getTime()) / (1000 * 60 * 60)
    
    if (timeDiffHours > 4) {
      return {
        itemId: item.id,
        changeType: 'time_change',
        original: { departureAt: originalFlight.slices[0].departureAt },
        updated: { departureAt: updatedFlight.slices[0].departureAt },
        significance: 'critical'
      }
    } else if (timeDiffHours > 2) {
      return {
        itemId: item.id,
        changeType: 'time_change',
        original: { departureAt: originalFlight.slices[0].departureAt },
        updated: { departureAt: updatedFlight.slices[0].departureAt },
        significance: 'major'
      }
    } else if (timeDiffHours > 0) {
      return {
        itemId: item.id,
        changeType: 'time_change',
        original: { departureAt: originalFlight.slices[0].departureAt },
        updated: { departureAt: updatedFlight.slices[0].departureAt },
        significance: 'minor'
      }
    }
  }
  
  // Default
  return {
    itemId: item.id,
    changeType: 'time_change',
    original,
    updated,
    significance: 'minor'
  }
}

async function checkConnectedItemsForConflict(
  bookingId: string,
  changedItemId: string,
  change: ScheduleChange
): Promise<void> {
  
  const booking = await getBookingWithItems(bookingId)
  const changedItem = booking.items.find(i => i.id === changedItemId)
  
  if (!changedItem || changedItem.category !== 'flight') return
  
  const flight = changedItem.item_details as UnifiedFlight
  const arrivalTime = new Date(flight.slices[flight.slices.length - 1].arrivalAt)
  
  // Check hotels - does arrival time still work for check-in?
  for (const item of booking.items) {
    if (item.category === 'hotel' && item.id !== changedItemId) {
      const hotel = item.item_details as UnifiedHotel
      // Assume check-in is at 3 PM
      const checkInTime = new Date(item.start_datetime)
      checkInTime.setHours(15, 0, 0, 0)
      
      if (arrivalTime > checkInTime) {
        // Might arrive after check-in
        await createConflictAlert(bookingId, changedItemId, item.id, {
          type: 'late_arrival',
          flightArrival: arrivalTime,
          hotelCheckIn: checkInTime
        })
      }
    }
    
    // Check experiences - does arrival time conflict?
    if (item.category === 'experience' && item.id !== changedItemId) {
      const experienceStart = new Date(item.start_datetime)
      
      if (arrivalTime > experienceStart) {
        await createConflictAlert(bookingId, changedItemId, item.id, {
          type: 'missed_experience',
          flightArrival: arrivalTime,
          experienceStart
        })
      }
    }
  }
}
```

---

## Modification Handler

### Name Change

```typescript
interface NameChangeRequest {
  bookingId: string
  itemId: string
  travelerIndex: number
  originalName: { firstName: string; lastName: string }
  newName: { firstName: string; lastName: string }
  reason: string
  supportingDocument?: string  // URL to passport, etc.
}

async function requestNameChange(request: NameChangeRequest): Promise<ModificationResult> {
  const { bookingId, itemId, travelerIndex, originalName, newName, reason } = request
  
  const booking = await getBookingWithItems(bookingId)
  const item = booking.items.find(i => i.id === itemId)
  
  if (!item) {
    throw new BookingError('ITEM_NOT_FOUND', 'Booking item not found')
  }
  
  // Check if name changes allowed
  const adapter = getProviderAdapter(item.provider_code)
  const policy = await adapter.getModificationPolicy(item.provider_booking_id)
  
  if (!policy.nameChangeAllowed) {
    return {
      success: false,
      error: 'Name changes are not allowed for this booking',
      suggestion: 'You may need to cancel and rebook with the correct name'
    }
  }
  
  // Calculate fee
  const fee = await adapter.getNameChangeFee(item.provider_booking_id)
  
  // Create modification request
  const modification = await createModification({
    booking_id: bookingId,
    booking_item_id: itemId,
    modification_type: 'name_change',
    requested_by: 'user',
    request_details: {
      travelerIndex,
      originalName,
      newName,
      reason
    },
    original_data: { name: originalName },
    fee_amount: fee,
    total_cost: fee,
    payment_required: fee > 0
  })
  
  // If no fee, process immediately
  if (fee === 0) {
    return await processNameChange(modification.id)
  }
  
  // Otherwise, return requiring payment
  return {
    success: true,
    modificationId: modification.id,
    requiresPayment: true,
    fee,
    message: `Name change requires a fee of ${formatCurrency(fee)}`
  }
}

async function processNameChange(modificationId: string): Promise<ModificationResult> {
  const modification = await getModification(modificationId)
  
  try {
    // Submit to provider
    const adapter = getProviderAdapter(modification.provider_code)
    const result = await adapter.submitNameChange(
      modification.provider_booking_id,
      modification.request_details
    )
    
    if (result.success) {
      // Update modification
      await updateModification(modificationId, {
        status: 'confirmed',
        provider_modification_id: result.modificationId,
        provider_response: result,
        modified_data: { name: modification.request_details.newName },
        completed_at: new Date()
      })
      
      // Update booking travelers
      await updateBookingTraveler(
        modification.booking_id,
        modification.request_details.travelerIndex,
        modification.request_details.newName
      )
      
      // Send confirmation
      await sendModificationConfirmation(modification.booking_id, modification)
      
      return { success: true, message: 'Name change completed successfully' }
      
    } else {
      await updateModification(modificationId, {
        status: 'rejected',
        provider_response: result
      })
      
      return {
        success: false,
        error: result.error || 'Name change was rejected by the provider'
      }
    }
    
  } catch (error) {
    await updateModification(modificationId, {
      status: 'failed',
      provider_response: { error: error.message }
    })
    
    return {
      success: false,
      error: `Name change failed: ${error.message}`
    }
  }
}
```

### Date Change

```typescript
interface DateChangeRequest {
  bookingId: string
  itemId: string
  originalDates: { start: string; end: string }
  newDates: { start: string; end: string }
  reason: string
}

async function requestDateChange(request: DateChangeRequest): Promise<ModificationResult> {
  const { bookingId, itemId, originalDates, newDates, reason } = request
  
  const booking = await getBookingWithItems(bookingId)
  const item = booking.items.find(i => i.id === itemId)
  
  // Check if date changes allowed
  const adapter = getProviderAdapter(item.provider_code)
  const policy = await adapter.getModificationPolicy(item.provider_booking_id)
  
  if (!policy.dateChangeAllowed) {
    return {
      success: false,
      error: 'Date changes are not allowed for this booking',
      suggestion: 'You may need to cancel and make a new booking'
    }
  }
  
  // Check availability for new dates
  const availability = await adapter.checkAvailabilityForChange(
    item.provider_booking_id,
    newDates
  )
  
  if (!availability.available) {
    return {
      success: false,
      error: `Not available for selected dates`,
      alternatives: availability.alternatives
    }
  }
  
  // Calculate price difference
  const priceDifference = availability.newPrice - item.price_amount
  const changeFee = await adapter.getDateChangeFee(item.provider_booking_id)
  const totalCost = Math.max(0, priceDifference) + changeFee
  
  // Create modification request
  const modification = await createModification({
    booking_id: bookingId,
    booking_item_id: itemId,
    modification_type: 'date_change',
    requested_by: 'user',
    request_details: {
      originalDates,
      newDates,
      reason
    },
    original_data: { dates: originalDates, price: item.price_amount },
    modified_data: { dates: newDates, price: availability.newPrice },
    price_difference: priceDifference,
    fee_amount: changeFee,
    total_cost: totalCost,
    payment_required: totalCost > 0
  })
  
  // If price decreased or no change, might have refund
  if (priceDifference < 0 && changeFee === 0) {
    return {
      success: true,
      modificationId: modification.id,
      refundAmount: Math.abs(priceDifference),
      message: `Date change will result in a refund of ${formatCurrency(Math.abs(priceDifference))}`
    }
  }
  
  if (totalCost > 0) {
    return {
      success: true,
      modificationId: modification.id,
      requiresPayment: true,
      amount: totalCost,
      breakdown: {
        priceDifference: Math.max(0, priceDifference),
        changeFee
      }
    }
  }
  
  // No cost - process immediately
  return await processDateChange(modification.id)
}
```

---

## Cancellation Handler

### Full Cancellation

```typescript
interface CancellationRequest {
  bookingId: string
  requestedBy: 'user' | 'provider' | 'system' | 'support'
  reason: string
  forceCancel?: boolean  // For provider cancellations
}

async function requestCancellation(
  request: CancellationRequest
): Promise<CancellationResult> {
  
  const { bookingId, requestedBy, reason, forceCancel } = request
  
  const booking = await getBookingWithItems(bookingId)
  
  // Check if cancellation allowed
  if (!forceCancel && !booking.is_refundable) {
    // Check if within policy window
    const policy = await evaluateCancellationPolicy(booking)
    if (!policy.cancellable) {
      return {
        success: false,
        cancellable: false,
        reason: policy.reason
      }
    }
  }
  
  // Calculate refund
  const refundCalculation = await calculateCancellationRefund(booking)
  
  // Create cancellation request
  const cancellationRequest = await createCancellationRequest({
    booking_id: bookingId,
    requested_by: requestedBy,
    request_reason: reason,
    cancellation_type: 'full',
    refund_calculation: refundCalculation,
    policy_applied: booking.cancellation_policy
  })
  
  // For self-service: if refund is straightforward, auto-process
  if (requestedBy === 'user' && refundCalculation.isAutomatable) {
    // Show confirmation to user
    return {
      success: true,
      cancellationId: cancellationRequest.id,
      requiresConfirmation: true,
      refundSummary: {
        originalAmount: booking.total_amount,
        cancellationFee: refundCalculation.totalFee,
        refundAmount: refundCalculation.refundAmount,
        estimatedArrival: '5-10 business days'
      }
    }
  }
  
  // For provider/system cancellations, process immediately
  if (requestedBy === 'provider' || requestedBy === 'system' || forceCancel) {
    return await processCancellation(cancellationRequest.id)
  }
  
  return {
    success: true,
    cancellationId: cancellationRequest.id,
    status: 'pending_review',
    message: 'Cancellation request submitted for review'
  }
}

async function confirmAndProcessCancellation(
  cancellationId: string
): Promise<CancellationResult> {
  
  const cancellation = await getCancellationRequest(cancellationId)
  
  await updateCancellationRequest(cancellationId, {
    confirmed_at: new Date()
  })
  
  return await processCancellation(cancellationId)
}

async function processCancellation(
  cancellationId: string
): Promise<CancellationResult> {
  
  const cancellation = await getCancellationRequest(cancellationId)
  const booking = await getBookingWithItems(cancellation.booking_id)
  
  await updateCancellationRequest(cancellationId, {
    status: 'processing'
  })
  
  const providerCancellations: ProviderCancellation[] = []
  let allCancelled = true
  
  // Cancel with each provider
  for (const item of booking.items) {
    try {
      const adapter = getProviderAdapter(item.provider_code)
      const result = await adapter.cancelBooking(item.provider_booking_id)
      
      providerCancellations.push({
        provider: item.provider_code,
        item_id: item.id,
        status: result.success ? 'cancelled' : 'failed',
        reference: result.cancellationReference,
        cancelled_at: result.success ? new Date().toISOString() : null,
        error: result.error
      })
      
      if (result.success) {
        await updateBookingItem(item.id, {
          status: 'cancelled',
          is_cancelled: true,
          cancelled_at: new Date()
        })
      } else {
        allCancelled = false
      }
      
    } catch (error) {
      providerCancellations.push({
        provider: item.provider_code,
        item_id: item.id,
        status: 'failed',
        error: error.message
      })
      allCancelled = false
    }
  }
  
  // Update cancellation request
  await updateCancellationRequest(cancellationId, {
    provider_cancellations: providerCancellations,
    status: allCancelled ? 'completed' : 'partial',
    completed_at: new Date()
  })
  
  // Update booking
  await updateBookingStatus({
    bookingId: booking.id,
    newStatus: allCancelled ? 'cancelled' : 'partially_cancelled',
    changedBy: cancellation.requested_by,
    reason: cancellation.request_reason
  })
  
  // Process refund
  if (cancellation.refund_calculation.refundAmount > 0) {
    const refund = await processRefund({
      bookingId: booking.id,
      reason: cancellation.request_reason,
      requestedBy: cancellation.requested_by,
      refundType: 'full',
      amount: cancellation.refund_calculation.refundAmount
    })
    
    await updateCancellationRequest(cancellationId, {
      refund_id: refund.refundId,
      refund_status: refund.success ? 'processing' : 'failed'
    })
  }
  
  // Send cancellation confirmation
  await sendCancellationConfirmation(booking, cancellation)
  
  // Handle any failures
  if (!allCancelled) {
    await createManualFollowUp({
      type: 'partial_cancellation',
      booking_id: booking.id,
      details: 'Some provider cancellations failed',
      provider_cancellations: providerCancellations.filter(p => p.status === 'failed')
    })
    
    await sendAlert({
      type: 'partial_cancellation',
      severity: 'high',
      message: `Partial cancellation for booking ${booking.booking_reference}`,
      data: { bookingId: booking.id, failures: providerCancellations.filter(p => p.status === 'failed') }
    })
  }
  
  return {
    success: allCancelled,
    cancellationId,
    providerCancellations,
    refundAmount: cancellation.refund_calculation.refundAmount,
    refundStatus: 'processing'
  }
}
```

### Refund Calculation

```typescript
interface RefundCalculation {
  originalAmount: number
  itemBreakdown: {
    itemId: string
    category: string
    originalAmount: number
    cancellationFee: number
    refundAmount: number
    policy: string
  }[]
  totalFee: number
  refundAmount: number
  currency: string
  isAutomatable: boolean
  automationReason?: string
}

async function calculateCancellationRefund(booking: Booking): Promise<RefundCalculation> {
  const now = new Date()
  const itemBreakdown: RefundCalculation['itemBreakdown'] = []
  
  for (const item of booking.items) {
    const policy = getCancellationPolicyForItem(item)
    let cancellationFee = 0
    let refundAmount = item.price_amount
    let policyApplied = 'Full refund'
    
    if (!policy) {
      // No policy = non-refundable
      cancellationFee = item.price_amount
      refundAmount = 0
      policyApplied = 'Non-refundable'
      
    } else {
      // Find applicable rule
      for (const rule of policy.rules) {
        const deadline = new Date(rule.deadline)
        
        if (now >= deadline) {
          // Past this deadline
          if (rule.penaltyType === 'percentage') {
            cancellationFee = item.price_amount * (rule.penaltyValue / 100)
          } else if (rule.penaltyType === 'fixed') {
            cancellationFee = rule.penaltyValue
          } else if (rule.penaltyType === 'nights') {
            const perNight = item.price_amount / (item.nights || 1)
            cancellationFee = perNight * rule.penaltyValue
          } else if (rule.penaltyType === 'full') {
            cancellationFee = item.price_amount
          }
          
          policyApplied = rule.description || `${rule.penaltyValue}% penalty`
          break
        }
      }
      
      refundAmount = Math.max(0, item.price_amount - cancellationFee)
    }
    
    itemBreakdown.push({
      itemId: item.id,
      category: item.category,
      originalAmount: item.price_amount,
      cancellationFee: Math.round(cancellationFee * 100) / 100,
      refundAmount: Math.round(refundAmount * 100) / 100,
      policy: policyApplied
    })
  }
  
  const totalFee = itemBreakdown.reduce((sum, i) => sum + i.cancellationFee, 0)
  const totalRefund = itemBreakdown.reduce((sum, i) => sum + i.refundAmount, 0)
  
  // Determine if automatable
  const isAutomatable = itemBreakdown.every(i => 
    i.cancellationFee === 0 || i.cancellationFee === i.originalAmount || i.policy !== 'Complex'
  )
  
  return {
    originalAmount: booking.total_amount,
    itemBreakdown,
    totalFee: Math.round(totalFee * 100) / 100,
    refundAmount: Math.round(totalRefund * 100) / 100,
    currency: booking.currency,
    isAutomatable,
    automationReason: isAutomatable ? undefined : 'Complex cancellation policy requires review'
  }
}
```

---

## Document Management

### Document Generation

```typescript
interface BookingDocument {
  type: 'eticket' | 'hotel_voucher' | 'car_voucher' | 'experience_voucher' | 'itinerary' | 'receipt'
  format: 'pdf' | 'pkpass' | 'html'
  url: string
  generatedAt: string
  expiresAt?: string
}

async function generateDocuments(booking: Booking): Promise<BookingDocument[]> {
  const documents: BookingDocument[] = []
  
  for (const item of booking.items) {
    try {
      switch (item.category) {
        case 'flight':
          const eticket = await generateETicket(item, booking.travelers)
          documents.push(eticket)
          
          // Generate Apple Wallet pass
          if (await userWantsWalletPass(booking.user_id)) {
            const walletPass = await generateWalletPass(item)
            documents.push(walletPass)
          }
          break
          
        case 'hotel':
          const hotelVoucher = await generateHotelVoucher(item, booking)
          documents.push(hotelVoucher)
          break
          
        case 'car':
          const carVoucher = await generateCarVoucher(item, booking)
          documents.push(carVoucher)
          break
          
        case 'experience':
          const expVoucher = await generateExperienceVoucher(item, booking)
          documents.push(expVoucher)
          break
      }
    } catch (error) {
      await logDocumentError(booking.id, item.id, error)
      
      // Alert for manual follow-up
      await sendAlert({
        type: 'document_generation_failed',
        severity: 'medium',
        message: `Failed to generate document for ${item.category}`,
        data: { bookingId: booking.id, itemId: item.id, error: error.message }
      })
    }
  }
  
  // Generate combined itinerary
  const itinerary = await generateItinerary(booking)
  documents.push(itinerary)
  
  // Generate receipt
  const receipt = await generateReceipt(booking)
  documents.push(receipt)
  
  // Store documents
  await updateBooking(booking.id, {
    documents,
    documents_generated: true
  })
  
  return documents
}

async function generateETicket(
  item: BookingItem,
  travelers: TravelerDetails[]
): Promise<BookingDocument> {
  
  const flight = item.item_details as UnifiedFlight
  
  // Get ticket data from provider
  const adapter = getProviderAdapter(item.provider_code)
  const ticketData = await adapter.getTicketData(item.provider_booking_id)
  
  // Generate PDF
  const pdf = await generatePDF('eticket', {
    booking_reference: ticketData.pnr,
    airline_reference: ticketData.airlineReference,
    passengers: travelers.map((t, i) => ({
      name: `${t.firstName} ${t.lastName}`,
      ticketNumber: ticketData.ticketNumbers[i]
    })),
    flights: flight.slices.flatMap(s => s.segments.map(seg => ({
      flight_number: seg.flightNumber,
      airline: seg.marketingCarrier.name,
      departure: {
        airport: seg.origin.name,
        code: seg.origin.code,
        terminal: seg.origin.terminal,
        datetime: seg.departureAt
      },
      arrival: {
        airport: seg.destination.name,
        code: seg.destination.code,
        terminal: seg.destination.terminal,
        datetime: seg.arrivalAt
      },
      cabin: seg.cabinClass,
      booking_class: seg.bookingClass
    }))),
    baggage: flight.baggage
  })
  
  // Upload to storage
  const url = await uploadDocument(pdf, `etickets/${item.id}.pdf`)
  
  return {
    type: 'eticket',
    format: 'pdf',
    url,
    generatedAt: new Date().toISOString()
  }
}
```

### Document Delivery

```typescript
async function deliverDocuments(booking: Booking): Promise<void> {
  const documents = booking.documents || []
  
  // Send via email
  await sendEmail({
    to: booking.contact_info.email,
    template: 'booking_documents',
    data: {
      customerName: `${booking.contact_info.firstName}`,
      bookingReference: booking.booking_reference,
      documents: documents.map(d => ({
        name: getDocumentName(d.type),
        url: d.url
      }))
    },
    attachments: documents.filter(d => d.format === 'pdf').map(d => ({
      filename: `${d.type}_${booking.booking_reference}.pdf`,
      url: d.url
    }))
  })
  
  // Send push notification
  if (booking.user_id) {
    await sendPushNotification(booking.user_id, {
      title: 'Your travel documents are ready! 📄',
      body: 'Tap to view your booking confirmation and tickets',
      data: {
        type: 'documents_ready',
        bookingId: booking.id
      }
    })
  }
  
  // Record delivery
  await createCommunication({
    booking_id: booking.id,
    type: 'document_delivery',
    channel: 'email',
    recipient_email: booking.contact_info.email,
    status: 'sent',
    sent_at: new Date()
  })
}
```

---

## Communication Engine

### Email Templates

```typescript
const EMAIL_TEMPLATES = {
  booking_confirmation: {
    subject: 'Booking Confirmed: {{destination}} - {{booking_reference}}',
    preheader: 'Your trip is booked! Here are your details.'
  },
  schedule_change: {
    subject: '⚠️ Schedule Change: Your {{category}} booking has changed',
    preheader: 'Important: Your travel plans have been updated.'
  },
  cancellation_confirmation: {
    subject: 'Booking Cancelled: {{booking_reference}}',
    preheader: 'Your cancellation has been processed.'
  },
  refund_confirmation: {
    subject: 'Refund Processed: {{amount}} for booking {{booking_reference}}',
    preheader: 'Your refund is on its way.'
  },
  trip_reminder: {
    subject: '✈️ Your trip to {{destination}} is in {{days}} days!',
    preheader: 'Get ready for your upcoming adventure.'
  },
  review_request: {
    subject: 'How was your trip to {{destination}}?',
    preheader: 'We\'d love to hear about your experience.'
  }
}

async function sendBookingConfirmation(booking: Booking): Promise<void> {
  const items = await getBookingItems(booking.id)
  
  await sendEmail({
    to: booking.contact_info.email,
    template: 'booking_confirmation',
    data: {
      customerName: booking.contact_info.firstName,
      booking_reference: booking.booking_reference,
      destination: getDestinationFromBooking(booking),
      travel_dates: formatDateRange(booking.travel_start_date, booking.travel_end_date),
      travelers: booking.travelers,
      items: items.map(formatItemForEmail),
      total_amount: formatCurrency(booking.total_amount, booking.currency),
      support_email: 'support@guidera.com',
      support_phone: '+1-888-GUIDERA'
    }
  })
  
  await updateBooking(booking.id, {
    confirmation_sent: true,
    confirmation_sent_at: new Date()
  })
  
  await createCommunication({
    booking_id: booking.id,
    type: 'confirmation_email',
    channel: 'email',
    recipient_email: booking.contact_info.email,
    template_id: 'booking_confirmation',
    status: 'sent',
    sent_at: new Date()
  })
}

async function scheduleReminders(booking: Booking): Promise<void> {
  // Schedule reminder 1 week before
  const oneWeekBefore = new Date(booking.travel_start_date)
  oneWeekBefore.setDate(oneWeekBefore.getDate() - 7)
  
  if (oneWeekBefore > new Date()) {
    await scheduleJob('send_trip_reminder', {
      booking_id: booking.id,
      reminder_type: 'week_before'
    }, oneWeekBefore)
  }
  
  // Schedule reminder 1 day before
  const oneDayBefore = new Date(booking.travel_start_date)
  oneDayBefore.setDate(oneDayBefore.getDate() - 1)
  
  if (oneDayBefore > new Date()) {
    await scheduleJob('send_trip_reminder', {
      booking_id: booking.id,
      reminder_type: 'day_before'
    }, oneDayBefore)
  }
}
```

### Push Notifications

```typescript
interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
}

async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  
  // Get user's device tokens
  const { data: devices } = await supabase
    .from('user_devices')
    .select('push_token, platform')
    .eq('user_id', userId)
    .eq('push_enabled', true)
  
  if (!devices || devices.length === 0) return
  
  for (const device of devices) {
    try {
      if (device.platform === 'ios') {
        await sendAPNS(device.push_token, payload)
      } else if (device.platform === 'android') {
        await sendFCM(device.push_token, payload)
      }
    } catch (error) {
      // Handle invalid tokens
      if (isInvalidToken(error)) {
        await removeDeviceToken(userId, device.push_token)
      }
    }
  }
}
```

---

## Self-Service Portal

### User Actions

```typescript
// API endpoints for user self-service

// Get booking details
router.get('/bookings/:reference', async (req, res) => {
  const booking = await getBookingByReference(req.params.reference)
  
  if (!booking || booking.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  
  return res.json({
    booking: formatBookingForUser(booking),
    actions: getAvailableActions(booking),
    policies: {
      cancellation: booking.cancellation_policy,
      modification: getModificationPolicy(booking)
    }
  })
})

// Request cancellation
router.post('/bookings/:reference/cancel', async (req, res) => {
  const { reason } = req.body
  
  const result = await requestCancellation({
    bookingId: req.params.bookingId,
    requestedBy: 'user',
    reason
  })
  
  return res.json(result)
})

// Confirm cancellation
router.post('/cancellations/:id/confirm', async (req, res) => {
  const result = await confirmAndProcessCancellation(req.params.id)
  return res.json(result)
})

// Request modification
router.post('/bookings/:reference/modify', async (req, res) => {
  const { modificationType, ...details } = req.body
  
  switch (modificationType) {
    case 'name_change':
      return res.json(await requestNameChange(details))
    case 'date_change':
      return res.json(await requestDateChange(details))
    default:
      return res.status(400).json({ error: 'Unknown modification type' })
  }
})

// Acknowledge schedule change
router.post('/bookings/:reference/acknowledge-change', async (req, res) => {
  const { itemId, accepted } = req.body
  
  await acknowledgeScheduleChange(req.params.bookingId, itemId, accepted)
  
  return res.json({ success: true })
})

// Resend documents
router.post('/bookings/:reference/resend-documents', async (req, res) => {
  const booking = await getBooking(req.params.bookingId)
  await deliverDocuments(booking)
  
  return res.json({ success: true, message: 'Documents sent to your email' })
})
```

### Available Actions Logic

```typescript
function getAvailableActions(booking: Booking): BookingAction[] {
  const actions: BookingAction[] = []
  const now = new Date()
  
  // Can cancel?
  if (['confirmed', 'ticketed', 'modified'].includes(booking.status)) {
    const policy = evaluateCancellationPolicy(booking)
    actions.push({
      type: 'cancel',
      available: true,
      label: 'Cancel Booking',
      description: policy.cancellable 
        ? `Refund: ${formatCurrency(policy.refundAmount)}` 
        : 'Non-refundable',
      requiresConfirmation: true
    })
  }
  
  // Can modify?
  if (['confirmed', 'ticketed'].includes(booking.status)) {
    if (booking.is_modifiable && 
        (!booking.modification_deadline || new Date(booking.modification_deadline) > now)) {
      actions.push({
        type: 'modify',
        available: true,
        label: 'Modify Booking',
        subActions: [
          { type: 'name_change', label: 'Change Traveler Name' },
          { type: 'date_change', label: 'Change Dates' }
        ]
      })
    }
  }
  
  // Can resend documents?
  if (booking.documents_generated) {
    actions.push({
      type: 'resend_documents',
      available: true,
      label: 'Resend Confirmation',
      description: 'Send documents to your email'
    })
  }
  
  // Has schedule change to acknowledge?
  const pendingChanges = booking.items?.filter(i => 
    i.status === 'schedule_changed' && !i.schedule_change_acknowledged
  )
  if (pendingChanges?.length > 0) {
    actions.push({
      type: 'acknowledge_change',
      available: true,
      label: 'Review Schedule Change',
      urgent: true
    })
  }
  
  // Can add to trip?
  if (booking.status === 'confirmed' && !booking.trip_id) {
    actions.push({
      type: 'add_to_trip',
      available: true,
      label: 'Add to Trip'
    })
  }
  
  return actions
}
```

---

## Automation Engine

### Auto-Resolution Rules

```typescript
interface AutoResolutionRule {
  id: string
  trigger: 'provider_webhook' | 'status_change' | 'scheduled' | 'user_action'
  conditions: AutoResolutionCondition[]
  actions: AutoResolutionAction[]
  enabled: boolean
}

const AUTO_RESOLUTION_RULES: AutoResolutionRule[] = [
  {
    id: 'auto_cancel_provider_cancelled',
    trigger: 'provider_webhook',
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'booking.cancelled' },
      { field: 'booking.status', operator: 'in', value: ['confirmed', 'ticketed'] }
    ],
    actions: [
      { type: 'update_status', params: { status: 'cancelled', reason: 'Provider cancelled' } },
      { type: 'calculate_refund', params: { type: 'full' } },
      { type: 'process_refund', params: { auto: true } },
      { type: 'send_notification', params: { template: 'provider_cancellation' } },
      { type: 'create_alert', params: { severity: 'high' } }
    ],
    enabled: true
  },
  {
    id: 'auto_update_schedule_change',
    trigger: 'provider_webhook',
    conditions: [
      { field: 'event_type', operator: 'equals', value: 'booking.schedule_changed' }
    ],
    actions: [
      { type: 'update_item_details', params: { source: 'webhook_payload' } },
      { type: 'send_notification', params: { template: 'schedule_change' } }
    ],
    enabled: true
  },
  {
    id: 'auto_complete_past_bookings',
    trigger: 'scheduled',
    conditions: [
      { field: 'status', operator: 'in', value: ['confirmed', 'ticketed'] },
      { field: 'travel_end_date', operator: 'lt', value: 'NOW()' }
    ],
    actions: [
      { type: 'update_status', params: { status: 'completed' } },
      { type: 'schedule_review_request', params: { delay_days: 1 } }
    ],
    enabled: true
  },
  {
    id: 'auto_process_simple_refund',
    trigger: 'user_action',
    conditions: [
      { field: 'action', operator: 'equals', value: 'cancel_confirmed' },
      { field: 'refund_calculation.isAutomatable', operator: 'equals', value: true },
      { field: 'refund_calculation.refundAmount', operator: 'gt', value: 0 }
    ],
    actions: [
      { type: 'cancel_with_providers', params: {} },
      { type: 'process_refund', params: { auto: true } },
      { type: 'send_notification', params: { template: 'cancellation_confirmation' } }
    ],
    enabled: true
  }
]

async function executeAutoResolution(
  trigger: AutoResolutionRule['trigger'],
  context: Record<string, any>
): Promise<void> {
  
  const applicableRules = AUTO_RESOLUTION_RULES.filter(rule => 
    rule.enabled && 
    rule.trigger === trigger &&
    evaluateConditions(rule.conditions, context)
  )
  
  for (const rule of applicableRules) {
    try {
      await logAutoResolution(rule.id, 'started', context)
      
      for (const action of rule.actions) {
        await executeAction(action, context)
      }
      
      await logAutoResolution(rule.id, 'completed', context)
      
    } catch (error) {
      await logAutoResolution(rule.id, 'failed', { ...context, error: error.message })
      
      // Escalate for manual handling
      await escalateToManual(rule.id, context, error)
    }
  }
}
```

### Smart Escalation

```typescript
interface EscalationRule {
  id: string
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  responseTime: string
  channel: ('slack' | 'email' | 'sms')[]
  autoResponse?: string
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    id: 'dispute_created',
    condition: 'dispute.created',
    severity: 'critical',
    responseTime: '4h',
    channel: ['slack', 'email', 'sms'],
    autoResponse: 'Dispute received. Gathering evidence automatically.'
  },
  {
    id: 'booking_rollback_failed',
    condition: 'rollback.failed',
    severity: 'critical',
    responseTime: '1h',
    channel: ['slack', 'email', 'sms']
  },
  {
    id: 'refund_failed',
    condition: 'refund.failed',
    severity: 'high',
    responseTime: '24h',
    channel: ['slack', 'email']
  },
  {
    id: 'provider_sync_failed',
    condition: 'sync.failed.multiple',
    severity: 'medium',
    responseTime: '24h',
    channel: ['slack']
  },
  {
    id: 'mass_cancellation',
    condition: 'cancellations.count > 10 in 1h',
    severity: 'critical',
    responseTime: '1h',
    channel: ['slack', 'email', 'sms'],
    autoResponse: 'Investigating potential provider issue.'
  }
]

async function handleEscalation(
  ruleId: string,
  context: Record<string, any>
): Promise<void> {
  
  const rule = ESCALATION_RULES.find(r => r.id === ruleId)
  if (!rule) return
  
  // Send alerts
  for (const channel of rule.channel) {
    switch (channel) {
      case 'slack':
        await sendSlackAlert({
          severity: rule.severity,
          title: `🚨 ${rule.severity.toUpperCase()}: ${ruleId}`,
          details: context,
          responseTime: rule.responseTime
        })
        break
        
      case 'email':
        await sendEmail({
          to: 'alerts@guidera.com',
          template: 'escalation_alert',
          data: { rule, context }
        })
        break
        
      case 'sms':
        await sendSMS(
          process.env.ALERT_PHONE,
          `GUIDERA ALERT [${rule.severity}]: ${ruleId}. Check Slack for details.`
        )
        break
    }
  }
  
  // If customer facing, send auto-response
  if (rule.autoResponse && context.bookingId) {
    await sendCustomerUpdate(context.bookingId, rule.autoResponse)
  }
  
  // Create follow-up task
  await createFollowUpTask({
    type: 'escalation',
    rule_id: ruleId,
    context,
    due_by: addTime(new Date(), rule.responseTime),
    priority: rule.severity
  })
}
```

---

## Monitoring Dashboard

### Key Metrics

```typescript
interface BookingMetrics {
  // Volume
  totalBookings: number
  bookingsToday: number
  bookingsThisWeek: number
  bookingsThisMonth: number
  
  // Status distribution
  statusBreakdown: Record<BookingStatus, number>
  
  // Issues
  openIssues: number
  criticalIssues: number
  pendingCancellations: number
  pendingRefunds: number
  activeDisputes: number
  
  // Performance
  avgConfirmationTime: number  // seconds
  avgRefundTime: number        // hours
  cancellationRate: number     // percentage
  disputeRate: number          // percentage
  
  // Revenue
  totalRevenue: number
  totalRefunded: number
  netRevenue: number
  
  // Provider health
  providerSyncStatus: Record<string, 'healthy' | 'degraded' | 'error'>
}

async function getBookingMetrics(): Promise<BookingMetrics> {
  const [
    volumeMetrics,
    statusMetrics,
    issueMetrics,
    performanceMetrics,
    revenueMetrics,
    providerHealth
  ] = await Promise.all([
    getVolumeMetrics(),
    getStatusBreakdown(),
    getIssueMetrics(),
    getPerformanceMetrics(),
    getRevenueMetrics(),
    getProviderHealth()
  ])
  
  return {
    ...volumeMetrics,
    statusBreakdown: statusMetrics,
    ...issueMetrics,
    ...performanceMetrics,
    ...revenueMetrics,
    providerSyncStatus: providerHealth
  }
}

// Dashboard views
async function getCriticalItemsForDashboard(): Promise<CriticalItems> {
  return {
    // Disputes needing attention
    disputes: await supabase
      .from('disputes')
      .select('*')
      .eq('status', 'needs_response')
      .lt('evidence_due_by', addDays(new Date(), 3))
      .order('evidence_due_by'),
    
    // Failed refunds
    failedRefunds: await supabase
      .from('refunds')
      .select('*, bookings(booking_reference)')
      .eq('status', 'failed')
      .order('created_at', { ascending: false }),
    
    // Sync errors
    syncErrors: await supabase
      .from('bookings')
      .select('id, booking_reference, sync_error')
      .eq('sync_status', 'error')
      .gt('travel_start_date', new Date().toISOString()),
    
    // Pending manual follow-ups
    manualFollowUps: await supabase
      .from('manual_follow_ups')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: true })
  }
}
```

---

## Scheduled Jobs

```typescript
// Cron jobs for booking management

// Every 6 hours: Sync bookings with providers
schedule('0 */6 * * *', async () => {
  await syncAllActiveBookings()
})

// Every hour: Check for schedule changes
schedule('0 * * * *', async () => {
  await checkForScheduleChanges()
})

// Every hour: Process pending refunds
schedule('30 * * * *', async () => {
  await processPendingRefunds()
})

// Daily at 9 AM: Send trip reminders
schedule('0 9 * * *', async () => {
  await sendDailyReminders()
})

// Daily at 10 AM: Mark completed bookings
schedule('0 10 * * *', async () => {
  await markCompletedBookings()
})

// Daily at 11 AM: Request reviews
schedule('0 11 * * *', async () => {
  await sendReviewRequests()
})

// Every 5 minutes: Check dispute deadlines
schedule('*/5 * * * *', async () => {
  await checkDisputeDeadlines()
})

// Every 15 minutes: Retry failed communications
schedule('*/15 * * * *', async () => {
  await retryFailedCommunications()
})

// Weekly: Generate booking reports
schedule('0 0 * * 0', async () => {
  await generateWeeklyReport()
})
```

---

## Implementation Checklist

### Phase 1: Database
- [ ] Create bookings table
- [ ] Create booking_items table
- [ ] Create booking_status_history table
- [ ] Create booking_modifications table
- [ ] Create cancellation_requests table
- [ ] Create refunds table
- [ ] Create disputes table
- [ ] Create booking_communications table
- [ ] Create provider_webhooks table
- [ ] Create indexes

### Phase 2: Core Lifecycle
- [ ] Implement status tracker
- [ ] Implement status transitions
- [ ] Implement sync engine
- [ ] Set up provider webhooks

### Phase 3: Modifications
- [ ] Name change flow
- [ ] Date change flow
- [ ] Modification fee handling

### Phase 4: Cancellations
- [ ] Cancellation flow
- [ ] Refund calculation
- [ ] Provider cancellation coordination
- [ ] Rollback handling

### Phase 5: Documents
- [ ] E-ticket generation
- [ ] Hotel voucher generation
- [ ] Itinerary generation
- [ ] Document delivery

### Phase 6: Communications
- [ ] Email templates
- [ ] Push notifications
- [ ] Reminder scheduling

### Phase 7: Self-Service
- [ ] User API endpoints
- [ ] Action availability logic
- [ ] Schedule change acknowledgment

### Phase 8: Automation
- [ ] Auto-resolution rules
- [ ] Escalation rules
- [ ] Alert system

### Phase 9: Monitoring
- [ ] Metrics collection
- [ ] Dashboard endpoints
- [ ] Critical items tracking

### Phase 10: Scheduled Jobs
- [ ] Sync job
- [ ] Reminder job
- [ ] Completion job
- [ ] Retry jobs

---

**This Booking Management System handles the complete lifecycle of travel bookings — from confirmation to completion — with automation that lets a solo founder manage thousands of bookings without going insane.**
