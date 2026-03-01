/**
 * PARTNER PROGRAM TYPES
 *
 * Type definitions for the Guidera Partner Program.
 * Covers partner profiles, service categories, and the application flow.
 */

// ============================================
// SERVICE CATEGORIES
// ============================================

export type PartnerServiceCategory =
  | 'property_rental'
  | 'transport'
  | 'tour_guide'
  | 'food_dining'
  | 'professional_services'
  | 'local_experiences'
  | 'shopping_markets'
  | 'safety_navigation';

export interface ServiceCategoryOption {
  id: PartnerServiceCategory;
  label: string;
  iconName: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryOption[] = [
  { id: 'property_rental', label: 'Property Rental', iconName: 'Home2', description: 'Rent out apartments, houses, or rooms to travelers' },
  { id: 'transport', label: 'Transport / Taxi', iconName: 'Car', description: 'Airport pickups, city transfers, day trip drives' },
  { id: 'tour_guide', label: 'Tour Guide', iconName: 'Map1', description: 'Walking tours, cultural tours, food tours, nightlife' },
  { id: 'food_dining', label: 'Food & Dining', iconName: 'Coffee', description: 'Home-cooked meals, restaurant recs, food tours' },
  { id: 'professional_services', label: 'Professional Services', iconName: 'Briefcase', description: 'Translation, photography, event planning' },
  { id: 'local_experiences', label: 'Local Experiences', iconName: 'Brush2', description: 'Cooking classes, art workshops, sports activities' },
  { id: 'shopping_markets', label: 'Shopping & Markets', iconName: 'Bag2', description: 'Market tours, bargain guides, local crafts' },
  { id: 'safety_navigation', label: 'Safety & Navigation', iconName: 'ShieldTick', description: 'Safety advice, neighborhood guides, emergency help' },
];

// ============================================
// APPLICATION FORM DATA
// ============================================

export type ResidencyDuration = 'less_than_1' | '1_to_3' | '3_to_5' | '5_to_10' | '10_plus';

export const RESIDENCY_OPTIONS: { id: ResidencyDuration; label: string }[] = [
  { id: 'less_than_1', label: 'Less than 1 year' },
  { id: '1_to_3', label: '1–3 years' },
  { id: '3_to_5', label: '3–5 years' },
  { id: '5_to_10', label: '5–10 years' },
  { id: '10_plus', label: '10+ years' },
];

export type ExperienceYears = 'less_than_1' | '1_to_3' | '3_to_5' | '5_to_10' | '10_plus';

export const EXPERIENCE_OPTIONS: { id: ExperienceYears; label: string }[] = [
  { id: 'less_than_1', label: 'Less than 1 year' },
  { id: '1_to_3', label: '1–3 years' },
  { id: '3_to_5', label: '3–5 years' },
  { id: '5_to_10', label: '5–10 years' },
  { id: '10_plus', label: '10+ years' },
];

export type IDType = 'passport' | 'national_id' | 'drivers_license';

export const ID_TYPE_OPTIONS: { id: IDType; label: string }[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'national_id', label: 'National ID Card' },
  { id: 'drivers_license', label: "Driver's License" },
];

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non_binary', label: 'Non-binary' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// ============================================
// PARTNER APPLICATION INPUT
// ============================================

export interface PartnerApplicationStep1 {
  firstName: string;
  lastName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string; // ISO date string
  gender?: Gender;
  nationality: string;
}

export interface PartnerApplicationStep2 {
  streetAddress: string;
  city: string;
  stateRegion: string;
  country: string;
  postalCode: string;
  residencyDuration: ResidencyDuration | null;
  languages: string[];
}

export interface PartnerApplicationStep3 {
  serviceCategories: PartnerServiceCategory[];
  bio: string;
  experienceYears: ExperienceYears | null;
  certifications: string;
  websiteOrSocial: string;
}

export interface PartnerApplicationStep4 {
  profilePhotoUri: string | null;
  bannerPhotoUri: string | null;
  portfolioPhotoUris: string[];
  tagline: string;
}

export interface PartnerApplicationStep5 {
  idType: IDType | null;
  idFrontUri: string | null;
  idBackUri: string | null;
  selfieUri: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PartnerApplicationInput {
  step1: PartnerApplicationStep1;
  step2: PartnerApplicationStep2;
  step3: PartnerApplicationStep3;
  step4: PartnerApplicationStep4;
  step5: PartnerApplicationStep5;
  agreedToTerms: boolean;
}

// ============================================
// APPLICATION STATUS
// ============================================

export type PartnerApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'identity_verification'
  | 'approved'
  | 'rejected';

export interface PartnerApplication {
  id: string;
  userId: string;
  status: PartnerApplicationStatus;
  input: PartnerApplicationInput;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ============================================
// LANGUAGES LIST
// ============================================

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'German',
  'Italian', 'Japanese', 'Korean', 'Mandarin', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Swedish', 'Turkish',
  'Thai', 'Vietnamese', 'Indonesian', 'Swahili', 'Greek',
];
