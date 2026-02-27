/**
 * EVENT TYPES
 * 
 * Type definitions for community events and meetups.
 */

export type EventType = 
  | 'meetup' 
  | 'virtual' 
  | 'activity' 
  | 'trip'
  | 'food_drink'
  | 'sightseeing'
  | 'outdoor'
  | 'cultural'
  | 'nightlife'
  | 'sports'
  | 'workshop'
  | 'coworking'
  | 'other';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'none';

export interface EventLocation {
  name: string;
  address?: string;
  city: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isVirtual: boolean;
  virtualLink?: string;
}

export interface EventOrganizer {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isVerified: boolean;
}

export interface Event {
  id: string;
  communityId: string;
  title: string;
  description: string;
  coverImage?: string;
  type: EventType;
  status: EventStatus;
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  timezone: string;
  maxAttendees?: number;
  currentAttendees: number;
  organizer: EventOrganizer;
  coHosts: EventOrganizer[];
  isPremiumOnly: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPreview {
  id: string;
  communityId: string;
  title: string;
  coverImage?: string;
  type: EventType;
  status: EventStatus;
  location: {
    city: string;
    country: string;
    isVirtual: boolean;
  };
  startDate: Date;
  attendeeCount: number;
  myRSVP: RSVPStatus;
}

export interface EventAttendee {
  id: string;
  userId: string;
  eventId: string;
  rsvpStatus: RSVPStatus;
  rsvpAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

// ============================================
// EVENT ACTIONS
// ============================================

export interface CreateEventInput {
  communityId: string;
  title: string;
  description: string;
  type: EventType;
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  timezone: string;
  maxAttendees?: number;
  isPremiumOnly: boolean;
  coverImage?: string;
  tags: string[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: EventLocation;
  startDate?: Date;
  endDate?: Date;
  maxAttendees?: number;
  coverImage?: string;
  status?: EventStatus;
}

export interface RSVPInput {
  eventId: string;
  status: RSVPStatus;
}
