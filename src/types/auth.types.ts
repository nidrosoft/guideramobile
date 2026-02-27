// User object derived from Clerk's user data
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}

export interface Profile {
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
  preferences?: UserPreferences;
  travel_preferences?: TravelPreferences;
  emergency_contact?: EmergencyContact;
  membership_type?: 'free' | 'premium' | 'business';
  membership_expires_at?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
  is_verified?: boolean;
  verified_at?: string;
  privacy_settings?: PrivacySettings;
  security_settings?: SecuritySettings;
  onboarding_completed: boolean;
  onboarding_step: number;
  stats?: UserStats;
  created_at?: string;
  updated_at?: string;
  last_seen_at?: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  distance_unit: 'km' | 'miles';
  temperature_unit: 'celsius' | 'fahrenheit';
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  trip_reminders: boolean;
  booking_updates: boolean;
  safety_alerts: boolean;
  deal_alerts: boolean;
}

export interface PrivacyPreferences {
  profile_visibility: 'public' | 'friends' | 'private';
  show_trips: boolean;
  allow_messages: 'everyone' | 'friends' | 'none';
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  activity_status: boolean;
  trip_sharing: 'public' | 'friends' | 'private';
  location_sharing: boolean;
  search_visibility: boolean;
  personalization: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  two_factor_method: 'sms' | 'authenticator' | null;
  biometric_enabled: boolean;
  login_alerts: boolean;
}

export interface TravelPreferences {
  styles: string[];
  interests: string[];
  dietary_restrictions: string[];
  accessibility_needs: string[];
}

export interface EmergencyContact {
  name?: string;
  phone: string;
  relationship?: string;
}

export interface UserStats {
  trips_completed: number;
  countries_visited: number;
  cities_explored: number;
  reviews_written: number;
}

export interface SignUpWithEmailParams {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface SignInWithEmailParams {
  email: string;
  password: string;
}

export interface SignUpWithPhoneParams {
  phone: string;
  countryCode: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  updateOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}
