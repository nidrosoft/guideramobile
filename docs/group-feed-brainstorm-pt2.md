# Guidera Group Feed — Part 2: Differentiators, Data Model & Technical Plan

---

## 10. Travel-Specific Differentiators — The "Must-Have" Features

These are what make Guidera groups fundamentally different from Facebook Groups. These are the **"wow, I need this"** moments.

### 🗺️ 10.1 — Map View of Posts

Every group feed has a **Map toggle**. Switch from list to map and see ALL location-tagged posts plotted on the destination map.

```
[List View]  [Map View 🗺️]

     ┌──────────────────────┐
     │      MAP              │
     │   📍 TeamLab          │
     │          📍 Shibuya   │
     │   📍 Ramen St    📍   │
     │              💎       │
     └──────────────────────┘
     Tap a pin → post preview → full detail
```

**Why it's killer:** You're walking through Tokyo. Open "Japan 2025 Travelers" in map view. See every tip, check-in, and hidden gem plotted around you — a crowdsourced, **live** travel guide. No other platform does this.

### 📍 10.2 — Verified Check-ins (Geo-Proof)

When creating a Check-in post, if GPS confirms you're within 500m of the tagged location, the post gets a **"📍 Verified Location"** badge.

When someone says "this restaurant is amazing" and their post has verified location, you **know** they actually went there. This is massive for trust and separates real travelers from armchair reviewers.

### 💰 10.3 — Cost Report Posts

A structured post type for budget sharing:

```
┌─────────────────────────────────────────┐
│  💰 3-Day Tokyo Budget Breakdown        │
│  By Sarah Chen · 📍 Verified            │
│                                          │
│  ✈️ Flights:      $450                   │
│  🏨 Hotel:        $180 (3 nights)       │
│  🍜 Food:         $120                   │
│  🚃 Transport:    $35 (Suica card)      │
│  🎯 Activities:   $90                    │
│  ────────────────────────                │
│  📊 Total: $935  ·  ~$312/day           │
└─────────────────────────────────────────┘
```

Over time, a group accumulates crowd-sourced budget data that's **invaluable** for planning. No travel app offers this.

### 🤝 10.4 — Buddy Request Posts

Structured companion finder within the group:

```
┌─────────────────────────────────────────┐
│  🤝 Looking for Travel Buddy            │
│  📍 Osaka & Kyoto · Mar 18-25           │
│  👥 Looking for 1-2 people              │
│  🎯 Vibe: Chill, cultural, foodie      │
│  💰 Budget: ~$150/day                   │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │  🤝 I'm Interested (3 people)  │     │
│  └─────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

Tap "I'm Interested" → author gets notified, views your profile, decides to connect.

### 💎 10.5 — Hidden Gem Posts

Special styling, collected into a "Hidden Gems" section in About tab, plotted with gem icon on map view. **Only visible to group members** — incentive to join.

### ⚠️ 10.6 — Safety Alerts

Admin/verified-only. Auto-pins to top. Push notification to all members. Severity levels: Info (blue) / Warning (yellow) / Critical (red). Location zone on map. Auto-expires.

Example: "⚠️ Pickpocket ring active near Shinjuku station this week. Keep valuables in front pockets."

### 🗓️ 10.7 — "Who's There When" Timeline

Opt-in visual showing member travel dates overlapping:

```
March 2026
  15 ──── Sarah ──── 25
     17 ── Mike ── 22
  15 ────── Emma ────── 28
        19 ── You ── 24
```

Trivially easy to spot overlaps and plan meetups. This alone could be a killer feature.

### 🏷️ 10.8 — Post Bookmarking with Collections

Save posts into organized folders:
- "My Tokyo Food List"
- "Budget Tips"
- "Photo Spots"
- "Things to Avoid"

Private by default, shareable with buddies.

### 🏆 10.9 — Contributor Badges

| Badge | Criteria |
|-------|----------|
| 🌟 First Post | Made first post in any group |
| 💬 Conversation Starter | 5 posts with 10+ comments each |
| 💡 Top Tipster | 10 tips with 20+ helpful reactions |
| 📸 Storyteller | 5 photo journal posts |
| 🤝 Connector | 3+ successful buddy matches |
| 🗺️ Explorer | Check-ins at 10+ locations |
| 🛡️ Safety First | 3 safety alerts with 50+ reactions |
| 💎 Gem Hunter | 5 hidden gems with 30+ reactions |
| 🌍 Globe Trotter | Active in 5+ country groups |

### 🔗 10.10 — Cross-Group Sharing

Share a post from one group to another. A great ramen tip from "Tokyo Foodies" gets shared to "Japan 2025 Travelers" with attribution.

---

## 11. Traveler Profile — Public View Detail

```
┌─────────────────────────────────────────┐
│  ← Back                          [⋯]   │
│  ┌──────────────────────────────────┐    │
│  │       [Cover Photo/Banner]       │    │
│  │    ┌──────┐                      │    │
│  │    │Avatar│                      │    │
│  └────┴──────┴──────────────────────┘    │
│                                          │
│  Sarah Chen  ✓ Verified                  │
│  🇺🇸 San Francisco, USA                  │
│  "Adventure seeker. 23 countries and     │
│   counting."                             │
│                                          │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │  12 │  │  23 │  │  4  │  │  7  │    │
│  │Trips│  │Ctry │  │Revws│  │Grps │    │
│  └─────┘  └─────┘  └─────┘  └─────┘    │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ 🤝 Add Buddy │  │  💬 Message     │  │
│  └──────────────┘  └─────────────────┘  │
│                                          │
│  ── Travel Interests ──                  │
│  🏔️ Adventure  🍜 Foodie  📸 Photography │
│                                          │
│  ── Countries Visited ──                 │
│  🇯🇵🇹🇭🇮🇹🇫🇷🇧🇷🇨🇴🇲🇽🇵🇪🇬🇧🇩🇪              │
│                                          │
│  ── Recent Activity ──                   │
│  [Post preview cards from shared groups] │
│                                          │
│  ── Mutual Groups ──                     │
│  Japan 2025 Travelers · Digital Nomads   │
│                                          │
│  ── Upcoming Trips (opt-in) ──           │
│  🇯🇵 Tokyo · Mar 15-25, 2026            │
└─────────────────────────────────────────┘
```

**Privacy Controls:** Users toggle visibility of upcoming trips, countries visited, recent posts, and activity.

---

## 12. Data Model Overview (Supabase)

### Core Tables

**group_posts**
- id, group_id, author_id
- post_type (general/checkin/question/tip/buddy_request/photo_journal/safety_alert/hidden_gem/cost_report)
- content (text)
- location_name, location_lat, location_lng, location_verified (boolean)
- media_urls (text[]), media_types (text[])
- status (draft/pending/published/rejected/removed)
- approved_by, approved_at
- is_pinned, pin_order
- ai_moderation_score (float), ai_flags (text[])
- reactions_count (jsonb: {love, been_there, helpful, want_to_go, fire})
- comment_count, share_count
- expires_at (for safety alerts)
- created_at, updated_at

**post_comments**
- id, post_id, author_id
- parent_comment_id (null for top-level — one level of nesting)
- content
- like_count
- status (visible/removed/flagged)
- created_at

**post_reactions**
- id, post_id, user_id, reaction_type
- UNIQUE(post_id, user_id)

**comment_likes**
- id, comment_id, user_id
- UNIQUE(comment_id, user_id)

**buddy_connections**
- id, requester_id, recipient_id
- status (pending/accepted/declined/blocked)
- created_at, updated_at

**user_follows**
- id, follower_id, following_id
- created_at

**post_bookmarks**
- id, user_id, post_id, collection_id
- created_at

**bookmark_collections**
- id, user_id, name, is_shared
- created_at

**content_reports**
- id, reporter_id
- content_type (post/comment/user), content_id
- reason, description
- status (pending/reviewed/resolved/dismissed)
- reviewed_by, resolved_at

**post_media**
- id, post_id, media_url, media_type, thumbnail_url
- caption, order_index, width, height, file_size

**buddy_request_details** (structured data for buddy request posts)
- id, post_id
- destination, start_date, end_date
- group_size_min, group_size_max
- vibe_tags (text[]), budget_range, languages

**cost_report_items** (structured data for cost posts)
- id, post_id
- category (flights/hotel/food/transport/activities/shopping/other)
- amount, currency, order_index

**group_travel_dates** (for "Who's There When")
- id, group_id, user_id
- arrival_date, departure_date, is_visible
- created_at

**moderation_log**
- id, group_id, moderator_id
- action_type, target_type, target_id, reason
- created_at

**Existing table updates:**
- `group_members` → add: role (member/moderator/admin), auto_approve_posts, muted_until, post_count, comment_count
- `communities` → add: banner_image, posting_rule, slow_mode, auto_moderation_level, guidelines_text

### Storage Buckets
- `group-posts/` — Post images/videos
- `group-banners/` — Group banner images
- Limits: 50MB/post total, 10MB/image, 50MB/video (60s max)
- Auto-thumbnail generation (400px width)
- EXIF stripping for privacy

### RLS Policies
- Posts: Public groups = read by all, write by members. Private groups = read/write by members only
- Comments/Reactions: Same as parent post
- Bookmarks: Private to owner
- Buddy connections: Visible to involved users only
- Travel dates: Visible to group members if is_visible = true

---

## 13. Technical Considerations

### Real-Time
- Supabase Realtime for live comment/reaction updates on Post Detail screen
- New post notifications via Realtime subscription per group
- Main feed: pull-to-refresh + cursor pagination (not realtime — too expensive at scale)

### Performance
- 20 posts per page, cursor-based pagination
- Image lazy loading (thumbnails first, full-res on tap)
- Reaction/comment counts denormalized on post row
- Feed cached locally for offline browsing

### Image Pipeline
- Upload via Supabase Storage signed URLs
- Edge Function for thumbnail generation
- CDN with width transforms (`?width=400`)
- EXIF data stripped on upload

### AI Moderation
- Edge Function `moderate-content` that runs on post create
- Uses OpenAI moderation API or similar for text
- Image moderation via Google Cloud Vision or AWS Rekognition
- Returns score + flags, stored on the post
- Threshold-based auto-actions (approve/flag/block)

### Push Notifications
- New comment on your post
- Reply to your comment
- Buddy request received/accepted
- Post approved (private groups)
- Safety alert in your group
- Buddy trip overlap detected
- Someone interested in your buddy request

---

## 14. Implementation Priority

### Phase 1 — Core Feed (MVP)
1. Group Detail screen redesign (header, tabs, Feed default)
2. Basic post creation (text + photos + location tag)
3. Post feed with pagination
4. Post detail with comments (threaded)
5. Basic reactions (love + helpful)
6. Tap user → profile view (read-only)
7. Admin post approval queue (private groups)

### Phase 2 — Social Layer
8. Buddy system (request/accept/decline)
9. Follow system
10. DM from profile
11. All 5 reaction types
12. Post bookmarking
13. Contributor badges

### Phase 3 — Travel Intelligence
14. Verified check-ins (GPS proof)
15. Map view of posts
16. Buddy request post type (structured)
17. Cost report post type (structured)
18. Safety alert post type
19. "Who's There When" timeline
20. Hidden gem posts + collection

### Phase 4 — Moderation & Scale
21. AI auto-moderation pipeline
22. Full admin dashboard
23. Content reporting flow
24. Cross-group sharing
25. Bookmark collections
26. Push notification system

---

## 15. Open Questions for Discussion

1. **Buddy vs Follow default?** Should tapping "Add Buddy" send a mutual request, or should we default to Follow (one-way) with Buddy as a deeper step?

2. **Post editing?** Allow users to edit posts after publishing? If yes, show "edited" tag. If no, simpler but less forgiving.

3. **Anonymous posting?** Some travelers might want to ask sensitive questions (safety, scam warnings) without revealing identity. Support anonymous posts?

4. **Post expiry?** Should buddy requests and time-sensitive posts auto-expire? If so, after how long?

5. **Cross-posting?** Should the same post be publishable in multiple groups simultaneously?

6. **Monetization angle?** Promoted posts from guides? Featured listings in group feeds? Premium group features?

7. **Admin transfer?** What happens if a group creator goes inactive? Auto-transfer to most active moderator?

8. **Guest view depth?** How much of a private group's feed should non-members see? Just the header? First 3 posts blurred?

9. **Video posts?** Support short video clips (60s max) or defer to photos only for MVP?

10. **Offline support?** Cache how much of the feed for offline reading while traveling with limited connectivity?
