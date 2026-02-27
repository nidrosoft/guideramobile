/**
 * PROFILE SERVICE
 * 
 * Service for managing user profile data in Supabase.
 */

import { supabase } from '@/lib/supabase/client';
import { decode } from 'base64-arraybuffer';

export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  bio?: string;
  city?: string;
  country?: string;
  country_code?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  date_of_birth?: string;
  gender?: string;
  ethnicity?: string;
  preferences?: {
    language?: string;
    currency?: string;
    temperature_unit?: string;
    distance_unit?: string;
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
      trip_reminders?: boolean;
      deal_alerts?: boolean;
      safety_alerts?: boolean;
      booking_updates?: boolean;
    };
    privacy?: {
      profile_visibility?: string;
      show_trips?: boolean;
      allow_messages?: string;
    };
  };
  travel_preferences?: {
    styles?: string[];
    interests?: string[];
    dietary_restrictions?: string[];
    accessibility_needs?: string[];
  };
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  membership_type?: string;
  membership_expires_at?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
  stats?: {
    trips_completed?: number;
    countries_visited?: number;
    cities_explored?: number;
    reviews_written?: number;
  };
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  bio?: string;
  city?: string;
  country?: string;
  country_code?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  avatar_url?: string;
  cover_photo_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  preferences?: ProfileData['preferences'];
  travel_preferences?: ProfileData['travel_preferences'];
  emergency_contact?: ProfileData['emergency_contact'];
}

export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<{ data: ProfileData | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: error as Error };
    }

    return { data, error: null };
  },

  /**
   * Upload avatar image to Supabase Storage
   * Accepts base64 string directly from image picker
   */
  async uploadAvatar(userId: string, base64Data: string, fileExt: string = 'jpg'): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Generate unique filename
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // Determine content type
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      
      // Decode base64 to ArrayBuffer using base64-arraybuffer
      const arrayBuffer = decode(base64Data);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (error) {
        console.error('Error uploading avatar:', error);
        return { url: null, error: error as Error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: urlData.publicUrl });

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return { url: null, error: error as Error };
    }
  },

  /**
   * Update user stats
   */
  async updateStats(userId: string, stats: Partial<ProfileData['stats']>): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stats')
      .eq('id', userId)
      .single();

    const currentStats = profile?.stats || {};
    const newStats = { ...currentStats, ...stats };

    await supabase
      .from('profiles')
      .update({ stats: newStats, updated_at: new Date().toISOString() })
      .eq('id', userId);
  },

  /**
   * Get formatted location string
   */
  getLocationString(profile: ProfileData): string {
    if (profile.location_name) {
      return profile.location_name;
    }
    if (profile.city && profile.country) {
      return `${profile.city}, ${profile.country}`;
    }
    if (profile.city) {
      return profile.city;
    }
    if (profile.country) {
      return profile.country;
    }
    return '';
  },

  /**
   * Get full name
   */
  getFullName(profile: ProfileData): string {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  },
};
