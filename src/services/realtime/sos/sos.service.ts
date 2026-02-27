/**
 * SOS EMERGENCY SERVICE
 * 
 * Handles emergency SOS functionality including:
 * - SOS activation and deactivation
 * - Emergency contact notifications
 * - Location sharing
 * - Check-in system
 */

import { supabase } from '@/lib/supabase/client';
import { alertService } from '../alerts';

// ============================================
// TYPES
// ============================================

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyCall: boolean;
}

export interface SOSSettings {
  id: string;
  userId: string;
  sosEnabled: boolean;
  emergencyContacts: EmergencyContact[];
  shareLocation: boolean;
  shareMedicalInfo: boolean;
  medicalInfo: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
  };
  checkinEnabled: boolean;
  checkinIntervalHours: number;
  lastCheckinAt?: string;
  missedCheckins: number;
  createdAt: string;
  updatedAt: string;
}

export interface SOSEvent {
  id: string;
  userId: string;
  tripId?: string;
  eventType: 'sos_triggered' | 'sos_cancelled' | 'checkin_missed' | 'checkin_completed';
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationName?: string;
  contactsNotified: Array<{
    name: string;
    method: string;
    status: string;
    sentAt: string;
  }>;
  status: 'active' | 'resolved' | 'cancelled' | 'false_alarm';
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName?: string;
}

// ============================================
// SOS SERVICE
// ============================================

class SOSService {
  /**
   * Get SOS settings for user
   */
  async getSettings(userId: string): Promise<SOSSettings | null> {
    const { data, error } = await supabase
      .from('sos_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformSettings(data);
  }

  /**
   * Create or update SOS settings
   */
  async updateSettings(
    userId: string,
    updates: Partial<Omit<SOSSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SOSSettings | null> {
    const dbUpdates: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.sosEnabled !== undefined) {
      dbUpdates.sos_enabled = updates.sosEnabled;
    }
    if (updates.emergencyContacts !== undefined) {
      dbUpdates.emergency_contacts = updates.emergencyContacts;
    }
    if (updates.shareLocation !== undefined) {
      dbUpdates.share_location = updates.shareLocation;
    }
    if (updates.shareMedicalInfo !== undefined) {
      dbUpdates.share_medical_info = updates.shareMedicalInfo;
    }
    if (updates.medicalInfo !== undefined) {
      dbUpdates.medical_info = updates.medicalInfo;
    }
    if (updates.checkinEnabled !== undefined) {
      dbUpdates.checkin_enabled = updates.checkinEnabled;
    }
    if (updates.checkinIntervalHours !== undefined) {
      dbUpdates.checkin_interval_hours = updates.checkinIntervalHours;
    }

    const { data, error } = await supabase
      .from('sos_settings')
      .upsert(dbUpdates)
      .select()
      .single();

    if (error) {
      console.error('Failed to update SOS settings:', error);
      return null;
    }

    return this.transformSettings(data);
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    userId: string,
    contact: EmergencyContact
  ): Promise<boolean> {
    const settings = await this.getSettings(userId);
    const contacts = settings?.emergencyContacts || [];

    if (contacts.length >= 5) {
      console.error('Maximum 5 emergency contacts allowed');
      return false;
    }

    contacts.push(contact);

    const result = await this.updateSettings(userId, {
      emergencyContacts: contacts,
    });

    return result !== null;
  }

  /**
   * Remove emergency contact
   */
  async removeEmergencyContact(
    userId: string,
    contactIndex: number
  ): Promise<boolean> {
    const settings = await this.getSettings(userId);
    if (!settings) return false;

    const contacts = [...settings.emergencyContacts];
    contacts.splice(contactIndex, 1);

    const result = await this.updateSettings(userId, {
      emergencyContacts: contacts,
    });

    return result !== null;
  }

  /**
   * Trigger SOS alert
   */
  async triggerSOS(
    userId: string,
    location?: GeoLocation,
    tripId?: string
  ): Promise<SOSEvent | null> {
    const settings = await this.getSettings(userId);
    if (!settings || !settings.sosEnabled) {
      console.error('SOS not enabled for user');
      return null;
    }

    if (settings.emergencyContacts.length === 0) {
      console.error('No emergency contacts configured');
      return null;
    }

    // Get user info
    const { data: user } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .single();

    const userName = user ? `${user.first_name} ${user.last_name}` : 'A traveler';

    // Create SOS event
    const { data: event, error } = await supabase
      .from('sos_events')
      .insert({
        user_id: userId,
        trip_id: tripId,
        event_type: 'sos_triggered',
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_accuracy: location?.accuracy,
        location_name: location?.locationName,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create SOS event:', error);
      return null;
    }

    // Notify emergency contacts
    const notifiedContacts = await this.notifyEmergencyContacts(
      settings.emergencyContacts,
      userName,
      location,
      settings.shareMedicalInfo ? settings.medicalInfo : undefined
    );

    // Update event with notified contacts
    await supabase
      .from('sos_events')
      .update({ contacts_notified: notifiedContacts })
      .eq('id', event.id);

    // Create in-app alert for the user
    await alertService.createAlert({
      typeCode: 'sos_activated',
      userId,
      tripId,
      context: {
        event_id: event.id,
        traveler_name: userName,
        location: location?.locationName || 'Unknown location',
        contacts_notified: notifiedContacts.length,
      },
    });

    return this.transformEvent({ ...event, contacts_notified: notifiedContacts });
  }

  /**
   * Cancel SOS alert
   */
  async cancelSOS(
    userId: string,
    eventId: string,
    reason?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('sos_events')
      .update({
        status: reason === 'false_alarm' ? 'false_alarm' : 'cancelled',
        resolved_at: new Date().toISOString(),
        resolution_notes: reason,
      })
      .eq('id', eventId)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to cancel SOS:', error);
      return false;
    }

    // Notify contacts that SOS was cancelled
    const settings = await this.getSettings(userId);
    if (settings) {
      await this.notifyCancellation(settings.emergencyContacts, reason);
    }

    return true;
  }

  /**
   * Resolve SOS event
   */
  async resolveSOS(
    userId: string,
    eventId: string,
    notes?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('sos_events')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', eventId)
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Get active SOS event for user
   */
  async getActiveSOSEvent(userId: string): Promise<SOSEvent | null> {
    const { data, error } = await supabase
      .from('sos_events')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformEvent(data);
  }

  /**
   * Get SOS event history
   */
  async getSOSHistory(
    userId: string,
    limit = 10
  ): Promise<SOSEvent[]> {
    const { data, error } = await supabase
      .from('sos_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(this.transformEvent);
  }

  /**
   * Perform check-in
   */
  async checkIn(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sos_settings')
      .update({
        last_checkin_at: new Date().toISOString(),
        missed_checkins: 0,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to check in:', error);
      return false;
    }

    // Log check-in event
    await supabase.from('sos_events').insert({
      user_id: userId,
      event_type: 'checkin_completed',
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Process missed check-ins (called by scheduled job)
   */
  async processMissedCheckins(): Promise<void> {
    const now = new Date();

    // Find users with enabled check-in who are overdue
    const { data: overdueUsers, error } = await supabase
      .from('sos_settings')
      .select('*')
      .eq('checkin_enabled', true)
      .not('last_checkin_at', 'is', null);

    if (error || !overdueUsers) {
      return;
    }

    for (const settings of overdueUsers) {
      const lastCheckin = new Date(settings.last_checkin_at);
      const intervalMs = settings.checkin_interval_hours * 60 * 60 * 1000;
      const overdueBy = now.getTime() - lastCheckin.getTime() - intervalMs;

      if (overdueBy > 0) {
        // User is overdue for check-in
        const missedCount = settings.missed_checkins + 1;

        // Update missed count
        await supabase
          .from('sos_settings')
          .update({ missed_checkins: missedCount })
          .eq('id', settings.id);

        // Send reminder to user
        await alertService.createAlert({
          typeCode: 'checkin_reminder',
          userId: settings.user_id,
          context: {
            missed_count: missedCount,
            last_checkin: settings.last_checkin_at,
          },
          priority: missedCount >= 3 ? 9 : 6,
        });

        // If missed 3+ times, notify emergency contacts
        if (missedCount >= 3) {
          await this.handleMissedCheckinAlert(settings);
        }
      }
    }
  }

  /**
   * Handle missed check-in alert
   */
  private async handleMissedCheckinAlert(settings: any): Promise<void> {
    const { data: user } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', settings.user_id)
      .single();

    const userName = user ? `${user.first_name} ${user.last_name}` : 'A traveler';

    // Create missed check-in event
    await supabase.from('sos_events').insert({
      user_id: settings.user_id,
      event_type: 'checkin_missed',
      status: 'active',
      contacts_notified: [],
    });

    // Notify emergency contacts
    const contacts = settings.emergency_contacts || [];
    for (const contact of contacts) {
      if (contact.notifyEmail && contact.email) {
        // Send email notification via edge function
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'email',
            to: contact.email,
            subject: `Check-in Alert: ${userName}`,
            body: `${userName} has missed ${settings.missed_checkins} scheduled check-ins. They may need assistance.`,
          },
        });
      }
    }
  }

  /**
   * Notify emergency contacts
   */
  private async notifyEmergencyContacts(
    contacts: EmergencyContact[],
    userName: string,
    location?: GeoLocation,
    medicalInfo?: SOSSettings['medicalInfo']
  ): Promise<Array<{ name: string; method: string; status: string; sentAt: string }>> {
    const notified: Array<{ name: string; method: string; status: string; sentAt: string }> = [];
    const locationText = location?.locationName || 
      (location ? `${location.latitude}, ${location.longitude}` : 'Unknown location');

    for (const contact of contacts) {
      // SMS notification
      if (contact.notifySms && contact.phone) {
        try {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'sms',
              to: contact.phone,
              body: `EMERGENCY: ${userName} has triggered an SOS alert. Location: ${locationText}. Please check on them immediately.`,
            },
          });
          notified.push({
            name: contact.name,
            method: 'sms',
            status: 'sent',
            sentAt: new Date().toISOString(),
          });
        } catch (error) {
          notified.push({
            name: contact.name,
            method: 'sms',
            status: 'failed',
            sentAt: new Date().toISOString(),
          });
        }
      }

      // Email notification
      if (contact.notifyEmail && contact.email) {
        try {
          let emailBody = `EMERGENCY ALERT\n\n${userName} has triggered an SOS alert.\n\nLocation: ${locationText}\n\nPlease try to contact them immediately.`;
          
          if (medicalInfo) {
            emailBody += '\n\nMedical Information:';
            if (medicalInfo.bloodType) emailBody += `\n- Blood Type: ${medicalInfo.bloodType}`;
            if (medicalInfo.allergies?.length) emailBody += `\n- Allergies: ${medicalInfo.allergies.join(', ')}`;
            if (medicalInfo.medications?.length) emailBody += `\n- Medications: ${medicalInfo.medications.join(', ')}`;
            if (medicalInfo.conditions?.length) emailBody += `\n- Conditions: ${medicalInfo.conditions.join(', ')}`;
          }

          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'email',
              to: contact.email,
              subject: `🆘 EMERGENCY: SOS Alert from ${userName}`,
              body: emailBody,
            },
          });
          notified.push({
            name: contact.name,
            method: 'email',
            status: 'sent',
            sentAt: new Date().toISOString(),
          });
        } catch (error) {
          notified.push({
            name: contact.name,
            method: 'email',
            status: 'failed',
            sentAt: new Date().toISOString(),
          });
        }
      }
    }

    return notified;
  }

  /**
   * Notify contacts of SOS cancellation
   */
  private async notifyCancellation(
    contacts: EmergencyContact[],
    reason?: string
  ): Promise<void> {
    const message = reason === 'false_alarm'
      ? 'The SOS alert was a false alarm. No action needed.'
      : 'The SOS alert has been cancelled. The situation is resolved.';

    for (const contact of contacts) {
      if (contact.notifySms && contact.phone) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'sms',
            to: contact.phone,
            body: `SOS UPDATE: ${message}`,
          },
        }).catch(() => {});
      }

      if (contact.notifyEmail && contact.email) {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'email',
            to: contact.email,
            subject: 'SOS Alert Cancelled',
            body: message,
          },
        }).catch(() => {});
      }
    }
  }

  /**
   * Transform database row to SOSSettings
   */
  private transformSettings(row: any): SOSSettings {
    return {
      id: row.id,
      userId: row.user_id,
      sosEnabled: row.sos_enabled,
      emergencyContacts: row.emergency_contacts || [],
      shareLocation: row.share_location,
      shareMedicalInfo: row.share_medical_info,
      medicalInfo: row.medical_info || {},
      checkinEnabled: row.checkin_enabled,
      checkinIntervalHours: row.checkin_interval_hours,
      lastCheckinAt: row.last_checkin_at,
      missedCheckins: row.missed_checkins,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Transform database row to SOSEvent
   */
  private transformEvent(row: any): SOSEvent {
    return {
      id: row.id,
      userId: row.user_id,
      tripId: row.trip_id,
      eventType: row.event_type,
      latitude: row.latitude,
      longitude: row.longitude,
      locationAccuracy: row.location_accuracy,
      locationName: row.location_name,
      contactsNotified: row.contacts_notified || [],
      status: row.status,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      createdAt: row.created_at,
    };
  }
}

export const sosService = new SOSService();
