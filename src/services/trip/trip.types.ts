/**
 * TRIP TYPES
 * Type definitions for the Trip Planning System
 */

// ============================================
// TRIP STATUS
// ============================================

export type TripStatus =
  | 'draft'
  | 'planning'
  | 'confirmed'
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type TripType =
  | 'leisure'
  | 'business'
  | 'business_leisure'
  | 'honeymoon'
  | 'family_visit'
  | 'event'
  | 'adventure'
  | 'wellness';

export type TravelerComposition =
  | 'solo'
  | 'couple'
  | 'family'
  | 'friends'
  | 'business_group'
  | 'mixed';

export type BudgetLevel = 'budget' | 'moderate' | 'luxury' | 'ultra_luxury';

export type TravelerRole = 'owner' | 'admin' | 'editor' | 'traveler' | 'viewer';

export type TravelerType = 'adult' | 'child' | 'infant';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

export type ActivityCategory =
  | 'custom'
  | 'restaurant'
  | 'attraction'
  | 'meeting'
  | 'transport'
  | 'free_time'
  | 'note';

export type ActivityStatus = 'planned' | 'confirmed' | 'completed' | 'skipped' | 'cancelled';

// ============================================
// DESTINATION
// ============================================

export interface Destination {
  code: string;
  name: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
}

export interface MultiDestination extends Destination {
  order: number;
  arrivalDate: string;
  departureDate: string;
  nights: number;
}

// ============================================
// TRIP
// ============================================

export interface Trip {
  id: string;
  owner_id: string;
  user_id: string;
  
  // Identity
  title: string;
  name?: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  cover_image_source?: string;
  
  // Destination
  destination: any; // Legacy JSONB field
  primary_destination_code?: string;
  primary_destination_name?: string;
  primary_destination_country?: string;
  is_multi_destination: boolean;
  destinations: MultiDestination[];
  destination_timezone?: string;
  
  // Dates
  start_date: string;
  end_date: string;
  duration_days?: number;
  duration_nights?: number;
  
  // Type
  trip_type: TripType;
  trip_purpose?: string;
  special_occasion?: string;
  
  // Status
  status: TripStatus;
  state?: string; // Legacy field
  previous_status?: TripStatus;
  status_changed_at?: string;
  status_change_reason?: string;
  
  // Transitions
  transition_to_upcoming_at?: string;
  transition_to_ongoing_at?: string;
  transition_to_completed_at?: string;
  
  // Travelers
  traveler_count: number;
  adults: number;
  children: number;
  infants: number;
  traveler_composition?: TravelerComposition;
  
  // Budget
  budget?: any; // Legacy JSONB field
  budget_total?: number;
  budget_currency: string;
  budget_level?: BudgetLevel;
  total_booked_amount: number;
  total_spent_amount: number;
  
  // Bookings
  booking_count: number;
  has_flights: boolean;
  has_hotels: boolean;
  has_cars: boolean;
  has_experiences: boolean;
  flight_count: number;
  hotel_count: number;
  car_count: number;
  experience_count: number;
  
  // Import
  created_via: string;
  import_sources: any[];
  
  // Modules
  modules_generated: boolean;
  modules_generated_at?: string;
  modules_last_refreshed_at?: string;
  module_status: Record<string, string>;
  
  // Collaboration
  is_collaborative: boolean;
  collaborator_count: number;
  is_shared: boolean;
  share_code?: string;
  share_link_enabled: boolean;
  share_link_token?: string;
  share_link_permission: string;
  share_link_expires_at?: string;
  
  // Notifications
  notifications_enabled: boolean;
  reminder_settings: Record<string, boolean>;
  
  // Offline
  offline_enabled: boolean;
  offline_last_synced_at?: string;
  offline_data_size_bytes?: number;
  
  // Metadata
  tags: string[];
  notes?: string;
  source_platform?: string;
  source_version?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  archived_at?: string;
  deleted_at?: string;
}

// ============================================
// TRIP TRAVELER
// ============================================

export interface TripTraveler {
  id: string;
  trip_id: string;
  user_id?: string;
  
  // Identity
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  
  // Profile
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  
  // Type
  traveler_type: TravelerType;
  age_at_travel?: number;
  
  // Role
  role: TravelerRole;
  is_owner: boolean;
  relationship_to_owner?: string;
  
  // Personalization
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  medical_conditions?: string[];
  medications?: string[];
  special_requests?: string;
  
  // Documents
  passport_number_last4?: string;
  passport_expiry?: string;
  passport_country?: string;
  
  // Invitation
  invitation_status: InvitationStatus;
  invited_at?: string;
  invited_by?: string;
  accepted_at?: string;
  
  // Module personalization
  has_personalized_packing: boolean;
  packing_module_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// TRIP BOOKING
// ============================================

export interface TripBooking {
  id: string;
  trip_id: string;
  booking_id: string;
  
  // Snapshot
  category: string;
  booking_reference?: string;
  summary_title?: string;
  summary_subtitle?: string;
  summary_datetime?: string;
  summary_price?: number;
  summary_status?: string;
  
  // Itinerary
  start_day?: number;
  end_day?: number;
  display_order: number;
  
  // Travelers
  traveler_ids?: string[];
  
  // Source
  source: string;
  import_id?: string;
  
  // Metadata
  added_at: string;
  added_by?: string;
}

// ============================================
// TRIP ACTIVITY
// ============================================

export interface TripActivity {
  id: string;
  trip_id: string;
  
  // Details
  title: string;
  description?: string;
  category: ActivityCategory;
  
  // Timing
  day_number: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  is_all_day: boolean;
  start_datetime?: string;
  end_datetime?: string;
  
  // Location
  location_name?: string;
  location_address?: string;
  location_place_id?: string;
  location_lat?: number;
  location_lng?: number;
  
  // Display
  icon?: string;
  color?: string;
  display_order: number;
  
  // Links
  website_url?: string;
  phone_number?: string;
  confirmation_number?: string;
  
  // Cost
  estimated_cost?: number;
  cost_currency?: string;
  is_prepaid: boolean;
  
  // Travelers
  traveler_ids?: string[];
  
  // Notes
  notes?: string;
  attachments: any[];
  
  // Status
  status: ActivityStatus;
  is_ai_suggested: boolean;
  suggestion_reason?: string;
  
  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// TRIP INVITATION
// ============================================

export interface TripInvitation {
  id: string;
  trip_id: string;
  
  // Target
  invited_email?: string;
  invited_user_id?: string;
  invited_phone?: string;
  invited_name?: string;
  
  // Metadata
  invited_by: string;
  role: TravelerRole;
  relationship?: string;
  
  // Token
  token: string;
  token_expires_at: string;
  
  // Status
  status: InvitationStatus;
  
  // Communication
  notification_sent: boolean;
  notification_sent_at?: string;
  notification_method?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  
  // Response
  responded_at?: string;
  decline_reason?: string;
  created_traveler_id?: string;
  
  // Message
  message?: string;
  created_at: string;
}

// ============================================
// ITINERARY
// ============================================

export interface ItineraryItem {
  id: string;
  type: 'booking' | 'activity';
  category: string;
  title: string;
  subtitle?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  location?: {
    name?: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  confirmationNumber?: string;
  price?: number;
  currency?: string;
  status?: string;
  icon?: string;
  color?: string;
  notes?: string;
  isAllDay?: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  items: ItineraryItem[];
  hasItems: boolean;
  weather?: any;
  notes?: string;
}

export interface TripItinerary {
  tripId: string;
  totalDays: number;
  days: ItineraryDay[];
}

// ============================================
// ACCESS CONTROL
// ============================================

export interface TripAccess {
  hasAccess: boolean;
  role: TravelerRole | null;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageBookings: boolean;
}

export const ROLE_PERMISSIONS: Record<TravelerRole, Omit<TripAccess, 'hasAccess' | 'role'>> = {
  owner: { canEdit: true, canDelete: true, canInvite: true, canManageBookings: true },
  admin: { canEdit: true, canDelete: false, canInvite: true, canManageBookings: true },
  editor: { canEdit: true, canDelete: false, canInvite: false, canManageBookings: false },
  traveler: { canEdit: false, canDelete: false, canInvite: false, canManageBookings: false },
  viewer: { canEdit: false, canDelete: false, canInvite: false, canManageBookings: false },
};

// ============================================
// INPUT TYPES
// ============================================

export interface CreateTripInput {
  userId: string;
  name?: string;
  title?: string;
  destination?: Destination;
  startDate?: string;
  endDate?: string;
  tripType?: TripType;
  budget?: {
    total?: number;
    currency?: string;
    level?: BudgetLevel;
  };
  travelers?: {
    adults?: number;
    children?: number;
    infants?: number;
    composition?: TravelerComposition;
  };
  createdVia?: string;
  platform?: string;
  ownerDetails?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface UpdateTripInput {
  name?: string;
  title?: string;
  description?: string;
  cover_image_url?: string;
  destination?: Destination;
  startDate?: string;
  endDate?: string;
  tripType?: TripType;
  tripPurpose?: string;
  specialOccasion?: string;
  budget?: {
    total?: number;
    currency?: string;
    level?: BudgetLevel;
  };
  travelers?: {
    adults?: number;
    children?: number;
    infants?: number;
    composition?: TravelerComposition;
  };
  tags?: string[];
  notes?: string;
  notificationsEnabled?: boolean;
  reminderSettings?: Record<string, boolean>;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  category?: ActivityCategory;
  dayNumber: number;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: {
    name?: string;
    address?: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
  };
  cost?: {
    amount?: number;
    currency?: string;
  };
  notes?: string;
  travelerIds?: string[];
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  dayNumber?: number;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: {
    name?: string;
    address?: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
  };
  cost?: {
    amount?: number;
    currency?: string;
  };
  notes?: string;
  status?: ActivityStatus;
  travelerIds?: string[];
}

export interface TripFilters {
  status?: TripStatus[];
  tripType?: TripType[];
  destination?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: 'start_date' | 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetTripOptions {
  includeTravelers?: boolean;
  includeBookings?: boolean;
  includeActivities?: boolean;
  includeItinerary?: boolean;
  includeModuleStatus?: boolean;
}

export interface LinkBookingOptions {
  travelerIds?: string[];
  source?: string;
  importId?: string;
  addedBy?: string;
}

export interface TripWithDetails extends Trip {
  access?: TripAccess;
  travelers?: TripTraveler[];
  bookings?: TripBooking[];
  activities?: TripActivity[];
  itinerary?: TripItinerary;
  moduleStatus?: Record<string, any>;
}

export interface TripListResponse {
  trips: Trip[];
  total: number;
  hasMore: boolean;
}
