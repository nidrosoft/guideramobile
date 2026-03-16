# Guidera Group Feed & Social Layer — Deep Brainstorm

> **Status:** Brainstorm / Architecture Design  
> **Goal:** Transform groups from chat-based to a rich, Facebook-Group-meets-Instagram feed experience purpose-built for travelers  

---

## 1. Vision & Core Concept

The group is the **heart of the traveler social experience**. When a user taps into a group like "Japan 2025 Travelers," they should feel like they've walked into a vibrant travel community — not a chatroom.

**The shift:** Chat → Feed. The current Chat tab becomes a **Feed** — a scrollable, visual, engaging timeline of posts. Chat becomes **DM-only** (between individual users).

**The core loop:**
```
Browse Group → See Feed → Read Posts → Engage (like/comment)
                                           ↓
                              Tap Author → View Profile → Add Buddy / Message
                                           ↓
                              Create Post → Attach Photos + Location → Submit
                                           ↓
                              (Private Group) → Admin Approves → Post Goes Live
```

**Why this beats Facebook Groups for travelers:**
- Verified identities + trust badges (Facebook has none)
- Location-verified check-ins (prove you were actually there)
- Travel-specific post types (buddy requests, cost reports, safety alerts)
- Map view of all posts (crowdsourced live travel guide)
- Integrated traveler profiles with trip history

---

## 2. Screen Architecture

```
Groups Tab (list of groups)
  └─→ Group Detail Screen (redesigned)
        ├── Header: Banner, avatar, name, privacy badge, member count, Join/Share
        ├── Tabs: Feed | Members | Events | About
        │
        ├── [Feed Tab] ← DEFAULT landing tab
        │     ├── Compose Bar ("What's on your mind, traveler?")
        │     ├── Quick Post Types (Photo, Check-in, Question, Buddy Request)
        │     └── Post Feed (scrollable, paginated)
        │           └── Post Card → Post Detail Screen → Comments (threaded)
        │
        ├── [Members Tab] — Admins, Moderators, searchable member list
        ├── [Events Tab] — existing
        └── [About Tab] — Description, Rules, Hidden Gems collection

Traveler Profile (Public View) — tap any user avatar
  ├── Cover, avatar, name, country, verification badge
  ├── Stats: trips, countries, reviews, groups
  ├── Actions: Add Buddy | Message
  ├── Travel interests, countries visited
  ├── Recent posts, mutual groups, upcoming trips
  └── Reviews received

Create Post Screen (full-screen overlay)
  ├── Text input, post type selector
  ├── Photo/Video (max 5, max 50MB)
  ├── Tag Location (Google Places search)
  └── Submit → immediate (public) or admin queue (private)
```

---

## 3. Group Detail Screen — Redesigned Header

```
┌─────────────────────────────────────────┐
│  [← Back]        [Banner Image]   [Share]│
│  ┌────┐                                  │
│  │ AV │  Japan 2025 Travelers ✓         │
│  └────┘  🌐 Public · 12,400 members     │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │   ✓ Joined   │  │   Share Group   │  │
│  └──────────────┘  └─────────────────┘  │
│                                          │
│  Feed    Members    Events    About      │
│  ────                                    │
└─────────────────────────────────────────┘
```

**Join Button States:** "Join" (public) | "Request to Join" (private) | "Pending ⏳" | "Joined ✓"

---

## 4. The Feed System

### Post Types (Travel-Specific)

| Post Type | Icon | Description |
|-----------|------|-------------|
| **General** | 💬 | Standard text + photo post |
| **Check-in** | 📍 | "I'm at [Place]!" with GPS verification |
| **Question** | ❓ | Ask the group — can be marked "Answered" |
| **Travel Tip** | 💡 | Useful tip with category tag |
| **Buddy Request** | 🤝 | Find travel companion — structured: dates, destination, vibe, budget |
| **Photo Journal** | 📸 | Multi-photo story (up to 10) |
| **Safety Alert** | ⚠️ | Admin/verified-only, auto-pins, severity levels |
| **Hidden Gem** | 💎 | Off-the-beaten-path discovery |
| **Cost Report** | 💰 | Structured budget breakdown |

### Reactions (Travel-Meaningful)

| Reaction | Emoji | Meaning |
|----------|-------|---------|
| Love | ❤️ | Standard like |
| Been There | 🎒 | "I've been to this place too!" |
| Helpful | 💡 | This info is useful |
| Want to Go | 📌 | Adding to my list |
| Fire | 🔥 | Amazing content |

### Feed Sorting
- **Most Recent** (default) | **Most Popular** | **Admin Picks** (pinned)
- **Filter by type:** All | Tips | Questions | Check-ins | Buddy Requests | Photos

---

## 5. Post Detail & Comments

- **Threaded replies** (one level deep)
- **Author badge** on post author's comments
- **Guide badge** — verified guides show trust tier
- **Tap avatar/name** → Traveler Profile
- **Comment sorting:** Newest | Oldest | Most Liked
- **Notifications:** Author gets all comments, commenters get replies, @mentions notified

---

## 6. Create Post Flow

**Entry Points:**
1. Compose bar in Feed tab
2. FAB camera button for quick photo posts
3. Quick type chips: 📸 Photo | 📍 Check-in | ❓ Question | 🤝 Find Buddy

**Attachments:**
- Photos/Videos: max 5 photos or 1 video (60s), max 50MB total
- Location tag: Google Places autocomplete with GPS verification option
- Post type selector

**Submission:**
- Public group → Post appears immediately
- Private group → "Submitted for admin approval" → enters moderation queue

---

## 7. Social Connections — "Travel Buddy" System

### Terminology: **Buddies**
Not friends (Facebook), not followers (Instagram), not connections (LinkedIn). **Travel Buddies** — on-brand and clear.

| Type | Mechanic | Unlocks |
|------|----------|---------|
| **Follow** | One-way, no acceptance needed | See public posts, notifications |
| **Buddy** | Mutual request + accept | Follow perks + upcoming trips visibility, real-time proximity (opt-in), priority buddy matching, DM without group membership |

### Unique Buddy Features
- **Trip Overlap Detection** — "You and Mike will both be in Tokyo March 18-22!"
- **Real-Time Proximity** — Opt-in neighborhood-level location sharing when in same city
- **Shared Itinerary** — Share trip plans with buddies
- **Group Recommendations** — "Your buddy Sarah joined Japan 2025 Travelers"

---

## 8. Content Moderation — Three Layers

### Layer 1: AI Auto-Moderation (Instant)
Checks every post/comment for: spam, harmful content, scam patterns, PII exposure, NSFW images

| Decision | Action |
|----------|--------|
| ✅ Clean | Goes live (or to admin queue if private) |
| ⚠️ Borderline | Goes live but flagged for admin review |
| 🚫 Violation | Blocked, user notified with reason |
| 🔴 Severe | Blocked + user warned. 3 strikes = temp ban |

### Layer 2: Admin Moderation Queue
- Approve/decline pending posts (private groups)
- Review flagged content
- Pin/unpin, remove posts, mute/ban members
- **Auto-approve trusted members** after 5+ approved posts
- Slow mode option (limit post frequency)

### Layer 3: Platform-Level (Guidera Safety Team)
- Escalated reports, appeals, cross-group pattern detection
- Account-level actions (platform ban, verification revocation)

### Reporting: Tap ⋯ → Report → Select reason → Submit → Goes to admin + Guidera queue

---

## 9. Group Creation Flow — Enhanced

**Step 1: Identity & Visuals**
- Group name, description
- **Banner image** (required, 16:9 hero)
- **Group avatar** (required)
- Destination (city/country or "Global")

**Step 2: Configuration**
- Group type: Public | Private
- Join rule: Open | Verified Only | Approval Required
- Posting rule: Anyone | Requires Approval | Admin Only
- Slow mode: Off | 1/hour | 1/day

**Step 3: Safety & Guidelines**
- Pre-filled travel community guidelines template
- Age restriction toggle
- Auto-moderation level: Relaxed | Standard | Strict

**Step 4: Tags & Review**
- Tags for discoverability, preview card, submit

See Part 2 (`group-feed-brainstorm-pt2.md`) for differentiator features, data model, and technical considerations.
