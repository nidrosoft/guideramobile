import { supabaseNoAuth as supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/auth.types';

/**
 * Generate a deterministic UUID from a Clerk user ID using MurmurHash3-based mixing.
 * Uses a Guidera-specific namespace prefix to prevent collisions with other systems.
 * The same Clerk ID always produces the same UUID — safe for DB primary keys.
 * 
 * Note: Existing users already have profiles matched by clerk_id column, not this UUID.
 * This UUID is only used when creating NEW profiles.
 */
function clerkIdToUuid(clerkId: string): string {
  const input = 'guidera:clerk:' + clerkId;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Generate 4 x 32-bit values for full UUID coverage
  const v1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const v2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const v3 = ((h1 ^ 0x9e3779b9) >>> 0).toString(16).padStart(8, '0');
  const v4 = ((h2 ^ 0x517cc1b7) >>> 0).toString(16).padStart(8, '0');
  const hex = v1 + v2 + v3 + v4;

  // Format as UUID v4 (set version nibble to 4, variant bits to 10xx)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${(8 + (parseInt(hex[16], 16) & 3)).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
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

    // Check if there's an orphaned profile by email (migration from old Supabase auth)
    // SECURITY: Only link if the profile has NO clerk_id — meaning it's a pre-Clerk migration orphan.
    // If it already has a clerk_id, it belongs to another user — do NOT hijack it.
    if (email) {
      const { data: emailProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .is('clerk_id', null)
        .single();

      if (emailProfile) {
        // Found orphaned profile by email (no clerk_id) — safe to link
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

        if (__DEV__) console.log('[ProfileSync] Linked existing profile to Clerk user via email');
        return updatedProfile as Profile;
      }
    }

    // Check if there's an orphaned profile by phone (migration case)
    // SECURITY: Only link if the profile has NO clerk_id — prevents hijacking another user's profile.
    if (phone) {
      const { data: phoneProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .is('clerk_id', null)
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

        if (__DEV__) console.log('[ProfileSync] Linked existing profile to Clerk user via phone');
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

    if (__DEV__) console.log('[ProfileSync] Created new profile for Clerk user');
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
