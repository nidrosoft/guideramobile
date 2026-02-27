/**
 * REAL-TIME INTELLIGENCE - ALERT TYPES
 * 
 * Defines all types for the unified alert system.
 */

// ============================================
// ALERT CATEGORIES & TYPES
// ============================================

export type AlertCategory = 'trip' | 'safety' | 'financial' | 'social' | 'system';

export type AlertStatus = 
  | 'pending'
  | 'queued'
  | 'batched'
  | 'delivered'
  | 'read'
  | 'actioned'
  | 'failed'
  | 'expired';

export type AlertChannel = 'push' | 'in_app' | 'email' | 'sms';

export type AlertPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============================================
// ALERT TYPE DEFINITIONS
// ============================================

export interface AlertTypeDefinition {
  code: string;
  category: AlertCategory;
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
  priority: AlertPriority;
  allowedChannels: AlertChannel[];
  defaultChannel: AlertChannel;
  canBatch: boolean;
  batchWindowMinutes?: number;
  maxBatchSize?: number;
  batchTitleTemplate?: string;
  actionTemplate?: string;
  icon?: string;
}

// ============================================
// ALERT REGISTRY
// ============================================

export const ALERT_TYPES_REGISTRY: AlertTypeDefinition[] = [
  // Trip Alerts
  {
    code: 'flight_delay',
    category: 'trip',
    name: 'Flight Delay',
    titleTemplate: '⏰ Flight {{flight_number}} Delayed',
    bodyTemplate: 'Your flight to {{destination}} is delayed by {{delay_minutes}} minutes. New departure: {{new_departure_time}}',
    priority: 8,
    allowedChannels: ['push', 'in_app', 'email', 'sms'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
  },
  {
    code: 'flight_cancelled',
    category: 'trip',
    name: 'Flight Cancelled',
    titleTemplate: '❌ Flight {{flight_number}} Cancelled',
    bodyTemplate: 'Your flight to {{destination}} has been cancelled. Tap for rebooking options.',
    priority: 10,
    allowedChannels: ['push', 'in_app', 'email', 'sms'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
  },
  {
    code: 'flight_gate_change',
    category: 'trip',
    name: 'Gate Change',
    titleTemplate: '🚪 Gate Changed: {{flight_number}}',
    bodyTemplate: 'Your gate has changed from {{old_gate}} to {{new_gate}}',
    priority: 7,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
  },
  {
    code: 'checkin_reminder',
    category: 'trip',
    name: 'Check-in Reminder',
    titleTemplate: '✈️ Check in for {{flight_number}}',
    bodyTemplate: 'Online check-in is now open for your flight to {{destination}}',
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/checkin/{{booking_id}}',
  },
  {
    code: 'trip_reminder',
    category: 'trip',
    name: 'Trip Reminder',
    titleTemplate: '🌍 {{days_until}} days until {{trip_name}}!',
    bodyTemplate: 'Your trip to {{destination}} is coming up. Tap to review your itinerary.',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}',
  },
  {
    code: 'hotel_checkin_reminder',
    category: 'trip',
    name: 'Hotel Check-in Reminder',
    titleTemplate: '🏨 Check-in today at {{hotel_name}}',
    bodyTemplate: 'Check-in time: {{checkin_time}}. Address: {{address}}',
    priority: 6,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
  },

  // Safety Alerts
  {
    code: 'travel_advisory',
    category: 'safety',
    name: 'Travel Advisory',
    titleTemplate: '⚠️ Advisory: {{destination}}',
    bodyTemplate: '{{advisory_summary}}',
    priority: 9,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/safety',
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
    actionTemplate: '/trips/{{trip_id}}/weather',
  },
  {
    code: 'local_incident',
    category: 'safety',
    name: 'Local Incident',
    titleTemplate: '🚨 Incident near you',
    bodyTemplate: '{{incident_type}} reported {{distance_km}}km away. {{guidance}}',
    priority: 9,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/safety/incident/{{incident_id}}',
  },
  {
    code: 'sos_activated',
    category: 'safety',
    name: 'SOS Activated',
    titleTemplate: '🆘 SOS Alert from {{traveler_name}}',
    bodyTemplate: '{{traveler_name}} has activated SOS at {{location}}',
    priority: 10,
    allowedChannels: ['push', 'sms', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/sos/{{event_id}}',
  },

  // Financial Alerts
  {
    code: 'price_drop',
    category: 'financial',
    name: 'Price Drop',
    titleTemplate: '💰 Price dropped {{discount_percent}}%!',
    bodyTemplate: '{{item_name}} is now {{new_price}} (was {{old_price}})',
    priority: 5,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'push',
    canBatch: true,
    batchWindowMinutes: 60,
    maxBatchSize: 5,
    batchTitleTemplate: '{{count}} price drops for you',
    actionTemplate: '/deals/{{deal_id}}',
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
    actionTemplate: '/trips/{{trip_id}}/compensation/{{claim_id}}',
  },
  {
    code: 'budget_warning',
    category: 'financial',
    name: 'Budget Warning',
    titleTemplate: '📊 Budget Alert: {{trip_name}}',
    bodyTemplate: "You've spent {{percent_used}}% of your trip budget ({{spent}}/{{total}})",
    priority: 4,
    allowedChannels: ['push', 'in_app'],
    defaultChannel: 'in_app',
    canBatch: false,
    actionTemplate: '/trips/{{trip_id}}/expenses',
  },

  // Social Alerts
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
    actionTemplate: '/community/buddies/{{buddy_id}}',
  },
  {
    code: 'trip_invite',
    category: 'social',
    name: 'Trip Invitation',
    titleTemplate: '✉️ Trip invitation from {{inviter_name}}',
    bodyTemplate: "You're invited to join {{trip_name}} to {{destination}}",
    priority: 6,
    allowedChannels: ['push', 'in_app', 'email'],
    defaultChannel: 'push',
    canBatch: false,
    actionTemplate: '/trips/invite/{{invite_id}}',
  },

  // System Alerts
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
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
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
    actionTemplate: '/trips/{{trip_id}}/bookings/{{booking_id}}',
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
    actionTemplate: '/settings/security',
  },
];

// ============================================
// ALERT INTERFACES
// ============================================

export interface Alert {
  id: string;
  alertTypeId: string;
  alertTypeCode: string;
  categoryCode: AlertCategory;
  userId: string;
  tripId?: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  context: Record<string, unknown>;
  actionUrl?: string;
  priority: AlertPriority;
  channelsRequested: AlertChannel[];
  channelsDelivered: AlertChannel[];
  batchId?: string;
  isBatched: boolean;
  status: AlertStatus;
  scheduledFor?: string;
  deliveredAt?: string;
  readAt?: string;
  actionedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface AlertBatch {
  id: string;
  userId: string;
  alertTypeCode: string;
  alertCount: number;
  title?: string;
  channels: AlertChannel[];
  status: 'collecting' | 'delivered' | 'cancelled';
  deliverAt: string;
  deliveredAt?: string;
  createdAt: string;
}

// ============================================
// CREATE ALERT PARAMS
// ============================================

export interface CreateAlertParams {
  typeCode: string;
  userId: string;
  context: Record<string, unknown>;
  tripId?: string;
  priority?: AlertPriority;
  scheduledFor?: string;
  channels?: AlertChannel[];
}

export interface CreateAlertForUsersParams extends Omit<CreateAlertParams, 'userId'> {
  userIds: string[];
}

// ============================================
// USER NOTIFICATION PREFERENCES
// ============================================

export interface CategoryPreference {
  enabled: boolean;
  channels?: AlertChannel[];
}

export interface TypePreference {
  enabled: boolean;
  channels?: AlertChannel[];
}

export interface UserNotificationPreferences {
  id: string;
  userId: string;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
  categoryPreferences: Record<AlertCategory, CategoryPreference>;
  typePreferences: Record<string, TypePreference>;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER DEVICE
// ============================================

export interface UserDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastUsedAt: string;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DELIVERY TYPES
// ============================================

export interface DeliveryResult {
  status: 'delivered' | 'deferred' | 'failed';
  deliverAt?: string;
  results?: ChannelDeliveryResult[];
}

export interface ChannelDeliveryResult {
  channel: AlertChannel;
  status: 'delivered' | 'skipped' | 'failed';
  reason?: string;
  messageId?: string;
  devicesAttempted?: number;
  devicesSucceeded?: number;
}

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, unknown>;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  image?: string;
}

// ============================================
// UNREAD COUNTS
// ============================================

export interface UnreadCounts {
  total: number;
  byCategory: Record<AlertCategory, number>;
}

// ============================================
// GET ALERTS OPTIONS
// ============================================

export interface GetAlertsOptions {
  status?: AlertStatus[];
  category?: AlertCategory;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}

export interface PaginatedAlerts {
  alerts: Alert[];
  total: number;
  unreadCount: UnreadCounts;
}
