/**
 * COMMUNITY FEATURE
 * 
 * Public exports for the Community feature module.
 */

// Screens
export { default as CommunityHubScreen } from './screens/CommunityHubScreen';
export { default as CommunityDetailScreen } from './screens/CommunityDetailScreen';
export { default as CreateGroupScreen } from './screens/CreateGroupScreen';
export { default as NotificationsScreen } from './screens/NotificationsScreen';
export { default as BuddyProfileScreen } from './screens/BuddyProfileScreen';
export { default as EventDetailScreen } from './screens/EventDetailScreen';
export { default as GroupAdminScreen } from './screens/GroupAdminScreen';
export { default as CreateEventScreen } from './screens/CreateEventScreen';
export { default as MessagesListScreen } from './screens/MessagesListScreen';
export { default as ReportScreen } from './screens/ReportScreen';
export { default as SearchScreen } from './screens/SearchScreen';
export { default as LiveMapScreen } from './screens/LiveMapScreen';
export { default as CreateActivityScreen } from './screens/CreateActivityScreen';
export { default as ChatScreen } from './screens/ChatScreen';

// Guide Screens
export { default as GuideProfileScreen } from './screens/GuideProfileScreen';
export { default as BecomeGuideScreen } from './screens/BecomeGuideScreen';
export { default as GuidesTabContent } from './screens/GuidesTabContent';
export { default as CreateListingScreen } from './screens/CreateListingScreen';
export { default as ListingDetailScreen } from './screens/ListingDetailScreen';

// Components
export { default as CommunityCard } from './components/CommunityCard';
export { default as QuickActionCard } from './components/QuickActionCard';
export { default as SectionHeader } from './components/SectionHeader';
export { default as BuddyMatchCard } from './components/BuddyMatchCard';
export { default as EventCard } from './components/EventCard';
export { default as JoinButton } from './components/JoinButton';
export { default as ChatInput } from './components/ChatInput';
export { default as ActivityCard } from './components/ActivityCard';
export { default as NearbyTravelerCard } from './components/NearbyTravelerCard';
export { default as ChatMessageBubble } from './components/ChatMessageBubble';
export { default as ProfileCompletenessCard } from './components/ProfileCompletenessCard';
export { default as EventsTabContent } from './components/EventsTabContent';
export { default as DiscoverTabContent } from './components/DiscoverTabContent';
export { default as LocationSharingSettings } from './components/LocationSharingSettings';

// Guide Components
export { default as TrustBadge } from './components/TrustBadge';
export { default as GuideCard } from './components/GuideCard';
export { default as ListingCard } from './components/ListingCard';
export { default as ReviewCard } from './components/ReviewCard';
export { default as VouchCard } from './components/VouchCard';
export { default as PostCard } from './components/PostCard';
export { default as BecomeGuideCard } from './components/BecomeGuideCard';

// Hooks
export { useCommunityMembership } from './hooks/useCommunityMembership';

// Types
export * from './types/community.types';
export * from './types/chat.types';
export * from './types/event.types';
export * from './types/buddy.types';
export * from './types/guide.types';

// Config
export * from './config/community.config';

// Mock Data (for development)
export * from './data/mockData';
export * from './data/guideMockData';
