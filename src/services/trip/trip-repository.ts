/**
 * TRIP REPOSITORY
 * Database operations for trips
 */

import { supabase } from '@/lib/supabase/client';
import {
  Trip,
  TripTraveler,
  TripBooking,
  TripActivity,
  TripFilters,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  UpdateActivityInput,
} from './trip.types';

// ============================================
// TRIP CRUD
// ============================================

export async function createTrip(data: Partial<Trip>): Promise<Trip> {
  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      user_id: data.owner_id,
      owner_id: data.owner_id,
      title: data.title || data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      destination: data.destination || {
        code: data.primary_destination_code,
        name: data.primary_destination_name,
        country: data.primary_destination_country,
      },
      primary_destination_code: data.primary_destination_code,
      primary_destination_name: data.primary_destination_name,
      primary_destination_country: data.primary_destination_country,
      is_multi_destination: data.is_multi_destination || false,
      destinations: data.destinations || [],
      destination_timezone: data.destination_timezone,
      start_date: data.start_date,
      end_date: data.end_date,
      trip_type: data.trip_type || 'leisure',
      trip_purpose: data.trip_purpose,
      special_occasion: data.special_occasion,
      status: data.status || 'draft',
      state: data.status || 'draft',
      traveler_count: data.traveler_count || 1,
      adults: data.adults || 1,
      children: data.children || 0,
      infants: data.infants || 0,
      traveler_composition: data.traveler_composition,
      budget_total: data.budget_total,
      budget_currency: data.budget_currency || 'USD',
      budget_level: data.budget_level,
      created_via: data.created_via || 'manual',
      source_platform: data.source_platform,
      source_version: data.source_version,
      tags: data.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return trip as Trip;
}

export async function findById(tripId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Trip;
}

export async function findBySlug(slug: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Trip;
}

export async function update(tripId: string, updates: Partial<Trip>): Promise<Trip> {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };
  
  // Sync title/name
  if (updates.title) updateData.name = updates.title;
  if (updates.name) updateData.title = updates.name;
  
  // Sync status/state
  if (updates.status) updateData.state = updates.status;
  
  const { data, error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
}

export async function softDelete(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tripId);

  if (error) throw error;
}

// ============================================
// TRIP QUERIES
// ============================================

export async function findByUser(userId: string, filters: TripFilters = {}): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*')
    .is('deleted_at', null);

  // User is owner OR is a traveler
  query = query.or(`owner_id.eq.${userId},user_id.eq.${userId}`);

  // Status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // Trip type filter
  if (filters.tripType && filters.tripType.length > 0) {
    query = query.in('trip_type', filters.tripType);
  }

  // Date filters
  if (filters.startDateFrom) {
    query = query.gte('start_date', filters.startDateFrom);
  }
  if (filters.startDateTo) {
    query = query.lte('start_date', filters.startDateTo);
  }

  // Sorting
  const sortBy = filters.sortBy || 'start_date';
  const sortOrder = filters.sortOrder === 'desc' ? false : true;
  query = query.order(sortBy, { ascending: sortOrder });

  // Pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Trip[];
}

export async function countByUser(userId: string, filters: TripFilters = {}): Promise<number> {
  let query = supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .or(`owner_id.eq.${userId},user_id.eq.${userId}`);

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function findByShareToken(token: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_link_token', token)
    .eq('share_link_enabled', true)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Trip;
}

// ============================================
// TRAVELERS
// ============================================

export async function getTravelers(tripId: string): Promise<TripTraveler[]> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .select('*')
    .eq('trip_id', tripId)
    .order('is_owner', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as TripTraveler[];
}

export async function addTraveler(traveler: Partial<TripTraveler>): Promise<TripTraveler> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .insert(traveler)
    .select()
    .single();

  if (error) throw error;
  return data as TripTraveler;
}

export async function updateTraveler(travelerId: string, updates: Partial<TripTraveler>): Promise<TripTraveler> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', travelerId)
    .select()
    .single();

  if (error) throw error;
  return data as TripTraveler;
}

export async function removeTraveler(travelerId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_travelers')
    .delete()
    .eq('id', travelerId);

  if (error) throw error;
}

export async function findTravelerByEmail(tripId: string, email: string): Promise<TripTraveler | null> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .select('*')
    .eq('trip_id', tripId)
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TripTraveler;
}

export async function findTravelerByUserId(tripId: string, userId: string): Promise<TripTraveler | null> {
  const { data, error } = await supabase
    .from('trip_travelers')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as TripTraveler;
}

// ============================================
// BOOKINGS
// ============================================

export async function getBookings(tripId: string): Promise<TripBooking[]> {
  const { data, error } = await supabase
    .from('trip_bookings')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_day', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as TripBooking[];
}

export async function linkBooking(booking: Partial<TripBooking>): Promise<TripBooking> {
  const { data, error } = await supabase
    .from('trip_bookings')
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data as TripBooking;
}

export async function unlinkBooking(tripId: string, bookingId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_bookings')
    .delete()
    .eq('trip_id', tripId)
    .eq('booking_id', bookingId);

  if (error) throw error;
}

export async function updateTripBooking(id: string, updates: Partial<TripBooking>): Promise<TripBooking> {
  const { data, error } = await supabase
    .from('trip_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TripBooking;
}

// ============================================
// ACTIVITIES
// ============================================

export async function getActivities(tripId: string): Promise<TripActivity[]> {
  const { data, error } = await supabase
    .from('trip_activities')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as TripActivity[];
}

export async function createActivity(activity: Partial<TripActivity>): Promise<TripActivity> {
  const { data, error } = await supabase
    .from('trip_activities')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data as TripActivity;
}

export async function updateActivity(activityId: string, updates: Partial<TripActivity>): Promise<TripActivity> {
  const { data, error } = await supabase
    .from('trip_activities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', activityId)
    .select()
    .single();

  if (error) throw error;
  return data as TripActivity;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
}

// ============================================
// TRIPS NEEDING TRANSITION
// ============================================

export async function findTripsNeedingTransition(
  toStatus: 'upcoming' | 'ongoing' | 'completed'
): Promise<Trip[]> {
  const now = new Date().toISOString();
  let query = supabase.from('trips').select('*').is('deleted_at', null);

  switch (toStatus) {
    case 'upcoming':
      query = query
        .eq('status', 'confirmed')
        .lte('transition_to_upcoming_at', now);
      break;
    case 'ongoing':
      query = query
        .in('status', ['confirmed', 'upcoming'])
        .lte('transition_to_ongoing_at', now);
      break;
    case 'completed':
      query = query
        .eq('status', 'ongoing')
        .lte('transition_to_completed_at', now);
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Trip[];
}

export const TripRepository = {
  createTrip,
  findById,
  findBySlug,
  update,
  deleteTrip,
  softDelete,
  findByUser,
  countByUser,
  findByShareToken,
  getTravelers,
  addTraveler,
  updateTraveler,
  removeTraveler,
  findTravelerByEmail,
  findTravelerByUserId,
  getBookings,
  linkBooking,
  unlinkBooking,
  updateTripBooking,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  findTripsNeedingTransition,
};
