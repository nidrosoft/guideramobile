# Guidera - Group A Document 1: Database Schema

## Overview

This document defines the complete database schema for Guidera's Homepage Recommendation Engine. These tables power the curated content system, user personalization, and smart category displays.

**Database:** Supabase (PostgreSQL)
**Purpose:** Store curated destinations, experiences, user preferences, and interaction data for personalized homepage recommendations.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     GUIDERA DATABASE SCHEMA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │ curated_         │       │ curated_         │                │
│  │ destinations     │──────▶│ experiences      │                │
│  └────────┬─────────┘       └──────────────────┘                │
│           │                                                      │
│           │  ┌──────────────────┐                                │
│           │  │ destination_     │                                │
│           └─▶│ categories       │                                │
│              └──────────────────┘                                │
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │ user_            │       │ user_            │                │
│  │ preferences      │       │ interactions     │                │
│  └──────────────────┘       └──────────────────┘                │
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │ homepage_        │       │ seasonal_        │                │
│  │ categories       │       │ promotions       │                │
│  └──────────────────┘       └──────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table 1: curated_destinations

**Purpose:** Stores all destination data that appears on the homepage. This is your editorial content layer — destinations you curate and categorize manually.

### Schema Definition

```sql
CREATE TABLE curated_destinations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(300),
    
    -- Location Data
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL,
    region VARCHAR(100) NOT NULL,
    continent VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timezone VARCHAR(50),
    
    -- Media
    hero_image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Categorization
    primary_category VARCHAR(50) NOT NULL,
    secondary_categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Targeting & Filtering
    budget_level INTEGER NOT NULL CHECK (budget_level BETWEEN 1 AND 5),
    travel_style TEXT[] DEFAULT '{}',
    best_for TEXT[] DEFAULT '{}',
    seasons TEXT[] DEFAULT '{}',
    
    -- Ranking & Display
    priority INTEGER DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
    popularity_score INTEGER DEFAULT 0,
    editor_rating DECIMAL(2, 1) CHECK (editor_rating BETWEEN 0 AND 5),
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    
    -- Pricing Hints (for display before API call)
    estimated_flight_price_usd INTEGER,
    estimated_hotel_price_usd INTEGER,
    estimated_daily_budget_usd INTEGER,
    currency_code CHAR(3) DEFAULT 'USD',
    
    -- Metadata
    language_spoken TEXT[] DEFAULT '{}',
    visa_required_for TEXT[] DEFAULT '{}',
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    publish_start_date TIMESTAMP WITH TIME ZONE,
    publish_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for Performance
CREATE INDEX idx_destinations_primary_category ON curated_destinations(primary_category);
CREATE INDEX idx_destinations_country ON curated_destinations(country);
CREATE INDEX idx_destinations_continent ON curated_destinations(continent);
CREATE INDEX idx_destinations_region ON curated_destinations(region);
CREATE INDEX idx_destinations_budget ON curated_destinations(budget_level);
CREATE INDEX idx_destinations_status ON curated_destinations(status);
CREATE INDEX idx_destinations_featured ON curated_destinations(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_destinations_trending ON curated_destinations(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_destinations_priority ON curated_destinations(priority DESC);
CREATE INDEX idx_destinations_popularity ON curated_destinations(popularity_score DESC);
CREATE INDEX idx_destinations_location ON curated_destinations USING GIST (
    ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_destinations_tags ON curated_destinations USING GIN(tags);
CREATE INDEX idx_destinations_seasons ON curated_destinations USING GIN(seasons);
CREATE INDEX idx_destinations_travel_style ON curated_destinations USING GIN(travel_style);
CREATE INDEX idx_destinations_best_for ON curated_destinations USING GIN(best_for);

-- Full Text Search Index
CREATE INDEX idx_destinations_search ON curated_destinations USING GIN(
    to_tsvector('english', title || ' ' || description || ' ' || city || ' ' || country)
);
```

### Column Definitions

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Auto | Unique identifier |
| `title` | VARCHAR(200) | Yes | Display title (e.g., "Paris in Spring") |
| `slug` | VARCHAR(200) | Yes | URL-friendly identifier (e.g., "paris-spring-2025") |
| `description` | TEXT | Yes | Full description for detail pages |
| `short_description` | VARCHAR(300) | No | Brief description for cards |
| `city` | VARCHAR(100) | Yes | City name |
| `country` | VARCHAR(100) | Yes | Country name |
| `country_code` | CHAR(2) | Yes | ISO 3166-1 alpha-2 code (e.g., "FR") |
| `region` | VARCHAR(100) | Yes | Geographic region (e.g., "Western Europe") |
| `continent` | VARCHAR(50) | Yes | Continent name |
| `latitude` | DECIMAL | Yes | GPS latitude |
| `longitude` | DECIMAL | Yes | GPS longitude |
| `timezone` | VARCHAR(50) | No | IANA timezone (e.g., "Europe/Paris") |
| `hero_image_url` | TEXT | Yes | Main large image URL |
| `thumbnail_url` | TEXT | Yes | Card thumbnail URL |
| `gallery_urls` | TEXT[] | No | Array of additional images |
| `video_url` | TEXT | No | Optional video URL |
| `primary_category` | VARCHAR(50) | Yes | Main category for filtering |
| `secondary_categories` | TEXT[] | No | Additional categories |
| `tags` | TEXT[] | No | Searchable tags |
| `budget_level` | INTEGER | Yes | 1=Budget, 2=Economy, 3=Moderate, 4=Luxury, 5=Ultra-Luxury |
| `travel_style` | TEXT[] | No | e.g., ["adventure", "relaxation", "cultural"] |
| `best_for` | TEXT[] | No | e.g., ["solo", "couples", "families", "groups"] |
| `seasons` | TEXT[] | No | e.g., ["spring", "summer"] |
| `priority` | INTEGER | No | Display priority (1-100, higher = more prominent) |
| `popularity_score` | INTEGER | No | Calculated from user interactions |
| `editor_rating` | DECIMAL | No | Editorial rating 0-5 |
| `is_featured` | BOOLEAN | No | Show in featured section |
| `is_trending` | BOOLEAN | No | Show in trending section |
| `estimated_flight_price_usd` | INTEGER | No | Rough flight cost hint |
| `estimated_hotel_price_usd` | INTEGER | No | Rough nightly hotel cost hint |
| `estimated_daily_budget_usd` | INTEGER | No | Suggested daily budget |
| `currency_code` | CHAR(3) | No | Local currency |
| `language_spoken` | TEXT[] | No | Primary languages |
| `visa_required_for` | TEXT[] | No | Countries needing visa |
| `safety_rating` | INTEGER | No | Safety score 1-5 |
| `status` | VARCHAR(20) | No | draft/published/archived |
| `publish_start_date` | TIMESTAMP | No | When to start showing |
| `publish_end_date` | TIMESTAMP | No | When to stop showing |

### Primary Category Values

```sql
-- Valid values for primary_category
'deals'              -- Special offers and discounts
'popular'            -- Popular destinations
'trending'           -- Currently trending
'editor_choice'      -- Editor's picks
'budget_friendly'    -- Budget travel options
'luxury'             -- Luxury escapes
'adventure'          -- Adventure travel
'cultural'           -- Cultural experiences
'beach'              -- Beach destinations
'mountain'           -- Mountain destinations
'city_break'         -- City breaks
'romantic'           -- Romantic getaways
'family'             -- Family-friendly
'solo'               -- Solo travel friendly
'wellness'           -- Wellness & spa
'food_wine'          -- Food & wine focused
'nature'             -- Nature & wildlife
'historical'         -- Historical destinations
'nightlife'          -- Nightlife destinations
'off_beaten_path'    -- Hidden gems
```

---

## Table 2: curated_experiences

**Purpose:** Stores activities, tours, and experiences tied to destinations. These appear in "Local Experiences" and destination detail pages.

### Schema Definition

```sql
CREATE TABLE curated_experiences (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationship
    destination_id UUID NOT NULL REFERENCES curated_destinations(id) ON DELETE CASCADE,
    
    -- Basic Information
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(300),
    
    -- Experience Type
    experience_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    
    -- Location
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    meeting_point TEXT,
    
    -- Media
    image_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    gallery_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Pricing
    price_from DECIMAL(10, 2),
    price_to DECIMAL(10, 2),
    currency_code CHAR(3) DEFAULT 'USD',
    price_type VARCHAR(20) DEFAULT 'per_person',
    
    -- Duration & Schedule
    duration_minutes INTEGER,
    duration_text VARCHAR(50),
    available_days TEXT[] DEFAULT '{}',
    start_times TEXT[] DEFAULT '{}',
    advance_booking_days INTEGER DEFAULT 1,
    
    -- Capacity
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER,
    private_available BOOLEAN DEFAULT FALSE,
    
    -- Targeting
    difficulty_level VARCHAR(20),
    age_restriction VARCHAR(50),
    best_for TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Ranking
    priority INTEGER DEFAULT 50,
    popularity_score INTEGER DEFAULT 0,
    average_rating DECIMAL(2, 1),
    review_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    
    -- External Reference (for API booking)
    external_provider VARCHAR(50),
    external_id VARCHAR(100),
    booking_url TEXT,
    
    -- Included/Excluded
    whats_included TEXT[] DEFAULT '{}',
    whats_excluded TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(destination_id, slug)
);

-- Indexes
CREATE INDEX idx_experiences_destination ON curated_experiences(destination_id);
CREATE INDEX idx_experiences_type ON curated_experiences(experience_type);
CREATE INDEX idx_experiences_category ON curated_experiences(category);
CREATE INDEX idx_experiences_status ON curated_experiences(status);
CREATE INDEX idx_experiences_featured ON curated_experiences(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_experiences_bestseller ON curated_experiences(is_bestseller) WHERE is_bestseller = TRUE;
CREATE INDEX idx_experiences_price ON curated_experiences(price_from);
CREATE INDEX idx_experiences_rating ON curated_experiences(average_rating DESC);
CREATE INDEX idx_experiences_tags ON curated_experiences USING GIN(tags);
CREATE INDEX idx_experiences_best_for ON curated_experiences USING GIN(best_for);
```

### Experience Type Values

```sql
-- Valid values for experience_type
'tour'               -- Guided tours
'activity'           -- Activities & adventures
'class'              -- Classes & workshops
'food_drink'         -- Food & drink experiences
'ticket'             -- Attraction tickets
'transportation'     -- Transport experiences
'wellness'           -- Spa & wellness
'entertainment'      -- Shows & entertainment
'sports'             -- Sports activities
'nature'             -- Nature experiences
```

### Category Values

```sql
-- Valid values for category
'sightseeing'        -- City tours, landmarks
'adventure'          -- Outdoor adventures
'cultural'           -- Museums, heritage
'culinary'           -- Food tours, cooking classes
'nightlife'          -- Night tours, clubs
'water_sports'       -- Diving, surfing, etc.
'land_sports'        -- Hiking, cycling, etc.
'air_activities'     -- Paragliding, hot air balloon
'wellness_spa'       -- Spa, yoga, meditation
'photography'        -- Photo tours
'shopping'           -- Shopping tours
'religious'          -- Religious sites
'family'             -- Family activities
'romantic'           -- Couple experiences
'educational'        -- Learning experiences
```

---

## Table 3: homepage_categories

**Purpose:** Defines the category sections that appear on the homepage. Controls display order, naming, and filtering rules.

### Schema Definition

```sql
CREATE TABLE homepage_categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Display Information
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),
    description TEXT,
    
    -- Display Configuration
    display_order INTEGER NOT NULL,
    items_to_show INTEGER DEFAULT 10,
    layout_type VARCHAR(30) DEFAULT 'horizontal_scroll',
    card_size VARCHAR(20) DEFAULT 'medium',
    show_view_all BOOLEAN DEFAULT TRUE,
    
    -- Icon/Visual
    icon_name VARCHAR(50),
    background_color VARCHAR(7),
    accent_color VARCHAR(7),
    
    -- Filtering Rules (JSON for flexibility)
    filter_rules JSONB NOT NULL DEFAULT '{}',
    sort_rules JSONB DEFAULT '{"field": "priority", "direction": "desc"}',
    
    -- Personalization
    requires_location BOOLEAN DEFAULT FALSE,
    requires_preferences BOOLEAN DEFAULT FALSE,
    personalization_weight DECIMAL(3, 2) DEFAULT 0.5,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    show_for_new_users BOOLEAN DEFAULT TRUE,
    min_items_to_display INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_homepage_categories_order ON homepage_categories(display_order);
CREATE INDEX idx_homepage_categories_active ON homepage_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_homepage_categories_slug ON homepage_categories(slug);
```

### Filter Rules JSON Structure

```json
{
    "primary_category": ["deals"],
    "is_featured": true,
    "budget_level": {"min": 1, "max": 3},
    "seasons": ["current"],
    "proximity_km": 2000,
    "exclude_visited": true,
    "match_travel_style": true,
    "match_interests": true
}
```

### Layout Type Values

```sql
'horizontal_scroll'  -- Standard horizontal scrolling cards
'grid_2x2'          -- 2x2 grid layout
'grid_3x2'          -- 3x2 grid layout
'featured_large'    -- One large card + smaller cards
'carousel'          -- Full-width carousel
'list'              -- Vertical list
'map_view'          -- Map with pins
```

---

## Table 4: user_preferences

**Purpose:** Stores each user's travel preferences captured during onboarding and updated over time. Used for personalization.

### Schema Definition

```sql
CREATE TABLE user_preferences (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Travel Style (from onboarding)
    travel_style VARCHAR(50),
    travel_styles TEXT[] DEFAULT '{}',
    
    -- Interests
    interests TEXT[] DEFAULT '{}',
    favorite_activities TEXT[] DEFAULT '{}',
    
    -- Companions
    typical_companions VARCHAR(50),
    has_children BOOLEAN DEFAULT FALSE,
    children_ages INTEGER[] DEFAULT '{}',
    
    -- Budget
    budget_preference VARCHAR(20),
    budget_level INTEGER CHECK (budget_level BETWEEN 1 AND 5),
    preferred_currency CHAR(3) DEFAULT 'USD',
    
    -- Travel Frequency
    trips_per_year INTEGER,
    average_trip_duration INTEGER,
    preferred_trip_length VARCHAR(20),
    
    -- Accommodation
    accommodation_preference TEXT[] DEFAULT '{}',
    hotel_star_preference INTEGER,
    
    -- Food
    dietary_restrictions TEXT[] DEFAULT '{}',
    cuisine_preferences TEXT[] DEFAULT '{}',
    
    -- Accessibility
    accessibility_needs TEXT[] DEFAULT '{}',
    mobility_level VARCHAR(20),
    
    -- Location Preferences
    preferred_regions TEXT[] DEFAULT '{}',
    preferred_climates TEXT[] DEFAULT '{}',
    avoided_regions TEXT[] DEFAULT '{}',
    
    -- Experience Level
    passport_country CHAR(2),
    countries_visited INTEGER DEFAULT 0,
    experience_level VARCHAR(20) DEFAULT 'intermediate',
    
    -- Communication
    preferred_language CHAR(2) DEFAULT 'en',
    languages_spoken TEXT[] DEFAULT '{}',
    
    -- Home Location (for proximity calculations)
    home_city VARCHAR(100),
    home_country VARCHAR(100),
    home_country_code CHAR(2),
    home_latitude DECIMAL(10, 8),
    home_longitude DECIMAL(11, 8),
    home_timezone VARCHAR(50),
    
    -- Notification Preferences
    deal_alerts BOOLEAN DEFAULT TRUE,
    price_drop_alerts BOOLEAN DEFAULT TRUE,
    recommendation_frequency VARCHAR(20) DEFAULT 'weekly',
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    preferences_version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_travel_style ON user_preferences(travel_style);
CREATE INDEX idx_user_preferences_budget ON user_preferences(budget_level);
CREATE INDEX idx_user_preferences_home_country ON user_preferences(home_country_code);
CREATE INDEX idx_user_preferences_interests ON user_preferences USING GIN(interests);
CREATE INDEX idx_user_preferences_regions ON user_preferences USING GIN(preferred_regions);
```

### Travel Style Values

```sql
'adventurer'         -- Seeks thrills and adventures
'explorer'           -- Loves discovering new places
'relaxer'            -- Prefers relaxation and leisure
'cultural'           -- Deep cultural immersion
'foodie'             -- Food and culinary focused
'luxury'             -- Premium experiences
'budget'             -- Budget-conscious travel
'eco'                -- Sustainable travel
'social'             -- Social and group travel
'solo'               -- Independent solo travel
'photographer'       -- Photography focused
'wellness'           -- Health and wellness focused
'digital_nomad'      -- Remote work travel
'family'             -- Family-oriented travel
```

### Budget Preference Values

```sql
'backpacker'         -- Minimal budget
'budget'             -- Budget-conscious
'moderate'           -- Mid-range
'comfort'            -- Comfort-focused
'luxury'             -- Luxury travel
'ultra_luxury'       -- No budget limit
```

---

## Table 5: user_interactions

**Purpose:** Tracks every user interaction with destinations and experiences. Used for popularity scoring, personalization, and recommendations.

### Schema Definition

```sql
CREATE TABLE user_interactions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content Reference (one of these will be set)
    destination_id UUID REFERENCES curated_destinations(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES curated_experiences(id) ON DELETE CASCADE,
    category_slug VARCHAR(100),
    
    -- Interaction Type
    interaction_type VARCHAR(30) NOT NULL,
    
    -- Context
    source VARCHAR(50),
    source_category VARCHAR(50),
    search_query TEXT,
    
    -- Location Context
    user_latitude DECIMAL(10, 8),
    user_longitude DECIMAL(11, 8),
    user_country_code CHAR(2),
    
    -- Session Info
    session_id VARCHAR(100),
    device_type VARCHAR(20),
    app_version VARCHAR(20),
    
    -- Engagement Metrics
    view_duration_seconds INTEGER,
    scroll_depth_percent INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_content CHECK (
        destination_id IS NOT NULL OR 
        experience_id IS NOT NULL OR 
        category_slug IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_destination ON user_interactions(destination_id);
CREATE INDEX idx_interactions_experience ON user_interactions(experience_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);
CREATE INDEX idx_interactions_user_destination ON user_interactions(user_id, destination_id);
CREATE INDEX idx_interactions_user_type ON user_interactions(user_id, interaction_type);

-- Partitioning for scale (optional, implement when needed)
-- Consider partitioning by created_at (monthly) when data grows
```

### Interaction Type Values

```sql
'view'               -- Viewed destination/experience card
'detail_view'        -- Opened detail page
'save'               -- Saved to wishlist
'unsave'             -- Removed from wishlist
'share'              -- Shared content
'search'             -- Searched for destination
'filter'             -- Applied filters
'book_start'         -- Started booking flow
'book_complete'      -- Completed booking
'review'             -- Left a review
'photo_view'         -- Viewed photos
'video_view'         -- Watched video
'map_view'           -- Viewed on map
'directions'         -- Got directions
'call'               -- Called venue
'website'            -- Visited external website
'compare'            -- Added to comparison
'dismiss'            -- Dismissed recommendation
'not_interested'     -- Marked as not interested
```

### Source Values

```sql
'homepage'           -- From homepage
'search'             -- From search results
'category'           -- From category page
'recommendation'     -- From recommendations
'notification'       -- From notification
'deep_link'          -- From deep link
'share'              -- From shared link
'map'                -- From map view
'nearby'             -- From nearby section
'itinerary'          -- From itinerary
```

---

## Table 6: seasonal_promotions

**Purpose:** Time-limited promotions and deals that override normal content. Used for holiday specials, flash sales, etc.

### Schema Definition

```sql
CREATE TABLE seasonal_promotions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT,
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Display
    banner_image_url TEXT,
    thumbnail_url TEXT,
    background_color VARCHAR(7),
    text_color VARCHAR(7),
    
    -- Targeting
    target_regions TEXT[] DEFAULT '{}',
    target_countries TEXT[] DEFAULT '{}',
    target_user_segments TEXT[] DEFAULT '{}',
    
    -- Content
    destination_ids UUID[] DEFAULT '{}',
    experience_ids UUID[] DEFAULT '{}',
    promo_code VARCHAR(50),
    discount_percent INTEGER,
    discount_amount DECIMAL(10, 2),
    
    -- Display Rules
    priority INTEGER DEFAULT 50,
    show_on_homepage BOOLEAN DEFAULT TRUE,
    show_in_categories TEXT[] DEFAULT '{}',
    replace_category VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_promotions_dates ON seasonal_promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON seasonal_promotions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_promotions_priority ON seasonal_promotions(priority DESC);
CREATE INDEX idx_promotions_regions ON seasonal_promotions USING GIN(target_regions);
CREATE INDEX idx_promotions_countries ON seasonal_promotions USING GIN(target_countries);
```

---

## Table 7: destination_categories (Junction Table)

**Purpose:** Many-to-many relationship between destinations and categories. Allows a destination to appear in multiple homepage categories with different priorities.

### Schema Definition

```sql
CREATE TABLE destination_categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    destination_id UUID NOT NULL REFERENCES curated_destinations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES homepage_categories(id) ON DELETE CASCADE,
    
    -- Category-specific overrides
    priority_override INTEGER,
    custom_title VARCHAR(200),
    custom_description VARCHAR(300),
    custom_image_url TEXT,
    
    -- Targeting within category
    featured_in_category BOOLEAN DEFAULT FALSE,
    position_hint INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(destination_id, category_id)
);

-- Indexes
CREATE INDEX idx_dest_cat_destination ON destination_categories(destination_id);
CREATE INDEX idx_dest_cat_category ON destination_categories(category_id);
CREATE INDEX idx_dest_cat_active ON destination_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_dest_cat_featured ON destination_categories(featured_in_category) WHERE featured_in_category = TRUE;
```

---

## Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE curated_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_categories ENABLE ROW LEVEL SECURITY;
```

### Public Read Policies (Published Content)

```sql
-- Anyone can read published destinations
CREATE POLICY "Public can view published destinations"
ON curated_destinations FOR SELECT
USING (status = 'published' AND (publish_start_date IS NULL OR publish_start_date <= NOW()) AND (publish_end_date IS NULL OR publish_end_date >= NOW()));

-- Anyone can read published experiences
CREATE POLICY "Public can view published experiences"
ON curated_experiences FOR SELECT
USING (status = 'published');

-- Anyone can read active homepage categories
CREATE POLICY "Public can view active categories"
ON homepage_categories FOR SELECT
USING (is_active = TRUE);

-- Anyone can read active promotions within date range
CREATE POLICY "Public can view active promotions"
ON seasonal_promotions FOR SELECT
USING (is_active = TRUE AND start_date <= NOW() AND end_date >= NOW());

-- Anyone can read active destination-category mappings
CREATE POLICY "Public can view destination categories"
ON destination_categories FOR SELECT
USING (is_active = TRUE);
```

### User-Specific Policies

```sql
-- Users can only read their own preferences
CREATE POLICY "Users can view own preferences"
ON user_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions"
ON user_interactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interactions
CREATE POLICY "Users can insert own interactions"
ON user_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Admin Policies (Service Role)

```sql
-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access destinations"
ON curated_destinations FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access experiences"
ON curated_experiences FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access categories"
ON homepage_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access promotions"
ON seasonal_promotions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access dest_categories"
ON destination_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## Database Functions

### Function 1: Update Popularity Score

```sql
CREATE OR REPLACE FUNCTION update_destination_popularity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update popularity score based on interactions
    UPDATE curated_destinations
    SET popularity_score = (
        SELECT COUNT(*) * 
            CASE 
                WHEN interaction_type = 'book_complete' THEN 10
                WHEN interaction_type = 'book_start' THEN 5
                WHEN interaction_type = 'save' THEN 3
                WHEN interaction_type = 'detail_view' THEN 2
                WHEN interaction_type = 'view' THEN 1
                ELSE 1
            END
        FROM user_interactions
        WHERE destination_id = NEW.destination_id
        AND created_at > NOW() - INTERVAL '30 days'
    )
    WHERE id = NEW.destination_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_popularity
AFTER INSERT ON user_interactions
FOR EACH ROW
WHEN (NEW.destination_id IS NOT NULL)
EXECUTE FUNCTION update_destination_popularity();
```

### Function 2: Get Current Season

```sql
CREATE OR REPLACE FUNCTION get_current_season(lat DECIMAL)
RETURNS TEXT AS $$
DECLARE
    month INTEGER;
    is_northern BOOLEAN;
BEGIN
    month := EXTRACT(MONTH FROM NOW());
    is_northern := lat >= 0;
    
    IF is_northern THEN
        -- Northern hemisphere
        IF month IN (3, 4, 5) THEN RETURN 'spring';
        ELSIF month IN (6, 7, 8) THEN RETURN 'summer';
        ELSIF month IN (9, 10, 11) THEN RETURN 'fall';
        ELSE RETURN 'winter';
        END IF;
    ELSE
        -- Southern hemisphere (reversed)
        IF month IN (3, 4, 5) THEN RETURN 'fall';
        ELSIF month IN (6, 7, 8) THEN RETURN 'winter';
        ELSIF month IN (9, 10, 11) THEN RETURN 'spring';
        ELSE RETURN 'summer';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Function 3: Calculate Distance Between Coordinates

```sql
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    earth_radius CONSTANT DECIMAL := 6371; -- km
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    a := SIN(dlat/2) * SIN(dlat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dlon/2) * SIN(dlon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Function 4: Update Timestamps Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at_destinations
BEFORE UPDATE ON curated_destinations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_experiences
BEFORE UPDATE ON curated_experiences
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_categories
BEFORE UPDATE ON homepage_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_preferences
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_promotions
BEFORE UPDATE ON seasonal_promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Earthdistance Extension (For Proximity Queries)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Example proximity query
-- Find destinations within 500km of user's location
SELECT d.*,
    earth_distance(
        ll_to_earth(d.latitude, d.longitude),
        ll_to_earth(user_lat, user_lon)
    ) / 1000 AS distance_km
FROM curated_destinations d
WHERE earth_box(ll_to_earth(user_lat, user_lon), 500000) @> ll_to_earth(d.latitude, d.longitude)
AND status = 'published'
ORDER BY distance_km;
```

---

## Migration Order

Run these in order when setting up the database:

```sql
-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- 2. Create tables (in order due to foreign keys)
-- a. curated_destinations
-- b. curated_experiences
-- c. homepage_categories
-- d. user_preferences
-- e. user_interactions
-- f. seasonal_promotions
-- g. destination_categories

-- 3. Create indexes

-- 4. Enable RLS

-- 5. Create policies

-- 6. Create functions

-- 7. Create triggers
```

---

## Summary

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `curated_destinations` | Main destination content | Referenced by experiences, interactions, categories |
| `curated_experiences` | Activities per destination | Belongs to destination |
| `homepage_categories` | Homepage section definitions | Many-to-many with destinations |
| `user_preferences` | User travel preferences | One-to-one with auth.users |
| `user_interactions` | User activity tracking | Links users to content |
| `seasonal_promotions` | Time-limited deals | References destinations/experiences |
| `destination_categories` | Destination-category mapping | Junction table |

---

## Next Steps

After implementing this schema:
1. Run migration scripts in Supabase SQL Editor
2. Populate with seed data (see Document 2)
3. Implement data services (see Group B documents)
4. Build personalization algorithm (see Group C documents)

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation
