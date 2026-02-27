# Document 13: Trip Hub Modules

## Purpose

This document defines the **Trip Hub Module System** — the collection of intelligent features that transform a simple trip record into a comprehensive travel companion. Each module is a self-contained feature with its own data, logic, and UI, but they all share the same trip context.

The Trip Hub is what makes Guidera sticky — once users experience having everything in one place, they can't go back to scattered apps and emails.

---

## Architecture Overview

### Module System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRIP HUB                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       MODULE ORCHESTRATOR                            │   │
│   │                                                                      │   │
│   │  Coordinates generation, refresh, and caching of all modules        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│          ┌───────────────────────────┼───────────────────────────┐          │
│          │           │               │               │           │          │
│          ▼           ▼               ▼               ▼           ▼          │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│   │   TRIP    │ │  PACKING  │ │  DO'S &   │ │  SAFETY   │ │  EXPENSE  │    │
│   │  PLANNER  │ │   LIST    │ │  DON'TS   │ │           │ │  TRACKER  │    │
│   └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│          │           │               │               │           │          │
│          ▼           ▼               ▼               ▼           ▼          │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐                                 │
│   │COMPENSATION│ │  JOURNAL  │ │ DOCUMENTS │                                 │
│   │  TRACKER  │ │           │ │  (future) │                                 │
│   └───────────┘ └───────────┘ └───────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Categories

| Module | Shared/Personal | AI Generated | Cacheable | Offline |
|--------|-----------------|--------------|-----------|---------|
| Trip Planner | Shared | Partial | No | Yes |
| Packing List | **Personal** | Yes | Partial | Yes |
| Do's & Don'ts | Shared | Yes | **Yes** | Yes |
| Safety | Shared | Yes | **Yes** | Yes |
| Expense Tracker | Shared | No | No | Yes |
| Compensation | Shared | Partial | No | Yes |
| Journal | **Personal** | No | No | Yes |

### Shared vs Personal Modules

**Shared Modules** (same for all travelers):
- Trip Planner (itinerary)
- Do's & Don'ts
- Safety
- Expense Tracker
- Compensation Tracker

**Personal Modules** (unique per traveler):
- Packing List (based on individual preferences, profession, needs)
- Journal (private memories)

---

## Database Schema

### Base Module Table

```sql
-- ============================================================================
-- TRIP_MODULES: Base table tracking all module instances
-- ============================================================================
CREATE TABLE trip_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Module identity
  module_type VARCHAR(50) NOT NULL,
  /*
    'trip_planner'
    'packing_list'
    'dos_donts'
    'safety'
    'expense_tracker'
    'compensation_tracker'
    'journal'
  */
  
  -- For personal modules, which traveler owns it
  traveler_id UUID REFERENCES trip_travelers(id) ON DELETE CASCADE,
  is_personal BOOLEAN DEFAULT FALSE,
  
  -- Generation status
  generation_status VARCHAR(20) DEFAULT 'pending',
  /*
    'pending' - Not yet generated
    'generating' - In progress
    'generated' - Complete
    'failed' - Generation failed
    'needs_refresh' - Outdated, needs regeneration
  */
  
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_error TEXT,
  
  -- Context used for generation (for debugging/regeneration)
  generation_context_hash VARCHAR(64),  -- Hash of context to detect changes
  generation_model VARCHAR(50),          -- 'claude-4.5-sonnet'
  
  -- Cache reference (for cacheable modules)
  cache_id UUID REFERENCES module_cache(id),
  is_from_cache BOOLEAN DEFAULT FALSE,
  
  -- Refresh tracking
  last_refreshed_at TIMESTAMPTZ,
  refresh_reason TEXT,
  needs_refresh BOOLEAN DEFAULT FALSE,
  refresh_triggers JSONB DEFAULT '[]',   -- What would trigger refresh
  
  -- Offline
  offline_data_generated BOOLEAN DEFAULT FALSE,
  offline_data_size_bytes BIGINT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(trip_id, module_type, traveler_id)
);

CREATE INDEX idx_trip_modules_trip ON trip_modules(trip_id);
CREATE INDEX idx_trip_modules_type ON trip_modules(module_type);
CREATE INDEX idx_trip_modules_status ON trip_modules(generation_status);
CREATE INDEX idx_trip_modules_needs_refresh ON trip_modules(needs_refresh) WHERE needs_refresh = TRUE;
```

### Module Cache Table

```sql
-- ============================================================================
-- MODULE_CACHE: Cached module content for reuse
-- ============================================================================
CREATE TABLE module_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache key components
  module_type VARCHAR(50) NOT NULL,
  destination_code VARCHAR(10) NOT NULL,
  destination_country VARCHAR(100),
  
  -- Context hash for matching
  context_hash VARCHAR(64) NOT NULL,
  /*
    Hash of relevant context fields:
    - For do's/don'ts: destination + traveler_composition + religion (if relevant)
    - For safety: destination + traveler_nationality
    - For packing: destination + season + trip_type + duration_bucket
  */
  
  -- Context details (for debugging)
  context_details JSONB NOT NULL,
  /*
    {
      "destination": "Dubai",
      "country": "UAE",
      "traveler_composition": "couple",
      "season": "summer",
      "trip_type": "leisure"
    }
  */
  
  -- Cached content
  content JSONB NOT NULL,
  content_version INTEGER DEFAULT 1,
  
  -- Quality tracking
  times_used INTEGER DEFAULT 0,
  avg_helpfulness_score DECIMAL(3,2),  -- From user feedback
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,              -- NULL = no expiry
  is_valid BOOLEAN DEFAULT TRUE,
  invalidation_reason TEXT,
  
  -- Metadata
  generated_by VARCHAR(50),             -- 'ai' or 'curated'
  reviewed_by UUID,                     -- If manually reviewed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(module_type, context_hash)
);

CREATE INDEX idx_module_cache_lookup ON module_cache(module_type, destination_code, context_hash);
CREATE INDEX idx_module_cache_valid ON module_cache(module_type, is_valid) WHERE is_valid = TRUE;
```

---

## Module 1: Trip Planner

The day-by-day itinerary with smart alerts.

### Database Schema

```sql
-- ============================================================================
-- TRIP_PLANNER_ALERTS: Smart notifications for the trip
-- ============================================================================
CREATE TABLE trip_planner_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Alert type
  alert_type VARCHAR(50) NOT NULL,
  /*
    'upcoming_activity' - "Your tour starts in 1h 32m"
    'weather_change' - "Rain expected tomorrow"
    'schedule_conflict' - "You might not make it in time"
    'booking_reminder' - "Check-out is at 11 AM"
    'travel_time' - "Leave now to arrive on time"
    'venue_closure' - "The Louvre is closed on Tuesdays"
    'local_event' - "Festival in your area today"
    'flight_status' - "Your flight is delayed"
    'custom' - User-created reminder
  */
  
  -- Alert content
  title VARCHAR(255) NOT NULL,
  message TEXT,
  icon VARCHAR(50),
  
  -- Timing
  trigger_type VARCHAR(20) NOT NULL,
  /*
    'time_based' - At specific time
    'relative' - X minutes before activity
    'condition' - When condition met (weather, flight status)
    'location' - When user at/near location
  */
  
  trigger_time TIMESTAMPTZ,              -- For time_based
  trigger_minutes_before INTEGER,        -- For relative
  trigger_condition JSONB,               -- For condition-based
  
  -- Related entities
  related_booking_id UUID,
  related_activity_id UUID,
  day_number INTEGER,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',
  /*
    'low' - Info only
    'normal' - Standard alert
    'high' - Important
    'urgent' - Requires immediate attention
  */
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  /*
    'pending' - Not yet triggered
    'triggered' - Shown to user
    'dismissed' - User dismissed
    'actioned' - User took action
    'expired' - Time passed without trigger
  */
  
  triggered_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Metadata
  is_system_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planner_alerts_trip ON trip_planner_alerts(trip_id);
CREATE INDEX idx_planner_alerts_pending ON trip_planner_alerts(trip_id, trigger_time) 
  WHERE status = 'pending';
CREATE INDEX idx_planner_alerts_day ON trip_planner_alerts(trip_id, day_number);
```

### Trip Planner Service

```typescript
// src/services/modules/trip-planner/trip-planner.service.ts

export class TripPlannerService {
  
  /**
   * Get full itinerary for trip
   */
  async getItinerary(tripId: string): Promise<TripItinerary> {
    const trip = await TripRepository.findById(tripId)
    const bookings = await TripRepository.getBookings(tripId)
    const activities = await TripRepository.getActivities(tripId)
    
    const days: ItineraryDay[] = []
    
    for (let day = 1; day <= trip.duration_days; day++) {
      const date = this.calculateDateFromDay(trip, day)
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
      
      // Get items for this day
      const dayBookings = bookings.filter(b => 
        b.start_day <= day && (b.end_day >= day || b.end_day === null)
      )
      const dayActivities = activities.filter(a => a.day_number === day)
      
      // Convert to itinerary items
      const items: ItineraryItem[] = [
        ...dayBookings.flatMap(b => this.bookingToItineraryItems(b, day, trip)),
        ...dayActivities.map(a => this.activityToItineraryItem(a))
      ]
      
      // Sort by time
      items.sort((a, b) => {
        if (!a.startTime) return 1
        if (!b.startTime) return -1
        return a.startTime.localeCompare(b.startTime)
      })
      
      // Calculate travel times between consecutive items
      for (let i = 0; i < items.length - 1; i++) {
        if (items[i].location && items[i + 1].location) {
          items[i].travelTimeToNext = await this.calculateTravelTime(
            items[i].location,
            items[i + 1].location
          )
        }
      }
      
      days.push({
        dayNumber: day,
        date,
        dayOfWeek,
        items,
        hasItems: items.length > 0,
        weather: await this.getWeatherForecast(trip.primary_destination_code, date)
      })
    }
    
    return {
      tripId,
      tripName: trip.name,
      destination: trip.primary_destination_name,
      totalDays: trip.duration_days,
      startDate: trip.start_date,
      endDate: trip.end_date,
      days
    }
  }
  
  /**
   * Get current/next alert for trip
   */
  async getCurrentAlert(tripId: string): Promise<TripAlert | null> {
    const now = new Date()
    
    // Find next pending alert
    const { data: alert } = await supabase
      .from('trip_planner_alerts')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .lte('trigger_time', new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()) // Next 2 hours
      .order('trigger_time', { ascending: true })
      .limit(1)
      .single()
    
    if (!alert) return null
    
    // Calculate time until
    const triggerTime = new Date(alert.trigger_time)
    const minutesUntil = Math.round((triggerTime.getTime() - now.getTime()) / (1000 * 60))
    
    return {
      ...alert,
      timeUntil: this.formatTimeUntil(minutesUntil)
    }
  }
  
  /**
   * Generate smart alerts for trip
   */
  async generateAlerts(tripId: string): Promise<void> {
    const trip = await TripRepository.findById(tripId)
    const itinerary = await this.getItinerary(tripId)
    
    const alerts: Partial<TripPlannerAlert>[] = []
    
    for (const day of itinerary.days) {
      for (const item of day.items) {
        // Activity reminder (1 hour before)
        if (item.startTime && item.type !== 'free_time') {
          const alertTime = new Date(`${day.date}T${item.startTime}`)
          alertTime.setHours(alertTime.getHours() - 1)
          
          alerts.push({
            trip_id: tripId,
            alert_type: 'upcoming_activity',
            title: item.title,
            message: `Your ${item.category} is in 1 hour`,
            trigger_type: 'time_based',
            trigger_time: alertTime,
            related_booking_id: item.bookingId,
            related_activity_id: item.activityId,
            day_number: day.dayNumber,
            priority: 'normal'
          })
        }
        
        // Travel time warning
        if (item.travelTimeToNext && item.travelTimeToNext > 30) {
          const nextItem = day.items[day.items.indexOf(item) + 1]
          if (nextItem?.startTime) {
            const leaveByTime = new Date(`${day.date}T${nextItem.startTime}`)
            leaveByTime.setMinutes(leaveByTime.getMinutes() - item.travelTimeToNext - 15) // 15 min buffer
            
            alerts.push({
              trip_id: tripId,
              alert_type: 'travel_time',
              title: `Leave for ${nextItem.title}`,
              message: `${item.travelTimeToNext} min travel time. Leave by ${this.formatTime(leaveByTime)}`,
              trigger_type: 'time_based',
              trigger_time: leaveByTime,
              day_number: day.dayNumber,
              priority: 'normal'
            })
          }
        }
      }
      
      // Check-out reminder
      const hotelCheckout = day.items.find(i => 
        i.type === 'hotel' && i.subType === 'checkout'
      )
      if (hotelCheckout) {
        const reminderTime = new Date(`${day.date}T${hotelCheckout.startTime}`)
        reminderTime.setHours(reminderTime.getHours() - 2)
        
        alerts.push({
          trip_id: tripId,
          alert_type: 'booking_reminder',
          title: 'Hotel Check-out',
          message: `Check-out at ${hotelCheckout.location} is at ${hotelCheckout.startTime}`,
          trigger_type: 'time_based',
          trigger_time: reminderTime,
          day_number: day.dayNumber,
          priority: 'high'
        })
      }
    }
    
    // Weather alerts
    for (const day of itinerary.days) {
      if (day.weather?.condition === 'rain' || day.weather?.condition === 'storm') {
        alerts.push({
          trip_id: tripId,
          alert_type: 'weather_change',
          title: `${day.weather.condition === 'storm' ? '⛈️ Storm' : '🌧️ Rain'} expected`,
          message: `${day.dayOfWeek} (Day ${day.dayNumber}): ${day.weather.description}`,
          trigger_type: 'time_based',
          trigger_time: new Date(new Date(day.date).setHours(7, 0, 0, 0)), // 7 AM
          day_number: day.dayNumber,
          priority: day.weather.condition === 'storm' ? 'high' : 'normal'
        })
      }
    }
    
    // Clear existing system alerts and insert new ones
    await supabase
      .from('trip_planner_alerts')
      .delete()
      .eq('trip_id', tripId)
      .eq('is_system_generated', true)
    
    await supabase
      .from('trip_planner_alerts')
      .insert(alerts)
  }
  
  /**
   * Add custom activity via bottom sheet
   */
  async addActivityBetween(
    tripId: string,
    dayNumber: number,
    afterItemId: string,
    activity: CreateActivityInput
  ): Promise<TripActivity> {
    // Get current items for the day to determine order
    const dayActivities = await TripRepository.getActivitiesByDay(tripId, dayNumber)
    
    // Find the item we're inserting after
    const afterItem = dayActivities.find(a => a.id === afterItemId)
    
    // Calculate display order
    let displayOrder: number
    if (afterItem) {
      const afterIndex = dayActivities.indexOf(afterItem)
      const nextItem = dayActivities[afterIndex + 1]
      displayOrder = nextItem 
        ? (afterItem.display_order + nextItem.display_order) / 2
        : afterItem.display_order + 1
    } else {
      displayOrder = dayActivities.length + 1
    }
    
    // Create activity
    return await TripCoreService.addActivity(tripId, activity.userId, {
      ...activity,
      dayNumber,
      displayOrder
    })
  }
  
  // Helper methods
  private bookingToItineraryItems(
    booking: TripBooking,
    day: number,
    trip: Trip
  ): ItineraryItem[] {
    const items: ItineraryItem[] = []
    
    switch (booking.category) {
      case 'flight':
        // Departure on first day
        if (booking.start_day === day) {
          items.push({
            id: `${booking.id}-dep`,
            type: 'booking',
            category: 'flight',
            subType: 'departure',
            title: `Flight to ${booking.summary_subtitle?.split(' → ')[1]}`,
            subtitle: booking.summary_title,
            startTime: this.extractTime(booking.summary_datetime),
            icon: 'airplane-departure',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.departure_airport
          })
        }
        // Arrival on last day
        if (booking.end_day === day) {
          items.push({
            id: `${booking.id}-arr`,
            type: 'booking',
            category: 'flight',
            subType: 'arrival',
            title: `Arrive at ${booking.summary_subtitle?.split(' → ')[1]}`,
            subtitle: booking.summary_title,
            startTime: this.extractTime(booking.parsed_details?.arrival_datetime),
            icon: 'airplane-arrival',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.arrival_airport
          })
        }
        break
        
      case 'hotel':
        // Check-in on first day
        if (booking.start_day === day) {
          items.push({
            id: `${booking.id}-checkin`,
            type: 'booking',
            category: 'hotel',
            subType: 'checkin',
            title: `Check in: ${booking.summary_title}`,
            subtitle: booking.summary_subtitle,
            startTime: '15:00', // Default check-in time
            icon: 'hotel',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.address
          })
        }
        // Check-out on last day
        if (booking.end_day === day) {
          items.push({
            id: `${booking.id}-checkout`,
            type: 'booking',
            category: 'hotel',
            subType: 'checkout',
            title: `Check out: ${booking.summary_title}`,
            startTime: '11:00', // Default check-out time
            icon: 'hotel',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.address
          })
        }
        break
        
      case 'car':
        // Pickup on first day
        if (booking.start_day === day) {
          items.push({
            id: `${booking.id}-pickup`,
            type: 'booking',
            category: 'car',
            subType: 'pickup',
            title: `Car Pickup: ${booking.summary_title}`,
            subtitle: booking.summary_subtitle,
            startTime: this.extractTime(booking.summary_datetime),
            icon: 'car',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.pickup_location
          })
        }
        // Return on last day
        if (booking.end_day === day) {
          items.push({
            id: `${booking.id}-return`,
            type: 'booking',
            category: 'car',
            subType: 'return',
            title: `Car Return: ${booking.summary_title}`,
            startTime: this.extractTime(booking.parsed_details?.return_datetime),
            icon: 'car',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.return_location
          })
        }
        break
        
      case 'experience':
        if (booking.start_day === day) {
          items.push({
            id: booking.id,
            type: 'booking',
            category: 'experience',
            title: booking.summary_title,
            subtitle: booking.summary_subtitle,
            startTime: this.extractTime(booking.summary_datetime),
            duration: booking.parsed_details?.duration_minutes,
            icon: 'activity',
            bookingId: booking.booking_id,
            location: booking.parsed_details?.meeting_point
          })
        }
        break
    }
    
    return items
  }
  
  private activityToItineraryItem(activity: TripActivity): ItineraryItem {
    return {
      id: activity.id,
      type: 'activity',
      category: activity.category,
      title: activity.title,
      subtitle: activity.description,
      startTime: activity.start_time,
      endTime: activity.end_time,
      duration: activity.duration_minutes,
      icon: activity.icon || this.getCategoryIcon(activity.category),
      activityId: activity.id,
      location: activity.location_name,
      notes: activity.notes,
      isAISuggested: activity.is_ai_suggested
    }
  }
}
```

---

## Module 2: Packing List

AI-generated personalized packing list with categories including Documents.

### Database Schema

```sql
-- ============================================================================
-- PACKING_LISTS: Packing list instances (personal per traveler)
-- ============================================================================
CREATE TABLE packing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES trip_travelers(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Stats
  total_items INTEGER DEFAULT 0,
  packed_items INTEGER DEFAULT 0,
  percent_complete DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_items > 0 THEN (packed_items::DECIMAL / total_items * 100) ELSE 0 END
  ) STORED,
  
  -- Generation context
  generation_context JSONB,
  /*
    {
      "destination": "Bali",
      "duration_days": 7,
      "season": "dry",
      "weather_forecast": { "avg_temp": 28, "rain_days": 2 },
      "trip_type": "leisure",
      "activities_booked": ["scuba_diving", "temple_tour"],
      "traveler_profile": {
        "gender": "female",
        "profession": "photographer",
        "religion": "muslim",
        "dietary": ["halal"],
        "medical_conditions": ["asthma"]
      }
    }
  */
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PACKING_CATEGORIES: Categories within a packing list
-- ============================================================================
CREATE TABLE packing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  -- Category type
  category_type VARCHAR(50) NOT NULL,
  /*
    'essentials' - Passport, tickets, wallet
    'documents' - Visa, insurance, vaccinations
    'clothing' - Clothes
    'toiletries' - Personal care
    'electronics' - Devices, chargers
    'health_safety' - Medicine, first aid
    'accessories' - Bags, gear
    'work' - Profession-specific
    'activity' - Activity-specific (diving gear, etc.)
    'custom' - User-added category
  */
  
  -- Stats
  total_items INTEGER DEFAULT 0,
  packed_items INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PACKING_ITEMS: Individual items to pack
-- ============================================================================
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES packing_categories(id) ON DELETE CASCADE,
  
  -- Item details
  name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  
  -- Status
  is_packed BOOLEAN DEFAULT FALSE,
  packed_at TIMESTAMPTZ,
  
  -- Source
  is_ai_suggested BOOLEAN DEFAULT TRUE,
  suggestion_reason TEXT,
  /*
    "Required for temple visit"
    "Weather: expecting rain"
    "Professional equipment"
    "Muslim prayer items"
    "Scuba diving activity"
  */
  
  -- For documents category
  document_type VARCHAR(50),
  /*
    'passport'
    'visa'
    'travel_insurance'
    'vaccination_card'
    'drivers_license'
    'booking_confirmations'
    'emergency_contacts'
    'prescriptions'
  */
  document_required BOOLEAN DEFAULT FALSE,
  document_status VARCHAR(20),  -- 'ready', 'pending', 'expired', 'not_needed'
  document_expiry DATE,
  document_notes TEXT,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packing_items_list ON packing_items(packing_list_id);
CREATE INDEX idx_packing_items_category ON packing_items(category_id);
CREATE INDEX idx_packing_items_packed ON packing_items(packing_list_id, is_packed);
```

### Packing List Service

```typescript
// src/services/modules/packing/packing.service.ts

export class PackingListService {
  
  // Default categories with icons
  static readonly CATEGORIES = [
    { type: 'essentials', name: 'Essentials', icon: '🎒', order: 1 },
    { type: 'documents', name: 'Documents', icon: '📄', order: 2 },
    { type: 'clothing', name: 'Clothing', icon: '👕', order: 3 },
    { type: 'toiletries', name: 'Toiletries', icon: '🧴', order: 4 },
    { type: 'electronics', name: 'Electronics', icon: '🔌', order: 5 },
    { type: 'health_safety', name: 'Health & Safety', icon: '💊', order: 6 },
    { type: 'accessories', name: 'Accessories', icon: '👜', order: 7 },
    { type: 'work', name: 'Work/Professional', icon: '💼', order: 8 },
    { type: 'activity', name: 'Activity Gear', icon: '🏄', order: 9 }
  ]
  
  /**
   * Generate packing list for traveler
   */
  async generatePackingList(
    tripId: string,
    travelerId: string,
    moduleId: string
  ): Promise<PackingList> {
    
    // Build context
    const context = await this.buildPackingContext(tripId, travelerId)
    
    // Check cache first
    const cached = await this.findCachedPackingList(context)
    if (cached) {
      return await this.createFromCache(tripId, travelerId, moduleId, cached)
    }
    
    // Generate via AI (Document 14)
    const generated = await AIGenerationEngine.generatePackingList(context)
    
    // Create packing list
    const packingList = await this.createPackingList(
      tripId,
      travelerId,
      moduleId,
      context,
      generated
    )
    
    // Cache for future use (partial - destination + season + trip_type)
    await this.cachePackingList(context, generated)
    
    return packingList
  }
  
  /**
   * Build context for packing list generation
   */
  private async buildPackingContext(
    tripId: string,
    travelerId: string
  ): Promise<PackingContext> {
    
    const trip = await TripRepository.findById(tripId)
    const traveler = await TripRepository.findTravelerById(travelerId)
    const user = traveler.user_id 
      ? await UserService.getUser(traveler.user_id)
      : null
    const bookings = await TripRepository.getBookings(tripId)
    
    // Get weather forecast
    const weather = await WeatherService.getForecast(
      trip.primary_destination_code,
      trip.start_date,
      trip.end_date
    )
    
    // Extract activities from bookings
    const activitiesBooked = bookings
      .filter(b => b.category === 'experience')
      .map(b => b.parsed_details?.activity_type || 'general')
    
    // Get destination info
    const destination = await DestinationService.getDestination(
      trip.primary_destination_code
    )
    
    return {
      // Destination
      destination: trip.primary_destination_name,
      country: trip.primary_destination_country,
      destinationCode: trip.primary_destination_code,
      
      // Timing
      duration_days: trip.duration_days,
      start_date: trip.start_date,
      end_date: trip.end_date,
      season: this.determineSeason(trip.start_date, destination.hemisphere),
      
      // Weather
      weather_forecast: {
        avg_temp_celsius: weather.avgTemp,
        min_temp: weather.minTemp,
        max_temp: weather.maxTemp,
        rain_days: weather.rainDays,
        conditions: weather.conditions
      },
      
      // Trip type
      trip_type: trip.trip_type,
      activities_booked: activitiesBooked,
      
      // Traveler profile
      traveler_profile: {
        gender: traveler.gender,
        age: traveler.age_at_travel,
        traveler_type: traveler.traveler_type,
        
        // From user profile
        profession: user?.profession,
        religion: user?.religion,
        dietary_restrictions: traveler.dietary_restrictions || user?.dietary_restrictions,
        medical_conditions: traveler.medical_conditions,
        accessibility_needs: traveler.accessibility_needs
      },
      
      // Destination requirements
      destination_requirements: {
        visa_required: destination.visa_required_for?.[user?.nationality],
        vaccinations_required: destination.vaccinations_required,
        vaccinations_recommended: destination.vaccinations_recommended,
        dress_code: destination.dress_code_notes,
        plug_type: destination.electrical_plug_type,
        voltage: destination.electrical_voltage
      }
    }
  }
  
  /**
   * Create packing list from generated items
   */
  private async createPackingList(
    tripId: string,
    travelerId: string,
    moduleId: string,
    context: PackingContext,
    generated: GeneratedPackingList
  ): Promise<PackingList> {
    
    // Create packing list record
    const { data: packingList } = await supabase
      .from('packing_lists')
      .insert({
        trip_id: tripId,
        traveler_id: travelerId,
        module_id: moduleId,
        generation_context: context
      })
      .select()
      .single()
    
    // Create categories
    for (const category of PackingListService.CATEGORIES) {
      const categoryItems = generated.items.filter(i => i.category === category.type)
      if (categoryItems.length === 0 && category.type !== 'documents') continue
      
      const { data: cat } = await supabase
        .from('packing_categories')
        .insert({
          packing_list_id: packingList.id,
          name: category.name,
          icon: category.icon,
          display_order: category.order,
          category_type: category.type,
          total_items: categoryItems.length
        })
        .select()
        .single()
      
      // Create items
      if (categoryItems.length > 0) {
        await supabase
          .from('packing_items')
          .insert(categoryItems.map((item, idx) => ({
            packing_list_id: packingList.id,
            category_id: cat.id,
            name: item.name,
            quantity: item.quantity || 1,
            notes: item.notes,
            is_ai_suggested: true,
            suggestion_reason: item.reason,
            document_type: item.document_type,
            document_required: item.required,
            document_status: item.document_status,
            document_expiry: item.expiry,
            display_order: idx
          })))
      }
    }
    
    // Add document items based on destination requirements
    await this.addDocumentItems(packingList.id, context)
    
    // Update total count
    const { count } = await supabase
      .from('packing_items')
      .select('*', { count: 'exact', head: true })
      .eq('packing_list_id', packingList.id)
    
    await supabase
      .from('packing_lists')
      .update({ total_items: count })
      .eq('id', packingList.id)
    
    return await this.getPackingList(packingList.id)
  }
  
  /**
   * Add document items based on requirements
   */
  private async addDocumentItems(
    packingListId: string,
    context: PackingContext
  ): Promise<void> {
    
    // Find or create documents category
    let { data: docCategory } = await supabase
      .from('packing_categories')
      .select('id')
      .eq('packing_list_id', packingListId)
      .eq('category_type', 'documents')
      .single()
    
    if (!docCategory) {
      const { data } = await supabase
        .from('packing_categories')
        .insert({
          packing_list_id: packingListId,
          name: 'Documents',
          icon: '📄',
          display_order: 2,
          category_type: 'documents'
        })
        .select()
        .single()
      docCategory = data
    }
    
    const documentItems: Partial<PackingItem>[] = []
    
    // Passport (always)
    documentItems.push({
      name: 'Passport',
      document_type: 'passport',
      document_required: true,
      suggestion_reason: 'Required for international travel',
      document_notes: 'Must be valid for 6 months after travel date'
    })
    
    // Visa (if required)
    if (context.destination_requirements?.visa_required) {
      documentItems.push({
        name: `${context.country} Visa`,
        document_type: 'visa',
        document_required: true,
        suggestion_reason: `Visa required for ${context.country}`,
        document_status: 'pending'
      })
    }
    
    // Vaccinations
    if (context.destination_requirements?.vaccinations_required?.length > 0) {
      for (const vaccine of context.destination_requirements.vaccinations_required) {
        documentItems.push({
          name: `${vaccine} Vaccination Certificate`,
          document_type: 'vaccination_card',
          document_required: true,
          suggestion_reason: `Required for entry to ${context.country}`
        })
      }
    }
    
    // Travel insurance
    documentItems.push({
      name: 'Travel Insurance Documents',
      document_type: 'travel_insurance',
      document_required: false,
      suggestion_reason: 'Recommended for all international travel'
    })
    
    // Booking confirmations
    documentItems.push({
      name: 'Flight Confirmation',
      document_type: 'booking_confirmations',
      document_required: true,
      suggestion_reason: 'Needed at airport check-in'
    })
    
    documentItems.push({
      name: 'Hotel Confirmation',
      document_type: 'booking_confirmations',
      document_required: true,
      suggestion_reason: 'Needed at hotel check-in'
    })
    
    // Driver's license (if car booked)
    const hasCarBooking = await this.tripHasCarBooking(
      (await supabase.from('packing_lists').select('trip_id').eq('id', packingListId).single()).data?.trip_id
    )
    if (hasCarBooking) {
      documentItems.push({
        name: "Driver's License",
        document_type: 'drivers_license',
        document_required: true,
        suggestion_reason: 'Required for car rental pickup'
      })
      documentItems.push({
        name: 'International Driving Permit',
        document_type: 'drivers_license',
        document_required: false,
        suggestion_reason: 'May be required in some countries'
      })
    }
    
    // Prescriptions (if medical conditions)
    if (context.traveler_profile?.medical_conditions?.length > 0) {
      documentItems.push({
        name: 'Prescription Copies',
        document_type: 'prescriptions',
        document_required: true,
        suggestion_reason: 'Required for carrying medications across borders'
      })
    }
    
    // Emergency contacts
    documentItems.push({
      name: 'Emergency Contact Card',
      document_type: 'emergency_contacts',
      document_required: false,
      suggestion_reason: 'Useful in case of emergency'
    })
    
    // Insert all document items
    await supabase
      .from('packing_items')
      .insert(documentItems.map((item, idx) => ({
        packing_list_id: packingListId,
        category_id: docCategory.id,
        is_ai_suggested: true,
        display_order: idx,
        ...item
      })))
    
    // Update category count
    await supabase
      .from('packing_categories')
      .update({ total_items: documentItems.length })
      .eq('id', docCategory.id)
  }
  
  /**
   * Toggle item packed status
   */
  async toggleItemPacked(
    itemId: string,
    isPacked: boolean
  ): Promise<void> {
    
    await supabase
      .from('packing_items')
      .update({
        is_packed: isPacked,
        packed_at: isPacked ? new Date() : null
      })
      .eq('id', itemId)
    
    // Update category and list counts
    const { data: item } = await supabase
      .from('packing_items')
      .select('packing_list_id, category_id')
      .eq('id', itemId)
      .single()
    
    // Update category packed count
    const { count: categoryPacked } = await supabase
      .from('packing_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', item.category_id)
      .eq('is_packed', true)
    
    await supabase
      .from('packing_categories')
      .update({ packed_items: categoryPacked })
      .eq('id', item.category_id)
    
    // Update list packed count
    const { count: listPacked } = await supabase
      .from('packing_items')
      .select('*', { count: 'exact', head: true })
      .eq('packing_list_id', item.packing_list_id)
      .eq('is_packed', true)
    
    await supabase
      .from('packing_lists')
      .update({ packed_items: listPacked })
      .eq('id', item.packing_list_id)
  }
  
  /**
   * Add custom item
   */
  async addItem(
    packingListId: string,
    categoryId: string,
    item: AddPackingItemInput
  ): Promise<PackingItem> {
    
    const { data } = await supabase
      .from('packing_items')
      .insert({
        packing_list_id: packingListId,
        category_id: categoryId,
        name: item.name,
        quantity: item.quantity || 1,
        notes: item.notes,
        is_ai_suggested: false
      })
      .select()
      .single()
    
    // Update counts
    await this.updateCategoryCounts(categoryId)
    await this.updateListCounts(packingListId)
    
    return data
  }
  
  /**
   * Get packing list with all categories and items
   */
  async getPackingList(packingListId: string): Promise<PackingListWithItems> {
    const { data: packingList } = await supabase
      .from('packing_lists')
      .select(`
        *,
        categories:packing_categories(
          *,
          items:packing_items(*)
        )
      `)
      .eq('id', packingListId)
      .single()
    
    // Sort categories and items
    packingList.categories.sort((a, b) => a.display_order - b.display_order)
    for (const cat of packingList.categories) {
      cat.items.sort((a, b) => a.display_order - b.display_order)
    }
    
    return packingList
  }
}
```

---

## Module 3: Do's & Don'ts

Cultural, food, safety, and behavioral guidance with extensive categories.

### Database Schema

```sql
-- ============================================================================
-- DOS_DONTS_MODULES: Do's and Don'ts module instances
-- ============================================================================
CREATE TABLE dos_donts_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Destination
  destination_code VARCHAR(10) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  
  -- Stats
  total_dos INTEGER DEFAULT 0,
  total_donts INTEGER DEFAULT 0,
  
  -- Generation context
  generation_context JSONB,
  
  -- Cache reference
  cache_id UUID REFERENCES module_cache(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOS_DONTS_ITEMS: Individual do's and don'ts
-- ============================================================================
CREATE TABLE dos_donts_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dos_donts_module_id UUID NOT NULL REFERENCES dos_donts_modules(id) ON DELETE CASCADE,
  
  -- Type
  item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('do', 'dont')),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Category
  category VARCHAR(50) NOT NULL,
  /*
    'cultural' - General cultural norms
    'food' - Food and dining etiquette
    'safety' - Safety considerations
    'dress' - Dress code
    'transportation' - Getting around
    'language' - Language and communication
    'photo' - Photography rules
    'religion' - Religious considerations
    'tipping' - Tipping customs
    'business' - Business etiquette
    'taboo' - Taboo topics/behaviors
    'lgbtq' - LGBTQ+ considerations
    'alcohol' - Alcohol rules
    'gesture' - Gestures and body language
    'greeting' - Greetings and introductions
    'shopping' - Shopping and bargaining
    'health' - Health considerations
    'emergency' - Emergency procedures
  */
  
  -- Severity/Importance
  severity VARCHAR(20) NOT NULL DEFAULT 'important',
  /*
    'critical' - Legal/safety issue, must follow
    'important' - Strong recommendation
    'helpful' - Nice to know
    'optional' - Minor consideration
  */
  
  -- Personalization
  applies_to JSONB DEFAULT '["all"]',
  /*
    ["all"] - Applies to everyone
    ["couple"] - Specific to couples
    ["lgbtq"] - Specific to LGBTQ+ travelers
    ["women"] - Specific to women
    ["muslim", "jewish"] - Specific religions
    ["business"] - Business travelers
  */
  
  -- User feedback
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  
  -- Source
  is_ai_generated BOOLEAN DEFAULT TRUE,
  source VARCHAR(255),  -- If from official source
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dos_donts_items_module ON dos_donts_items(dos_donts_module_id);
CREATE INDEX idx_dos_donts_items_category ON dos_donts_items(dos_donts_module_id, category);
CREATE INDEX idx_dos_donts_items_type ON dos_donts_items(dos_donts_module_id, item_type);
```

### Do's & Don'ts Service

```typescript
// src/services/modules/dos-donts/dos-donts.service.ts

export class DosDontsService {
  
  // All categories
  static readonly CATEGORIES = [
    { id: 'cultural', name: 'Cultural', icon: '🏛️' },
    { id: 'food', name: 'Food', icon: '🍽️' },
    { id: 'safety', name: 'Safety', icon: '🛡️' },
    { id: 'dress', name: 'Dress', icon: '👔' },
    { id: 'transportation', name: 'Transportation', icon: '🚗' },
    { id: 'language', name: 'Language', icon: '💬' },
    { id: 'photo', name: 'Photo', icon: '📷' },
    { id: 'religion', name: 'Religion', icon: '🙏' },
    { id: 'tipping', name: 'Tipping', icon: '💵' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'taboo', name: 'Taboo', icon: '🚫' },
    { id: 'lgbtq', name: 'LGBTQ+', icon: '🏳️‍🌈' },
    { id: 'alcohol', name: 'Alcohol', icon: '🍺' },
    { id: 'gesture', name: 'Gesture', icon: '👋' },
    { id: 'greeting', name: 'Greeting', icon: '🤝' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'emergency', name: 'Emergency', icon: '🚨' }
  ]
  
  /**
   * Generate do's and don'ts for trip
   */
  async generateDosDonts(
    tripId: string,
    moduleId: string
  ): Promise<DosDontsModule> {
    
    const trip = await TripRepository.findById(tripId)
    const travelers = await TripRepository.getTravelers(tripId)
    
    // Build context
    const context = await this.buildDosDontsContext(trip, travelers)
    
    // Check cache
    const contextHash = this.hashContext(context)
    const cached = await this.findCached(
      'dos_donts',
      trip.primary_destination_code,
      contextHash
    )
    
    if (cached && cached.is_valid) {
      // Use cached content
      return await this.createFromCache(tripId, moduleId, cached)
    }
    
    // Generate via AI (Document 14)
    const generated = await AIGenerationEngine.generateDosDonts(context)
    
    // Create module
    const module = await this.createDosDontsModule(
      tripId,
      moduleId,
      context,
      generated
    )
    
    // Cache for future users
    await this.cacheContent(
      'dos_donts',
      trip.primary_destination_code,
      contextHash,
      context,
      generated
    )
    
    return module
  }
  
  /**
   * Build context for generation
   */
  private async buildDosDontsContext(
    trip: Trip,
    travelers: TripTraveler[]
  ): Promise<DosDontsContext> {
    
    const destination = await DestinationService.getDestination(
      trip.primary_destination_code
    )
    
    // Determine traveler characteristics that affect advice
    const travelerCharacteristics = {
      compositions: [trip.traveler_composition],
      religions: [...new Set(travelers.map(t => t.religion).filter(Boolean))],
      genders: [...new Set(travelers.map(t => t.gender).filter(Boolean))],
      hasChildren: travelers.some(t => t.traveler_type === 'child'),
      tripType: trip.trip_type
    }
    
    return {
      destination: {
        name: trip.primary_destination_name,
        country: trip.primary_destination_country,
        code: trip.primary_destination_code,
        region: destination.region,
        predominantReligion: destination.predominant_religion,
        governmentType: destination.government_type,
        languages: destination.languages
      },
      travelers: travelerCharacteristics,
      tripType: trip.trip_type,
      duration: trip.duration_days
    }
  }
  
  /**
   * Create do's and don'ts module from generated content
   */
  private async createDosDontsModule(
    tripId: string,
    moduleId: string,
    context: DosDontsContext,
    generated: GeneratedDosDonts
  ): Promise<DosDontsModule> {
    
    const trip = await TripRepository.findById(tripId)
    
    // Create module record
    const { data: module } = await supabase
      .from('dos_donts_modules')
      .insert({
        trip_id: tripId,
        module_id: moduleId,
        destination_code: trip.primary_destination_code,
        destination_name: trip.primary_destination_name,
        country: trip.primary_destination_country,
        total_dos: generated.items.filter(i => i.type === 'do').length,
        total_donts: generated.items.filter(i => i.type === 'dont').length,
        generation_context: context
      })
      .select()
      .single()
    
    // Insert items
    await supabase
      .from('dos_donts_items')
      .insert(generated.items.map((item, idx) => ({
        dos_donts_module_id: module.id,
        item_type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        severity: item.severity,
        applies_to: item.appliesTo || ['all'],
        display_order: idx,
        icon: item.icon
      })))
    
    return await this.getDosDonts(module.id)
  }
  
  /**
   * Get do's and don'ts with filtering
   */
  async getDosDonts(
    moduleId: string,
    filters?: DosDontsFilters
  ): Promise<DosDontsWithItems> {
    
    let query = supabase
      .from('dos_donts_items')
      .select('*')
      .eq('dos_donts_module_id', moduleId)
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    
    if (filters?.type) {
      query = query.eq('item_type', filters.type)
    }
    
    if (filters?.severity) {
      query = query.eq('severity', filters.severity)
    }
    
    const { data: items } = await query.order('display_order')
    
    const { data: module } = await supabase
      .from('dos_donts_modules')
      .select('*')
      .eq('id', moduleId)
      .single()
    
    // Group by category
    const byCategory: Record<string, DosDontsItem[]> = {}
    for (const item of items) {
      if (!byCategory[item.category]) {
        byCategory[item.category] = []
      }
      byCategory[item.category].push(item)
    }
    
    return {
      ...module,
      items,
      byCategory,
      categories: DosDontsService.CATEGORIES.filter(c => byCategory[c.id]?.length > 0)
    }
  }
  
  /**
   * Record user feedback
   */
  async recordFeedback(
    itemId: string,
    isHelpful: boolean
  ): Promise<void> {
    
    const field = isHelpful ? 'helpful_count' : 'not_helpful_count'
    
    await supabase
      .from('dos_donts_items')
      .update({
        [field]: supabase.sql`${field} + 1`
      })
      .eq('id', itemId)
    
    // If many "not helpful", flag for review
    const { data: item } = await supabase
      .from('dos_donts_items')
      .select('helpful_count, not_helpful_count')
      .eq('id', itemId)
      .single()
    
    const total = item.helpful_count + item.not_helpful_count
    const helpfulRate = item.helpful_count / total
    
    if (total >= 10 && helpfulRate < 0.5) {
      // Flag cache for review
      await this.flagCacheForReview(itemId)
    }
  }
  
  /**
   * Hash context for cache lookup
   */
  private hashContext(context: DosDontsContext): string {
    // Hash relevant fields for matching
    const hashInput = {
      destination: context.destination.code,
      composition: context.travelers.compositions.sort().join(','),
      tripType: context.tripType
      // Note: religions and other personal details are NOT in hash
      // This allows caching at destination+composition level
    }
    return crypto.createHash('sha256').update(JSON.stringify(hashInput)).digest('hex')
  }
}
```

---

## Module 4: Safety

Safety score, emergency contacts, alerts, and travel advisories.

### Database Schema

```sql
-- ============================================================================
-- SAFETY_MODULES: Safety information module instances
-- ============================================================================
CREATE TABLE safety_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Destination
  destination_code VARCHAR(10) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  
  -- Safety score (aggregated)
  safety_score INTEGER,  -- 0-100
  safety_level VARCHAR(20),
  /*
    'safe' - 85-100
    'moderate_caution' - 70-84
    'exercise_caution' - 50-69
    'high_risk' - 30-49
    'dangerous' - 0-29
  */
  
  -- Score components
  score_breakdown JSONB,
  /*
    {
      "crime": 85,
      "terrorism": 90,
      "natural_disasters": 75,
      "health": 80,
      "infrastructure": 85,
      "political_stability": 88
    }
  */
  
  -- Data sources
  data_sources JSONB DEFAULT '[]',
  /*
    [
      { "name": "US State Department", "last_updated": "2025-01-15" },
      { "name": "UK FCO", "last_updated": "2025-01-14" },
      { "name": "WHO", "last_updated": "2025-01-10" }
    ]
  */
  
  -- Traveler-specific (embassy based on nationality)
  traveler_nationality VARCHAR(3),
  
  -- Cache reference
  cache_id UUID REFERENCES module_cache(id),
  
  -- Last refresh
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SAFETY_EMERGENCY_CONTACTS: Emergency contact numbers
-- ============================================================================
CREATE TABLE safety_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_module_id UUID NOT NULL REFERENCES safety_modules(id) ON DELETE CASCADE,
  
  -- Contact details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phone_number VARCHAR(50) NOT NULL,
  
  -- Type
  contact_type VARCHAR(50) NOT NULL,
  /*
    'police'
    'ambulance'
    'fire'
    'embassy'
    'tourist_police'
    'coast_guard'
    'poison_control'
    'women_helpline'
    'custom'
  */
  
  -- Display
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  -- Tap to call
  is_tap_to_call BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SAFETY_BEFORE_YOU_GO: Pre-trip safety information
-- ============================================================================
CREATE TABLE safety_before_you_go (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_module_id UUID NOT NULL REFERENCES safety_modules(id) ON DELETE CASCADE,
  
  -- Type
  item_type VARCHAR(50) NOT NULL,
  /*
    'visa_requirement'
    'vaccination_required'
    'vaccination_recommended'
    'health_warning'
    'travel_insurance'
    'registration'  -- Register with embassy
    'document_required'
    'currency_tip'
    'custom'
  */
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status tracking
  is_actionable BOOLEAN DEFAULT TRUE,
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- User can mark complete
  is_completable BOOLEAN DEFAULT TRUE,
  
  -- Display
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SAFETY_DURING_TRIP: Safety tips during the trip
-- ============================================================================
CREATE TABLE safety_during_trip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_module_id UUID NOT NULL REFERENCES safety_modules(id) ON DELETE CASCADE,
  
  -- Type
  tip_type VARCHAR(50) NOT NULL,
  /*
    'general'
    'scam_awareness'
    'area_warning'
    'transport_safety'
    'health_tip'
    'emergency_procedure'
  */
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Severity
  severity VARCHAR(20) DEFAULT 'info',
  /*
    'info' - Good to know
    'warning' - Be aware
    'danger' - Serious concern
  */
  
  -- Display
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SAFETY_ALERTS: Real-time safety alerts
-- ============================================================================
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_module_id UUID NOT NULL REFERENCES safety_modules(id) ON DELETE CASCADE,
  
  -- Alert details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Type and severity
  alert_type VARCHAR(50) NOT NULL,
  /*
    'travel_advisory'
    'weather_warning'
    'health_alert'
    'security_incident'
    'natural_disaster'
    'political_unrest'
    'transportation_disruption'
    'custom'
  */
  
  severity VARCHAR(20) NOT NULL,
  /*
    'info'
    'warning'
    'critical'
  */
  
  -- Source
  source VARCHAR(255),
  source_url TEXT,
  
  -- Timing
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- User interaction
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_alerts_active ON safety_alerts(safety_module_id, is_active) 
  WHERE is_active = TRUE;
```

### Safety Service

```typescript
// src/services/modules/safety/safety.service.ts

export class SafetyService {
  
  /**
   * Generate safety module for trip
   */
  async generateSafetyModule(
    tripId: string,
    moduleId: string
  ): Promise<SafetyModule> {
    
    const trip = await TripRepository.findById(tripId)
    const owner = await TripRepository.getTripOwner(tripId)
    
    // Get destination safety data from multiple sources
    const safetyData = await this.aggregateSafetyData(
      trip.primary_destination_code,
      trip.primary_destination_country
    )
    
    // Calculate safety score
    const { score, level, breakdown } = this.calculateSafetyScore(safetyData)
    
    // Get embassy info based on traveler nationality
    const embassy = await this.getEmbassyInfo(
      trip.primary_destination_country,
      owner.nationality || 'US'
    )
    
    // Create safety module
    const { data: module } = await supabase
      .from('safety_modules')
      .insert({
        trip_id: tripId,
        module_id: moduleId,
        destination_code: trip.primary_destination_code,
        destination_name: trip.primary_destination_name,
        country: trip.primary_destination_country,
        safety_score: score,
        safety_level: level,
        score_breakdown: breakdown,
        data_sources: safetyData.sources,
        traveler_nationality: owner.nationality
      })
      .select()
      .single()
    
    // Add emergency contacts
    await this.addEmergencyContacts(module.id, safetyData, embassy)
    
    // Add before you go items
    await this.addBeforeYouGoItems(module.id, trip, owner)
    
    // Add during trip tips
    await this.addDuringTripTips(module.id, safetyData)
    
    // Check for current alerts
    await this.checkAndAddAlerts(module.id, trip.primary_destination_country)
    
    return await this.getSafetyModule(module.id)
  }
  
  /**
   * Aggregate safety data from multiple sources
   */
  private async aggregateSafetyData(
    destinationCode: string,
    country: string
  ): Promise<AggregatedSafetyData> {
    
    const sources: SafetyDataSource[] = []
    
    // US State Department
    const stateDept = await this.fetchStateDepartmentData(country)
    if (stateDept) {
      sources.push({
        name: 'US State Department',
        data: stateDept,
        last_updated: stateDept.lastUpdated
      })
    }
    
    // UK FCO
    const fco = await this.fetchFCOData(country)
    if (fco) {
      sources.push({
        name: 'UK FCO',
        data: fco,
        last_updated: fco.lastUpdated
      })
    }
    
    // WHO (health data)
    const who = await this.fetchWHOData(country)
    if (who) {
      sources.push({
        name: 'WHO',
        data: who,
        last_updated: who.lastUpdated
      })
    }
    
    // Local emergency numbers database
    const emergencyNumbers = await this.getEmergencyNumbers(country)
    
    return {
      sources,
      emergencyNumbers,
      travelAdvisoryLevel: this.determineTravelAdvisoryLevel(sources),
      healthRisks: this.extractHealthRisks(sources),
      securityConcerns: this.extractSecurityConcerns(sources),
      areasToAvoid: this.extractAreasToAvoid(sources)
    }
  }
  
  /**
   * Calculate safety score from aggregated data
   */
  private calculateSafetyScore(
    data: AggregatedSafetyData
  ): { score: number; level: string; breakdown: Record<string, number> } {
    
    const breakdown: Record<string, number> = {}
    
    // Crime score (from State Dept and FCO)
    breakdown.crime = this.calculateCrimeScore(data)
    
    // Terrorism score
    breakdown.terrorism = this.calculateTerrorismScore(data)
    
    // Natural disasters
    breakdown.natural_disasters = this.calculateNaturalDisasterScore(data)
    
    // Health
    breakdown.health = this.calculateHealthScore(data)
    
    // Infrastructure (medical, roads, etc.)
    breakdown.infrastructure = this.calculateInfrastructureScore(data)
    
    // Political stability
    breakdown.political_stability = this.calculatePoliticalStabilityScore(data)
    
    // Weighted average
    const weights = {
      crime: 0.25,
      terrorism: 0.15,
      natural_disasters: 0.10,
      health: 0.20,
      infrastructure: 0.15,
      political_stability: 0.15
    }
    
    const score = Math.round(
      Object.entries(breakdown).reduce((sum, [key, value]) => {
        return sum + value * weights[key]
      }, 0)
    )
    
    // Determine level
    let level: string
    if (score >= 85) level = 'safe'
    else if (score >= 70) level = 'moderate_caution'
    else if (score >= 50) level = 'exercise_caution'
    else if (score >= 30) level = 'high_risk'
    else level = 'dangerous'
    
    return { score, level, breakdown }
  }
  
  /**
   * Add emergency contacts
   */
  private async addEmergencyContacts(
    moduleId: string,
    safetyData: AggregatedSafetyData,
    embassy: EmbassyInfo
  ): Promise<void> {
    
    const contacts: Partial<SafetyEmergencyContact>[] = []
    
    // Emergency numbers
    if (safetyData.emergencyNumbers.police) {
      contacts.push({
        name: 'Police',
        description: 'Emergency police assistance',
        phone_number: safetyData.emergencyNumbers.police,
        contact_type: 'police',
        icon: '🚔',
        display_order: 1
      })
    }
    
    if (safetyData.emergencyNumbers.ambulance) {
      contacts.push({
        name: 'Ambulance',
        description: 'Medical emergency services',
        phone_number: safetyData.emergencyNumbers.ambulance,
        contact_type: 'ambulance',
        icon: '🚑',
        display_order: 2
      })
    }
    
    if (safetyData.emergencyNumbers.fire) {
      contacts.push({
        name: 'Fire Department',
        description: 'Fire and rescue services',
        phone_number: safetyData.emergencyNumbers.fire,
        contact_type: 'fire',
        icon: '🚒',
        display_order: 3
      })
    }
    
    // Tourist police (if available)
    if (safetyData.emergencyNumbers.touristPolice) {
      contacts.push({
        name: 'Tourist Police',
        description: 'Police for tourists',
        phone_number: safetyData.emergencyNumbers.touristPolice,
        contact_type: 'tourist_police',
        icon: '👮',
        display_order: 4
      })
    }
    
    // Embassy
    if (embassy) {
      contacts.push({
        name: embassy.name,
        description: embassy.services,
        phone_number: embassy.phone,
        contact_type: 'embassy',
        icon: '🏛️',
        display_order: 10
      })
    }
    
    await supabase
      .from('safety_emergency_contacts')
      .insert(contacts.map(c => ({
        safety_module_id: moduleId,
        ...c
      })))
  }
  
  /**
   * Add before you go items
   */
  private async addBeforeYouGoItems(
    moduleId: string,
    trip: Trip,
    owner: TripTraveler
  ): Promise<void> {
    
    const destination = await DestinationService.getDestination(trip.primary_destination_code)
    const items: Partial<SafetyBeforeYouGo>[] = []
    
    // Visa requirement
    const visaRequired = destination.visa_required_for?.[owner.nationality]
    items.push({
      item_type: 'visa_requirement',
      title: visaRequired ? 'Visa Required' : 'Visa Not Required',
      description: visaRequired 
        ? `A visa is required for ${owner.nationality} citizens visiting ${destination.country}`
        : `${owner.nationality} citizens can visit ${destination.country} visa-free for up to ${destination.visa_free_days || 30} days`,
      is_actionable: visaRequired,
      action_url: destination.visa_application_url,
      action_label: 'Apply for Visa',
      icon: '📋',
      display_order: 1
    })
    
    // Required vaccinations
    if (destination.vaccinations_required?.length > 0) {
      for (const vaccine of destination.vaccinations_required) {
        items.push({
          item_type: 'vaccination_required',
          title: `${vaccine} Vaccination Required`,
          description: `Proof of ${vaccine} vaccination is required for entry`,
          is_actionable: true,
          action_label: 'Find Vaccination Center',
          icon: '💉',
          display_order: 2
        })
      }
    }
    
    // Recommended vaccinations
    if (destination.vaccinations_recommended?.length > 0) {
      items.push({
        item_type: 'vaccination_recommended',
        title: 'Recommended Vaccinations',
        description: `Consider: ${destination.vaccinations_recommended.join(', ')}`,
        is_actionable: false,
        icon: '💉',
        display_order: 3
      })
    }
    
    // Travel insurance
    items.push({
      item_type: 'travel_insurance',
      title: 'Travel Insurance',
      description: 'Recommended to cover medical emergencies, trip cancellation, and lost belongings',
      is_actionable: true,
      action_label: 'Get Quote',
      icon: '🛡️',
      display_order: 4
    })
    
    // Embassy registration
    items.push({
      item_type: 'registration',
      title: 'Register with Embassy',
      description: `Register your trip with the ${owner.nationality} embassy for emergency assistance`,
      is_actionable: true,
      action_url: this.getEmbassyRegistrationUrl(owner.nationality),
      action_label: 'Register Trip',
      icon: '🏛️',
      display_order: 5
    })
    
    await supabase
      .from('safety_before_you_go')
      .insert(items.map(i => ({
        safety_module_id: moduleId,
        ...i
      })))
  }
  
  /**
   * Check for and add current alerts
   */
  async checkAndAddAlerts(
    moduleId: string,
    country: string
  ): Promise<void> {
    
    // Fetch current travel advisories
    const advisories = await this.fetchCurrentAdvisories(country)
    
    // Fetch weather warnings
    const weatherAlerts = await this.fetchWeatherAlerts(country)
    
    // Fetch health alerts
    const healthAlerts = await this.fetchHealthAlerts(country)
    
    const alerts: Partial<SafetyAlert>[] = []
    
    for (const advisory of advisories) {
      alerts.push({
        title: advisory.title,
        description: advisory.description,
        alert_type: 'travel_advisory',
        severity: this.mapAdvisorySeverity(advisory.level),
        source: advisory.source,
        source_url: advisory.url,
        issued_at: advisory.issuedAt,
        expires_at: advisory.expiresAt
      })
    }
    
    for (const weather of weatherAlerts) {
      alerts.push({
        title: weather.title,
        description: weather.description,
        alert_type: 'weather_warning',
        severity: weather.severity,
        source: weather.source,
        issued_at: weather.issuedAt,
        expires_at: weather.expiresAt
      })
    }
    
    if (alerts.length > 0) {
      await supabase
        .from('safety_alerts')
        .insert(alerts.map(a => ({
          safety_module_id: moduleId,
          ...a
        })))
    }
  }
  
  /**
   * Refresh alerts (scheduled job)
   */
  async refreshAlerts(moduleId: string): Promise<void> {
    const { data: module } = await supabase
      .from('safety_modules')
      .select('country')
      .eq('id', moduleId)
      .single()
    
    // Mark old alerts as inactive
    await supabase
      .from('safety_alerts')
      .update({ is_active: false })
      .eq('safety_module_id', moduleId)
      .lt('expires_at', new Date().toISOString())
    
    // Check for new alerts
    await this.checkAndAddAlerts(moduleId, module.country)
  }
  
  /**
   * Get full safety module with all data
   */
  async getSafetyModule(
    moduleId: string,
    tab?: 'before' | 'during' | 'alerts'
  ): Promise<SafetyModuleWithData> {
    
    const { data: module } = await supabase
      .from('safety_modules')
      .select('*')
      .eq('id', moduleId)
      .single()
    
    const { data: contacts } = await supabase
      .from('safety_emergency_contacts')
      .select('*')
      .eq('safety_module_id', moduleId)
      .order('display_order')
    
    const { data: beforeYouGo } = await supabase
      .from('safety_before_you_go')
      .select('*')
      .eq('safety_module_id', moduleId)
      .order('display_order')
    
    const { data: duringTrip } = await supabase
      .from('safety_during_trip')
      .select('*')
      .eq('safety_module_id', moduleId)
      .order('display_order')
    
    const { data: alerts } = await supabase
      .from('safety_alerts')
      .select('*')
      .eq('safety_module_id', moduleId)
      .eq('is_active', true)
      .order('severity', { ascending: false })
    
    return {
      ...module,
      emergencyContacts: contacts,
      beforeYouGo,
      duringTrip,
      alerts,
      activeAlertsCount: alerts.filter(a => !a.is_acknowledged).length
    }
  }
  
  /**
   * Trigger Emergency SOS
   */
  async triggerSOS(
    tripId: string,
    userId: string,
    location?: { lat: number; lng: number }
  ): Promise<SOSResponse> {
    
    const trip = await TripRepository.findById(tripId)
    const user = await UserService.getUser(userId)
    const safetyModule = await this.getSafetyModuleByTrip(tripId)
    
    // Log SOS event
    await supabase.from('sos_events').insert({
      trip_id: tripId,
      user_id: userId,
      location,
      triggered_at: new Date()
    })
    
    // Send alert to emergency contacts (user's personal contacts)
    const emergencyContacts = await UserService.getEmergencyContacts(userId)
    for (const contact of emergencyContacts) {
      await NotificationService.sendSOS(contact, {
        userName: `${user.first_name} ${user.last_name}`,
        location: trip.primary_destination_name,
        coordinates: location
      })
    }
    
    // Get local emergency number
    const policeContact = safetyModule.emergencyContacts.find(
      c => c.contact_type === 'police'
    )
    
    return {
      success: true,
      message: 'SOS sent to your emergency contacts',
      localEmergencyNumber: policeContact?.phone_number,
      embassyNumber: safetyModule.emergencyContacts.find(
        c => c.contact_type === 'embassy'
      )?.phone_number
    }
  }
}
```

---

## Module 5: Expense Tracker

Track spending during the trip.

### Database Schema

```sql
-- ============================================================================
-- EXPENSE_TRACKERS: Expense tracking module instances
-- ============================================================================
CREATE TABLE expense_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Budget
  budget_total DECIMAL(12,2),
  budget_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Totals
  total_spent DECIMAL(12,2) DEFAULT 0,
  total_spent_local DECIMAL(12,2) DEFAULT 0,  -- In destination currency
  
  -- Currency
  destination_currency VARCHAR(3),
  exchange_rate DECIMAL(10,6),                -- 1 USD = X destination currency
  exchange_rate_updated_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXPENSES: Individual expense entries
-- ============================================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_tracker_id UUID NOT NULL REFERENCES expense_trackers(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Who paid
  paid_by UUID REFERENCES trip_travelers(id),
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount_in_base_currency DECIMAL(12,2),       -- Converted to trip currency
  exchange_rate_used DECIMAL(10,6),
  
  -- Category
  category VARCHAR(50) NOT NULL,
  /*
    'food' - Restaurants, groceries
    'transport' - Taxi, transit, fuel
    'accommodation' - Additional hotel costs
    'activities' - Attractions, tours
    'shopping' - Souvenirs, clothes
    'entertainment' - Nightlife, shows
    'health' - Pharmacy, medical
    'communication' - SIM, wifi
    'tips' - Tips and gratuities
    'other' - Miscellaneous
  */
  
  -- Details
  description VARCHAR(255),
  notes TEXT,
  merchant_name VARCHAR(255),
  
  -- Location
  location_name VARCHAR(255),
  location_coordinates POINT,
  
  -- Receipt
  receipt_url TEXT,
  
  -- Date
  expense_date DATE NOT NULL,
  expense_time TIME,
  day_number INTEGER,
  
  -- Split (for group trips)
  is_split BOOLEAN DEFAULT FALSE,
  split_between UUID[],                        -- Array of traveler IDs
  split_amount DECIMAL(12,2),                  -- Amount per person
  
  -- Source
  source VARCHAR(20) DEFAULT 'manual',
  /*
    'manual' - User entered
    'receipt_scan' - OCR from receipt
    'bank_import' - From linked bank
  */
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_tracker ON expenses(expense_tracker_id);
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(trip_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(expense_tracker_id, category);
```

### Expense Tracker Service

```typescript
// src/services/modules/expenses/expense-tracker.service.ts

export class ExpenseTrackerService {
  
  static readonly CATEGORIES = [
    { id: 'food', name: 'Food & Drinks', icon: '🍽️', color: '#FF6B6B' },
    { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4' },
    { id: 'accommodation', name: 'Accommodation', icon: '🏨', color: '#45B7D1' },
    { id: 'activities', name: 'Activities', icon: '🎫', color: '#96CEB4' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FFEAA7' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭', color: '#DDA0DD' },
    { id: 'health', name: 'Health', icon: '💊', color: '#98D8C8' },
    { id: 'communication', name: 'Communication', icon: '📱', color: '#F7DC6F' },
    { id: 'tips', name: 'Tips', icon: '💵', color: '#82E0AA' },
    { id: 'other', name: 'Other', icon: '📦', color: '#AEB6BF' }
  ]
  
  /**
   * Initialize expense tracker for trip
   */
  async initializeTracker(
    tripId: string,
    moduleId: string
  ): Promise<ExpenseTracker> {
    
    const trip = await TripRepository.findById(tripId)
    const destination = await DestinationService.getDestination(trip.primary_destination_code)
    
    // Get current exchange rate
    const exchangeRate = await CurrencyService.getExchangeRate(
      trip.budget_currency || 'USD',
      destination.currency
    )
    
    const { data: tracker } = await supabase
      .from('expense_trackers')
      .insert({
        trip_id: tripId,
        module_id: moduleId,
        budget_total: trip.budget_total,
        budget_currency: trip.budget_currency || 'USD',
        destination_currency: destination.currency,
        exchange_rate: exchangeRate.rate,
        exchange_rate_updated_at: new Date()
      })
      .select()
      .single()
    
    return tracker
  }
  
  /**
   * Add expense
   */
  async addExpense(
    trackerId: string,
    expense: AddExpenseInput
  ): Promise<Expense> {
    
    const tracker = await supabase
      .from('expense_trackers')
      .select('*, trips(*)')
      .eq('id', trackerId)
      .single()
    
    // Convert to base currency if needed
    let amountInBase = expense.amount
    let exchangeRateUsed = 1
    
    if (expense.currency !== tracker.data.budget_currency) {
      const rate = await CurrencyService.getExchangeRate(
        expense.currency,
        tracker.data.budget_currency
      )
      amountInBase = expense.amount * rate.rate
      exchangeRateUsed = rate.rate
    }
    
    // Calculate day number
    const tripStart = new Date(tracker.data.trips.start_date)
    const expenseDate = new Date(expense.date)
    const dayNumber = Math.ceil(
      (expenseDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    
    // Calculate split amount if splitting
    let splitAmount: number | undefined
    if (expense.splitBetween && expense.splitBetween.length > 0) {
      splitAmount = amountInBase / expense.splitBetween.length
    }
    
    const { data: created } = await supabase
      .from('expenses')
      .insert({
        expense_tracker_id: trackerId,
        trip_id: tracker.data.trip_id,
        paid_by: expense.paidBy,
        amount: expense.amount,
        currency: expense.currency,
        amount_in_base_currency: amountInBase,
        exchange_rate_used: exchangeRateUsed,
        category: expense.category,
        description: expense.description,
        notes: expense.notes,
        merchant_name: expense.merchant,
        location_name: expense.location,
        receipt_url: expense.receiptUrl,
        expense_date: expense.date,
        expense_time: expense.time,
        day_number: dayNumber,
        is_split: expense.splitBetween?.length > 0,
        split_between: expense.splitBetween,
        split_amount: splitAmount,
        source: expense.source || 'manual',
        created_by: expense.userId
      })
      .select()
      .single()
    
    // Update tracker totals
    await this.updateTrackerTotals(trackerId)
    
    return created
  }
  
  /**
   * Get expense summary
   */
  async getExpenseSummary(trackerId: string): Promise<ExpenseSummary> {
    const { data: tracker } = await supabase
      .from('expense_trackers')
      .select('*')
      .eq('id', trackerId)
      .single()
    
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_tracker_id', trackerId)
    
    // By category
    const byCategory: Record<string, number> = {}
    for (const expense of expenses) {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount_in_base_currency
    }
    
    // By day
    const byDay: Record<number, number> = {}
    for (const expense of expenses) {
      byDay[expense.day_number] = (byDay[expense.day_number] || 0) + expense.amount_in_base_currency
    }
    
    // By traveler
    const byTraveler: Record<string, number> = {}
    for (const expense of expenses) {
      if (expense.paid_by) {
        byTraveler[expense.paid_by] = (byTraveler[expense.paid_by] || 0) + expense.amount_in_base_currency
      }
    }
    
    return {
      trackerId,
      budgetTotal: tracker.budget_total,
      budgetCurrency: tracker.budget_currency,
      totalSpent: tracker.total_spent,
      remaining: tracker.budget_total ? tracker.budget_total - tracker.total_spent : null,
      percentUsed: tracker.budget_total ? (tracker.total_spent / tracker.budget_total) * 100 : null,
      expenseCount: expenses.length,
      byCategory: ExpenseTrackerService.CATEGORIES.map(cat => ({
        ...cat,
        amount: byCategory[cat.id] || 0,
        percentage: tracker.total_spent > 0 
          ? ((byCategory[cat.id] || 0) / tracker.total_spent) * 100 
          : 0
      })),
      byDay: Object.entries(byDay).map(([day, amount]) => ({
        dayNumber: parseInt(day),
        amount
      })),
      byTraveler: Object.entries(byTraveler).map(([travelerId, amount]) => ({
        travelerId,
        amount
      })),
      averagePerDay: expenses.length > 0 
        ? tracker.total_spent / Math.max(...Object.keys(byDay).map(Number))
        : 0
    }
  }
  
  /**
   * Scan receipt and extract expense
   */
  async scanReceipt(
    trackerId: string,
    imageUrl: string
  ): Promise<ParsedReceipt> {
    
    // Use AI to parse receipt
    const parsed = await AIGenerationEngine.parseReceipt(imageUrl)
    
    return {
      success: parsed.confidence > 0.7,
      confidence: parsed.confidence,
      data: {
        amount: parsed.total,
        currency: parsed.currency,
        merchant: parsed.merchantName,
        date: parsed.date,
        category: this.categorizeFromMerchant(parsed.merchantName, parsed.items),
        items: parsed.items
      },
      needsReview: parsed.confidence < 0.85
    }
  }
  
  /**
   * Update tracker totals
   */
  private async updateTrackerTotals(trackerId: string): Promise<void> {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount_in_base_currency')
      .eq('expense_tracker_id', trackerId)
    
    const total = expenses.reduce((sum, e) => sum + e.amount_in_base_currency, 0)
    
    await supabase
      .from('expense_trackers')
      .update({ total_spent: total })
      .eq('id', trackerId)
  }
}
```

---

## Module 6: Compensation Tracker

Track flight delays and manage compensation claims.

### Database Schema

```sql
-- ============================================================================
-- COMPENSATION_TRACKERS: Compensation tracking module instances
-- ============================================================================
CREATE TABLE compensation_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Summary
  total_potential DECIMAL(12,2) DEFAULT 0,
  total_active DECIMAL(12,2) DEFAULT 0,
  total_completed DECIMAL(12,2) DEFAULT 0,
  
  potential_claims_count INTEGER DEFAULT 0,
  active_claims_count INTEGER DEFAULT 0,
  completed_claims_count INTEGER DEFAULT 0,
  
  average_claim_success_rate DECIMAL(5,2),     -- Historical for this airline/route
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPENSATION_CLAIMS: Individual compensation claims
-- ============================================================================
CREATE TABLE compensation_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compensation_tracker_id UUID NOT NULL REFERENCES compensation_trackers(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Flight reference
  booking_id UUID REFERENCES bookings(id),
  booking_item_id UUID,
  
  -- Flight details
  airline_code VARCHAR(10) NOT NULL,
  airline_name VARCHAR(255) NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  flight_date DATE NOT NULL,
  
  -- Route
  departure_airport VARCHAR(10) NOT NULL,
  arrival_airport VARCHAR(10) NOT NULL,
  
  -- Disruption details
  disruption_type VARCHAR(50) NOT NULL,
  /*
    'delay' - Flight delayed
    'cancellation' - Flight cancelled
    'denied_boarding' - Overbooked
    'downgrade' - Class downgrade
    'missed_connection' - Missed connecting flight
  */
  
  scheduled_departure TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  delay_minutes INTEGER,
  
  -- Eligibility
  eligibility_status VARCHAR(50) DEFAULT 'checking',
  /*
    'checking' - Checking eligibility
    'eligible' - Eligible for compensation
    'potentially_eligible' - Needs more info
    'not_eligible' - Not eligible
    'uncertain' - Cannot determine
  */
  
  eligibility_reason TEXT,
  
  -- Regulation
  applicable_regulation VARCHAR(50),
  /*
    'EU261' - EU Regulation 261/2004
    'UK261' - UK equivalent
    'US_DOT' - US Department of Transportation
    'CANADIAN' - Canadian APPR
    'OTHER' - Other/airline policy
  */
  
  -- Compensation amount
  estimated_amount DECIMAL(12,2),
  estimated_currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Claim status
  claim_status VARCHAR(50) DEFAULT 'potential',
  /*
    'potential' - Identified but not started
    'gathering_docs' - Collecting documents
    'ready_to_submit' - Ready to file
    'submitted' - Submitted to airline
    'airline_responded' - Airline replied
    'escalated' - Sent to authority/court
    'approved' - Compensation approved
    'paid' - Payment received
    'rejected' - Claim rejected
    'withdrawn' - User withdrew
  */
  
  -- Documents
  documents JSONB DEFAULT '[]',
  /*
    [
      { "type": "boarding_pass", "url": "...", "uploaded_at": "..." },
      { "type": "delay_confirmation", "url": "...", "uploaded_at": "..." },
      { "type": "expenses_receipts", "url": "...", "uploaded_at": "..." }
    ]
  */
  
  -- Communication
  airline_contact_email VARCHAR(255),
  airline_reference_number VARCHAR(100),
  last_contact_date DATE,
  next_action_date DATE,
  
  -- AI research
  ai_research_completed BOOLEAN DEFAULT FALSE,
  ai_research_data JSONB,
  /*
    {
      "airline_policy": "...",
      "compensation_rules": "...",
      "success_rate": 75,
      "average_processing_time": "6-8 weeks",
      "recommended_approach": "..."
    }
  */
  
  -- Resolution
  final_amount DECIMAL(12,2),
  paid_date DATE,
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compensation_claims_tracker ON compensation_claims(compensation_tracker_id);
CREATE INDEX idx_compensation_claims_status ON compensation_claims(claim_status);
CREATE INDEX idx_compensation_claims_flight ON compensation_claims(flight_date, flight_number);
```

### Compensation Tracker Service

```typescript
// src/services/modules/compensation/compensation.service.ts

export class CompensationService {
  
  // EU261 compensation amounts by distance
  static readonly EU261_AMOUNTS = {
    short: { distance: 1500, amount: 250 },      // Up to 1500km
    medium: { distance: 3500, amount: 400 },     // 1500-3500km
    long: { distance: Infinity, amount: 600 }    // Over 3500km
  }
  
  // Minimum delay for eligibility by regulation
  static readonly DELAY_THRESHOLDS = {
    EU261: 180,          // 3 hours
    UK261: 180,          // 3 hours
    US_DOT: 0,           // No federal law, airline policies
    CANADIAN: 180        // 3 hours
  }
  
  /**
   * Initialize compensation tracker
   */
  async initializeTracker(
    tripId: string,
    moduleId: string
  ): Promise<CompensationTracker> {
    
    const { data: tracker } = await supabase
      .from('compensation_trackers')
      .insert({
        trip_id: tripId,
        module_id: moduleId
      })
      .select()
      .single()
    
    // Check existing flights for potential claims
    await this.checkFlightsForEligibility(tracker.id, tripId)
    
    return tracker
  }
  
  /**
   * Check trip's flights for compensation eligibility
   */
  async checkFlightsForEligibility(
    trackerId: string,
    tripId: string
  ): Promise<void> {
    
    // Get all flight bookings
    const bookings = await TripRepository.getBookings(tripId)
    const flightBookings = bookings.filter(b => b.category === 'flight')
    
    for (const booking of flightBookings) {
      const flightDetails = booking.parsed_details as FlightBookingDetails
      
      // Check each segment
      for (const slice of flightDetails.slices || []) {
        for (const segment of slice.segments || []) {
          // Get flight status
          const status = await FlightStatusService.getFlightStatus(
            segment.marketingCarrier.code,
            segment.flightNumber,
            new Date(segment.departureAt)
          )
          
          if (status.delayed || status.cancelled) {
            await this.createPotentialClaim(trackerId, tripId, booking, segment, status)
          }
        }
      }
    }
    
    // Update tracker totals
    await this.updateTrackerTotals(trackerId)
  }
  
  /**
   * Create potential compensation claim
   */
  private async createPotentialClaim(
    trackerId: string,
    tripId: string,
    booking: TripBooking,
    segment: FlightSegment,
    status: FlightStatus
  ): Promise<CompensationClaim> {
    
    // Determine applicable regulation
    const regulation = this.determineApplicableRegulation(
      segment.departure.airport.code,
      segment.arrival.airport.code,
      segment.marketingCarrier.code
    )
    
    // Calculate estimated compensation
    const { amount, currency } = await this.calculateCompensation(
      regulation,
      segment,
      status
    )
    
    // Check eligibility
    const eligibility = await this.checkEligibility(
      regulation,
      status,
      segment
    )
    
    const { data: claim } = await supabase
      .from('compensation_claims')
      .insert({
        compensation_tracker_id: trackerId,
        trip_id: tripId,
        booking_id: booking.booking_id,
        airline_code: segment.marketingCarrier.code,
        airline_name: segment.marketingCarrier.name,
        flight_number: segment.flightNumber,
        flight_date: new Date(segment.departureAt).toISOString().split('T')[0],
        departure_airport: segment.departure.airport.code,
        arrival_airport: segment.arrival.airport.code,
        disruption_type: status.cancelled ? 'cancellation' : 'delay',
        scheduled_departure: segment.departureAt,
        actual_departure: status.actualDepartureTime,
        delay_minutes: status.delayMinutes,
        eligibility_status: eligibility.status,
        eligibility_reason: eligibility.reason,
        applicable_regulation: regulation,
        estimated_amount: amount,
        estimated_currency: currency,
        claim_status: eligibility.status === 'eligible' ? 'potential' : 'not_eligible'
      })
      .select()
      .single()
    
    // Run AI research in background
    this.runAIResearch(claim.id)
    
    return claim
  }
  
  /**
   * Determine which regulation applies
   */
  private determineApplicableRegulation(
    departureAirport: string,
    arrivalAirport: string,
    airlineCode: string
  ): string {
    
    // EU261 applies to:
    // 1. All flights departing from EU airports
    // 2. Flights arriving in EU on EU carriers
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
    const euCarriers = ['LH', 'AF', 'BA', 'IB', 'AZ', 'KL', 'SN', 'OS', 'SK', 'AY', 'EI'] // Sample
    
    const departureCountry = this.getCountryFromAirport(departureAirport)
    const arrivalCountry = this.getCountryFromAirport(arrivalAirport)
    
    if (euCountries.includes(departureCountry)) {
      return 'EU261'
    }
    
    if (euCountries.includes(arrivalCountry) && euCarriers.includes(airlineCode)) {
      return 'EU261'
    }
    
    if (departureCountry === 'GB' || arrivalCountry === 'GB') {
      return 'UK261'
    }
    
    if (departureCountry === 'CA' || arrivalCountry === 'CA') {
      return 'CANADIAN'
    }
    
    if (departureCountry === 'US' || arrivalCountry === 'US') {
      return 'US_DOT'
    }
    
    return 'OTHER'
  }
  
  /**
   * Calculate compensation amount
   */
  private async calculateCompensation(
    regulation: string,
    segment: FlightSegment,
    status: FlightStatus
  ): Promise<{ amount: number; currency: string }> {
    
    if (regulation === 'EU261' || regulation === 'UK261') {
      // Calculate distance
      const distance = await this.calculateFlightDistance(
        segment.departure.airport.code,
        segment.arrival.airport.code
      )
      
      let amount: number
      if (distance <= 1500) {
        amount = 250
      } else if (distance <= 3500) {
        amount = 400
      } else {
        amount = 600
      }
      
      // Reduce by 50% if rerouting got you there within threshold
      if (status.delayMinutes && status.delayMinutes < 240 && distance <= 1500) {
        amount *= 0.5
      }
      
      return { amount, currency: regulation === 'UK261' ? 'GBP' : 'EUR' }
    }
    
    if (regulation === 'CANADIAN') {
      // Canadian APPR amounts
      if (status.delayMinutes >= 540) {
        return { amount: 1000, currency: 'CAD' }
      } else if (status.delayMinutes >= 360) {
        return { amount: 700, currency: 'CAD' }
      } else {
        return { amount: 400, currency: 'CAD' }
      }
    }
    
    // US - no federal compensation, estimate based on airline policies
    return { amount: 0, currency: 'USD' }
  }
  
  /**
   * Check eligibility for compensation
   */
  private async checkEligibility(
    regulation: string,
    status: FlightStatus,
    segment: FlightSegment
  ): Promise<{ status: string; reason: string }> {
    
    const threshold = CompensationService.DELAY_THRESHOLDS[regulation] || 180
    
    if (status.cancelled) {
      // Cancellation - check notice period
      if (status.cancellationNoticeHours && status.cancellationNoticeHours >= 336) { // 14 days
        return {
          status: 'not_eligible',
          reason: 'Cancellation notified more than 14 days in advance'
        }
      }
      return {
        status: 'eligible',
        reason: 'Flight cancelled with less than 14 days notice'
      }
    }
    
    if (status.delayMinutes && status.delayMinutes >= threshold) {
      // Check for extraordinary circumstances (would need more data)
      return {
        status: 'eligible',
        reason: `Flight delayed by ${Math.floor(status.delayMinutes / 60)} hours ${status.delayMinutes % 60} minutes`
      }
    }
    
    if (status.delayMinutes && status.delayMinutes > 0) {
      return {
        status: 'not_eligible',
        reason: `Delay of ${status.delayMinutes} minutes is below the ${threshold} minute threshold`
      }
    }
    
    return {
      status: 'not_eligible',
      reason: 'Flight was on time'
    }
  }
  
  /**
   * Run AI research on claim
   */
  private async runAIResearch(claimId: string): Promise<void> {
    const { data: claim } = await supabase
      .from('compensation_claims')
      .select('*')
      .eq('id', claimId)
      .single()
    
    // Research airline's compensation policies
    const research = await AIGenerationEngine.researchCompensation({
      airline: claim.airline_name,
      airlineCode: claim.airline_code,
      regulation: claim.applicable_regulation,
      disruptionType: claim.disruption_type,
      route: `${claim.departure_airport} → ${claim.arrival_airport}`
    })
    
    await supabase
      .from('compensation_claims')
      .update({
        ai_research_completed: true,
        ai_research_data: research,
        airline_contact_email: research.contactEmail
      })
      .eq('id', claimId)
  }
  
  /**
   * Get compensation claim details with action steps
   */
  async getClaimDetails(claimId: string): Promise<ClaimWithActions> {
    const { data: claim } = await supabase
      .from('compensation_claims')
      .select('*')
      .eq('id', claimId)
      .single()
    
    // Generate action steps based on status
    const actions = this.getClaimActions(claim)
    
    return {
      ...claim,
      actions,
      nextStep: actions.find(a => !a.completed),
      documentsNeeded: this.getRequiredDocuments(claim),
      estimatedTimeline: this.getEstimatedTimeline(claim)
    }
  }
  
  /**
   * Get required documents for claim
   */
  private getRequiredDocuments(claim: CompensationClaim): RequiredDocument[] {
    const docs: RequiredDocument[] = [
      {
        type: 'boarding_pass',
        name: 'Boarding Pass',
        description: 'Original boarding pass or booking confirmation',
        required: true,
        uploaded: claim.documents?.some(d => d.type === 'boarding_pass')
      },
      {
        type: 'delay_confirmation',
        name: 'Delay/Cancellation Confirmation',
        description: 'Email or notice from airline confirming the delay',
        required: true,
        uploaded: claim.documents?.some(d => d.type === 'delay_confirmation')
      }
    ]
    
    if (claim.disruption_type === 'delay' && claim.delay_minutes >= 120) {
      docs.push({
        type: 'expenses_receipts',
        name: 'Expense Receipts',
        description: 'Receipts for meals, refreshments, or accommodation',
        required: false,
        uploaded: claim.documents?.some(d => d.type === 'expenses_receipts')
      })
    }
    
    return docs
  }
  
  /**
   * Update tracker totals
   */
  private async updateTrackerTotals(trackerId: string): Promise<void> {
    const { data: claims } = await supabase
      .from('compensation_claims')
      .select('claim_status, estimated_amount, final_amount')
      .eq('compensation_tracker_id', trackerId)
    
    const potential = claims
      .filter(c => c.claim_status === 'potential')
      .reduce((sum, c) => sum + (c.estimated_amount || 0), 0)
    
    const active = claims
      .filter(c => ['gathering_docs', 'ready_to_submit', 'submitted', 'airline_responded', 'escalated'].includes(c.claim_status))
      .reduce((sum, c) => sum + (c.estimated_amount || 0), 0)
    
    const completed = claims
      .filter(c => c.claim_status === 'paid')
      .reduce((sum, c) => sum + (c.final_amount || 0), 0)
    
    await supabase
      .from('compensation_trackers')
      .update({
        total_potential: potential,
        total_active: active,
        total_completed: completed,
        potential_claims_count: claims.filter(c => c.claim_status === 'potential').length,
        active_claims_count: claims.filter(c => ['gathering_docs', 'ready_to_submit', 'submitted', 'airline_responded', 'escalated'].includes(c.claim_status)).length,
        completed_claims_count: claims.filter(c => c.claim_status === 'paid').length
      })
      .eq('id', trackerId)
  }
}
```

---

## Module 7: Journal

Personal travel memories with text, photos, audio, and location.

### Database Schema

```sql
-- ============================================================================
-- JOURNALS: Journal module instances (personal per traveler)
-- ============================================================================
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES trip_travelers(id) ON DELETE CASCADE,
  module_id UUID REFERENCES trip_modules(id) ON DELETE CASCADE,
  
  -- Stats
  total_entries INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  total_audio_minutes DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JOURNAL_ENTRIES: Individual journal entries
-- ============================================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(255),
  content TEXT,
  word_count INTEGER DEFAULT 0,
  
  -- Date and time
  entry_date DATE NOT NULL,
  entry_time TIME,
  day_number INTEGER,
  
  -- Location
  location_name VARCHAR(255),
  location_address TEXT,
  location_coordinates POINT,
  location_place_id VARCHAR(255),
  
  -- Media
  photos JSONB DEFAULT '[]',
  /*
    [
      { "url": "...", "thumbnail_url": "...", "caption": "...", "taken_at": "..." }
    ]
  */
  
  audio_recordings JSONB DEFAULT '[]',
  /*
    [
      { "url": "...", "duration_seconds": 84, "transcript": "...", "recorded_at": "..." }
    ]
  */
  
  -- Mood/Tags (optional)
  mood VARCHAR(50),  -- 'amazing', 'happy', 'peaceful', 'adventurous', 'tired', etc.
  tags VARCHAR(50)[],
  
  -- Weather at time of entry
  weather JSONB,
  /*
    { "condition": "sunny", "temp_celsius": 28, "icon": "☀️" }
  */
  
  -- Privacy
  is_private BOOLEAN DEFAULT TRUE,  -- Only visible to author
  
  -- AI suggestions shown
  suggestions_shown JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_journal ON journal_entries(journal_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(trip_id, entry_date);
CREATE INDEX idx_journal_entries_day ON journal_entries(trip_id, day_number);
```

### Journal Service

```typescript
// src/services/modules/journal/journal.service.ts

export class JournalService {
  
  // Mood options
  static readonly MOODS = [
    { id: 'amazing', emoji: '🤩', label: 'Amazing' },
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'peaceful', emoji: '😌', label: 'Peaceful' },
    { id: 'adventurous', emoji: '🤠', label: 'Adventurous' },
    { id: 'grateful', emoji: '🙏', label: 'Grateful' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'frustrated', emoji: '😤', label: 'Frustrated' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' }
  ]
  
  /**
   * Initialize journal for traveler
   */
  async initializeJournal(
    tripId: string,
    travelerId: string,
    moduleId: string
  ): Promise<Journal> {
    
    const { data: journal } = await supabase
      .from('journals')
      .insert({
        trip_id: tripId,
        traveler_id: travelerId,
        module_id: moduleId
      })
      .select()
      .single()
    
    return journal
  }
  
  /**
   * Create journal entry
   */
  async createEntry(
    journalId: string,
    entry: CreateJournalEntryInput
  ): Promise<JournalEntry> {
    
    const journal = await supabase
      .from('journals')
      .select('trip_id, trips(*)')
      .eq('id', journalId)
      .single()
    
    // Calculate day number
    const tripStart = new Date(journal.data.trips.start_date)
    const entryDate = new Date(entry.date)
    const dayNumber = Math.ceil(
      (entryDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    
    // Get weather if location provided
    let weather: any = null
    if (entry.location?.coordinates) {
      weather = await WeatherService.getCurrentWeather(
        entry.location.coordinates.lat,
        entry.location.coordinates.lng
      )
    }
    
    // Count words
    const wordCount = entry.content 
      ? entry.content.trim().split(/\s+/).length 
      : 0
    
    const { data: created } = await supabase
      .from('journal_entries')
      .insert({
        journal_id: journalId,
        trip_id: journal.data.trip_id,
        title: entry.title,
        content: entry.content,
        word_count: wordCount,
        entry_date: entry.date,
        entry_time: entry.time,
        day_number: dayNumber,
        location_name: entry.location?.name,
        location_address: entry.location?.address,
        location_coordinates: entry.location?.coordinates 
          ? `POINT(${entry.location.coordinates.lng} ${entry.location.coordinates.lat})`
          : null,
        location_place_id: entry.location?.placeId,
        photos: entry.photos || [],
        audio_recordings: entry.audioRecordings || [],
        mood: entry.mood,
        tags: entry.tags,
        weather
      })
      .select()
      .single()
    
    // Update journal stats
    await this.updateJournalStats(journalId)
    
    return created
  }
  
  /**
   * Get journal suggestions for today
   */
  async getSuggestions(
    journalId: string,
    dayNumber: number
  ): Promise<JournalSuggestion[]> {
    
    const journal = await supabase
      .from('journals')
      .select('trip_id')
      .eq('id', journalId)
      .single()
    
    // Get today's itinerary
    const itinerary = await TripPlannerService.getItinerary(journal.data.trip_id)
    const today = itinerary.days.find(d => d.dayNumber === dayNumber)
    
    const suggestions: JournalSuggestion[] = []
    
    // Suggest based on activities
    if (today?.items) {
      for (const item of today.items.slice(0, 3)) {
        suggestions.push({
          type: 'activity',
          prompt: `How was your experience at ${item.title}?`,
          relatedTo: item.title,
          icon: '🎯'
        })
      }
    }
    
    // General prompts
    suggestions.push(
      {
        type: 'highlight',
        prompt: `What was the highlight of Day ${dayNumber}?`,
        icon: '⭐'
      },
      {
        type: 'food',
        prompt: 'Did you try any local food today? What did you think?',
        icon: '🍽️'
      },
      {
        type: 'people',
        prompt: 'Did you meet any interesting people today?',
        icon: '👋'
      },
      {
        type: 'surprise',
        prompt: 'Was there anything that surprised you today?',
        icon: '😮'
      }
    )
    
    return suggestions
  }
  
  /**
   * Get journal with entries
   */
  async getJournal(journalId: string): Promise<JournalWithEntries> {
    const { data: journal } = await supabase
      .from('journals')
      .select('*')
      .eq('id', journalId)
      .single()
    
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('journal_id', journalId)
      .order('entry_date', { ascending: false })
      .order('entry_time', { ascending: false })
    
    // Group by day
    const byDay: Record<number, JournalEntry[]> = {}
    for (const entry of entries) {
      if (!byDay[entry.day_number]) {
        byDay[entry.day_number] = []
      }
      byDay[entry.day_number].push(entry)
    }
    
    return {
      ...journal,
      entries,
      byDay
    }
  }
  
  /**
   * Update journal stats
   */
  private async updateJournalStats(journalId: string): Promise<void> {
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('word_count, photos, audio_recordings')
      .eq('journal_id', journalId)
    
    const stats = {
      total_entries: entries.length,
      total_words: entries.reduce((sum, e) => sum + e.word_count, 0),
      total_photos: entries.reduce((sum, e) => sum + (e.photos?.length || 0), 0),
      total_audio_minutes: entries.reduce((sum, e) => {
        const audioSeconds = (e.audio_recordings || []).reduce(
          (s, a) => s + (a.duration_seconds || 0), 0
        )
        return sum + audioSeconds / 60
      }, 0)
    }
    
    await supabase
      .from('journals')
      .update(stats)
      .eq('id', journalId)
  }
}
```

---

## Module Orchestrator

Coordinates generation and refresh of all modules.

```typescript
// src/services/module-orchestrator/module-orchestrator.service.ts

export class ModuleOrchestrator {
  
  static readonly SHARED_MODULES = ['trip_planner', 'dos_donts', 'safety', 'expense_tracker', 'compensation_tracker']
  static readonly PERSONAL_MODULES = ['packing_list', 'journal']
  
  /**
   * Generate all modules for a trip (on confirmation)
   */
  async generateAllModules(tripId: string): Promise<void> {
    const trip = await TripRepository.findById(tripId)
    const travelers = await TripRepository.getTravelers(tripId)
    
    // Generate shared modules
    for (const moduleType of ModuleOrchestrator.SHARED_MODULES) {
      await this.generateModule(tripId, moduleType)
    }
    
    // Generate personal modules for each traveler
    for (const traveler of travelers) {
      for (const moduleType of ModuleOrchestrator.PERSONAL_MODULES) {
        await this.generateModule(tripId, moduleType, traveler.id)
      }
    }
    
    // Update trip
    await supabase
      .from('trips')
      .update({
        modules_generated: true,
        modules_generated_at: new Date()
      })
      .eq('id', tripId)
  }
  
  /**
   * Generate single module
   */
  async generateModule(
    tripId: string,
    moduleType: string,
    travelerId?: string
  ): Promise<TripModule> {
    
    // Create module record
    const { data: module } = await supabase
      .from('trip_modules')
      .insert({
        trip_id: tripId,
        module_type: moduleType,
        traveler_id: travelerId,
        is_personal: ModuleOrchestrator.PERSONAL_MODULES.includes(moduleType),
        generation_status: 'generating',
        generation_started_at: new Date()
      })
      .select()
      .single()
    
    try {
      // Generate based on type
      switch (moduleType) {
        case 'trip_planner':
          await TripPlannerService.generateAlerts(tripId)
          break
        case 'packing_list':
          await PackingListService.generatePackingList(tripId, travelerId, module.id)
          break
        case 'dos_donts':
          await DosDontsService.generateDosDonts(tripId, module.id)
          break
        case 'safety':
          await SafetyService.generateSafetyModule(tripId, module.id)
          break
        case 'expense_tracker':
          await ExpenseTrackerService.initializeTracker(tripId, module.id)
          break
        case 'compensation_tracker':
          await CompensationService.initializeTracker(tripId, module.id)
          break
        case 'journal':
          await JournalService.initializeJournal(tripId, travelerId, module.id)
          break
      }
      
      // Update status
      await supabase
        .from('trip_modules')
        .update({
          generation_status: 'generated',
          generation_completed_at: new Date()
        })
        .eq('id', module.id)
      
    } catch (error) {
      await supabase
        .from('trip_modules')
        .update({
          generation_status: 'failed',
          generation_error: error.message
        })
        .eq('id', module.id)
      
      throw error
    }
    
    return module
  }
  
  /**
   * Generate personalized modules for new traveler
   */
  async generatePersonalizedModules(
    tripId: string,
    travelerId: string
  ): Promise<void> {
    for (const moduleType of ModuleOrchestrator.PERSONAL_MODULES) {
      await this.generateModule(tripId, moduleType, travelerId)
    }
  }
  
  /**
   * Refresh all modules for trip
   */
  async refreshAllModules(tripId: string): Promise<void> {
    const { data: modules } = await supabase
      .from('trip_modules')
      .select('*')
      .eq('trip_id', tripId)
    
    for (const module of modules) {
      await this.refreshModule(tripId, module.module_type, module.traveler_id)
    }
  }
  
  /**
   * Refresh specific module
   */
  async refreshModule(
    tripId: string,
    moduleType: string,
    travelerId?: string
  ): Promise<void> {
    // Mark as needs refresh
    await supabase
      .from('trip_modules')
      .update({
        needs_refresh: true,
        generation_status: 'generating'
      })
      .eq('trip_id', tripId)
      .eq('module_type', moduleType)
      .is('traveler_id', travelerId || null)
    
    // Regenerate
    switch (moduleType) {
      case 'trip_planner':
        await TripPlannerService.generateAlerts(tripId)
        break
      case 'safety':
        const safetyModule = await this.getModuleByType(tripId, 'safety')
        if (safetyModule) {
          await SafetyService.refreshAlerts(safetyModule.id)
        }
        break
      // ... other modules
    }
    
    await supabase
      .from('trip_modules')
      .update({
        needs_refresh: false,
        generation_status: 'generated',
        last_refreshed_at: new Date()
      })
      .eq('trip_id', tripId)
      .eq('module_type', moduleType)
  }
  
  /**
   * Get module status for trip
   */
  async getStatus(tripId: string): Promise<ModuleStatusMap> {
    const { data: modules } = await supabase
      .from('trip_modules')
      .select('module_type, traveler_id, generation_status, generation_completed_at, needs_refresh')
      .eq('trip_id', tripId)
    
    const status: ModuleStatusMap = {}
    for (const module of modules) {
      const key = module.traveler_id 
        ? `${module.module_type}_${module.traveler_id}`
        : module.module_type
      status[key] = {
        status: module.generation_status,
        generatedAt: module.generation_completed_at,
        needsRefresh: module.needs_refresh
      }
    }
    
    return status
  }
  
  /**
   * Mark modules for refresh when context changes
   */
  async markForRefresh(
    tripId: string,
    options: { reason: string; moduleTypes?: string[] }
  ): Promise<void> {
    const moduleTypes = options.moduleTypes || [
      'trip_planner', 'packing_list', 'dos_donts', 'safety'
    ]
    
    await supabase
      .from('trip_modules')
      .update({
        needs_refresh: true,
        refresh_reason: options.reason
      })
      .eq('trip_id', tripId)
      .in('module_type', moduleTypes)
  }
  
  /**
   * Generate offline data package
   */
  async generateOfflinePackage(tripId: string): Promise<void> {
    // Generate downloadable data for offline use
    const offlineData = {
      itinerary: await TripPlannerService.getItinerary(tripId),
      dosDonts: await this.getDosDontsForOffline(tripId),
      safety: await this.getSafetyForOffline(tripId),
      packingLists: await this.getPackingListsForOffline(tripId)
    }
    
    // Store as JSON for quick download
    await supabase.storage
      .from('offline-data')
      .upload(`trips/${tripId}/offline.json`, JSON.stringify(offlineData))
    
    // Generate map tiles for destination
    await MapService.downloadOfflineRegion(tripId)
  }
}
```

---

## API Endpoints Summary

```typescript
// Modules endpoints for each module type

// Trip Planner
GET /trips/:tripId/modules/planner                    // Get itinerary
GET /trips/:tripId/modules/planner/alerts            // Get active alerts
POST /trips/:tripId/modules/planner/activities       // Add activity

// Packing List
GET /trips/:tripId/modules/packing                   // Get packing list
GET /trips/:tripId/modules/packing/:travelerId       // Get traveler's list
POST /trips/:tripId/modules/packing/:travelerId/items  // Add item
PATCH /trips/:tripId/modules/packing/items/:itemId   // Toggle packed

// Do's & Don'ts
GET /trips/:tripId/modules/dos-donts                 // Get all
GET /trips/:tripId/modules/dos-donts?category=food   // Filter by category
POST /trips/:tripId/modules/dos-donts/:itemId/feedback  // Rate helpfulness

// Safety
GET /trips/:tripId/modules/safety                    // Get all safety info
GET /trips/:tripId/modules/safety/alerts             // Get active alerts
POST /trips/:tripId/modules/safety/sos               // Trigger SOS

// Expense Tracker
GET /trips/:tripId/modules/expenses                  // Get summary
GET /trips/:tripId/modules/expenses/list             // Get all expenses
POST /trips/:tripId/modules/expenses                 // Add expense
POST /trips/:tripId/modules/expenses/scan            // Scan receipt

// Compensation Tracker
GET /trips/:tripId/modules/compensation              // Get summary
GET /trips/:tripId/modules/compensation/claims       // Get all claims
GET /trips/:tripId/modules/compensation/claims/:id   // Get claim details
POST /trips/:tripId/modules/compensation/claims/:id/documents  // Upload doc

// Journal
GET /trips/:tripId/modules/journal                   // Get journal
GET /trips/:tripId/modules/journal/:travelerId       // Get traveler's journal
POST /trips/:tripId/modules/journal/entries          // Create entry
GET /trips/:tripId/modules/journal/suggestions       // Get writing prompts
```

---

## Scheduled Jobs

```typescript
// Module refresh jobs

// Every hour: Check for safety alerts
schedule('0 * * * *', async () => {
  const activeTrips = await getTripsWithStatus(['upcoming', 'ongoing'])
  for (const trip of activeTrips) {
    await SafetyService.refreshAlerts(trip.safety_module_id)
  }
})

// Every 6 hours: Check flight status for compensation
schedule('0 */6 * * *', async () => {
  const ongoingTrips = await getTripsWithStatus(['ongoing'])
  for (const trip of ongoingTrips) {
    await CompensationService.checkFlightsForEligibility(trip.compensation_tracker_id, trip.id)
  }
})

// Daily: Update exchange rates
schedule('0 6 * * *', async () => {
  await CurrencyService.updateAllRates()
})

// Daily: Refresh weather forecasts
schedule('0 5 * * *', async () => {
  const upcomingTrips = await getTripsWithStatus(['upcoming'])
  for (const trip of upcomingTrips) {
    await TripPlannerService.generateAlerts(trip.id)
  }
})

// Weekly: Clean up expired cache
schedule('0 0 * * 0', async () => {
  await supabase
    .from('module_cache')
    .update({ is_valid: false })
    .lt('valid_until', new Date().toISOString())
})
```

---

## Implementation Checklist

### Phase 1: Database (Day 1-2)
- [ ] Create all module tables
- [ ] Create module_cache table
- [ ] Create indexes
- [ ] Create triggers

### Phase 2: Module Orchestrator (Day 3)
- [ ] Generation flow
- [ ] Refresh flow
- [ ] Cache management
- [ ] Offline package generation

### Phase 3: Trip Planner (Day 4)
- [ ] Itinerary builder
- [ ] Alert generation
- [ ] Activity management

### Phase 4: Packing List (Day 5)
- [ ] Generation with AI
- [ ] Document items
- [ ] Toggle/add items
- [ ] Cache

### Phase 5: Do's & Don'ts (Day 6)
- [ ] Generation with AI
- [ ] All 18 categories
- [ ] Feedback system
- [ ] Cache

### Phase 6: Safety (Day 7)
- [ ] Data aggregation
- [ ] Score calculation
- [ ] Emergency contacts
- [ ] Alerts
- [ ] SOS

### Phase 7: Expense Tracker (Day 8)
- [ ] CRUD
- [ ] Receipt scanning
- [ ] Summary/analytics

### Phase 8: Compensation Tracker (Day 9)
- [ ] Flight status monitoring
- [ ] Eligibility calculation
- [ ] AI research
- [ ] Claim management

### Phase 9: Journal (Day 10)
- [ ] CRUD
- [ ] Media handling
- [ ] Suggestions

### Phase 10: API & Testing (Day 11-12)
- [ ] All endpoints
- [ ] Integration tests
- [ ] E2E tests

---

**This Trip Hub Module System transforms Guidera from a booking platform into an indispensable travel companion. Each module adds value, creates stickiness, and differentiates from competitors.**
