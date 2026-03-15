# Meetup Feature — NomadList/NomadTable Research & Improvement Plan

## Research Findings

### What NomadTable Does (confirmed via research)
NomadTable is a mobile app that helps solo travelers and digital nomads meet each other over shared activities — primarily meals. Key product insights:

**Core Loop:**
1. Open app → see activities happening near you RIGHT NOW or soon
2. Browse by type (coffee, dinner, drinks, sightseeing, coworking)
3. See who's going (profile, photo, profession, interests)
4. Request to join → show up → meet people
5. After: message, stay connected, rate the experience

**Key UX Decisions:**
- **Immediacy is king** — activities are "happening today" or "right now", not next week
- **Small groups** — 4-8 people max, not big events. Intimate, not overwhelming
- **Low friction** — creating a meetup takes <60 seconds
- **Everyone opted in** — no cold approaching, everyone WANTS to meet
- **Profiles matter** — profession, interests, languages help people decide to join
- **No map-first** — NomadTable is list-first (activities feed), map is secondary
- **Verification builds trust** — verified profiles get more joins

**Types of "Tables" (Meetups):**
| Type | Example |
|------|---------|
| Casual meals | "Taco Tuesday in Roma Norte" |
| Industry meetups | "AI builders lunch" |
| Language exchange | "Spanish practice over coffee" |
| Welcome dinners | "New to Lisbon? Join us tonight" |
| Coworking breaks | "Lunch break at WeWork" |
| Outdoor | "Sunset hike at 5pm" |
| Nightlife | "Bar crawl tonight" |

### What NomadList's Meetup Feature Does
NomadList (by @levelsio) has meetups as their **#1 most-used feature** — more than chat or city data. 5,000+ attendees in the last 12 months with ~9 meetups per week globally. These are more structured city-level events, not instant meetups.

---

## Current State in Guidera

### What We Have (LiveMapScreen + CreateActivityScreen)

**LiveMapScreen:**
- ✅ Map with activity markers (emoji pins)
- ✅ Location permission flow
- ✅ Activity detail card on marker tap (title, location, timing, participants, creator)
- ✅ Join button → `activityService.joinActivity()`
- ✅ FAB to create activity
- ✅ Stats banner ("X Activities Nearby")
- ✅ Filter button (UI only, not wired)
- ✅ Recenter button

**CreateActivityScreen:**
- ✅ 11 activity types with emoji grid
- ✅ Title, description, location inputs
- ✅ Timing selector (Right Now / Today / Tomorrow)
- ✅ Max participants
- ✅ Creates via `activityService.createActivity()`

**Database (`community_activities` table):**
- ✅ Full schema: type, title, description, location, timing, participants, visibility, status, expires_at
- ✅ `activity_participants` table for joins
- ✅ `activity_invites` table
- ✅ Chat room auto-created per activity

---

## Gap Analysis — What's Missing vs NomadTable

### Critical Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | **No list view of activities** — only map view | Users can't browse what's happening without zooming around a map. NomadTable is LIST-FIRST. | 🔴 P0 |
| 2 | **No activity feed on community tab** | Activities are buried behind the map icon. Should be surfaced in Discover feed or its own tab. | 🔴 P0 |
| 3 | **Feature needs a name** | "Live Map" is generic. Need a branded name like "Meetups" or "Hangouts" or "Tables" | 🟠 P1 |
| 4 | **No "happening now" urgency** | NomadTable's core is immediacy — "join in 30 min". Our timing only has now/today/tomorrow, no specific time picker. | 🟠 P1 |
| 5 | **Location picker is a text input** | CreateActivity has `latitude: 0, longitude: 0`. No real map/places picker. Activities won't show on map correctly. | 🔴 P0 |
| 6 | **No attendee avatars** | Can't see WHO is going before joining. NomadTable shows faces + professions. | 🟠 P1 |
| 7 | **No activity chat** | Chat room is created in DB but no way to access it from the activity card. | 🟠 P1 |
| 8 | **No "interested" / "going" distinction** | Only "join" exists. NomadTable has request-to-join for curated groups. | 🟡 P2 |
| 9 | **No host rating/reviews** | After a meetup, no way to rate the experience or the host. | 🟡 P2 |
| 10 | **No recurring meetups** | Can't create "Every Tuesday at 5pm" recurring activities. | 🟡 P2 |
| 11 | **Filter not wired** | Filter button on map does nothing. Should filter by type (coffee, food, etc.) | 🟠 P1 |
| 12 | **No nearby travelers on map** | Map only shows activities, not travelers sharing their location. | 🟡 P2 |

### What We Do Better Than NomadTable
- ✅ **Map view** — NomadTable doesn't have a map at all, we do
- ✅ **Integrated into a travel app** — not a standalone app, tied to trip context
- ✅ **Group system** — activities can tie back to community groups
- ✅ **Buddy matching** — can combine "nearby travelers" with activity suggestions
- ✅ **Verification system** — Didit identity verification already built

---

## Recommended Name

Instead of "Live Map", rename this feature to something that captures the social meetup energy:

| Option | Vibe | My Pick |
|--------|------|---------|
| **Nearby** | Simple, clear | |
| **Hangouts** | Casual, Google-esque | |
| **Meetups** | Direct but generic | |
| **Around Me** | Location-first | ⭐ |
| **The Table** | NomadTable homage | |
| **Pulse** | Energy, real-time | ⭐ |

**Recommendation:** "**Pulse**" — it implies real-time, energy, what's happening right now. Or "**Around Me**" for clarity.

---

## Implementation Plan

### Phase 1: Core UX Fix (Make it usable)

**1a. Add a list view alongside the map**
- Bottom sheet / half-sheet that slides up over the map
- Shows a scrollable list of nearby activities
- Each card: emoji + title + location + time + X/Y going + host avatar
- Tap to expand, tap "Join" to join
- Toggle between map view and list view

**1b. Wire the location picker in CreateActivityScreen**
- Use Google Places autocomplete or map pin selector
- Store real lat/lng so markers appear correctly on map

**1c. Wire the filter on LiveMapScreen**
- Filter chips by activity type (coffee, food, drinks, etc.)
- Filter by timing (happening now, today, tomorrow)

### Phase 2: Social Layer (Make it compelling)

**2a. Show attendee avatars on activity cards**
- Query `activity_participants` with joined profiles
- Show up to 4 avatar circles + "+X more"

**2b. Add activity chat access**
- "Chat" button on activity detail card
- Opens the chat room that's already auto-created in DB

**2c. Surface activities in Discover feed**
- New section: "Happening Near You" in DiscoverFeed
- Shows top 3 activities with time urgency ("starts in 2h")

**2d. Add specific time picker**
- Beyond now/today/tomorrow, allow picking a specific date + time
- Show countdown on activity cards ("starts in 45 min")

### Phase 3: Trust & Quality (Make it safe)

**3a. Verification badge on hosts**
- Show "Verified Traveler" badge on activity creator
- Encourage verification before hosting

**3b. Post-meetup feedback**
- After activity expires, prompt participants to rate (1-5 stars)
- "How was the meetup?" → quick rating + optional note
- Builds host reputation over time

**3c. Safety features**
- Share your live location with a trusted contact during meetup
- Report button on activity + host profile
- Auto-expire activities (already implemented via `expires_at`)

### Phase 4: Growth Features (Make it sticky)

**4a. Recurring meetups**
- "Every Tuesday" type scheduling
- Auto-creates new activity each week

**4b. AI-suggested activities**
- Based on user interests + location + time of day
- "You're near a great coffee spot and 3 travelers are nearby — host a coffee?"

**4c. Push notifications for nearby activities**
- "A coffee meetup is starting in 30 min, 0.5km from you"
- Only for opted-in users

---

## Database: Already Sufficient

The `community_activities` table has everything needed:
- `type`, `title`, `description`, `location_name`, `latitude`, `longitude`
- `timing` (now/today/tomorrow/specific), `scheduled_for`, `duration_minutes`
- `max_participants`, `participant_count`, `visibility`, `status`
- `expires_at` (auto-cleanup)
- `created_by` (host profile)

The `activity_participants` table tracks joins. The `chat_rooms` table auto-creates a chat per activity. The `activity_invites` table supports invite-only activities.

**No new migrations needed for Phases 1-2.** Phase 3 would need a `activity_ratings` table.

---

## Summary

The feature already has a solid backend foundation. The main issue is **UX** — it's map-only, buried behind an icon, and missing the list-first browsing experience that makes NomadTable work. The fix is:

1. **List view** over the map (bottom sheet with activity feed)
2. **Real location picker** so activities actually appear on the map
3. **Attendee avatars** so you see who's going
4. **Surface in Discover feed** so people discover it without going to the map
5. **Rename it** to something with energy — "Pulse" or "Around Me"

The database and services are ready. This is a UI/UX transformation, not a backend rebuild.
