/**
 * GUIDE TYPES
 * 
 * Type definitions for the Local Guide system.
 * Covers guide profiles, listings, vouches, reviews, and trust tiers.
 */

// ============================================
// TRUST & VERIFICATION
// ============================================

export type TrustTier = 'verified_local' | 'background_cleared' | 'trusted_guide' | 'community_ambassador';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'failed' | 'manual_review';

export type BackgroundCheckStatus = 'not_available' | 'pending' | 'cleared' | 'flagged';

export type GuideAvailability = 'available_now' | 'available_this_week' | 'busy' | 'away';

export interface TrustBadgeInfo {
  tier: TrustTier;
  label: string;
  color: string;
  icon: string;
  emoji: string;
}

export const TRUST_TIERS: Record<TrustTier, TrustBadgeInfo> = {
  verified_local: {
    tier: 'verified_local',
    label: 'Verified Local',
    color: '#22C55E',
    icon: 'shield-checkmark',
    emoji: '🟢',
  },
  background_cleared: {
    tier: 'background_cleared',
    label: 'Background Cleared',
    color: '#3B82F6',
    icon: 'shield',
    emoji: '🔵',
  },
  trusted_guide: {
    tier: 'trusted_guide',
    label: 'Trusted Guide',
    color: '#EAB308',
    icon: 'shield-star',
    emoji: '🟡',
  },
  community_ambassador: {
    tier: 'community_ambassador',
    label: 'Community Ambassador',
    color: '#A855F7',
    icon: 'shield-crown',
    emoji: '🟣',
  },
};

// ============================================
// EXPERTISE AREAS
// ============================================

export type ExpertiseArea =
  | 'nightlife'
  | 'cultural_tours'
  | 'food_dining'
  | 'safety_navigation'
  | 'outdoor_adventure'
  | 'real_estate'
  | 'business_networking'
  | 'dating_social'
  | 'shopping_markets'
  | 'transportation';

export interface ExpertiseOption {
  id: ExpertiseArea;
  label: string;
  icon: string;
  emoji: string;
}

export const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: 'music', emoji: '🎵' },
  { id: 'cultural_tours', label: 'Historical & Cultural Tours', icon: 'building', emoji: '🏛️' },
  { id: 'food_dining', label: 'Food & Dining', icon: 'restaurant', emoji: '🍽️' },
  { id: 'safety_navigation', label: 'Safety & Navigation', icon: 'shield', emoji: '🛡️' },
  { id: 'outdoor_adventure', label: 'Outdoor & Adventure', icon: 'mountain', emoji: '🏔️' },
  { id: 'real_estate', label: 'Real Estate & Rentals', icon: 'home', emoji: '🏠' },
  { id: 'business_networking', label: 'Business & Networking', icon: 'briefcase', emoji: '💼' },
  { id: 'dating_social', label: 'Dating & Social Etiquette', icon: 'heart', emoji: '💕' },
  { id: 'shopping_markets', label: 'Shopping & Markets', icon: 'bag', emoji: '🛍️' },
  { id: 'transportation', label: 'Transportation & Logistics', icon: 'car', emoji: '🚗' },
];

// ============================================
// GUIDE PROFILE
// ============================================

export interface GuideProfile {
  id: string;
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatar: string;
  coverPhoto?: string;
  bio: string;
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  languages: string[];
  expertiseAreas: ExpertiseArea[];
  credentials?: string[];
  
  // Verification
  trustTier: TrustTier;
  verificationStatus: VerificationStatus;
  backgroundCheckStatus: BackgroundCheckStatus;
  verifiedAt?: string;
  
  // Activity
  availability: GuideAvailability;
  responseTime: string; // e.g. "Usually responds within 1 hour"
  memberSince: string;
  lastActive: string;
  
  // Stats
  rating: number;
  reviewCount: number;
  vouchCount: number;
  communityCount: number;
  listingCount: number;
  
  // Portfolio
  portfolioPhotos?: string[];
  
  // Communities
  activeCommunities?: {
    id: string;
    name: string;
    memberCount: number;
  }[];
}

// ============================================
// GUIDE LISTINGS
// ============================================

export type ListingCategory = 'property_rental' | 'tour_experience' | 'service' | 'recommendation';

export type ListingStatus = 'active' | 'paused' | 'expired' | 'removed';

export interface GuideListing {
  id: string;
  guideId: string;
  guideName: string;
  guideAvatar: string;
  guideTrustTier: TrustTier;
  guideRating: number;
  
  category: ListingCategory;
  title: string;
  description: string;
  photos: string[];
  
  // Location
  neighborhood?: string;
  city: string;
  country: string;
  
  // Pricing (approximate, visibility only)
  priceRange?: string; // e.g. "$50-70 per person"
  currency?: string;
  
  // Details
  duration?: string; // For tours/services
  whatsIncluded?: string[];
  availability?: string;
  
  // Stats
  inquiryCount: number;
  rating?: number;
  reviewCount?: number;
  
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  category: ListingCategory;
  title: string;
  description: string;
  photos?: string[];
  neighborhood?: string;
  city: string;
  country: string;
  priceRange?: string;
  currency?: string;
  duration?: string;
  whatsIncluded?: string[];
  availability?: string;
}

export const LISTING_CATEGORIES: { id: ListingCategory; label: string; icon: string; description: string }[] = [
  { id: 'property_rental', label: 'Property Rental', icon: 'home-2', description: 'Apartments, houses, rooms for rent' },
  { id: 'tour_experience', label: 'Tour / Experience', icon: 'map', description: 'Walking tours, food tours, day trips' },
  { id: 'service', label: 'Service', icon: 'setting-2', description: 'Airport pickup, translation, planning' },
  { id: 'recommendation', label: 'Recommendation', icon: 'document-text', description: 'Top spots, hidden gems, guides' },
];

// ============================================
// VOUCHES
// ============================================

export interface GuideVouch {
  id: string;
  voucherId: string;
  voucherName: string;
  voucherAvatar: string;
  voucherTrustTier: TrustTier;
  voucheeId: string;
  voucheeName: string;
  message?: string;
  createdAt: string;
}

// ============================================
// REVIEWS
// ============================================

export interface GuideReview {
  id: string;
  guideId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerLocation?: string;
  rating: number;
  content: string;
  tags: string[];
  wouldRecommend: boolean;
  guideResponse?: string;
  guideRespondedAt?: string;
  visitDate?: string;
  createdAt: string;
}

export const REVIEW_TAGS = [
  'Helpful',
  'Trustworthy',
  'Knowledgeable',
  'Responsive',
  'Great Communicator',
  'Fun',
  'Professional',
  'Patient',
];

// ============================================
// GUIDE APPLICATION
// ============================================

export interface GuideApplicationInput {
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  languages: string[];
  expertiseAreas: ExpertiseArea[];
  bio: string;
  credentials?: string[];
  profilePhoto?: string;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'identity_verification' | 'background_check' | 'approved' | 'rejected';

export interface GuideApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  input: GuideApplicationInput;
  verificationStatus: VerificationStatus;
  backgroundCheckStatus: BackgroundCheckStatus;
  rejectionReason?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ============================================
// COMMUNITY POSTS (with voting)
// ============================================

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTrustTier?: TrustTier;
  authorExpertise?: ExpertiseArea[];
  isGuide: boolean;
  
  content: string;
  photos?: string[];
  tags?: string[];
  category?: string;
  
  upvotes: number;
  downvotes: number;
  score: number; // upvotes - downvotes
  commentCount: number;
  
  isPinned: boolean;
  isFlagged: boolean;
  
  myVote?: 'up' | 'down' | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTrustTier?: TrustTier;
  isGuide: boolean;
  content: string;
  upvotes: number;
  downvotes: number;
  myVote?: 'up' | 'down' | null;
  createdAt: string;
}
