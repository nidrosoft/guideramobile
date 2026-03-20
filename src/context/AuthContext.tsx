import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-expo';
import { Profile, AuthContextType } from '@/types/auth.types';
import { 
  syncClerkUserToSupabase, 
  getProfileByClerkId, 
  updateSupabaseProfile 
} from '@/lib/clerk/profileSync';
import { supabase, setClerkTokenGetter } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '@/services/notifications';
import { providerManagerService } from '@/services/provider-manager.service';

const initialState: AuthContextType = {
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => ({ error: null }),
  updateOnboardingStep: async () => {},
  completeOnboarding: async () => {},
};

export const AuthContext = createContext<AuthContextType>(initialState);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded, getToken } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const isLoading = !isUserLoaded || !isAuthLoaded || (isSignedIn && isProfileLoading);
  const isAuthenticated = !!isSignedIn && !!clerkUser;
  const hasCompletedOnboarding = profile?.onboarding_completed ?? false;

  if (__DEV__) {
    if (__DEV__) console.log('[Auth State]', {
      isUserLoaded,
      isAuthLoaded,
      isSignedIn: !!isSignedIn,
      hasClerkUser: !!clerkUser,
      clerkUserId: clerkUser?.id?.substring(0, 10),
      isProfileLoading,
      profileId: profile?.id?.substring(0, 8),
      onboardingCompleted: profile?.onboarding_completed,
      isLoading,
      isAuthenticated,
      hasCompletedOnboarding,
    });
  }

  // ─── Clerk↔Supabase Native Third-Party Auth ─────────────────────────────
  // Supabase validates Clerk session tokens via JWKS (no shared secret).
  // We pass Clerk's native session token (no JWT template needed) to the
  // Supabase client's accessToken callback.
  const stableGetToken = useCallback(
    async () => getToken(),
    [getToken]
  );

  useEffect(() => {
    if (isSignedIn) {
      setClerkTokenGetter(stableGetToken);
      if (__DEV__) console.log('[Auth] Clerk→Supabase native auth bridge activated');
    } else {
      setClerkTokenGetter(null);
      if (__DEV__) console.log('[Auth] Clerk→Supabase native auth bridge cleared');
    }
    return () => setClerkTokenGetter(null);
  }, [isSignedIn, stableGetToken]);

  // Sync Clerk user to Supabase profile when user signs in
  useEffect(() => {
    let isMounted = true;

    const syncProfile = async () => {
      if (!clerkUser || !isSignedIn) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);

      try {
        if (__DEV__) console.log('[Auth] Syncing Clerk user to Supabase...', clerkUser.id);
        const profileData = await syncClerkUserToSupabase({
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          emailAddresses: clerkUser.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
          phoneNumbers: clerkUser.phoneNumbers.map(p => ({ phoneNumber: p.phoneNumber })),
          imageUrl: clerkUser.imageUrl,
        });

        if (isMounted) {
          if (profileData) {
            if (__DEV__) console.log('[Auth] Profile synced OK:', profileData.id, 'onboarding:', profileData.onboarding_completed);
            // Wire profile UUID to services that need it
            notificationService.setUserId(profileData.id);
            providerManagerService.setUserId(profileData.id);
          } else {
            if (__DEV__) console.warn('[Auth] Profile sync returned null — profile creation may have failed');
            notificationService.setUserId(null);
            providerManagerService.setUserId(null);
          }
          setProfile(profileData);
        }
      } catch (error) {
        if (__DEV__) console.warn('[Auth] Error syncing profile:', error);
        // Even on error, stop loading so AuthGuard can proceed
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    if (isUserLoaded && isAuthLoaded) {
      syncProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [clerkUser?.id, isSignedIn, isUserLoaded, isAuthLoaded]);

  const refreshProfile = useCallback(async () => {
    if (!clerkUser?.id) return;
    
    const profileData = await getProfileByClerkId(clerkUser.id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [clerkUser?.id]);

  const signOut = async () => {
    try {
      // Clear cached data before signing out
      const keysToPreserve = ['@guidera_theme_mode', '@guidera_theme_user_chosen'];
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((k: string) => !keysToPreserve.includes(k));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      setProfile(null);
      setIsProfileLoading(true);
      notificationService.setUserId(null);
      providerManagerService.setUserId(null);
      await clerkSignOut();
    } catch (error) {
      if (__DEV__) console.warn('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!clerkUser?.id) return { error: new Error('No user logged in') };
    
    try {
      const { data, error } = await updateSupabaseProfile(clerkUser.id, updates);
      if (data) {
        setProfile(data);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateOnboardingStep = async (step: number) => {
    if (!clerkUser?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_step: step,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkUser.id);

      setProfile(prev => prev ? { ...prev, onboarding_step: step } : null);
    } catch (error) {
      if (__DEV__) console.warn('Error updating onboarding step:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!clerkUser?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 10,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkUser.id);

      setProfile(prev => prev ? { ...prev, onboarding_completed: true, onboarding_step: 10 } : null);
    } catch (error) {
      if (__DEV__) console.warn('Error completing onboarding:', error);
    }
  };

  // Build a minimal user object for backward compatibility
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    imageUrl: clerkUser.imageUrl || '',
  } : null;

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    hasCompletedOnboarding,
    signOut,
    refreshProfile,
    updateProfile,
    updateOnboardingStep,
    completeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
