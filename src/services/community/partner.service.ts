/**
 * Partner Service
 * Handles all partner program operations including applications,
 * Didit identity verification, and status tracking.
 */

import { supabase, supabaseUrl } from '@/lib/supabase/client';

export interface PartnerApplicationData {
  // Step 1: Personal Info
  first_name: string;
  last_name: string;
  phone_country_code?: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;

  // Step 2: Location
  street_address?: string;
  city?: string;
  state_region?: string;
  country?: string;
  postal_code?: string;
  residency_duration?: string;
  languages?: string[];

  // Step 3: Services
  service_categories?: string[];
  bio?: string;
  experience_years?: string;
  certifications?: string;
  website_or_social?: string;

  // Step 4: Media
  profile_photo_url?: string;
  banner_photo_url?: string;
  portfolio_photo_urls?: string[];
  tagline?: string;

  // Step 5: Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Step 6: Terms
  agreed_to_terms?: boolean;
}

export interface DiditSessionResponse {
  session_id: string;
  session_token: string;
  verification_url: string;
  status: string;
}

export interface VerificationStatusResponse {
  verification_status: string;
  application_status: string;
  didit_live_status: string | null;
  verification_details: {
    id_first_name?: string;
    id_last_name?: string;
    id_nationality?: string;
    liveness_status?: string;
    face_match_status?: string;
    aml_status?: string;
    phone_verified?: boolean;
    is_vpn_or_tor?: boolean;
    created_at?: string;
  } | null;
}

export interface PartnerApplication {
  id: string;
  user_id: string;
  status: string;
  first_name?: string;
  last_name?: string;
  didit_session_id?: string;
  didit_verification_status: string;
  service_categories?: string[];
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

class PartnerService {
  /**
   * Create or get existing draft application for the user
   */
  async getOrCreateApplication(userId: string): Promise<PartnerApplication> {
    // Check for existing draft/in-progress application
    const { data: existing, error: fetchError } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['draft', 'identity_verification', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing && !fetchError) {
      return existing as PartnerApplication;
    }

    // Create new draft application
    const { data: newApp, error: createError } = await supabase
      .from('partner_applications')
      .insert({ user_id: userId, status: 'draft' })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create application: ${createError.message}`);
    }

    return newApp as PartnerApplication;
  }

  /**
   * Update application with form data (saves progress per step)
   */
  async updateApplication(
    applicationId: string,
    data: Partial<PartnerApplicationData>,
  ): Promise<void> {
    const { error } = await supabase
      .from('partner_applications')
      .update(data)
      .eq('id', applicationId);

    if (error) {
      throw new Error(`Failed to update application: ${error.message}`);
    }
  }

  /**
   * Get the user's current application status
   */
  async getApplication(applicationId: string): Promise<PartnerApplication | null> {
    const { data, error } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error) return null;
    return data as PartnerApplication;
  }

  /**
   * Check if the user already has an approved/pending application
   */
  async hasExistingApplication(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('partner_applications')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['submitted', 'under_review', 'approved'])
      .limit(1);

    if (error) return false;
    return (data?.length ?? 0) > 0;
  }

  /**
   * Create a Didit identity verification session via Edge Function
   */
  async createVerificationSession(
    applicationId: string,
    userDetails: {
      first_name?: string;
      last_name?: string;
      date_of_birth?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<DiditSessionResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/didit-create-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: session.access_token,
        },
        body: JSON.stringify({
          application_id: applicationId,
          ...userDetails,
        }),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create verification session (${response.status})`);
    }

    return response.json();
  }

  /**
   * Check the current verification status via Edge Function
   */
  async checkVerificationStatus(
    applicationId: string,
  ): Promise<VerificationStatusResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/didit-check-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: session.access_token,
        },
        body: JSON.stringify({ application_id: applicationId }),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to check status (${response.status})`);
    }

    return response.json();
  }

  /**
   * Submit the application (marks agreed_to_terms, sets submitted_at)
   */
  async submitApplication(applicationId: string): Promise<void> {
    const { error } = await supabase
      .from('partner_applications')
      .update({
        agreed_to_terms: true,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', applicationId);

    if (error) {
      throw new Error(`Failed to submit application: ${error.message}`);
    }
  }
}

export const partnerService = new PartnerService();
