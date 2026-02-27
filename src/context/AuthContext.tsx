import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-expo';
import { Profile, AuthContextType } from '@/types/auth.types';
import { 
  syncClerkUserToSupabase, 
  getProfileByClerkId, 
  updateSupabaseProfile 
} from '@/lib/clerk/profileSync';
import { supabase } from '@/lib/supabase/client';

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
  const { isSignedIn, isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut: clerkSignOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const isLoading = !isUserLoaded || !isAuthLoaded || (isSignedIn && isProfileLoading);
  const isAuthenticated = !!isSignedIn && !!clerkUser;
  const hasCompletedOnboarding = profile?.onboarding_completed ?? false;

  // Sync Clerk user to Supabase profile when user signs in
  useEffect(() => {
    let isMounted = true;

    const syncProfile = async () => {
      if (!clerkUser || !isSignedIn) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      try {
        console.log('[Auth] Syncing Clerk user to Supabase profile...');
        const profileData = await syncClerkUserToSupabase({
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          emailAddresses: clerkUser.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
          phoneNumbers: clerkUser.phoneNumbers.map(p => ({ phoneNumber: p.phoneNumber })),
          imageUrl: clerkUser.imageUrl,
        });

        if (isMounted) {
          console.log('[Auth] Profile loaded, onboarding_completed:', profileData?.onboarding_completed);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('[Auth] Error syncing profile:', error);
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
      await clerkSignOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
      console.error('Error updating onboarding step:', error);
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
      console.error('Error completing onboarding:', error);
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
