# Community Tab — Complete Wiring Plan

## Current State Summary

### Architecture Overview
- **4 Tabs**: Discover, Guides, Groups, Events
- **Header Icons**: Search, Live Map, Messages, Notifications
- **26 Route Files** in `src/app/community/`
- **29 Screen Files** in `src/features/community/screens/`
- **26+ Component Files** (cards, feed, discover sections)
- **7 Service Files** (group, buddy, event, activity, chat, post, partner)
- **1 Hook File** (`useCommunity.ts`) with 18 hooks
- **7 Type Files** (community, buddy, event, feed, guide, partner, chat)

### What's Already Wired to Real Supabase Data
| Area | Status | Notes |
|------|--------|-------|
| Hub Screen | ✅ Wired | Uses `useGroups`, `useUpcomingEvents`, `usePendingBuddyRequests`, `useNotifications`, `chatService` |
| Group Service | ✅ Wired | Full CRUD: create, join, leave, members, discover, join requests |
| Event Service | ✅ Wired | Full CRUD: create, RSVP, cancel, attendees, upcoming |
| Buddy Service | ✅ Wired | Send/accept/reject requests, suggestions, blocking |
| Activity Service | ✅ Wired | Create, join, leave, cancel, nearby search |
| Chat Service | ✅ Wired | Conversations, group chats, messages, send |
| Post Service | ✅ Wired | CRUD posts, comments, reactions, saved posts, feed |
| Partner Service | ✅ Wired | Didit verification, application flow |

### What Still Uses Mock Data (Needs Wiring)
| Component | Mock Data Location | What It Needs |
|-----------|-------------------|---------------|
| `TrendingGroupsSection` | `MOCK_TRENDING_GROUPS` inline | → `groupService.discoverGroups()` |
| `TripGroupsSection` | Likely mock inline | → `groupService.discoverGroups({ category: 'trip' })` |
| `TravelersSection` | `MOCK_TRAVELERS` inline | → `buddyService.getSuggestions()` |
| `EventsPreviewSection` | `MOCK_EVENTS` inline | → `eventService.getUpcomingEvents({ limit: 3 })` |
| `DestinationsSection` | Likely mock inline | → curated_destinations or user trip destinations |
| `GroupsTabContent` | `MOCK_MY_GROUPS` + `MOCK_SUGGESTED_GROUPS` | → `useGroups()` already passed but falls back to mock |
| `EventsTabContent` | `MOCK_EVENTS` fallback | → Real events passed but defaults to mock when empty |
| `AllGroupsScreen` | Mock data inline | → `groupService.discoverGroups()` |
| `AllTravelersScreen` | Mock data inline | → `buddyService.getSuggestions()` |
| `BuddyProfileScreen` | Mock profile data | → `supabase.from('profiles')` + `buddyService` |
| `SearchScreen` | Mock search results | → `groupService.discoverGroups()` + `eventService` + profiles search |
| `GuidesTabContent` | Mock guide data | → `guide_profiles` table |

---

## Wiring Plan — Phased Approach

### Phase 1: Discover Tab — Replace All Mock Data (5 files)
**Goal**: Every section in the Discover feed shows real Supabase data.

#### 1.1 — TrendingGroupsSection
- **File**: `src/features/community/components/discover/TrendingGroupsSection.tsx`
- **Current**: Renders `MOCK_TRENDING_GROUPS` (3 hardcoded groups)
- **Wire to**: Accept `groups` prop from parent OR call `useDiscoverGroups({ limit: 5 })` internally
- **Service**: `groupService.discoverGroups({})` — already works, sorts by `member_count DESC`
- **Fallback**: Show skeleton loader while loading, empty state if no groups

#### 1.2 — TripGroupsSection
- **File**: `src/features/community/components/discover/TripGroupsSection.tsx`
- **Current**: Likely mock data
- **Wire to**: `groupService.discoverGroups({ category: 'trip' })` or groups related to user's upcoming trips
- **Service**: Already exists
- **Fallback**: Hide section if no trip groups

#### 1.3 — TravelersSection
- **File**: `src/features/community/components/discover/TravelersSection.tsx`
- **Current**: `MOCK_TRAVELERS` (3 hardcoded travelers with pravatar URLs)
- **Wire to**: `buddyService.getSuggestions(userId)` — already works
- **Service**: Already exists, returns `BuddySuggestion[]` with matchScore + matchReasons
- **Map**: `BuddySuggestion` → `BuddyMatch` (type used by `BuddyMatchCard`)
- **Fallback**: Empty state "No travelers nearby"

#### 1.4 — EventsPreviewSection
- **File**: `src/features/community/components/discover/EventsPreviewSection.tsx`
- **Current**: `MOCK_EVENTS` (2 hardcoded events)
- **Wire to**: `eventService.getUpcomingEvents({ limit: 3 })` — already works
- **Service**: Already exists
- **Map**: `CommunityEvent` → `EventPreview` (type used by `EventCard`)
- **Fallback**: "No upcoming events"

#### 1.5 — DestinationsSection
- **File**: `src/features/community/components/discover/DestinationsSection.tsx`
- **Current**: Likely mock destination data
- **Wire to**: User's upcoming trip destinations from `trips` table, or popular destinations from `curated_destinations`
- **Fallback**: Show popular destinations

#### 1.6 — DiscoverFeed Pull-to-Refresh
- **File**: `src/features/community/components/DiscoverFeed.tsx`
- **Current**: `handleRefresh` does `setTimeout(1000)` (fake)
- **Wire to**: Re-fetch all section data

---

### Phase 2: Groups Tab — Remove Mock Fallbacks (3 files)

#### 2.1 — GroupsTabContent — Remove Mock Fallback
- **File**: `src/features/community/components/GroupsTabContent.tsx`
- **Current**: `displayGroups = myGroups.length > 0 ? myGroups : MOCK_MY_GROUPS`
- **Wire to**: Remove `MOCK_MY_GROUPS`, show real empty state when no groups
- **Also**: Replace `MOCK_SUGGESTED_GROUPS` with `useDiscoverGroups({})`
- **Add**: `JoinButton` that calls `groupService.joinGroup()`

#### 2.2 — AllGroupsScreen (Trending "See All")
- **File**: `src/features/community/screens/AllGroupsScreen.tsx`
- **Current**: Mock data inline
- **Wire to**: `useDiscoverGroups()` with filter chips (destination, interest, trip, local)
- **Service**: `groupService.discoverGroups(filters)`
- **Add**: Search input → `groupService.discoverGroups({ search: query })`

#### 2.3 — MyGroupsScreen
- **File**: `src/features/community/screens/MyGroupsScreen.tsx`
- **Wire to**: `useGroups(userId)` — already have the hook
- **Add**: Leave group action via `groupService.leaveGroup()`

---

### Phase 3: Group Detail & Feed System (5 files)

#### 3.1 — CommunityDetailScreen (Group Detail Page)
- **File**: `src/features/community/screens/CommunityDetailScreen.tsx`
- **Current**: Already imports `groupService`, `eventService`, `postService` and uses `GroupHeader`, `FeedTab`, `MembersTab`, `AboutTab`
- **Audit**: Verify all 4 tabs pull real data:
  - **Feed tab**: `postService.getPosts({ communityId })` ✅
  - **Members tab**: `groupService.getMembers()` ✅
  - **Events tab**: `eventService.getUpcomingEvents({ groupId })` ✅
  - **About tab**: `groupService.getGroup()` ✅
- **Fix**: Any remaining mock data in feed components

#### 3.2 — FeedTab & FeedPostCard
- **File**: `src/features/community/components/feed/FeedTab.tsx`
- **Wire**: Reactions → `postService.toggleReaction()`, Comments → navigate to PostDetailScreen
- **File**: `src/features/community/components/feed/FeedPostCard.tsx`
- **Wire**: Reaction buttons, comment count tap, save post, share post

#### 3.3 — PostReactions
- **File**: `src/features/community/components/feed/PostReactions.tsx`
- **Wire**: 5 reaction types (love, been_there, helpful, want_to_go, fire)
- **Service**: `postService.toggleReaction(postId, userId, reactionType)`

#### 3.4 — FeedComposer
- **File**: `src/features/community/components/feed/FeedComposer.tsx`
- **Wire**: Tap → navigate to CreatePostScreen with `groupId`

#### 3.5 — MembersTab
- **File**: `src/features/community/components/feed/MembersTab.tsx`
- **Wire**: Member list from `groupService.getMembers()`, role badges, tap → buddy profile

---

### Phase 4: Post Creation & Detail Flow (3 files)

#### 4.1 — CreatePostScreen
- **File**: `src/features/community/screens/CreatePostScreen.tsx`
- **Current**: Already imports `postService` and `ImagePicker`
- **Audit**: Verify it calls `postService.createPost()` on submit
- **Wire**: Photo upload to Supabase Storage → get public URL → attach to post
- **Wire**: Location tag (optional), post type selector, tags

#### 4.2 — PostDetailScreen
- **File**: `src/features/community/screens/PostDetailScreen.tsx`
- **Current**: Already imports `postService` and maps to `FeedPost`
- **Audit**: Verify comments load via `postService.getComments(postId)`
- **Wire**: Comment input → `postService.addComment()`
- **Wire**: Comment likes → `postService.toggleCommentLike()`
- **Wire**: Threaded replies (parent_comment_id)

#### 4.3 — CommentItem
- **File**: `src/features/community/components/feed/CommentItem.tsx`
- **Wire**: Like button → `postService.toggleCommentLike()`
- **Wire**: Reply button → set parent comment ID in input

---

### Phase 5: Events System (4 files)

#### 5.1 — EventsTabContent — Remove Mock Fallback
- **File**: `src/features/community/components/EventsTabContent.tsx`
- **Current**: `events = MOCK_EVENTS` as default parameter
- **Wire to**: Remove default, show empty state when `events.length === 0`
- **Already**: Hub passes real events from `useUpcomingEvents()`

#### 5.2 — EventDetailScreen
- **File**: `src/features/community/screens/EventDetailScreen.tsx`
- **Current**: Imports `eventService`
- **Audit**: Verify it loads event via `eventService.getEvent(eventId)`
- **Wire**: RSVP buttons → `eventService.rsvp()`, cancel → `eventService.cancelRsvp()`
- **Wire**: Attendee list → `eventService.getAttendees()`
- **Wire**: Share, chat room link

#### 5.3 — CreateEventScreen
- **File**: `src/features/community/screens/CreateEventScreen.tsx`
- **Wire to**: `eventService.createEvent(userId, data)`
- **Wire**: Date/time picker, location picker, cover image upload
- **Navigate**: Back to events tab on success

#### 5.4 — All Events Screen
- **File**: Route: `/community/all-events`
- **Wire**: `eventService.getUpcomingEvents()` with pagination + date filters

---

### Phase 6: Travelers / Buddies System (4 files)

#### 6.1 — AllTravelersScreen
- **File**: `src/features/community/screens/AllTravelersScreen.tsx`
- **Current**: Mock traveler data inline
- **Wire to**: `buddyService.getSuggestions(userId)` with filters (high_match, nearby, verified)
- **Map**: `BuddySuggestion` → display format

#### 6.2 — BuddyProfileScreen
- **File**: `src/features/community/screens/BuddyProfileScreen.tsx`
- **Current**: Imports `buddyService`, `supabase`
- **Audit**: Verify profile loads from `profiles` table
- **Wire**: "Connect" button → `buddyService.sendRequest()`
- **Wire**: "Message" button → `chatService.getOrCreateConversation()` → navigate to chat
- **Wire**: "Block" → `buddyService.blockUser()`
- **Wire**: Mutual groups, shared trips, countries visited

#### 6.3 — TravelerProfileScreen
- **File**: `src/features/community/screens/TravelerProfileScreen.tsx`
- **Wire**: Similar to BuddyProfileScreen but may be a public-facing view
- **Wire**: Follow/unfollow → `user_follows` table

#### 6.4 — Buddy Request Cards (in feed)
- **File**: `src/features/community/components/feed/BuddyRequestCard.tsx`
- **Wire**: Accept/Decline → `buddyService.acceptRequest()` / `rejectRequest()`

---

### Phase 7: Messaging System (3 files)

#### 7.1 — MessagesListScreen
- **File**: `src/features/community/screens/MessagesListScreen.tsx`
- **Current**: Imports `chatService`
- **Wire**: DM list → `chatService.getConversations(userId)`
- **Wire**: Group chats → `chatService.getGroupChats(userId)`
- **Wire**: Merge & sort by `lastMessageAt`
- **Wire**: Search/filter conversations

#### 7.2 — ChatScreen (1:1 DM)
- **File**: `src/features/community/screens/ChatScreen.tsx`
- **Current**: Imports `chatService`
- **Wire**: Load messages → `chatService.getMessages(conversationId)`
- **Wire**: Send message → `chatService.sendMessage()`
- **Wire**: Real-time via Supabase Realtime subscription (channel exists: `chat.channel.ts`)
- **Wire**: Image/location attachments

#### 7.3 — Group Chat (from CommunityDetailScreen)
- **Wire**: Same ChatScreen but with group chat room ID
- **Service**: `chatService.getMessages()` supports both DM and group

---

### Phase 8: Search & Discovery (2 files)

#### 8.1 — SearchScreen
- **File**: `src/features/community/screens/SearchScreen.tsx`
- **Current**: Imports `groupService`, `eventService`, `supabase`
- **Wire**: Tab "groups" → `groupService.discoverGroups({ search: query })`
- **Wire**: Tab "buddies" → search `profiles` table by name/nationality
- **Wire**: Tab "events" → `eventService.getUpcomingEvents()` filtered
- **Wire**: Filter chips (privacy, size, destination, tags)
- **Wire**: Recent searches / popular tags

#### 8.2 — Community Notifications Screen
- **File**: `src/features/community/screens/NotificationsScreen.tsx`
- **Wire**: Social notifications from `alerts` table (category='social')
- **Wire**: Buddy requests, group invites, event reminders, post mentions

---

### Phase 9: Create Group Flow (2 files)

#### 9.1 — CreateGroupScreen
- **File**: `src/features/community/screens/CreateGroupScreen.tsx`
- **Current**: 3-step form (images/inputs, type/privacy, tags/preview)
- **Wire**: Image upload → Supabase Storage
- **Wire**: Submit → `groupService.createGroup(userId, data)`
- **Navigate**: To new group detail on success

#### 9.2 — GroupAdminScreen
- **File**: `src/features/community/screens/GroupAdminScreen.tsx`
- **Wire**: Edit group settings, manage members, approve join requests
- **Service**: `groupService.updateMemberRole()`, `groupService.removeMember()`, `groupService.getJoinRequests()`

---

### Phase 10: Activities & Live Map (3 files)

#### 10.1 — LiveMapScreen
- **File**: `src/features/community/screens/LiveMapScreen.tsx`
- **Wire**: Nearby activities from `activityService.getNearbyActivities()`
- **Wire**: User locations from `user_live_locations` table
- **Wire**: Map markers (react-native-maps or mapbox)

#### 10.2 — CreateActivityScreen
- **File**: `src/features/community/screens/CreateActivityScreen.tsx`
- **Wire**: `activityService.createActivity(userId, data)`
- **Wire**: Location picker, timing selector, participant limit

#### 10.3 — LocationSharingSettings
- **File**: `src/features/community/components/LocationSharingSettings.tsx`
- **Wire**: Update `user_live_locations` visibility preferences

---

### Phase 11: Guides Tab (Already Partially Wired)

#### 11.1 — GuidesTabContent
- **File**: `src/features/community/screens/GuidesTabContent.tsx`
- **Already**: Has partner invite card + partner program sheet
- **Wire**: Top guides from `guide_profiles` table
- **Wire**: Guide listings from `guide_listings` table

#### 11.2 — GuideProfileScreen
- **File**: `src/features/community/screens/GuideProfileScreen.tsx`
- **Wire**: Profile from `guide_profiles`, listings, reviews, vouches

#### 11.3 — ListingDetailScreen
- **File**: `src/features/community/screens/ListingDetailScreen.tsx`
- **Wire**: Listing data from `guide_listings`

---

### Phase 12: Moderation & Reporting (1 file)

#### 12.1 — ReportScreen
- **File**: `src/features/community/screens/ReportScreen.tsx`
- **Wire**: Submit report → insert into content moderation table
- **Wire**: Report types: spam, harassment, inappropriate, fake_profile, scam

---

## Execution Order (Priority)

| Priority | Phase | Estimated Files | Description |
|----------|-------|----------------|-------------|
| 🔴 P0 | Phase 1 | 5-6 files | Discover tab — remove ALL mock data |
| 🔴 P0 | Phase 2 | 3 files | Groups tab — remove mock fallbacks |
| 🟠 P1 | Phase 3 | 5 files | Group detail + feed wiring |
| 🟠 P1 | Phase 4 | 3 files | Post creation + detail flow |
| 🟠 P1 | Phase 5 | 4 files | Events system |
| 🟡 P2 | Phase 6 | 4 files | Travelers/buddies system |
| 🟡 P2 | Phase 7 | 3 files | Messaging system |
| 🟡 P2 | Phase 8 | 2 files | Search & notifications |
| 🟢 P3 | Phase 9 | 2 files | Create group flow |
| 🟢 P3 | Phase 10 | 3 files | Activities & live map |
| 🟢 P3 | Phase 11 | 3 files | Guides tab |
| 🟢 P3 | Phase 12 | 1 file | Moderation |

**Total: ~38-40 files to wire/audit across 12 phases**

---

## Database Tables Already Created (No New Migrations Needed)

All of these tables exist and have RLS policies:
- `groups`, `group_members`, `group_join_requests`
- `community_posts`, `post_comments`, `post_reactions`, `comment_likes`
- `saved_posts`, `post_shares`
- `buddy_connections`, `buddy_settings`
- `community_events`, `event_attendees`
- `community_activities`, `activity_participants`, `activity_invites`
- `chat_rooms`, `direct_conversations`, `chat_messages`, `message_reactions`, `message_read_status`
- `user_live_locations`, `user_blocks`, `user_follows`
- `guide_profiles`, `guide_listings`, `guide_vouches`, `guide_reviews`
- `user_social_profiles`, `interests`
- `alerts`, `user_notification_preferences`

## Services Already Implemented (No New Services Needed)

All services talk to real Supabase tables:
- `groupService` — Full CRUD
- `buddyService` — Full matching + connections
- `eventService` — Full CRUD + RSVP
- `activityService` — Full CRUD + nearby
- `chatService` — Conversations + messages
- `postService` — Full CRUD + reactions + comments + saved

## Key Patterns to Follow

1. **Remove mock data** → Replace with hook/service calls
2. **Add loading states** → Skeleton loaders or ActivityIndicator
3. **Add empty states** → Contextual messages when no data
4. **Add pull-to-refresh** → Re-fetch from service on pull
5. **Add error handling** → try/catch with user-facing error toast
6. **Preserve existing UI** — Only change data source, not visual design
7. **Use existing hooks** from `useCommunity.ts` wherever possible
