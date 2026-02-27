/**
 * Event Service
 * Handles community events for the Community system
 */

import { supabase } from '@/lib/supabase/client';
import {
  CommunityEvent,
  EventAttendee,
  CreateEventInput,
  RSVPStatus,
} from './types/community.types';

class EventService {
  /**
   * Create a new event
   */
  async createEvent(userId: string, data: CreateEventInput): Promise<CommunityEvent> {
    const { data: event, error } = await supabase
      .from('community_events')
      .insert({
        type: data.type,
        group_id: data.groupId,
        created_by: userId,
        title: data.title,
        description: data.description,
        category: data.category,
        cover_image_url: data.coverImageUrl,
        location_type: data.locationType || 'physical',
        location_name: data.locationName,
        location_address: data.locationAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        meeting_link: data.meetingLink,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString(),
        timezone: data.timezone,
        is_all_day: data.isAllDay || false,
        max_attendees: data.maxAttendees,
        rsvp_required: data.rsvpRequired ?? true,
        rsvp_deadline: data.rsvpDeadline?.toISOString(),
        waitlist_enabled: data.waitlistEnabled || false,
        visibility: data.visibility || 'public',
        status: 'upcoming',
        attendee_count: 1,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Add creator as organizer
    await supabase.from('event_attendees').insert({
      event_id: event.id,
      user_id: userId,
      rsvp_status: 'going',
      is_organizer: true,
    });

    // Create chat room for event
    await supabase.from('chat_rooms').insert({
      type: 'event',
      reference_id: event.id,
      name: data.title,
    });

    return this.mapEvent(event);
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<CommunityEvent | null> {
    const { data, error } = await supabase
      .from('community_events')
      .select(`
        *,
        creator:profiles!created_by(id, first_name, last_name, avatar_url),
        group:groups(id, name, group_photo_url)
      `)
      .eq('id', eventId)
      .single();

    if (error || !data) return null;
    return this.mapEvent(data);
  }

  /**
   * RSVP to an event
   */
  async rsvp(userId: string, eventId: string, status: RSVPStatus): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    if (event.status === 'cancelled') {
      throw new Error('Event has been cancelled');
    }

    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      throw new Error('RSVP deadline has passed');
    }

    // Check existing RSVP
    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id, rsvp_status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing RSVP
      await supabase
        .from('event_attendees')
        .update({
          rsvp_status: status,
          rsvp_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      // Update attendee count
      if (existing.rsvp_status === 'going' && status !== 'going') {
        await this.updateAttendeeCount(eventId, -1);
      } else if (existing.rsvp_status !== 'going' && status === 'going') {
        await this.updateAttendeeCount(eventId, 1);
      }
    } else {
      // Check capacity for new RSVP
      if (status === 'going' && event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
        if (event.waitlistEnabled) {
          status = 'waitlist';
        } else {
          throw new Error('Event is full');
        }
      }

      // Create new RSVP
      await supabase.from('event_attendees').insert({
        event_id: eventId,
        user_id: userId,
        rsvp_status: status,
      });

      if (status === 'going') {
        await this.updateAttendeeCount(eventId, 1);
      }
    }
  }

  /**
   * Cancel RSVP
   */
  async cancelRsvp(userId: string, eventId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id, rsvp_status, is_organizer')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (!existing) throw new Error('No RSVP found');
    if (existing.is_organizer) throw new Error('Organizer cannot cancel RSVP');

    await supabase.from('event_attendees').delete().eq('id', existing.id);

    if (existing.rsvp_status === 'going') {
      await this.updateAttendeeCount(eventId, -1);
      // Promote from waitlist if applicable
      await this.promoteFromWaitlist(eventId);
    }
  }

  /**
   * Cancel event (organizer only)
   */
  async cancelEvent(userId: string, eventId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    if (event.createdBy !== userId) {
      throw new Error('Only organizer can cancel');
    }

    await supabase
      .from('community_events')
      .update({ status: 'cancelled' })
      .eq('id', eventId);
  }

  /**
   * Get event attendees
   */
  async getAttendees(eventId: string, status?: RSVPStatus): Promise<EventAttendee[]> {
    let query = supabase
      .from('event_attendees')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('rsvp_at', { ascending: true });

    if (status) {
      query = query.eq('rsvp_status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapAttendee);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(filters?: {
    groupId?: string;
    limit?: number;
    offset?: number;
  }): Promise<CommunityEvent[]> {
    let query = supabase
      .from('community_events')
      .select(`
        *,
        creator:profiles!created_by(id, first_name, last_name, avatar_url),
        group:groups(id, name, group_photo_url)
      `)
      .eq('status', 'upcoming')
      .gt('start_date', new Date().toISOString())
      .eq('visibility', 'public')
      .order('start_date', { ascending: true });

    if (filters?.groupId) {
      query = query.eq('group_id', filters.groupId);
    }

    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(this.mapEvent);
  }

  /**
   * Get user's events
   */
  async getUserEvents(userId: string): Promise<CommunityEvent[]> {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        event:community_events(
          *,
          creator:profiles!created_by(id, first_name, last_name, avatar_url),
          group:groups(id, name, group_photo_url)
        )
      `)
      .eq('user_id', userId)
      .in('rsvp_status', ['going', 'maybe'])
      .order('rsvp_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || [])
      .filter((d) => d.event)
      .map((d) => this.mapEvent(d.event));
  }

  /**
   * Check in attendee
   */
  async checkIn(organizerId: string, eventId: string, attendeeUserId: string): Promise<void> {
    // Verify organizer
    const { data: organizer } = await supabase
      .from('event_attendees')
      .select('is_organizer')
      .eq('event_id', eventId)
      .eq('user_id', organizerId)
      .single();

    if (!organizer?.is_organizer) {
      throw new Error('Only organizer can check in attendees');
    }

    await supabase
      .from('event_attendees')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', attendeeUserId);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async updateAttendeeCount(eventId: string, delta: number): Promise<void> {
    const { data: event } = await supabase
      .from('community_events')
      .select('attendee_count')
      .eq('id', eventId)
      .single();

    if (event) {
      await supabase
        .from('community_events')
        .update({ attendee_count: Math.max(0, event.attendee_count + delta) })
        .eq('id', eventId);
    }
  }

  private async promoteFromWaitlist(eventId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event || !event.waitlistEnabled) return;

    if (event.maxAttendees && event.attendeeCount < event.maxAttendees) {
      const { data: waitlisted } = await supabase
        .from('event_attendees')
        .select('id, user_id')
        .eq('event_id', eventId)
        .eq('rsvp_status', 'waitlist')
        .order('rsvp_at', { ascending: true })
        .limit(1);

      if (waitlisted && waitlisted.length > 0) {
        await supabase
          .from('event_attendees')
          .update({ rsvp_status: 'going' })
          .eq('id', waitlisted[0].id);

        await this.updateAttendeeCount(eventId, 1);
      }
    }
  }

  private mapEvent(data: any): CommunityEvent {
    return {
      id: data.id,
      type: data.type,
      groupId: data.group_id,
      createdBy: data.created_by,
      title: data.title,
      description: data.description,
      category: data.category,
      coverImageUrl: data.cover_image_url,
      locationType: data.location_type,
      locationName: data.location_name,
      locationAddress: data.location_address,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      meetingLink: data.meeting_link,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      timezone: data.timezone,
      isAllDay: data.is_all_day,
      maxAttendees: data.max_attendees,
      attendeeCount: data.attendee_count,
      rsvpRequired: data.rsvp_required,
      rsvpDeadline: data.rsvp_deadline ? new Date(data.rsvp_deadline) : undefined,
      waitlistEnabled: data.waitlist_enabled,
      visibility: data.visibility,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      creator: data.creator ? {
        id: data.creator.id,
        firstName: data.creator.first_name,
        lastName: data.creator.last_name,
        avatarUrl: data.creator.avatar_url,
      } : undefined,
      group: data.group ? data.group : undefined,
    };
  }

  private mapAttendee(data: any): EventAttendee {
    return {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      rsvpStatus: data.rsvp_status,
      rsvpAt: new Date(data.rsvp_at),
      isOrganizer: data.is_organizer,
      checkedIn: data.checked_in,
      checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
      user: data.user ? {
        id: data.user.id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        avatarUrl: data.user.avatar_url,
      } : undefined,
    };
  }
}

export const eventService = new EventService();
export default eventService;
