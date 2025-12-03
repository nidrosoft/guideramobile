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

// Components
export { default as CommunityCard } from './components/CommunityCard';
export { default as QuickActionCard } from './components/QuickActionCard';
export { default as SectionHeader } from './components/SectionHeader';
export { default as BuddyMatchCard } from './components/BuddyMatchCard';
export { default as EventCard } from './components/EventCard';
export { default as JoinButton } from './components/JoinButton';
export { default as ChatInput } from './components/ChatInput';

// Hooks
export { useCommunityMembership } from './hooks/useCommunityMembership';

// Types
export * from './types/community.types';
export * from './types/chat.types';
export * from './types/event.types';
export * from './types/buddy.types';

// Config
export * from './config/community.config';

// Mock Data (for development)
export * from './data/mockData';
