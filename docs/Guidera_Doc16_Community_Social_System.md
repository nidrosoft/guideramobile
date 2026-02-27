# Document 16: Community & Social System

## The Social Layer of Guidera

This document defines the **Community & Social System** — transforming Guidera from a travel tool into a vibrant travel community where travelers connect, share experiences, and meet up around the world.

**Vision:** No traveler is ever alone. Whether you're a solo backpacker in Tokyo or a digital nomad in Lisbon, Guidera connects you with like-minded travelers nearby.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Groups System](#groups-system)
3. [Buddies System](#buddies-system)
4. [Live Map & Nearby Travelers](#live-map--nearby-travelers)
5. [Events System](#events-system)
6. [Matching Algorithm](#matching-algorithm)
7. [Chat System](#chat-system)
8. [User Profiles (Social)](#user-profiles-social)
9. [Discovery Engine](#discovery-engine)
10. [Moderation & Safety](#moderation--safety)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [Implementation Guide](#implementation-guide)

---

## Part 1: System Overview

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           GUIDERA COMMUNITY SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                              COMMUNITY TAB                                   │    │
│  │                                                                              │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │    │
│  │   │ Discover │  │My Groups │  │ Buddies  │  │  Events  │                   │    │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │    │
│  │        │             │             │             │                          │    │
│  └────────┼─────────────┼─────────────┼─────────────┼──────────────────────────┘    │
│           │             │             │             │                               │
│  ┌────────▼─────────────▼─────────────▼─────────────▼──────────────────────────┐    │
│  │                           CORE FEATURES                                      │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   GROUPS        │  │   BUDDIES       │  │   LIVE MAP      │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • Create/Join   │  │ • Matching      │  │ • Nearby Users  │             │    │
│  │  │ • Group Chat    │  │ • Connect       │  │ • Meetup Req    │             │    │
│  │  │ • Members       │  │ • DM Chat       │  │ • Real-time     │             │    │
│  │  │ • Events        │  │ • Profiles      │  │ • Activities    │             │    │
│  │  │ • Moderation    │  │ • Trip Overlap  │  │ • Join Chat     │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   EVENTS        │  │   CHAT          │  │   MATCHING      │             │    │
│  │  │                 │  │                 │  │   ENGINE        │             │    │
│  │  │ • Group Events  │  │ • Group Chat    │  │                 │             │    │
│  │  │ • Local Events  │  │ • Direct Msgs   │  │ • Interests     │             │    │
│  │  │ • Meetups       │  │ • Meetup Chat   │  │ • Destination   │             │    │
│  │  │ • RSVPs         │  │ • Media Share   │  │ • Dates         │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  └──────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                        SUPPORTING SERVICES                                    │   │
│  │                                                                               │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │   │
│  │  │ Location   │ │ Notifica-  │ │ Content    │ │ Safety &   │ │ Analytics  │ │   │
│  │  │ Service    │ │ tions      │ │ Moderation │ │ Reporting  │ │            │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Concepts

| Concept | Description |
|---------|-------------|
| **Group** | A community of travelers with shared interests/destinations (like Facebook Groups) |
| **Buddy** | A 1:1 connection between two travelers (like Friends) |
| **Meetup** | A spontaneous or planned in-person gathering |
| **Live Map** | Real-time view of nearby travelers open to connecting |
| **Activity** | A proposed meetup (e.g., "Coffee by Eiffel Tower today") |
| **Match Score** | Algorithm-calculated compatibility percentage |

### 1.3 User Journey Overview

```
New User → Complete Profile → Discover Groups → Join Groups → 
         ↓
Find Buddies → Send Connection → Buddy Accepts → Direct Chat →
         ↓
Enable Live Map → See Nearby Travelers → Send Meetup Request →
         ↓
Meet in Person → Rate Experience → Build Reputation
```

---

## Part 2: Groups System

### 2.1 Group Types

| Type | Description | Example |
|------|-------------|---------|
| **Destination** | Focused on a specific destination | "Tokyo Travelers 2025" |
| **Interest** | Focused on travel style/interest | "Beach & Sea Lovers" |
| **Regional** | Travelers from a region | "UK Travel Community" |
| **Activity** | Specific travel activities | "Backpackers United" |
| **Event-Based** | Around specific events | "Burning Man 2025" |
| **Professional** | Digital nomads, remote workers | "Remote Workers Asia" |

### 2.2 Group Creation Flow

#### Step 1: Basic Info
```typescript
interface GroupCreationStep1 {
  coverPhoto?: string;           // Optional cover image
  groupPhoto?: string;           // Required group avatar
  name: string;                  // Required, max 50 chars
  description: string;           // Optional, max 500 chars
  destination?: {                // Optional destination focus
    code: string;
    name: string;
    country: string;
  };
}
```

#### Step 2: Settings
```typescript
interface GroupCreationStep2 {
  privacy: 'public' | 'private';
  
  // Membership settings
  joinApproval: 'automatic' | 'admin_approval';
  memberLimit?: number;          // null = unlimited
  
  // Content settings
  whoCanPost: 'anyone' | 'admins_only';
  mediaAllowed: boolean;
  linksAllowed: boolean;
  
  // Discovery settings
  discoverable: boolean;         // Show in Discover
  inviteOnly: boolean;           // Only join via invite
}
```

#### Step 3: Categories & Tags
```typescript
interface GroupCreationStep3 {
  category: GroupCategory;
  tags: string[];               // Max 5 tags
  languages: string[];          // Supported languages
  travelStyle: TravelStyle[];   // Adventure, Budget, Luxury, etc.
}

type GroupCategory = 
  | 'destination'
  | 'interest'
  | 'regional'
  | 'activity'
  | 'event'
  | 'professional'
  | 'other';

type TravelStyle =
  | 'adventure'
  | 'budget'
  | 'luxury'
  | 'solo'
  | 'family'
  | 'couples'
  | 'backpacking'
  | 'digital_nomad'
  | 'photography'
  | 'foodie'
  | 'cultural'
  | 'beach'
  | 'mountain'
  | 'urban';
```

### 2.3 Group Membership

#### Membership Roles
```typescript
type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';

interface GroupMemberPermissions {
  owner: {
    deleteGroup: true,
    transferOwnership: true,
    manageAdmins: true,
    manageSettings: true,
    removeMembers: true,
    approveMembers: true,
    pinPosts: true,
    deleteAnyPost: true,
    createEvents: true
  },
  admin: {
    manageSettings: true,
    removeMembers: true,
    approveMembers: true,
    pinPosts: true,
    deleteAnyPost: true,
    createEvents: true
  },
  moderator: {
    approveMembers: true,
    pinPosts: true,
    deleteAnyPost: true
  },
  member: {
    post: true,
    comment: true,
    react: true,
    inviteOthers: true  // If group allows
  }
}
```

#### Join Request Flow
```
User → Request to Join → [If admin_approval required]
                              ↓
                         Admin Notified → Admin Reviews → Approve/Reject
                              ↓                              ↓
                         User Notified ←───────────────────←─┘
```

### 2.4 Group Features

#### 2.4.1 Group Tabs

| Tab | Content |
|-----|---------|
| **Chat** | Real-time group messages, media, reactions |
| **Members** | Member list with roles, online status, profiles |
| **Events** | Group-specific events and meetups |
| **About** | Group info, rules, admins, settings |
| **Media** | Photos/videos shared in group (optional) |

#### 2.4.2 Group Chat
```typescript
interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  
  // Content
  type: 'text' | 'image' | 'video' | 'voice' | 'location' | 'event' | 'poll';
  content: string;
  media?: MediaAttachment[];
  
  // Metadata
  createdAt: Date;
  editedAt?: Date;
  
  // Interactions
  reactions: Reaction[];
  replyTo?: string;              // Reply to another message
  
  // Status
  isPinned: boolean;
  isDeleted: boolean;
}

interface MediaAttachment {
  type: 'image' | 'video' | 'voice' | 'file';
  url: string;
  thumbnail?: string;
  duration?: number;             // For voice/video
  size: number;
}

interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}
```

#### 2.4.3 Group Stats Dashboard
```typescript
interface GroupStats {
  totalMembers: number;
  activeMembers: number;         // Active in last 30 days
  onlineNow: number;
  
  // Activity
  totalPosts: number;
  postsThisWeek: number;
  totalEvents: number;
  upcomingEvents: number;
  
  // Growth
  newMembersThisWeek: number;
  memberGrowthRate: number;      // Percentage
  
  // For admins
  pendingRequests: number;
  reportedContent: number;
}
```

### 2.5 User's Group Dashboard

```typescript
interface UserGroupDashboard {
  // Header stats (from screenshot)
  stats: {
    activeGroups: number;        // Groups user is member of
    totalActivity: number;       // Posts/comments this month
    waitingGroups: number;       // Pending join requests
  };
  
  // Sections
  waitingConfirmation: GroupJoinRequest[];  // User's pending requests
  myGroups: UserGroup[];                     // Groups user is member of
}

interface GroupJoinRequest {
  id: string;
  group: GroupSummary;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  respondedAt?: Date;
}

interface UserGroup {
  group: GroupSummary;
  role: GroupRole;
  joinedAt: Date;
  lastVisited: Date;
  unreadCount: number;
  notificationsEnabled: boolean;
}

interface GroupSummary {
  id: string;
  name: string;
  coverPhoto: string;
  groupPhoto: string;
  memberCount: number;
  isVerified: boolean;
  destination?: string;
}
```

---

## Part 3: Buddies System

### 3.1 What is a Buddy?

A **Buddy** is a 1:1 connection between two travelers — like a friend on social media, but specifically for travel connections. Buddies can:
- See each other's upcoming trips
- Get notified of trip overlaps
- Direct message each other
- See each other on the Live Map (if enabled)
- Coordinate meetups

### 3.2 Buddy Discovery

#### Finding Potential Buddies
```typescript
interface BuddySuggestion {
  user: TravelerProfile;
  matchScore: number;            // 0-100 percentage
  matchReasons: MatchReason[];   // Why they match
  
  // Trip overlap info
  tripOverlap?: {
    destination: string;
    yourDates: DateRange;
    theirDates: DateRange;
    overlapDays: number;
  };
}

interface MatchReason {
  type: 'same_destination' | 'similar_dates' | 'similar_interests' | 
        'same_nationality' | 'speaks_same_language' | 'similar_age' |
        'same_travel_style' | 'foodie_interest' | 'mutual_buddies';
  label: string;                 // "Same destination", "Similar travel dates"
  weight: number;                // Contribution to match score
}
```

#### Buddy Matching Display (from screenshot)
```
┌─────────────────────────────────────────────────────┐
│  [Avatar]  Priya Sharma           [87% match]       │
│            📍 Tokyo, Japan • Mar 20 - Apr 5, 2025   │
│                                                     │
│  Digital nomad working remotely while exploring     │
│  Asia. Always up...                                 │
│                                                     │
│  ✓ Same destination   ✓ Similar interests           │
│                                         [Connect]   │
└─────────────────────────────────────────────────────┘
```

### 3.3 Connection Flow

```
User A sees User B → Tap "Connect" → Connection Request Sent
                                            ↓
                                    User B Notified
                                            ↓
User B Reviews Profile → Accept / Ignore / Block
        ↓                    ↓
     Accept              Ignore: No notification
        ↓
   User A Notified → Both are now Buddies → Can DM & see trips
```

### 3.4 Buddy Relationship States

```typescript
type BuddyStatus = 
  | 'none'           // No relationship
  | 'pending_sent'   // User sent request
  | 'pending_received' // User received request
  | 'connected'      // Mutual buddies
  | 'blocked';       // One blocked the other

interface BuddyConnection {
  id: string;
  userId: string;
  buddyId: string;
  status: BuddyStatus;
  
  // Request info
  requestedBy: string;
  requestedAt: Date;
  respondedAt?: Date;
  
  // Connection info (if connected)
  connectedAt?: Date;
  
  // Settings
  notificationsEnabled: boolean;
  showOnMap: boolean;            // Show buddy on Live Map
  
  // Interaction stats
  lastInteraction?: Date;
  messageCount: number;
  meetupCount: number;
}
```

### 3.5 Buddy Features

| Feature | Description |
|---------|-------------|
| **Direct Messages** | Private 1:1 chat |
| **Trip Visibility** | See each other's upcoming trips |
| **Trip Overlap Alerts** | Notified when trips overlap |
| **Live Map Visibility** | See buddy on map (if enabled) |
| **Quick Meetup** | Send meetup request directly |
| **Profile Access** | View full profile |
| **Buddy Rating** | Rate after meetup (optional) |

---

## Part 4: Live Map & Nearby Travelers

### 4.1 The Live Map Concept

The Live Map shows travelers who are **currently in your area** and **open to connecting**. This is the feature that makes spontaneous meetups possible.

**Key Insight from NomadTable:** The viral "3 years solo travelling and NOW I find this??" reaction shows how powerful this feature is for solo travelers.

### 4.2 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LIVE MAP VIEW                                  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         [MAP OF PARIS]                             │  │
│  │                                                                    │  │
│  │     📍User                    🔴 100+ Travelers Here               │  │
│  │       ↓                                                            │  │
│  │     [You]          [🥐]  ←── Activity Pin                         │  │
│  │                     │                                              │  │
│  │                   [Avatar] [Avatar] ←── Traveler Pins             │  │
│  │                                                                    │  │
│  │              [4] ←── Cluster (4 travelers)                        │  │
│  │                                                                    │  │
│  │  [🔍 Search]                              [📍 Recenter]           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️  Iyla wants to coffee and croissant by the Eiffel Tower today │  │
│  │     2 going 🎉    [Avatar] [Avatar]                               │  │
│  │                                              [Join Chat]          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Map Elements

#### 4.3.1 Traveler Pins
```typescript
interface TravelerMapPin {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    updatedAt: Date;
  };
  
  // Display info
  avatar: string;
  name: string;
  nationality: string;
  
  // Distance from viewer
  distanceKm: number;
  distanceLabel: string;         // "4km away"
  
  // Shared attributes (for quick view)
  sharedCount: number;           // "2 shared" interests
  sharedItems: string[];         // ["🍕", "📸"]
  
  // Availability
  status: 'available' | 'busy' | 'invisible';
  statusMessage?: string;        // "Looking for coffee buddy!"
}
```

#### 4.3.2 Activity Pins (Meetup Proposals)
```typescript
interface ActivityPin {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  
  // Activity details
  type: ActivityType;
  title: string;                 // "Coffee and croissant by the Eiffel Tower"
  description?: string;
  
  // Location
  location: {
    latitude: number;
    longitude: number;
    name: string;                // "Café de Flore"
    address?: string;
  };
  
  // Timing
  timing: 'now' | 'today' | 'tomorrow' | 'specific';
  scheduledFor?: Date;
  duration?: number;             // minutes
  
  // Participants
  maxParticipants?: number;
  participants: Participant[];
  
  // Status
  status: 'open' | 'full' | 'cancelled' | 'completed';
  createdAt: Date;
  expiresAt: Date;
}

type ActivityType = 
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

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  status: 'going' | 'maybe' | 'invited';
  joinedAt: Date;
}
```

### 4.4 Nearby Travelers List

When user taps "100+ Travelers Here":

```typescript
interface NearbyTravelersResponse {
  totalCount: number;
  showingCount: number;          // Limited for performance
  travelers: NearbyTraveler[];
  filters: AppliedFilters;
}

interface NearbyTraveler {
  userId: string;
  avatar: string;
  name: string;
  nationality: string;
  nationalityFlag: string;       // 🇫🇷
  
  // Location
  distanceKm: number;
  distanceLabel: string;         // "4km away"
  
  // Common ground
  sharedInterests: string[];
  sharedLanguages: string[];
  matchScore: number;
  
  // Status
  isOnline: boolean;
  lastActive: Date;
  status?: string;               // "Open to meetup!"
}
```

### 4.5 Creating an Activity (Meetup Proposal)

```typescript
interface CreateActivityRequest {
  // What
  type: ActivityType;
  title: string;
  description?: string;
  
  // Where
  location: {
    latitude: number;
    longitude: number;
    name: string;
    address?: string;
    placeId?: string;            // Google Places ID
  };
  
  // When
  timing: 'now' | 'today' | 'tomorrow' | 'specific';
  scheduledFor?: Date;           // If timing === 'specific'
  duration?: number;             // Expected duration in minutes
  
  // Who
  maxParticipants?: number;      // null = unlimited
  visibility: 'everyone' | 'buddies_only' | 'selected';
  invitedUsers?: string[];       // If visibility === 'selected'
  
  // How long to show
  expiresIn: number;             // Hours until auto-expire (default: 6)
}
```

### 4.6 Joining an Activity

```
User sees Activity → Tap "Join Chat" → Enters Activity Chat →
                                              ↓
                                    Added as Participant
                                              ↓
                                    Creator Notified
                                              ↓
                                    Chat with all participants
                                              ↓
                                    Meet in person!
```

### 4.7 Location Sharing Settings

```typescript
interface LocationSharingSettings {
  // Master toggle
  shareLocation: boolean;
  
  // Precision
  locationPrecision: 'exact' | 'approximate' | 'city_only';
  // exact: Actual location (within 50m)
  // approximate: Randomized within 500m
  // city_only: Just shows city name, no pin
  
  // Visibility
  visibleTo: 'everyone' | 'buddies_only' | 'nobody';
  
  // Auto-disable
  autoDisableAfterHours?: number;  // Auto turn off after X hours
  
  // Status
  currentStatus: 'available' | 'busy' | 'invisible';
  statusMessage?: string;
  
  // Safety
  showOnlyWhenActive: boolean;   // Only show if app opened recently
  activeThresholdMinutes: number; // Default: 30
}
```

---

## Part 5: Events System

### 5.1 Event Types

| Type | Description | Example |
|------|-------------|---------|
| **Group Event** | Created within a group | "Tokyo Meetup - March 15" |
| **Local Event** | Public events in an area | "Free Walking Tour - Paris" |
| **Buddy Meetup** | Private meetup with buddy | Coffee with Sarah |
| **Activity** | Spontaneous (from Live Map) | "Coffee at Café de Flore now" |

### 5.2 Event Structure

```typescript
interface Event {
  id: string;
  
  // Context
  type: 'group' | 'local' | 'buddy' | 'activity';
  groupId?: string;              // If group event
  
  // Creator
  createdBy: string;
  organizerName: string;
  organizerAvatar: string;
  
  // Event info
  title: string;
  description: string;
  category: EventCategory;
  coverImage?: string;
  
  // Location
  location: {
    type: 'physical' | 'online' | 'tbd';
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    meetingLink?: string;        // For online events
  };
  
  // Timing
  startDate: Date;
  endDate?: Date;
  timezone: string;
  isAllDay: boolean;
  
  // Participants
  maxAttendees?: number;
  attendees: EventAttendee[];
  attendeeCount: number;
  
  // RSVP settings
  rsvpRequired: boolean;
  rsvpDeadline?: Date;
  waitlistEnabled: boolean;
  
  // Visibility
  visibility: 'public' | 'group_only' | 'invite_only';
  
  // Status
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  
  createdAt: Date;
  updatedAt: Date;
}

type EventCategory = 
  | 'meetup'
  | 'food_drink'
  | 'sightseeing'
  | 'outdoor'
  | 'cultural'
  | 'nightlife'
  | 'sports'
  | 'workshop'
  | 'coworking'
  | 'other';

interface EventAttendee {
  userId: string;
  name: string;
  avatar: string;
  rsvpStatus: 'going' | 'maybe' | 'not_going' | 'waitlist';
  rsvpAt: Date;
  isOrganizer: boolean;
  checkedIn: boolean;
  checkedInAt?: Date;
}
```

### 5.3 Event Discovery

```typescript
interface EventDiscoveryFilters {
  // Location
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  city?: string;
  
  // Time
  dateFrom?: Date;
  dateTo?: Date;
  
  // Type
  categories?: EventCategory[];
  eventTypes?: ('group' | 'local' | 'activity')[];
  
  // Groups
  myGroupsOnly?: boolean;
  
  // Sorting
  sortBy: 'date' | 'distance' | 'popularity';
}
```

### 5.4 Events Tab View

```
┌─────────────────────────────────────────────────────┐
│  Events                              📍 Paris       │
├─────────────────────────────────────────────────────┤
│  [Today] [This Week] [This Month] [All]            │
├─────────────────────────────────────────────────────┤
│  TODAY - March 15                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🌇 Sunset at Sacré-Cœur                     │   │
│  │    6:30 PM • 23 going • by Paris Explorers  │   │
│  │    [RSVP]                                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  TOMORROW - March 16                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🍷 Wine & Cheese Night                      │   │
│  │    7:00 PM • 15/20 spots • by Wine Lovers   │   │
│  │    [RSVP]                                    │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                 [+ Create Event]                    │
└─────────────────────────────────────────────────────┘
```

---

## Part 6: Matching Algorithm

### 6.1 Match Score Calculation

The matching algorithm calculates how compatible two travelers are based on multiple factors.

```typescript
interface MatchCalculation {
  userId: string;
  targetUserId: string;
  
  // Individual scores (0-1 each)
  factors: {
    destination: number;         // Same destination
    dates: number;               // Overlapping travel dates
    interests: number;           // Shared interests
    travelStyle: number;         // Similar travel style
    language: number;            // Common languages
    nationality: number;         // Same nationality bonus
    age: number;                 // Similar age range
    mutualBuddies: number;       // Friends in common
    groupMembership: number;     // Shared groups
    activityLevel: number;       // Similar engagement
  };
  
  // Weights for each factor
  weights: {
    destination: 0.25,
    dates: 0.20,
    interests: 0.15,
    travelStyle: 0.12,
    language: 0.08,
    nationality: 0.05,
    age: 0.05,
    mutualBuddies: 0.05,
    groupMembership: 0.03,
    activityLevel: 0.02
  };
  
  // Final score
  rawScore: number;              // Weighted sum
  finalScore: number;            // 0-100 percentage
  
  // Human-readable reasons
  matchReasons: MatchReason[];
}
```

### 6.2 Factor Calculations

#### Destination Match
```typescript
function calculateDestinationScore(user1: User, user2: User): number {
  const user1Destinations = getUpcomingDestinations(user1);
  const user2Destinations = getUpcomingDestinations(user2);
  
  // Check for exact matches
  const exactMatches = user1Destinations.filter(d1 => 
    user2Destinations.some(d2 => d1.code === d2.code)
  );
  
  if (exactMatches.length > 0) return 1.0;
  
  // Check for same country
  const countryMatches = user1Destinations.filter(d1 =>
    user2Destinations.some(d2 => d1.country === d2.country)
  );
  
  if (countryMatches.length > 0) return 0.6;
  
  // Check for same region
  const regionMatches = user1Destinations.filter(d1 =>
    user2Destinations.some(d2 => d1.region === d2.region)
  );
  
  if (regionMatches.length > 0) return 0.3;
  
  return 0;
}
```

#### Date Overlap
```typescript
function calculateDateScore(user1: User, user2: User): number {
  const user1Trips = getUpcomingTrips(user1);
  const user2Trips = getUpcomingTrips(user2);
  
  let maxOverlap = 0;
  
  for (const trip1 of user1Trips) {
    for (const trip2 of user2Trips) {
      // Same destination required
      if (trip1.destinationCode !== trip2.destinationCode) continue;
      
      const overlapDays = calculateOverlapDays(
        trip1.startDate, trip1.endDate,
        trip2.startDate, trip2.endDate
      );
      
      if (overlapDays > maxOverlap) {
        maxOverlap = overlapDays;
      }
    }
  }
  
  // Score based on overlap duration
  if (maxOverlap >= 7) return 1.0;
  if (maxOverlap >= 3) return 0.8;
  if (maxOverlap >= 1) return 0.5;
  return 0;
}
```

#### Interest Match
```typescript
function calculateInterestScore(user1: User, user2: User): number {
  const interests1 = new Set(user1.interests);
  const interests2 = new Set(user2.interests);
  
  const intersection = [...interests1].filter(i => interests2.has(i));
  const union = new Set([...interests1, ...interests2]);
  
  // Jaccard similarity
  return intersection.length / union.size;
}
```

### 6.3 Match Labels

Based on score, assign human-readable labels:

| Score Range | Label | Color |
|-------------|-------|-------|
| 90-100 | "Perfect match!" | Green |
| 80-89 | "Great match" | Green |
| 70-79 | "Good match" | Blue |
| 60-69 | "Decent match" | Blue |
| 50-59 | "Some things in common" | Gray |
| < 50 | No label shown | - |

---

## Part 7: Chat System

### 7.1 Chat Types

| Type | Description | Participants |
|------|-------------|--------------|
| **Group Chat** | Chat within a group | All group members |
| **Direct Message** | 1:1 chat between buddies | 2 users |
| **Activity Chat** | Chat for a meetup activity | Activity participants |
| **Event Chat** | Chat for event attendees | Event RSVPs |

### 7.2 Message Structure

```typescript
interface ChatMessage {
  id: string;
  chatId: string;
  chatType: 'group' | 'direct' | 'activity' | 'event';
  
  // Sender
  senderId: string;
  senderName: string;
  senderAvatar: string;
  
  // Content
  type: MessageType;
  content: string;
  
  // Media (if applicable)
  media?: {
    type: 'image' | 'video' | 'voice' | 'file' | 'location';
    url: string;
    thumbnail?: string;
    duration?: number;
    fileName?: string;
    fileSize?: number;
  }[];
  
  // Reply context
  replyTo?: {
    messageId: string;
    senderId: string;
    senderName: string;
    preview: string;
  };
  
  // Mentions
  mentions?: {
    userId: string;
    name: string;
    startIndex: number;
    endIndex: number;
  }[];
  
  // Reactions
  reactions: {
    emoji: string;
    count: number;
    users: string[];
    userReacted: boolean;
  }[];
  
  // Status
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy?: string[];
  
  // Metadata
  createdAt: Date;
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
}

type MessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'voice'
  | 'location'
  | 'event_share'
  | 'trip_share'
  | 'poll'
  | 'system';
```

### 7.3 Chat Features

| Feature | Group | DM | Activity | Event |
|---------|-------|-----|----------|-------|
| Text messages | ✅ | ✅ | ✅ | ✅ |
| Images/Videos | ✅ | ✅ | ✅ | ✅ |
| Voice notes | ✅ | ✅ | ✅ | ✅ |
| Location sharing | ✅ | ✅ | ✅ | ✅ |
| Reactions | ✅ | ✅ | ✅ | ✅ |
| Replies | ✅ | ✅ | ✅ | ✅ |
| Mentions | ✅ | ❌ | ✅ | ✅ |
| Polls | ✅ | ❌ | ✅ | ✅ |
| Pin messages | ✅ | ❌ | ✅ | ✅ |
| Read receipts | ❌ | ✅ | ❌ | ❌ |
| Typing indicator | ✅ | ✅ | ✅ | ✅ |

### 7.4 Real-time Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐
│   Client    │◄──────────────────►│  Chat Server    │
│   (App)     │                    │  (Socket.io)    │
└─────────────┘                    └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │   Redis Pub/Sub │
                                   │   (Real-time)   │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │   PostgreSQL    │
                                   │   (Persistence) │
                                   └─────────────────┘
```

### 7.5 WebSocket Events

```typescript
// Client → Server
interface ClientEvents {
  'join_chat': { chatId: string; chatType: string };
  'leave_chat': { chatId: string };
  'send_message': SendMessagePayload;
  'typing_start': { chatId: string };
  'typing_stop': { chatId: string };
  'read_messages': { chatId: string; messageIds: string[] };
  'react': { chatId: string; messageId: string; emoji: string };
}

// Server → Client
interface ServerEvents {
  'new_message': ChatMessage;
  'message_updated': { chatId: string; message: ChatMessage };
  'message_deleted': { chatId: string; messageId: string };
  'user_typing': { chatId: string; userId: string; name: string };
  'user_stopped_typing': { chatId: string; userId: string };
  'messages_read': { chatId: string; userId: string; messageIds: string[] };
  'reaction_added': { chatId: string; messageId: string; reaction: Reaction };
  'reaction_removed': { chatId: string; messageId: string; emoji: string; userId: string };
  'user_online': { userId: string };
  'user_offline': { userId: string };
}
```

---

## Part 8: User Profiles (Social)

### 8.1 Profile Structure

```typescript
interface TravelerProfile {
  // Basic info
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  coverPhoto?: string;
  
  // Verification
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
  
  // Location
  homeCity: string;
  homeCountry: string;
  currentLocation?: {
    city: string;
    country: string;
  };
  
  // Bio
  bio: string;                   // Max 300 chars
  
  // Stats
  stats: {
    trips: number;               // Total trips taken
    countries: number;           // Countries visited
    buddies: number;             // Buddy connections
    rating: number;              // 0-5 stars (from meetups)
  };
  
  // Languages
  languages: {
    code: string;
    name: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
  }[];
  
  // Travel style
  travelStyles: TravelStyle[];
  
  // Interests
  interests: Interest[];
  
  // Upcoming trips (if shared)
  upcomingTrips?: {
    destination: string;
    dateRange: string;
  }[];
  
  // Social
  memberSince: Date;
  lastActive: Date;
  
  // Privacy
  profileVisibility: 'public' | 'buddies_only' | 'private';
  showTrips: boolean;
  showLocation: boolean;
}

interface Interest {
  id: string;
  name: string;
  icon: string;                  // Emoji or icon name
  category: 'food' | 'activity' | 'culture' | 'nature' | 'lifestyle';
}

type VerificationBadge = 
  | 'email_verified'
  | 'phone_verified'
  | 'id_verified'
  | 'super_traveler'             // 10+ trips
  | 'world_explorer'             // 20+ countries
  | 'community_leader'           // Group admin with 100+ members
  | 'top_buddy'                  // High buddy ratings
  | 'early_adopter';             // Early Guidera user
```

### 8.2 Profile Display (from screenshot)

```
┌─────────────────────────────────────────────────────────────────┐
│  [←]                                                     [•••]  │
│                                                                 │
│  ┌─────────────────────── COVER PHOTO ─────────────────────┐   │
│  │                    [Mountain panorama]                   │   │
│  │                                                          │   │
│  │  [Avatar]                                                │   │
│  │    👑                                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Sarah Chen ✓                                                   │
│  📍 San Francisco, USA                                          │
│                                                                 │
│  Solo traveler & photographer. Love exploring hidden gems       │
│  and local food scenes. Always up for an adventure! 📸✈️        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   24      │    15       │    48       │   ⭐ 4.9        │  │
│  │  Trips    │  Countries  │  Buddies    │   Rating        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────────────┐  ┌─────┐                       │
│  │       🔗 Connect           │  │ 💬  │                       │
│  └────────────────────────────┘  └─────┘                       │
│                                                                 │
│  Languages                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │🌐 English│ │🌐Mandarin│ │🌐 Spanish │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
│  Travel Style                                                   │
│  Adventure   Photography   Foodie   Budget                      │
│                                                                 │
│  Interests                                                      │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐                      │
│  │❤️ Hiking │ │❤️Street Food│ │❤️ Temples │                      │
│  └──────────┘ └────────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Profile Completion Score

```typescript
interface ProfileCompleteness {
  score: number;                 // 0-100
  
  sections: {
    basicInfo: { complete: boolean; weight: 20 };      // Name, avatar
    bio: { complete: boolean; weight: 15 };
    languages: { complete: boolean; weight: 15 };
    travelStyle: { complete: boolean; weight: 15 };
    interests: { complete: boolean; weight: 15 };
    verification: { complete: boolean; weight: 10 };   // Email/phone
    coverPhoto: { complete: boolean; weight: 5 };
    homeLocation: { complete: boolean; weight: 5 };
  };
  
  suggestions: string[];         // "Add your travel interests to get better matches"
}
```

---

## Part 9: Discovery Engine

### 9.1 Discover Tab

The Discover tab helps users find groups, buddies, and events.

```
┌─────────────────────────────────────────────────────────────────┐
│  Discover                                     [🔍]              │
├─────────────────────────────────────────────────────────────────┤
│  [Groups] [Travelers] [Events] [Destinations]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔥 Trending Groups                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Cover] Japan 2025 Travelers                             │   │
│  │         12.4k members • Very active                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📍 Groups for Your Next Trip (Tokyo)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Cover] Tokyo Foodies                                    │   │
│  │         2.8k members • 87% match                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  👥 Travelers You Might Like                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Avatar] Priya S.  [87% match]  [Connect]               │   │
│  │          Tokyo • Mar 20-Apr 5                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🎉 Upcoming Events Near You                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Tokyo Street Food Tour • Tomorrow 6PM • 12 going        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Discovery Algorithms

#### Group Recommendations
```typescript
interface GroupRecommendation {
  group: GroupSummary;
  score: number;
  reasons: string[];
}

function recommendGroups(user: User): GroupRecommendation[] {
  const recommendations: GroupRecommendation[] = [];
  
  // 1. Groups for user's upcoming destinations
  const destinationGroups = findGroupsByDestinations(user.upcomingTrips);
  
  // 2. Groups matching user's interests
  const interestGroups = findGroupsByInterests(user.interests);
  
  // 3. Groups user's buddies are in
  const buddyGroups = findGroupsByBuddies(user.buddies);
  
  // 4. Trending groups in user's region
  const trendingGroups = findTrendingGroups(user.region);
  
  // 5. Groups for user's travel style
  const styleGroups = findGroupsByTravelStyle(user.travelStyles);
  
  // Combine, dedupe, and rank
  return rankAndDedupe([
    ...destinationGroups,
    ...interestGroups,
    ...buddyGroups,
    ...trendingGroups,
    ...styleGroups
  ]);
}
```

#### Traveler Recommendations
```typescript
function recommendTravelers(user: User): BuddySuggestion[] {
  // 1. Get users with destination overlap
  const destinationMatches = findByDestinationOverlap(user);
  
  // 2. Get users with interest overlap
  const interestMatches = findByInterestOverlap(user);
  
  // 3. Get friends of friends
  const fofMatches = findFriendsOfFriends(user);
  
  // 4. Calculate match scores for all
  const allMatches = [...new Set([
    ...destinationMatches,
    ...interestMatches,
    ...fofMatches
  ])];
  
  return allMatches
    .map(match => ({
      user: match,
      matchScore: calculateMatchScore(user, match),
      matchReasons: getMatchReasons(user, match)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 50);
}
```

### 9.3 Search Functionality

```typescript
interface SearchQuery {
  query: string;
  type: 'all' | 'groups' | 'travelers' | 'events';
  
  filters?: {
    // Location
    destination?: string;
    nearMe?: boolean;
    radiusKm?: number;
    
    // Time
    dateFrom?: Date;
    dateTo?: Date;
    
    // Groups
    groupCategory?: GroupCategory;
    minMembers?: number;
    maxMembers?: number;
    
    // Travelers
    interests?: string[];
    travelStyles?: TravelStyle[];
    languages?: string[];
    ageRange?: { min: number; max: number };
    
    // Events
    eventCategory?: EventCategory;
    freeOnly?: boolean;
  };
  
  sort?: 'relevance' | 'recent' | 'popular' | 'distance';
  page?: number;
  limit?: number;
}

interface SearchResults {
  query: string;
  totalResults: number;
  
  groups?: {
    count: number;
    items: GroupSummary[];
  };
  
  travelers?: {
    count: number;
    items: BuddySuggestion[];
  };
  
  events?: {
    count: number;
    items: Event[];
  };
}
```

---

## Part 10: Moderation & Safety

### 10.1 Content Moderation

```typescript
interface ModerationSystem {
  // Automated checks
  autoModeration: {
    profanityFilter: boolean;
    spamDetection: boolean;
    imageModeration: boolean;   // NSFW detection
    linkScanning: boolean;       // Malicious links
  };
  
  // User reporting
  reportTypes: ReportType[];
  
  // Admin review
  moderationQueue: ModeratedContent[];
  
  // Actions
  actions: ModerationAction[];
}

type ReportType = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'scam'
  | 'hate_speech'
  | 'violence'
  | 'impersonation'
  | 'other';

interface ContentReport {
  id: string;
  reporterId: string;
  
  // What's being reported
  contentType: 'user' | 'group' | 'message' | 'event' | 'activity';
  contentId: string;
  
  // Report details
  reportType: ReportType;
  description?: string;
  screenshots?: string[];
  
  // Status
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  
  // Resolution
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  actionTaken?: ModerationAction;
  
  createdAt: Date;
}

type ModerationAction = 
  | 'no_action'
  | 'warning_sent'
  | 'content_removed'
  | 'temporary_ban'
  | 'permanent_ban'
  | 'account_suspended';
```

### 10.2 User Safety Features

```typescript
interface SafetyFeatures {
  // Blocking
  blockedUsers: string[];
  
  // Visibility controls
  profileVisibility: 'public' | 'buddies_only' | 'private';
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showLocation: boolean;
  
  // Communication controls
  whoCanMessage: 'everyone' | 'buddies_only' | 'nobody';
  whoCanSendBuddyRequest: 'everyone' | 'friends_of_friends' | 'nobody';
  
  // Meeting safety
  meetupCheckIn: boolean;        // Prompt to check in after meetup
  shareItinerary: boolean;       // Share meetup details with emergency contact
  
  // Verification requirements
  requireVerifiedForDM: boolean;
}
```

### 10.3 Trust Score

```typescript
interface TrustScore {
  score: number;                 // 0-100
  level: 'new' | 'basic' | 'trusted' | 'verified' | 'super';
  
  factors: {
    accountAge: number;          // Months
    profileComplete: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    tripsCompleted: number;
    buddyRating: number;
    reportCount: number;
    warningCount: number;
  };
  
  badges: VerificationBadge[];
}

function calculateTrustScore(user: User): TrustScore {
  let score = 0;
  
  // Account age (max 15 points)
  score += Math.min(15, user.accountAgeMonths * 1.5);
  
  // Profile completeness (max 10 points)
  if (user.profileComplete) score += 10;
  
  // Verifications (max 30 points)
  if (user.emailVerified) score += 10;
  if (user.phoneVerified) score += 10;
  if (user.idVerified) score += 10;
  
  // Activity (max 25 points)
  score += Math.min(15, user.tripsCompleted * 3);
  score += Math.min(10, user.buddyConnections * 0.5);
  
  // Ratings (max 20 points)
  if (user.buddyRating >= 4.5) score += 20;
  else if (user.buddyRating >= 4.0) score += 15;
  else if (user.buddyRating >= 3.5) score += 10;
  
  // Penalties
  score -= user.reportCount * 5;
  score -= user.warningCount * 10;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    level: getLevel(score),
    factors: { ... },
    badges: getBadges(user)
  };
}
```

---

## Part 11: Database Schema

### 11.1 Groups Tables

```sql
-- ============================================
-- GROUPS
-- ============================================

-- Groups
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,
    description TEXT,
    
    -- Media
    cover_photo_url TEXT,
    group_photo_url TEXT,
    
    -- Destination (optional)
    destination_code VARCHAR(10),
    destination_name VARCHAR(255),
    destination_country VARCHAR(2),
    
    -- Settings
    privacy VARCHAR(20) DEFAULT 'public',              -- 'public', 'private'
    join_approval VARCHAR(20) DEFAULT 'automatic',    -- 'automatic', 'admin_approval'
    member_limit INTEGER,
    who_can_post VARCHAR(20) DEFAULT 'anyone',        -- 'anyone', 'admins_only'
    media_allowed BOOLEAN DEFAULT true,
    links_allowed BOOLEAN DEFAULT true,
    discoverable BOOLEAN DEFAULT true,
    invite_only BOOLEAN DEFAULT false,
    
    -- Categorization
    category VARCHAR(50),
    tags TEXT[],
    languages TEXT[],
    travel_styles TEXT[],
    
    -- Stats (denormalized for performance)
    member_count INTEGER DEFAULT 0,
    active_member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',              -- 'active', 'archived', 'suspended'
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role
    role VARCHAR(20) DEFAULT 'member',                -- 'owner', 'admin', 'moderator', 'member'
    
    -- Settings
    notifications_enabled BOOLEAN DEFAULT true,
    muted_until TIMESTAMPTZ,
    
    -- Activity
    last_visited_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',              -- 'active', 'banned', 'left'
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Group Join Requests
CREATE TABLE group_join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request
    message TEXT,                                     -- Optional message from requester
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',             -- 'pending', 'approved', 'rejected'
    
    -- Response
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Group Invites
CREATE TABLE group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    
    -- Invite details
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),
    
    -- Target
    invited_user_id UUID REFERENCES users(id),        -- Specific user invite
    -- OR
    max_uses INTEGER,                                 -- Link invite
    use_count INTEGER DEFAULT 0,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_groups_destination ON groups(destination_code);
CREATE INDEX idx_groups_discoverable ON groups(discoverable, status);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_join_requests_pending ON group_join_requests(group_id, status) 
    WHERE status = 'pending';
```

### 11.2 Buddies Tables

```sql
-- ============================================
-- BUDDIES
-- ============================================

-- Buddy Connections
CREATE TABLE buddy_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Users (always store lower ID first for consistency)
    user_id_1 UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request info
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',             -- 'pending', 'connected', 'blocked'
    
    -- Connection info
    connected_at TIMESTAMPTZ,
    
    -- Blocking
    blocked_by UUID REFERENCES users(id),
    blocked_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_user_order CHECK (user_id_1 < user_id_2),
    UNIQUE(user_id_1, user_id_2)
);

-- Buddy Settings (per-buddy settings for a user)
CREATE TABLE buddy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buddy_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notifications
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Visibility
    show_on_map BOOLEAN DEFAULT true,
    share_trips BOOLEAN DEFAULT true,
    
    -- Interaction stats
    last_interaction_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    meetup_count INTEGER DEFAULT 0,
    
    UNIQUE(user_id, buddy_id)
);

-- Buddy Ratings (after meetups)
CREATE TABLE buddy_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who rated whom
    rater_id UUID REFERENCES users(id),
    rated_id UUID REFERENCES users(id),
    
    -- Context
    meetup_id UUID,                                   -- Related activity/event
    
    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    
    -- Categories
    punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
    friendliness INTEGER CHECK (friendliness >= 1 AND friendliness <= 5),
    communication INTEGER CHECK (communication >= 1 AND communication <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rater_id, rated_id, meetup_id)
);

-- Indexes
CREATE INDEX idx_buddy_connections_user1 ON buddy_connections(user_id_1);
CREATE INDEX idx_buddy_connections_user2 ON buddy_connections(user_id_2);
CREATE INDEX idx_buddy_connections_status ON buddy_connections(status);
CREATE INDEX idx_buddy_ratings_rated ON buddy_ratings(rated_id);
```

### 11.3 Live Map Tables

```sql
-- ============================================
-- LIVE MAP & ACTIVITIES
-- ============================================

-- User Live Locations
CREATE TABLE user_live_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    
    -- Location
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(10,2),
    
    -- Settings
    precision VARCHAR(20) DEFAULT 'approximate',      -- 'exact', 'approximate', 'city_only'
    visible_to VARCHAR(20) DEFAULT 'everyone',        -- 'everyone', 'buddies_only', 'nobody'
    
    -- Status
    status VARCHAR(20) DEFAULT 'available',           -- 'available', 'busy', 'invisible'
    status_message VARCHAR(100),
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ                            -- Auto-expire location sharing
);

-- Activities (Meetup Proposals)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Creator
    created_by UUID REFERENCES users(id),
    
    -- Activity info
    type VARCHAR(30) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Location
    location_name VARCHAR(200),
    location_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    place_id VARCHAR(100),                            -- Google Places ID
    
    -- Timing
    timing VARCHAR(20) DEFAULT 'now',                 -- 'now', 'today', 'tomorrow', 'specific'
    scheduled_for TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Participants
    max_participants INTEGER,
    participant_count INTEGER DEFAULT 1,
    
    -- Visibility
    visibility VARCHAR(20) DEFAULT 'everyone',        -- 'everyone', 'buddies_only', 'selected'
    
    -- Status
    status VARCHAR(20) DEFAULT 'open',                -- 'open', 'full', 'cancelled', 'completed'
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Activity Participants
CREATE TABLE activity_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'going',               -- 'going', 'maybe', 'invited'
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(activity_id, user_id)
);

-- Activity Invites
CREATE TABLE activity_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id),
    
    status VARCHAR(20) DEFAULT 'pending',             -- 'pending', 'accepted', 'declined'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(activity_id, invited_user_id)
);

-- Spatial index for location queries
CREATE INDEX idx_user_live_locations_geo ON user_live_locations 
    USING gist (ST_MakePoint(longitude, latitude)::geography);
CREATE INDEX idx_activities_geo ON activities 
    USING gist (ST_MakePoint(longitude, latitude)::geography);
CREATE INDEX idx_activities_status ON activities(status, expires_at);
```

### 11.4 Events Tables

```sql
-- ============================================
-- EVENTS
-- ============================================

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    type VARCHAR(20) NOT NULL,                        -- 'group', 'local', 'buddy', 'activity'
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    
    -- Organizer
    created_by UUID REFERENCES users(id),
    
    -- Event info
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    cover_image_url TEXT,
    
    -- Location
    location_type VARCHAR(20) DEFAULT 'physical',     -- 'physical', 'online', 'tbd'
    location_name VARCHAR(200),
    location_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    meeting_link TEXT,
    
    -- Timing
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    timezone VARCHAR(50),
    is_all_day BOOLEAN DEFAULT false,
    
    -- Attendance
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    rsvp_required BOOLEAN DEFAULT true,
    rsvp_deadline TIMESTAMPTZ,
    waitlist_enabled BOOLEAN DEFAULT false,
    
    -- Visibility
    visibility VARCHAR(20) DEFAULT 'public',          -- 'public', 'group_only', 'invite_only'
    
    -- Status
    status VARCHAR(20) DEFAULT 'upcoming',            -- 'upcoming', 'ongoing', 'completed', 'cancelled'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Attendees
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- RSVP
    rsvp_status VARCHAR(20) DEFAULT 'going',          -- 'going', 'maybe', 'not_going', 'waitlist'
    rsvp_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Role
    is_organizer BOOLEAN DEFAULT false,
    
    -- Check-in
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    
    UNIQUE(event_id, user_id)
);

-- Event Invites
CREATE TABLE event_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES users(id),
    invited_by UUID REFERENCES users(id),
    
    status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, invited_user_id)
);

-- Indexes
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_geo ON events 
    USING gist (ST_MakePoint(longitude, latitude)::geography)
    WHERE latitude IS NOT NULL;
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
```

### 11.5 Chat Tables

```sql
-- ============================================
-- CHAT
-- ============================================

-- Chat Rooms (for group chats, activity chats, event chats)
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Type and reference
    type VARCHAR(20) NOT NULL,                        -- 'group', 'activity', 'event'
    reference_id UUID NOT NULL,                       -- group_id, activity_id, or event_id
    
    -- Metadata
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct Messages (1:1 conversations)
CREATE TABLE direct_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants (always store lower ID first)
    user_id_1 UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metadata
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_user_order CHECK (user_id_1 < user_id_2),
    UNIQUE(user_id_1, user_id_2)
);

-- Messages (for both group and direct)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Context
    chat_type VARCHAR(20) NOT NULL,                   -- 'group', 'direct', 'activity', 'event'
    chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
    
    -- Sender
    sender_id UUID REFERENCES users(id),
    
    -- Content
    type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    
    -- Media
    media JSONB,                                      -- Array of media objects
    
    -- Reply
    reply_to_id UUID REFERENCES messages(id),
    
    -- Mentions
    mentions JSONB,                                   -- Array of {userId, startIndex, endIndex}
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    
    CONSTRAINT check_chat_context CHECK (
        (chat_room_id IS NOT NULL AND conversation_id IS NULL) OR
        (chat_room_id IS NULL AND conversation_id IS NOT NULL)
    )
);

-- Message Reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, emoji)
);

-- Message Read Status
CREATE TABLE message_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- For direct messages
    conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_messages_chat_room ON messages(chat_room_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_direct_conversations_user1 ON direct_conversations(user_id_1);
CREATE INDEX idx_direct_conversations_user2 ON direct_conversations(user_id_2);
```

### 11.6 User Social Profile Tables

```sql
-- ============================================
-- USER SOCIAL PROFILES
-- ============================================

-- User Social Profiles (extends main users table)
CREATE TABLE user_social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    
    -- Profile
    bio VARCHAR(300),
    cover_photo_url TEXT,
    
    -- Home location
    home_city VARCHAR(100),
    home_country VARCHAR(2),
    
    -- Languages
    languages JSONB DEFAULT '[]',                     -- [{code, name, proficiency}]
    
    -- Travel style
    travel_styles TEXT[],
    
    -- Interests
    interests JSONB DEFAULT '[]',                     -- [{id, name, icon, category}]
    
    -- Stats (denormalized)
    trip_count INTEGER DEFAULT 0,
    country_count INTEGER DEFAULT 0,
    buddy_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    rating_count INTEGER DEFAULT 0,
    
    -- Trust
    trust_score INTEGER DEFAULT 0,
    
    -- Visibility settings
    profile_visibility VARCHAR(20) DEFAULT 'public',  -- 'public', 'buddies_only', 'private'
    show_trips BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    
    -- Communication settings
    who_can_message VARCHAR(20) DEFAULT 'everyone',
    who_can_buddy_request VARCHAR(20) DEFAULT 'everyone',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Interests (predefined list)
CREATE TABLE interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10),                                 -- Emoji
    category VARCHAR(30),                             -- 'food', 'activity', 'culture', 'nature', 'lifestyle'
    sort_order INTEGER DEFAULT 0
);

-- User Countries Visited
CREATE TABLE user_countries_visited (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    first_visited_at DATE,
    visit_count INTEGER DEFAULT 1,
    
    UNIQUE(user_id, country_code)
);

-- Indexes
CREATE INDEX idx_user_social_profiles_visibility ON user_social_profiles(profile_visibility);
```

### 11.7 Moderation Tables

```sql
-- ============================================
-- MODERATION
-- ============================================

-- Content Reports
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reporter
    reporter_id UUID REFERENCES users(id),
    
    -- Content being reported
    content_type VARCHAR(30) NOT NULL,                -- 'user', 'group', 'message', 'event', 'activity'
    content_id UUID NOT NULL,
    
    -- Report details
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    screenshots TEXT[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',             -- 'pending', 'reviewing', 'resolved', 'dismissed'
    
    -- Resolution
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    action_taken VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Blocks
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(blocker_id, blocked_id)
);

-- Moderation Actions Log
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Target
    target_type VARCHAR(20) NOT NULL,                 -- 'user', 'group', 'content'
    target_id UUID NOT NULL,
    
    -- Action
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    
    -- Duration (for temporary actions)
    expires_at TIMESTAMPTZ,
    
    -- Actor
    performed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
```

---

## Part 12: API Endpoints

### 12.1 Groups API

```typescript
// Groups
POST   /api/community/groups                    // Create group
GET    /api/community/groups                    // List/search groups
GET    /api/community/groups/:id                // Get group details
PUT    /api/community/groups/:id                // Update group
DELETE /api/community/groups/:id                // Delete group

// Group membership
POST   /api/community/groups/:id/join           // Request to join
POST   /api/community/groups/:id/leave          // Leave group
GET    /api/community/groups/:id/members        // List members
PUT    /api/community/groups/:id/members/:userId // Update member role
DELETE /api/community/groups/:id/members/:userId // Remove member

// Join requests (admin)
GET    /api/community/groups/:id/requests       // List pending requests
POST   /api/community/groups/:id/requests/:requestId/approve
POST   /api/community/groups/:id/requests/:requestId/reject

// Invites
POST   /api/community/groups/:id/invites        // Create invite
GET    /api/community/groups/:id/invites        // List invites
DELETE /api/community/groups/:id/invites/:inviteId
POST   /api/community/invites/:code/accept      // Accept invite

// User's groups
GET    /api/community/my-groups                 // User's groups
GET    /api/community/my-groups/pending         // Pending join requests
```

### 12.2 Buddies API

```typescript
// Buddy connections
GET    /api/community/buddies                   // List buddies
POST   /api/community/buddies/request           // Send buddy request
POST   /api/community/buddies/accept/:requestId // Accept request
POST   /api/community/buddies/reject/:requestId // Reject request
DELETE /api/community/buddies/:buddyId          // Remove buddy

// Buddy suggestions
GET    /api/community/buddies/suggestions       // Get suggested buddies
GET    /api/community/buddies/mutual/:userId    // Mutual buddies with user

// Buddy settings
GET    /api/community/buddies/:buddyId/settings
PUT    /api/community/buddies/:buddyId/settings
```

### 12.3 Live Map API

```typescript
// Location
PUT    /api/community/location                  // Update my location
DELETE /api/community/location                  // Stop sharing location
GET    /api/community/location/settings         // Get location settings
PUT    /api/community/location/settings         // Update settings

// Nearby
GET    /api/community/nearby/travelers          // Get nearby travelers
GET    /api/community/nearby/activities         // Get nearby activities
GET    /api/community/nearby/buddies            // Get nearby buddies

// Activities
POST   /api/community/activities                // Create activity
GET    /api/community/activities/:id            // Get activity
PUT    /api/community/activities/:id            // Update activity
DELETE /api/community/activities/:id            // Cancel activity
POST   /api/community/activities/:id/join       // Join activity
POST   /api/community/activities/:id/leave      // Leave activity
POST   /api/community/activities/:id/invite     // Invite to activity
```

### 12.4 Events API

```typescript
// Events
POST   /api/community/events                    // Create event
GET    /api/community/events                    // List/search events
GET    /api/community/events/:id                // Get event details
PUT    /api/community/events/:id                // Update event
DELETE /api/community/events/:id                // Cancel event

// RSVP
POST   /api/community/events/:id/rsvp           // RSVP to event
DELETE /api/community/events/:id/rsvp           // Cancel RSVP
GET    /api/community/events/:id/attendees      // List attendees

// Check-in
POST   /api/community/events/:id/checkin        // Check in to event

// User's events
GET    /api/community/my-events                 // Events user is attending
GET    /api/community/my-events/organizing      // Events user is organizing
```

### 12.5 Chat API

```typescript
// Group chat
GET    /api/community/groups/:groupId/messages  // Get messages
POST   /api/community/groups/:groupId/messages  // Send message
PUT    /api/community/messages/:messageId       // Edit message
DELETE /api/community/messages/:messageId       // Delete message
POST   /api/community/messages/:messageId/react // React to message
POST   /api/community/messages/:messageId/pin   // Pin message

// Direct messages
GET    /api/community/conversations             // List conversations
GET    /api/community/conversations/:userId     // Get/create conversation
GET    /api/community/conversations/:id/messages
POST   /api/community/conversations/:id/messages
POST   /api/community/conversations/:id/read    // Mark as read
```

### 12.6 Discovery API

```typescript
// Discovery
GET    /api/community/discover/groups           // Recommended groups
GET    /api/community/discover/travelers        // Recommended travelers
GET    /api/community/discover/events           // Recommended events

// Search
GET    /api/community/search                    // Search all
GET    /api/community/search/groups
GET    /api/community/search/travelers
GET    /api/community/search/events
```

### 12.7 Profile API

```typescript
// Social profile
GET    /api/community/profile                   // My social profile
PUT    /api/community/profile                   // Update social profile
GET    /api/community/profile/:userId           // View user's profile

// Privacy & safety
PUT    /api/community/profile/privacy           // Update privacy settings
POST   /api/community/users/:userId/block       // Block user
DELETE /api/community/users/:userId/block       // Unblock user
POST   /api/community/report                    // Report content
```

---

## Part 13: Implementation Guide

### 13.1 Implementation Phases

#### Phase 1: Foundation (Week 1-2)
```
Day 1-3: Database Setup
├── Create all tables
├── Add indexes
├── Set up PostGIS for geospatial
└── Seed interests & categories

Day 4-5: Core Models & Services
├── Group model & GroupService
├── Buddy model & BuddyService
└── Profile model & ProfileService

Day 6-7: Basic APIs
├── Groups CRUD
├── Buddy connections
└── Profile endpoints

Day 8-10: Group Features
├── Join/leave flow
├── Member management
├── Join requests
└── Invites
```

#### Phase 2: Chat System (Week 3)
```
Day 1-2: Chat Infrastructure
├── WebSocket server (Socket.io)
├── Redis pub/sub setup
├── Message storage
└── Chat room management

Day 3-4: Group Chat
├── Send/receive messages
├── Media uploads
├── Reactions
└── Message history

Day 5-7: Direct Messages
├── Conversation management
├── 1:1 messaging
├── Read receipts
└── Typing indicators
```

#### Phase 3: Live Map (Week 4)
```
Day 1-2: Location Services
├── Location update API
├── Geospatial queries
├── Privacy controls
└── Location expiry

Day 3-4: Nearby Features
├── Find nearby travelers
├── Distance calculation
├── Filter & sort
└── Map pins

Day 5-7: Activities
├── Create activity
├── Join activity
├── Activity chat
└── Activity lifecycle
```

#### Phase 4: Discovery & Events (Week 5)
```
Day 1-3: Discovery Engine
├── Group recommendations
├── Buddy suggestions
├── Matching algorithm
└── Search functionality

Day 4-7: Events
├── Event CRUD
├── RSVP system
├── Event discovery
├── Event chat
└── Check-in
```

#### Phase 5: Polish & Safety (Week 6)
```
Day 1-3: Moderation
├── Reporting system
├── Block functionality
├── Auto-moderation
└── Admin tools

Day 4-5: Notifications
├── Alert integration
├── Push notifications
└── Email digests

Day 6-7: Testing & Optimization
├── Performance testing
├── Load testing
├── Bug fixes
└── UI polish
```

### 13.2 Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| **Real-time** | Socket.io | Mature, good mobile support |
| **Geospatial** | PostGIS | Industry standard, powerful queries |
| **Chat storage** | PostgreSQL + Redis | Durability + speed |
| **Media storage** | Cloudinary/S3 | Scalable, CDN |
| **Search** | PostgreSQL FTS + Elasticsearch (future) | Start simple, scale later |

### 13.3 Performance Considerations

```typescript
// Pagination for large lists
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Cursor-based for infinite scroll
interface CursorResponse<T> {
  items: T[];
  cursor: string | null;        // null = no more items
}

// Caching strategy
const CACHE_DURATIONS = {
  groupDetails: 5 * 60,         // 5 minutes
  groupMembers: 2 * 60,         // 2 minutes
  nearbyTravelers: 30,          // 30 seconds
  userProfile: 10 * 60,         // 10 minutes
  buddySuggestions: 30 * 60,    // 30 minutes
};
```

### 13.4 Security Checklist

- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] Permission checks on all actions
- [ ] Block list enforcement
- [ ] Location data encryption
- [ ] Media content scanning
- [ ] SQL injection prevention
- [ ] XSS prevention in messages
- [ ] Audit logging for sensitive actions

---

## Summary

The Community & Social System transforms Guidera into a **travel community platform** with:

### Core Features
| Feature | Purpose |
|---------|---------|
| **Groups** | Topic/destination-based communities |
| **Buddies** | 1:1 travel connections |
| **Live Map** | Real-time nearby traveler discovery |
| **Activities** | Spontaneous meetup proposals |
| **Events** | Planned gatherings |
| **Chat** | Group & direct messaging |
| **Discovery** | Smart recommendations |

### Key Differentiators
1. **Matching Algorithm** — Smart buddy suggestions based on interests, destinations, dates
2. **Live Map** — Real-time "who's nearby" for spontaneous meetups
3. **Trip Overlap Detection** — Know when buddies are in the same city
4. **Activities** — NomadTable-style "coffee by Eiffel Tower today"
5. **Trust Scores** — Safety through reputation

### Database Summary
- 20+ new tables
- PostGIS for geospatial
- Real-time via WebSockets
- Redis for caching & pub/sub

This system makes Guidera the **only app travelers need** for both planning trips AND connecting with fellow travelers worldwide.
