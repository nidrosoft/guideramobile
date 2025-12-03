/**
 * MOCK DATA
 * 
 * Sample communities, messages, and events for development.
 * Will be replaced with real API data.
 */

import { Community, CommunityPreview, CommunityMember } from '../types/community.types';
import { Message, Chat, ChatListItem } from '../types/chat.types';
import { Event, EventPreview } from '../types/event.types';
import { BuddyMatch } from '../types/buddy.types';

// ============================================
// SAMPLE COMMUNITIES
// ============================================

export const MOCK_COMMUNITIES: CommunityPreview[] = [
  {
    id: 'comm-1',
    name: 'Tokyo Travelers 2025',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    type: 'destination',
    privacy: 'public',
    memberCount: 2847,
    destination: {
      city: 'Tokyo',
      country: 'Japan',
    },
    tags: ['foodie', 'photography'],
    isVerified: true,
    isMember: true,
    lastActivity: new Date('2024-12-01T10:30:00'),
  },
  {
    id: 'comm-2',
    name: 'Bali Digital Nomads',
    avatar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    type: 'interest',
    privacy: 'public',
    memberCount: 5621,
    destination: {
      city: 'Bali',
      country: 'Indonesia',
    },
    tags: ['digital nomad', 'budget'],
    isVerified: true,
    isMember: false,
    lastActivity: new Date('2024-12-01T09:15:00'),
  },
  {
    id: 'comm-3',
    name: 'Solo Female Travelers',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    type: 'interest',
    privacy: 'public',
    memberCount: 12453,
    tags: ['solo', 'adventure'],
    isVerified: true,
    isMember: true,
    lastActivity: new Date('2024-12-01T11:00:00'),
  },
  {
    id: 'comm-4',
    name: 'Europe Backpackers',
    avatar: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=200',
    coverImage: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    type: 'interest',
    privacy: 'public',
    memberCount: 8932,
    tags: ['backpacking', 'budget'],
    isVerified: false,
    isMember: false,
    lastActivity: new Date('2024-11-30T22:45:00'),
  },
  {
    id: 'comm-5',
    name: 'Santorini Sunset Chasers',
    avatar: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=200',
    coverImage: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    type: 'destination',
    privacy: 'public',
    memberCount: 3421,
    destination: {
      city: 'Santorini',
      country: 'Greece',
    },
    tags: ['luxury', 'photography'],
    isVerified: true,
    isMember: false,
    lastActivity: new Date('2024-12-01T08:30:00'),
  },
  {
    id: 'comm-6',
    name: 'NYC Foodies',
    avatar: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=200',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    type: 'local',
    privacy: 'public',
    memberCount: 4567,
    destination: {
      city: 'New York',
      country: 'USA',
    },
    tags: ['foodie', 'destination'],
    isVerified: false,
    isMember: true,
    lastActivity: new Date('2024-12-01T07:00:00'),
  },
];

// ============================================
// SAMPLE COMMUNITY DETAIL
// ============================================

export const MOCK_COMMUNITY_DETAIL: Community = {
  id: 'comm-1',
  name: 'Tokyo Travelers 2025',
  description: 'Welcome to the ultimate community for travelers heading to Tokyo! Share tips, find travel buddies, and discover hidden gems in Japan\'s incredible capital. Whether you\'re planning your first trip or you\'re a seasoned Tokyo explorer, you\'ll find valuable insights and amazing people here.',
  coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
  avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
  type: 'destination',
  privacy: 'public',
  destination: {
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: {
      lat: 35.6762,
      lng: 139.6503,
    },
  },
  stats: {
    memberCount: 2847,
    activeMembers: 342,
    postsCount: 1256,
    eventsCount: 8,
    messagesThisWeek: 892,
  },
  tags: ['cultural', 'foodie', 'photography', 'cities'],
  rules: [
    {
      id: 'rule-1',
      title: 'Be Respectful',
      description: 'Treat all members with respect. No harassment, hate speech, or personal attacks.',
      order: 1,
    },
    {
      id: 'rule-2',
      title: 'Stay On Topic',
      description: 'Keep discussions related to Tokyo travel. Off-topic posts may be removed.',
      order: 2,
    },
    {
      id: 'rule-3',
      title: 'No Spam or Self-Promotion',
      description: 'Don\'t spam the community with promotional content or affiliate links.',
      order: 3,
    },
    {
      id: 'rule-4',
      title: 'Share Authentic Experiences',
      description: 'Share your real experiences and honest recommendations.',
      order: 4,
    },
  ],
  isVerified: true,
  isPremium: false,
  createdBy: 'user-admin-1',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-12-01'),
};

// ============================================
// SAMPLE MESSAGES
// ============================================

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    chatId: 'comm-1',
    chatType: 'community',
    senderId: 'user-2',
    sender: {
      id: 'user-2',
      firstName: 'Sarah',
      lastName: 'Chen',
      avatar: 'https://i.pravatar.cc/150?img=5',
      isPremium: true,
    },
    type: 'text',
    content: 'Just booked my flight to Tokyo for March! Anyone else going around that time? 🇯🇵✈️',
    status: 'read',
    createdAt: new Date('2024-12-01T10:30:00'),
    isDeleted: false,
  },
  {
    id: 'msg-2',
    chatId: 'comm-1',
    chatType: 'community',
    senderId: 'user-3',
    sender: {
      id: 'user-3',
      firstName: 'Mike',
      lastName: 'Johnson',
      avatar: 'https://i.pravatar.cc/150?img=8',
      isPremium: true,
    },
    type: 'text',
    content: 'I\'ll be there March 15-25! Would love to meet up. Has anyone been to TeamLab Borderless? Is it worth the hype?',
    status: 'read',
    createdAt: new Date('2024-12-01T10:32:00'),
    isDeleted: false,
  },
  {
    id: 'msg-3',
    chatId: 'comm-1',
    chatType: 'community',
    senderId: 'user-4',
    sender: {
      id: 'user-4',
      firstName: 'Emma',
      lastName: 'Wilson',
      avatar: 'https://i.pravatar.cc/150?img=9',
      isPremium: true,
    },
    type: 'text',
    content: 'TeamLab is AMAZING! Definitely book tickets in advance though, they sell out fast. Pro tip: go on a weekday morning for fewer crowds.',
    status: 'read',
    createdAt: new Date('2024-12-01T10:35:00'),
    isDeleted: false,
  },
  {
    id: 'msg-4',
    chatId: 'comm-1',
    chatType: 'community',
    senderId: 'user-5',
    sender: {
      id: 'user-5',
      firstName: 'Yuki',
      lastName: 'Tanaka',
      avatar: 'https://i.pravatar.cc/150?img=11',
      isPremium: true,
    },
    type: 'text',
    content: 'Local here! 🙋‍♀️ If anyone needs restaurant recommendations or help navigating the train system, feel free to ask!',
    status: 'read',
    createdAt: new Date('2024-12-01T10:40:00'),
    isDeleted: false,
  },
  {
    id: 'msg-5',
    chatId: 'comm-1',
    chatType: 'community',
    senderId: 'user-2',
    sender: {
      id: 'user-2',
      firstName: 'Sarah',
      lastName: 'Chen',
      avatar: 'https://i.pravatar.cc/150?img=5',
      isPremium: true,
    },
    type: 'text',
    content: 'Yuki that\'s so helpful! I\'d love some ramen recommendations. Looking for the best tonkotsu in Shinjuku area!',
    status: 'delivered',
    createdAt: new Date('2024-12-01T10:42:00'),
    isDeleted: false,
  },
];

// ============================================
// SAMPLE CHAT LIST
// ============================================

export const MOCK_CHAT_LIST: ChatListItem[] = [
  {
    id: 'comm-1',
    type: 'community',
    name: 'Tokyo Travelers 2025',
    avatar: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200',
    lastMessage: 'Yuki that\'s so helpful! I\'d love some ramen...',
    lastMessageTime: new Date('2024-12-01T10:42:00'),
    unreadCount: 3,
    isMuted: false,
    isPinned: true,
  },
  {
    id: 'comm-3',
    type: 'community',
    name: 'Solo Female Travelers',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200',
    lastMessage: 'Great tips everyone! Stay safe out there 💪',
    lastMessageTime: new Date('2024-12-01T09:15:00'),
    unreadCount: 0,
    isMuted: false,
    isPinned: false,
  },
  {
    id: 'dm-1',
    type: 'direct',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'See you in Tokyo!',
    lastMessageTime: new Date('2024-11-30T18:30:00'),
    unreadCount: 1,
    isMuted: false,
    isPinned: false,
    isOnline: true,
  },
];

// ============================================
// SAMPLE EVENTS
// ============================================

export const MOCK_EVENTS: EventPreview[] = [
  {
    id: 'event-1',
    communityId: 'comm-1',
    title: 'Tokyo Meetup - Cherry Blossom Season',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
    type: 'meetup',
    status: 'upcoming',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      isVirtual: false,
    },
    startDate: new Date('2025-03-25T14:00:00'),
    attendeeCount: 24,
    myRSVP: 'going',
  },
  {
    id: 'event-2',
    communityId: 'comm-1',
    title: 'Virtual Q&A: First Time in Japan',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
    type: 'virtual',
    status: 'upcoming',
    location: {
      city: 'Online',
      country: '',
      isVirtual: true,
    },
    startDate: new Date('2024-12-15T10:00:00'),
    attendeeCount: 156,
    myRSVP: 'maybe',
  },
  {
    id: 'event-3',
    communityId: 'comm-3',
    title: 'Solo Travel Safety Workshop',
    coverImage: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=800',
    type: 'virtual',
    status: 'upcoming',
    location: {
      city: 'Online',
      country: '',
      isVirtual: true,
    },
    startDate: new Date('2024-12-10T18:00:00'),
    attendeeCount: 89,
    myRSVP: 'none',
  },
];

// ============================================
// SAMPLE BUDDY MATCHES
// ============================================

export const MOCK_BUDDY_MATCHES: BuddyMatch[] = [
  {
    id: 'buddy-1',
    userId: 'user-10',
    firstName: 'Alex',
    lastName: 'Rivera',
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: 'Adventure seeker and photography enthusiast. Love exploring off-the-beaten-path destinations!',
    matchScore: 92,
    matchReasons: ['Same destination', 'Similar travel dates', 'Shared interests'],
    travelStyles: ['adventure', 'backpacker'],
    languages: ['English', 'Spanish'],
    verificationLevel: 'phone',
    countriesVisited: 28,
    rating: 4.8,
    connectionStatus: 'none',
    sharedTrip: {
      destination: 'Tokyo, Japan',
      dates: 'Mar 15 - Mar 25, 2025',
    },
  },
  {
    id: 'buddy-2',
    userId: 'user-11',
    firstName: 'Priya',
    lastName: 'Sharma',
    avatar: 'https://i.pravatar.cc/150?img=23',
    bio: 'Digital nomad working remotely while exploring Asia. Always up for good food and great conversations!',
    matchScore: 87,
    matchReasons: ['Same destination', 'Similar interests'],
    travelStyles: ['mid_range', 'relaxation'],
    languages: ['English', 'Hindi'],
    verificationLevel: 'id',
    countriesVisited: 15,
    rating: 4.9,
    connectionStatus: 'none',
    sharedTrip: {
      destination: 'Tokyo, Japan',
      dates: 'Mar 20 - Apr 5, 2025',
    },
  },
  {
    id: 'buddy-3',
    userId: 'user-12',
    firstName: 'Marcus',
    lastName: 'Lee',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Foodie on a mission to try every local dish. Currently planning my Japan ramen tour!',
    matchScore: 78,
    matchReasons: ['Same destination', 'Foodie interest'],
    travelStyles: ['mid_range', 'adventure'],
    languages: ['English', 'Mandarin'],
    verificationLevel: 'email',
    countriesVisited: 12,
    rating: 4.6,
    connectionStatus: 'pending_sent',
    sharedTrip: {
      destination: 'Tokyo, Japan',
      dates: 'Mar 10 - Mar 20, 2025',
    },
  },
];

// ============================================
// MY COMMUNITIES (Joined)
// ============================================

export const MY_COMMUNITIES = MOCK_COMMUNITIES.filter(c => c.isMember);

// ============================================
// DISCOVER COMMUNITIES (Not joined)
// ============================================

export const DISCOVER_COMMUNITIES = MOCK_COMMUNITIES.filter(c => !c.isMember);
