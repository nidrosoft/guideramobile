# Guidera Admin Panel — Complete Blueprint

> **Codename:** Guidera Mission Control  
> **Audience:** Internal ops team, product managers, customer support, marketing  
> **Stack:** Next.js 15 + Tailwind CSS + shadcn/ui + Supabase JS client  
> **Data Source:** Supabase project `pkydmdygctojtfzbqcud` (127 tables)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Dashboard — Global Overview](#2-dashboard--global-overview)
3. [User Management](#3-user-management)
4. [Trip Management](#4-trip-management)
5. [Content & Destinations](#5-content--destinations)
6. [Events Management](#6-events-management)
7. [Community & Social](#7-community--social)
8. [Deals & Affiliates](#8-deals--affiliates)
9. [AI & Intelligence](#9-ai--intelligence)
10. [Safety & SOS](#10-safety--sos)
11. [Notifications & Alerts](#11-notifications--alerts)
12. [Local Guides & Partners](#12-local-guides--partners)
13. [Booking Search Analytics](#13-booking-search-analytics)
14. [Edge Functions & Infrastructure](#14-edge-functions--infrastructure)
15. [Marketing & Segmentation](#15-marketing--segmentation)
16. [Moderation & Reports](#16-moderation--reports)
17. [Settings & Access Control](#17-settings--access-control)
18. [Database Tables Reference](#18-database-tables-reference)
19. [Implementation Phases](#19-implementation-phases)

---

## 1. Executive Summary

Guidera is a full-stack travel super-app with **16 registered users**, **22 trips**, **201 curated destinations**, **728 events**, **525 cached deals**, **7 community groups**, **13 Pulse activities**, **52 edge functions**, and deep AI integration (chat assistant, trip snapshots, packing lists, safety guides, itineraries, etc.).

The admin panel provides **complete operational visibility and control** across every feature. Think of it as what Airbnb's internal "Adminbnb" or Expedia's Partner Central would look like — purpose-built for a travel super-app.

### Key Capabilities
- **User 360° View** — Every detail about every user in one place
- **Content Curation** — Manage destinations, events, deals, sections
- **Community Moderation** — Groups, posts, activities, messages, reports
- **AI Operations** — Chat logs, generation history, model performance
- **Safety Command Center** — SOS events, safety alerts, zone monitoring
- **Marketing Segmentation** — Filter users by 50+ attributes, create cohorts
- **Infrastructure Health** — Edge function logs, cron jobs, API provider status
- **Action Engine** — Block/unblock users, feature/unfeature content, send notifications

---

## 2. Dashboard — Global Overview

### 2.1 KPI Cards (Top Row)
| Metric | Source Table | Query |
|--------|-------------|-------|
| Total Users | `profiles` | `count(*)` |
| Active Today | `profiles` | `WHERE last_seen_at > now() - interval '24h'` |
| Active This Week | `profiles` | `WHERE last_seen_at > now() - interval '7d'` |
| Total Trips | `trips` | `count(*)` |
| Trips This Week | `trips` | `WHERE created_at > now() - interval '7d'` |
| AI Chats Today | `ai_chat_sessions` | `WHERE created_at > now() - interval '24h'` |
| Deals Clicked | `deal_clicks` | `count(*)` |
| Active SOS Events | `sos_events` | `WHERE status = 'active'` |
| Pending Partner Apps | `partner_applications` | `WHERE status = 'submitted'` |
| Open Issue Reports | `issue_reports` | `WHERE status != 'resolved'` |

### 2.2 Charts
- **User Growth** — Line chart (daily signups from `profiles.created_at`)
- **Trip Creation Trend** — Bar chart (weekly trip counts)
- **AI Usage** — Stacked area (chat messages, generations, snapshots per day)
- **Deal Performance** — Funnel (impressions → clicks → saves → price alerts)
- **Community Activity** — Multi-line (posts, comments, activities, messages per day)
- **Top Destinations** — Horizontal bar (most saved/searched destinations)
- **Geographic Distribution** — World map heat (users by `profiles.country`)

### 2.3 Recent Activity Feed
Real-time feed pulling from multiple tables:
- New user signups
- Trip creations
- AI chat sessions started
- SOS events triggered
- Partner applications submitted
- Community reports filed
- Deal clicks

---

## 3. User Management

### 3.1 User List View
**Source:** `profiles` table (16 users, 80+ columns)

| Column | Source |
|--------|--------|
| Avatar | `avatar_url` |
| Name | `first_name + last_name` |
| Email / Phone | `email`, `phone` |
| Location | `city`, `country` |
| Membership | `membership_type` (free/premium/pro) |
| Verified | `is_verified`, `identity_verified` |
| Onboarding | `onboarding_completed`, `onboarding_step` |
| Created | `created_at` |
| Last Seen | `last_seen_at` |
| Status | Derived: active / inactive / deleted (`deleted_at`) |

**Filters:**
- By membership type (free / premium / pro)
- By verification status (verified / unverified)
- By onboarding status (completed / incomplete)
- By country / city / continent
- By created date range
- By last seen (active in 24h / 7d / 30d / inactive)
- By ethnicity, gender, nationality
- By travel style tags

**Actions:**
- View full profile (360° view)
- Edit profile fields
- Change membership tier
- Mark as verified / unverified
- Suspend / block user (set `deleted_at`)
- Restore suspended user (clear `deleted_at`)
- Send push notification
- Reset password (via Clerk API)
- Export user data (GDPR compliance)
- Delete account permanently

### 3.2 User 360° Detail View
The most important screen. Shows EVERYTHING about a single user.

#### Tab: Overview
- Profile card (avatar, name, bio, location, member since)
- Membership badge + expiry
- Verification status (Trusted Traveler, identity, email, phone)
- Stats: trips completed, countries visited, cities explored, reviews written
- Reward points balance
- Referral code + referral count
- Travel DNA summary (from `user_travel_dna`)
- Device info (from `user_devices`)

#### Tab: Trips
**Source:** `trips` WHERE `user_id = profile.id`
- List of all trips with destination, dates, status, traveler count
- Click into trip detail (see Section 4)
- Trip bookings (`trip_bookings`)
- Trip imports (`trip_imports`)
- Trip invitations sent/received (`trip_invitations`)
- Trip members (`trip_members`)

#### Tab: AI Activity
- **Chat Sessions** (`ai_chat_sessions` + `ai_chat_messages`) — Full conversation logs
- **Generation History** (`ai_generation_logs`) — Packing lists, itineraries, safety guides, etc.
- **Trip Snapshots** — Generated snapshots with topic selections
- **AI Module Cache** (`ai_module_cache`) — Cached AI outputs for this user

#### Tab: Community
- **Groups joined** (`group_members` WHERE `user_id`)
- **Groups created** (`groups` WHERE `created_by`)
- **Posts** (`community_posts` WHERE `author_id`)
- **Activities created/joined** (`community_activities`, `activity_participants`)
- **Events** (`community_events` WHERE `organizer_id` or `event_attendees`)
- **DMs** (`direct_conversations` + `chat_messages`)
- **Buddy connections** (`buddy_connections`)
- **Following / followers** (`user_follows`)
- **Blocked users** (`user_blocks`)

#### Tab: Deals & Saves
- **Saved destinations** (`user_saved_items` WHERE `item_type = 'destination'`)
- **Saved experiences** (`user_saved_items` WHERE `item_type = 'local_experience'`)
- **Saved deals** (`saved_deals`)
- **Deal clicks** (`deal_clicks`) — What they clicked, when, which provider
- **Price alerts** (`price_alerts`) — Active route monitoring
- **Collections** (`saved_collections` + `saved_items`)
- **Search patterns** (`user_search_patterns`) — What they search for

#### Tab: Safety & SOS
- **SOS settings** (`sos_settings`) — Emergency contacts, auto-call enabled
- **SOS events** (`sos_events`) — History of SOS triggers
- **Safety alerts** (`safety_zone_alerts`) — Zone alerts triggered
- **Safety check-ins** (`safety_checkins`)

#### Tab: Financial
- **Expenses** (`expenses` WHERE `user_id`) — All tracked expenses
- **Reward points** (`reward_points`) — Balance + transaction history
- **Referrals** (`referrals` WHERE `referrer_id`) — People they referred
- **Travel preferences** (`travel_preferences`) — Budget, currency, spending style

#### Tab: Settings & Preferences
- Full `preferences` JSONB (notifications, currency, language, distance unit, temperature)
- Full `travel_preferences` JSONB (styles, interests, accessibility)
- Full `privacy_settings` JSONB (visibility, sharing, personalization)
- Full `security_settings` JSONB (2FA, biometrics, login alerts)
- Notification preferences (`user_notification_preferences`)
- Connected apps (`linked_travel_accounts`)

#### Tab: Documents & Health
- Passport info (country, expiry)
- Driver's license, Global Entry, TSA PreCheck
- Insurance info
- Medical conditions, allergies, medications, blood type
- Emergency contacts
- Document checklists (`document_checklists` + `document_items`)

#### Tab: Audit Log
- All user actions with timestamps
- Login history (`user_sessions`, `trusted_devices`)
- Profile changes
- Clerk auth events

---

## 4. Trip Management

### 4.1 Trip List View
**Source:** `trips` table (22 trips)

| Column | Source |
|--------|--------|
| Title | `title` |
| Owner | JOIN `profiles` on `user_id` |
| Destination | `destination` |
| Dates | `start_date` → `end_date` |
| Status | `status` |
| Travelers | `traveler_count` |
| Created | `created_at` |

**Filters:** By status, destination, date range, owner, traveler count

### 4.2 Trip Detail View

#### Overview Tab
- Trip metadata (title, destination, dates, status, cover image)
- Owner profile card
- Traveler list (`trip_travelers`, `trip_members`)
- Trip shares (`trip_shares`)

#### Itinerary Tab
- **Days** (`itinerary_days`) — Day-by-day breakdown
- **Activities** (`itinerary_activities`) — Per-day activities with times, locations
- AI-generated vs. manual distinction

#### Bookings Tab
- **Trip bookings** (`trip_bookings`) — Flights, hotels, cars linked to trip
- **Trip imports** (`trip_imports`) — Email-scanned or ticket-scanned bookings

#### Packing Tab
- **Packing items** (`packing_items`) — 1,156 total items across all trips
- Category breakdown, packed vs. unpacked status
- AI-generated flag

#### Expenses Tab
- **Expenses** (`expenses`) — Amount, currency, category, date
- Summary statistics

#### Journal Tab
- **Journal entries** (`journal_entries`) — Travel diary entries
- **Journal blocks** (`journal_blocks`) — Rich content blocks (text, photos, etc.)

#### Documents Tab
- **Document checklists** (`document_checklists`)
- **Document items** (`document_items`) — Visa, passport, insurance docs

#### Safety Tab
- **Safety alerts** for trip destination
- Cultural tips (`cultural_tips`)
- Language kit (`language_kits` + `language_phrases`)

#### Collaboration Tab
- **Invitations** (`trip_invitations`) — Sent, accepted, declined
- **Members** (`trip_members`) — Role-based access
- **Plans** (`trip_plans`) — Shared planning data

**Actions:**
- Edit trip details
- Change trip status
- Delete trip
- Re-generate AI content (itinerary, packing, safety)
- View all AI generations for this trip

---

## 5. Content & Destinations

### 5.1 Curated Destinations
**Source:** `curated_destinations` (201 destinations)

| Column | Source |
|--------|--------|
| Name | `name` |
| Country | `country` |
| Category | `primary_category` |
| Budget Level | `budget_level` (1-5) |
| Rating | `editor_rating` |
| Popularity | `popularity_score` |
| Featured | `is_featured` |
| Trending | `is_trending` |
| Images | `hero_image_url`, `thumbnail_url` |

**Filters:** By category (popular, adventure, budget, beach, cultural, hidden_gems, romantic, family, luxury), by continent, by featured/trending, by budget level

**Actions:**
- Edit destination details
- Change featured/trending status
- Replace images (trigger `repair-destination-images`)
- View AI enrichment data (`destination_ai_enrichment`)
- Re-trigger enrichment (`enrich-destination` edge function)
- View events for this destination (`destination_events`)
- View detail cache (`destination_detail_cache`)
- Preview as it appears in app

### 5.2 Homepage Sections
**Source:** `section_cache` (11 sections)

| Section | Strategy |
|---------|----------|
| destinations | Popular by popularity_score |
| places | Popular by editor_rating |
| must-see | Featured by editor_rating |
| editor-choices | Featured by editor_rating |
| trending-locations | Trending by popularity_score |
| best-discover | Off-beaten-path |
| budget-friendly | Budget level ≤ 2 |
| luxury-escapes | Budget level ≥ 4 |
| local-experiences | All by popularity |
| family-friendly | Best for families |
| deals | GIL deal engine |

**Actions:**
- View cached data per section
- Force refresh individual section (`section-refresh`)
- Force refresh ALL sections
- Edit section strategy/filters
- View cache expiry and last refresh timestamp

### 5.3 Destination AI Enrichment
**Source:** `destination_ai_enrichment` (201 records)

Shows AI-generated data per destination:
- Safety score + safety cards
- Budget per day + breakdown (budget/mid/luxury)
- Recommended duration
- Practical tips
- Best time to visit
- Refresh timestamps and schedules

**Actions:**
- View enrichment data
- Force re-enrich specific destination
- Batch re-enrich all stale destinations
- Edit enrichment data manually

---

## 6. Events Management

### 6.1 Events List
**Source:** `destination_events` (728 events)

| Column | Source |
|--------|--------|
| Name | `name` |
| City | `city` |
| Category | `category` |
| Dates | `date_start` → `date_end` |
| Recurring | `is_recurring` |
| Image | `image_url` |
| Rating | `rating` |
| Price | `ticket_price` |

**Filters:** By city, category, date range, recurring, has image / missing image, rating range

**Actions:**
- Edit event details
- Delete event
- Replace image (trigger `repair-event-images`)
- Batch repair missing images
- Re-discover events for a city (`event-discovery`)
- View attendees (`event_attendees`)

### 6.2 Community Events
**Source:** `community_events` (1 event)

User-created events within community groups.

**Actions:**
- Approve / reject
- Edit details
- Delete
- View attendees

---

## 7. Community & Social

### 7.1 Groups
**Source:** `groups` (7 groups) + `group_members` (15 members)

| Column | Source |
|--------|--------|
| Name | `name` |
| Creator | JOIN `profiles` on `created_by` |
| Members | Count from `group_members` |
| Type | `type` (public/private) |
| Created | `created_at` |

**Actions:**
- View group details + member list
- Edit group info
- Remove members
- Delete group
- View join requests (`group_join_requests`)
- View all posts in group
- View chat room (`chat_rooms`)

### 7.2 Posts
**Source:** `community_posts` (6 posts)

| Column | Source |
|--------|--------|
| Author | JOIN `profiles` on `author_id` |
| Content | `content` |
| Media | `media` (JSONB) |
| Reactions | `reaction_count` |
| Comments | `comment_count` |
| Reports | Count from reports |

**Actions:**
- View full post with comments (`post_comments`)
- View reactions (`post_reactions`)
- Delete post
- Hide post
- Ban author
- View reports against this post

### 7.3 Pulse Activities
**Source:** `community_activities` (13 activities)

| Column | Source |
|--------|--------|
| Title | `title` |
| Creator | JOIN `profiles` on `creator_id` |
| Type | `activity_type` (food_drink, nightlife, sightseeing, etc.) |
| City | `city` |
| Status | `status` (open/full/cancelled/completed) |
| Participants | `participant_count` / `max_participants` |
| Date/Time | `scheduled_at` |

**Actions:**
- View participants (`activity_participants`)
- View comments (`activity_comments`)
- Cancel activity
- Delete activity
- View activity invites (`activity_invites`)

### 7.4 Direct Messages
**Source:** `direct_conversations` (4) + `chat_messages` (20)

- View all conversations
- View message threads
- Search messages by content
- Flag inappropriate content
- Delete messages

### 7.5 Buddy Connections
**Source:** `buddy_connections` (2)

- View all connections
- View buddy settings (`buddy_settings`)
- Disconnect pairs

### 7.6 User Relationships
- **Follows:** `user_follows` (0)
- **Blocks:** `user_blocks` (0)
- View social graph
- Force unblock

---

## 8. Deals & Affiliates

### 8.1 Deal Cache
**Source:** `deal_cache` (525 cached deals)

| Column | Source |
|--------|--------|
| Title | `title` |
| Type | `deal_type` (flight/hotel/experience) |
| Provider | `provider` |
| Price | `price` |
| Original Price | `original_price` |
| Discount % | Computed |
| Destination | `destination` |
| Expires | `expires_at` |
| Image | `image_url` |

**Filters:** By type, provider, destination, price range, expiry, discount %

**Actions:**
- Edit deal details
- Delete stale deals
- Force refresh deal images (`refresh-deal-images`)
- Trigger new deal scan (`deal-scanner`)
- View click analytics
- Preview deal as it appears in app

### 8.2 Deal Analytics
- **Clicks** (`deal_clicks` — 5 clicks) — User, deal, timestamp, provider
- **Saves** (`saved_deals` — 1 save) — Who saved what
- **Price Alerts** (`price_alerts` — 0) — Active monitoring
- **Price History** (`price_history`) — Price trends over time
- **User Deal Matches** (`user_deal_matches`) — GIL engine matches

### 8.3 Affiliate Configuration
**Source:** `affiliate_config`

Manage affiliate parameters per provider:
- Kiwi, Booking, Google Flights, GetYourGuide, RentalCars, Amadeus
- Commission rates, tracking parameters, deeplink templates

### 8.4 Travel DNA
**Source:** `user_travel_dna` (16 records)

View computed travel DNA profiles:
- Preferred destinations, budget range, travel style scores
- Used by GIL deal engine for personalized deal matching

---

## 9. AI & Intelligence

### 9.1 AI Chat Sessions
**Source:** `ai_chat_sessions` (9 sessions) + `ai_chat_messages` (74 messages)

| Column | Source |
|--------|--------|
| User | JOIN `profiles` |
| Context | `context_type` |
| Messages | Count from `ai_chat_messages` |
| Started | `created_at` |
| Last Message | Max `created_at` from messages |

**Actions:**
- View full conversation transcript
- View tool calls (web search, weather, flights, hotels, maps, etc.)
- Flag conversations
- Export conversation
- See which AI model responded (Claude, Grok, Gemini)

### 9.2 AI Generation Logs
**Source:** `ai_generation_logs`

Track all AI content generation:
- Module type (packing, itinerary, safety, language, dos_donts, cultural, documents, budget)
- User, trip, destination
- Model used, tokens consumed, latency
- Success / failure status
- Cached vs. fresh generation

### 9.3 AI Module Cache
**Source:** `ai_module_cache`

Three-tier cache management:
- **Tier 1** (destination_base): Language, cultural — 30-90 day TTL
- **Tier 2** (context_specific): Dos/donts, safety, budget — 7-14 day TTL
- **Tier 3** (personal): Packing, itinerary, documents — never cached

**Actions:**
- View cached entries
- Invalidate specific cache entries
- Bulk invalidate by destination or tier
- View cache hit rates

### 9.4 Trip Snapshots
Monitor trip snapshot generation:
- Destination, dates, travelers
- Selected topics (from 24 available)
- AI model used, generation time
- Flights, hotels, experiences, events returned
- Cost estimate generated

### 9.5 Destination Intelligence
**Source:** `destination_intelligence`

Cached destination data used by AI context builder:
- Safety data, cultural info, language tips
- Refresh timestamps

---

## 10. Safety & SOS

### 10.1 SOS Command Center
**Source:** `sos_events` (0 events — but critical to monitor)

| Column | Source |
|--------|--------|
| User | JOIN `profiles` |
| Location | `latitude`, `longitude` |
| Status | `status` |
| Triggered At | `triggered_at` |
| Resolved At | `resolved_at` |

**Real-time dashboard** showing:
- Active SOS events on a world map
- Emergency contact notification status
- Response timeline
- User's last known location

**Actions:**
- Acknowledge SOS
- Contact emergency services
- Send notification to emergency contacts
- Mark as resolved
- View user's SOS settings (`sos_settings`)

### 10.2 Safety Zone Alerts
**Source:** `safety_zone_alerts` (1 alert)

- User location-based risk assessments
- Risk level, risk score, crime score
- Active disasters
- Country advisory levels

### 10.3 Safety Check-ins
**Source:** `safety_checkins`

- User check-in history
- Missed check-ins (potential concern)
- Trip-linked check-ins

### 10.4 Safety Alerts
**Source:** `safety_alerts`

- System-generated safety alerts
- Travel advisories
- Weather alerts
- Local incidents

---

## 11. Notifications & Alerts

### 11.1 Notification Center
**Source:** `alerts` (39 alerts) + `alert_types` + `alert_categories`

| Category | Types |
|----------|-------|
| Trip | flight_delay, flight_cancelled, gate_change, checkin_reminder, trip_reminder |
| Safety | travel_advisory, weather_alert, local_incident, sos_activated |
| Financial | price_drop, compensation_eligible, budget_warning |
| Social | buddy_nearby, trip_invite |
| System | booking_confirmed, booking_cancelled, account_security |

**Actions:**
- View all alerts by category
- Send targeted notification to user/segment
- Broadcast notification to all users
- View delivery status
- Manage alert templates (`alert_types`)

### 11.2 Push Notification Management
**Source:** `user_devices` (9 devices)

- View registered devices (Expo push tokens)
- Send test notifications
- View notification preferences per user (`user_notification_preferences`)
- Manage scheduled notifications (`scheduled_notification_jobs`)
- View notification batches (`alert_batches`)

### 11.3 Deal Notifications
**Source:** `deal_notifications`

- Price drop alerts sent
- Deal match notifications
- Delivery and open rates

---

## 12. Local Guides & Partners

### 12.1 Partner Applications
**Source:** `partner_applications` (4 applications)

| Column | Source |
|--------|--------|
| Applicant | JOIN `profiles` |
| Status | `status` (draft/submitted/approved/rejected) |
| Didit Verification | `didit_verification_status` |
| City | `city` |
| Expertise | `expertise_areas` |
| Submitted | `created_at` |

**Actions:**
- Review application details
- Approve / reject application
- Request additional info
- View identity verification status
- Promote to Local Guide

### 12.2 Guide Profiles
**Source:** `guide_profiles` (0 — grows as partners are approved)

- Trust tier (verified_local → background_cleared → trusted_guide → community_ambassador)
- Verification status
- Expertise areas
- Stats (tours given, rating, reviews)

### 12.3 Guide Listings
**Source:** `guide_listings` (0)

- Tours, rentals, services, recommendations
- Pricing, availability
- Featured status

**Actions:**
- Approve / reject listings
- Feature / unfeature
- Edit pricing
- Suspend listing

### 12.4 Guide Reviews & Vouches
- **Reviews** (`guide_reviews`) — Traveler reviews of guides
- **Vouches** (`guide_vouches`) — Guide-to-guide vouching system
- Moderate reviews, remove fake vouches

---

## 13. Booking Search Analytics

### 13.1 Search Sessions
**Source:** `search_sessions`, `search_results`, `search_cache`, `popular_searches`

- What users are searching for (flights, hotels, cars, experiences)
- Search parameters (origin, destination, dates, travelers)
- Results returned per search
- Conversion: search → click → save → price alert

### 13.2 Provider Performance
**Source:** `api_providers`, `provider_health_checks`, `provider_logs`, `provider_rate_limits`

| Provider | Type |
|----------|------|
| SerpAPI Google Flights | Flights (primary) |
| Kiwi.com | Flights (secondary) |
| Amadeus | Flights (tertiary) |
| SerpAPI Google Hotels | Hotels (primary) |
| Booking.com | Hotels (fallback) |
| Viator | Experiences |

**Dashboard:**
- Response times per provider
- Error rates
- Rate limit usage
- Cost tracking (`provider_costs`)

### 13.3 Provider Manager
**Source:** `provider_capabilities`, `provider_credentials`, `routing_rules`

- View and edit routing rules
- Enable/disable providers
- Update credentials
- View capability matrix

---

## 14. Edge Functions & Infrastructure

### 14.1 Edge Functions Monitor
**52 deployed functions** — grouped by domain:

| Domain | Functions |
|--------|-----------|
| AI & Generation | ai-generation, ai-vision, chat-assistant, generate-packing, generate-itinerary, generate-dos-donts, generate-language, generate-safety, generate-documents, generate-expense-summary, generate-compensation |
| Trip | trip-snapshot, trip-import-engine, scan-ticket, scan-receipt, departure-advisor |
| Discovery | event-discovery, discover-destinations, local-experiences, destination-details, enrich-destination, classify-destination |
| Search & Deals | provider-manager, flight-search, hotel-search, deal-scanner, deal-notifier, refresh-deal-images |
| Content | homepage, personalize-homepage, section-refresh, repair-destination-images, repair-event-images, tiktok-content |
| Safety | safety-alerts, weather, flight-tracking |
| Community | — (uses direct Supabase) |
| Auth & Identity | didit-create-session, didit-check-status, didit-webhook, gemini-live-token |
| Notifications | send-notification, send-crash-report, notify-issue-report |
| Utility | translation, transcribe-audio, tts, currency, google-api-proxy, search, places |
| Scheduler | scheduled-jobs |

**For each function:**
- Last invocation time
- Success/error rates (from Supabase logs)
- Average latency
- Logs viewer (via `get_logs` API)

**Actions:**
- View recent logs
- Trigger manual invocation
- View deployed version

### 14.2 Scheduled Jobs
**Source:** `scheduled_jobs` table + cron jobs in `scheduled-jobs` edge function

10 cron jobs managing:
- Deal scanning (GIL engine)
- Event expiry cleanup
- Section cache refresh
- Notification delivery
- Activity expiry

**Actions:**
- View job history
- Trigger manual run
- Enable/disable jobs
- View next scheduled run

### 14.3 TikTok Cache
**Source:** `tiktok_cache`

- Cached TikTok content per destination
- TTL management (2-6 hours)
- Cache hit rates

---

## 15. Marketing & Segmentation

### 15.1 User Segmentation Engine

Build custom segments from 50+ profile attributes:

**Demographics:**
- Age range (from `date_of_birth`)
- Gender
- Ethnicity
- Nationality / country of residence
- City / country

**Behavior:**
- Membership tier
- Onboarding completion
- Last active (1d / 7d / 30d / 90d / churned)
- Number of trips created
- Number of AI chats
- Number of deal clicks
- Number of community posts
- Has travel preferences set

**Travel Profile:**
- Travel styles (from `travel_preferences`)
- Interests
- Budget level
- Activity level
- Food adventurousness
- Packing style
- International trips count
- Countries visited

**Engagement:**
- Has push notifications enabled
- Has saved items
- Has price alerts
- Is in a group
- Has buddy connections
- Is a Local Guide applicant

**Geographic:**
- By continent
- By country
- By city
- By timezone

### 15.2 Segment Actions
- **Send push notification** to segment
- **Export segment** as CSV
- **View segment analytics** (trip rate, engagement rate, retention)
- **Create email campaign** for segment
- **A/B test** feature flags by segment

### 15.3 Cohort Analysis
- Signup cohort retention curves
- Feature adoption funnels
- Trip creation funnel (signup → onboarding → first trip → second trip)
- Monetization funnel (free → premium conversion)

### 15.4 Popular Searches
**Source:** `popular_searches`

- Trending search terms
- Search volume over time
- Geographic breakdown of searches

---

## 16. Moderation & Reports

### 16.1 Issue Reports
**Source:** `issue_reports` (1 report)

| Column | Source |
|--------|--------|
| Reporter | JOIN `profiles` |
| Type | `report_type` |
| Description | `description` |
| Status | `status` |
| Screenshots | `attachments` |
| Created | `created_at` |

**Actions:**
- Assign to team member
- Change status (open → in progress → resolved)
- Reply to reporter
- Link to related content (post, user, group)

### 16.2 Content Moderation Queue
Aggregate view of all flagged content:
- Reported posts (`community_posts` with reports)
- Reported messages
- Reported users
- Reported activities
- Reported listings

**Actions:**
- Approve content (dismiss report)
- Remove content
- Warn user
- Suspend user
- Ban user

### 16.3 User Blocks
**Source:** `user_blocks` (0)

- View all block relationships
- Override blocks if needed (admin)

### 16.4 Compensation Claims
**Source:** `compensation_claims`, `compensation_rights_cards`

- View flight compensation claims
- Approve / deny claims
- Track claim status

---

## 17. Settings & Access Control

### 17.1 Admin Roles
| Role | Permissions |
|------|-------------|
| Super Admin | Full access to everything |
| Content Manager | Destinations, events, deals, sections |
| Community Manager | Groups, posts, activities, moderation |
| Support Agent | User view (read), reports, notifications |
| Marketing | Segmentation, analytics, campaigns |
| Safety Officer | SOS, safety alerts, zone monitoring |

### 17.2 System Configuration
- **Seasonal Promotions** (`seasonal_promotions`) — Manage active promos
- **Homepage Categories** (`homepage_categories`) — Category pill configuration
- **Affiliate Config** (`affiliate_config`) — Commission rates, tracking
- **API Provider Settings** — Enable/disable, credentials, rate limits

### 17.3 Audit Log
Track all admin actions:
- Who did what, when
- Before/after values for edits
- IP address, user agent

---

## 18. Database Tables Reference

### Full Table Inventory (127 tables)

**User Domain (20 tables):**
`profiles`, `travel_preferences`, `user_devices`, `user_sessions`, `trusted_devices`, `user_follows`, `user_blocks`, `user_saved_items`, `user_social_profiles`, `user_email_aliases`, `user_live_locations`, `user_interactions`, `user_search_patterns`, `user_travel_dna`, `user_deal_matches`, `user_notification_preferences`, `identity_verifications`, `payment_methods`, `interests`, `buddy_settings`

**Trip Domain (15 tables):**
`trips`, `trip_members`, `trip_travelers`, `trip_bookings`, `trip_invitations`, `trip_shares`, `trip_plans`, `trip_activities`, `trip_imports`, `itinerary_days`, `itinerary_activities`, `packing_items`, `expenses`, `journal_entries`, `journal_blocks`

**Content Domain (10 tables):**
`curated_destinations`, `destination_events`, `destination_categories`, `destination_ai_enrichment`, `destination_detail_cache`, `destination_intelligence`, `curated_experiences`, `destinations`, `section_cache`, `homepage_categories`

**Community Domain (20 tables):**
`communities`, `community_members`, `groups`, `group_members`, `group_join_requests`, `community_posts`, `post_comments`, `post_reactions`, `post_shares`, `saved_posts`, `comment_likes`, `community_events`, `event_attendees`, `community_activities`, `activity_participants`, `activity_invites`, `activity_comments`, `activity_comment_likes`, `chat_rooms`, `chat_messages`

**Messaging (3 tables):**
`direct_conversations`, `message_reactions`, `message_read_status`

**Deals Domain (7 tables):**
`deal_cache`, `deal_clicks`, `saved_deals`, `deal_notifications`, `price_alerts`, `price_history`, `affiliate_config`

**AI Domain (5 tables):**
`ai_chat_sessions`, `ai_chat_messages`, `ai_generation_logs`, `ai_module_cache`, `tiktok_cache`

**Safety Domain (6 tables):**
`safety_alerts`, `safety_checkins`, `safety_profiles`, `safety_zone_alerts`, `sos_events`, `sos_settings`

**Notifications (5 tables):**
`alerts`, `alert_types`, `alert_categories`, `alert_batches`, `scheduled_notification_jobs`

**Local Guides (6 tables):**
`partner_applications`, `partner_verifications`, `guide_profiles`, `guide_listings`, `guide_reviews`, `guide_vouches`

**Rewards (3 tables):**
`reward_points`, `referrals`, `seasonal_promotions`

**Documents & Language (4 tables):**
`document_checklists`, `document_items`, `language_kits`, `language_phrases`

**Other (6 tables):**
`cultural_tips`, `compensation_claims`, `compensation_rights_cards`, `issue_reports`, `support_messages`, `notifications`

**Search & Provider (10 tables):**
`search_sessions`, `search_results`, `search_cache`, `popular_searches`, `api_providers`, `provider_capabilities`, `provider_credentials`, `provider_costs`, `provider_health_checks`, `provider_logs`

**Import (3 tables):**
`email_imports`, `email_scan_jobs`, `linked_travel_accounts`

**Infrastructure (4 tables):**
`scheduled_jobs`, `provider_rate_limits`, `routing_rules`, `guide_applications`

---

## 19. Implementation Phases

### Phase 1 — Foundation (Week 1-2)
- Next.js project setup with Supabase client
- Authentication (admin-only via Supabase + role check)
- Layout: sidebar navigation, responsive design
- **Dashboard** with KPI cards and charts
- **User List** with filters and pagination
- **User 360° View** (Overview + Trips + AI tabs)

### Phase 2 — Content & Trips (Week 3)
- **Trip Management** (list + detail with all tabs)
- **Destinations Management** (CRUD + enrichment viewer)
- **Events Management** (list + CRUD + image repair)
- **Homepage Sections** (cache viewer + refresh triggers)

### Phase 3 — Community & Moderation (Week 4)
- **Groups** (list + detail + member management)
- **Posts** (list + moderation actions)
- **Pulse Activities** (list + detail)
- **Messages** viewer
- **Issue Reports** queue
- **Content Moderation** queue

### Phase 4 — Deals & Analytics (Week 5)
- **Deals Dashboard** (cache + clicks + saves + alerts)
- **Affiliate Configuration**
- **Search Analytics** (sessions, popular searches)
- **Provider Performance** dashboard

### Phase 5 — AI & Safety (Week 6)
- **AI Chat Viewer** (full conversation logs)
- **AI Generation Logs** (all module types)
- **SOS Command Center**
- **Safety Alerts** dashboard
- **Notification Management**

### Phase 6 — Marketing & Partners (Week 7)
- **User Segmentation Engine** (filters + actions)
- **Cohort Analysis**
- **Partner Application Review**
- **Guide Management**
- **Broadcast Notifications**

### Phase 7 — Infrastructure & Polish (Week 8)
- **Edge Function Monitor**
- **Scheduled Jobs Dashboard**
- **Admin Roles & Permissions**
- **Audit Logging**
- **Export/Import tools**
- **Dark mode**

---

## Sidebar Navigation Structure

```
📊 Dashboard
👥 Users
   ├── All Users
   ├── Segments
   └── User Blocks
✈️ Trips
   ├── All Trips
   ├── Trip Imports
   └── Itineraries
🌍 Content
   ├── Destinations
   ├── Events
   ├── Homepage Sections
   └── AI Enrichment
🤝 Community
   ├── Groups
   ├── Posts
   ├── Pulse Activities
   ├── Messages
   └── Events
💰 Deals
   ├── Deal Cache
   ├── Analytics
   ├── Affiliates
   └── Price Alerts
🤖 AI Operations
   ├── Chat Sessions
   ├── Generation Logs
   ├── Module Cache
   └── Trip Snapshots
🛡️ Safety
   ├── SOS Center
   ├── Safety Alerts
   └── Check-ins
🔔 Notifications
   ├── Alert Center
   ├── Push Management
   └── Templates
🧑‍🏫 Partners
   ├── Applications
   ├── Guide Profiles
   ├── Listings
   └── Reviews
🔍 Search & Providers
   ├── Search Analytics
   ├── Provider Health
   └── Routing Rules
📣 Marketing
   ├── Segmentation
   ├── Cohorts
   └── Campaigns
🚩 Moderation
   ├── Reports
   ├── Content Queue
   └── Compensation
⚙️ Settings
   ├── Admin Roles
   ├── System Config
   └── Audit Log
```

---

*Generated: April 6, 2026*  
*Product: Guidera v1.0*  
*Database: 127 tables, 52 edge functions, 16 users*
