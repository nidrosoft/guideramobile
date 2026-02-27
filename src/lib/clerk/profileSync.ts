import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/auth.types';

/**
 * Generate a deterministic UUID v5-like ID from a Clerk user ID.
 * This converts a Clerk ID (e.g. "user_abc123") into a valid UUID format
 * that Supabase's uuid column accepts.
 */
function clerkIdToUuid(clerkId: string): string {
  // Simple hash-based UUID generation from Clerk ID
  let hash = 0;
  for (let i = 0; i < clerkId.length; i++) {
    const char = clerkId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Create a deterministic UUID from the clerk ID string
  // Use the clerk ID chars to fill a UUID pattern
  const hex = clerkId.split('').map(c => {
    const code = c.charCodeAt(0);
    return code.toString(16).padStart(2, '0');
  }).join('');
  
  // Pad or truncate to 32 hex chars, then format as UUID
  const padded = (hex + '0'.repeat(32)).slice(0, 32);
  return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-4${padded.slice(13, 16)}-a${padded.slice(17, 20)}-${padded.slice(20, 32)}`;
}

/**
 * Syncs a Clerk user to the Supabase profiles table.
 * Called after every successful Clerk sign-in/sign-up.
 * 
 * Strategy:
 * - Uses clerk_id column to look up profiles (text, matches Clerk's user ID)
 * - profiles.id remains a UUID (auto-generated or deterministic from clerk ID)
 * - Preserves existing profile data (onboarding, preferences, etc.)
 */
export async function syncClerkUserToSupabase(clerkUser: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  phoneNumbers: { phoneNumber: string }[];
  imageUrl: string | null;
}): Promise<Profile | null> {
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

  try {
    // First check if a profile exists with this Clerk ID
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (existingProfile) {
      // Profile exists — update only auth-related fields, preserve everything else
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (email && !existingProfile.email) updates.email = email;
      if (phone && !existingProfile.phone) {
        updates.phone = phone;
        updates.phone_verified = true;
      }
      if (clerkUser.imageUrl && !existingProfile.avatar_url) {
        updates.avatar_url = clerkUser.imageUrl;
      }
      if (clerkUser.firstName && !existingProfile.first_name) {
        updates.first_name = clerkUser.firstName;
      }
      if (clerkUser.lastName && !existingProfile.last_name) {
        updates.last_name = clerkUser.lastName;
      }

      if (Object.keys(updates).length > 1) {
        const { data } = await supabase
          .from('profiles')
          .update(updates)
          .eq('clerk_id', clerkUser.id)
          .select()
          .single();
        return (data as Profile) || existingProfile;
      }

      return existingProfile as Profile;
    }

    // Check if there's an existing profile by email (migration from old Supabase auth)
    if (email) {
      const { data: emailProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (emailProfile) {
        // Found existing profile by email — link it to the Clerk user
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            clerk_id: clerkUser.id,
            phone: phone || emailProfile.phone,
            first_name: clerkUser.firstName || emailProfile.first_name,
            last_name: clerkUser.lastName || emailProfile.last_name,
            avatar_url: clerkUser.imageUrl || emailProfile.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', emailProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('[ProfileSync] Error migrating profile:', updateError);
          return emailProfile as Profile;
        }

        console.log('[ProfileSync] Linked existing profile to Clerk user via email');
        return updatedProfile as Profile;
      }
    }

    // Check if there's an existing profile by phone (migration case)
    if (phone) {
      const { data: phoneProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (phoneProfile) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            clerk_id: clerkUser.id,
            email: email || phoneProfile.email,
            first_name: clerkUser.firstName || phoneProfile.first_name,
            last_name: clerkUser.lastName || phoneProfile.last_name,
            avatar_url: clerkUser.imageUrl || phoneProfile.avatar_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', phoneProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('[ProfileSync] Error migrating profile by phone:', updateError);
          return phoneProfile as Profile;
        }

        console.log('[ProfileSync] Linked existing profile to Clerk user via phone');
        return updatedProfile as Profile;
      }
    }

    // No existing profile — create new one with generated UUID
    const profileId = clerkIdToUuid(clerkUser.id);
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        clerk_id: clerkUser.id,
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        email: email || '',
        phone,
        phone_verified: !!phone,
        email_verified: !!email,
        onboarding_completed: false,
        onboarding_step: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('[ProfileSync] Error creating profile:', createError);
      return null;
    }

    console.log('[ProfileSync] Created new profile for Clerk user');
    return newProfile as Profile;
  } catch (error) {
    console.error('[ProfileSync] Unexpected error:', error);
    return null;
  }
}

/**
 * Get profile from Supabase by Clerk user ID
 */
export async function getProfileByClerkId(clerkUserId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single();

  if (error) {
    console.error('[ProfileSync] Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Update profile in Supabase
 */
export async function updateSupabaseProfile(
  clerkUserId: string,
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', clerkUserId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Profile, error: null };
}
