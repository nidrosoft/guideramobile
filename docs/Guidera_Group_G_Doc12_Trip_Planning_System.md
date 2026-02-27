# Document 12: Trip Planning System

## Purpose

This document defines the **Trip Planning System** — the core foundation that makes Guidera a complete travel companion, not just a booking engine. The Trip is the central organizing entity around which everything revolves: bookings, itineraries, travelers, generated content, and real-time intelligence.

This system transforms Guidera from "a place to book travel" into "the app that manages my entire trip."

---

## Architecture Philosophy

### Modular by Design

The Trip Planning System is built as **interconnected microservices**, each with a single responsibility:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRIP PLANNING SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        TRIP CORE SERVICE                             │   │
│   │                                                                      │   │
│   │  The central orchestrator. Creates trips, manages state, coordinates │   │
│   │  with all other services. Single source of truth for trip data.     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│          ┌───────────────────────────┼───────────────────────────┐          │
│          │                           │                           │          │
│          ▼                           ▼                           ▼          │
│   ┌─────────────┐             ┌─────────────┐             ┌─────────────┐   │
│   │   IMPORT    │             │   COLLAB    │             │  LIFECYCLE  │   │
│   │   SERVICE   │             │   SERVICE   │             │   SERVICE   │   │
│   │             │             │             │             │             │   │
│   │ Email Parse │             │ Invitations │             │ State Mgmt  │   │
│   │ OCR/Scan    │             │ Permissions │             │ Transitions │   │
│   │ OAuth Link  │             │ Sync        │             │ Automation  │   │
│   │ Manual Entry│             │ Merge       │             │ Scheduling  │   │
│   └─────────────┘             └─────────────┘             └─────────────┘   │
│          │                           │                           │          │
│          └───────────────────────────┼───────────────────────────┘          │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      TRIP CONTEXT SERVICE                            │   │
│   │                                                                      │   │
│   │  Builds the rich context object used by AI Generation Engine.       │   │
│   │  Aggregates user profile, trip details, destination intelligence.   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      MODULE ORCHESTRATOR                             │   │
│   │                                                                      │   │
│   │  Triggers generation of all Trip Hub modules when trip confirms.    │   │
│   │  Manages regeneration when context changes.                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Communication

Services communicate through:
1. **Direct function calls** (within same Edge Function)
2. **Database events** (Supabase Realtime for cross-function)
3. **Message queue** (for async operations like AI generation)

```typescript
// Example: Trip confirmation triggers module generation
TripLifecycleService.onStateChange('confirmed', async (trip) => {
  await ModuleOrchestrator.generateAllModules(trip.id)
  await NotificationService.sendTripConfirmed(trip)
  await CollaborationService.notifyTravelers(trip.id, 'trip_confirmed')
})
```

---

## Database Schema

### Core Trip Table

```sql
-- ============================================================================
-- TRIPS: The central entity
-- ============================================================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- OWNERSHIP
  -- ═══════════════════════════════════════════════════════════════════════
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- IDENTITY
  -- ═══════════════════════════════════════════════════════════════════════
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,                    -- URL-friendly: "summer-in-bali-2025"
  
  -- Cover image
  cover_image_url TEXT,
  cover_image_source VARCHAR(50),              -- 'user_upload', 'destination_default', 'ai_generated'
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DESTINATION(S)
  -- ═══════════════════════════════════════════════════════════════════════
  -- Primary destination (for single-destination trips)
  primary_destination_code VARCHAR(10),        -- IATA or internal code
  primary_destination_name VARCHAR(255),
  primary_destination_country VARCHAR(100),
  primary_destination_coordinates POINT,       -- PostGIS for geo queries
  
  -- Multi-destination trips store in JSONB
  is_multi_destination BOOLEAN DEFAULT FALSE,
  destinations JSONB DEFAULT '[]',
  /*
    [
      {
        "order": 1,
        "destination_code": "CDG",
        "destination_name": "Paris",
        "country": "France",
        "arrival_date": "2025-06-15",
        "departure_date": "2025-06-18",
        "nights": 3
      },
      {
        "order": 2,
        "destination_code": "BCN",
        "destination_name": "Barcelona",
        "country": "Spain",
        "arrival_date": "2025-06-18",
        "departure_date": "2025-06-22",
        "nights": 4
      }
    ]
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DATES
  -- ═══════════════════════════════════════════════════════════════════════
  start_date DATE,
  end_date DATE,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  duration_nights INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  -- Timezone of primary destination (for accurate day calculations)
  destination_timezone VARCHAR(50),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRIP TYPE & PURPOSE
  -- ═══════════════════════════════════════════════════════════════════════
  trip_type VARCHAR(50) DEFAULT 'leisure',
  /*
    'leisure' - Vacation/holiday
    'business' - Work trip
    'business_leisure' - Bleisure
    'honeymoon' - Special occasion
    'family_visit' - Visiting family
    'event' - Wedding, concert, conference
    'adventure' - Outdoor/adventure focused
    'wellness' - Spa, retreat, health
  */
  
  trip_purpose TEXT,                           -- User's own description
  special_occasion VARCHAR(100),               -- "Anniversary", "Birthday", etc.
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- LIFECYCLE STATE
  -- ═══════════════════════════════════════════════════════════════════════
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  /*
    STATE MACHINE:
    
    'draft' ──────────► 'planning' ──────────► 'confirmed'
       │                    │                      │
       │                    │                      ▼
       │                    │                 'upcoming' (auto: T-30 days)
       │                    │                      │
       │                    │                      ▼
       │                    │                  'ongoing' (auto: start_date)
       │                    │                      │
       │                    │                      ▼
       │                    │                 'completed' (auto: end_date)
       │                    │
       └────────────────────┴──────────────► 'cancelled'
       
    'archived' - User archived a completed trip
  */
  
  previous_status VARCHAR(50),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_change_reason TEXT,
  
  -- Auto-transition scheduling
  transition_to_upcoming_at TIMESTAMPTZ,       -- When to auto-transition to 'upcoming'
  transition_to_ongoing_at TIMESTAMPTZ,        -- When to auto-transition to 'ongoing'
  transition_to_completed_at TIMESTAMPTZ,      -- When to auto-transition to 'completed'
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRAVELERS
  -- ═══════════════════════════════════════════════════════════════════════
  traveler_count INTEGER DEFAULT 1,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  
  -- Traveler composition
  traveler_composition VARCHAR(50),
  /*
    'solo' - Just the owner
    'couple' - 2 adults, romantic
    'family' - Adults with children
    'friends' - Group of friends
    'business_group' - Work colleagues
    'mixed' - Various relationships
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- BUDGET
  -- ═══════════════════════════════════════════════════════════════════════
  budget_total DECIMAL(12,2),
  budget_currency VARCHAR(3) DEFAULT 'USD',
  budget_level VARCHAR(20),                    -- 'budget', 'moderate', 'luxury', 'ultra_luxury'
  
  -- Spending tracking
  total_booked_amount DECIMAL(12,2) DEFAULT 0,
  total_spent_amount DECIMAL(12,2) DEFAULT 0,  -- From expense tracker
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- BOOKINGS SUMMARY (Denormalized for quick display)
  -- ═══════════════════════════════════════════════════════════════════════
  booking_count INTEGER DEFAULT 0,
  has_flights BOOLEAN DEFAULT FALSE,
  has_hotels BOOLEAN DEFAULT FALSE,
  has_cars BOOLEAN DEFAULT FALSE,
  has_experiences BOOLEAN DEFAULT FALSE,
  
  flight_count INTEGER DEFAULT 0,
  hotel_count INTEGER DEFAULT 0,
  car_count INTEGER DEFAULT 0,
  experience_count INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- IMPORT TRACKING
  -- ═══════════════════════════════════════════════════════════════════════
  created_via VARCHAR(50) DEFAULT 'manual',
  /*
    'manual' - Created from scratch in app
    'booking' - Created from Guidera booking
    'import_email' - Created from email import
    'import_oauth' - Created from linked account
    'import_manual' - Created from manual entry
    'import_scan' - Created from ticket scan
    'quick_plan' - Created from AI quick plan
    'advanced_plan' - Created from advanced planner
  */
  
  import_sources JSONB DEFAULT '[]',           -- Track all import sources used
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- MODULE STATUS (Track which modules are generated)
  -- ═══════════════════════════════════════════════════════════════════════
  modules_generated BOOLEAN DEFAULT FALSE,
  modules_generated_at TIMESTAMPTZ,
  modules_last_refreshed_at TIMESTAMPTZ,
  
  module_status JSONB DEFAULT '{
    "itinerary": "pending",
    "packing": "pending",
    "dos_donts": "pending",
    "safety": "pending",
    "expenses": "pending",
    "compensation": "pending"
  }',
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- COLLABORATION
  -- ═══════════════════════════════════════════════════════════════════════
  is_collaborative BOOLEAN DEFAULT FALSE,
  collaborator_count INTEGER DEFAULT 0,
  
  -- Share settings
  share_link_enabled BOOLEAN DEFAULT FALSE,
  share_link_token VARCHAR(100) UNIQUE,
  share_link_permission VARCHAR(20) DEFAULT 'view',  -- 'view', 'edit'
  share_link_expires_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- NOTIFICATIONS & REMINDERS
  -- ═══════════════════════════════════════════════════════════════════════
  notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_settings JSONB DEFAULT '{
    "pre_trip_30_days": true,
    "pre_trip_7_days": true,
    "pre_trip_1_day": true,
    "packing_reminder": true,
    "document_check": true,
    "daily_briefing": true
  }',
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- OFFLINE
  -- ═══════════════════════════════════════════════════════════════════════
  offline_enabled BOOLEAN DEFAULT TRUE,
  offline_last_synced_at TIMESTAMPTZ,
  offline_data_size_bytes BIGINT,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  tags VARCHAR(50)[],                          -- User-defined tags
  notes TEXT,                                  -- Private notes
  
  -- Source tracking
  source_platform VARCHAR(20),                 -- 'ios', 'android', 'web'
  source_version VARCHAR(20),                  -- App version
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,                      -- When trip actually started
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_trips_owner ON trips(owner_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_destination ON trips(primary_destination_code);
CREATE INDEX idx_trips_slug ON trips(slug);
CREATE INDEX idx_trips_share_token ON trips(share_link_token) WHERE share_link_enabled = TRUE;

-- Status-based partial indexes for common queries
CREATE INDEX idx_trips_upcoming ON trips(owner_id, start_date) 
  WHERE status IN ('confirmed', 'upcoming');
CREATE INDEX idx_trips_ongoing ON trips(owner_id) 
  WHERE status = 'ongoing';
CREATE INDEX idx_trips_need_transition ON trips(status, transition_to_upcoming_at, transition_to_ongoing_at, transition_to_completed_at)
  WHERE status IN ('confirmed', 'upcoming', 'ongoing');

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_trip_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := slugify(NEW.name) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_trip_slug_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION generate_trip_slug();

-- Auto-calculate transition timestamps
CREATE OR REPLACE FUNCTION calculate_trip_transitions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NOT NULL THEN
    -- Transition to 'upcoming' 30 days before start
    NEW.transition_to_upcoming_at := (NEW.start_date - INTERVAL '30 days')::TIMESTAMPTZ;
    -- Transition to 'ongoing' at midnight destination time on start_date
    NEW.transition_to_ongoing_at := NEW.start_date::TIMESTAMPTZ;
  END IF;
  
  IF NEW.end_date IS NOT NULL THEN
    -- Transition to 'completed' at midnight after end_date
    NEW.transition_to_completed_at := (NEW.end_date + INTERVAL '1 day')::TIMESTAMPTZ;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_trip_transitions_trigger
  BEFORE INSERT OR UPDATE OF start_date, end_date ON trips
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trip_transitions();
```

### Trip Travelers Table

```sql
-- ============================================================================
-- TRIP_TRAVELERS: People on the trip (including owner)
-- ============================================================================
CREATE TABLE trip_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRAVELER IDENTITY
  -- ═══════════════════════════════════════════════════════════════════════
  -- If registered user
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Traveler details (always stored, even for registered users)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Profile (for personalization)
  date_of_birth DATE,
  gender VARCHAR(20),
  nationality VARCHAR(100),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRAVELER TYPE
  -- ═══════════════════════════════════════════════════════════════════════
  traveler_type VARCHAR(20) NOT NULL DEFAULT 'adult',
  /*
    'adult' - 18+
    'child' - 2-17
    'infant' - Under 2
  */
  
  age_at_travel INTEGER,                       -- Calculated from DOB and trip start
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- ROLE & PERMISSIONS
  -- ═══════════════════════════════════════════════════════════════════════
  role VARCHAR(20) NOT NULL DEFAULT 'traveler',
  /*
    'owner' - Trip creator, full control
    'admin' - Can edit trip, invite others
    'editor' - Can add/edit activities
    'traveler' - Can view, mark items, add expenses
    'viewer' - View only
  */
  
  is_owner BOOLEAN DEFAULT FALSE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- RELATIONSHIP TO OWNER
  -- ═══════════════════════════════════════════════════════════════════════
  relationship_to_owner VARCHAR(50),
  /*
    'self' - The owner themselves
    'spouse' - Married partner
    'partner' - Unmarried partner
    'child' - Son/daughter
    'parent' - Mother/father
    'sibling' - Brother/sister
    'friend' - Friend
    'colleague' - Work colleague
    'other' - Other
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- PERSONALIZATION CONTEXT (For AI generation)
  -- ═══════════════════════════════════════════════════════════════════════
  -- These may differ from user profile (user may set trip-specific prefs)
  dietary_restrictions VARCHAR(50)[],
  /*
    'vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 
    'dairy_free', 'nut_allergy', 'shellfish_allergy', etc.
  */
  
  accessibility_needs VARCHAR(50)[],
  /*
    'wheelchair', 'mobility_assistance', 'visual_impairment',
    'hearing_impairment', 'service_animal', etc.
  */
  
  medical_conditions TEXT[],                   -- Private, encrypted
  medications TEXT[],                          -- Private, encrypted
  
  special_requests TEXT,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DOCUMENTS (Reference, not actual docs)
  -- ═══════════════════════════════════════════════════════════════════════
  passport_number_last4 VARCHAR(4),            -- Last 4 for reference
  passport_expiry DATE,
  passport_country VARCHAR(3),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- INVITATION STATUS (For non-owner travelers)
  -- ═══════════════════════════════════════════════════════════════════════
  invitation_status VARCHAR(20) DEFAULT 'accepted',
  /*
    'pending' - Invited but not accepted
    'accepted' - Accepted invitation
    'declined' - Declined invitation
    'removed' - Removed from trip
  */
  
  invited_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- MODULE PERSONALIZATION
  -- ═══════════════════════════════════════════════════════════════════════
  -- Each traveler can have personalized modules
  has_personalized_packing BOOLEAN DEFAULT FALSE,
  packing_module_id UUID,                      -- Reference to their packing list
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(trip_id, user_id),                    -- One entry per user per trip
  UNIQUE(trip_id, email)                       -- One entry per email per trip
);

CREATE INDEX idx_trip_travelers_trip ON trip_travelers(trip_id);
CREATE INDEX idx_trip_travelers_user ON trip_travelers(user_id);
CREATE INDEX idx_trip_travelers_invitation ON trip_travelers(invitation_status) 
  WHERE invitation_status = 'pending';
```

### Trip Bookings Link Table

```sql
-- ============================================================================
-- TRIP_BOOKINGS: Links trips to bookings
-- ============================================================================
CREATE TABLE trip_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- BOOKING SNAPSHOT (For display even if booking changes)
  -- ═══════════════════════════════════════════════════════════════════════
  category VARCHAR(50) NOT NULL,               -- 'flight', 'hotel', 'car', 'experience'
  booking_reference VARCHAR(50),
  
  -- Summary for quick display
  summary_title VARCHAR(255),                  -- "Singapore Airlines SQ123"
  summary_subtitle VARCHAR(255),               -- "LAX → DPS"
  summary_datetime TIMESTAMPTZ,                -- When it occurs
  summary_price DECIMAL(12,2),
  summary_status VARCHAR(50),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- ITINERARY PLACEMENT
  -- ═══════════════════════════════════════════════════════════════════════
  -- Which day(s) this booking spans
  start_day INTEGER,                           -- Day 1, Day 2, etc.
  end_day INTEGER,
  
  -- Display order within a day
  display_order INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRAVELER ASSIGNMENT
  -- ═══════════════════════════════════════════════════════════════════════
  -- Which travelers this booking is for
  traveler_ids UUID[],                         -- Array of trip_traveler IDs
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- SOURCE
  -- ═══════════════════════════════════════════════════════════════════════
  source VARCHAR(50) DEFAULT 'guidera_booking',
  /*
    'guidera_booking' - Booked through Guidera
    'import_email' - Imported from email
    'import_oauth' - Imported from linked account
    'import_manual' - Manually entered
    'import_scan' - Scanned ticket
  */
  
  import_id UUID REFERENCES trip_imports(id),  -- If imported
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(trip_id, booking_id)
);

CREATE INDEX idx_trip_bookings_trip ON trip_bookings(trip_id);
CREATE INDEX idx_trip_bookings_booking ON trip_bookings(booking_id);
CREATE INDEX idx_trip_bookings_day ON trip_bookings(trip_id, start_day);
```

### Trip Activities Table (Non-Booking Events)

```sql
-- ============================================================================
-- TRIP_ACTIVITIES: Custom activities not from bookings
-- ============================================================================
CREATE TABLE trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- ACTIVITY DETAILS
  -- ═══════════════════════════════════════════════════════════════════════
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  category VARCHAR(50) DEFAULT 'custom',
  /*
    'custom' - User-created
    'restaurant' - Dining
    'attraction' - Tourist site
    'meeting' - Business meeting
    'transport' - Getting around
    'free_time' - Unscheduled block
    'note' - Just a note/reminder
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TIMING
  -- ═══════════════════════════════════════════════════════════════════════
  day_number INTEGER NOT NULL,                 -- Day 1, Day 2, etc.
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- Actual datetime (calculated from trip start + day + time)
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- LOCATION
  -- ═══════════════════════════════════════════════════════════════════════
  location_name VARCHAR(255),
  location_address TEXT,
  location_coordinates POINT,
  location_place_id VARCHAR(255),              -- Google Places ID
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- DISPLAY
  -- ═══════════════════════════════════════════════════════════════════════
  icon VARCHAR(50),                            -- Emoji or icon name
  color VARCHAR(20),                           -- Hex color
  display_order INTEGER DEFAULT 0,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- LINKS & REFERENCES
  -- ═══════════════════════════════════════════════════════════════════════
  website_url TEXT,
  phone_number VARCHAR(50),
  confirmation_number VARCHAR(100),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- COST
  -- ═══════════════════════════════════════════════════════════════════════
  estimated_cost DECIMAL(12,2),
  cost_currency VARCHAR(3),
  is_prepaid BOOLEAN DEFAULT FALSE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- TRAVELERS
  -- ═══════════════════════════════════════════════════════════════════════
  traveler_ids UUID[],                         -- Which travelers
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- NOTES & ATTACHMENTS
  -- ═══════════════════════════════════════════════════════════════════════
  notes TEXT,
  attachments JSONB DEFAULT '[]',              -- [{url, type, name}]
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- STATUS
  -- ═══════════════════════════════════════════════════════════════════════
  status VARCHAR(20) DEFAULT 'planned',
  /*
    'planned' - In the plan
    'confirmed' - Reservation confirmed
    'completed' - Done
    'skipped' - User skipped it
    'cancelled' - Cancelled
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- AI SUGGESTIONS
  -- ═══════════════════════════════════════════════════════════════════════
  is_ai_suggested BOOLEAN DEFAULT FALSE,
  suggestion_reason TEXT,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_activities_trip ON trip_activities(trip_id);
CREATE INDEX idx_trip_activities_day ON trip_activities(trip_id, day_number);
CREATE INDEX idx_trip_activities_datetime ON trip_activities(start_datetime);
```

### Trip Imports Table

```sql
-- ============================================================================
-- TRIP_IMPORTS: Track all imports into a trip
-- ============================================================================
CREATE TABLE trip_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,  -- NULL if trip not yet created
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- IMPORT METHOD
  -- ═══════════════════════════════════════════════════════════════════════
  import_method VARCHAR(50) NOT NULL,
  /*
    'email' - Forwarded email
    'oauth_expedia' - Linked Expedia account
    'oauth_booking' - Linked Booking.com
    'oauth_airbnb' - Linked Airbnb
    'oauth_google' - Google Flights/Hotels (via Gmail)
    'manual' - User typed it
    'scan_qr' - QR code scan
    'scan_barcode' - Barcode scan
    'scan_ocr' - Text/image OCR
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- RAW INPUT
  -- ═══════════════════════════════════════════════════════════════════════
  raw_input_type VARCHAR(50),                  -- 'email', 'image', 'text', 'qr_data', 'api_response'
  raw_input_data TEXT,                         -- The raw input (email body, OCR text, etc.)
  raw_input_attachments JSONB DEFAULT '[]',    -- [{url, type, name}]
  
  -- For email imports
  email_from VARCHAR(255),
  email_subject VARCHAR(500),
  email_received_at TIMESTAMPTZ,
  email_message_id VARCHAR(255),
  
  -- For OAuth imports
  oauth_provider VARCHAR(50),
  oauth_booking_id VARCHAR(255),
  oauth_last_sync_at TIMESTAMPTZ,
  
  -- For scan imports
  scan_image_url TEXT,
  scan_confidence DECIMAL(5,2),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- PARSING RESULTS
  -- ═══════════════════════════════════════════════════════════════════════
  parse_status VARCHAR(50) DEFAULT 'pending',
  /*
    'pending' - Not yet parsed
    'parsing' - Being parsed
    'parsed' - Successfully parsed
    'needs_review' - Parsed but needs user verification
    'failed' - Could not parse
  */
  
  parsed_at TIMESTAMPTZ,
  parse_error TEXT,
  
  -- What was extracted
  parsed_data JSONB,
  /*
    {
      "category": "flight",
      "confidence": 0.95,
      "extracted": {
        "airline": "Singapore Airlines",
        "flight_number": "SQ123",
        "departure_airport": "LAX",
        "arrival_airport": "DPS",
        "departure_datetime": "2025-12-14T04:00:00",
        "arrival_datetime": "2025-12-15T02:00:00",
        "confirmation_number": "ABC123",
        "passengers": ["Daniel Smith"],
        "class": "Economy",
        "price": { "amount": 850, "currency": "USD" }
      },
      "destination_detected": {
        "code": "DPS",
        "name": "Bali",
        "country": "Indonesia"
      },
      "dates_detected": {
        "start": "2025-12-14",
        "end": "2025-12-15"
      }
    }
  */
  
  -- Confidence scores
  overall_confidence DECIMAL(5,2),
  field_confidences JSONB,                     -- Per-field confidence
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- PROCESSING
  -- ═══════════════════════════════════════════════════════════════════════
  processing_status VARCHAR(50) DEFAULT 'pending',
  /*
    'pending' - Not processed
    'processing' - Being processed
    'processed' - Created booking/activity
    'merged' - Merged with existing booking
    'skipped' - User skipped
    'failed' - Processing failed
  */
  
  -- What was created
  created_booking_id UUID REFERENCES bookings(id),
  created_activity_id UUID REFERENCES trip_activities(id),
  merged_with_booking_id UUID REFERENCES bookings(id),
  
  -- User actions
  user_reviewed BOOLEAN DEFAULT FALSE,
  user_reviewed_at TIMESTAMPTZ,
  user_corrections JSONB,                      -- What user corrected
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_imports_trip ON trip_imports(trip_id);
CREATE INDEX idx_trip_imports_user ON trip_imports(user_id);
CREATE INDEX idx_trip_imports_status ON trip_imports(parse_status, processing_status);
CREATE INDEX idx_trip_imports_email ON trip_imports(email_message_id) WHERE import_method = 'email';
```

### Trip Invitations Table

```sql
-- ============================================================================
-- TRIP_INVITATIONS: Pending invitations to join trips
-- ============================================================================
CREATE TABLE trip_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- INVITATION TARGET
  -- ═══════════════════════════════════════════════════════════════════════
  -- Either by email or user_id
  invited_email VARCHAR(255),
  invited_user_id UUID REFERENCES auth.users(id),
  invited_phone VARCHAR(50),
  
  -- Invitation details
  invited_name VARCHAR(255),                   -- Display name in invitation
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- INVITATION METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'traveler',         -- Role they'll have if accepted
  relationship VARCHAR(50),                    -- Relationship to inviter
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- INVITATION TOKEN
  -- ═══════════════════════════════════════════════════════════════════════
  token VARCHAR(100) UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- STATUS
  -- ═══════════════════════════════════════════════════════════════════════
  status VARCHAR(20) DEFAULT 'pending',
  /*
    'pending' - Sent, waiting response
    'accepted' - Accepted
    'declined' - Declined
    'expired' - Token expired
    'revoked' - Inviter cancelled
  */
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- COMMUNICATION
  -- ═══════════════════════════════════════════════════════════════════════
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  notification_method VARCHAR(20),             -- 'email', 'sms', 'push'
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- RESPONSE
  -- ═══════════════════════════════════════════════════════════════════════
  responded_at TIMESTAMPTZ,
  decline_reason TEXT,
  
  -- Created traveler record
  created_traveler_id UUID REFERENCES trip_travelers(id),
  
  -- ═══════════════════════════════════════════════════════════════════════
  -- METADATA
  -- ═══════════════════════════════════════════════════════════════════════
  message TEXT,                                -- Personal message with invitation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trip_invitations_trip ON trip_invitations(trip_id);
CREATE INDEX idx_trip_invitations_email ON trip_invitations(invited_email) WHERE status = 'pending';
CREATE INDEX idx_trip_invitations_token ON trip_invitations(token) WHERE status = 'pending';
CREATE INDEX idx_trip_invitations_user ON trip_invitations(invited_user_id) WHERE status = 'pending';
```

### User Email Aliases (For Import)

```sql
-- ============================================================================
-- USER_EMAIL_ALIASES: Unique email addresses for importing
-- ============================================================================
CREATE TABLE user_email_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- The unique email alias
  alias_email VARCHAR(255) UNIQUE NOT NULL,    -- e.g., "import-abc123@trips.guidera.com"
  alias_prefix VARCHAR(50) NOT NULL,           -- e.g., "import-abc123"
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stats
  emails_received INTEGER DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_aliases_user ON user_email_aliases(user_id);
CREATE INDEX idx_email_aliases_alias ON user_email_aliases(alias_email);
```

### Linked Travel Accounts (For OAuth Import)

```sql
-- ============================================================================
-- LINKED_TRAVEL_ACCOUNTS: OAuth connections to other platforms
-- ============================================================================
CREATE TABLE linked_travel_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider
  provider VARCHAR(50) NOT NULL,
  /*
    'expedia'
    'booking_com'
    'airbnb'
    'hotels_com'
    'kayak'
    'google' - Gmail for travel emails
    'tripit'
  */
  
  -- OAuth tokens (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account info
  provider_account_id VARCHAR(255),
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency VARCHAR(20) DEFAULT 'daily',  -- 'hourly', 'daily', 'weekly', 'manual'
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20),
  last_sync_error TEXT,
  next_sync_at TIMESTAMPTZ,
  
  -- What to import
  import_flights BOOLEAN DEFAULT TRUE,
  import_hotels BOOLEAN DEFAULT TRUE,
  import_cars BOOLEAN DEFAULT TRUE,
  import_experiences BOOLEAN DEFAULT TRUE,
  
  -- Stats
  bookings_imported INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  /*
    'active' - Connected and working
    'expired' - Token expired, needs re-auth
    'revoked' - User disconnected
    'error' - Error state
  */
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_linked_accounts_user ON linked_travel_accounts(user_id);
CREATE INDEX idx_linked_accounts_sync ON linked_travel_accounts(next_sync_at) 
  WHERE status = 'active' AND auto_sync_enabled = TRUE;
```

---

## Trip Core Service

The central orchestrator for all trip operations.

### File Structure

```
src/services/trip/
├── index.ts                       # Public exports
├── trip-core.service.ts           # Main orchestrator
├── trip-repository.ts             # Database operations
├── trip.types.ts                  # TypeScript types
├── trip.errors.ts                 # Custom errors
├── trip.validators.ts             # Input validation
└── trip.utils.ts                  # Utility functions
```

### Core Service Implementation

```typescript
// src/services/trip/trip-core.service.ts

import { TripRepository } from './trip-repository'
import { TripLifecycleService } from '../trip-lifecycle/trip-lifecycle.service'
import { TripCollaborationService } from '../trip-collaboration/trip-collaboration.service'
import { TripImportService } from '../trip-import/trip-import.service'
import { TripContextService } from '../trip-context/trip-context.service'
import { ModuleOrchestrator } from '../module-orchestrator/module-orchestrator.service'
import { generateTripSlug, generateShareToken } from './trip.utils'
import { validateCreateTrip, validateUpdateTrip } from './trip.validators'
import { TripNotFoundError, TripAccessDeniedError, TripValidationError } from './trip.errors'

export class TripCoreService {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRIP CRUD
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Create a new trip
   */
  async createTrip(input: CreateTripInput): Promise<Trip> {
    // Validate input
    const validation = validateCreateTrip(input)
    if (!validation.valid) {
      throw new TripValidationError(validation.errors)
    }
    
    // Build trip data
    const tripData: Partial<Trip> = {
      owner_id: input.userId,
      name: input.name,
      primary_destination_code: input.destination?.code,
      primary_destination_name: input.destination?.name,
      primary_destination_country: input.destination?.country,
      start_date: input.startDate,
      end_date: input.endDate,
      trip_type: input.tripType || 'leisure',
      budget_total: input.budget?.total,
      budget_currency: input.budget?.currency || 'USD',
      budget_level: input.budget?.level,
      adults: input.travelers?.adults || 1,
      children: input.travelers?.children || 0,
      infants: input.travelers?.infants || 0,
      traveler_composition: input.travelers?.composition || 'solo',
      created_via: input.createdVia || 'manual',
      source_platform: input.platform,
      status: 'draft'
    }
    
    // Calculate traveler count
    tripData.traveler_count = 
      (tripData.adults || 0) + 
      (tripData.children || 0) + 
      (tripData.infants || 0)
    
    // Create trip
    const trip = await TripRepository.create(tripData)
    
    // Create owner as first traveler
    await this.addOwnerAsTraveler(trip.id, input.userId, input.ownerDetails)
    
    // If destination provided, fetch destination intelligence
    if (input.destination?.code) {
      await this.enrichDestination(trip.id, input.destination.code)
    }
    
    // Log creation
    await this.logTripEvent(trip.id, 'trip_created', {
      createdVia: input.createdVia,
      destination: input.destination?.name
    })
    
    return trip
  }
  
  /**
   * Create trip from booking (when user books through Guidera)
   */
  async createTripFromBooking(
    userId: string,
    booking: Booking
  ): Promise<Trip> {
    
    // Extract destination from booking
    const destination = this.extractDestinationFromBooking(booking)
    
    // Extract dates from booking
    const dates = this.extractDatesFromBooking(booking)
    
    // Generate trip name
    const name = this.generateTripName(destination, dates)
    
    // Create trip
    const trip = await this.createTrip({
      userId,
      name,
      destination,
      startDate: dates.start,
      endDate: dates.end,
      createdVia: 'booking',
      travelers: booking.travelers
    })
    
    // Link booking to trip
    await this.linkBookingToTrip(trip.id, booking.id)
    
    // Auto-confirm since we have a booking
    await TripLifecycleService.transitionTo(trip.id, 'confirmed')
    
    return trip
  }
  
  /**
   * Create trip from import
   */
  async createTripFromImport(
    userId: string,
    importData: ParsedImportData
  ): Promise<Trip> {
    
    // Create trip with extracted data
    const trip = await this.createTrip({
      userId,
      name: this.generateTripName(importData.destination, importData.dates),
      destination: importData.destination,
      startDate: importData.dates?.start,
      endDate: importData.dates?.end,
      createdVia: `import_${importData.importMethod}`,
      travelers: importData.travelers
    })
    
    // If booking data extracted, create booking record
    if (importData.bookingData) {
      const booking = await this.createImportedBooking(importData.bookingData)
      await this.linkBookingToTrip(trip.id, booking.id)
    }
    
    // Link import record to trip
    await TripImportService.linkToTrip(importData.importId, trip.id)
    
    return trip
  }
  
  /**
   * Get trip by ID with full details
   */
  async getTrip(
    tripId: string,
    userId: string,
    options: GetTripOptions = {}
  ): Promise<TripWithDetails> {
    
    const trip = await TripRepository.findById(tripId)
    if (!trip) {
      throw new TripNotFoundError(tripId)
    }
    
    // Check access
    const access = await this.checkAccess(tripId, userId)
    if (!access.hasAccess) {
      throw new TripAccessDeniedError(tripId, userId)
    }
    
    // Build response based on options
    const result: TripWithDetails = { ...trip, access }
    
    if (options.includeTravelers) {
      result.travelers = await TripRepository.getTravelers(tripId)
    }
    
    if (options.includeBookings) {
      result.bookings = await TripRepository.getBookings(tripId)
    }
    
    if (options.includeActivities) {
      result.activities = await TripRepository.getActivities(tripId)
    }
    
    if (options.includeItinerary) {
      result.itinerary = await this.buildItinerary(tripId)
    }
    
    if (options.includeModuleStatus) {
      result.moduleStatus = await ModuleOrchestrator.getStatus(tripId)
    }
    
    return result
  }
  
  /**
   * Update trip
   */
  async updateTrip(
    tripId: string,
    userId: string,
    updates: UpdateTripInput
  ): Promise<Trip> {
    
    // Check access
    const access = await this.checkAccess(tripId, userId)
    if (!access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'edit')
    }
    
    // Validate updates
    const validation = validateUpdateTrip(updates)
    if (!validation.valid) {
      throw new TripValidationError(validation.errors)
    }
    
    // Get current trip
    const currentTrip = await TripRepository.findById(tripId)
    
    // Check if dates changed (affects modules)
    const datesChanged = 
      updates.startDate !== currentTrip.start_date ||
      updates.endDate !== currentTrip.end_date
    
    // Check if destination changed (affects modules)
    const destinationChanged = 
      updates.destination?.code !== currentTrip.primary_destination_code
    
    // Update trip
    const updatedTrip = await TripRepository.update(tripId, updates)
    
    // If significant changes, mark modules for refresh
    if (datesChanged || destinationChanged) {
      await ModuleOrchestrator.markForRefresh(tripId, {
        reason: datesChanged ? 'dates_changed' : 'destination_changed'
      })
    }
    
    // Log update
    await this.logTripEvent(tripId, 'trip_updated', { updates })
    
    return updatedTrip
  }
  
  /**
   * Delete trip
   */
  async deleteTrip(
    tripId: string,
    userId: string
  ): Promise<void> {
    
    // Only owner can delete
    const trip = await TripRepository.findById(tripId)
    if (!trip) {
      throw new TripNotFoundError(tripId)
    }
    
    if (trip.owner_id !== userId) {
      throw new TripAccessDeniedError(tripId, userId, 'delete')
    }
    
    // Soft delete or hard delete based on status
    if (trip.status === 'completed') {
      // Archive instead of delete
      await TripRepository.update(tripId, {
        status: 'archived',
        archived_at: new Date()
      })
    } else {
      // Hard delete (cascade will clean up related records)
      await TripRepository.delete(tripId)
    }
    
    // Log
    await this.logTripEvent(tripId, 'trip_deleted', {})
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRIP QUERIES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get user's trips
   */
  async getUserTrips(
    userId: string,
    filters: TripFilters = {}
  ): Promise<TripListResponse> {
    
    // Default: show upcoming and ongoing first
    const defaultFilters: TripFilters = {
      status: filters.status || ['draft', 'planning', 'confirmed', 'upcoming', 'ongoing'],
      sortBy: filters.sortBy || 'start_date',
      sortOrder: filters.sortOrder || 'asc',
      limit: filters.limit || 20,
      offset: filters.offset || 0
    }
    
    const mergedFilters = { ...defaultFilters, ...filters }
    
    // Get trips where user is owner or traveler
    const trips = await TripRepository.findByUser(userId, mergedFilters)
    const total = await TripRepository.countByUser(userId, mergedFilters)
    
    return {
      trips,
      total,
      hasMore: (mergedFilters.offset || 0) + trips.length < total
    }
  }
  
  /**
   * Get trips by status category
   */
  async getTripsByCategory(
    userId: string,
    category: 'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'draft'
  ): Promise<Trip[]> {
    
    const statusMap: Record<string, TripStatus[]> = {
      upcoming: ['confirmed', 'upcoming'],
      ongoing: ['ongoing'],
      past: ['completed', 'archived'],
      cancelled: ['cancelled'],
      draft: ['draft', 'planning']
    }
    
    return TripRepository.findByUser(userId, {
      status: statusMap[category]
    })
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BOOKING MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Link a booking to a trip
   */
  async linkBookingToTrip(
    tripId: string,
    bookingId: string,
    options: LinkBookingOptions = {}
  ): Promise<TripBooking> {
    
    const trip = await TripRepository.findById(tripId)
    const booking = await BookingService.getBooking(bookingId)
    
    // Calculate which day(s) this booking falls on
    const days = this.calculateBookingDays(trip, booking)
    
    // Create link
    const tripBooking = await TripRepository.linkBooking({
      trip_id: tripId,
      booking_id: bookingId,
      category: booking.category,
      booking_reference: booking.booking_reference,
      summary_title: this.generateBookingSummary(booking).title,
      summary_subtitle: this.generateBookingSummary(booking).subtitle,
      summary_datetime: booking.start_datetime,
      summary_price: booking.total_amount,
      summary_status: booking.status,
      start_day: days.start,
      end_day: days.end,
      traveler_ids: options.travelerIds,
      source: options.source || 'guidera_booking',
      import_id: options.importId,
      added_by: options.addedBy
    })
    
    // Update trip booking counts
    await this.updateBookingCounts(tripId)
    
    // If this is first booking and trip is draft, transition to planning
    if (trip.status === 'draft') {
      await TripLifecycleService.transitionTo(tripId, 'planning')
    }
    
    // Refresh itinerary module
    await ModuleOrchestrator.refreshModule(tripId, 'itinerary')
    
    return tripBooking
  }
  
  /**
   * Unlink a booking from a trip
   */
  async unlinkBookingFromTrip(
    tripId: string,
    bookingId: string,
    userId: string
  ): Promise<void> {
    
    // Check access
    const access = await this.checkAccess(tripId, userId)
    if (!access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'edit')
    }
    
    await TripRepository.unlinkBooking(tripId, bookingId)
    await this.updateBookingCounts(tripId)
    await ModuleOrchestrator.refreshModule(tripId, 'itinerary')
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVITY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Add custom activity to trip
   */
  async addActivity(
    tripId: string,
    userId: string,
    activity: CreateActivityInput
  ): Promise<TripActivity> {
    
    // Check access
    const access = await this.checkAccess(tripId, userId)
    if (!access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'edit')
    }
    
    // Calculate datetime from day number and time
    const trip = await TripRepository.findById(tripId)
    const activityDate = this.calculateDateFromDay(trip, activity.dayNumber)
    
    const activityData: Partial<TripActivity> = {
      trip_id: tripId,
      title: activity.title,
      description: activity.description,
      category: activity.category || 'custom',
      day_number: activity.dayNumber,
      start_time: activity.startTime,
      end_time: activity.endTime,
      start_datetime: activity.startTime 
        ? new Date(`${activityDate}T${activity.startTime}`)
        : undefined,
      location_name: activity.location?.name,
      location_address: activity.location?.address,
      location_coordinates: activity.location?.coordinates,
      location_place_id: activity.location?.placeId,
      estimated_cost: activity.cost?.amount,
      cost_currency: activity.cost?.currency,
      notes: activity.notes,
      created_by: userId
    }
    
    const created = await TripRepository.createActivity(activityData)
    
    // Refresh itinerary
    await ModuleOrchestrator.refreshModule(tripId, 'itinerary')
    
    return created
  }
  
  /**
   * Update activity
   */
  async updateActivity(
    tripId: string,
    activityId: string,
    userId: string,
    updates: UpdateActivityInput
  ): Promise<TripActivity> {
    
    const access = await this.checkAccess(tripId, userId)
    if (!access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'edit')
    }
    
    return TripRepository.updateActivity(activityId, updates)
  }
  
  /**
   * Delete activity
   */
  async deleteActivity(
    tripId: string,
    activityId: string,
    userId: string
  ): Promise<void> {
    
    const access = await this.checkAccess(tripId, userId)
    if (!access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'edit')
    }
    
    await TripRepository.deleteActivity(activityId)
    await ModuleOrchestrator.refreshModule(tripId, 'itinerary')
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ITINERARY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Build complete itinerary for trip
   */
  async buildItinerary(tripId: string): Promise<TripItinerary> {
    const trip = await TripRepository.findById(tripId)
    const bookings = await TripRepository.getBookings(tripId)
    const activities = await TripRepository.getActivities(tripId)
    
    // Build day-by-day structure
    const days: ItineraryDay[] = []
    
    for (let day = 1; day <= trip.duration_days; day++) {
      const date = this.calculateDateFromDay(trip, day)
      
      // Get items for this day
      const dayBookings = bookings.filter(b => 
        b.start_day <= day && b.end_day >= day
      )
      const dayActivities = activities.filter(a => a.day_number === day)
      
      // Merge and sort by time
      const items: ItineraryItem[] = [
        ...dayBookings.map(b => this.bookingToItineraryItem(b, day)),
        ...dayActivities.map(a => this.activityToItineraryItem(a))
      ].sort((a, b) => {
        if (!a.startTime) return 1
        if (!b.startTime) return -1
        return a.startTime.localeCompare(b.startTime)
      })
      
      days.push({
        dayNumber: day,
        date,
        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        items,
        hasItems: items.length > 0
      })
    }
    
    return {
      tripId,
      totalDays: trip.duration_days,
      days
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check user's access to a trip
   */
  async checkAccess(
    tripId: string,
    userId: string
  ): Promise<TripAccess> {
    
    // Check if owner
    const trip = await TripRepository.findById(tripId)
    if (trip.owner_id === userId) {
      return {
        hasAccess: true,
        role: 'owner',
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManageBookings: true
      }
    }
    
    // Check if traveler
    const traveler = await TripRepository.findTraveler(tripId, userId)
    if (traveler && traveler.invitation_status === 'accepted') {
      const permissions = this.getRolePermissions(traveler.role)
      return {
        hasAccess: true,
        role: traveler.role,
        ...permissions
      }
    }
    
    // Check share link
    // (Would need share token from request)
    
    return {
      hasAccess: false,
      role: null,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canManageBookings: false
    }
  }
  
  private getRolePermissions(role: TravelerRole): Permissions {
    const permissionMap: Record<TravelerRole, Permissions> = {
      owner: { canEdit: true, canDelete: true, canInvite: true, canManageBookings: true },
      admin: { canEdit: true, canDelete: false, canInvite: true, canManageBookings: true },
      editor: { canEdit: true, canDelete: false, canInvite: false, canManageBookings: false },
      traveler: { canEdit: false, canDelete: false, canInvite: false, canManageBookings: false },
      viewer: { canEdit: false, canDelete: false, canInvite: false, canManageBookings: false }
    }
    return permissionMap[role]
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SHARE LINK
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Enable share link for trip
   */
  async enableShareLink(
    tripId: string,
    userId: string,
    options: ShareLinkOptions = {}
  ): Promise<ShareLinkResult> {
    
    const access = await this.checkAccess(tripId, userId)
    if (!access.canInvite) {
      throw new TripAccessDeniedError(tripId, userId, 'share')
    }
    
    const token = generateShareToken()
    
    await TripRepository.update(tripId, {
      share_link_enabled: true,
      share_link_token: token,
      share_link_permission: options.permission || 'view',
      share_link_expires_at: options.expiresIn 
        ? new Date(Date.now() + options.expiresIn)
        : null
    })
    
    const shareUrl = `${process.env.APP_URL}/trip/join/${token}`
    
    return {
      enabled: true,
      token,
      url: shareUrl,
      permission: options.permission || 'view',
      expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn) : null
    }
  }
  
  /**
   * Disable share link
   */
  async disableShareLink(tripId: string, userId: string): Promise<void> {
    const access = await this.checkAccess(tripId, userId)
    if (!access.canInvite) {
      throw new TripAccessDeniedError(tripId, userId, 'share')
    }
    
    await TripRepository.update(tripId, {
      share_link_enabled: false,
      share_link_token: null
    })
  }
  
  /**
   * Join trip via share link
   */
  async joinViaShareLink(
    token: string,
    userId: string
  ): Promise<Trip> {
    
    const trip = await TripRepository.findByShareToken(token)
    if (!trip) {
      throw new TripNotFoundError(`Share link invalid or expired`)
    }
    
    // Check if link expired
    if (trip.share_link_expires_at && new Date(trip.share_link_expires_at) < new Date()) {
      throw new TripNotFoundError(`Share link expired`)
    }
    
    // Check if user already a traveler
    const existingTraveler = await TripRepository.findTraveler(trip.id, userId)
    if (existingTraveler) {
      return trip // Already joined
    }
    
    // Get user details
    const user = await UserService.getUser(userId)
    
    // Add as traveler
    await TripCollaborationService.addTraveler(trip.id, {
      user_id: userId,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: trip.share_link_permission === 'edit' ? 'editor' : 'viewer',
      invitation_status: 'accepted',
      accepted_at: new Date()
    })
    
    return trip
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private async addOwnerAsTraveler(
    tripId: string,
    userId: string,
    details?: OwnerDetails
  ): Promise<void> {
    
    const user = await UserService.getUser(userId)
    
    await TripRepository.createTraveler({
      trip_id: tripId,
      user_id: userId,
      first_name: details?.firstName || user.first_name,
      last_name: details?.lastName || user.last_name,
      email: user.email,
      phone: user.phone,
      date_of_birth: details?.dateOfBirth || user.date_of_birth,
      traveler_type: 'adult',
      role: 'owner',
      is_owner: true,
      relationship_to_owner: 'self',
      invitation_status: 'accepted',
      accepted_at: new Date()
    })
  }
  
  private calculateBookingDays(
    trip: Trip,
    booking: Booking
  ): { start: number; end: number } {
    
    const tripStart = new Date(trip.start_date)
    const bookingStart = new Date(booking.start_datetime || booking.travel_start_date)
    const bookingEnd = new Date(booking.end_datetime || booking.travel_end_date)
    
    const startDay = Math.max(1, 
      Math.ceil((bookingStart.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )
    
    const endDay = Math.max(startDay,
      Math.ceil((bookingEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )
    
    return { start: startDay, end: endDay }
  }
  
  private calculateDateFromDay(trip: Trip, dayNumber: number): string {
    const tripStart = new Date(trip.start_date)
    const date = new Date(tripStart)
    date.setDate(date.getDate() + dayNumber - 1)
    return date.toISOString().split('T')[0]
  }
  
  private generateTripName(
    destination: { name: string },
    dates: { start: string; end: string }
  ): string {
    const month = new Date(dates.start).toLocaleDateString('en-US', { month: 'long' })
    return `${destination.name} in ${month}`
  }
  
  private generateBookingSummary(booking: Booking): { title: string; subtitle: string } {
    // Implementation based on booking category
    switch (booking.category) {
      case 'flight':
        const flight = booking.items[0]?.details as UnifiedFlight
        return {
          title: `${flight?.slices[0]?.segments[0]?.marketingCarrier?.name || 'Flight'} ${flight?.slices[0]?.segments[0]?.flightNumber || ''}`,
          subtitle: `${flight?.slices[0]?.origin?.code} → ${flight?.slices[0]?.destination?.code}`
        }
      case 'hotel':
        const hotel = booking.items[0]?.details as UnifiedHotel
        return {
          title: hotel?.name || 'Hotel',
          subtitle: hotel?.roomType || 'Room'
        }
      // ... other categories
      default:
        return { title: 'Booking', subtitle: booking.booking_reference }
    }
  }
  
  private async updateBookingCounts(tripId: string): Promise<void> {
    const bookings = await TripRepository.getBookings(tripId)
    
    const counts = {
      booking_count: bookings.length,
      has_flights: bookings.some(b => b.category === 'flight'),
      has_hotels: bookings.some(b => b.category === 'hotel'),
      has_cars: bookings.some(b => b.category === 'car'),
      has_experiences: bookings.some(b => b.category === 'experience'),
      flight_count: bookings.filter(b => b.category === 'flight').length,
      hotel_count: bookings.filter(b => b.category === 'hotel').length,
      car_count: bookings.filter(b => b.category === 'car').length,
      experience_count: bookings.filter(b => b.category === 'experience').length,
      total_booked_amount: bookings.reduce((sum, b) => sum + (b.summary_price || 0), 0)
    }
    
    await TripRepository.update(tripId, counts)
  }
  
  private async logTripEvent(
    tripId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    // Log to trip_events table for audit trail
    await supabase.from('trip_events').insert({
      trip_id: tripId,
      event_type: eventType,
      event_data: data,
      created_at: new Date()
    })
  }
}

export const tripCoreService = new TripCoreService()
```

---

## Trip Lifecycle Service

Manages trip state transitions and automation.

```typescript
// src/services/trip-lifecycle/trip-lifecycle.service.ts

import { TripRepository } from '../trip/trip-repository'
import { ModuleOrchestrator } from '../module-orchestrator/module-orchestrator.service'
import { NotificationService } from '../notification/notification.service'
import { TripCollaborationService } from '../trip-collaboration/trip-collaboration.service'

type TripStatus = 
  | 'draft' 
  | 'planning' 
  | 'confirmed' 
  | 'upcoming' 
  | 'ongoing' 
  | 'completed' 
  | 'cancelled' 
  | 'archived'

interface StateTransition {
  from: TripStatus[]
  to: TripStatus
  guard?: (trip: Trip) => Promise<boolean>
  onEnter?: (trip: Trip) => Promise<void>
  onExit?: (trip: Trip) => Promise<void>
}

export class TripLifecycleService {
  
  // State machine definition
  private static transitions: StateTransition[] = [
    // Draft → Planning (first booking added)
    {
      from: ['draft'],
      to: 'planning',
      guard: async (trip) => true, // Can always transition
      onEnter: async (trip) => {
        // No special actions
      }
    },
    
    // Draft/Planning → Confirmed (user confirms or booking confirmed)
    {
      from: ['draft', 'planning'],
      to: 'confirmed',
      guard: async (trip) => {
        // Must have at least dates OR a booking
        return !!(trip.start_date && trip.end_date) || trip.booking_count > 0
      },
      onEnter: async (trip) => {
        // Generate all modules
        await ModuleOrchestrator.generateAllModules(trip.id)
        
        // Send confirmation
        await NotificationService.sendTripConfirmed(trip)
        
        // Notify collaborators
        await TripCollaborationService.notifyTravelers(
          trip.id, 
          'trip_confirmed',
          { tripName: trip.name }
        )
        
        // Update confirmed_at
        await TripRepository.update(trip.id, { confirmed_at: new Date() })
      }
    },
    
    // Confirmed → Upcoming (30 days before start)
    {
      from: ['confirmed'],
      to: 'upcoming',
      guard: async (trip) => {
        const daysUntil = this.daysUntilStart(trip)
        return daysUntil <= 30 && daysUntil > 0
      },
      onEnter: async (trip) => {
        // Refresh all modules with latest data
        await ModuleOrchestrator.refreshAllModules(trip.id)
        
        // Send pre-trip notification
        await NotificationService.sendPreTripReminder(trip, 30)
        
        // Enable offline data generation
        await this.prepareOfflineData(trip.id)
      }
    },
    
    // Upcoming → Ongoing (trip start date)
    {
      from: ['upcoming', 'confirmed'],
      to: 'ongoing',
      guard: async (trip) => {
        const daysUntil = this.daysUntilStart(trip)
        return daysUntil <= 0 && this.daysUntilEnd(trip) >= 0
      },
      onEnter: async (trip) => {
        // Start real-time monitoring
        await this.enableRealTimeMonitoring(trip.id)
        
        // Send trip started notification
        await NotificationService.sendTripStarted(trip)
        
        // Update started_at
        await TripRepository.update(trip.id, { started_at: new Date() })
        
        // Refresh safety and alerts
        await ModuleOrchestrator.refreshModule(trip.id, 'safety')
      }
    },
    
    // Ongoing → Completed (trip end date)
    {
      from: ['ongoing'],
      to: 'completed',
      guard: async (trip) => {
        return this.daysUntilEnd(trip) < 0
      },
      onEnter: async (trip) => {
        // Stop real-time monitoring
        await this.disableRealTimeMonitoring(trip.id)
        
        // Send completion notification
        await NotificationService.sendTripCompleted(trip)
        
        // Update completed_at
        await TripRepository.update(trip.id, { completed_at: new Date() })
        
        // Schedule review request
        await this.scheduleReviewRequest(trip.id)
        
        // Generate trip summary/memories
        await this.generateTripSummary(trip.id)
      }
    },
    
    // Any → Cancelled
    {
      from: ['draft', 'planning', 'confirmed', 'upcoming'],
      to: 'cancelled',
      guard: async (trip) => {
        // Cannot cancel ongoing trips (must complete first)
        return trip.status !== 'ongoing'
      },
      onEnter: async (trip) => {
        // Cancel all pending bookings
        await this.cancelPendingBookings(trip.id)
        
        // Notify travelers
        await TripCollaborationService.notifyTravelers(
          trip.id,
          'trip_cancelled',
          { tripName: trip.name }
        )
        
        // Update cancelled_at
        await TripRepository.update(trip.id, { cancelled_at: new Date() })
      }
    },
    
    // Completed → Archived
    {
      from: ['completed'],
      to: 'archived',
      onEnter: async (trip) => {
        await TripRepository.update(trip.id, { archived_at: new Date() })
      }
    }
  ]
  
  /**
   * Transition trip to new state
   */
  static async transitionTo(
    tripId: string,
    targetStatus: TripStatus,
    reason?: string
  ): Promise<Trip> {
    
    const trip = await TripRepository.findById(tripId)
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`)
    }
    
    // Find valid transition
    const transition = this.transitions.find(t => 
      t.from.includes(trip.status as TripStatus) && t.to === targetStatus
    )
    
    if (!transition) {
      throw new Error(`Invalid transition from ${trip.status} to ${targetStatus}`)
    }
    
    // Run guard
    if (transition.guard) {
      const canTransition = await transition.guard(trip)
      if (!canTransition) {
        throw new Error(`Transition guard failed for ${trip.status} to ${targetStatus}`)
      }
    }
    
    // Run onExit for current state
    const exitTransition = this.transitions.find(t => 
      t.to === trip.status && t.onExit
    )
    if (exitTransition?.onExit) {
      await exitTransition.onExit(trip)
    }
    
    // Update status
    const updatedTrip = await TripRepository.update(tripId, {
      status: targetStatus,
      previous_status: trip.status,
      status_changed_at: new Date(),
      status_change_reason: reason
    })
    
    // Run onEnter for new state
    if (transition.onEnter) {
      await transition.onEnter(updatedTrip)
    }
    
    // Log transition
    await this.logTransition(tripId, trip.status, targetStatus, reason)
    
    return updatedTrip
  }
  
  /**
   * Process automatic transitions (called by scheduler)
   */
  static async processAutomaticTransitions(): Promise<void> {
    const now = new Date()
    
    // Find trips needing transition to 'upcoming'
    const needUpcoming = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'confirmed')
      .lte('transition_to_upcoming_at', now.toISOString())
    
    for (const trip of needUpcoming.data || []) {
      try {
        await this.transitionTo(trip.id, 'upcoming', 'automatic_30_day')
      } catch (error) {
        console.error(`Failed to transition trip ${trip.id} to upcoming:`, error)
      }
    }
    
    // Find trips needing transition to 'ongoing'
    const needOngoing = await supabase
      .from('trips')
      .select('*')
      .in('status', ['confirmed', 'upcoming'])
      .lte('transition_to_ongoing_at', now.toISOString())
    
    for (const trip of needOngoing.data || []) {
      try {
        await this.transitionTo(trip.id, 'ongoing', 'automatic_start_date')
      } catch (error) {
        console.error(`Failed to transition trip ${trip.id} to ongoing:`, error)
      }
    }
    
    // Find trips needing transition to 'completed'
    const needCompleted = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'ongoing')
      .lte('transition_to_completed_at', now.toISOString())
    
    for (const trip of needCompleted.data || []) {
      try {
        await this.transitionTo(trip.id, 'completed', 'automatic_end_date')
      } catch (error) {
        console.error(`Failed to transition trip ${trip.id} to completed:`, error)
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private static daysUntilStart(trip: Trip): number {
    if (!trip.start_date) return Infinity
    const start = new Date(trip.start_date)
    const now = new Date()
    return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  private static daysUntilEnd(trip: Trip): number {
    if (!trip.end_date) return Infinity
    const end = new Date(trip.end_date)
    const now = new Date()
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  private static async prepareOfflineData(tripId: string): Promise<void> {
    // Generate offline-ready data package
    await ModuleOrchestrator.generateOfflinePackage(tripId)
  }
  
  private static async enableRealTimeMonitoring(tripId: string): Promise<void> {
    // Enable flight tracking, weather monitoring, etc.
    await RealTimeService.enableForTrip(tripId)
  }
  
  private static async disableRealTimeMonitoring(tripId: string): Promise<void> {
    await RealTimeService.disableForTrip(tripId)
  }
  
  private static async scheduleReviewRequest(tripId: string): Promise<void> {
    // Schedule review request 24 hours after completion
    await JobScheduler.schedule('send_review_request', { tripId }, {
      runAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    })
  }
  
  private static async generateTripSummary(tripId: string): Promise<void> {
    // Generate memories, stats, shareable summary
    await ModuleOrchestrator.generateModule(tripId, 'trip_summary')
  }
  
  private static async cancelPendingBookings(tripId: string): Promise<void> {
    // Get all bookings and initiate cancellations
    const bookings = await TripRepository.getBookings(tripId)
    
    for (const booking of bookings) {
      if (['confirmed', 'ticketed'].includes(booking.summary_status)) {
        try {
          await BookingManagementService.requestCancellation({
            bookingId: booking.booking_id,
            requestedBy: 'system',
            reason: 'Trip cancelled'
          })
        } catch (error) {
          console.error(`Failed to cancel booking ${booking.booking_id}:`, error)
        }
      }
    }
  }
  
  private static async logTransition(
    tripId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string
  ): Promise<void> {
    await supabase.from('trip_status_history').insert({
      trip_id: tripId,
      from_status: fromStatus,
      to_status: toStatus,
      reason,
      transitioned_at: new Date()
    })
  }
}
```

---

## Trip Import Service

Handles all import methods: email, OAuth, manual, scan.

```typescript
// src/services/trip-import/trip-import.service.ts

import { EmailParser } from './parsers/email-parser'
import { TicketScanner } from './parsers/ticket-scanner'
import { ManualEntryValidator } from './validators/manual-entry.validator'
import { OAuthImporter } from './oauth/oauth-importer'

export class TripImportService {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL IMPORT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get user's unique import email
   */
  static async getImportEmail(userId: string): Promise<string> {
    // Check if exists
    const existing = await supabase
      .from('user_email_aliases')
      .select('alias_email')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    if (existing.data) {
      return existing.data.alias_email
    }
    
    // Generate new
    const prefix = `import-${generateRandomString(12).toLowerCase()}`
    const email = `${prefix}@trips.guidera.com`
    
    await supabase.from('user_email_aliases').insert({
      user_id: userId,
      alias_email: email,
      alias_prefix: prefix
    })
    
    return email
  }
  
  /**
   * Process incoming email
   */
  static async processIncomingEmail(
    recipientEmail: string,
    emailData: IncomingEmail
  ): Promise<TripImport> {
    
    // Find user by alias
    const alias = await supabase
      .from('user_email_aliases')
      .select('user_id')
      .eq('alias_email', recipientEmail)
      .single()
    
    if (!alias.data) {
      throw new Error(`Unknown import email: ${recipientEmail}`)
    }
    
    const userId = alias.data.user_id
    
    // Create import record
    const importRecord = await supabase
      .from('trip_imports')
      .insert({
        user_id: userId,
        import_method: 'email',
        raw_input_type: 'email',
        raw_input_data: emailData.body,
        email_from: emailData.from,
        email_subject: emailData.subject,
        email_received_at: emailData.receivedAt,
        email_message_id: emailData.messageId,
        parse_status: 'pending'
      })
      .select()
      .single()
    
    // Parse email asynchronously
    await this.parseEmailAsync(importRecord.data.id)
    
    // Update alias stats
    await supabase
      .from('user_email_aliases')
      .update({
        emails_received: supabase.sql`emails_received + 1`,
        last_email_at: new Date()
      })
      .eq('alias_email', recipientEmail)
    
    return importRecord.data
  }
  
  /**
   * Parse email to extract booking data
   */
  private static async parseEmailAsync(importId: string): Promise<void> {
    await supabase
      .from('trip_imports')
      .update({ parse_status: 'parsing' })
      .eq('id', importId)
    
    try {
      const importRecord = await supabase
        .from('trip_imports')
        .select('*')
        .eq('id', importId)
        .single()
      
      // Use AI to parse email
      const parsed = await EmailParser.parse({
        from: importRecord.data.email_from,
        subject: importRecord.data.email_subject,
        body: importRecord.data.raw_input_data
      })
      
      // Update record
      await supabase
        .from('trip_imports')
        .update({
          parse_status: parsed.confidence > 0.7 ? 'parsed' : 'needs_review',
          parsed_at: new Date(),
          parsed_data: parsed,
          overall_confidence: parsed.confidence,
          field_confidences: parsed.fieldConfidences
        })
        .eq('id', importId)
      
      // If high confidence, auto-process
      if (parsed.confidence > 0.85) {
        await this.processImport(importId)
      } else {
        // Notify user for review
        await NotificationService.sendImportNeedsReview(
          importRecord.data.user_id,
          importId,
          parsed
        )
      }
      
    } catch (error) {
      await supabase
        .from('trip_imports')
        .update({
          parse_status: 'failed',
          parse_error: error.message
        })
        .eq('id', importId)
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OAUTH IMPORT (Link Travel Accounts)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Initiate OAuth connection
   */
  static async initiateOAuthConnection(
    userId: string,
    provider: OAuthProvider
  ): Promise<{ authUrl: string }> {
    
    const config = OAUTH_CONFIGS[provider]
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`)
    }
    
    const state = generateRandomString(32)
    
    // Store state for callback verification
    await supabase.from('oauth_states').insert({
      user_id: userId,
      provider,
      state,
      expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    })
    
    const authUrl = buildOAuthUrl(config, state)
    
    return { authUrl }
  }
  
  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<LinkedTravelAccount> {
    
    // Verify state
    const stateRecord = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (!stateRecord.data) {
      throw new Error('Invalid or expired OAuth state')
    }
    
    const { user_id, provider } = stateRecord.data
    const config = OAUTH_CONFIGS[provider]
    
    // Exchange code for tokens
    const tokens = await exchangeOAuthCode(config, code)
    
    // Get account info
    const accountInfo = await getOAuthAccountInfo(config, tokens.access_token)
    
    // Store linked account
    const linkedAccount = await supabase
      .from('linked_travel_accounts')
      .upsert({
        user_id,
        provider,
        access_token_encrypted: encrypt(tokens.access_token),
        refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        token_expires_at: tokens.expires_at,
        provider_account_id: accountInfo.id,
        provider_email: accountInfo.email,
        provider_name: accountInfo.name,
        status: 'active',
        next_sync_at: new Date() // Sync immediately
      })
      .select()
      .single()
    
    // Cleanup state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state)
    
    // Trigger initial sync
    await this.syncLinkedAccount(linkedAccount.data.id)
    
    return linkedAccount.data
  }
  
  /**
   * Sync bookings from linked account
   */
  static async syncLinkedAccount(accountId: string): Promise<SyncResult> {
    const account = await supabase
      .from('linked_travel_accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (!account.data || account.data.status !== 'active') {
      throw new Error('Account not found or inactive')
    }
    
    const importer = OAuthImporter.getImporter(account.data.provider)
    
    try {
      // Decrypt tokens
      const accessToken = decrypt(account.data.access_token_encrypted)
      
      // Fetch bookings from provider
      const bookings = await importer.fetchBookings(accessToken, {
        importFlights: account.data.import_flights,
        importHotels: account.data.import_hotels,
        importCars: account.data.import_cars,
        importExperiences: account.data.import_experiences,
        since: account.data.last_sync_at
      })
      
      let importedCount = 0
      
      // Process each booking
      for (const booking of bookings) {
        // Check if already imported
        const existing = await supabase
          .from('trip_imports')
          .select('id')
          .eq('oauth_provider', account.data.provider)
          .eq('oauth_booking_id', booking.id)
          .single()
        
        if (existing.data) continue // Skip duplicates
        
        // Create import record
        const importRecord = await supabase
          .from('trip_imports')
          .insert({
            user_id: account.data.user_id,
            import_method: `oauth_${account.data.provider}`,
            oauth_provider: account.data.provider,
            oauth_booking_id: booking.id,
            parse_status: 'parsed',
            parsed_at: new Date(),
            parsed_data: this.normalizeOAuthBooking(booking),
            overall_confidence: 0.95 // OAuth data is high confidence
          })
          .select()
          .single()
        
        await this.processImport(importRecord.data.id)
        importedCount++
      }
      
      // Update sync status
      await supabase
        .from('linked_travel_accounts')
        .update({
          last_sync_at: new Date(),
          last_sync_status: 'success',
          bookings_imported: supabase.sql`bookings_imported + ${importedCount}`,
          next_sync_at: this.calculateNextSync(account.data.sync_frequency)
        })
        .eq('id', accountId)
      
      return {
        success: true,
        importedCount,
        provider: account.data.provider
      }
      
    } catch (error) {
      await supabase
        .from('linked_travel_accounts')
        .update({
          last_sync_status: 'error',
          last_sync_error: error.message,
          status: error.code === 'TOKEN_EXPIRED' ? 'expired' : 'error'
        })
        .eq('id', accountId)
      
      throw error
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MANUAL ENTRY
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Create import from manual entry
   */
  static async createManualImport(
    userId: string,
    data: ManualEntryData
  ): Promise<TripImport> {
    
    // Validate
    const validation = ManualEntryValidator.validate(data)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }
    
    // Normalize to standard format
    const normalized = this.normalizeManualEntry(data)
    
    // Create import record
    const importRecord = await supabase
      .from('trip_imports')
      .insert({
        user_id: userId,
        import_method: 'manual',
        raw_input_type: 'manual',
        raw_input_data: JSON.stringify(data),
        parse_status: 'parsed',
        parsed_at: new Date(),
        parsed_data: normalized,
        overall_confidence: 1.0, // User entered = 100% confidence
        user_reviewed: true,
        user_reviewed_at: new Date()
      })
      .select()
      .single()
    
    // Process immediately
    await this.processImport(importRecord.data.id)
    
    return importRecord.data
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCAN IMPORT (QR, Barcode, OCR)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Process scanned ticket/voucher
   */
  static async processTicketScan(
    userId: string,
    scanData: TicketScanData
  ): Promise<TripImport> {
    
    let importMethod: string
    let extractedData: ParsedImportData
    
    if (scanData.type === 'qr') {
      importMethod = 'scan_qr'
      extractedData = await TicketScanner.parseQRCode(scanData.data)
    } else if (scanData.type === 'barcode') {
      importMethod = 'scan_barcode'
      extractedData = await TicketScanner.parseBarcode(scanData.data)
    } else if (scanData.type === 'image') {
      importMethod = 'scan_ocr'
      extractedData = await TicketScanner.parseImage(scanData.imageUrl)
    } else {
      throw new Error(`Unknown scan type: ${scanData.type}`)
    }
    
    // Create import record
    const importRecord = await supabase
      .from('trip_imports')
      .insert({
        user_id: userId,
        import_method: importMethod,
        raw_input_type: scanData.type === 'image' ? 'image' : 'text',
        raw_input_data: scanData.data,
        scan_image_url: scanData.imageUrl,
        scan_confidence: extractedData.confidence,
        parse_status: extractedData.confidence > 0.7 ? 'parsed' : 'needs_review',
        parsed_at: new Date(),
        parsed_data: extractedData,
        overall_confidence: extractedData.confidence,
        field_confidences: extractedData.fieldConfidences
      })
      .select()
      .single()
    
    // If high confidence, auto-process
    if (extractedData.confidence > 0.85) {
      await this.processImport(importRecord.data.id)
    }
    
    return importRecord.data
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Process a parsed import into a trip/booking
   */
  static async processImport(importId: string): Promise<ProcessResult> {
    const importRecord = await supabase
      .from('trip_imports')
      .select('*')
      .eq('id', importId)
      .single()
    
    if (!importRecord.data) {
      throw new Error(`Import not found: ${importId}`)
    }
    
    if (importRecord.data.processing_status === 'processed') {
      return { alreadyProcessed: true }
    }
    
    await supabase
      .from('trip_imports')
      .update({ processing_status: 'processing' })
      .eq('id', importId)
    
    const parsed = importRecord.data.parsed_data
    const userId = importRecord.data.user_id
    
    try {
      // Check if this should merge with existing trip
      const existingTrip = await this.findMatchingTrip(userId, parsed)
      
      let tripId: string
      let booking: Booking | null = null
      
      if (existingTrip) {
        // Merge into existing trip
        tripId = existingTrip.id
      } else {
        // Create new trip
        const trip = await TripCoreService.createTripFromImport(userId, {
          ...parsed,
          importId
        })
        tripId = trip.id
      }
      
      // If booking data, create booking
      if (parsed.extracted && parsed.category) {
        booking = await this.createBookingFromImport(parsed, userId)
        await TripCoreService.linkBookingToTrip(tripId, booking.id, {
          source: importRecord.data.import_method,
          importId
        })
      }
      
      // Update import record
      await supabase
        .from('trip_imports')
        .update({
          trip_id: tripId,
          processing_status: 'processed',
          created_booking_id: booking?.id
        })
        .eq('id', importId)
      
      // Notify user
      await NotificationService.sendImportProcessed(userId, {
        tripId,
        tripName: existingTrip?.name || parsed.destination_detected?.name,
        isNewTrip: !existingTrip,
        bookingCategory: parsed.category
      })
      
      return {
        success: true,
        tripId,
        bookingId: booking?.id,
        isNewTrip: !existingTrip
      }
      
    } catch (error) {
      await supabase
        .from('trip_imports')
        .update({
          processing_status: 'failed',
          parse_error: error.message
        })
        .eq('id', importId)
      
      throw error
    }
  }
  
  /**
   * Find existing trip that matches import data
   */
  private static async findMatchingTrip(
    userId: string,
    parsed: ParsedImportData
  ): Promise<Trip | null> {
    
    if (!parsed.dates_detected || !parsed.destination_detected) {
      return null
    }
    
    // Look for trip with same destination and overlapping dates
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('owner_id', userId)
      .eq('primary_destination_code', parsed.destination_detected.code)
      .in('status', ['draft', 'planning', 'confirmed', 'upcoming'])
      .or(`
        start_date.lte.${parsed.dates_detected.end},
        end_date.gte.${parsed.dates_detected.start}
      `)
    
    if (trips && trips.length > 0) {
      // Return the most relevant match
      return trips[0]
    }
    
    return null
  }
  
  /**
   * Create a booking record from import data
   */
  private static async createBookingFromImport(
    parsed: ParsedImportData,
    userId: string
  ): Promise<Booking> {
    
    // Create a "imported" booking (not from our providers)
    return await BookingService.createImportedBooking({
      userId,
      category: parsed.category,
      provider: 'imported',
      providerBookingId: parsed.extracted.confirmation_number,
      details: parsed.extracted,
      startDate: parsed.dates_detected.start,
      endDate: parsed.dates_detected.end,
      travelers: parsed.travelers || [{ name: 'Primary Traveler' }]
    })
  }
  
  /**
   * Link import to trip (after trip created)
   */
  static async linkToTrip(importId: string, tripId: string): Promise<void> {
    await supabase
      .from('trip_imports')
      .update({ trip_id: tripId })
      .eq('id', importId)
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // USER REVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * User reviews and corrects parsed data
   */
  static async submitUserReview(
    importId: string,
    userId: string,
    corrections: ParsedImportData
  ): Promise<TripImport> {
    
    const importRecord = await supabase
      .from('trip_imports')
      .select('*')
      .eq('id', importId)
      .eq('user_id', userId)
      .single()
    
    if (!importRecord.data) {
      throw new Error('Import not found or access denied')
    }
    
    // Store corrections
    await supabase
      .from('trip_imports')
      .update({
        parsed_data: corrections,
        user_reviewed: true,
        user_reviewed_at: new Date(),
        user_corrections: {
          original: importRecord.data.parsed_data,
          corrected: corrections
        },
        parse_status: 'parsed'
      })
      .eq('id', importId)
    
    // Process with corrected data
    await this.processImport(importId)
    
    return await supabase
      .from('trip_imports')
      .select('*')
      .eq('id', importId)
      .single()
      .then(r => r.data)
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private static calculateNextSync(frequency: string): Date {
    const intervals: Record<string, number> = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000
    }
    return new Date(Date.now() + (intervals[frequency] || intervals.daily))
  }
  
  private static normalizeOAuthBooking(booking: any): ParsedImportData {
    // Normalize provider-specific booking format to our standard format
    // Implementation varies by provider
    return {
      category: booking.type,
      confidence: 0.95,
      extracted: booking,
      destination_detected: booking.destination,
      dates_detected: {
        start: booking.startDate,
        end: booking.endDate
      }
    }
  }
  
  private static normalizeManualEntry(data: ManualEntryData): ParsedImportData {
    return {
      category: data.category,
      confidence: 1.0,
      extracted: {
        ...data.details,
        confirmation_number: data.confirmationNumber
      },
      destination_detected: data.destination,
      dates_detected: data.dates
    }
  }
}
```

---

## Trip Collaboration Service

Handles invitations and multi-traveler coordination.

```typescript
// src/services/trip-collaboration/trip-collaboration.service.ts

export class TripCollaborationService {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INVITATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Invite someone to a trip
   */
  static async inviteTraveler(
    tripId: string,
    invitedBy: string,
    invitation: InvitationInput
  ): Promise<TripInvitation> {
    
    // Check inviter has permission
    const access = await TripCoreService.checkAccess(tripId, invitedBy)
    if (!access.canInvite) {
      throw new TripAccessDeniedError(tripId, invitedBy, 'invite')
    }
    
    // Check if already invited or a traveler
    const existing = await this.findExistingTraveler(tripId, invitation.email)
    if (existing) {
      throw new Error('This person is already invited or a traveler on this trip')
    }
    
    // Check if invited user has an account
    const existingUser = await UserService.findByEmail(invitation.email)
    
    // Generate invitation token
    const token = generateInviteToken()
    
    // Create invitation
    const invitationRecord = await supabase
      .from('trip_invitations')
      .insert({
        trip_id: tripId,
        invited_email: invitation.email,
        invited_phone: invitation.phone,
        invited_user_id: existingUser?.id,
        invited_name: invitation.name,
        invited_by: invitedBy,
        role: invitation.role || 'traveler',
        relationship: invitation.relationship,
        token,
        message: invitation.message
      })
      .select()
      .single()
    
    // Send invitation notification
    await this.sendInvitationNotification(invitationRecord.data, invitation.message)
    
    // Update trip collaboration flag
    await supabase
      .from('trips')
      .update({ is_collaborative: true })
      .eq('id', tripId)
    
    return invitationRecord.data
  }
  
  /**
   * Accept invitation
   */
  static async acceptInvitation(
    token: string,
    userId: string,
    travelerDetails?: TravelerDetails
  ): Promise<TripTraveler> {
    
    // Find invitation
    const invitation = await supabase
      .from('trip_invitations')
      .select('*, trips(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('token_expires_at', new Date().toISOString())
      .single()
    
    if (!invitation.data) {
      throw new Error('Invitation not found, expired, or already used')
    }
    
    // Get user details
    const user = await UserService.getUser(userId)
    
    // Create traveler record
    const traveler = await supabase
      .from('trip_travelers')
      .insert({
        trip_id: invitation.data.trip_id,
        user_id: userId,
        first_name: travelerDetails?.firstName || user.first_name || invitation.data.invited_name,
        last_name: travelerDetails?.lastName || user.last_name || '',
        email: user.email,
        phone: user.phone,
        date_of_birth: travelerDetails?.dateOfBirth,
        traveler_type: travelerDetails?.type || 'adult',
        role: invitation.data.role,
        relationship_to_owner: invitation.data.relationship,
        invitation_status: 'accepted',
        invited_at: invitation.data.created_at,
        invited_by: invitation.data.invited_by,
        accepted_at: new Date(),
        dietary_restrictions: travelerDetails?.dietaryRestrictions,
        accessibility_needs: travelerDetails?.accessibilityNeeds
      })
      .select()
      .single()
    
    // Update invitation
    await supabase
      .from('trip_invitations')
      .update({
        status: 'accepted',
        responded_at: new Date(),
        created_traveler_id: traveler.data.id
      })
      .eq('id', invitation.data.id)
    
    // Update trip counts
    await this.updateCollaboratorCount(invitation.data.trip_id)
    
    // Notify trip owner
    await NotificationService.sendInvitationAccepted(
      invitation.data.invited_by,
      invitation.data.trips,
      traveler.data
    )
    
    // Generate personalized modules for new traveler
    await ModuleOrchestrator.generatePersonalizedModules(
      invitation.data.trip_id,
      traveler.data.id
    )
    
    return traveler.data
  }
  
  /**
   * Decline invitation
   */
  static async declineInvitation(
    token: string,
    reason?: string
  ): Promise<void> {
    
    const invitation = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()
    
    if (!invitation.data) {
      throw new Error('Invitation not found or already responded')
    }
    
    await supabase
      .from('trip_invitations')
      .update({
        status: 'declined',
        responded_at: new Date(),
        decline_reason: reason
      })
      .eq('id', invitation.data.id)
    
    // Notify inviter
    await NotificationService.sendInvitationDeclined(
      invitation.data.invited_by,
      invitation.data.trip_id,
      invitation.data.invited_name || invitation.data.invited_email
    )
  }
  
  /**
   * Revoke invitation
   */
  static async revokeInvitation(
    invitationId: string,
    userId: string
  ): Promise<void> {
    
    const invitation = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()
    
    if (!invitation.data) {
      throw new Error('Invitation not found')
    }
    
    // Check permission
    const access = await TripCoreService.checkAccess(invitation.data.trip_id, userId)
    if (!access.canInvite) {
      throw new TripAccessDeniedError(invitation.data.trip_id, userId, 'manage invitations')
    }
    
    await supabase
      .from('trip_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVELER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Add traveler directly (without invitation)
   */
  static async addTraveler(
    tripId: string,
    travelerData: AddTravelerInput
  ): Promise<TripTraveler> {
    
    const traveler = await supabase
      .from('trip_travelers')
      .insert({
        trip_id: tripId,
        ...travelerData
      })
      .select()
      .single()
    
    await this.updateCollaboratorCount(tripId)
    
    return traveler.data
  }
  
  /**
   * Update traveler details
   */
  static async updateTraveler(
    tripId: string,
    travelerId: string,
    userId: string,
    updates: UpdateTravelerInput
  ): Promise<TripTraveler> {
    
    // Check access - can update own details or have edit permission
    const traveler = await supabase
      .from('trip_travelers')
      .select('*')
      .eq('id', travelerId)
      .eq('trip_id', tripId)
      .single()
    
    if (!traveler.data) {
      throw new Error('Traveler not found')
    }
    
    const isSelf = traveler.data.user_id === userId
    const access = await TripCoreService.checkAccess(tripId, userId)
    
    if (!isSelf && !access.canEdit) {
      throw new TripAccessDeniedError(tripId, userId, 'update traveler')
    }
    
    return await supabase
      .from('trip_travelers')
      .update(updates)
      .eq('id', travelerId)
      .select()
      .single()
      .then(r => r.data)
  }
  
  /**
   * Remove traveler from trip
   */
  static async removeTraveler(
    tripId: string,
    travelerId: string,
    removedBy: string
  ): Promise<void> {
    
    const traveler = await supabase
      .from('trip_travelers')
      .select('*')
      .eq('id', travelerId)
      .eq('trip_id', tripId)
      .single()
    
    if (!traveler.data) {
      throw new Error('Traveler not found')
    }
    
    // Cannot remove owner
    if (traveler.data.is_owner) {
      throw new Error('Cannot remove trip owner')
    }
    
    // Check permission
    const access = await TripCoreService.checkAccess(tripId, removedBy)
    const isSelf = traveler.data.user_id === removedBy
    
    if (!isSelf && !access.canInvite) {
      throw new TripAccessDeniedError(tripId, removedBy, 'remove traveler')
    }
    
    // Soft delete
    await supabase
      .from('trip_travelers')
      .update({ invitation_status: 'removed' })
      .eq('id', travelerId)
    
    await this.updateCollaboratorCount(tripId)
    
    // Notify removed user
    if (traveler.data.user_id) {
      await NotificationService.sendRemovedFromTrip(
        traveler.data.user_id,
        tripId
      )
    }
  }
  
  /**
   * Change traveler role
   */
  static async changeTravelerRole(
    tripId: string,
    travelerId: string,
    newRole: TravelerRole,
    changedBy: string
  ): Promise<TripTraveler> {
    
    // Check permission - only owner and admins can change roles
    const access = await TripCoreService.checkAccess(tripId, changedBy)
    if (access.role !== 'owner' && access.role !== 'admin') {
      throw new TripAccessDeniedError(tripId, changedBy, 'change role')
    }
    
    const traveler = await supabase
      .from('trip_travelers')
      .select('*')
      .eq('id', travelerId)
      .single()
    
    if (!traveler.data) {
      throw new Error('Traveler not found')
    }
    
    // Cannot change owner's role
    if (traveler.data.is_owner) {
      throw new Error('Cannot change owner role')
    }
    
    // Admins cannot promote to admin
    if (access.role === 'admin' && newRole === 'admin') {
      throw new Error('Only owner can promote to admin')
    }
    
    return await supabase
      .from('trip_travelers')
      .update({ role: newRole })
      .eq('id', travelerId)
      .select()
      .single()
      .then(r => r.data)
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Notify all travelers about trip event
   */
  static async notifyTravelers(
    tripId: string,
    eventType: string,
    data: Record<string, any>,
    excludeUserId?: string
  ): Promise<void> {
    
    const travelers = await supabase
      .from('trip_travelers')
      .select('user_id, email')
      .eq('trip_id', tripId)
      .eq('invitation_status', 'accepted')
    
    for (const traveler of travelers.data || []) {
      if (traveler.user_id === excludeUserId) continue
      
      if (traveler.user_id) {
        await NotificationService.sendPushNotification(
          traveler.user_id,
          eventType,
          data
        )
      }
      
      if (traveler.email) {
        await NotificationService.sendEmail(
          traveler.email,
          eventType,
          data
        )
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private static async findExistingTraveler(
    tripId: string,
    email: string
  ): Promise<TripTraveler | null> {
    
    // Check travelers
    const traveler = await supabase
      .from('trip_travelers')
      .select('*')
      .eq('trip_id', tripId)
      .eq('email', email)
      .neq('invitation_status', 'removed')
      .single()
    
    if (traveler.data) return traveler.data
    
    // Check pending invitations
    const invitation = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('trip_id', tripId)
      .eq('invited_email', email)
      .eq('status', 'pending')
      .single()
    
    return invitation.data ? { invitation: true, ...invitation.data } as any : null
  }
  
  private static async updateCollaboratorCount(tripId: string): Promise<void> {
    const { count } = await supabase
      .from('trip_travelers')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId)
      .eq('invitation_status', 'accepted')
      .eq('is_owner', false)
    
    await supabase
      .from('trips')
      .update({
        collaborator_count: count || 0,
        is_collaborative: (count || 0) > 0
      })
      .eq('id', tripId)
  }
  
  private static async sendInvitationNotification(
    invitation: TripInvitation,
    message?: string
  ): Promise<void> {
    
    const trip = await TripRepository.findById(invitation.trip_id)
    const inviter = await UserService.getUser(invitation.invited_by)
    
    const inviteUrl = `${process.env.APP_URL}/trip/invite/${invitation.token}`
    
    // If user exists, send push + email
    if (invitation.invited_user_id) {
      await NotificationService.sendPushNotification(
        invitation.invited_user_id,
        'trip_invitation',
        {
          tripName: trip.name,
          inviterName: `${inviter.first_name} ${inviter.last_name}`,
          inviteUrl
        }
      )
    }
    
    // Always send email
    await NotificationService.sendEmail(
      invitation.invited_email,
      'trip_invitation',
      {
        recipientName: invitation.invited_name || 'there',
        tripName: trip.name,
        tripDestination: trip.primary_destination_name,
        tripDates: `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}`,
        inviterName: `${inviter.first_name} ${inviter.last_name}`,
        personalMessage: message,
        inviteUrl
      }
    )
    
    // Update invitation
    await supabase
      .from('trip_invitations')
      .update({
        notification_sent: true,
        notification_sent_at: new Date(),
        notification_method: 'email'
      })
      .eq('id', invitation.id)
  }
}
```

---

## API Endpoints

### Trip Endpoints

```typescript
// supabase/functions/trips/index.ts

serve(async (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method
  
  // Auth
  const userId = await authenticateRequest(req)
  
  // Routes
  
  // GET /trips - List user's trips
  if (method === 'GET' && path === '/trips') {
    const filters = parseQueryParams(url.searchParams)
    const trips = await TripCoreService.getUserTrips(userId, filters)
    return jsonResponse(trips)
  }
  
  // POST /trips - Create trip
  if (method === 'POST' && path === '/trips') {
    const body = await req.json()
    const trip = await TripCoreService.createTrip({
      ...body,
      userId
    })
    return jsonResponse(trip, 201)
  }
  
  // GET /trips/:id - Get trip details
  if (method === 'GET' && path.match(/^\/trips\/[\w-]+$/)) {
    const tripId = path.split('/')[2]
    const options = parseQueryParams(url.searchParams)
    const trip = await TripCoreService.getTrip(tripId, userId, options)
    return jsonResponse(trip)
  }
  
  // PATCH /trips/:id - Update trip
  if (method === 'PATCH' && path.match(/^\/trips\/[\w-]+$/)) {
    const tripId = path.split('/')[2]
    const body = await req.json()
    const trip = await TripCoreService.updateTrip(tripId, userId, body)
    return jsonResponse(trip)
  }
  
  // DELETE /trips/:id - Delete trip
  if (method === 'DELETE' && path.match(/^\/trips\/[\w-]+$/)) {
    const tripId = path.split('/')[2]
    await TripCoreService.deleteTrip(tripId, userId)
    return new Response(null, { status: 204 })
  }
  
  // POST /trips/:id/confirm - Confirm trip
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/confirm$/)) {
    const tripId = path.split('/')[2]
    const trip = await TripLifecycleService.transitionTo(tripId, 'confirmed')
    return jsonResponse(trip)
  }
  
  // POST /trips/:id/cancel - Cancel trip
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/cancel$/)) {
    const tripId = path.split('/')[2]
    const { reason } = await req.json()
    const trip = await TripLifecycleService.transitionTo(tripId, 'cancelled', reason)
    return jsonResponse(trip)
  }
  
  // GET /trips/:id/itinerary - Get itinerary
  if (method === 'GET' && path.match(/^\/trips\/[\w-]+\/itinerary$/)) {
    const tripId = path.split('/')[2]
    const itinerary = await TripCoreService.buildItinerary(tripId)
    return jsonResponse(itinerary)
  }
  
  // Bookings
  
  // POST /trips/:id/bookings - Link booking
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/bookings$/)) {
    const tripId = path.split('/')[2]
    const { bookingId, ...options } = await req.json()
    const link = await TripCoreService.linkBookingToTrip(tripId, bookingId, options)
    return jsonResponse(link, 201)
  }
  
  // DELETE /trips/:id/bookings/:bookingId - Unlink booking
  if (method === 'DELETE' && path.match(/^\/trips\/[\w-]+\/bookings\/[\w-]+$/)) {
    const [_, tripId, _2, bookingId] = path.split('/')
    await TripCoreService.unlinkBookingFromTrip(tripId, bookingId, userId)
    return new Response(null, { status: 204 })
  }
  
  // Activities
  
  // POST /trips/:id/activities - Add activity
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/activities$/)) {
    const tripId = path.split('/')[2]
    const body = await req.json()
    const activity = await TripCoreService.addActivity(tripId, userId, body)
    return jsonResponse(activity, 201)
  }
  
  // Share
  
  // POST /trips/:id/share - Enable share link
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/share$/)) {
    const tripId = path.split('/')[2]
    const options = await req.json()
    const share = await TripCoreService.enableShareLink(tripId, userId, options)
    return jsonResponse(share)
  }
  
  // Collaboration
  
  // POST /trips/:id/invite - Invite traveler
  if (method === 'POST' && path.match(/^\/trips\/[\w-]+\/invite$/)) {
    const tripId = path.split('/')[2]
    const body = await req.json()
    const invitation = await TripCollaborationService.inviteTraveler(tripId, userId, body)
    return jsonResponse(invitation, 201)
  }
  
  // POST /trips/join/:token - Join via invite
  if (method === 'POST' && path.match(/^\/trips\/join\/[\w-]+$/)) {
    const token = path.split('/')[3]
    const body = await req.json()
    const traveler = await TripCollaborationService.acceptInvitation(token, userId, body)
    return jsonResponse(traveler)
  }
  
  return new Response('Not Found', { status: 404 })
})
```

### Import Endpoints

```typescript
// supabase/functions/trip-import/index.ts

serve(async (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method
  
  // GET /import/email - Get user's import email
  if (method === 'GET' && path === '/import/email') {
    const userId = await authenticateRequest(req)
    const email = await TripImportService.getImportEmail(userId)
    return jsonResponse({ email })
  }
  
  // POST /import/email/incoming - Webhook for incoming emails
  if (method === 'POST' && path === '/import/email/incoming') {
    // Verify webhook signature from email provider
    const body = await req.json()
    const result = await TripImportService.processIncomingEmail(
      body.recipient,
      body
    )
    return jsonResponse(result)
  }
  
  // POST /import/manual - Manual entry
  if (method === 'POST' && path === '/import/manual') {
    const userId = await authenticateRequest(req)
    const body = await req.json()
    const result = await TripImportService.createManualImport(userId, body)
    return jsonResponse(result, 201)
  }
  
  // POST /import/scan - Ticket scan
  if (method === 'POST' && path === '/import/scan') {
    const userId = await authenticateRequest(req)
    const body = await req.json()
    const result = await TripImportService.processTicketScan(userId, body)
    return jsonResponse(result, 201)
  }
  
  // OAuth
  
  // GET /import/oauth/:provider - Initiate OAuth
  if (method === 'GET' && path.match(/^\/import\/oauth\/[\w]+$/)) {
    const userId = await authenticateRequest(req)
    const provider = path.split('/')[3]
    const result = await TripImportService.initiateOAuthConnection(userId, provider as OAuthProvider)
    return jsonResponse(result)
  }
  
  // GET /import/oauth/callback - OAuth callback
  if (method === 'GET' && path === '/import/oauth/callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const result = await TripImportService.handleOAuthCallback(code, state)
    // Redirect to app
    return Response.redirect(`${process.env.APP_URL}/import/success`)
  }
  
  // User review
  
  // POST /import/:id/review - Submit user review
  if (method === 'POST' && path.match(/^\/import\/[\w-]+\/review$/)) {
    const userId = await authenticateRequest(req)
    const importId = path.split('/')[2]
    const body = await req.json()
    const result = await TripImportService.submitUserReview(importId, userId, body)
    return jsonResponse(result)
  }
  
  return new Response('Not Found', { status: 404 })
})
```

---

## Scheduled Jobs

```typescript
// Trip lifecycle transitions
schedule('*/5 * * * *', async () => {
  await TripLifecycleService.processAutomaticTransitions()
})

// Sync linked travel accounts
schedule('0 */6 * * *', async () => {
  const accounts = await supabase
    .from('linked_travel_accounts')
    .select('id')
    .eq('status', 'active')
    .eq('auto_sync_enabled', true)
    .lte('next_sync_at', new Date().toISOString())
  
  for (const account of accounts.data || []) {
    try {
      await TripImportService.syncLinkedAccount(account.id)
    } catch (error) {
      console.error(`Sync failed for account ${account.id}:`, error)
    }
  }
})

// Send reminder for expired invitations
schedule('0 9 * * *', async () => {
  const pending = await supabase
    .from('trip_invitations')
    .select('*')
    .eq('status', 'pending')
    .eq('reminder_sent', false)
    .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
  
  for (const invitation of pending.data || []) {
    await TripCollaborationService.sendInvitationReminder(invitation)
  }
})

// Expire old invitations
schedule('0 0 * * *', async () => {
  await supabase
    .from('trip_invitations')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('token_expires_at', new Date().toISOString())
})
```

---

## Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create trips table
- [ ] Create trip_travelers table
- [ ] Create trip_bookings table
- [ ] Create trip_activities table
- [ ] Create trip_imports table
- [ ] Create trip_invitations table
- [ ] Create user_email_aliases table
- [ ] Create linked_travel_accounts table
- [ ] Create indexes
- [ ] Create triggers

### Phase 2: Trip Core Service (Day 2)
- [ ] CRUD operations
- [ ] Booking linking
- [ ] Activity management
- [ ] Itinerary building
- [ ] Access control

### Phase 3: Lifecycle Service (Day 3)
- [ ] State machine implementation
- [ ] Automatic transitions
- [ ] Transition side effects
- [ ] Scheduled job

### Phase 4: Import Service (Day 4-5)
- [ ] Email import setup
- [ ] Email parser (AI)
- [ ] OAuth connections
- [ ] Manual entry
- [ ] Ticket scanner (OCR)
- [ ] Import processing

### Phase 5: Collaboration Service (Day 6)
- [ ] Invitation system
- [ ] Accept/decline flow
- [ ] Traveler management
- [ ] Role permissions
- [ ] Notifications

### Phase 6: API Endpoints (Day 7)
- [ ] Trip endpoints
- [ ] Import endpoints
- [ ] Collaboration endpoints
- [ ] Error handling

### Phase 7: Testing (Day 8)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

**This Trip Planning System is the foundation upon which all Trip Hub modules are built. It's modular, enterprise-grade, and designed for a solo founder to scale.**
