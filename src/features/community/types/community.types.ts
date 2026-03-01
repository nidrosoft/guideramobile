/**
 * COMMUNITY TYPES
 * 
 * Core type definitions for the Community feature.
 * Designed for scalability and type safety.
 */

// ============================================
// COMMUNITY TYPES
// ============================================

export type CommunityType = 'destination' | 'interest' | 'trip' | 'local';
export type CommunityPrivacy = 'public' | 'private' | 'invite_only';
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';
export type MembershipStatus = 'active' | 'pending' | 'banned' | 'left';

export interface CommunityDestination {
  city: string;
  country: string;
  countryCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CommunityStats {
  memberCount: number;
  activeMembers: number;
  postsCount: number;
  eventsCount: number;
  messagesThisWeek: number;
}

export interface CommunityRule {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  avatar: string;
  type: CommunityType;
  privacy: CommunityPrivacy;
  destination?: CommunityDestination;
  stats: CommunityStats;
  tags: string[];
  rules: CommunityRule[];
  isVerified: boolean;
  isPremium: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: MemberRole;
  status: MembershipStatus;
  joinedAt: Date;
  // User info (denormalized for display)
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
    isVerified: boolean;
    isPremium: boolean;
  };
}

export interface CommunityPreview {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  type: CommunityType;
  privacy: CommunityPrivacy;
  memberCount: number;
  description?: string;
  destination?: {
    city: string;
    country: string;
  };
  tags: string[];
  isVerified: boolean;
  isMember: boolean;
  lastActivity?: Date;
}

// ============================================
// COMMUNITY ACTIONS
// ============================================

export interface CreateCommunityInput {
  name: string;
  description: string;
  type: CommunityType;
  privacy: CommunityPrivacy;
  destination?: CommunityDestination;
  tags: string[];
  coverImage?: string;
  avatar?: string;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  privacy?: CommunityPrivacy;
  tags?: string[];
  rules?: CommunityRule[];
  coverImage?: string;
  avatar?: string;
}

export interface JoinCommunityResult {
  success: boolean;
  status: MembershipStatus;
  message?: string;
}

// ============================================
// FILTERS & SEARCH
// ============================================

export interface CommunityFilters {
  type?: CommunityType;
  destination?: string;
  tags?: string[];
  privacy?: CommunityPrivacy;
  hasEvents?: boolean;
  isVerified?: boolean;
}

export interface CommunitySearchParams {
  query?: string;
  filters?: CommunityFilters;
  sortBy?: 'popular' | 'recent' | 'active' | 'nearby';
  limit?: number;
  offset?: number;
}

// ============================================
// COMMUNITY CATEGORIES (for discovery)
// ============================================

export interface CommunityCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  communityCount: number;
}

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  {
    id: 'destinations',
    name: 'Destinations',
    icon: 'location',
    description: 'Connect with travelers heading to specific places',
    communityCount: 0,
  },
  {
    id: 'interests',
    name: 'Interests',
    icon: 'heart',
    description: 'Find your tribe based on travel style',
    communityCount: 0,
  },
  {
    id: 'trips',
    name: 'Trip Groups',
    icon: 'airplane',
    description: 'Private groups for your travel squad',
    communityCount: 0,
  },
  {
    id: 'local',
    name: 'Local Guides',
    icon: 'people',
    description: 'Connect with locals at your destination',
    communityCount: 0,
  },
];
