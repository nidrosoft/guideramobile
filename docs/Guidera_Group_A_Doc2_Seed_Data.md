# Guidera - Group A Document 2: Seed Data Template

## Overview

This document provides comprehensive seed data for Guidera's Homepage Recommendation Engine. Use this data to populate your Supabase database after running the schema migrations from Document 1.

**Purpose:** Provide initial curated content for all homepage categories so users see quality content from day one.

---

## Data Population Order

Run seed data in this order (due to foreign key constraints):

1. `homepage_categories` - Define categories first
2. `curated_destinations` - Main destination content
3. `curated_experiences` - Experiences for each destination
4. `destination_categories` - Link destinations to categories
5. `seasonal_promotions` - Any active promotions

---

## Section 1: Homepage Categories Seed Data

These define the sections that appear on your homepage.

```sql
INSERT INTO homepage_categories (
    name, slug, title, subtitle, display_order, items_to_show,
    layout_type, card_size, show_view_all, icon_name,
    filter_rules, sort_rules, requires_location, requires_preferences,
    personalization_weight, is_active, show_for_new_users, min_items_to_display
) VALUES

-- 1. Deals Section
(
    'deals',
    'deals',
    'Hot Deals 🔥',
    'Limited-time offers just for you',
    1,
    10,
    'horizontal_scroll',
    'large',
    TRUE,
    'tag',
    '{"primary_category": ["deals"], "is_featured": true}',
    '{"field": "priority", "direction": "desc"}',
    FALSE,
    FALSE,
    0.3,
    TRUE,
    TRUE,
    3
),

-- 2. Popular Destinations
(
    'popular',
    'popular-destinations',
    'Popular Destinations',
    'Travelers'' top picks this season',
    2,
    12,
    'horizontal_scroll',
    'medium',
    TRUE,
    'trending-up',
    '{"primary_category": ["popular"], "seasons": ["current"]}',
    '{"field": "popularity_score", "direction": "desc"}',
    FALSE,
    FALSE,
    0.4,
    TRUE,
    TRUE,
    4
),

-- 3. Near You (Location-based)
(
    'near_you',
    'near-you',
    'Explore Near You',
    'Discover amazing places nearby',
    3,
    8,
    'horizontal_scroll',
    'medium',
    TRUE,
    'map-pin',
    '{"proximity_km": 1000, "exclude_visited": true}',
    '{"field": "distance", "direction": "asc"}',
    TRUE,
    FALSE,
    0.6,
    TRUE,
    FALSE,
    3
),

-- 4. Editor's Choice
(
    'editor_choice',
    'editors-choice',
    'Editor''s Choice ✨',
    'Handpicked by our travel experts',
    4,
    8,
    'featured_large',
    'large',
    TRUE,
    'award',
    '{"primary_category": ["editor_choice"], "editor_rating": {"min": 4.5}}',
    '{"field": "editor_rating", "direction": "desc"}',
    FALSE,
    FALSE,
    0.2,
    TRUE,
    TRUE,
    3
),

-- 5. Trending Now
(
    'trending',
    'trending',
    'Trending Now 📈',
    'What travelers are loving right now',
    5,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'flame',
    '{"is_trending": true}',
    '{"field": "popularity_score", "direction": "desc"}',
    FALSE,
    FALSE,
    0.3,
    TRUE,
    TRUE,
    4
),

-- 6. Budget Friendly
(
    'budget_friendly',
    'budget-friendly',
    'Budget Friendly 💰',
    'Amazing experiences that won''t break the bank',
    6,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'dollar-sign',
    '{"budget_level": {"min": 1, "max": 2}}',
    '{"field": "estimated_daily_budget_usd", "direction": "asc"}',
    FALSE,
    TRUE,
    0.7,
    TRUE,
    TRUE,
    4
),

-- 7. Luxury Escapes
(
    'luxury',
    'luxury-escapes',
    'Luxury Escapes 👑',
    'Indulge in extraordinary experiences',
    7,
    8,
    'horizontal_scroll',
    'large',
    TRUE,
    'gem',
    '{"budget_level": {"min": 4, "max": 5}, "primary_category": ["luxury"]}',
    '{"field": "editor_rating", "direction": "desc"}',
    FALSE,
    TRUE,
    0.7,
    TRUE,
    TRUE,
    3
),

-- 8. Family Friendly
(
    'family',
    'family-friendly',
    'Family Adventures 👨‍👩‍👧‍👦',
    'Perfect destinations for the whole family',
    8,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'users',
    '{"best_for": ["families"], "primary_category": ["family"]}',
    '{"field": "priority", "direction": "desc"}',
    FALSE,
    TRUE,
    0.8,
    TRUE,
    TRUE,
    3
),

-- 9. Local Experiences
(
    'local_experiences',
    'local-experiences',
    'Local Experiences 🎭',
    'Authentic activities curated by locals',
    9,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'compass',
    '{"primary_category": ["cultural", "local"]}',
    '{"field": "average_rating", "direction": "desc"}',
    TRUE,
    TRUE,
    0.6,
    TRUE,
    TRUE,
    4
),

-- 10. Adventure & Outdoors
(
    'adventure',
    'adventure',
    'Adventure Awaits 🏔️',
    'For the thrill seekers and explorers',
    10,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'mountain',
    '{"primary_category": ["adventure"], "travel_style": ["adventure", "explorer"]}',
    '{"field": "popularity_score", "direction": "desc"}',
    FALSE,
    TRUE,
    0.7,
    TRUE,
    TRUE,
    4
),

-- 11. Beach & Islands
(
    'beach',
    'beach-islands',
    'Beach & Islands 🏝️',
    'Sun, sand, and paradise found',
    11,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'sun',
    '{"primary_category": ["beach"]}',
    '{"field": "priority", "direction": "desc"}',
    FALSE,
    TRUE,
    0.5,
    TRUE,
    TRUE,
    4
),

-- 12. Romantic Getaways
(
    'romantic',
    'romantic-getaways',
    'Romantic Getaways 💕',
    'Perfect escapes for couples',
    12,
    8,
    'horizontal_scroll',
    'medium',
    TRUE,
    'heart',
    '{"best_for": ["couples"], "primary_category": ["romantic"]}',
    '{"field": "editor_rating", "direction": "desc"}',
    FALSE,
    TRUE,
    0.8,
    TRUE,
    TRUE,
    3
),

-- 13. Weekend Trips
(
    'weekend',
    'weekend-trips',
    'Weekend Escapes ✈️',
    'Quick getaways for busy travelers',
    13,
    10,
    'horizontal_scroll',
    'medium',
    TRUE,
    'calendar',
    '{"proximity_km": 500, "tags": ["weekend", "short-trip"]}',
    '{"field": "distance", "direction": "asc"}',
    TRUE,
    FALSE,
    0.5,
    TRUE,
    FALSE,
    3
),

-- 14. Hidden Gems
(
    'hidden_gems',
    'hidden-gems',
    'Hidden Gems 💎',
    'Off-the-beaten-path discoveries',
    14,
    8,
    'horizontal_scroll',
    'medium',
    TRUE,
    'sparkles',
    '{"primary_category": ["off_beaten_path"], "popularity_score": {"max": 50}}',
    '{"field": "editor_rating", "direction": "desc"}',
    FALSE,
    TRUE,
    0.4,
    TRUE,
    TRUE,
    3
),

-- 15. Food & Wine
(
    'food_wine',
    'food-wine',
    'Food & Wine 🍷',
    'Culinary journeys for food lovers',
    15,
    8,
    'horizontal_scroll',
    'medium',
    TRUE,
    'utensils',
    '{"primary_category": ["food_wine"], "travel_style": ["foodie"]}',
    '{"field": "priority", "direction": "desc"}',
    FALSE,
    TRUE,
    0.7,
    TRUE,
    TRUE,
    3
);
```

---

## Section 2: Curated Destinations Seed Data

### Europe Destinations

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 1. Paris, France
(
    'Paris - City of Lights',
    'paris-city-of-lights',
    'Experience the magic of Paris, where world-class art, iconic architecture, and exquisite cuisine come together. From the Eiffel Tower to charming Montmartre, every corner tells a story. Indulge in croissants at sidewalk cafes, explore the Louvre''s masterpieces, and stroll along the Seine at sunset.',
    'Romance, art, and culinary excellence in the world''s most iconic city',
    'Paris',
    'France',
    'FR',
    'Western Europe',
    'Europe',
    48.8566,
    2.3522,
    'Europe/Paris',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    ARRAY['https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800', 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800'],
    'popular',
    ARRAY['romantic', 'cultural', 'food_wine'],
    ARRAY['romantic', 'museums', 'architecture', 'food', 'fashion', 'art', 'europe'],
    4,
    ARRAY['cultural', 'foodie', 'romantic'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'fall'],
    95,
    890,
    4.8,
    TRUE,
    TRUE,
    450,
    180,
    200,
    'EUR',
    ARRAY['French', 'English'],
    4,
    'published'
),

-- 2. Barcelona, Spain
(
    'Barcelona - Mediterranean Marvel',
    'barcelona-mediterranean-marvel',
    'Discover Barcelona''s unique blend of stunning Gaudí architecture, beautiful beaches, and vibrant nightlife. Wander through the Gothic Quarter, marvel at La Sagrada Familia, and enjoy tapas in bustling markets. The city''s energy is infectious, its art scene unmatched.',
    'Where Gaudí''s genius meets Mediterranean beaches and legendary nightlife',
    'Barcelona',
    'Spain',
    'ES',
    'Southern Europe',
    'Europe',
    41.3851,
    2.1734,
    'Europe/Madrid',
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
    ARRAY['https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800'],
    'popular',
    ARRAY['beach', 'cultural', 'nightlife'],
    ARRAY['beach', 'architecture', 'nightlife', 'food', 'art', 'gaudi', 'europe'],
    3,
    ARRAY['cultural', 'social', 'foodie'],
    ARRAY['friends', 'couples', 'solo'],
    ARRAY['spring', 'summer', 'fall'],
    92,
    850,
    4.7,
    TRUE,
    TRUE,
    380,
    120,
    150,
    'EUR',
    ARRAY['Spanish', 'Catalan', 'English'],
    4,
    'published'
),

-- 3. Rome, Italy
(
    'Rome - Eternal City',
    'rome-eternal-city',
    'Walk through millennia of history in Rome, where ancient ruins stand alongside Renaissance masterpieces. Toss a coin in the Trevi Fountain, explore the Colosseum, and savor authentic pasta in Trastevere. Every street is a journey through time.',
    'Ancient history, Renaissance art, and the world''s best pasta await',
    'Rome',
    'Italy',
    'IT',
    'Southern Europe',
    'Europe',
    41.9028,
    12.4964,
    'Europe/Rome',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400',
    ARRAY['https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'],
    'popular',
    ARRAY['historical', 'cultural', 'food_wine'],
    ARRAY['history', 'ancient', 'food', 'art', 'architecture', 'vatican', 'europe'],
    3,
    ARRAY['cultural', 'foodie', 'explorer'],
    ARRAY['couples', 'solo', 'families'],
    ARRAY['spring', 'fall'],
    94,
    870,
    4.8,
    TRUE,
    TRUE,
    420,
    140,
    160,
    'EUR',
    ARRAY['Italian', 'English'],
    4,
    'published'
),

-- 4. Amsterdam, Netherlands
(
    'Amsterdam - Canal City Charm',
    'amsterdam-canal-city',
    'Cycle along picturesque canals, explore world-class museums like the Van Gogh Museum, and experience Amsterdam''s famously open culture. This compact city packs incredible art, history, and nightlife into charming neighborhoods.',
    'Canals, bikes, masterpieces, and an open-minded spirit',
    'Amsterdam',
    'Netherlands',
    'NL',
    'Western Europe',
    'Europe',
    52.3676,
    4.9041,
    'Europe/Amsterdam',
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400',
    ARRAY['https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800'],
    'popular',
    ARRAY['cultural', 'city_break'],
    ARRAY['canals', 'bikes', 'museums', 'art', 'nightlife', 'tulips', 'europe'],
    3,
    ARRAY['cultural', 'social', 'explorer'],
    ARRAY['solo', 'friends', 'couples'],
    ARRAY['spring', 'summer'],
    88,
    780,
    4.6,
    TRUE,
    FALSE,
    350,
    150,
    170,
    'EUR',
    ARRAY['Dutch', 'English'],
    4,
    'published'
),

-- 5. Prague, Czech Republic
(
    'Prague - Fairytale City',
    'prague-fairytale-city',
    'Step into a storybook in Prague, where Gothic spires pierce the sky and cobblestone streets wind through centuries of history. Incredible value meets incredible beauty in one of Europe''s most photogenic capitals.',
    'Gothic beauty and incredible value in Central Europe''s gem',
    'Prague',
    'Czech Republic',
    'CZ',
    'Central Europe',
    'Europe',
    50.0755,
    14.4378,
    'Europe/Prague',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200',
    'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400',
    ARRAY['https://images.unsplash.com/photo-1541849546-216549ae216d?w=800'],
    'budget_friendly',
    ARRAY['historical', 'romantic'],
    ARRAY['budget', 'architecture', 'beer', 'history', 'castle', 'europe'],
    2,
    ARRAY['cultural', 'budget', 'romantic'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'fall', 'winter'],
    85,
    720,
    4.5,
    FALSE,
    TRUE,
    280,
    70,
    80,
    'CZK',
    ARRAY['Czech', 'English'],
    5,
    'published'
),

-- 6. Santorini, Greece
(
    'Santorini - Island Paradise',
    'santorini-island-paradise',
    'Watch the world''s most famous sunset from whitewashed villages perched on volcanic cliffs. Santorini''s blue-domed churches, black sand beaches, and romantic atmosphere make it the ultimate Greek island escape.',
    'Iconic sunsets, whitewashed villages, and volcanic beauty',
    'Santorini',
    'Greece',
    'GR',
    'Southern Europe',
    'Europe',
    36.3932,
    25.4615,
    'Europe/Athens',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400',
    ARRAY['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800'],
    'romantic',
    ARRAY['beach', 'luxury'],
    ARRAY['romantic', 'sunset', 'honeymoon', 'beach', 'islands', 'photography', 'europe'],
    4,
    ARRAY['romantic', 'luxury', 'relaxer'],
    ARRAY['couples'],
    ARRAY['summer', 'spring', 'fall'],
    90,
    800,
    4.9,
    TRUE,
    TRUE,
    500,
    250,
    220,
    'EUR',
    ARRAY['Greek', 'English'],
    5,
    'published'
),

-- 7. Swiss Alps, Switzerland
(
    'Swiss Alps - Mountain Majesty',
    'swiss-alps-mountain-majesty',
    'Experience nature at its most magnificent in the Swiss Alps. Whether skiing pristine slopes, hiking flower-filled meadows, or riding scenic trains through dramatic landscapes, Switzerland delivers unforgettable mountain adventures.',
    'Breathtaking peaks, pristine nature, and world-class skiing',
    'Interlaken',
    'Switzerland',
    'CH',
    'Central Europe',
    'Europe',
    46.6863,
    7.8632,
    'Europe/Zurich',
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200',
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400',
    ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
    'adventure',
    ARRAY['luxury', 'nature'],
    ARRAY['mountains', 'skiing', 'hiking', 'nature', 'scenic', 'adventure', 'europe'],
    5,
    ARRAY['adventurer', 'luxury', 'explorer'],
    ARRAY['couples', 'families', 'solo'],
    ARRAY['winter', 'summer'],
    88,
    750,
    4.8,
    TRUE,
    FALSE,
    550,
    300,
    350,
    'CHF',
    ARRAY['German', 'French', 'Italian', 'English'],
    5,
    'published'
),

-- 8. London, UK
(
    'London - Royal Metropolis',
    'london-royal-metropolis',
    'From royal palaces to cutting-edge culture, London offers endless discoveries. Explore world-class museums (many free!), catch West End shows, and experience the perfect blend of tradition and innovation in one of the world''s great cities.',
    'History, culture, and innovation in the heart of Britain',
    'London',
    'United Kingdom',
    'GB',
    'Western Europe',
    'Europe',
    51.5074,
    -0.1278,
    'Europe/London',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    ARRAY['https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800'],
    'popular',
    ARRAY['cultural', 'city_break'],
    ARRAY['history', 'museums', 'theater', 'royal', 'shopping', 'food', 'europe'],
    4,
    ARRAY['cultural', 'explorer', 'social'],
    ARRAY['solo', 'friends', 'families', 'couples'],
    ARRAY['spring', 'summer', 'fall'],
    91,
    860,
    4.7,
    TRUE,
    FALSE,
    480,
    200,
    230,
    'GBP',
    ARRAY['English'],
    4,
    'published'
);
```

### Asia Destinations

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 9. Tokyo, Japan
(
    'Tokyo - Future Meets Tradition',
    'tokyo-future-meets-tradition',
    'Experience the electric energy of Tokyo, where neon-lit skyscrapers tower over ancient temples. From the famous Shibuya crossing to serene gardens, Tokyo offers an intoxicating mix of ultra-modern innovation and deep cultural traditions.',
    'Ancient temples, cutting-edge tech, and incredible food culture',
    'Tokyo',
    'Japan',
    'JP',
    'East Asia',
    'Asia',
    35.6762,
    139.6503,
    'Asia/Tokyo',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    ARRAY['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'],
    'popular',
    ARRAY['cultural', 'food_wine', 'city_break'],
    ARRAY['technology', 'food', 'temples', 'anime', 'shopping', 'culture', 'asia'],
    4,
    ARRAY['cultural', 'foodie', 'explorer'],
    ARRAY['solo', 'couples', 'friends'],
    ARRAY['spring', 'fall'],
    93,
    880,
    4.9,
    TRUE,
    TRUE,
    800,
    150,
    180,
    'JPY',
    ARRAY['Japanese', 'English'],
    5,
    'published'
),

-- 10. Bali, Indonesia
(
    'Bali - Island of Gods',
    'bali-island-of-gods',
    'Find your balance in Bali, where lush rice terraces, ancient temples, and world-class surf breaks create a spiritual paradise. Whether seeking wellness retreats, adventure, or simply stunning beaches, Bali delivers at incredible value.',
    'Spiritual retreats, stunning beaches, and incredible value',
    'Bali',
    'Indonesia',
    'ID',
    'Southeast Asia',
    'Asia',
    -8.3405,
    115.0920,
    'Asia/Makassar',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    ARRAY['https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800'],
    'popular',
    ARRAY['wellness', 'beach', 'budget_friendly'],
    ARRAY['temples', 'yoga', 'surf', 'rice-terraces', 'wellness', 'beach', 'asia'],
    2,
    ARRAY['relaxer', 'wellness', 'adventurer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'summer', 'fall'],
    91,
    870,
    4.7,
    TRUE,
    TRUE,
    700,
    60,
    70,
    'IDR',
    ARRAY['Indonesian', 'English'],
    4,
    'published'
),

-- 11. Bangkok, Thailand
(
    'Bangkok - City of Angels',
    'bangkok-city-of-angels',
    'Immerse yourself in Bangkok''s sensory overload: gleaming temples, sizzling street food, floating markets, and legendary nightlife. This vibrant capital offers incredible experiences at unbeatable prices.',
    'Temples, street food, and electrifying energy at budget prices',
    'Bangkok',
    'Thailand',
    'TH',
    'Southeast Asia',
    'Asia',
    13.7563,
    100.5018,
    'Asia/Bangkok',
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200',
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400',
    ARRAY['https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800'],
    'budget_friendly',
    ARRAY['cultural', 'food_wine', 'nightlife'],
    ARRAY['temples', 'street-food', 'markets', 'nightlife', 'budget', 'shopping', 'asia'],
    1,
    ARRAY['foodie', 'budget', 'social'],
    ARRAY['solo', 'friends', 'couples'],
    ARRAY['winter', 'spring'],
    87,
    820,
    4.5,
    FALSE,
    TRUE,
    650,
    40,
    50,
    'THB',
    ARRAY['Thai', 'English'],
    3,
    'published'
),

-- 12. Singapore
(
    'Singapore - Garden City',
    'singapore-garden-city',
    'Experience the future in Singapore, where vertical gardens climb supertrees, hawker centers serve Michelin-starred meals, and diverse cultures blend seamlessly. This ultra-modern city-state sets the standard for urban innovation.',
    'Futuristic gardens, world-class food, and Asian fusion culture',
    'Singapore',
    'Singapore',
    'SG',
    'Southeast Asia',
    'Asia',
    1.3521,
    103.8198,
    'Asia/Singapore',
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200',
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
    ARRAY['https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800'],
    'luxury',
    ARRAY['family', 'food_wine'],
    ARRAY['modern', 'gardens', 'food', 'shopping', 'clean', 'safe', 'asia'],
    4,
    ARRAY['luxury', 'foodie', 'family'],
    ARRAY['families', 'couples', 'solo'],
    ARRAY['spring', 'summer', 'fall', 'winter'],
    86,
    760,
    4.6,
    TRUE,
    FALSE,
    750,
    180,
    200,
    'SGD',
    ARRAY['English', 'Mandarin', 'Malay', 'Tamil'],
    5,
    'published'
),

-- 13. Vietnam
(
    'Vietnam - Timeless Beauty',
    'vietnam-timeless-beauty',
    'Journey through Vietnam''s incredible diversity: cruise Ha Long Bay''s limestone karsts, explore ancient Hoi An''s lantern-lit streets, and savor the world''s best pho. Rich history and natural beauty at backpacker-friendly prices.',
    'Ha Long Bay, ancient towns, and legendary cuisine',
    'Hanoi',
    'Vietnam',
    'VN',
    'Southeast Asia',
    'Asia',
    21.0285,
    105.8542,
    'Asia/Ho_Chi_Minh',
    'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=1200',
    'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=400',
    ARRAY['https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'],
    'budget_friendly',
    ARRAY['adventure', 'cultural'],
    ARRAY['history', 'food', 'nature', 'budget', 'backpacking', 'beaches', 'asia'],
    1,
    ARRAY['budget', 'adventurer', 'explorer'],
    ARRAY['solo', 'friends', 'couples'],
    ARRAY['spring', 'fall'],
    84,
    740,
    4.5,
    FALSE,
    TRUE,
    680,
    35,
    45,
    'VND',
    ARRAY['Vietnamese', 'English'],
    4,
    'published'
);
```

### Americas Destinations

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 14. New York City, USA
(
    'New York City - The Big Apple',
    'new-york-city-big-apple',
    'Experience the city that never sleeps: Broadway shows, world-class museums, iconic skylines, and neighborhoods with distinct personalities. From Central Park to Brooklyn, NYC delivers unmatched urban energy.',
    'Broadway, museums, and the world''s most iconic skyline',
    'New York',
    'United States',
    'US',
    'North America',
    'North America',
    40.7128,
    -74.0060,
    'America/New_York',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    ARRAY['https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800'],
    'popular',
    ARRAY['cultural', 'city_break', 'food_wine'],
    ARRAY['broadway', 'museums', 'shopping', 'food', 'architecture', 'nightlife', 'americas'],
    4,
    ARRAY['cultural', 'social', 'foodie'],
    ARRAY['solo', 'couples', 'friends'],
    ARRAY['spring', 'fall', 'winter'],
    94,
    920,
    4.8,
    TRUE,
    TRUE,
    300,
    250,
    280,
    'USD',
    ARRAY['English', 'Spanish'],
    4,
    'published'
),

-- 15. Cancun, Mexico
(
    'Cancun - Caribbean Paradise',
    'cancun-caribbean-paradise',
    'Sun-soaked beaches, ancient Mayan ruins, and vibrant nightlife make Cancun the ultimate beach escape. Explore cenotes, snorkel in crystal-clear waters, and experience Mexico''s warmth both in climate and culture.',
    'Pristine beaches, Mayan ruins, and all-inclusive luxury',
    'Cancun',
    'Mexico',
    'MX',
    'Central America',
    'North America',
    21.1619,
    -86.8515,
    'America/Cancun',
    'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200',
    'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=400',
    ARRAY['https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800'],
    'beach',
    ARRAY['family', 'adventure'],
    ARRAY['beach', 'all-inclusive', 'ruins', 'cenotes', 'snorkeling', 'nightlife', 'americas'],
    3,
    ARRAY['relaxer', 'family', 'social'],
    ARRAY['families', 'couples', 'friends'],
    ARRAY['winter', 'spring'],
    89,
    830,
    4.5,
    TRUE,
    TRUE,
    350,
    150,
    180,
    'MXN',
    ARRAY['Spanish', 'English'],
    3,
    'published'
),

-- 16. Costa Rica
(
    'Costa Rica - Pura Vida',
    'costa-rica-pura-vida',
    'Live the ''Pura Vida'' lifestyle in Costa Rica, where rainforests meet beaches and adventure is around every corner. Zip-line through cloud forests, spot wildlife, and surf world-class waves in this eco-paradise.',
    'Rainforests, wildlife, and adventure in eco-friendly paradise',
    'San José',
    'Costa Rica',
    'CR',
    'Central America',
    'North America',
    9.9281,
    -84.0907,
    'America/Costa_Rica',
    'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=1200',
    'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=400',
    ARRAY['https://images.unsplash.com/photo-1580902215262-9b941bc6eab3?w=800'],
    'adventure',
    ARRAY['nature', 'family'],
    ARRAY['rainforest', 'wildlife', 'surfing', 'eco', 'adventure', 'beaches', 'americas'],
    3,
    ARRAY['adventurer', 'eco', 'family'],
    ARRAY['families', 'couples', 'solo'],
    ARRAY['winter', 'spring'],
    86,
    770,
    4.7,
    TRUE,
    FALSE,
    400,
    100,
    130,
    'USD',
    ARRAY['Spanish', 'English'],
    4,
    'published'
),

-- 17. Peru - Machu Picchu
(
    'Peru - Land of the Incas',
    'peru-land-of-incas',
    'Walk in the footsteps of the Incas to Machu Picchu, one of the world''s most awe-inspiring archaeological sites. Peru offers incredible history, diverse landscapes from Amazon to Andes, and a culinary scene that rivals any in the world.',
    'Machu Picchu, Inca heritage, and world-class cuisine',
    'Cusco',
    'Peru',
    'PE',
    'South America',
    'South America',
    -13.5319,
    -71.9675,
    'America/Lima',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200',
    'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400',
    ARRAY['https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'],
    'adventure',
    ARRAY['historical', 'cultural'],
    ARRAY['machu-picchu', 'inca', 'history', 'hiking', 'food', 'adventure', 'americas'],
    2,
    ARRAY['adventurer', 'cultural', 'explorer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'fall', 'winter'],
    88,
    790,
    4.8,
    TRUE,
    TRUE,
    550,
    80,
    100,
    'PEN',
    ARRAY['Spanish', 'Quechua', 'English'],
    3,
    'published'
);
```

### Africa & Middle East Destinations

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 18. Dubai, UAE
(
    'Dubai - City of Superlatives',
    'dubai-city-of-superlatives',
    'Experience the impossible made possible in Dubai: the world''s tallest building, islands shaped like palm trees, and luxury beyond imagination. From traditional souks to futuristic architecture, Dubai constantly reinvents itself.',
    'Futuristic skylines, luxury shopping, and desert adventures',
    'Dubai',
    'United Arab Emirates',
    'AE',
    'Middle East',
    'Asia',
    25.2048,
    55.2708,
    'Asia/Dubai',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    ARRAY['https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800'],
    'luxury',
    ARRAY['city_break', 'family'],
    ARRAY['luxury', 'shopping', 'architecture', 'desert', 'modern', 'beach', 'middle-east'],
    5,
    ARRAY['luxury', 'family', 'social'],
    ARRAY['families', 'couples', 'friends'],
    ARRAY['winter', 'spring', 'fall'],
    90,
    840,
    4.6,
    TRUE,
    TRUE,
    650,
    200,
    250,
    'AED',
    ARRAY['Arabic', 'English'],
    5,
    'published'
),

-- 19. Cape Town, South Africa
(
    'Cape Town - Mother City',
    'cape-town-mother-city',
    'Where Table Mountain meets two oceans, Cape Town dazzles with natural beauty, world-class wine, and rich history. Safari adventures, stunning beaches, and vibrant culture make this African gem unforgettable.',
    'Table Mountain, wine country, and stunning coastal beauty',
    'Cape Town',
    'South Africa',
    'ZA',
    'Southern Africa',
    'Africa',
    -33.9249,
    18.4241,
    'Africa/Johannesburg',
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200',
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400',
    ARRAY['https://images.unsplash.com/photo-1576485375217-d6a95e34d043?w=800'],
    'adventure',
    ARRAY['nature', 'food_wine'],
    ARRAY['mountains', 'wine', 'beaches', 'safari', 'history', 'nature', 'africa'],
    3,
    ARRAY['adventurer', 'foodie', 'explorer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'summer', 'fall'],
    85,
    730,
    4.7,
    TRUE,
    FALSE,
    900,
    120,
    140,
    'ZAR',
    ARRAY['English', 'Afrikaans', 'Zulu'],
    3,
    'published'
),

-- 20. Morocco
(
    'Morocco - Gateway to Africa',
    'morocco-gateway-africa',
    'Lose yourself in Morocco''s sensory feast: labyrinthine medinas, aromatic spice markets, and the vast Sahara. From Marrakech''s bustling squares to the blue streets of Chefchaouen, Morocco enchants at every turn.',
    'Medinas, desert adventures, and exotic sensory overload',
    'Marrakech',
    'Morocco',
    'MA',
    'North Africa',
    'Africa',
    31.6295,
    -7.9811,
    'Africa/Casablanca',
    'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200',
    'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400',
    ARRAY['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800'],
    'cultural',
    ARRAY['adventure', 'budget_friendly'],
    ARRAY['medina', 'desert', 'markets', 'culture', 'food', 'history', 'africa'],
    2,
    ARRAY['cultural', 'adventurer', 'explorer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['spring', 'fall'],
    83,
    710,
    4.5,
    FALSE,
    TRUE,
    500,
    60,
    80,
    'MAD',
    ARRAY['Arabic', 'French', 'English'],
    3,
    'published'
);
```

### Oceania Destinations

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 21. Sydney, Australia
(
    'Sydney - Harbor City',
    'sydney-harbor-city',
    'Experience Australia''s iconic harbor city, where the Opera House and Harbour Bridge create one of the world''s most recognizable skylines. World-class beaches, vibrant culture, and outdoor lifestyle define this stunning metropolis.',
    'Iconic harbor, beautiful beaches, and outdoor lifestyle',
    'Sydney',
    'Australia',
    'AU',
    'Oceania',
    'Oceania',
    -33.8688,
    151.2093,
    'Australia/Sydney',
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200',
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400',
    ARRAY['https://images.unsplash.com/photo-1524820197278-540916411e20?w=800'],
    'popular',
    ARRAY['beach', 'city_break'],
    ARRAY['beach', 'opera-house', 'harbor', 'surfing', 'culture', 'food', 'oceania'],
    4,
    ARRAY['explorer', 'social', 'adventurer'],
    ARRAY['solo', 'couples', 'friends'],
    ARRAY['spring', 'summer', 'fall'],
    87,
    780,
    4.6,
    TRUE,
    FALSE,
    1100,
    180,
    200,
    'AUD',
    ARRAY['English'],
    5,
    'published'
),

-- 22. New Zealand
(
    'New Zealand - Middle Earth',
    'new-zealand-middle-earth',
    'From the fjords of Milford Sound to the geothermal wonders of Rotorua, New Zealand offers otherworldly landscapes at every turn. Adventure capital of the world, with bungee, skydiving, and hiking through Hobbit country.',
    'Dramatic landscapes, adventure sports, and Hobbit magic',
    'Queenstown',
    'New Zealand',
    'NZ',
    'Oceania',
    'Oceania',
    -45.0312,
    168.6626,
    'Pacific/Auckland',
    'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200',
    'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400',
    ARRAY['https://images.unsplash.com/photo-1469521669194-babb45599def?w=800'],
    'adventure',
    ARRAY['nature', 'off_beaten_path'],
    ARRAY['adventure', 'nature', 'hiking', 'bungee', 'hobbit', 'fjords', 'oceania'],
    4,
    ARRAY['adventurer', 'explorer', 'eco'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['summer', 'fall', 'spring'],
    89,
    810,
    4.9,
    TRUE,
    TRUE,
    1200,
    150,
    180,
    'NZD',
    ARRAY['English', 'Maori'],
    5,
    'published'
);
```

### Additional Destinations (Budget, Family, Off-Beat)

```sql
INSERT INTO curated_destinations (
    title, slug, description, short_description,
    city, country, country_code, region, continent, latitude, longitude, timezone,
    hero_image_url, thumbnail_url, gallery_urls,
    primary_category, secondary_categories, tags,
    budget_level, travel_style, best_for, seasons,
    priority, popularity_score, editor_rating, is_featured, is_trending,
    estimated_flight_price_usd, estimated_hotel_price_usd, estimated_daily_budget_usd,
    currency_code, language_spoken, safety_rating, status
) VALUES

-- 23. Portugal
(
    'Portugal - Hidden Europe',
    'portugal-hidden-europe',
    'Europe''s best-kept secret offers incredible value: stunning beaches, historic cities, world-class wine, and genuine hospitality. From Lisbon''s hills to Porto''s port cellars, Portugal punches far above its weight.',
    'Stunning value, historic charm, and incredible coastline',
    'Lisbon',
    'Portugal',
    'PT',
    'Western Europe',
    'Europe',
    38.7223,
    -9.1393,
    'Europe/Lisbon',
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200',
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400',
    ARRAY['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800'],
    'budget_friendly',
    ARRAY['beach', 'food_wine'],
    ARRAY['budget', 'wine', 'beaches', 'history', 'surfing', 'food', 'europe'],
    2,
    ARRAY['budget', 'foodie', 'explorer'],
    ARRAY['solo', 'couples', 'friends'],
    ARRAY['spring', 'summer', 'fall'],
    86,
    760,
    4.6,
    FALSE,
    TRUE,
    380,
    80,
    100,
    'EUR',
    ARRAY['Portuguese', 'English'],
    5,
    'published'
),

-- 24. Croatia
(
    'Croatia - Adriatic Gem',
    'croatia-adriatic-gem',
    'Sail the crystal-clear Adriatic, explore Game of Thrones'' King''s Landing in Dubrovnik, and island-hop through paradise. Croatia offers Mediterranean beauty at a fraction of Italian prices.',
    'Island hopping, medieval towns, and Mediterranean charm',
    'Dubrovnik',
    'Croatia',
    'HR',
    'Southern Europe',
    'Europe',
    42.6507,
    18.0944,
    'Europe/Zagreb',
    'https://images.unsplash.com/photo-1555990538-1c6e6279db63?w=1200',
    'https://images.unsplash.com/photo-1555990538-1c6e6279db63?w=400',
    ARRAY['https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800'],
    'beach',
    ARRAY['historical', 'adventure'],
    ARRAY['islands', 'sailing', 'medieval', 'beaches', 'game-of-thrones', 'europe'],
    3,
    ARRAY['explorer', 'adventurer', 'social'],
    ARRAY['couples', 'friends', 'solo'],
    ARRAY['summer', 'spring'],
    84,
    740,
    4.5,
    FALSE,
    TRUE,
    450,
    100,
    130,
    'EUR',
    ARRAY['Croatian', 'English'],
    5,
    'published'
),

-- 25. Iceland
(
    'Iceland - Land of Fire & Ice',
    'iceland-fire-and-ice',
    'Witness nature''s raw power in Iceland: erupting geysers, cascading waterfalls, northern lights, and volcanic landscapes. This otherworldly island offers adventures found nowhere else on Earth.',
    'Northern lights, volcanoes, and otherworldly landscapes',
    'Reykjavik',
    'Iceland',
    'IS',
    'Northern Europe',
    'Europe',
    64.1466,
    -21.9426,
    'Atlantic/Reykjavik',
    'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200',
    'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400',
    ARRAY['https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800'],
    'adventure',
    ARRAY['nature', 'off_beaten_path'],
    ARRAY['northern-lights', 'volcanoes', 'waterfalls', 'nature', 'adventure', 'europe'],
    4,
    ARRAY['adventurer', 'explorer', 'photographer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['winter', 'summer'],
    87,
    770,
    4.8,
    TRUE,
    TRUE,
    500,
    200,
    280,
    'ISK',
    ARRAY['Icelandic', 'English'],
    5,
    'published'
),

-- 26. Maldives
(
    'Maldives - Ultimate Luxury',
    'maldives-ultimate-luxury',
    'Wake up in overwater villas above crystal-clear lagoons in the world''s most exclusive beach destination. The Maldives defines tropical luxury with pristine beaches, incredible snorkeling, and unmatched privacy.',
    'Overwater villas, pristine beaches, and ultimate romance',
    'Malé',
    'Maldives',
    'MV',
    'South Asia',
    'Asia',
    3.2028,
    73.2207,
    'Indian/Maldives',
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200',
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400',
    ARRAY['https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800'],
    'luxury',
    ARRAY['beach', 'romantic'],
    ARRAY['luxury', 'honeymoon', 'overwater', 'diving', 'beach', 'romantic', 'asia'],
    5,
    ARRAY['luxury', 'romantic', 'relaxer'],
    ARRAY['couples'],
    ARRAY['winter', 'spring', 'fall'],
    92,
    850,
    4.9,
    TRUE,
    TRUE,
    1000,
    500,
    600,
    'USD',
    ARRAY['Dhivehi', 'English'],
    5,
    'published'
),

-- 27. Japan Alps
(
    'Japan Alps - Hidden Japan',
    'japan-alps-hidden',
    'Escape to Japan''s mountain heartland: snow monkeys bathing in hot springs, perfectly preserved Edo-era villages, and world-class powder skiing. The Japan Alps offer a side of Japan few tourists see.',
    'Snow monkeys, ancient villages, and incredible skiing',
    'Nagano',
    'Japan',
    'JP',
    'East Asia',
    'Asia',
    36.6513,
    138.1810,
    'Asia/Tokyo',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
    ARRAY['https://images.unsplash.com/photo-1522623349500-de37a56ea2a5?w=800'],
    'off_beaten_path',
    ARRAY['adventure', 'cultural'],
    ARRAY['skiing', 'onsen', 'snow-monkeys', 'traditional', 'mountains', 'hidden-gem', 'asia'],
    3,
    ARRAY['adventurer', 'cultural', 'explorer'],
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['winter', 'fall'],
    80,
    680,
    4.7,
    FALSE,
    FALSE,
    850,
    120,
    150,
    'JPY',
    ARRAY['Japanese', 'English'],
    5,
    'published'
),

-- 28. Orlando, USA
(
    'Orlando - Theme Park Capital',
    'orlando-theme-park-capital',
    'The ultimate family destination: Walt Disney World, Universal Studios, and endless attractions await. Beyond the parks, discover natural springs, space exploration at Kennedy Space Center, and year-round sunshine.',
    'Disney, Universal, and endless family fun',
    'Orlando',
    'United States',
    'US',
    'North America',
    'North America',
    28.5383,
    -81.3792,
    'America/New_York',
    'https://images.unsplash.com/photo-1575901694871-24c899e15e95?w=1200',
    'https://images.unsplash.com/photo-1575901694871-24c899e15e95?w=400',
    ARRAY['https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800'],
    'family',
    ARRAY['adventure'],
    ARRAY['disney', 'theme-parks', 'family', 'universal', 'kids', 'entertainment', 'americas'],
    3,
    ARRAY['family'],
    ARRAY['families'],
    ARRAY['spring', 'fall', 'winter'],
    88,
    800,
    4.4,
    TRUE,
    FALSE,
    250,
    150,
    250,
    'USD',
    ARRAY['English', 'Spanish'],
    4,
    'published'
);
```

---

## Section 3: Curated Experiences Seed Data

### Paris Experiences

```sql
-- First, get Paris destination ID (you'll need to replace with actual UUID after running destinations insert)
-- For implementation, use a subquery or variable

INSERT INTO curated_experiences (
    destination_id, title, slug, description, short_description,
    experience_type, category, subcategory,
    image_url, thumbnail_url,
    price_from, price_to, currency_code, price_type,
    duration_minutes, duration_text,
    best_for, tags,
    priority, is_featured, is_bestseller,
    external_provider, status
) VALUES

-- Paris Experiences (replace destination_id with actual UUID)
(
    (SELECT id FROM curated_destinations WHERE slug = 'paris-city-of-lights'),
    'Eiffel Tower Summit Access',
    'eiffel-tower-summit',
    'Skip the lines and ascend to the summit of the world''s most famous tower. Enjoy panoramic views of Paris from 276 meters high, with champagne toast included.',
    'Skip-the-line summit access with champagne',
    'ticket',
    'sightseeing',
    'landmark',
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
    'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=400',
    65.00,
    95.00,
    'EUR',
    'per_person',
    120,
    '2 hours',
    ARRAY['couples', 'solo', 'families'],
    ARRAY['landmark', 'views', 'iconic', 'must-do'],
    95,
    TRUE,
    TRUE,
    'GetYourGuide',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'paris-city-of-lights'),
    'Louvre Museum Guided Tour',
    'louvre-guided-tour',
    'Explore the world''s largest art museum with an expert guide. See the Mona Lisa, Venus de Milo, and other masterpieces without the crowds through our skip-the-line access.',
    'Expert-guided tour of world-famous masterpieces',
    'tour',
    'cultural',
    'museum',
    'https://images.unsplash.com/photo-1499426600726-ac36f0be7994?w=800',
    'https://images.unsplash.com/photo-1499426600726-ac36f0be7994?w=400',
    55.00,
    75.00,
    'EUR',
    'per_person',
    180,
    '3 hours',
    ARRAY['couples', 'solo', 'families'],
    ARRAY['art', 'museum', 'history', 'culture'],
    90,
    TRUE,
    TRUE,
    'GetYourGuide',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'paris-city-of-lights'),
    'French Cooking Class in Montmartre',
    'french-cooking-class',
    'Learn to cook classic French cuisine in a charming Montmartre kitchen. Master techniques for croissants, coq au vin, and more, then enjoy your creations with wine.',
    'Hands-on French cuisine in charming Montmartre',
    'class',
    'culinary',
    'cooking',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
    95.00,
    150.00,
    'EUR',
    'per_person',
    240,
    '4 hours',
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['cooking', 'food', 'wine', 'local'],
    85,
    TRUE,
    FALSE,
    'Airbnb Experiences',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'paris-city-of-lights'),
    'Seine River Dinner Cruise',
    'seine-dinner-cruise',
    'Glide past illuminated monuments while enjoying a gourmet French dinner. The most romantic way to see Paris, with live music and exceptional cuisine.',
    'Gourmet dinner cruising past illuminated landmarks',
    'activity',
    'romantic',
    'cruise',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    120.00,
    180.00,
    'EUR',
    'per_person',
    150,
    '2.5 hours',
    ARRAY['couples'],
    ARRAY['romantic', 'dinner', 'cruise', 'views'],
    88,
    TRUE,
    TRUE,
    'Viator',
    'published'
);
```

### Tokyo Experiences

```sql
INSERT INTO curated_experiences (
    destination_id, title, slug, description, short_description,
    experience_type, category, subcategory,
    image_url, thumbnail_url,
    price_from, price_to, currency_code, price_type,
    duration_minutes, duration_text,
    best_for, tags,
    priority, is_featured, is_bestseller,
    external_provider, status
) VALUES

(
    (SELECT id FROM curated_destinations WHERE slug = 'tokyo-future-meets-tradition'),
    'Tsukiji Market Food Tour',
    'tsukiji-food-tour',
    'Explore the outer market of the world''s most famous fish market with a local guide. Sample the freshest sushi, tamagoyaki, and unique Japanese street food.',
    'Taste the freshest sushi and local delicacies',
    'tour',
    'culinary',
    'food-tour',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    85.00,
    120.00,
    'USD',
    'per_person',
    180,
    '3 hours',
    ARRAY['solo', 'couples', 'friends'],
    ARRAY['food', 'sushi', 'market', 'local'],
    92,
    TRUE,
    TRUE,
    'GetYourGuide',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'tokyo-future-meets-tradition'),
    'Traditional Tea Ceremony Experience',
    'tea-ceremony-tokyo',
    'Participate in an authentic Japanese tea ceremony in a traditional tea house. Learn the art of matcha preparation and the philosophy behind this ancient practice.',
    'Authentic matcha ceremony in traditional setting',
    'class',
    'cultural',
    'traditional',
    'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=800',
    'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400',
    45.00,
    75.00,
    'USD',
    'per_person',
    90,
    '1.5 hours',
    ARRAY['couples', 'solo'],
    ARRAY['tea', 'traditional', 'culture', 'mindfulness'],
    88,
    TRUE,
    FALSE,
    'Airbnb Experiences',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'tokyo-future-meets-tradition'),
    'Robot Restaurant Show & Dinner',
    'robot-restaurant',
    'Experience Tokyo''s most outrageous entertainment: robots, lasers, dancers, and sensory overload in Shinjuku. A must-do Tokyo experience unlike anything else.',
    'Robots, lasers, and sensory overload in Shinjuku',
    'entertainment',
    'nightlife',
    'show',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    75.00,
    100.00,
    'USD',
    'per_person',
    120,
    '2 hours',
    ARRAY['friends', 'solo'],
    ARRAY['entertainment', 'robots', 'nightlife', 'unique'],
    85,
    TRUE,
    TRUE,
    'Direct',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'tokyo-future-meets-tradition'),
    'Mount Fuji Day Trip',
    'mount-fuji-day-trip',
    'Visit Japan''s iconic Mt. Fuji with stops at the 5th station, Oshino Hakkai village, and Lake Kawaguchi. Includes traditional lunch and hotel pickup.',
    'Iconic mountain views and traditional village visit',
    'tour',
    'sightseeing',
    'day-trip',
    'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800',
    'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400',
    95.00,
    140.00,
    'USD',
    'per_person',
    600,
    '10 hours',
    ARRAY['families', 'couples', 'solo'],
    ARRAY['mountain', 'nature', 'photography', 'iconic'],
    90,
    TRUE,
    TRUE,
    'Viator',
    'published'
);
```

### Bali Experiences

```sql
INSERT INTO curated_experiences (
    destination_id, title, slug, description, short_description,
    experience_type, category, subcategory,
    image_url, thumbnail_url,
    price_from, price_to, currency_code, price_type,
    duration_minutes, duration_text,
    best_for, tags,
    priority, is_featured, is_bestseller,
    external_provider, status
) VALUES

(
    (SELECT id FROM curated_destinations WHERE slug = 'bali-island-of-gods'),
    'Tegallalang Rice Terrace & Temple Tour',
    'ubud-rice-terrace-tour',
    'Explore Bali''s most iconic landscapes: the stunning Tegallalang rice terraces, sacred Tirta Empul temple for purification, and the artistic village of Ubud.',
    'Iconic terraces, sacred temples, and artistic Ubud',
    'tour',
    'sightseeing',
    'cultural',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400',
    45.00,
    65.00,
    'USD',
    'per_person',
    480,
    '8 hours',
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['rice-terraces', 'temples', 'culture', 'photography'],
    92,
    TRUE,
    TRUE,
    'GetYourGuide',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'bali-island-of-gods'),
    'Sunrise Trek to Mount Batur',
    'mount-batur-sunrise',
    'Trek an active volcano in the pre-dawn darkness to witness an unforgettable sunrise above the clouds. Includes breakfast cooked by volcanic steam!',
    'Volcanic sunrise trek with steam-cooked breakfast',
    'activity',
    'adventure',
    'hiking',
    'https://images.unsplash.com/photo-1604665515726-ea2e90d7e8a6?w=800',
    'https://images.unsplash.com/photo-1604665515726-ea2e90d7e8a6?w=400',
    55.00,
    85.00,
    'USD',
    'per_person',
    420,
    '7 hours',
    ARRAY['couples', 'solo', 'friends'],
    ARRAY['hiking', 'volcano', 'sunrise', 'adventure'],
    90,
    TRUE,
    TRUE,
    'GetYourGuide',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'bali-island-of-gods'),
    'Balinese Spa & Wellness Day',
    'bali-spa-day',
    'Indulge in traditional Balinese healing arts: massage, flower bath, body scrub, and relaxation in a serene jungle setting. Pure bliss.',
    'Traditional treatments in serene jungle setting',
    'wellness',
    'wellness_spa',
    'spa',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    65.00,
    120.00,
    'USD',
    'per_person',
    180,
    '3 hours',
    ARRAY['couples', 'solo'],
    ARRAY['spa', 'wellness', 'relaxation', 'massage'],
    88,
    TRUE,
    FALSE,
    'Direct',
    'published'
),
(
    (SELECT id FROM curated_destinations WHERE slug = 'bali-island-of-gods'),
    'Learn to Surf in Kuta',
    'bali-surf-lesson',
    'Catch your first waves on Bali''s famous beginner-friendly beaches. Patient instructors, all equipment included, and high success rate for first-timers.',
    'Beginner-friendly surf lessons on famous waves',
    'activity',
    'water_sports',
    'surfing',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400',
    35.00,
    55.00,
    'USD',
    'per_person',
    120,
    '2 hours',
    ARRAY['solo', 'friends', 'couples'],
    ARRAY['surfing', 'beach', 'beginner', 'active'],
    85,
    FALSE,
    TRUE,
    'Direct',
    'published'
);
```

---

## Section 4: Destination-Categories Mapping

Link destinations to multiple categories for flexible display:

```sql
-- This creates the many-to-many relationships between destinations and homepage categories
-- Run after both destinations and homepage_categories are inserted

INSERT INTO destination_categories (destination_id, category_id, priority_override, featured_in_category, is_active)

-- Paris appears in: popular, romantic, editor_choice, food_wine
SELECT 
    d.id,
    c.id,
    CASE c.slug
        WHEN 'popular-destinations' THEN 95
        WHEN 'romantic-getaways' THEN 92
        WHEN 'editors-choice' THEN 90
        WHEN 'food-wine' THEN 88
    END,
    CASE c.slug
        WHEN 'romantic-getaways' THEN TRUE
        ELSE FALSE
    END,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'paris-city-of-lights'
AND c.slug IN ('popular-destinations', 'romantic-getaways', 'editors-choice', 'food-wine')

UNION ALL

-- Tokyo appears in: popular, trending, editor_choice, food_wine
SELECT 
    d.id,
    c.id,
    CASE c.slug
        WHEN 'popular-destinations' THEN 93
        WHEN 'trending' THEN 91
        WHEN 'editors-choice' THEN 89
        WHEN 'food-wine' THEN 87
    END,
    CASE c.slug
        WHEN 'editors-choice' THEN TRUE
        ELSE FALSE
    END,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'tokyo-future-meets-tradition'
AND c.slug IN ('popular-destinations', 'trending', 'editors-choice', 'food-wine')

UNION ALL

-- Bali appears in: popular, budget_friendly, trending, beach
SELECT 
    d.id,
    c.id,
    CASE c.slug
        WHEN 'popular-destinations' THEN 91
        WHEN 'budget-friendly' THEN 92
        WHEN 'trending' THEN 88
        WHEN 'beach-islands' THEN 90
    END,
    CASE c.slug
        WHEN 'budget-friendly' THEN TRUE
        ELSE FALSE
    END,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'bali-island-of-gods'
AND c.slug IN ('popular-destinations', 'budget-friendly', 'trending', 'beach-islands')

UNION ALL

-- Prague appears in: budget_friendly, trending, hidden_gems
SELECT 
    d.id,
    c.id,
    CASE c.slug
        WHEN 'budget-friendly' THEN 90
        WHEN 'trending' THEN 85
        WHEN 'hidden-gems' THEN 88
    END,
    CASE c.slug
        WHEN 'budget-friendly' THEN TRUE
        ELSE FALSE
    END,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'prague-fairytale-city'
AND c.slug IN ('budget-friendly', 'trending', 'hidden-gems')

UNION ALL

-- Maldives appears in: luxury, romantic, beach
SELECT 
    d.id,
    c.id,
    CASE c.slug
        WHEN 'luxury-escapes' THEN 95
        WHEN 'romantic-getaways' THEN 94
        WHEN 'beach-islands' THEN 92
    END,
    CASE c.slug
        WHEN 'luxury-escapes' THEN TRUE
        WHEN 'romantic-getaways' THEN TRUE
        ELSE FALSE
    END,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'maldives-ultimate-luxury'
AND c.slug IN ('luxury-escapes', 'romantic-getaways', 'beach-islands')

UNION ALL

-- Orlando appears in: family
SELECT 
    d.id,
    c.id,
    95,
    TRUE,
    TRUE
FROM curated_destinations d
CROSS JOIN homepage_categories c
WHERE d.slug = 'orlando-theme-park-capital'
AND c.slug = 'family-friendly';
```

---

## Section 5: Seasonal Promotions Seed Data

```sql
INSERT INTO seasonal_promotions (
    name, slug, title, subtitle, description,
    start_date, end_date,
    banner_image_url, thumbnail_url, background_color, text_color,
    target_regions, destination_ids, promo_code, discount_percent,
    priority, show_on_homepage, show_in_categories, is_active
) VALUES

(
    'Summer Europe Sale',
    'summer-europe-2025',
    'Summer in Europe ☀️',
    'Up to 30% off European getaways',
    'Book your European summer adventure with exclusive discounts on flights and hotels.',
    '2025-05-01 00:00:00+00',
    '2025-08-31 23:59:59+00',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    '#1E40AF',
    '#FFFFFF',
    ARRAY['North America', 'Asia'],
    (SELECT ARRAY_AGG(id) FROM curated_destinations WHERE continent = 'Europe' LIMIT 10),
    'EURO30',
    30,
    95,
    TRUE,
    ARRAY['deals'],
    TRUE
),

(
    'Winter Tropical Escape',
    'winter-tropical-2025',
    'Escape Winter ❄️→🌴',
    'Warm destinations from $499',
    'Leave the cold behind with our tropical winter getaway deals.',
    '2025-11-01 00:00:00+00',
    '2026-02-28 23:59:59+00',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    '#0D9488',
    '#FFFFFF',
    ARRAY['North America', 'Europe'],
    (SELECT ARRAY_AGG(id) FROM curated_destinations WHERE primary_category = 'beach' LIMIT 8),
    'WARM499',
    NULL,
    90,
    TRUE,
    ARRAY['deals', 'beach-islands'],
    TRUE
);
```

---

## Implementation Instructions

### Step 1: Run Schema First
Execute all SQL from Document 1 (Database Schema) before running seed data.

### Step 2: Run Seed Data in Order
```
1. homepage_categories
2. curated_destinations
3. curated_experiences
4. destination_categories
5. seasonal_promotions
```

### Step 3: Verify Data
```sql
-- Check destination count
SELECT COUNT(*) FROM curated_destinations;
-- Expected: ~28

-- Check experiences count
SELECT COUNT(*) FROM curated_experiences;
-- Expected: ~12

-- Check categories
SELECT COUNT(*) FROM homepage_categories;
-- Expected: 15

-- Check mappings
SELECT COUNT(*) FROM destination_categories;
-- Expected: ~25+
```

### Step 4: Add More Data
Use the patterns above to add:
- More destinations per region (aim for 50-100 total)
- 3-5 experiences per destination
- Seasonal promotions for upcoming events

---

## Data Quality Guidelines

### Images
- Use high-quality Unsplash images (free commercial use)
- Hero images: 1200px width minimum
- Thumbnails: 400px width
- Consistent aspect ratios (16:9 for heroes, 4:3 for thumbnails)

### Descriptions
- Title: 5-10 words, engaging
- Short description: 1 sentence, hook-focused
- Full description: 2-3 sentences, informative

### Pricing
- Research actual average prices
- Update quarterly for accuracy
- Use USD as base currency

### Categories
- Each destination should appear in 2-4 categories
- Featured status sparingly (20% max)
- Trending rotated monthly

---

## Maintenance Schedule

| Task | Frequency |
|------|-----------|
| Update pricing estimates | Quarterly |
| Rotate trending destinations | Monthly |
| Add new destinations | Monthly |
| Review/update experiences | Quarterly |
| Seasonal promotions | Seasonal |
| Verify image links | Monthly |

---

**Document Version:** 1.0
**Last Updated:** 2025
**Status:** Ready for Implementation
**Total Destinations:** 28
**Total Experiences:** 12
**Total Categories:** 15
