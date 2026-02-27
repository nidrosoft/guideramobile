/**
 * Community Service Types
 * Core type definitions for the Community & Social System
 */

// ============================================
// GROUP TYPES
// ============================================

export type GroupPrivacy = 'public' | 'private';
export type GroupJoinApproval = 'automatic' | 'admin_approval';
export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type GroupMemberStatus = 'active' | 'muted' | 'banned';
export type GroupCategory = 'destination' | 'interest' | 'regional' | 'activity' | 'event' | 'professional' | 'other';

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverPhotoUrl?: string;
  groupPhotoUrl?: string;
  destinationCode?: string;
  destinationName?: string;
  destinationCountry?: string;
  privacy: GroupPrivacy;
  joinApproval: GroupJoinApproval;
  memberLimit?: number;
  whoCanPost: 'anyone' | 'admins_only';
  mediaAllowed: boolean;
  linksAllowed: boolean;
  discoverable: boolean;
  inviteOnly: boolean;
  category?: GroupCategory;
  tags: string[];
  languages: string[];
  travelStyles: string[];
  memberCount: number;
  activeMemberCount: number;
  postCount: number;
  isVerified: boolean;
  verifiedAt?: Date;
  status: 'active' | 'archived' | 'suspended';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  notificationsEnabled: boolean;
  mutedUntil?: Date;
  lastVisitedAt?: Date;
  messageCount: number;
  status: GroupMemberStatus;
  joinedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  respondedBy?: string;
  respondedAt?: Date;
  rejectionReason?: string;
  requestedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  groupPhotoUrl?: string;
  destinationCode?: string;
  destinationName?: string;
  destinationCountry?: string;
  privacy?: GroupPrivacy;
  joinApproval?: GroupJoinApproval;
  memberLimit?: number;
  category?: GroupCategory;
  tags?: string[];
  languages?: string[];
  travelStyles?: string[];
}

export interface GroupFilters {
  category?: GroupCategory;
  destination?: string;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// ============================================
// BUDDY TYPES
// ============================================

export type BuddyStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';

export interface BuddyConnection {
  id: string;
  userId1: string;
  userId2: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'connected' | 'blocked';
  connectedAt?: Date;
  blockedBy?: string;
  blockedAt?: Date;
}

export interface BuddySuggestion {
  user: UserProfile;
  matchScore: number;
  matchReasons: MatchReason[];
  tripOverlap?: {
    destination: string;
    yourDates: { start: Date; end: Date };
    theirDates: { start: Date; end: Date };
    overlapDays: number;
  };
}

export interface MatchReason {
  type: 'same_destination' | 'similar_dates' | 'similar_interests' | 
        'same_nationality' | 'speaks_same_language' | 'similar_age' |
        'same_travel_style' | 'mutual_buddies';
  label: string;
  weight: number;
}

export interface MatchCalculation {
  factors: Record<string, number>;
  rawScore: number;
  finalScore: number;
  reasons: MatchReason[];
}

// ============================================
// LOCATION & ACTIVITY TYPES
// ============================================

export type ActivityType = 
  | 'coffee'
  | 'food'
  | 'drinks'
  | 'sightseeing'
  | 'walking_tour'
  | 'museum'
  | 'nightlife'
  | 'sports'
  | 'coworking'
  | 'language_exchange'
  | 'other';

export type ActivityTiming = 'now' | 'today' | 'tomorrow' | 'specific';
export type ActivityStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type LocationVisibility = 'everyone' | 'buddies_only' | 'nobody';
export type UserStatus = 'available' | 'busy' | 'invisible';

export interface UserLiveLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  precision: 'exact' | 'approximate' | 'city_only';
  visibleTo: LocationVisibility;
  status: UserStatus;
  statusMessage?: string;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface Activity {
  id: string;
  createdBy: string;
  type: ActivityType;
  title: string;
  description?: string;
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  timing: ActivityTiming;
  scheduledFor?: Date;
  durationMinutes?: number;
  maxParticipants?: number;
  participantCount: number;
  visibility: 'everyone' | 'buddies_only' | 'selected';
  status: ActivityStatus;
  createdAt: Date;
  expiresAt: Date;
  creator?: UserProfile;
  participants?: ActivityParticipant[];
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  userId: string;
  status: 'going' | 'maybe' | 'invited';
  joinedAt: Date;
  user?: UserProfile;
}

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string;
  location: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    placeId?: string;
  };
  timing: ActivityTiming;
  scheduledFor?: Date;
  duration?: number;
  maxParticipants?: number;
  visibility?: 'everyone' | 'buddies_only' | 'selected';
  invitedUsers?: string[];
  expiresIn?: number;
}

export interface NearbyTraveler {
  userId: string;
  name: string;
  avatar?: string;
  nationality?: string;
  nationalityFlag?: string;
  distanceKm: number;
  distanceLabel: string;
  sharedInterests: string[];
  sharedCount: number;
  status: UserStatus;
  statusMessage?: string;
  lastActive: Date;
  isBuddy: boolean;
}

// ============================================
// EVENT TYPES
// ============================================

export type EventType = 'meetup' | 'trip' | 'workshop' | 'social' | 'other';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'waitlist';

export interface CommunityEvent {
  id: string;
  type: EventType;
  groupId?: string;
  createdBy: string;
  title: string;
  description?: string;
  category?: string;
  coverImageUrl?: string;
  locationType: 'physical' | 'virtual' | 'hybrid';
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  meetingLink?: string;
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  isAllDay: boolean;
  maxAttendees?: number;
  attendeeCount: number;
  rsvpRequired: boolean;
  rsvpDeadline?: Date;
  waitlistEnabled: boolean;
  visibility: 'public' | 'group_only' | 'invite_only';
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  creator?: UserProfile;
  group?: Group;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  rsvpStatus: RSVPStatus;
  rsvpAt: Date;
  isOrganizer: boolean;
  checkedIn: boolean;
  checkedInAt?: Date;
  user?: UserProfile;
}

export interface CreateEventInput {
  type: EventType;
  groupId?: string;
  title: string;
  description?: string;
  category?: string;
  coverImageUrl?: string;
  locationType?: 'physical' | 'virtual' | 'hybrid';
  locationName?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  meetingLink?: string;
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  isAllDay?: boolean;
  maxAttendees?: number;
  rsvpRequired?: boolean;
  rsvpDeadline?: Date;
  waitlistEnabled?: boolean;
  visibility?: 'public' | 'group_only' | 'invite_only';
}

// ============================================
// USER PROFILE TYPES
// ============================================

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  homeCity?: string;
  homeCountry?: string;
  nationality?: string;
  languages?: string[];
  travelStyles?: string[];
  interests?: Interest[];
  tripCount?: number;
  countryCount?: number;
  buddyCount?: number;
  averageRating?: number;
  ratingCount?: number;
  trustScore?: number;
  isVerified?: boolean;
}

export interface UserSocialProfile {
  id: string;
  userId: string;
  bio?: string;
  coverPhotoUrl?: string;
  homeCity?: string;
  homeCountry?: string;
  languages: string[];
  travelStyles: string[];
  interests: Interest[];
  tripCount: number;
  countryCount: number;
  buddyCount: number;
  averageRating?: number;
  ratingCount: number;
  trustScore: number;
  profileVisibility: 'public' | 'buddies_only' | 'private';
  showTrips: boolean;
  showLocation: boolean;
  showOnlineStatus: boolean;
  whoCanMessage: 'everyone' | 'buddies_only' | 'nobody';
  whoCanBuddyRequest: 'everyone' | 'buddies_only' | 'nobody';
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  category: string;
}

// ============================================
// CHAT TYPES
// ============================================

export type ChatType = 'group' | 'direct' | 'activity' | 'event';
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'event' | 'poll';

export interface ChatRoom {
  id: string;
  type: ChatType;
  referenceId: string;
  name?: string;
  messageCount: number;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
}

export interface DirectConversation {
  id: string;
  userId1: string;
  userId2: string;
  messageCount: number;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
  otherUser?: UserProfile;
}

export interface Message {
  id: string;
  chatType: ChatType;
  chatRoomId?: string;
  conversationId?: string;
  senderId: string;
  type: MessageType;
  content?: string;
  media?: MediaAttachment[];
  replyToId?: string;
  mentions?: string[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: Date;
  editedAt?: Date;
  sender?: UserProfile;
  reactions?: MessageReaction[];
  replyTo?: Message;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'voice' | 'file';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface SendMessageInput {
  type?: MessageType;
  content: string;
  media?: MediaAttachment[];
  replyTo?: string;
  mentions?: string[];
}

// ============================================
// MODERATION TYPES
// ============================================

export type ReportType = 'spam' | 'harassment' | 'inappropriate' | 'fake_profile' | 'scam' | 'other';
export type ContentType = 'message' | 'group' | 'event' | 'activity' | 'profile';

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: ContentType;
  contentId: string;
  reportType: ReportType;
  description?: string;
  screenshots?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  actionTaken?: string;
  createdAt: Date;
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: Date;
}
