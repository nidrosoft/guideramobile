import { supabase } from './client';
import { Profile, SignUpWithEmailParams, SignInWithEmailParams } from '@/types/auth.types';

export const authService = {
  async signUpWithEmail({ email, password, firstName, lastName }: SignUpWithEmailParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || '',
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName || '',
          email: email,
          email_verified: false,
          onboarding_completed: false,
          onboarding_step: 0,
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating profile after signup:', profileError);
      }
    }

    return { data, error: null };
  },

  async signInWithEmail({ email, password }: SignInWithEmailParams) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  },

  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { data, error: null };
  },

  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;

    if (data.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile?.phone) {
        await supabase
          .from('profiles')
          .update({
            phone: phone,
            phone_verified: true,
          })
          .eq('id', data.user.id);
      }
    }

    return { data, error: null };
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'guidera://reset-password',
    });

    if (error) throw error;
    return { data, error: null };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('getSession error:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('getSession exception:', error);
      return null;
    }
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  },

  async updateOnboardingStep(userId: string, step: number) {
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_step: step,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async completeOnboarding(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async checkEmailExists(email: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    return !!data;
  },

  async checkPhoneExists(phone: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    return !!data;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
