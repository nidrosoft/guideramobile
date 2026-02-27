# Document 15: Real-time Intelligence System

## The Nervous System of Guidera

This document defines the **Real-time Intelligence System** — a unified, modular engine that manages every alert, notification, and real-time event across the entire Guidera platform.

**Design Philosophy:** The right information, to the right person, at the right time, through the right channel.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Unified Alert System](#unified-alert-system)
3. [Alert Categories](#alert-categories)
4. [Community Alerts](#community-alerts)
5. [Trip Alerts](#trip-alerts)
6. [Safety Alerts](#safety-alerts)
7. [Financial Alerts](#financial-alerts)
8. [Social & Proximity Alerts](#social-proximity-alerts)
9. [Smart Delivery Engine](#smart-delivery-engine)
10. [Notification Preferences](#notification-preferences)
11. [Real-time Data Pipelines](#real-time-data-pipelines)
12. [SOS Emergency System](#sos-emergency-system)
13. [Module System](#module-system)
14. [Implementation](#implementation)

---

## Part 1: Architecture Overview

### 1.1 The Unified Alert Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                         GUIDERA REAL-TIME INTELLIGENCE                               │
│                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                        EVENT SOURCES (Inputs)                                │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │  Flight  │ │  Weather │ │  Safety  │ │Community │ │  Price   │          │    │
│  │  │   APIs   │ │   APIs   │ │   APIs   │ │  Events  │ │  Feeds   │          │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │    │
│  │       │            │            │            │            │                 │    │
│  │  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐          │    │
│  │  │ Location │ │  User    │ │ Booking  │ │  Trip    │ │  System  │          │    │
│  │  │  Events  │ │ Actions  │ │ Changes  │ │  Events  │ │  Events  │          │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │    │
│  │       └───────────┬┴───────────┬┴───────────┬┴───────────┬┘                │    │
│  │                   │            │            │            │                  │    │
│  └───────────────────┼────────────┼────────────┼────────────┼──────────────────┘    │
│                      ▼            ▼            ▼            ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         EVENT INGESTION LAYER                                │    │
│  │                                                                              │    │
│  │   • Event normalization      • Deduplication                                │    │
│  │   • Schema validation        • Rate limiting                                │    │
│  │   • Event enrichment         • Priority assignment                          │    │
│  └────────────────────────────────────┬────────────────────────────────────────┘    │
│                                       │                                             │
│                                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          ALERT PROCESSING ENGINE                             │    │
│  │                                                                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │
│  │  │   Module    │  │   Target    │  │   Smart     │  │  Template   │        │    │
│  │  │   Router    │  │  Resolver   │  │  Batching   │  │   Engine    │        │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │    │
│  │                                                                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │
│  │  │  Priority   │  │ Preference  │  │   Quiet     │  │  Channel    │        │    │
│  │  │  Scoring    │  │   Filter    │  │   Hours     │  │  Selector   │        │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │    │
│  └────────────────────────────────────┬────────────────────────────────────────┘    │
│                                       │                                             │
│                                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          DELIVERY CHANNELS                                   │    │
│  │                                                                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │   Push   │ │  In-App  │ │   SMS    │ │  Email   │ │  Widget  │          │    │
│  │  │  (APNS/  │ │  Banner  │ │(Critical │ │ (Digest) │ │  Update  │          │    │
│  │  │   FCM)   │ │          │ │  Only)   │ │          │ │          │          │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Unified** | All alerts flow through one system, regardless of source |
| **Modular** | New alert types can be added via plugin modules |
| **Smart** | Batches, prioritizes, and times delivery intelligently |
| **Respectful** | Honors user preferences and quiet hours |
| **Scalable** | Handles millions of events with consistent performance |
| **Actionable** | Every alert provides clear next steps |

---

## Part 2: Unified Alert System

### 2.1 Alert Database Schema

```sql
-- ============================================
-- CORE ALERT TABLES
-- ============================================

-- Alert Categories (extensible)
CREATE TABLE alert_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,           -- 'trip', 'community', 'safety', 'financial', 'social', 'system'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),                           -- Hex color
    default_priority INTEGER DEFAULT 5,         -- 1-10
    default_channels TEXT[],                    -- ['push', 'in_app']
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Types (specific alerts within categories)
CREATE TABLE alert_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES alert_categories(id),
    code VARCHAR(100) UNIQUE NOT NULL,          -- 'flight_delay', 'group_join_request', 'price_drop'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Template configuration
    title_template TEXT NOT NULL,               -- "Your flight {{flight_number}} is delayed"
    body_template TEXT NOT NULL,                -- "New departure time: {{new_time}}"
    icon VARCHAR(50),
    
    -- Behavior configuration
    priority_level INTEGER DEFAULT 5,           -- 1 (lowest) to 10 (critical)
    allowed_channels TEXT[] NOT NULL,           -- ['push', 'in_app', 'email', 'sms']
    default_channel VARCHAR(20) DEFAULT 'push',
    
    -- Batching configuration
    can_batch BOOLEAN DEFAULT true,
    batch_window_minutes INTEGER DEFAULT 5,
    max_batch_size INTEGER DEFAULT 10,
    
    -- Action configuration
    action_type VARCHAR(50),                    -- 'deep_link', 'web_url', 'in_app_action'
    action_template TEXT,                       -- '/trips/{{trip_id}}/flights/{{booking_id}}'
    
    -- Module reference
    module_code VARCHAR(50),                    -- Which module handles this alert
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Instances (actual alerts sent/pending)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Type reference
    alert_type_id UUID REFERENCES alert_types(id),
    alert_type_code VARCHAR(100) NOT NULL,      -- Denormalized for performance
    category_code VARCHAR(50) NOT NULL,
    
    -- Target
    user_id UUID REFERENCES users(id) NOT NULL,
    
    -- Content (rendered from template)
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon VARCHAR(50),
    image_url TEXT,                             -- Optional rich image
    
    -- Context data (JSON blob for deep linking, display)
    context JSONB NOT NULL DEFAULT '{}',
    /*
      Examples:
      - Flight: {"trip_id": "...", "booking_id": "...", "flight_number": "AA123", "delay_minutes": 45}
      - Community: {"group_id": "...", "post_id": "...", "actor_name": "John"}
      - Safety: {"destination": "Paris", "alert_level": "warning", "source": "State Dept"}
    */
    
    -- Priority (computed)
    priority INTEGER NOT NULL,                  -- 1-10, higher = more important
    
    -- Delivery
    channels_requested TEXT[],                  -- Channels to attempt
    channels_delivered TEXT[] DEFAULT '{}',    -- Channels successfully delivered
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',       -- 'pending', 'delivered', 'read', 'actioned', 'expired', 'failed'
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_for TIMESTAMPTZ,                  -- Future delivery
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Batching
    batch_id UUID,                              -- If part of a batch
    is_batched BOOLEAN DEFAULT false,
    
    -- Action
    action_url TEXT,                            -- Deep link or URL
    action_taken VARCHAR(50),                   -- What action user took
    
    -- Metadata
    source VARCHAR(50),                         -- 'system', 'external_api', 'user_action'
    external_ref VARCHAR(200),                  -- Reference to external event
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'delivered', 'read', 'actioned', 'expired', 'failed', 'cancelled'))
);

-- Indexes for alerts
CREATE INDEX idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id) WHERE status IN ('delivered', 'pending');
CREATE INDEX idx_alerts_scheduled ON alerts(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_alerts_category ON alerts(user_id, category_code);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_batch ON alerts(batch_id) WHERE batch_id IS NOT NULL;

-- Alert Batches (grouped notifications)
CREATE TABLE alert_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    alert_type_code VARCHAR(100) NOT NULL,
    
    -- Summary
    alert_count INTEGER DEFAULT 0,
    title TEXT NOT NULL,                        -- "5 new comments on your post"
    body TEXT,
    
    -- Delivery
    status VARCHAR(20) DEFAULT 'collecting',    -- 'collecting', 'delivered', 'read'
    channels TEXT[],
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    deliver_at TIMESTAMPTZ,                     -- When to deliver batch
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Delivery Log (audit trail)
CREATE TABLE alert_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id),
    
    channel VARCHAR(20) NOT NULL,               -- 'push', 'email', 'sms', 'in_app'
    status VARCHAR(20) NOT NULL,                -- 'sent', 'delivered', 'failed', 'bounced'
    
    -- Provider details
    provider VARCHAR(50),                       -- 'apns', 'fcm', 'sendgrid', 'twilio'
    provider_message_id VARCHAR(200),
    
    -- Error tracking
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Timing
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- User Notification Preferences
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    
    -- Global settings
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,                     -- e.g., '22:00'
    quiet_hours_end TIME,                       -- e.g., '08:00'
    quiet_hours_timezone VARCHAR(50),
    quiet_hours_override_critical BOOLEAN DEFAULT true,  -- Critical alerts bypass quiet hours
    
    -- Channel preferences
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,          -- Opt-in for SMS
    
    -- Email digest preferences
    email_digest_enabled BOOLEAN DEFAULT true,
    email_digest_frequency VARCHAR(20) DEFAULT 'daily',  -- 'instant', 'daily', 'weekly'
    email_digest_time TIME DEFAULT '09:00',
    
    -- Category overrides (JSON object)
    category_preferences JSONB DEFAULT '{}',
    /*
      {
        "community": {"enabled": true, "channels": ["push", "in_app"], "digest": true},
        "trip": {"enabled": true, "channels": ["push", "in_app", "email"]},
        "safety": {"enabled": true, "channels": ["push", "sms"]},
        "financial": {"enabled": true, "channels": ["push", "email"]}
      }
    */
    
    -- Type-specific overrides
    type_preferences JSONB DEFAULT '{}',
    /*
      {
        "group_post_comment": {"enabled": true, "channels": ["in_app"]},
        "flight_delay": {"enabled": true, "channels": ["push", "sms"]}
      }
    */
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Device Tokens (for push notifications)
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    
    -- Device info
    device_token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL,              -- 'ios', 'android', 'web'
    device_type VARCHAR(50),                    -- 'iphone', 'ipad', 'android_phone'
    device_name VARCHAR(100),
    
    -- Push provider
    push_provider VARCHAR(20),                  -- 'apns', 'fcm'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    app_version VARCHAR(20),
    os_version VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_token)
);
```

### 2.2 Alert Types Registry

```typescript
// src/services/realtime/alerts/alert-types.registry.ts

/**
 * Central registry of all alert types in the system
 * New modules register their alert types here
 */
export const ALERT_TYPES_REGISTRY: AlertTypeDefinition[] = [
  
  // ==========================================
  // TRIP ALERTS
  // ==========================================
  
  {
    code: 'flight_delay',
    category: 'trip',
    name: 'Flight Delay',
    titleTemplate: 'Flight {{flight_number}} Delayed',
    bodyTemplate: 'Your flight to {{destination}} is now delayed by {{delay_minutes}} minutes. New departure: {{new_departure_time}}',
    priority: 8,
    allowedChannels: ['push', 'in_app', 'sms', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/flights/{{booking_id}}'
  },
  
  {
    code: 'flight_cancelled',
    category: 'trip',
    name: 'Flight Cancelled',
    titleTemplate: '⚠️ Flight {{flight_number}} Cancelled',
    bodyTemplate: 'Your flight to {{destination}} has been cancelled. Tap to view rebooking options and compensation eligibility.',
    priority: 10,
    allowedChannels: ['push', 'in_app', 'sms', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/flights/{{booking_id}}/cancelled'
  },
  
  {
    code: 'flight_gate_change',
    category: 'trip',
    name: 'Gate Change',
    titleTemplate: 'Gate Changed: {{flight_number}}',
    bodyTemplate: 'Your flight now departs from Gate {{new_gate}} (was {{old_gate}})',
    priority: 7,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/flights/{{booking_id}}'
  },
  
  {
    code: 'checkin_reminder',
    category: 'trip',
    name: 'Check-in Reminder',
    titleTemplate: 'Check-in Now Open: {{airline}}',
    bodyTemplate: 'Online check-in is now available for your {{destination}} flight tomorrow. Check in early for better seat selection.',
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/flights/{{booking_id}}/checkin'
  },
  
  {
    code: 'hotel_checkin_reminder',
    category: 'trip',
    name: 'Hotel Check-in Reminder',
    titleTemplate: 'Check-in Today: {{hotel_name}}',
    bodyTemplate: 'Your hotel check-in is at {{checkin_time}}. Address: {{address}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/hotels/{{booking_id}}'
  },
  
  {
    code: 'hotel_checkout_reminder',
    category: 'trip',
    name: 'Hotel Check-out Reminder',
    titleTemplate: 'Check-out Tomorrow: {{hotel_name}}',
    bodyTemplate: 'Remember to check out by {{checkout_time}} tomorrow.',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/hotels/{{booking_id}}'
  },
  
  {
    code: 'activity_reminder',
    category: 'trip',
    name: 'Activity Reminder',
    titleTemplate: 'Upcoming: {{activity_name}}',
    bodyTemplate: '{{activity_name}} starts in {{time_until}}. {{location}}',
    priority: 6,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/activities/{{booking_id}}'
  },
  
  {
    code: 'trip_starts_soon',
    category: 'trip',
    name: 'Trip Starting Soon',
    titleTemplate: '🎉 {{trip_name}} starts in {{days}} days!',
    bodyTemplate: 'Your trip to {{destination}} is coming up. Make sure your packing list is complete!',
    priority: 4,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}'
  },
  
  {
    code: 'document_expiring',
    category: 'trip',
    name: 'Document Expiring',
    titleTemplate: '⚠️ {{document_type}} Expires Soon',
    bodyTemplate: 'Your {{document_type}} expires on {{expiry_date}}, which may not meet the entry requirements for {{destination}}.',
    priority: 8,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/profile/documents'
  },
  
  {
    code: 'visa_reminder',
    category: 'trip',
    name: 'Visa Reminder',
    titleTemplate: 'Visa Required for {{destination}}',
    bodyTemplate: 'You need a {{visa_type}} to enter {{destination}}. Apply by {{deadline}} to ensure timely processing.',
    priority: 8,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/documents'
  },
  
  // ==========================================
  // COMMUNITY ALERTS
  // ==========================================
  
  {
    code: 'group_join_request',
    category: 'community',
    name: 'Group Join Request',
    titleTemplate: 'New Join Request: {{group_name}}',
    bodyTemplate: '{{requester_name}} wants to join {{group_name}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 10,
    maxBatchSize: 20,
    batchTitleTemplate: '{{count}} new join requests',
    actionTemplate: '/community/groups/{{group_id}}/requests'
  },
  
  {
    code: 'group_join_approved',
    category: 'community',
    name: 'Group Join Approved',
    titleTemplate: 'Welcome to {{group_name}}! 🎉',
    bodyTemplate: 'Your request to join {{group_name}} has been approved.',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/groups/{{group_id}}'
  },
  
  {
    code: 'group_join_rejected',
    category: 'community',
    name: 'Group Join Rejected',
    titleTemplate: 'Join Request Update',
    bodyTemplate: 'Your request to join {{group_name}} was not approved.',
    priority: 4,
    allowedChannels: ['in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/community/discover'
  },
  
  {
    code: 'group_new_post',
    category: 'community',
    name: 'New Post in Group',
    titleTemplate: 'New in {{group_name}}',
    bodyTemplate: '{{author_name}}: {{post_preview}}',
    priority: 3,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: true,
    batchWindowMinutes: 30,
    maxBatchSize: 50,
    batchTitleTemplate: '{{count}} new posts in your groups',
    actionTemplate: '/community/groups/{{group_id}}/posts/{{post_id}}'
  },
  
  {
    code: 'post_comment',
    category: 'community',
    name: 'Comment on Your Post',
    titleTemplate: '{{commenter_name}} commented',
    bodyTemplate: '{{comment_preview}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 5,
    maxBatchSize: 10,
    batchTitleTemplate: '{{count}} new comments on your post',
    actionTemplate: '/community/groups/{{group_id}}/posts/{{post_id}}'
  },
  
  {
    code: 'post_like',
    category: 'community',
    name: 'Like on Your Post',
    titleTemplate: '{{liker_name}} liked your post',
    bodyTemplate: 'in {{group_name}}',
    priority: 2,
    allowedChannels: ['in_app'],
    defaultChannel: 'in_app',
    canBatch: true,
    batchWindowMinutes: 60,
    maxBatchSize: 100,
    batchTitleTemplate: '{{count}} people liked your post',
    actionTemplate: '/community/groups/{{group_id}}/posts/{{post_id}}'
  },
  
  {
    code: 'comment_reply',
    category: 'community',
    name: 'Reply to Your Comment',
    titleTemplate: '{{replier_name}} replied to you',
    bodyTemplate: '{{reply_preview}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 5,
    maxBatchSize: 10,
    batchTitleTemplate: '{{count}} replies to your comment',
    actionTemplate: '/community/groups/{{group_id}}/posts/{{post_id}}/comments/{{comment_id}}'
  },
  
  {
    code: 'group_mention',
    category: 'community',
    name: 'Mentioned in Group',
    titleTemplate: '{{mentioner_name}} mentioned you',
    bodyTemplate: 'in {{group_name}}: "{{mention_context}}"',
    priority: 6,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/groups/{{group_id}}/posts/{{post_id}}'
  },
  
  {
    code: 'group_admin_action',
    category: 'community',
    name: 'Admin Action in Group',
    titleTemplate: 'Update from {{group_name}}',
    bodyTemplate: '{{action_description}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/community/groups/{{group_id}}'
  },
  
  {
    code: 'group_invitation',
    category: 'community',
    name: 'Group Invitation',
    titleTemplate: 'You\'re invited to {{group_name}}',
    bodyTemplate: '{{inviter_name}} invited you to join {{group_name}}',
    priority: 6,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/groups/{{group_id}}/invite'
  },
  
  {
    code: 'buddy_request',
    category: 'community',
    name: 'Buddy Request',
    titleTemplate: 'New Buddy Request',
    bodyTemplate: '{{requester_name}} wants to be your travel buddy',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 30,
    maxBatchSize: 10,
    batchTitleTemplate: '{{count}} new buddy requests',
    actionTemplate: '/community/buddies/requests'
  },
  
  {
    code: 'buddy_accepted',
    category: 'community',
    name: 'Buddy Request Accepted',
    titleTemplate: '{{buddy_name}} is now your buddy! 🎉',
    bodyTemplate: 'You can now see each other\'s trips and travel together.',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/buddies/{{buddy_id}}'
  },
  
  // ==========================================
  // SAFETY ALERTS
  // ==========================================
  
  {
    code: 'travel_advisory',
    category: 'safety',
    name: 'Travel Advisory',
    titleTemplate: '⚠️ Travel Advisory: {{destination}}',
    bodyTemplate: '{{advisory_level}}: {{advisory_summary}}',
    priority: 9,
    allowedChannels: ['push', 'in_app', 'email', 'sms'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/safety'
  },
  
  {
    code: 'weather_alert',
    category: 'safety',
    name: 'Weather Alert',
    titleTemplate: '🌪️ Weather Alert: {{destination}}',
    bodyTemplate: '{{alert_type}}: {{alert_description}}',
    priority: 8,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/weather'
  },
  
  {
    code: 'local_incident',
    category: 'safety',
    name: 'Local Incident',
    titleTemplate: '⚠️ Incident Alert: {{location}}',
    bodyTemplate: '{{incident_type}} reported near your location. {{guidance}}',
    priority: 9,
    allowedChannels: ['push', 'in_app', 'sms'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/safety/incidents/{{incident_id}}'
  },
  
  {
    code: 'embassy_notice',
    category: 'safety',
    name: 'Embassy Notice',
    titleTemplate: '🏛️ Embassy Notice: {{country}}',
    bodyTemplate: '{{notice_summary}}',
    priority: 7,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/safety/embassy'
  },
  
  {
    code: 'health_alert',
    category: 'safety',
    name: 'Health Alert',
    titleTemplate: '🏥 Health Alert: {{destination}}',
    bodyTemplate: '{{alert_description}}',
    priority: 8,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/safety/health'
  },
  
  {
    code: 'sos_received',
    category: 'safety',
    name: 'SOS Alert Received',
    titleTemplate: '🆘 SOS from {{contact_name}}',
    bodyTemplate: '{{contact_name}} has triggered an emergency alert. Location: {{location}}',
    priority: 10,
    allowedChannels: ['push', 'sms', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/safety/sos/{{sos_id}}'
  },
  
  // ==========================================
  // FINANCIAL ALERTS
  // ==========================================
  
  {
    code: 'price_drop',
    category: 'financial',
    name: 'Price Drop',
    titleTemplate: '💰 Price Drop: {{item_name}}',
    bodyTemplate: 'Price dropped from {{old_price}} to {{new_price}} ({{discount_percent}}% off)',
    priority: 5,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 60,
    maxBatchSize: 10,
    batchTitleTemplate: '{{count}} price drops on your watchlist',
    actionTemplate: '/deals/{{deal_id}}'
  },
  
  {
    code: 'deal_expiring',
    category: 'financial',
    name: 'Deal Expiring',
    titleTemplate: '⏰ Deal Ending Soon',
    bodyTemplate: '{{deal_name}} expires in {{time_remaining}}',
    priority: 6,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/deals/{{deal_id}}'
  },
  
  {
    code: 'compensation_eligible',
    category: 'financial',
    name: 'Compensation Eligible',
    titleTemplate: '💶 You may be owed {{amount}}',
    bodyTemplate: 'Your delayed flight {{flight_number}} qualifies for {{regulation}} compensation.',
    priority: 7,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/compensation/{{claim_id}}'
  },
  
  {
    code: 'compensation_update',
    category: 'financial',
    name: 'Compensation Update',
    titleTemplate: 'Claim Update: {{flight_number}}',
    bodyTemplate: '{{update_message}}',
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/compensation/{{claim_id}}'
  },
  
  {
    code: 'budget_warning',
    category: 'financial',
    name: 'Budget Warning',
    titleTemplate: '📊 Budget Alert: {{trip_name}}',
    bodyTemplate: 'You\'ve spent {{percent_used}}% of your trip budget ({{spent}}/{{total}})',
    priority: 4,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/expenses'
  },
  
  {
    code: 'exchange_rate_alert',
    category: 'financial',
    name: 'Exchange Rate Alert',
    titleTemplate: '💱 Rate Alert: {{currency_pair}}',
    bodyTemplate: '{{from_currency}}/{{to_currency}} is now {{rate}} ({{change_direction}} {{change_percent}}%)',
    priority: 3,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: true,
    batchWindowMinutes: 60,
    maxBatchSize: 5,
    actionTemplate: '/tools/currency'
  },
  
  // ==========================================
  // SOCIAL & PROXIMITY ALERTS
  // ==========================================
  
  {
    code: 'nearby_traveler',
    category: 'social',
    name: 'Nearby Traveler',
    titleTemplate: '👋 Fellow traveler nearby',
    bodyTemplate: '{{traveler_name}} from {{traveler_origin}} is {{distance}} away in {{location}}',
    priority: 3,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: true,
    batchWindowMinutes: 60,
    maxBatchSize: 5,
    batchTitleTemplate: '{{count}} travelers nearby',
    actionTemplate: '/social/nearby/{{traveler_id}}'
  },
  
  {
    code: 'buddy_nearby',
    category: 'social',
    name: 'Buddy Nearby',
    titleTemplate: '🎉 {{buddy_name}} is nearby!',
    bodyTemplate: 'Your travel buddy is {{distance}} away in {{location}}',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/buddies/{{buddy_id}}'
  },
  
  {
    code: 'buddy_trip_overlap',
    category: 'social',
    name: 'Trip Overlap with Buddy',
    titleTemplate: '✈️ Trip overlap with {{buddy_name}}',
    bodyTemplate: 'You\'ll both be in {{destination}} from {{overlap_start}} to {{overlap_end}}',
    priority: 4,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/community/buddies/{{buddy_id}}/trips'
  },
  
  {
    code: 'meetup_suggestion',
    category: 'social',
    name: 'Meetup Suggestion',
    titleTemplate: '🍽️ Meetup suggestion',
    bodyTemplate: '{{count}} travelers from your network are in {{location}}. Meetup?',
    priority: 3,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/social/meetup/{{suggestion_id}}'
  },
  
  {
    code: 'similar_traveler_discovered',
    category: 'social',
    name: 'Similar Traveler Discovered',
    titleTemplate: '🎯 Traveler match',
    bodyTemplate: '{{traveler_name}} shares {{shared_interests}} and is also visiting {{destination}}',
    priority: 3,
    allowedChannels: ['in_app'],
    defaultChannel: 'in_app',
    canBatch: true,
    batchWindowMinutes: 120,
    maxBatchSize: 10,
    batchTitleTemplate: '{{count}} travelers match your interests',
    actionTemplate: '/social/discover/{{traveler_id}}'
  },
  
  // ==========================================
  // SYSTEM ALERTS
  // ==========================================
  
  {
    code: 'booking_confirmed',
    category: 'system',
    name: 'Booking Confirmed',
    titleTemplate: '✅ Booking Confirmed',
    bodyTemplate: 'Your {{booking_type}} has been confirmed: {{booking_summary}}',
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}'
  },
  
  {
    code: 'booking_cancelled',
    category: 'system',
    name: 'Booking Cancelled',
    titleTemplate: '❌ Booking Cancelled',
    bodyTemplate: 'Your {{booking_type}} has been cancelled: {{booking_summary}}',
    priority: 7,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}'
  },
  
  {
    code: 'trip_shared',
    category: 'system',
    name: 'Trip Shared With You',
    titleTemplate: '🌍 {{sharer_name}} shared a trip',
    bodyTemplate: 'You\'ve been added to {{trip_name}}',
    priority: 5,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}'
  },
  
  {
    code: 'trip_invite',
    category: 'system',
    name: 'Trip Invitation',
    titleTemplate: '✉️ Trip invitation from {{inviter_name}}',
    bodyTemplate: 'You\'re invited to join {{trip_name}} to {{destination}}',
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/invite/{{invite_id}}'
  },
  
  {
    code: 'app_update',
    category: 'system',
    name: 'App Update Available',
    titleTemplate: '🆕 Update Available',
    bodyTemplate: 'A new version of Guidera is available with {{feature_highlights}}',
    priority: 2,
    allowedChannels: ['in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/settings/update'
  },
  
  {
    code: 'account_security',
    category: 'system',
    name: 'Account Security Alert',
    titleTemplate: '🔐 Security Alert',
    bodyTemplate: '{{security_message}}',
    priority: 9,
    allowedChannels: ['push', 'in_app', 'email', 'sms'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/settings/security'
  },
  
  {
    code: 'welcome',
    category: 'system',
    name: 'Welcome Message',
    titleTemplate: '👋 Welcome to Guidera!',
    bodyTemplate: 'Start planning your next adventure. Tap to explore.',
    priority: 4,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/onboarding'
  }
];
```

### 2.3 Core Alert Service

```typescript
// src/services/realtime/alerts/alert.service.ts

import { Anthropic } from '@anthropic-ai/sdk';

export class AlertService {
  
  private deliveryService: DeliveryService;
  private templateEngine: TemplateEngine;
  private batchService: BatchService;
  private preferenceService: PreferenceService;
  
  /**
   * Create and dispatch a new alert
   */
  async createAlert(params: CreateAlertParams): Promise<Alert> {
    
    const {
      typeCode,
      userId,
      context,
      priority: priorityOverride,
      scheduledFor,
      channels: channelOverride
    } = params;
    
    // Step 1: Get alert type configuration
    const alertType = await this.getAlertType(typeCode);
    if (!alertType || !alertType.is_active) {
      throw new Error(`Alert type ${typeCode} not found or inactive`);
    }
    
    // Step 2: Check user preferences
    const preferences = await this.preferenceService.getUserPreferences(userId);
    
    // Check if alert category is enabled for user
    if (!this.isAlertEnabled(alertType, preferences)) {
      console.log(`Alert ${typeCode} disabled for user ${userId}`);
      return null;
    }
    
    // Step 3: Render templates
    const title = this.templateEngine.render(alertType.title_template, context);
    const body = this.templateEngine.render(alertType.body_template, context);
    const actionUrl = alertType.action_template 
      ? this.templateEngine.render(alertType.action_template, context)
      : null;
    
    // Step 4: Determine priority
    const priority = priorityOverride ?? alertType.priority_level;
    
    // Step 5: Determine channels
    const channels = this.determineChannels(alertType, preferences, channelOverride);
    
    // Step 6: Create alert record
    const alert = await db.alerts.create({
      alert_type_id: alertType.id,
      alert_type_code: typeCode,
      category_code: alertType.category_id, // Would resolve to category code
      user_id: userId,
      title,
      body,
      icon: alertType.icon,
      context,
      priority,
      channels_requested: channels,
      action_url: actionUrl,
      scheduled_for: scheduledFor,
      status: scheduledFor ? 'pending' : 'queued',
      expires_at: this.calculateExpiry(alertType)
    });
    
    // Step 7: Handle batching or immediate delivery
    if (alertType.can_batch && !priorityOverride) {
      await this.batchService.addToBatch(alert, alertType);
    } else if (!scheduledFor) {
      await this.deliveryService.deliver(alert);
    }
    
    return alert;
  }
  
  /**
   * Create alerts for multiple users (batch creation)
   */
  async createAlertForUsers(params: CreateAlertForUsersParams): Promise<Alert[]> {
    const { typeCode, userIds, context, ...rest } = params;
    
    const alerts: Alert[] = [];
    
    for (const userId of userIds) {
      try {
        const alert = await this.createAlert({
          typeCode,
          userId,
          context,
          ...rest
        });
        if (alert) alerts.push(alert);
      } catch (error) {
        console.error(`Failed to create alert for user ${userId}:`, error);
      }
    }
    
    return alerts;
  }
  
  /**
   * Determine which channels to use for delivery
   */
  private determineChannels(
    alertType: AlertType,
    preferences: UserNotificationPreferences,
    override?: string[]
  ): string[] {
    
    // If override specified, use it (filtered by allowed)
    if (override) {
      return override.filter(c => alertType.allowed_channels.includes(c));
    }
    
    // Check type-specific preferences
    const typePrefs = preferences.type_preferences?.[alertType.code];
    if (typePrefs?.channels) {
      return typePrefs.channels.filter(c => alertType.allowed_channels.includes(c));
    }
    
    // Check category preferences
    const categoryPrefs = preferences.category_preferences?.[alertType.category_code];
    if (categoryPrefs?.channels) {
      return categoryPrefs.channels.filter(c => alertType.allowed_channels.includes(c));
    }
    
    // Fall back to default channel
    return [alertType.default_channel];
  }
  
  /**
   * Check if alert is enabled for user
   */
  private isAlertEnabled(
    alertType: AlertType,
    preferences: UserNotificationPreferences
  ): boolean {
    
    // Global kill switch
    if (!preferences.notifications_enabled) {
      return false;
    }
    
    // Type-specific disable
    const typePrefs = preferences.type_preferences?.[alertType.code];
    if (typePrefs?.enabled === false) {
      return false;
    }
    
    // Category disable
    const categoryPrefs = preferences.category_preferences?.[alertType.category_code];
    if (categoryPrefs?.enabled === false) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get alerts for user (for in-app display)
   */
  async getAlertsForUser(
    userId: string,
    options: GetAlertsOptions = {}
  ): Promise<PaginatedAlerts> {
    
    const {
      status = ['delivered', 'read'],
      category,
      limit = 50,
      offset = 0,
      unreadOnly = false
    } = options;
    
    let query = db.alerts
      .where({ user_id: userId })
      .whereIn('status', status)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    if (category) {
      query = query.where({ category_code: category });
    }
    
    if (unreadOnly) {
      query = query.whereNull('read_at');
    }
    
    const alerts = await query;
    const total = await db.alerts
      .where({ user_id: userId })
      .whereIn('status', status)
      .count();
    
    return {
      alerts,
      total,
      unreadCount: await this.getUnreadCount(userId)
    };
  }
  
  /**
   * Mark alert(s) as read
   */
  async markAsRead(alertIds: string[], userId: string): Promise<void> {
    await db.alerts
      .whereIn('id', alertIds)
      .where({ user_id: userId })
      .update({
        status: 'read',
        read_at: new Date()
      });
  }
  
  /**
   * Mark all alerts as read
   */
  async markAllAsRead(userId: string, category?: string): Promise<void> {
    let query = db.alerts
      .where({ user_id: userId, status: 'delivered' });
    
    if (category) {
      query = query.where({ category_code: category });
    }
    
    await query.update({
      status: 'read',
      read_at: new Date()
    });
  }
  
  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<UnreadCounts> {
    const counts = await db.alerts
      .where({ user_id: userId, status: 'delivered' })
      .whereNull('read_at')
      .groupBy('category_code')
      .select('category_code')
      .count('* as count');
    
    const total = counts.reduce((sum, c) => sum + parseInt(c.count), 0);
    
    return {
      total,
      byCategory: Object.fromEntries(counts.map(c => [c.category_code, parseInt(c.count)]))
    };
  }
  
  /**
   * Delete old alerts (cleanup job)
   */
  async cleanupOldAlerts(daysToKeep: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    
    const deleted = await db.alerts
      .where('created_at', '<', cutoff)
      .whereIn('status', ['read', 'actioned', 'expired'])
      .delete();
    
    return deleted;
  }
}
```

---

## Part 3: Smart Delivery Engine

### 3.1 Delivery Service

```typescript
// src/services/realtime/delivery/delivery.service.ts

export class DeliveryService {
  
  private pushProvider: PushNotificationProvider;
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  
  /**
   * Deliver an alert through appropriate channels
   */
  async deliver(alert: Alert): Promise<DeliveryResult> {
    
    const results: ChannelDeliveryResult[] = [];
    const user = await db.users.findById(alert.user_id);
    const preferences = await this.getPreferences(alert.user_id);
    
    // Check quiet hours (unless critical)
    if (this.isInQuietHours(preferences) && alert.priority < 9) {
      // Reschedule for after quiet hours
      const deliverAt = this.getNextActiveTime(preferences);
      await db.alerts.update(alert.id, {
        scheduled_for: deliverAt,
        status: 'pending'
      });
      return { status: 'deferred', deliverAt };
    }
    
    // Deliver to each requested channel
    for (const channel of alert.channels_requested) {
      try {
        const result = await this.deliverToChannel(alert, channel, user);
        results.push(result);
        
        // Log delivery attempt
        await this.logDelivery(alert.id, result);
        
      } catch (error) {
        results.push({
          channel,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Update alert status
    const successfulChannels = results
      .filter(r => r.status === 'delivered')
      .map(r => r.channel);
    
    await db.alerts.update(alert.id, {
      status: successfulChannels.length > 0 ? 'delivered' : 'failed',
      channels_delivered: successfulChannels,
      delivered_at: new Date()
    });
    
    return {
      status: successfulChannels.length > 0 ? 'delivered' : 'failed',
      results
    };
  }
  
  /**
   * Deliver to specific channel
   */
  private async deliverToChannel(
    alert: Alert,
    channel: string,
    user: User
  ): Promise<ChannelDeliveryResult> {
    
    switch (channel) {
      case 'push':
        return this.deliverPush(alert, user);
        
      case 'in_app':
        return this.deliverInApp(alert, user);
        
      case 'email':
        return this.deliverEmail(alert, user);
        
      case 'sms':
        return this.deliverSMS(alert, user);
        
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }
  
  /**
   * Deliver push notification
   */
  private async deliverPush(alert: Alert, user: User): Promise<ChannelDeliveryResult> {
    
    // Get user's active devices
    const devices = await db.user_devices
      .where({ user_id: user.id, is_active: true });
    
    if (devices.length === 0) {
      return { channel: 'push', status: 'skipped', reason: 'No active devices' };
    }
    
    const pushPayload: PushPayload = {
      title: alert.title,
      body: alert.body,
      data: {
        alert_id: alert.id,
        type: alert.alert_type_code,
        action_url: alert.action_url,
        context: alert.context
      },
      badge: await this.getUnreadCount(user.id),
      sound: this.getSoundForPriority(alert.priority),
      priority: alert.priority >= 8 ? 'high' : 'normal'
    };
    
    // Add image if present
    if (alert.image_url) {
      pushPayload.image = alert.image_url;
    }
    
    // Send to all devices
    const deviceResults = await Promise.all(
      devices.map(device => this.sendToDevice(device, pushPayload))
    );
    
    const successCount = deviceResults.filter(r => r.success).length;
    
    return {
      channel: 'push',
      status: successCount > 0 ? 'delivered' : 'failed',
      devicesAttempted: devices.length,
      devicesSucceeded: successCount
    };
  }
  
  /**
   * Send push to single device
   */
  private async sendToDevice(
    device: UserDevice,
    payload: PushPayload
  ): Promise<DevicePushResult> {
    
    try {
      if (device.platform === 'ios') {
        const result = await this.pushProvider.sendAPNS(device.device_token, payload);
        return { success: true, messageId: result.messageId };
        
      } else if (device.platform === 'android') {
        const result = await this.pushProvider.sendFCM(device.device_token, payload);
        return { success: true, messageId: result.messageId };
        
      } else if (device.platform === 'web') {
        const result = await this.pushProvider.sendWebPush(device.device_token, payload);
        return { success: true, messageId: result.messageId };
      }
      
    } catch (error) {
      // Handle invalid tokens
      if (this.isInvalidTokenError(error)) {
        await db.user_devices.update(device.id, { is_active: false });
      }
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Deliver in-app notification (just mark as delivered, shown in notification center)
   */
  private async deliverInApp(alert: Alert, user: User): Promise<ChannelDeliveryResult> {
    // In-app notifications are stored in the alerts table
    // Frontend polls or uses websocket to display them
    
    // Optionally send websocket event for real-time display
    await this.websocket.emit(`user:${user.id}:notification`, {
      type: 'new_alert',
      alert: {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        icon: alert.icon,
        actionUrl: alert.action_url,
        createdAt: alert.created_at
      }
    });
    
    return { channel: 'in_app', status: 'delivered' };
  }
  
  /**
   * Deliver email notification
   */
  private async deliverEmail(alert: Alert, user: User): Promise<ChannelDeliveryResult> {
    
    if (!user.email || !user.email_verified) {
      return { channel: 'email', status: 'skipped', reason: 'No verified email' };
    }
    
    const emailTemplate = await this.getEmailTemplate(alert.alert_type_code);
    
    const result = await this.emailProvider.send({
      to: user.email,
      subject: alert.title,
      template: emailTemplate,
      data: {
        user_name: user.first_name,
        alert_title: alert.title,
        alert_body: alert.body,
        action_url: `${config.appUrl}${alert.action_url}`,
        ...alert.context
      }
    });
    
    return {
      channel: 'email',
      status: result.success ? 'delivered' : 'failed',
      messageId: result.messageId
    };
  }
  
  /**
   * Deliver SMS notification (critical alerts only)
   */
  private async deliverSMS(alert: Alert, user: User): Promise<ChannelDeliveryResult> {
    
    if (!user.phone_number || !user.phone_verified) {
      return { channel: 'sms', status: 'skipped', reason: 'No verified phone' };
    }
    
    // SMS should be concise
    const smsBody = this.truncateForSMS(`${alert.title}: ${alert.body}`);
    
    const result = await this.smsProvider.send({
      to: user.phone_number,
      body: smsBody
    });
    
    return {
      channel: 'sms',
      status: result.success ? 'delivered' : 'failed',
      messageId: result.messageId
    };
  }
  
  /**
   * Check if currently in quiet hours
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quiet_hours_enabled) return false;
    
    const now = new Date();
    const userTz = preferences.quiet_hours_timezone || 'UTC';
    const userTime = this.getTimeInZone(now, userTz);
    
    const start = this.parseTime(preferences.quiet_hours_start);
    const end = this.parseTime(preferences.quiet_hours_end);
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return userTime >= start || userTime < end;
    } else {
      return userTime >= start && userTime < end;
    }
  }
  
  /**
   * Get sound based on priority
   */
  private getSoundForPriority(priority: number): string {
    if (priority >= 9) return 'critical.wav';
    if (priority >= 7) return 'urgent.wav';
    if (priority >= 5) return 'default';
    return 'subtle.wav';
  }
}
```

### 3.2 Batching Service

```typescript
// src/services/realtime/delivery/batch.service.ts

export class BatchService {
  
  /**
   * Add alert to batch for later delivery
   */
  async addToBatch(alert: Alert, alertType: AlertType): Promise<void> {
    
    // Find existing open batch for this user/type
    let batch = await db.alert_batches
      .where({
        user_id: alert.user_id,
        alert_type_code: alert.alert_type_code,
        status: 'collecting'
      })
      .first();
    
    if (!batch) {
      // Create new batch
      batch = await db.alert_batches.create({
        user_id: alert.user_id,
        alert_type_code: alert.alert_type_code,
        alert_count: 0,
        title: '',  // Will be set on delivery
        status: 'collecting',
        deliver_at: new Date(Date.now() + alertType.batch_window_minutes * 60 * 1000),
        channels: alertType.allowed_channels
      });
    }
    
    // Update alert with batch reference
    await db.alerts.update(alert.id, {
      batch_id: batch.id,
      is_batched: true,
      status: 'batched'
    });
    
    // Increment batch count
    await db.alert_batches.update(batch.id, {
      alert_count: batch.alert_count + 1
    });
    
    // Check if max batch size reached
    if (batch.alert_count + 1 >= alertType.max_batch_size) {
      await this.deliverBatch(batch.id);
    }
  }
  
  /**
   * Deliver a batch of alerts
   */
  async deliverBatch(batchId: string): Promise<void> {
    
    const batch = await db.alert_batches.findById(batchId);
    if (!batch || batch.status !== 'collecting') return;
    
    // Get all alerts in batch
    const alerts = await db.alerts.where({ batch_id: batchId });
    
    if (alerts.length === 0) {
      await db.alert_batches.update(batchId, { status: 'cancelled' });
      return;
    }
    
    const alertType = await db.alert_types.where({ code: batch.alert_type_code }).first();
    
    // Generate batch summary
    const title = this.templateEngine.render(
      alertType.batch_title_template || '{{count}} new notifications',
      { count: alerts.length }
    );
    
    // Create summary body
    const body = this.generateBatchBody(alerts);
    
    // Create summary alert for delivery
    const summaryAlert: Alert = {
      id: `batch-${batchId}`,
      alert_type_code: batch.alert_type_code,
      category_code: alertType.category_code,
      user_id: batch.user_id,
      title,
      body,
      icon: alertType.icon,
      context: {
        batch_id: batchId,
        alert_count: alerts.length,
        alert_ids: alerts.map(a => a.id)
      },
      priority: Math.max(...alerts.map(a => a.priority)),
      channels_requested: batch.channels,
      action_url: this.getBatchActionUrl(alerts, alertType),
      status: 'queued'
    };
    
    // Deliver batch summary
    await this.deliveryService.deliver(summaryAlert);
    
    // Update batch status
    await db.alert_batches.update(batchId, {
      status: 'delivered',
      title,
      delivered_at: new Date()
    });
    
    // Mark individual alerts as delivered (via batch)
    await db.alerts
      .whereIn('id', alerts.map(a => a.id))
      .update({
        status: 'delivered',
        delivered_at: new Date()
      });
  }
  
  /**
   * Process pending batches (scheduled job)
   */
  async processPendingBatches(): Promise<void> {
    
    const pendingBatches = await db.alert_batches
      .where({ status: 'collecting' })
      .where('deliver_at', '<=', new Date());
    
    for (const batch of pendingBatches) {
      try {
        await this.deliverBatch(batch.id);
      } catch (error) {
        console.error(`Failed to deliver batch ${batch.id}:`, error);
      }
    }
  }
  
  /**
   * Generate body text for batch
   */
  private generateBatchBody(alerts: Alert[]): string {
    if (alerts.length === 1) {
      return alerts[0].body;
    }
    
    if (alerts.length <= 3) {
      return alerts.map(a => `• ${a.title}`).join('\n');
    }
    
    const preview = alerts.slice(0, 2).map(a => a.title).join(', ');
    return `${preview} and ${alerts.length - 2} more`;
  }
}
```

---

## Part 4: Real-time Data Pipelines

### 4.1 Flight Status Monitor

```typescript
// src/services/realtime/monitors/flight-status.monitor.ts

export class FlightStatusMonitor {
  
  private flightAPI: FlightDataAPI;
  private alertService: AlertService;
  private compensationService: CompensationService;
  
  /**
   * Check status of all monitored flights
   * Runs every 15 minutes for flights in next 48 hours
   * Runs every hour for flights 2-7 days out
   */
  async checkAllFlights(): Promise<void> {
    
    // Get flights to monitor (upcoming in next 7 days)
    const flights = await db.booking_flights
      .where('departure_datetime', '>', new Date())
      .where('departure_datetime', '<', addDays(new Date(), 7))
      .where('status', '!=', 'completed');
    
    for (const flight of flights) {
      try {
        await this.checkFlight(flight);
      } catch (error) {
        console.error(`Failed to check flight ${flight.id}:`, error);
      }
    }
  }
  
  /**
   * Check single flight status
   */
  async checkFlight(flight: BookingFlight): Promise<FlightStatusUpdate | null> {
    
    // Get current status from API
    const currentStatus = await this.flightAPI.getFlightStatus(
      flight.airline_code,
      flight.flight_number,
      flight.departure_datetime
    );
    
    if (!currentStatus) return null;
    
    // Compare with stored status
    const changes = this.detectChanges(flight, currentStatus);
    
    if (changes.length === 0) return null;
    
    // Update stored flight data
    await this.updateFlightRecord(flight.id, currentStatus);
    
    // Get trip and travelers for notifications
    const booking = await db.bookings.findById(flight.booking_id);
    const trip = await db.trips.findById(booking.trip_id);
    const travelers = await db.trip_travelers.where({ trip_id: trip.id });
    
    // Process each change
    for (const change of changes) {
      await this.processFlightChange(flight, change, trip, travelers);
    }
    
    return { flight, changes };
  }
  
  /**
   * Detect changes in flight status
   */
  private detectChanges(
    stored: BookingFlight,
    current: FlightAPIStatus
  ): FlightChange[] {
    
    const changes: FlightChange[] = [];
    
    // Check for delay
    if (current.departureDelay && current.departureDelay !== stored.delay_minutes) {
      changes.push({
        type: 'delay',
        oldValue: stored.delay_minutes || 0,
        newValue: current.departureDelay,
        newDepartureTime: current.estimatedDeparture
      });
    }
    
    // Check for cancellation
    if (current.status === 'cancelled' && stored.status !== 'cancelled') {
      changes.push({
        type: 'cancellation',
        reason: current.cancellationReason
      });
    }
    
    // Check for gate change
    if (current.departureGate && current.departureGate !== stored.departure_gate) {
      changes.push({
        type: 'gate_change',
        oldValue: stored.departure_gate,
        newValue: current.departureGate
      });
    }
    
    // Check for terminal change
    if (current.departureTerminal && current.departureTerminal !== stored.departure_terminal) {
      changes.push({
        type: 'terminal_change',
        oldValue: stored.departure_terminal,
        newValue: current.departureTerminal
      });
    }
    
    return changes;
  }
  
  /**
   * Process a flight change and send appropriate alerts
   */
  private async processFlightChange(
    flight: BookingFlight,
    change: FlightChange,
    trip: Trip,
    travelers: TripTraveler[]
  ): Promise<void> {
    
    const userIds = travelers
      .filter(t => t.user_id)
      .map(t => t.user_id);
    
    switch (change.type) {
      
      case 'delay':
        // Send delay notification
        await this.alertService.createAlertForUsers({
          typeCode: 'flight_delay',
          userIds,
          context: {
            trip_id: trip.id,
            booking_id: flight.booking_id,
            flight_number: `${flight.airline_code}${flight.flight_number}`,
            destination: flight.arrival_airport_name,
            delay_minutes: change.newValue,
            old_departure_time: flight.departure_datetime,
            new_departure_time: change.newDepartureTime
          }
        });
        
        // Check compensation eligibility
        if (change.newValue >= 180) {  // 3+ hour delay
          await this.checkCompensationEligibility(flight, change.newValue, trip, userIds);
        }
        break;
        
      case 'cancellation':
        // Send cancellation notification
        await this.alertService.createAlertForUsers({
          typeCode: 'flight_cancelled',
          userIds,
          context: {
            trip_id: trip.id,
            booking_id: flight.booking_id,
            flight_number: `${flight.airline_code}${flight.flight_number}`,
            destination: flight.arrival_airport_name,
            cancellation_reason: change.reason
          },
          priority: 10  // Critical
        });
        
        // Auto-create compensation claim
        await this.compensationService.createClaim(flight, 'cancellation', trip, userIds);
        break;
        
      case 'gate_change':
        await this.alertService.createAlertForUsers({
          typeCode: 'flight_gate_change',
          userIds,
          context: {
            trip_id: trip.id,
            booking_id: flight.booking_id,
            flight_number: `${flight.airline_code}${flight.flight_number}`,
            old_gate: change.oldValue || 'TBD',
            new_gate: change.newValue
          }
        });
        break;
    }
  }
  
  /**
   * Check if delay qualifies for compensation
   */
  private async checkCompensationEligibility(
    flight: BookingFlight,
    delayMinutes: number,
    trip: Trip,
    userIds: string[]
  ): Promise<void> {
    
    const eligibility = await this.compensationService.checkEligibility({
      departureAirport: flight.departure_airport_code,
      arrivalAirport: flight.arrival_airport_code,
      airline: flight.airline_code,
      delayMinutes,
      flightDate: flight.departure_datetime
    });
    
    if (eligibility.isEligible) {
      await this.alertService.createAlertForUsers({
        typeCode: 'compensation_eligible',
        userIds,
        context: {
          trip_id: trip.id,
          booking_id: flight.booking_id,
          flight_number: `${flight.airline_code}${flight.flight_number}`,
          amount: eligibility.estimatedAmount,
          currency: eligibility.currency,
          regulation: eligibility.regulation
        }
      });
    }
  }
}
```

### 4.2 Weather Monitor

```typescript
// src/services/realtime/monitors/weather.monitor.ts

export class WeatherMonitor {
  
  private weatherAPI: WeatherAPI;
  private alertService: AlertService;
  
  /**
   * Check weather for all active trips
   * Runs every 6 hours
   */
  async checkAllTrips(): Promise<void> {
    
    // Get active trips (in progress or starting within 7 days)
    const trips = await db.trips
      .where('start_date', '<=', addDays(new Date(), 7))
      .where('end_date', '>=', new Date())
      .whereIn('status', ['confirmed', 'in_progress']);
    
    for (const trip of trips) {
      try {
        await this.checkTripWeather(trip);
      } catch (error) {
        console.error(`Failed to check weather for trip ${trip.id}:`, error);
      }
    }
  }
  
  /**
   * Check weather for single trip
   */
  async checkTripWeather(trip: Trip): Promise<void> {
    
    // Get weather alerts for destination
    const alerts = await this.weatherAPI.getAlerts(
      trip.primary_destination_code
    );
    
    if (alerts.length === 0) return;
    
    // Filter to relevant alerts (affecting trip dates)
    const relevantAlerts = alerts.filter(alert => 
      this.alertAffectsTrip(alert, trip.start_date, trip.end_date)
    );
    
    if (relevantAlerts.length === 0) return;
    
    // Get existing alerts for this trip to avoid duplicates
    const existingAlerts = await db.alerts
      .where({ 
        user_id: trip.owner_id,
        alert_type_code: 'weather_alert'
      })
      .where('context', '@>', JSON.stringify({ trip_id: trip.id }))
      .where('created_at', '>', subHours(new Date(), 24));
    
    const existingAlertIds = new Set(
      existingAlerts.map(a => a.context.weather_alert_id)
    );
    
    // Get travelers
    const travelers = await db.trip_travelers.where({ trip_id: trip.id });
    const userIds = travelers.filter(t => t.user_id).map(t => t.user_id);
    
    // Send new alerts
    for (const alert of relevantAlerts) {
      if (existingAlertIds.has(alert.id)) continue;
      
      await this.alertService.createAlertForUsers({
        typeCode: 'weather_alert',
        userIds,
        context: {
          trip_id: trip.id,
          destination: trip.primary_destination_name,
          weather_alert_id: alert.id,
          alert_type: alert.type,
          alert_description: alert.description,
          severity: alert.severity,
          valid_from: alert.validFrom,
          valid_until: alert.validUntil
        },
        priority: this.getWeatherAlertPriority(alert.severity)
      });
    }
  }
  
  /**
   * Get priority based on weather severity
   */
  private getWeatherAlertPriority(severity: string): number {
    switch (severity) {
      case 'extreme': return 10;
      case 'severe': return 9;
      case 'moderate': return 7;
      case 'minor': return 5;
      default: return 5;
    }
  }
}
```

### 4.3 Safety Monitor

```typescript
// src/services/realtime/monitors/safety.monitor.ts

export class SafetyMonitor {
  
  private safetyAPI: SafetyDataAPI;
  private alertService: AlertService;
  
  /**
   * Check safety advisories for all destinations with active trips
   * Runs every hour
   */
  async checkAllDestinations(): Promise<void> {
    
    // Get unique destinations with active/upcoming trips
    const destinations = await db.trips
      .where('end_date', '>=', new Date())
      .whereIn('status', ['confirmed', 'in_progress'])
      .distinct('primary_destination_country');
    
    for (const destination of destinations) {
      try {
        await this.checkDestinationSafety(destination.primary_destination_country);
      } catch (error) {
        console.error(`Failed to check safety for ${destination}:`, error);
      }
    }
  }
  
  /**
   * Check safety for specific destination
   */
  async checkDestinationSafety(countryCode: string): Promise<void> {
    
    // Get latest advisories
    const advisories = await this.safetyAPI.getAdvisories(countryCode);
    
    // Get stored advisory level
    const stored = await db.destination_safety
      .where({ country_code: countryCode })
      .first();
    
    // Check for advisory level change
    if (!stored || this.hasAdvisoryChanged(stored, advisories)) {
      
      // Update stored data
      await this.updateStoredSafety(countryCode, advisories);
      
      // Get affected trips and users
      const trips = await db.trips
        .where({ primary_destination_country: countryCode })
        .where('end_date', '>=', new Date())
        .whereIn('status', ['confirmed', 'in_progress']);
      
      for (const trip of trips) {
        const travelers = await db.trip_travelers.where({ trip_id: trip.id });
        const userIds = travelers.filter(t => t.user_id).map(t => t.user_id);
        
        // Determine which advisories are new/elevated
        const newAdvisories = this.getNewOrElevatedAdvisories(stored, advisories);
        
        for (const advisory of newAdvisories) {
          await this.alertService.createAlertForUsers({
            typeCode: 'travel_advisory',
            userIds,
            context: {
              trip_id: trip.id,
              destination: trip.primary_destination_name,
              advisory_level: advisory.level,
              advisory_summary: advisory.summary,
              advisory_source: advisory.source,
              issued_at: advisory.issuedAt,
              details_url: advisory.detailsUrl
            },
            priority: this.getAdvisoryPriority(advisory.level)
          });
        }
      }
    }
  }
  
  /**
   * Check for local incidents near travelers
   */
  async checkLocalIncidents(
    userId: string,
    location: { lat: number; lng: number }
  ): Promise<void> {
    
    // Get recent incidents within 10km
    const incidents = await this.safetyAPI.getNearbyIncidents(
      location.lat,
      location.lng,
      10  // km radius
    );
    
    if (incidents.length === 0) return;
    
    // Filter to significant incidents
    const significant = incidents.filter(i => 
      ['high', 'critical'].includes(i.severity) &&
      i.reportedAt > subHours(new Date(), 2)  // Last 2 hours
    );
    
    for (const incident of significant) {
      // Check if already notified
      const existing = await db.alerts
        .where({ user_id: userId, alert_type_code: 'local_incident' })
        .where('context', '@>', JSON.stringify({ incident_id: incident.id }))
        .first();
      
      if (existing) continue;
      
      await this.alertService.createAlert({
        typeCode: 'local_incident',
        userId,
        context: {
          incident_id: incident.id,
          incident_type: incident.type,
          location: incident.location,
          distance_km: incident.distanceKm,
          guidance: incident.guidance
        },
        priority: incident.severity === 'critical' ? 10 : 8
      });
    }
  }
  
  /**
   * Get priority based on advisory level
   */
  private getAdvisoryPriority(level: string): number {
    switch (level) {
      case 'do_not_travel': return 10;
      case 'reconsider_travel': return 9;
      case 'exercise_increased_caution': return 7;
      case 'exercise_normal_precautions': return 5;
      default: return 5;
    }
  }
}
```

### 4.4 Price Monitor

```typescript
// src/services/realtime/monitors/price.monitor.ts

export class PriceMonitor {
  
  private dealAPI: DealAggregatorAPI;
  private alertService: AlertService;
  
  /**
   * Check prices for all watched items
   * Runs every 4 hours
   */
  async checkAllWatchedItems(): Promise<void> {
    
    // Get all active price watches
    const watches = await db.price_watches
      .where({ is_active: true })
      .where('expires_at', '>', new Date());
    
    for (const watch of watches) {
      try {
        await this.checkPrice(watch);
      } catch (error) {
        console.error(`Failed to check price for watch ${watch.id}:`, error);
      }
    }
  }
  
  /**
   * Check price for single watch
   */
  async checkPrice(watch: PriceWatch): Promise<void> {
    
    // Get current price
    const currentPrice = await this.dealAPI.getPrice(
      watch.item_type,
      watch.item_id,
      watch.search_params
    );
    
    if (!currentPrice) return;
    
    // Compare with watched price
    const priceDiff = watch.last_price - currentPrice.amount;
    const percentDrop = (priceDiff / watch.last_price) * 100;
    
    // Update last checked
    await db.price_watches.update(watch.id, {
      last_checked_at: new Date(),
      last_price: currentPrice.amount
    });
    
    // Check if meets threshold
    if (priceDiff <= 0) return;  // Price increased or same
    
    // Check if meets user's threshold
    if (watch.threshold_type === 'percent' && percentDrop < watch.threshold_value) {
      return;
    }
    if (watch.threshold_type === 'amount' && priceDiff < watch.threshold_value) {
      return;
    }
    
    // Send price drop alert
    await this.alertService.createAlert({
      typeCode: 'price_drop',
      userId: watch.user_id,
      context: {
        deal_id: watch.item_id,
        item_name: watch.item_name,
        item_type: watch.item_type,
        old_price: `${watch.currency}${watch.last_price}`,
        new_price: `${watch.currency}${currentPrice.amount}`,
        discount_amount: `${watch.currency}${priceDiff.toFixed(2)}`,
        discount_percent: `${percentDrop.toFixed(0)}`,
        booking_url: currentPrice.bookingUrl
      }
    });
    
    // Optionally disable watch after alerting
    if (watch.alert_once) {
      await db.price_watches.update(watch.id, { is_active: false });
    }
  }
}
```

---

## Part 5: Social & Proximity System

### 5.1 Proximity Detection Service

```typescript
// src/services/realtime/social/proximity.service.ts

export class ProximityService {
  
  private alertService: AlertService;
  private userService: UserService;
  
  /**
   * Process location update and check for nearby travelers
   */
  async processLocationUpdate(
    userId: string,
    location: GeoLocation
  ): Promise<void> {
    
    // Update user's current location
    await db.user_locations.upsert({
      user_id: userId,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      updated_at: new Date()
    });
    
    // Get user's preferences for proximity alerts
    const preferences = await this.userService.getProximityPreferences(userId);
    if (!preferences.enabled) return;
    
    // Check for nearby buddies (travel buddies)
    await this.checkNearbyBuddies(userId, location, preferences);
    
    // Check for nearby similar travelers (if opted in)
    if (preferences.discoverNearby) {
      await this.checkNearbySimilarTravelers(userId, location, preferences);
    }
  }
  
  /**
   * Check for nearby travel buddies
   */
  async checkNearbyBuddies(
    userId: string,
    location: GeoLocation,
    preferences: ProximityPreferences
  ): Promise<void> {
    
    // Get user's buddies
    const buddies = await db.travel_buddies
      .where({ user_id: userId, status: 'accepted' });
    
    if (buddies.length === 0) return;
    
    const buddyIds = buddies.map(b => b.buddy_id);
    
    // Find buddies with recent location updates
    const nearbyBuddies = await db.user_locations
      .whereIn('user_id', buddyIds)
      .where('updated_at', '>', subHours(new Date(), 1))  // Active in last hour
      .whereRaw(`
        ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `, [location.lng, location.lat, preferences.buddyRadiusMeters || 5000]);  // 5km default
    
    for (const nearbyBuddy of nearbyBuddies) {
      // Check if already notified recently
      const recentAlert = await db.alerts
        .where({
          user_id: userId,
          alert_type_code: 'buddy_nearby'
        })
        .where('context', '@>', JSON.stringify({ buddy_id: nearbyBuddy.user_id }))
        .where('created_at', '>', subHours(new Date(), 24))
        .first();
      
      if (recentAlert) continue;
      
      // Get buddy details
      const buddy = await db.users.findById(nearbyBuddy.user_id);
      const distance = this.calculateDistance(location, {
        lat: nearbyBuddy.latitude,
        lng: nearbyBuddy.longitude
      });
      
      // Get location name
      const locationName = await this.reverseGeocode(location);
      
      await this.alertService.createAlert({
        typeCode: 'buddy_nearby',
        userId,
        context: {
          buddy_id: buddy.id,
          buddy_name: buddy.first_name,
          distance: this.formatDistance(distance),
          location: locationName
        }
      });
      
      // Also notify the buddy
      await this.alertService.createAlert({
        typeCode: 'buddy_nearby',
        userId: buddy.id,
        context: {
          buddy_id: userId,
          buddy_name: (await db.users.findById(userId)).first_name,
          distance: this.formatDistance(distance),
          location: locationName
        }
      });
    }
  }
  
  /**
   * Check for nearby similar travelers
   */
  async checkNearbySimilarTravelers(
    userId: string,
    location: GeoLocation,
    preferences: ProximityPreferences
  ): Promise<void> {
    
    const user = await db.users.findById(userId);
    
    // Find nearby users who are also opted in
    const nearbyUsers = await db.user_locations
      .join('users', 'user_locations.user_id', 'users.id')
      .join('user_preferences', 'users.id', 'user_preferences.user_id')
      .where('user_locations.updated_at', '>', subHours(new Date(), 1))
      .where('user_preferences.discover_nearby', true)
      .where('users.id', '!=', userId)
      .whereRaw(`
        ST_DWithin(
          ST_MakePoint(user_locations.longitude, user_locations.latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `, [location.lng, location.lat, preferences.discoveryRadiusMeters || 10000]);  // 10km default
    
    // Filter by similarity
    const similarTravelers = [];
    
    for (const nearby of nearbyUsers) {
      const similarity = await this.calculateSimilarity(user, nearby);
      
      if (similarity.score >= 0.6) {  // 60% similarity threshold
        similarTravelers.push({
          ...nearby,
          similarity
        });
      }
    }
    
    // Limit to top 3
    const topMatches = similarTravelers
      .sort((a, b) => b.similarity.score - a.similarity.score)
      .slice(0, 3);
    
    for (const match of topMatches) {
      // Check if already notified
      const recentAlert = await db.alerts
        .where({
          user_id: userId,
          alert_type_code: 'nearby_traveler'
        })
        .where('context', '@>', JSON.stringify({ traveler_id: match.id }))
        .where('created_at', '>', subHours(new Date(), 48))
        .first();
      
      if (recentAlert) continue;
      
      const distance = this.calculateDistance(location, {
        lat: match.latitude,
        lng: match.longitude
      });
      
      const locationName = await this.reverseGeocode(location);
      
      await this.alertService.createAlert({
        typeCode: 'nearby_traveler',
        userId,
        context: {
          traveler_id: match.id,
          traveler_name: match.first_name,
          traveler_origin: match.nationality,
          distance: this.formatDistance(distance),
          location: locationName,
          shared_interests: match.similarity.sharedInterests.join(', ')
        }
      });
    }
  }
  
  /**
   * Calculate similarity between two users
   */
  async calculateSimilarity(
    user1: User,
    user2: User
  ): Promise<SimilarityResult> {
    
    let score = 0;
    const sharedInterests: string[] = [];
    
    // Same nationality bonus
    if (user1.nationality === user2.nationality) {
      score += 0.3;
    }
    
    // Shared interests
    const interests1 = new Set(user1.interests || []);
    const interests2 = new Set(user2.interests || []);
    const shared = [...interests1].filter(i => interests2.has(i));
    
    if (shared.length > 0) {
      score += Math.min(0.4, shared.length * 0.1);
      sharedInterests.push(...shared);
    }
    
    // Similar age range (within 10 years)
    if (user1.age && user2.age && Math.abs(user1.age - user2.age) <= 10) {
      score += 0.1;
    }
    
    // Same language
    const languages1 = new Set(user1.languages_spoken || []);
    const languages2 = new Set(user2.languages_spoken || []);
    const sharedLanguages = [...languages1].filter(l => languages2.has(l));
    
    if (sharedLanguages.length > 0) {
      score += 0.2;
    }
    
    return {
      score: Math.min(1, score),
      sharedInterests
    };
  }
}
```

### 5.2 Trip Overlap Detection

```typescript
// src/services/realtime/social/trip-overlap.service.ts

export class TripOverlapService {
  
  /**
   * Check for trip overlaps when a new trip is created/confirmed
   */
  async checkOverlapsForTrip(trip: Trip): Promise<void> {
    
    // Get user's buddies
    const buddies = await db.travel_buddies
      .where({ user_id: trip.owner_id, status: 'accepted' });
    
    if (buddies.length === 0) return;
    
    const buddyIds = buddies.map(b => b.buddy_id);
    
    // Find buddy trips that overlap
    const overlappingTrips = await db.trips
      .whereIn('owner_id', buddyIds)
      .where('primary_destination_code', trip.primary_destination_code)
      .where('start_date', '<=', trip.end_date)
      .where('end_date', '>=', trip.start_date)
      .whereIn('status', ['confirmed', 'in_progress']);
    
    for (const buddyTrip of overlappingTrips) {
      // Calculate overlap period
      const overlapStart = new Date(Math.max(
        new Date(trip.start_date).getTime(),
        new Date(buddyTrip.start_date).getTime()
      ));
      const overlapEnd = new Date(Math.min(
        new Date(trip.end_date).getTime(),
        new Date(buddyTrip.end_date).getTime()
      ));
      
      const buddy = await db.users.findById(buddyTrip.owner_id);
      
      // Notify the user
      await this.alertService.createAlert({
        typeCode: 'buddy_trip_overlap',
        userId: trip.owner_id,
        context: {
          buddy_id: buddy.id,
          buddy_name: buddy.first_name,
          destination: trip.primary_destination_name,
          overlap_start: overlapStart.toISOString(),
          overlap_end: overlapEnd.toISOString(),
          buddy_trip_id: buddyTrip.id
        }
      });
      
      // Notify the buddy
      const user = await db.users.findById(trip.owner_id);
      
      await this.alertService.createAlert({
        typeCode: 'buddy_trip_overlap',
        userId: buddy.id,
        context: {
          buddy_id: user.id,
          buddy_name: user.first_name,
          destination: trip.primary_destination_name,
          overlap_start: overlapStart.toISOString(),
          overlap_end: overlapEnd.toISOString(),
          buddy_trip_id: trip.id
        }
      });
    }
  }
}
```

---

## Part 6: SOS Emergency System

### 6.1 SOS Service

```typescript
// src/services/realtime/sos/sos.service.ts

export class SOSService {
  
  private alertService: AlertService;
  private smsProvider: SMSProvider;
  private callProvider: CallProvider;
  
  /**
   * Trigger SOS emergency alert
   */
  async triggerSOS(
    userId: string,
    location: GeoLocation,
    options: SOSTriggerOptions = {}
  ): Promise<SOSRecord> {
    
    const user = await db.users.findById(userId);
    const emergencyContacts = await this.getEmergencyContacts(userId);
    
    // Create SOS record
    const sos = await db.sos_alerts.create({
      user_id: userId,
      status: 'active',
      triggered_at: new Date(),
      location: {
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy
      },
      location_name: await this.reverseGeocode(location),
      message: options.message || null,
      alert_type: options.type || 'general',  // 'general', 'medical', 'security'
      contacts_notified: []
    });
    
    // Get destination info if on active trip
    const activeTrip = await this.getActiveTrip(userId, location);
    const emergencyNumbers = activeTrip 
      ? await this.getLocalEmergencyNumbers(activeTrip.primary_destination_country)
      : null;
    
    // Notify emergency contacts
    const notificationResults = await this.notifyEmergencyContacts(
      sos,
      user,
      emergencyContacts,
      location,
      emergencyNumbers
    );
    
    // Update SOS record with notification results
    await db.sos_alerts.update(sos.id, {
      contacts_notified: notificationResults
    });
    
    // Return SOS info with emergency numbers
    return {
      ...sos,
      emergencyNumbers,
      contactsNotified: notificationResults.filter(r => r.success).length,
      contactsFailed: notificationResults.filter(r => !r.success).length
    };
  }
  
  /**
   * Notify all emergency contacts
   */
  async notifyEmergencyContacts(
    sos: SOSAlert,
    user: User,
    contacts: EmergencyContact[],
    location: GeoLocation,
    emergencyNumbers: EmergencyNumbers | null
  ): Promise<NotificationResult[]> {
    
    const results: NotificationResult[] = [];
    const locationUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    const locationName = await this.reverseGeocode(location);
    
    for (const contact of contacts) {
      try {
        // Send SMS
        if (contact.phone) {
          const smsResult = await this.smsProvider.send({
            to: contact.phone,
            body: this.buildSOSMessage(user, locationName, locationUrl, sos.message)
          });
          
          results.push({
            contact_id: contact.id,
            contact_name: contact.name,
            channel: 'sms',
            success: smsResult.success,
            messageId: smsResult.messageId
          });
        }
        
        // Send email if has email
        if (contact.email) {
          await this.emailProvider.send({
            to: contact.email,
            subject: `🆘 EMERGENCY: ${user.first_name} needs help`,
            template: 'sos_alert',
            data: {
              user_name: user.first_name,
              location_name: locationName,
              location_url: locationUrl,
              message: sos.message,
              time: new Date().toISOString(),
              emergency_numbers: emergencyNumbers
            }
          });
          
          results.push({
            contact_id: contact.id,
            contact_name: contact.name,
            channel: 'email',
            success: true
          });
        }
        
        // If contact is also a Guidera user, send push notification
        const contactUser = await db.users.where({ phone_number: contact.phone }).first();
        if (contactUser) {
          await this.alertService.createAlert({
            typeCode: 'sos_received',
            userId: contactUser.id,
            context: {
              sos_id: sos.id,
              contact_name: `${user.first_name} ${user.last_name}`,
              location: locationName,
              location_url: locationUrl,
              message: sos.message
            },
            priority: 10  // Critical
          });
        }
        
      } catch (error) {
        console.error(`Failed to notify contact ${contact.id}:`, error);
        results.push({
          contact_id: contact.id,
          contact_name: contact.name,
          channel: 'all',
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Build SOS message
   */
  private buildSOSMessage(
    user: User,
    locationName: string,
    locationUrl: string,
    customMessage?: string
  ): string {
    let message = `🆘 EMERGENCY ALERT\n\n${user.first_name} ${user.last_name} has triggered an SOS.\n\nLocation: ${locationName}\nMap: ${locationUrl}\nTime: ${new Date().toLocaleString()}`;
    
    if (customMessage) {
      message += `\n\nMessage: ${customMessage}`;
    }
    
    message += `\n\nPlease try to contact them immediately.`;
    
    return message;
  }
  
  /**
   * Update SOS location (continuous tracking)
   */
  async updateSOSLocation(
    sosId: string,
    location: GeoLocation
  ): Promise<void> {
    
    const sos = await db.sos_alerts.findById(sosId);
    if (!sos || sos.status !== 'active') return;
    
    // Log location update
    await db.sos_location_history.create({
      sos_id: sosId,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      recorded_at: new Date()
    });
    
    // Update current location
    await db.sos_alerts.update(sosId, {
      location: {
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy
      }
    });
  }
  
  /**
   * Deactivate SOS (user is safe)
   */
  async deactivateSOS(
    sosId: string,
    userId: string,
    resolution: string = 'user_cancelled'
  ): Promise<void> {
    
    const sos = await db.sos_alerts.findById(sosId);
    if (!sos || sos.user_id !== userId) return;
    
    await db.sos_alerts.update(sosId, {
      status: 'resolved',
      resolved_at: new Date(),
      resolution
    });
    
    // Notify emergency contacts that user is safe
    const user = await db.users.findById(userId);
    const contacts = await this.getEmergencyContacts(userId);
    
    for (const contact of contacts) {
      if (contact.phone) {
        await this.smsProvider.send({
          to: contact.phone,
          body: `✅ ${user.first_name} has marked themselves as safe. The emergency alert has been cancelled.`
        });
      }
    }
  }
  
  /**
   * Get local emergency numbers for destination
   */
  async getLocalEmergencyNumbers(countryCode: string): Promise<EmergencyNumbers> {
    
    const destination = await db.destination_data
      .where({ country_code: countryCode })
      .first();
    
    return {
      police: destination?.emergency_police || '911',
      ambulance: destination?.emergency_ambulance || '911',
      fire: destination?.emergency_fire || '911',
      touristPolice: destination?.tourist_police || null,
      embassy: await this.getEmbassyNumber(countryCode)
    };
  }
}
```

---

## Part 7: Community Alert Handlers

### 7.1 Community Event Handlers

```typescript
// src/services/realtime/community/community-alerts.service.ts

export class CommunityAlertService {
  
  private alertService: AlertService;
  
  /**
   * Handle new group join request
   */
  async onJoinRequest(request: GroupJoinRequest): Promise<void> {
    
    const group = await db.groups.findById(request.group_id);
    const requester = await db.users.findById(request.user_id);
    
    // Notify group admins
    const admins = await db.group_members
      .where({ group_id: group.id, role: 'admin' });
    
    const adminIds = admins.map(a => a.user_id);
    
    await this.alertService.createAlertForUsers({
      typeCode: 'group_join_request',
      userIds: adminIds,
      context: {
        group_id: group.id,
        group_name: group.name,
        requester_name: requester.first_name,
        requester_id: requester.id,
        request_id: request.id
      }
    });
  }
  
  /**
   * Handle join request decision
   */
  async onJoinRequestDecision(
    request: GroupJoinRequest,
    approved: boolean
  ): Promise<void> {
    
    const group = await db.groups.findById(request.group_id);
    
    await this.alertService.createAlert({
      typeCode: approved ? 'group_join_approved' : 'group_join_rejected',
      userId: request.user_id,
      context: {
        group_id: group.id,
        group_name: group.name
      }
    });
  }
  
  /**
   * Handle new post in group
   */
  async onNewPost(post: GroupPost): Promise<void> {
    
    const group = await db.groups.findById(post.group_id);
    const author = await db.users.findById(post.user_id);
    
    // Get group members who want notifications
    const members = await db.group_members
      .where({ group_id: group.id })
      .where('notifications_enabled', true)
      .where('user_id', '!=', post.user_id);
    
    const memberIds = members.map(m => m.user_id);
    
    await this.alertService.createAlertForUsers({
      typeCode: 'group_new_post',
      userIds: memberIds,
      context: {
        group_id: group.id,
        group_name: group.name,
        post_id: post.id,
        author_name: author.first_name,
        post_preview: this.truncate(post.content, 100)
      }
    });
  }
  
  /**
   * Handle new comment on post
   */
  async onNewComment(comment: PostComment): Promise<void> {
    
    const post = await db.group_posts.findById(comment.post_id);
    const commenter = await db.users.findById(comment.user_id);
    const group = await db.groups.findById(post.group_id);
    
    // Notify post author (if not self-comment)
    if (post.user_id !== comment.user_id) {
      await this.alertService.createAlert({
        typeCode: 'post_comment',
        userId: post.user_id,
        context: {
          group_id: group.id,
          group_name: group.name,
          post_id: post.id,
          comment_id: comment.id,
          commenter_name: commenter.first_name,
          comment_preview: this.truncate(comment.content, 100)
        }
      });
    }
    
    // Notify other commenters (if they opted in)
    const otherCommenters = await db.post_comments
      .where({ post_id: post.id })
      .whereNot({ user_id: comment.user_id })
      .whereNot({ user_id: post.user_id })
      .distinct('user_id');
    
    for (const otherCommenter of otherCommenters) {
      await this.alertService.createAlert({
        typeCode: 'comment_reply',
        userId: otherCommenter.user_id,
        context: {
          group_id: group.id,
          group_name: group.name,
          post_id: post.id,
          comment_id: comment.id,
          replier_name: commenter.first_name,
          reply_preview: this.truncate(comment.content, 100)
        }
      });
    }
  }
  
  /**
   * Handle post like
   */
  async onPostLike(like: PostLike): Promise<void> {
    
    const post = await db.group_posts.findById(like.post_id);
    const liker = await db.users.findById(like.user_id);
    const group = await db.groups.findById(post.group_id);
    
    // Don't notify for self-likes
    if (post.user_id === like.user_id) return;
    
    await this.alertService.createAlert({
      typeCode: 'post_like',
      userId: post.user_id,
      context: {
        group_id: group.id,
        group_name: group.name,
        post_id: post.id,
        liker_name: liker.first_name
      }
    });
  }
  
  /**
   * Handle mention in post or comment
   */
  async onMention(
    mentionedUserId: string,
    mentionerId: string,
    content: string,
    postId: string
  ): Promise<void> {
    
    const post = await db.group_posts.findById(postId);
    const mentioner = await db.users.findById(mentionerId);
    const group = await db.groups.findById(post.group_id);
    
    await this.alertService.createAlert({
      typeCode: 'group_mention',
      userId: mentionedUserId,
      context: {
        group_id: group.id,
        group_name: group.name,
        post_id: postId,
        mentioner_name: mentioner.first_name,
        mention_context: this.truncate(content, 100)
      }
    });
  }
  
  /**
   * Handle buddy request
   */
  async onBuddyRequest(request: BuddyRequest): Promise<void> {
    
    const requester = await db.users.findById(request.requester_id);
    
    await this.alertService.createAlert({
      typeCode: 'buddy_request',
      userId: request.target_id,
      context: {
        request_id: request.id,
        requester_name: requester.first_name,
        requester_id: requester.id
      }
    });
  }
  
  /**
   * Handle buddy request accepted
   */
  async onBuddyAccepted(buddyship: TravelBuddy): Promise<void> {
    
    const accepter = await db.users.findById(buddyship.buddy_id);
    
    await this.alertService.createAlert({
      typeCode: 'buddy_accepted',
      userId: buddyship.user_id,
      context: {
        buddy_id: accepter.id,
        buddy_name: accepter.first_name
      }
    });
  }
}
```

---

## Part 8: Module System (Extensibility)

### 8.1 Module Interface

```typescript
// src/services/realtime/modules/module.interface.ts

/**
 * Interface for alert modules
 * New features can add their own alert modules that plug into the system
 */
export interface AlertModule {
  
  /**
   * Unique module code
   */
  code: string;
  
  /**
   * Human-readable name
   */
  name: string;
  
  /**
   * Module description
   */
  description: string;
  
  /**
   * Alert types this module provides
   */
  alertTypes: AlertTypeDefinition[];
  
  /**
   * Initialize module (register event handlers, etc.)
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup module
   */
  shutdown(): Promise<void>;
  
  /**
   * Check if module is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Module registry - manages all alert modules
 */
export class ModuleRegistry {
  
  private modules: Map<string, AlertModule> = new Map();
  
  /**
   * Register a new module
   */
  async register(module: AlertModule): Promise<void> {
    
    if (this.modules.has(module.code)) {
      throw new Error(`Module ${module.code} already registered`);
    }
    
    // Register alert types
    for (const alertType of module.alertTypes) {
      await db.alert_types.upsert({
        ...alertType,
        module_code: module.code
      });
    }
    
    // Initialize module
    await module.initialize();
    
    this.modules.set(module.code, module);
    console.log(`Module ${module.code} registered successfully`);
  }
  
  /**
   * Unregister a module
   */
  async unregister(moduleCode: string): Promise<void> {
    
    const module = this.modules.get(moduleCode);
    if (!module) return;
    
    await module.shutdown();
    this.modules.delete(moduleCode);
  }
  
  /**
   * Get all registered modules
   */
  getAll(): AlertModule[] {
    return Array.from(this.modules.values());
  }
  
  /**
   * Get module by code
   */
  get(code: string): AlertModule | undefined {
    return this.modules.get(code);
  }
  
  /**
   * Run health check on all modules
   */
  async healthCheck(): Promise<ModuleHealth[]> {
    const results: ModuleHealth[] = [];
    
    for (const [code, module] of this.modules) {
      try {
        const healthy = await module.healthCheck();
        results.push({ code, healthy, error: null });
      } catch (error) {
        results.push({ code, healthy: false, error: error.message });
      }
    }
    
    return results;
  }
}
```

### 8.2 Example: Creating a New Module

```typescript
// src/services/realtime/modules/loyalty.module.ts

/**
 * Example: Loyalty Points Module
 * Demonstrates how to add new alert types to the system
 */
export class LoyaltyModule implements AlertModule {
  
  code = 'loyalty';
  name = 'Loyalty Points';
  description = 'Alerts related to loyalty points and rewards';
  
  alertTypes: AlertTypeDefinition[] = [
    {
      code: 'points_earned',
      category: 'financial',
      name: 'Points Earned',
      titleTemplate: '🎯 You earned {{points}} points!',
      bodyTemplate: 'You now have {{total_points}} points. {{next_reward_message}}',
      priority: 3,
      allowedChannels: ['push', 'in_app'],
      defaultChannel: 'in_app',
      canBatch: true,
      batchWindowMinutes: 60,
      maxBatchSize: 10,
      batchTitleTemplate: 'You earned {{total_points}} points today',
      actionTemplate: '/rewards'
    },
    {
      code: 'reward_unlocked',
      category: 'financial',
      name: 'Reward Unlocked',
      titleTemplate: '🎉 Reward Unlocked!',
      bodyTemplate: 'You\'ve unlocked: {{reward_name}}. Tap to claim.',
      priority: 6,
      allowedChannels: ['push', 'in_app', 'email'],
      defaultChannel: 'push',
      canBatch: false,
      actionTemplate: '/rewards/{{reward_id}}'
    },
    {
      code: 'points_expiring',
      category: 'financial',
      name: 'Points Expiring',
      titleTemplate: '⏰ Points expiring soon',
      bodyTemplate: '{{expiring_points}} points expire on {{expiry_date}}. Use them before they\'re gone!',
      priority: 5,
      allowedChannels: ['push', 'in_app', 'email'],
      defaultChannel: 'push',
      canBatch: false,
      actionTemplate: '/rewards'
    }
  ];
  
  async initialize(): Promise<void> {
    // Set up event listeners
    EventBus.on('booking:completed', this.onBookingCompleted.bind(this));
    EventBus.on('points:expiry_approaching', this.onPointsExpiring.bind(this));
  }
  
  async shutdown(): Promise<void> {
    EventBus.off('booking:completed', this.onBookingCompleted);
    EventBus.off('points:expiry_approaching', this.onPointsExpiring);
  }
  
  async healthCheck(): Promise<boolean> {
    return true;
  }
  
  private async onBookingCompleted(booking: Booking): Promise<void> {
    // Calculate points earned
    const points = this.calculatePoints(booking);
    
    // Get user's total points
    const user = await db.users.findById(booking.user_id);
    const totalPoints = user.loyalty_points + points;
    
    // Update user points
    await db.users.update(user.id, { loyalty_points: totalPoints });
    
    // Check for reward unlocks
    const unlockedReward = await this.checkRewardUnlock(totalPoints);
    
    // Send points earned alert
    await AlertService.createAlert({
      typeCode: 'points_earned',
      userId: user.id,
      context: {
        points,
        total_points: totalPoints,
        next_reward_message: this.getNextRewardMessage(totalPoints)
      }
    });
    
    // Send reward unlocked alert if applicable
    if (unlockedReward) {
      await AlertService.createAlert({
        typeCode: 'reward_unlocked',
        userId: user.id,
        context: {
          reward_id: unlockedReward.id,
          reward_name: unlockedReward.name
        }
      });
    }
  }
  
  private async onPointsExpiring(data: { userId: string; points: number; expiryDate: Date }): Promise<void> {
    await AlertService.createAlert({
      typeCode: 'points_expiring',
      userId: data.userId,
      context: {
        expiring_points: data.points,
        expiry_date: data.expiryDate.toLocaleDateString()
      }
    });
  }
}
```

---

## Part 9: Scheduled Jobs

### 9.1 Alert System Jobs

```typescript
// src/jobs/realtime-jobs.ts

// Process pending batches every minute
schedule('* * * * *', async () => {
  await BatchService.processPendingBatches();
});

// Process scheduled alerts every minute
schedule('* * * * *', async () => {
  const pendingAlerts = await db.alerts
    .where({ status: 'pending' })
    .where('scheduled_for', '<=', new Date());
  
  for (const alert of pendingAlerts) {
    await DeliveryService.deliver(alert);
  }
});

// Check flight statuses every 15 minutes
schedule('*/15 * * * *', async () => {
  await FlightStatusMonitor.checkAllFlights();
});

// Check weather for active trips every 6 hours
schedule('0 */6 * * *', async () => {
  await WeatherMonitor.checkAllTrips();
});

// Check safety advisories every hour
schedule('0 * * * *', async () => {
  await SafetyMonitor.checkAllDestinations();
});

// Check prices every 4 hours
schedule('0 */4 * * *', async () => {
  await PriceMonitor.checkAllWatchedItems();
});

// Check trip overlaps daily
schedule('0 9 * * *', async () => {
  // For newly confirmed trips
  const recentTrips = await db.trips
    .where('confirmed_at', '>', subDays(new Date(), 1))
    .where({ status: 'confirmed' });
  
  for (const trip of recentTrips) {
    await TripOverlapService.checkOverlapsForTrip(trip);
  }
});

// Clean up old alerts weekly
schedule('0 0 * * 0', async () => {
  const deleted = await AlertService.cleanupOldAlerts(90);
  console.log(`Cleaned up ${deleted} old alerts`);
});

// Send trip reminders daily at 9 AM user time
schedule('0 * * * *', async () => {
  // Get trips starting in 7, 3, 1 days
  const reminderDays = [7, 3, 1];
  
  for (const days of reminderDays) {
    const targetDate = addDays(new Date(), days);
    const trips = await db.trips
      .whereRaw('DATE(start_date) = DATE(?)', [targetDate])
      .where({ status: 'confirmed' });
    
    for (const trip of trips) {
      const owner = await db.users.findById(trip.owner_id);
      
      // Check if it's 9 AM in user's timezone
      if (isTimeInUserTimezone(owner.timezone, 9, 0)) {
        await AlertService.createAlert({
          typeCode: 'trip_starts_soon',
          userId: owner.id,
          context: {
            trip_id: trip.id,
            trip_name: trip.name,
            destination: trip.primary_destination_name,
            days
          }
        });
      }
    }
  }
});

// Document expiry check daily
schedule('0 10 * * *', async () => {
  // Passport expiring within 6 months
  const usersWithExpiringPassports = await db.users
    .whereNotNull('passport_expiry')
    .where('passport_expiry', '<', addMonths(new Date(), 6))
    .where('passport_expiry', '>', new Date());
  
  for (const user of usersWithExpiringPassports) {
    // Check if they have upcoming international trips
    const upcomingTrips = await db.trips
      .where({ owner_id: user.id })
      .where('start_date', '>', new Date())
      .where({ status: 'confirmed' });
    
    if (upcomingTrips.length > 0) {
      await AlertService.createAlert({
        typeCode: 'document_expiring',
        userId: user.id,
        context: {
          document_type: 'Passport',
          expiry_date: user.passport_expiry,
          destination: upcomingTrips[0].primary_destination_name
        }
      });
    }
  }
});
```

---

## Part 10: API Endpoints

### 10.1 Alert API

```typescript
// src/routes/alerts.routes.ts

// Get alerts for current user
router.get('/alerts', authenticate, async (req, res) => {
  const { category, status, limit, offset, unreadOnly } = req.query;
  
  const alerts = await AlertService.getAlertsForUser(req.user.id, {
    category,
    status: status?.split(','),
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
    unreadOnly: unreadOnly === 'true'
  });
  
  res.json(alerts);
});

// Get unread count
router.get('/alerts/unread-count', authenticate, async (req, res) => {
  const counts = await AlertService.getUnreadCount(req.user.id);
  res.json(counts);
});

// Mark alerts as read
router.post('/alerts/read', authenticate, async (req, res) => {
  const { alertIds } = req.body;
  await AlertService.markAsRead(alertIds, req.user.id);
  res.json({ success: true });
});

// Mark all as read
router.post('/alerts/read-all', authenticate, async (req, res) => {
  const { category } = req.body;
  await AlertService.markAllAsRead(req.user.id, category);
  res.json({ success: true });
});

// Get notification preferences
router.get('/alerts/preferences', authenticate, async (req, res) => {
  const preferences = await PreferenceService.getUserPreferences(req.user.id);
  res.json(preferences);
});

// Update notification preferences
router.put('/alerts/preferences', authenticate, async (req, res) => {
  const preferences = await PreferenceService.updatePreferences(
    req.user.id,
    req.body
  );
  res.json(preferences);
});

// Register device for push notifications
router.post('/alerts/devices', authenticate, async (req, res) => {
  const { token, platform, deviceName } = req.body;
  
  const device = await DeviceService.registerDevice(req.user.id, {
    token,
    platform,
    deviceName
  });
  
  res.json(device);
});

// Unregister device
router.delete('/alerts/devices/:deviceId', authenticate, async (req, res) => {
  await DeviceService.unregisterDevice(req.user.id, req.params.deviceId);
  res.json({ success: true });
});

// SOS endpoints
router.post('/sos/trigger', authenticate, async (req, res) => {
  const { location, message, type } = req.body;
  
  const sos = await SOSService.triggerSOS(req.user.id, location, {
    message,
    type
  });
  
  res.json(sos);
});

router.post('/sos/:sosId/update-location', authenticate, async (req, res) => {
  const { location } = req.body;
  await SOSService.updateSOSLocation(req.params.sosId, location);
  res.json({ success: true });
});

router.post('/sos/:sosId/deactivate', authenticate, async (req, res) => {
  const { resolution } = req.body;
  await SOSService.deactivateSOS(req.params.sosId, req.user.id, resolution);
  res.json({ success: true });
});

// Location update (for proximity features)
router.post('/location/update', authenticate, async (req, res) => {
  const { location } = req.body;
  await ProximityService.processLocationUpdate(req.user.id, location);
  res.json({ success: true });
});
```

---

## Part 11: Frontend Integration

### 11.1 React Native Push Setup

```typescript
// src/services/notifications/push-notification.service.ts

import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

export class PushNotificationService {
  
  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<void> {
    // Request permission
    const authStatus = await messaging().requestPermission();
    
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      
      // Get FCM token
      const token = await messaging().getToken();
      
      // Register with backend
      await api.post('/alerts/devices', {
        token,
        platform: Platform.OS,
        deviceName: await DeviceInfo.getDeviceName()
      });
      
      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken) => {
        await api.post('/alerts/devices', {
          token: newToken,
          platform: Platform.OS
        });
      });
      
      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        this.handleForegroundMessage(remoteMessage);
      });
      
      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        this.handleBackgroundMessage(remoteMessage);
      });
      
      // Configure local notifications
      PushNotification.configure({
        onNotification: this.onNotificationPress.bind(this)
      });
    }
  }
  
  /**
   * Handle message received while app is in foreground
   */
  static handleForegroundMessage(message: FirebaseMessagingTypes.RemoteMessage): void {
    const { title, body, data } = message.notification || {};
    
    // Show in-app notification banner
    InAppNotification.show({
      title,
      body,
      onPress: () => this.navigateToAlert(data)
    });
    
    // Update unread count
    store.dispatch(incrementUnreadCount());
  }
  
  /**
   * Handle notification press
   */
  static onNotificationPress(notification: any): void {
    const { data } = notification;
    
    if (data?.action_url) {
      // Navigate to the relevant screen
      NavigationService.navigate(data.action_url);
    }
    
    // Mark as read
    if (data?.alert_id) {
      api.post('/alerts/read', { alertIds: [data.alert_id] });
    }
  }
}
```

### 11.2 Notification Center Component

```typescript
// src/components/notifications/NotificationCenter.tsx

export const NotificationCenter: React.FC = () => {
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const categories = [
    { code: null, name: 'All', icon: '📬' },
    { code: 'trip', name: 'Trips', icon: '✈️' },
    { code: 'community', name: 'Community', icon: '👥' },
    { code: 'safety', name: 'Safety', icon: '🛡️' },
    { code: 'financial', name: 'Money', icon: '💰' },
    { code: 'social', name: 'Social', icon: '👋' }
  ];
  
  useEffect(() => {
    loadAlerts();
    loadUnreadCount();
  }, [filter]);
  
  const loadAlerts = async () => {
    setLoading(true);
    const response = await api.get('/alerts', {
      params: { category: filter, limit: 50 }
    });
    setAlerts(response.data.alerts);
    setLoading(false);
  };
  
  const loadUnreadCount = async () => {
    const response = await api.get('/alerts/unread-count');
    setUnreadCount(response.data.total);
  };
  
  const markAsRead = async (alertId: string) => {
    await api.post('/alerts/read', { alertIds: [alertId] });
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, read_at: new Date() } : a
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };
  
  const markAllAsRead = async () => {
    await api.post('/alerts/read-all', { category: filter });
    setAlerts(alerts.map(a => ({ ...a, read_at: new Date() })));
    setUnreadCount(0);
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.code || 'all'}
            style={[
              styles.filterChip,
              filter === cat.code && styles.filterChipActive
            ]}
            onPress={() => setFilter(cat.code)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[
              styles.filterText,
              filter === cat.code && styles.filterTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Alerts List */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              alert={item}
              onPress={() => {
                markAsRead(item.id);
                if (item.action_url) {
                  navigation.navigate(item.action_url);
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const NotificationItem: React.FC<{ alert: Alert; onPress: () => void }> = ({
  alert,
  onPress
}) => {
  const isUnread = !alert.read_at;
  
  return (
    <TouchableOpacity
      style={[styles.alertItem, isUnread && styles.alertItemUnread]}
      onPress={onPress}
    >
      <View style={styles.alertIcon}>
        <Text style={styles.alertIconText}>{alert.icon || '📌'}</Text>
      </View>
      
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, isUnread && styles.alertTitleUnread]}>
          {alert.title}
        </Text>
        <Text style={styles.alertBody} numberOfLines={2}>
          {alert.body}
        </Text>
        <Text style={styles.alertTime}>
          {formatRelativeTime(alert.created_at)}
        </Text>
      </View>
      
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};
```

---

## Summary

The Real-time Intelligence System is the **nervous system of Guidera** — managing every alert, notification, and real-time event across the platform.

### Key Features

| Feature | Description |
|---------|-------------|
| **Unified Alert System** | Single pipeline for all notification types |
| **Smart Delivery** | Batching, quiet hours, channel optimization |
| **Flight Monitoring** | Delays, cancellations, gate changes, compensation |
| **Weather Monitoring** | Alerts for trips affected by weather |
| **Safety Monitoring** | Travel advisories, local incidents |
| **Price Tracking** | Price drops on watched items |
| **Community Alerts** | Group activity, comments, likes, mentions |
| **Social/Proximity** | Nearby travelers, trip overlaps |
| **SOS System** | Emergency alerts with location sharing |
| **Modular Architecture** | Easy to add new alert types |

### Alert Categories

1. **Trip** — Flights, hotels, activities, documents
2. **Community** — Groups, posts, comments, buddies
3. **Safety** — Advisories, weather, incidents, SOS
4. **Financial** — Prices, compensation, budget
5. **Social** — Nearby travelers, meetups
6. **System** — Bookings, invites, security

### Technical Highlights

- 50+ alert types out of the box
- Batching to reduce notification fatigue
- Quiet hours with critical alert override
- Multi-channel delivery (push, in-app, email, SMS)
- Modular system for adding new alert types
- Real-time WebSocket support
- Comprehensive preference management

This system ensures users are **always informed** about what matters, **when it matters**, through their **preferred channels**.
