/**
 * COMMUNITY CONFIG
 * 
 * Feature flags, limits, and configuration for the Community feature.
 */

// ============================================
// FEATURE FLAGS
// ============================================

export const COMMUNITY_FEATURES = {
  // Core features
  communities: true,
  chat: true,
  events: true,
  buddies: true,
  
  // Chat features (Phase 2+)
  mediaSharing: false,
  voiceMessages: false,
  reactions: false,
  threadedReplies: false,
  
  // Advanced features (Future)
  videoCalls: false,
  polls: false,
  announcements: false,
  
  // Moderation
  reportContent: true,
  blockUsers: true,
  muteChats: true,
} as const;

// ============================================
// LIMITS
// ============================================

export const COMMUNITY_LIMITS = {
  // Community limits
  maxCommunitiesPerUser: 50,
  maxCommunitiesCreatedFree: 0, // Premium only
  maxCommunitiesCreatedPremium: 10,
  maxMembersPerCommunity: 10000,
  maxAdminsPerCommunity: 10,
  maxModeratorsPerCommunity: 50,
  maxRulesPerCommunity: 20,
  maxTagsPerCommunity: 10,
  
  // Chat limits
  maxMessageLength: 2000,
  maxMessagesPerMinute: 30,
  maxMediaPerMessage: 10,
  maxFileSizeMB: 25,
  
  // Event limits
  maxEventsPerCommunity: 100,
  maxAttendeesPerEvent: 500,
  maxCoHostsPerEvent: 5,
  
  // Buddy limits
  maxUpcomingTrips: 10,
  maxConnectionRequestsPerDay: 20,
  maxPendingConnections: 50,
} as const;

// ============================================
// PREMIUM REQUIREMENTS
// ============================================

export const PREMIUM_REQUIREMENTS = {
  // Actions that require premium
  createCommunity: true,
  sendMessages: true,
  sendMedia: true,
  createEvents: true,
  sendBuddyRequests: true,
  
  // Actions available to all
  joinCommunity: false,
  viewMessages: false,
  viewEvents: false,
  rsvpEvents: false, // Can RSVP but not create
  viewBuddyProfiles: false,
} as const;

// ============================================
// COMMUNITY TAGS (Predefined)
// ============================================

export const COMMUNITY_TAGS = {
  travelStyle: [
    'backpacking',
    'luxury',
    'budget',
    'adventure',
    'relaxation',
    'cultural',
    'foodie',
    'photography',
    'solo',
    'family',
    'couples',
    'digital-nomad',
  ],
  interests: [
    'hiking',
    'beaches',
    'mountains',
    'cities',
    'nightlife',
    'history',
    'art',
    'music',
    'sports',
    'wildlife',
    'diving',
    'skiing',
  ],
  tripType: [
    'weekend-getaway',
    'road-trip',
    'backpacking',
    'cruise',
    'group-tour',
    'workation',
    'honeymoon',
    'gap-year',
  ],
} as const;

// ============================================
// INTEREST ICONS
// ============================================

export const INTEREST_ICONS: Record<string, string> = {
  hiking: 'tree',
  beaches: 'sun',
  mountains: 'mountain',
  cities: 'building',
  nightlife: 'moon',
  history: 'book',
  art: 'brush',
  music: 'music',
  sports: 'activity',
  wildlife: 'paw',
  diving: 'droplet',
  skiing: 'snowflake',
};

// ============================================
// VERIFICATION BADGES
// ============================================

export const VERIFICATION_BADGES = {
  none: {
    label: 'Unverified',
    color: 'gray',
    icon: null,
  },
  email: {
    label: 'Email Verified',
    color: 'blue',
    icon: 'mail',
  },
  phone: {
    label: 'Phone Verified',
    color: 'green',
    icon: 'phone',
  },
  id: {
    label: 'ID Verified',
    color: 'purple',
    icon: 'shield',
  },
  full: {
    label: 'Fully Verified',
    color: 'gold',
    icon: 'verified',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function canPerformAction(
  action: keyof typeof PREMIUM_REQUIREMENTS,
  isPremium: boolean
): boolean {
  const requiresPremium = PREMIUM_REQUIREMENTS[action];
  return !requiresPremium || isPremium;
}

export function getCommunityLimit(
  limit: keyof typeof COMMUNITY_LIMITS,
  isPremium: boolean
): number {
  if (limit === 'maxCommunitiesCreatedFree' && !isPremium) {
    return COMMUNITY_LIMITS.maxCommunitiesCreatedFree;
  }
  if (limit === 'maxCommunitiesCreatedPremium' && isPremium) {
    return COMMUNITY_LIMITS.maxCommunitiesCreatedPremium;
  }
  return COMMUNITY_LIMITS[limit];
}
