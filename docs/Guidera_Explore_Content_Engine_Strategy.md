# Guidera Explore Page: Content Engine & API Strategy

> **Purpose**: Define exactly which APIs feed each explore page section, how creator content is embedded, and the overall content pipeline architecture.
> **Date**: March 2026

---

## The Big Picture

You have two distinct content problems to solve:

**Problem 1 — Creator Content**: Embedding TikTok/Instagram/YouTube travel videos without hosting them yourself. This is the "Content Creator" section on destination detail pages.

**Problem 2 — Section Content**: Populating 12+ homepage sections (Popular Destinations, Trending, Budget Friendly, etc.) with real destination data — images, descriptions, reviews, pricing hints.

The recommended approach is a **hybrid model**: use APIs for structured data (photos, reviews, coordinates, pricing) and use an LLM cron job for editorial curation (descriptions, tagging, categorization). Neither alone gets you there.

---

## Part 1: Creator Content (TikTok / Instagram / YouTube)

### The Reality of Social Media APIs

None of these platforms offer a "give me a feed of travel videos about Bali" API. What they do offer is the ability to **embed individual videos** if you already have the URL. So the question becomes: how do you discover relevant URLs, and how do you display them?

### Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│              CREATOR CONTENT PIPELINE                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. DISCOVERY (find video URLs)                     │
│     ├── LLM Cron Job (weekly)                       │
│     │   └── Search "travel [destination]" on each   │
│     │       platform, extract top video URLs        │
│     ├── Manual Curation (admin panel)               │
│     │   └── Team/you adds standout URLs manually    │
│     └── Instagram Hashtag API (automated)           │
│         └── #visitbali, #tokyotravel, etc.          │
│                                                     │
│  2. STORAGE (Supabase)                              │
│     └── destination_creator_content table           │
│         ├── destination_id (FK)                     │
│         ├── platform (tiktok/instagram/youtube)     │
│         ├── video_url                               │
│         ├── embed_html (cached from oEmbed)         │
│         ├── creator_name                            │
│         ├── thumbnail_url                           │
│         └── display_order                           │
│                                                     │
│  3. EMBEDDING (render in app)                       │
│     ├── TikTok → WebView with oEmbed HTML           │
│     ├── Instagram → WebView with oEmbed HTML        │
│     └── YouTube → react-native-youtube-iframe       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Platform-by-Platform Breakdown

#### TikTok — oEmbed API (Free, No Auth Required)

This is the easiest of the three. TikTok's oEmbed endpoint is public, no API key needed.

**Endpoint:**
```
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/@user/video/123456
```

**Response gives you:**
- `html` — the full embed blockquote (render in WebView)
- `title`, `author_name`, `author_url`
- `thumbnail_url`, `thumbnail_width`, `thumbnail_height`

**In React Native:** Render the `html` field inside a `WebView` component. The TikTok player handles playback natively. No video hosting on your side.

**Discovery approach:** Use your LLM cron job to search TikTok for travel content by destination. Store the video URLs in Supabase. When displaying, call the oEmbed endpoint (cache the response for 24-48 hours).

#### Instagram — Meta oEmbed Read API (Free, Requires Facebook App)

As of April 2025, Meta retired the old oEmbed system. You now need:
1. A registered Facebook Developer account
2. A Facebook App with the "oEmbed Read" product enabled
3. An app access token (app_id|client_token format)
4. The app must be in **Live mode** and reviewed/approved

**Endpoint:**
```
GET https://graph.facebook.com/v21.0/instagram_oembed
  ?url=https://www.instagram.com/reel/ABC123/
  &access_token={APP_ID}|{CLIENT_TOKEN}
  &omitscript=true
```

**Response gives you:**
- `html` — embed blockquote for WebView
- `author_name`, `provider_name`
- `thumbnail_url`, `thumbnail_width`, `thumbnail_height`

**Important limitation:** Only works with **public** posts/reels. You cannot pull from private accounts.

**Discovery approach:** Instagram's Graph API has a Hashtag Search endpoint — you can search for top/recent media tagged with hashtags like `#visitparis` or `#tokyotravel`. This requires a Business/Creator Instagram account connected to your Facebook app. Rate limit: 30 unique hashtags per 7 days per account.

#### YouTube — Data API v3 + Iframe Embeds (Free Tier: 10,000 units/day)

YouTube is the most developer-friendly for this use case.

**Search for videos:**
```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=travel+bali+vlog
  &type=video
  &maxResults=10
  &key={API_KEY}
```

**Embed in app:** Use `react-native-youtube-iframe` — a well-maintained library that wraps the YouTube IFrame Player. No WebView hacking needed. Just pass the `videoId` and it plays natively.

**Free tier:** 10,000 units/day. A search query costs 100 units, so ~100 searches/day. More than enough for a cron job that runs weekly.

**This is the strongest option for automated discovery** because YouTube's Search API actually lets you find videos programmatically by topic, unlike TikTok and Instagram where discovery is limited.

### Recommended Creator Content Table

```sql
CREATE TABLE destination_creator_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES curated_destinations(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    video_url TEXT NOT NULL,
    video_id VARCHAR(100),          -- platform-specific ID
    embed_html TEXT,                 -- cached oEmbed HTML
    thumbnail_url TEXT,
    creator_name VARCHAR(200),
    creator_url TEXT,
    title TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_creator_content_destination ON destination_creator_content(destination_id);
CREATE INDEX idx_creator_content_platform ON destination_creator_content(platform);
```

### Implementation Priority for Creator Content

1. **YouTube first** — best API, easiest to automate discovery, native RN library
2. **TikTok second** — free oEmbed, but manual/LLM-assisted URL discovery
3. **Instagram last** — requires Facebook app review process, most setup friction

---

## Part 2: Explore Page Section Content

### The Core Question: API vs. LLM vs. Both?

Here's the honest assessment:

| Approach | Strengths | Weaknesses |
|----------|-----------|------------|
| **API only** (Google Places, etc.) | Real-time data, photos, reviews, ratings | No editorial voice, can't create "Editor's Choice" or "Hidden Gems" curation |
| **LLM only** (cron job) | Rich descriptions, smart categorization, editorial tone | No real photos, no real reviews, hallucination risk on specifics |
| **Hybrid** (API data + LLM curation) | Best of both — real data with editorial intelligence | More complex pipeline, but manageable |

**The hybrid approach is the answer.** Here's how it works:

### The Hybrid Content Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    CONTENT PIPELINE (runs weekly)                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: GOOGLE PLACES API (New)                                │
│  ─────────────────────────────                                  │
│  For each destination in curated_destinations:                   │
│  • Text Search → find the Place ID                              │
│  • Place Details → get reviews, rating, photos, hours, price    │
│  • Place Photos → download hero + gallery images                │
│  Store in: destination_api_data table                            │
│                                                                  │
│  STEP 2: LLM ENRICHMENT (Claude API)                            │
│  ────────────────────────────────────                            │
│  Feed the API data + destination metadata into Claude:           │
│  • Generate short_description (card-level, 1-2 sentences)       │
│  • Generate full description (detail page, 2-3 paragraphs)      │
│  • Assign tags: travel_style[], best_for[], seasons[]           │
│  • Determine budget_level (1-5)                                 │
│  • Write "Why Visit" editorial blurb                            │
│  • Categorize into sections (trending, hidden gem, etc.)        │
│  Store in: curated_destinations (update existing rows)           │
│                                                                  │
│  STEP 3: SECTION ASSIGNMENT                                     │
│  ─────────────────────────────                                  │
│  Based on tags + scores + LLM categorization:                   │
│  • Popular → high popularity_score                              │
│  • Trending → recent interaction spike                          │
│  • Editor's Choice → LLM-flagged as exceptional                 │
│  • Budget Friendly → budget_level 1-2                           │
│  • Luxury Escape → budget_level 4-5                             │
│  • Family Friendly → tags contains 'family'                     │
│  • Hidden Gems → low popularity + high editor_rating            │
│  • Seasonal → best time matches current month                   │
│  Store in: homepage_categories junction table                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Which API Feeds Which Section?

Here's the exact mapping of what data each section needs and where it comes from:

| Section | Data Source | What It Provides |
|---------|------------|-----------------|
| **Popular Destinations** | Google Places (rating, review count) + User Interactions (view/save counts) | Sort by combined popularity score. Photos from Google Places. |
| **Trending** | User Interactions table (time-windowed) | Destinations with the highest interaction spike in the last 7 days. No external API needed — this is internal behavioral data. |
| **Editor's Choice** | LLM Cron Job | Claude reviews all destinations and picks the top 10-15 with an editorial blurb. Fully LLM-driven. |
| **Must See** | Google Places (high ratings) + LLM (editorial judgment) | Filter for 4.5+ rating AND LLM-flagged as iconic. |
| **Budget Friendly** | Google Places (price_level field) + Kiwi.com (flight prices) | Destinations where estimated daily cost is low. Flight price hints from Kiwi API. |
| **Luxury Escapes** | Google Places (price_level) + Hotelbeds (luxury hotel availability) | High-end destinations with luxury hotel inventory. |
| **Family Friendly** | Google Places (reviews mentioning "family", "kids") + LLM tagging | LLM reads review summaries and tags family-appropriate destinations. |
| **Local Experiences** | GetYourGuide / Viator API | Pull top-rated experiences per destination. These APIs return experience cards with images, prices, and ratings. |
| **Events** | Predicthq API or Eventbrite API | Real events happening at destinations. |
| **Seasonal / Best Time** | LLM Cron Job + Weather API (Tomorrow.io) | LLM assigns best_months, weather API validates current conditions. |
| **Hidden Gems** | LLM Cron Job | Low Google review count + high LLM quality assessment = hidden gem. |
| **Best Discovered** | User Interactions (recently saved/booked by users with similar profiles) | Collaborative filtering from your personalization engine. Internal data only. |

### The Primary APIs You Need

#### 1. Google Places API (New) — THE foundation

**What it gives you per destination:**
- High-quality photos (hero images, gallery)
- User ratings and review count
- AI-generated review summaries (powered by Gemini)
- Price level (1-4 scale)
- Opening hours, contact info
- Place types and categories

**Cost:** $200/month free credit. Place Details costs $0.020-0.025 per call. For 500 destinations refreshed weekly, that's ~$10-12/week.

**This single API covers 60-70% of your card content needs** — photos, ratings, reviews, and price level. It's the backbone.

#### 2. Claude API — Editorial intelligence

**What it gives you:**
- Rich, unique descriptions (no two cards read the same)
- Smart categorization and tagging
- "Why Visit" editorial content
- Section assignment logic
- Safety/cultural insights for detail pages

**Cost:** At ~500 destinations processed weekly with ~1000 tokens per destination, roughly $5-10/week.

#### 3. Viator / GetYourGuide API — Experiences

**What it gives you:**
- Experience cards with images, titles, prices, ratings
- Bookable links (affiliate revenue)
- Category filtering (adventure, cultural, food, etc.)

**Use for:** "Local Experiences" section and the experiences tab on detail pages.

#### 4. YouTube Data API v3 — Creator content

As covered in Part 1, this is the best automated source for video content per destination.

#### 5. Tomorrow.io — Weather context

**What it gives you:**
- Current conditions and forecasts
- Seasonal weather patterns
- Severe weather alerts

**Use for:** "Best Time to Visit" indicators and the seasonal section logic.

### What About Unsplash/Pexels for Images?

You might be tempted to use stock photo APIs. Here's why Google Places is better for your use case: the photos are **of the actual place** (user-submitted), not generic stock photos of "a beach." Users can tell the difference. Google Places photos feel authentic.

However, for **fallback** when Google Places doesn't have great photos for a destination, Unsplash's API is a solid free option:
```
GET https://api.unsplash.com/search/photos?query=santorini+greece&per_page=5
```
Free tier: 50 requests/hour. More than enough for a weekly cron job.

---

## Part 3: Card Data Structure

Each card on the explore page should render from this unified structure:

```typescript
interface ExploreCard {
  // Core (from curated_destinations)
  id: string;
  title: string;
  slug: string;
  city: string;
  country: string;
  
  // Visual (from Google Places API, cached in Supabase Storage)
  heroImageUrl: string;
  galleryUrls: string[];
  
  // Metrics (from Google Places + internal)
  rating: number;           // Google Places rating (1-5)
  reviewCount: number;      // Google Places review count
  popularityScore: number;  // Internal (views + saves + bookings)
  
  // Pricing (from APIs)
  estimatedDailyBudgetUsd: number;
  budgetLevel: 1 | 2 | 3 | 4 | 5;
  priceLabel: string;       // "From $45/day" or "$$"
  
  // Editorial (from LLM)
  shortDescription: string; // 1-2 sentences for card
  tags: string[];
  travelStyle: string[];
  bestFor: string[];
  
  // Personalization (from scoring engine)
  matchScore: number;       // 0-100
  matchReasons: string[];   // ["Matches your adventure style", "Within budget"]
  
  // Section membership
  sections: string[];       // ["popular", "trending", "budget_friendly"]
}
```

---

## Part 4: Content Pipeline Cron Schedule

| Job | Frequency | What It Does |
|-----|-----------|-------------|
| **Destination Refresh** | Weekly (Sunday night) | Google Places API → update photos, ratings, reviews for all destinations |
| **LLM Enrichment** | Weekly (after Destination Refresh) | Claude processes updated data → regenerate descriptions, tags, section assignments |
| **Creator Content Discovery** | Weekly | YouTube API search + TikTok/IG URL collection → update creator content table |
| **Popularity Recalculation** | Nightly | Aggregate user_interactions → update popularity_score on curated_destinations |
| **Trending Calculation** | Every 6 hours | Time-windowed interaction spike detection → update is_trending flags |
| **Experience Refresh** | Weekly | Viator/GetYourGuide → update experience cards per destination |
| **Weather Update** | Daily | Tomorrow.io → update current conditions for seasonal relevance |

All cron jobs should be implemented as **Supabase Edge Functions** triggered by **pg_cron** or an external scheduler like Vercel Cron or GitHub Actions.

---

## Part 5: Events Section

For the Events section specifically, here are the best API options:

| Provider | Coverage | Pricing | Best For |
|----------|----------|---------|----------|
| **PredictHQ** | Global events (festivals, concerts, sports, conferences) | Free tier: 100 events/day | Automated event discovery per destination |
| **Eventbrite** | Global ticketed events | Free API | User-facing events with ticket links |
| **Ticketmaster Discovery** | Concerts, sports, shows | Free tier: 5,000 calls/day | Entertainment events |

**Recommendation:** PredictHQ for the broadest automated coverage, supplemented with Eventbrite for ticketed events. Both have generous free tiers.

---

## Part 6: Detail Page Data Sources

When a user taps a card and lands on the destination detail page, you need deeper content. Here's the source map:

| Detail Page Section | Data Source |
|--------------------|------------|
| Hero Image + Gallery | Google Places Photos (cached in Supabase Storage) |
| Description + Why Visit | LLM-generated (cached in curated_destinations) |
| Safety Information | Riskline API (or free gov feeds as fallback) |
| Creator Content (video feed) | destination_creator_content table (TikTok/IG/YT embeds) |
| Local Events | PredictHQ / Eventbrite API |
| Weather / Best Time | Tomorrow.io API |
| Reviews Summary | Google Places AI Review Summary |
| Experiences & Tours | Viator / GetYourGuide API |
| Nearby Restaurants/Attractions | Google Places Nearby Search |
| Visa Requirements | Travel Buddy AI API |
| Currency & Cost of Living | CurrencyLayer + LLM estimates |

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Set up Google Places API (New) integration
2. Build the weekly destination refresh cron job
3. Cache photos in Supabase Storage (don't hotlink Google URLs — they expire)
4. Populate card data from Google Places

### Phase 2: Intelligence (Week 3-4)
5. Build LLM enrichment pipeline (Claude API)
6. Generate descriptions, tags, and section assignments
7. Implement section generation logic in the homepage data service
8. Connect personalization scoring engine

### Phase 3: Creator Content (Week 5-6)
9. YouTube Data API integration + cron job
10. TikTok oEmbed integration
11. Instagram oEmbed Read setup (Facebook app registration)
12. Build the creator content swipeable feed component

### Phase 4: Experiences & Events (Week 7-8)
13. Viator/GetYourGuide API integration
14. PredictHQ/Eventbrite for events
15. Tomorrow.io for weather context
16. Wire everything to the detail page

---

## Cost Summary (Monthly, at ~500 destinations)

| Service | Monthly Cost |
|---------|-------------|
| Google Places API | $40-80 (within free credit) |
| Claude API (enrichment) | $20-40 |
| YouTube Data API | Free (within 10K units/day) |
| TikTok oEmbed | Free |
| Instagram oEmbed | Free (after app approval) |
| Viator/GetYourGuide | Free (affiliate model) |
| PredictHQ | Free tier |
| Tomorrow.io | Free tier |
| Unsplash (fallback images) | Free |
| **Total** | **$60-120/month** |

This is extremely lean for the amount of content it produces.

---

## Key Takeaway

You don't need to choose between APIs and an LLM — you need both, working together in a pipeline. APIs provide the **raw material** (photos, ratings, reviews, prices), and the LLM provides the **editorial intelligence** (descriptions, categorization, section curation). The cron job runs weekly, keeps everything fresh, and you never have to manually write card content.

For creator content, you're not going to get a "feed of travel videos" from any platform API. Instead, you build a discovery pipeline (YouTube Search API + manual curation) and store the URLs. The oEmbed APIs then handle rendering without you hosting a single video file.
