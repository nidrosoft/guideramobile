# 🏗️ DETAIL PAGE ARCHITECTURE - SCALABLE DESIGN V2

**Created**: November 1, 2025  
**Updated**: November 1, 2025 (Added Type-Specific Sections)  
**Purpose**: Blueprint for building complex, scalable, flexible detail pages  
**Target**: Support billions of users with maintainable, type-specific code

---

## 📋 TABLE OF CONTENTS

1. [Content Strategy](#content-strategy) ⭐ NEW
2. [Universal vs Type-Specific Sections](#universal-vs-type-specific-sections) ⭐ NEW
3. [Section Definitions by Type](#section-definitions-by-type) ⭐ NEW
4. [Overview](#overview)
5. [Architecture Principles](#architecture-principles)
6. [Component Hierarchy](#component-hierarchy)
7. [File Structure](#file-structure)
8. [Data Flow](#data-flow)
9. [Tab System](#tab-system)
10. [Section Components](#section-components)
11. [State Management](#state-management)
12. [Performance Optimization](#performance-optimization)
13. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 CONTENT STRATEGY

### **Philosophy: Universal Core + Type-Specific Extensions**

Every detail page shares a **common foundation** but extends with **type-specific sections** based on what users need.

### **Three-Tier Information Architecture**

```
TIER 1: ESSENTIAL (Always Present - Every Detail Page)
├── Visual Gallery (images/videos)
├── Basic Identity (name, location, category)
├── Social Proof (rating, reviews, visitors)
├── Description (what is it, why visit)
├── Practical Info (hours, price, accessibility)
└── Action Buttons (save, share, book/directions)

TIER 2: HIGHLY VALUABLE (Most Detail Pages)
├── User Reviews (with photos)
├── Tips & Insights (from locals/experts)
├── Safety & Accessibility
├── How to Get There (distance, transport)
├── Similar Places
└── Best Time to Visit

TIER 3: CONTEXT-SPECIFIC (Varies by Type)
├── For Destinations: Events, Cuisine, Language, Culture
├── For Restaurants: Menu, Reservations, Dietary Options
├── For Events: Schedule, Lineup, Tickets, Venue
├── For Activities: Duration, Difficulty, What's Included
└── For Accommodations: Rooms, Amenities, Policies
```

---

## 🔀 UNIVERSAL VS TYPE-SPECIFIC SECTIONS

### **✅ Universal Sections (All Detail Pages)**

These sections appear on EVERY detail page, regardless of type:

| Section | Purpose | Always Visible |
|---------|---------|----------------|
| **Image Gallery** | Visual showcase | ✅ Yes |
| **Header** | Navigation, save, share | ✅ Yes |
| **Title + Location** | Identity | ✅ Yes |
| **Quick Stats** | 4 key metrics | ✅ Yes |
| **Description** | What & why | ✅ Yes |
| **Practical Info** | Hours, price, contact | ✅ Yes |
| **Reviews** | User feedback | ✅ Yes |
| **Similar Items** | Recommendations | ✅ Yes |
| **Action Button** | Primary CTA | ✅ Yes |

---

### **🎨 Type-Specific Sections**

These sections appear ONLY for specific detail types:

#### **🏙️ DESTINATIONS (Cities, Landmarks, Regions)**

| Section | Purpose | Data Needed |
|---------|---------|-------------|
| **Local Events** | What's happening now | Events API |
| **Cuisine & Food** | Local dishes, restaurants | Restaurant data |
| **Language Tips** | Common phrases | Language DB |
| **Cultural Insights** | Customs, etiquette | Content DB |
| **Safety Info** | Travel advisories | Safety API |
| **Creator Content** | TikTok/Instagram posts | Social API |
| **Weather & Seasons** | Best time to visit | Weather API |
| **Neighborhoods** | Areas to explore | Location data |

---

#### **🍽️ RESTAURANTS**

| Section | Purpose | Data Needed |
|---------|---------|-------------|
| **Menu** | Dishes, prices | Menu API |
| **Reservations** | Book a table | Booking API |
| **Dietary Options** | Vegan, gluten-free, etc. | Menu filters |
| **Price Range** | Budget indicator | Pricing data |
| **Ambiance** | Vibe, dress code | Content DB |
| **Chef's Specials** | Signature dishes | Menu highlights |
| **Happy Hours** | Deals, promotions | Offers API |

---

#### **🎉 EVENTS (Concerts, Festivals, Shows)**

| Section | Purpose | Data Needed |
|---------|---------|-------------|
| **Schedule/Lineup** | When & who | Event API |
| **Tickets** | Pricing, availability | Ticketing API |
| **Venue Info** | Location, capacity | Venue data |
| **Parking & Transport** | How to get there | Maps API |
| **What to Bring** | Essentials | Event rules |
| **Age Restrictions** | Entry requirements | Event policy |
| **Refund Policy** | Cancellation terms | Terms API |

---

#### **⛰️ ACTIVITIES (Tours, Adventures, Experiences)**

| Section | Purpose | Data Needed |
|---------|---------|-------------|
| **Duration** | How long it takes | Activity data |
| **Difficulty Level** | Physical requirements | Rating system |
| **What's Included** | Equipment, meals, etc. | Package details |
| **Age Restrictions** | Min/max age | Policy data |
| **Group Size** | Max participants | Booking limits |
| **Cancellation Policy** | Refund terms | Terms API |
| **What to Wear/Bring** | Packing list | Requirements |

---

#### **🏨 ACCOMMODATIONS (Hotels, Hostels, Rentals)**

| Section | Purpose | Data Needed |
|---------|---------|-------------|
| **Rooms & Suites** | Room types, features | Room API |
| **Amenities** | Pool, gym, WiFi, etc. | Facilities data |
| **Check-in/out** | Times, policies | Policy data |
| **Cancellation** | Refund terms | Terms API |
| **House Rules** | Pets, smoking, etc. | Rules DB |
| **Nearby Attractions** | What's around | Location data |
| **Transportation** | Airport shuttle, etc. | Services data |

---

## 📊 SECTION DEFINITIONS BY TYPE

### **Configuration Structure**

```typescript
// config/detail-sections.config.ts

export const DETAIL_TYPE_CONFIGS = {
  destination: {
    // Universal sections (always present)
    universal: [
      'gallery', 'header', 'title', 'quickStats', 
      'description', 'practicalInfo', 'reviews', 
      'similar', 'actionButton'
    ],
    
    // Type-specific sections
    specific: [
      'localEvents', 'cuisine', 'languageTips', 
      'culturalInsights', 'safety', 'creatorContent',
      'weatherSeasons', 'neighborhoods'
    ],
    
    // Quick stats (4 metrics shown)
    quickStats: [
      { id: 'distance', icon: 'routing', label: 'Distance', color: 'purple' },
      { id: 'rating', icon: 'star', label: 'Rating', color: 'yellow' },
      { id: 'category', icon: 'category', label: 'Category', color: 'blue' },
      { id: 'visitors', icon: 'people', label: 'Visitors', color: 'green' }
    ],
    
    // Tab structure
    tabs: ['overview', 'details', 'reviews'],
    
    // Primary action
    primaryAction: 'Get Directions'
  },
  
  restaurant: {
    universal: [
      'gallery', 'header', 'title', 'quickStats',
      'description', 'practicalInfo', 'reviews',
      'similar', 'actionButton'
    ],
    
    specific: [
      'menu', 'reservations', 'dietaryOptions',
      'priceRange', 'ambiance', 'chefsSpecials', 'happyHours'
    ],
    
    quickStats: [
      { id: 'cuisine', icon: 'category', label: 'Cuisine', color: 'purple' },
      { id: 'rating', icon: 'star', label: 'Rating', color: 'yellow' },
      { id: 'priceRange', icon: 'dollar', label: 'Price', color: 'blue' },
      { id: 'distance', icon: 'routing', label: 'Distance', color: 'green' }
    ],
    
    tabs: ['overview', 'menu', 'reviews'],
    primaryAction: 'Reserve Table'
  },
  
  event: {
    universal: [
      'gallery', 'header', 'title', 'quickStats',
      'description', 'practicalInfo', 'reviews',
      'similar', 'actionButton'
    ],
    
    specific: [
      'schedule', 'tickets', 'venueInfo', 'parking',
      'whatToBring', 'ageRestrictions', 'refundPolicy'
    ],
    
    quickStats: [
      { id: 'date', icon: 'calendar', label: 'Date', color: 'purple' },
      { id: 'price', icon: 'ticket', label: 'From', color: 'yellow' },
      { id: 'venue', icon: 'location', label: 'Venue', color: 'blue' },
      { id: 'capacity', icon: 'people', label: 'Capacity', color: 'green' }
    ],
    
    tabs: ['overview', 'schedule', 'tickets'],
    primaryAction: 'Buy Tickets'
  },
  
  activity: {
    universal: [
      'gallery', 'header', 'title', 'quickStats',
      'description', 'practicalInfo', 'reviews',
      'similar', 'actionButton'
    ],
    
    specific: [
      'duration', 'difficulty', 'whatsIncluded',
      'ageRestrictions', 'groupSize', 'cancellation', 'whatToBring'
    ],
    
    quickStats: [
      { id: 'duration', icon: 'clock', label: 'Duration', color: 'purple' },
      { id: 'difficulty', icon: 'activity', label: 'Level', color: 'yellow' },
      { id: 'price', icon: 'dollar', label: 'Price', color: 'blue' },
      { id: 'groupSize', icon: 'people', label: 'Group', color: 'green' }
    ],
    
    tabs: ['overview', 'details', 'reviews'],
    primaryAction: 'Book Now'
  },
  
  accommodation: {
    universal: [
      'gallery', 'header', 'title', 'quickStats',
      'description', 'practicalInfo', 'reviews',
      'similar', 'actionButton'
    ],
    
    specific: [
      'rooms', 'amenities', 'checkInOut', 'cancellation',
      'houseRules', 'nearbyAttractions', 'transportation'
    ],
    
    quickStats: [
      { id: 'rating', icon: 'star', label: 'Rating', color: 'purple' },
      { id: 'pricePerNight', icon: 'dollar', label: 'Per Night', color: 'yellow' },
      { id: 'roomTypes', icon: 'home', label: 'Rooms', color: 'blue' },
      { id: 'distance', icon: 'routing', label: 'Distance', color: 'green' }
    ],
    
    tabs: ['overview', 'rooms', 'reviews'],
    primaryAction: 'Check Availability'
  }
};
```

---

### **Conditional Rendering Logic**

```typescript
// components/templates/DetailPageTemplate/DetailPageTemplate.tsx

export default function DetailPageTemplate({ type, id, data }) {
  const config = DETAIL_TYPE_CONFIGS[type];
  
  return (
    <ScrollView>
      {/* Universal sections - always render */}
      <ImageGallery images={data.images} />
      <DetailHeader title={data.name} />
      <TitleSection name={data.name} location={data.location} />
      <QuickStats stats={config.quickStats} data={data} />
      <Description text={data.description} />
      
      {/* Type-specific sections - conditional */}
      {config.specific.map(sectionId => {
        const SectionComponent = SECTION_COMPONENTS[sectionId];
        
        // Only render if data exists
        if (!data[sectionId]) return null;
        
        return (
          <Suspense key={sectionId} fallback={<LoadingSkeleton />}>
            <SectionComponent data={data[sectionId]} />
          </Suspense>
        );
      })}
      
      {/* Universal sections - always render */}
      <PracticalInfo data={data.practicalInfo} />
      <ReviewsSection reviews={data.reviews} />
      <SimilarItems type={type} currentId={id} />
      <ActionButton label={config.primaryAction} onPress={handleAction} />
    </ScrollView>
  );
}
```

---

## 🎯 OVERVIEW

### **The Challenge**

Detail pages will contain:
- **Header** with back, title, save, share buttons
- **Image Carousel** with multiple photos
- **Basic Info Section** (rating, location, hours, language, etc.)
- **Insight Buttons** (Safety, Content, Vibe)
- **Tabbed Sections** with nested content:
  - About Location
  - Places to Visit
  - Safety Information (with sub-tabs)
  - Creator Content (TikTok/Instagram feeds)
  - Vibe Around
  - Local Events
  - Cuisine & Food
  - Language Tips

**Estimated Complexity**: 2,000-3,000 lines per detail page if not modular

### **The Solution**

Use the same modular architecture we just implemented for the homepage:
- **Atomic Design System** (atoms → molecules → organisms → templates)
- **Dynamic Section Rendering** (like SectionRenderer)
- **Lazy Loading** for performance
- **Reusable Components** across all detail types

---

## 🏛️ ARCHITECTURE PRINCIPLES

### **1. Single Template, Multiple Types**

```
One DetailPageTemplate serves all 12 section types:
- Destination Details
- Event Details
- Place Details
- Experience Details
- etc.
```

**Why?** 
- 90% code reuse
- Consistent UX
- Single source of truth
- Easy to maintain

---

### **2. Configuration-Driven**

```typescript
// Each detail type has a configuration
const DETAIL_CONFIG = {
  destination: {
    sections: ['about', 'safety', 'events', 'cuisine', 'creator'],
    tabs: ['overview', 'details', 'reviews'],
    features: ['save', 'share', 'book']
  },
  event: {
    sections: ['about', 'lineup', 'tickets', 'venue'],
    tabs: ['overview', 'schedule', 'reviews'],
    features: ['save', 'share', 'buy']
  }
}
```

**Why?**
- Easy to customize per type
- No code duplication
- Type-safe configuration

---

### **3. Lazy Loading Everything**

```typescript
// Only load what's visible
const AboutSection = lazy(() => import('./sections/AboutSection'));
const SafetySection = lazy(() => import('./sections/SafetySection'));
```

**Why?**
- Faster initial load
- Better performance
- Reduced memory usage
- Scales to billions of users

---

### **4. Nested Tab System**

```
Main Tabs (Top Level)
├── Overview Tab
│   ├── Basic Info
│   ├── Highlights
│   └── Quick Actions
├── Details Tab
│   ├── About Section
│   ├── Safety Section (with sub-tabs)
│   │   ├── Safety Tips
│   │   ├── Emergency Info
│   │   └── Travel Advisories
│   └── Local Events Section
└── Reviews Tab
    ├── User Reviews
    ├── Ratings Breakdown
    └── Photos
```

**Why?**
- Organized content
- Reduces scroll fatigue
- Better UX
- Easy to navigate

---

## 🧩 COMPONENT HIERARCHY

### **Atomic Design System**

```
src/components/
├── atoms/                          # Smallest building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.styles.ts
│   ├── Icon/
│   ├── Text/
│   ├── Image/
│   ├── Badge/
│   ├── Chip/
│   └── Avatar/
│
├── molecules/                      # Simple combinations
│   ├── InfoCard/
│   │   ├── InfoCard.tsx
│   │   └── InfoCard.styles.ts
│   ├── RatingDisplay/
│   ├── ActionButton/
│   ├── TabButton/
│   ├── SocialMediaCard/
│   ├── ReviewCard/
│   └── EventCard/
│
├── organisms/                      # Complex components
│   ├── DetailHeader/
│   │   ├── DetailHeader.tsx       # Back, Title, Save, Share
│   │   └── DetailHeader.styles.ts
│   ├── ImageCarousel/
│   │   ├── ImageCarousel.tsx      # Swipeable images
│   │   └── ImageCarousel.styles.ts
│   ├── BasicInfoSection/
│   │   ├── BasicInfoSection.tsx   # Rating, location, hours
│   │   └── BasicInfoSection.styles.ts
│   ├── InsightButtons/
│   │   ├── InsightButtons.tsx     # Safety, Content, Vibe
│   │   └── InsightButtons.styles.ts
│   ├── TabBar/
│   │   ├── TabBar.tsx             # Main tab navigation
│   │   └── TabBar.styles.ts
│   ├── SafetySection/
│   │   ├── SafetySection.tsx
│   │   ├── SafetyTips.tsx         # Sub-component
│   │   ├── EmergencyInfo.tsx      # Sub-component
│   │   └── SafetySection.styles.ts
│   ├── CreatorFeed/
│   │   ├── CreatorFeed.tsx        # TikTok/Instagram
│   │   ├── VideoCard.tsx
│   │   └── CreatorFeed.styles.ts
│   ├── LocalEventsSection/
│   ├── CuisineSection/
│   └── LanguageTipsSection/
│
└── templates/                      # Page layouts
    └── DetailPageTemplate/
        ├── DetailPageTemplate.tsx  # Main template
        ├── DetailPageTemplate.styles.ts
        └── sections/               # Section components
            ├── AboutSection.tsx
            ├── SafetySection.tsx
            ├── EventsSection.tsx
            ├── CuisineSection.tsx
            └── CreatorSection.tsx
```

---

## 📁 FILE STRUCTURE

```
src/
├── app/
│   └── detail/
│       └── [type]/
│           └── [id].tsx            # Universal detail route
│
├── components/
│   ├── atoms/                      # 20-50 lines each
│   ├── molecules/                  # 50-100 lines each
│   ├── organisms/                  # 100-200 lines each
│   └── templates/
│       └── DetailPageTemplate/
│           ├── DetailPageTemplate.tsx      # 200-300 lines
│           ├── DetailPageTemplate.styles.ts
│           ├── sections/                   # 100-200 lines each
│           │   ├── AboutSection.tsx
│           │   ├── SafetySection.tsx
│           │   ├── EventsSection.tsx
│           │   ├── CuisineSection.tsx
│           │   ├── CreatorSection.tsx
│           │   └── LanguageTipsSection.tsx
│           └── tabs/                       # Tab content
│               ├── OverviewTab.tsx
│               ├── DetailsTab.tsx
│               └── ReviewsTab.tsx
│
├── config/
│   ├── sections.config.ts          # Homepage sections (existing)
│   ├── detail.config.ts            # Detail page configuration
│   └── tabs.config.ts              # Tab configuration
│
├── hooks/
│   ├── useDetailData.ts            # Fetch detail data
│   ├── useSocialFeed.ts            # Fetch social media
│   ├── useLocalEvents.ts           # Fetch local events
│   ├── useTabNavigation.ts         # Tab state management
│   └── useImageGallery.ts          # Image carousel logic
│
├── services/
│   ├── api/
│   │   ├── detail.service.ts       # Detail API calls
│   │   ├── social.service.ts       # TikTok/Instagram API
│   │   ├── events.service.ts       # Events API
│   │   └── reviews.service.ts      # Reviews API
│   └── cache/
│       └── cache.service.ts        # Caching strategy
│
├── stores/
│   ├── detail.store.ts             # Detail page state
│   ├── gallery.store.ts            # Image gallery state
│   ├── tabs.store.ts               # Tab navigation state
│   └── social.store.ts             # Social feed state
│
└── types/
    ├── detail.types.ts             # Detail page types
    ├── section.types.ts            # Section types
    ├── tab.types.ts                # Tab types
    └── api.types.ts                # API response types
```

---

## 🔄 DATA FLOW

### **1. Route → Template → Sections**

```
User clicks on item
    ↓
Navigate to /detail/[type]/[id]
    ↓
DetailPageTemplate loads
    ↓
Fetch data based on type & id
    ↓
Render sections based on config
    ↓
Lazy load sections as user scrolls/tabs
```

### **2. Data Fetching Strategy**

```typescript
// Priority-based loading
1. Critical Data (immediate):
   - Basic info (name, location, rating)
   - First image
   - Save/Share buttons

2. Important Data (< 1s):
   - Image carousel
   - Overview tab content
   - Insight buttons

3. Secondary Data (lazy):
   - Other tabs (load on demand)
   - Social feed (load when visible)
   - Reviews (paginated)
   - Related items
```

### **3. Caching Strategy**

```typescript
// React Query configuration
{
  staleTime: 5 minutes,      // Data fresh for 5 min
  cacheTime: 30 minutes,     // Keep in cache for 30 min
  refetchOnMount: false,     // Don't refetch if cached
  refetchOnWindowFocus: false
}

// Cache keys
detail-${type}-${id}           // Main detail data
social-${type}-${id}           // Social feed
events-${location}-${date}     // Local events
reviews-${id}-${page}          // Paginated reviews
```

---

## 📑 TAB SYSTEM

### **Main Tab Configuration**

```typescript
// config/tabs.config.ts
export const DETAIL_TABS_CONFIG = {
  destination: [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'Home',
      sections: ['basic-info', 'highlights', 'insights']
    },
    {
      id: 'details',
      label: 'Details',
      icon: 'InfoCircle',
      sections: ['about', 'safety', 'events', 'cuisine'],
      hasSubTabs: true
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: 'Star',
      sections: ['reviews-list', 'ratings-breakdown']
    }
  ],
  event: [
    {
      id: 'overview',
      label: 'Overview',
      sections: ['basic-info', 'highlights']
    },
    {
      id: 'schedule',
      label: 'Schedule',
      sections: ['lineup', 'timetable']
    },
    {
      id: 'tickets',
      label: 'Tickets',
      sections: ['ticket-types', 'pricing']
    }
  ]
};
```

### **Sub-Tab System (Nested)**

```typescript
// For complex sections like Safety
const SafetySection = () => {
  const [activeSubTab, setActiveSubTab] = useState('tips');
  
  return (
    <View>
      {/* Sub-tab navigation */}
      <SubTabBar
        tabs={['tips', 'emergency', 'advisories']}
        active={activeSubTab}
        onChange={setActiveSubTab}
      />
      
      {/* Sub-tab content */}
      {activeSubTab === 'tips' && <SafetyTips />}
      {activeSubTab === 'emergency' && <EmergencyInfo />}
      {activeSubTab === 'advisories' && <TravelAdvisories />}
    </View>
  );
};
```

---

## 🧱 SECTION COMPONENTS

### **Section Structure**

Each section follows this pattern:

```typescript
// components/templates/DetailPageTemplate/sections/AboutSection.tsx
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { DetailService } from '@/services/api/detail.service';

interface AboutSectionProps {
  type: string;
  id: string;
}

export default function AboutSection({ type, id }: AboutSectionProps) {
  // Fetch data with React Query
  const { data, isLoading } = useQuery({
    queryKey: ['about', type, id],
    queryFn: () => DetailService.getAboutInfo(type, id),
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.description}>{data.description}</Text>
      {/* More content */}
    </View>
  );
}
```

### **Section Registry**

```typescript
// config/detail.config.ts
import { lazy } from 'react';

export const DETAIL_SECTIONS = {
  about: lazy(() => import('@/components/templates/DetailPageTemplate/sections/AboutSection')),
  safety: lazy(() => import('@/components/templates/DetailPageTemplate/sections/SafetySection')),
  events: lazy(() => import('@/components/templates/DetailPageTemplate/sections/EventsSection')),
  cuisine: lazy(() => import('@/components/templates/DetailPageTemplate/sections/CuisineSection')),
  creator: lazy(() => import('@/components/templates/DetailPageTemplate/sections/CreatorSection')),
  language: lazy(() => import('@/components/templates/DetailPageTemplate/sections/LanguageTipsSection')),
};

// Section configuration per detail type
export const SECTION_CONFIG = {
  destination: {
    overview: ['basic-info', 'highlights', 'insights'],
    details: ['about', 'safety', 'events', 'cuisine', 'language'],
    reviews: ['reviews-list', 'ratings']
  },
  event: {
    overview: ['basic-info', 'highlights'],
    details: ['about', 'lineup', 'venue'],
    tickets: ['ticket-types', 'pricing']
  },
  // ... other types
};
```

---

## 💾 STATE MANAGEMENT

### **Zustand Stores**

```typescript
// stores/detail.store.ts
import create from 'zustand';

interface DetailStore {
  // Current detail
  currentDetail: any;
  setCurrentDetail: (detail: any) => void;
  
  // Active tab
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Saved items
  savedItems: string[];
  toggleSave: (id: string) => void;
  
  // Gallery
  galleryIndex: number;
  setGalleryIndex: (index: number) => void;
  isGalleryOpen: boolean;
  openGallery: () => void;
  closeGallery: () => void;
}

export const useDetailStore = create<DetailStore>((set) => ({
  currentDetail: null,
  setCurrentDetail: (detail) => set({ currentDetail: detail }),
  
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  savedItems: [],
  toggleSave: (id) => set((state) => ({
    savedItems: state.savedItems.includes(id)
      ? state.savedItems.filter(i => i !== id)
      : [...state.savedItems, id]
  })),
  
  galleryIndex: 0,
  setGalleryIndex: (index) => set({ galleryIndex: index }),
  
  isGalleryOpen: false,
  openGallery: () => set({ isGalleryOpen: true }),
  closeGallery: () => set({ isGalleryOpen: false }),
}));
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### **1. Code Splitting**

```typescript
// Lazy load everything
const DetailPageTemplate = lazy(() => import('@/components/templates/DetailPageTemplate'));
const AboutSection = lazy(() => import('./sections/AboutSection'));
const SafetySection = lazy(() => import('./sections/SafetySection'));
```

### **2. Virtual Lists**

```typescript
// For long lists (reviews, events)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={reviews}
  renderItem={({ item }) => <ReviewCard review={item} />}
  estimatedItemSize={120}
/>
```

### **3. Image Optimization**

```typescript
// Lazy load images
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

### **4. Memoization**

```typescript
// Memoize expensive components
const MemoizedSafetySection = memo(SafetySection);
const MemoizedCreatorFeed = memo(CreatorFeed);
```

### **5. Pagination**

```typescript
// Infinite scroll for feeds
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['creator-feed', id],
  queryFn: ({ pageParam = 1 }) => fetchFeed(id, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

---

## 🗺️ IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (Week 1)**

**Goal**: Set up base structure

- [ ] Create DetailPageTemplate component
- [ ] Set up routing `/detail/[type]/[id]`
- [ ] Create detail.config.ts
- [ ] Set up Zustand stores
- [ ] Create base atoms (Button, Text, Image, etc.)

**Deliverable**: Empty detail page with routing

---

### **Phase 2: Core Components (Week 2)**

**Goal**: Build essential organisms

- [ ] DetailHeader (back, title, save, share)
- [ ] ImageCarousel (swipeable gallery)
- [ ] BasicInfoSection (rating, location, hours)
- [ ] TabBar (main navigation)
- [ ] LoadingSkeleton

**Deliverable**: Detail page shell with navigation

---

### **Phase 3: Tab System (Week 3)**

**Goal**: Implement tab navigation

- [ ] Create tab configuration
- [ ] Build OverviewTab
- [ ] Build DetailsTab
- [ ] Build ReviewsTab
- [ ] Tab state management
- [ ] Smooth transitions

**Deliverable**: Working tab navigation

---

### **Phase 4: Detail Sections (Week 4-5)**

**Goal**: Build all detail sections

- [ ] AboutSection
- [ ] SafetySection (with sub-tabs)
- [ ] LocalEventsSection
- [ ] CuisineSection
- [ ] CreatorFeed (TikTok/Instagram)
- [ ] LanguageTipsSection
- [ ] ReviewsSection

**Deliverable**: All sections functional

---

### **Phase 5: Social Integration (Week 6)**

**Goal**: Integrate social media feeds

- [ ] TikTok API integration
- [ ] Instagram API integration
- [ ] Video player component
- [ ] Infinite scroll
- [ ] Caching strategy

**Deliverable**: Working social feeds

---

### **Phase 6: Polish & Optimize (Week 7)**

**Goal**: Performance and UX

- [ ] Lazy loading all sections
- [ ] Image optimization
- [ ] Virtual lists
- [ ] Loading states
- [ ] Error handling
- [ ] Animations
- [ ] Accessibility

**Deliverable**: Production-ready detail pages

---

### **Phase 7: Testing (Week 8)**

**Goal**: Ensure quality

- [ ] Unit tests for components
- [ ] Integration tests
- [ ] Performance testing
- [ ] Load testing (simulate billions of users)
- [ ] Bug fixes

**Deliverable**: Tested and verified

---

## 📐 EXAMPLE: DETAIL PAGE STRUCTURE

```typescript
// app/detail/[type]/[id].tsx
export default function DetailPage() {
  const { type, id } = useLocalSearchParams();
  
  return (
    <DetailPageTemplate type={type} id={id} />
  );
}

// components/templates/DetailPageTemplate/DetailPageTemplate.tsx
export default function DetailPageTemplate({ type, id }) {
  const { activeTab } = useDetailStore();
  const config = DETAIL_TABS_CONFIG[type];
  
  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <DetailHeader type={type} id={id} />
      
      {/* Image Carousel */}
      <ImageCarousel images={data.images} />
      
      {/* Basic Info */}
      <BasicInfoSection data={data} />
      
      {/* Insight Buttons */}
      <InsightButtons />
      
      {/* Tab Navigation */}
      <TabBar tabs={config} active={activeTab} />
      
      {/* Tab Content */}
      <ScrollView>
        {activeTab === 'overview' && <OverviewTab type={type} id={id} />}
        {activeTab === 'details' && <DetailsTab type={type} id={id} />}
        {activeTab === 'reviews' && <ReviewsTab type={type} id={id} />}
      </ScrollView>
    </View>
  );
}
```

---

## 🎯 SUCCESS METRICS

### **Performance Targets**

| Metric | Target | Strategy |
|--------|--------|----------|
| Initial Load | < 2s | Code splitting, lazy loading |
| Time to Interactive | < 3s | Progressive rendering |
| Bundle Size | < 500KB | Tree shaking, compression |
| API Calls | < 5 per page | Caching, batching |
| Memory Usage | < 150MB | Virtual lists, image optimization |
| Tab Switch | < 100ms | Memoization, state management |

### **Scalability Targets**

- ✅ Support 1B+ concurrent users
- ✅ Handle 10K+ images per detail page
- ✅ Support 100+ sections per page
- ✅ Maintain < 300 lines per component
- ✅ Zero code duplication

---

## 🚀 KEY TAKEAWAYS

### **1. Modular Everything**
Every component is small, focused, and reusable.

### **2. Configuration Over Code**
Use config files to define structure, not hard-coded logic.

### **3. Lazy Load Everything**
Only load what's visible or needed.

### **4. Single Source of Truth**
One template serves all detail types.

### **5. Performance First**
Optimize for billions of users from day one.

---

## 📝 NOTES

### **Why This Architecture Works**

1. **Scalable**: Can handle billions of users
2. **Maintainable**: Small, focused components
3. **Flexible**: Easy to add/remove sections
4. **Performant**: Lazy loading + caching
5. **Consistent**: Same UX across all types
6. **Type-Safe**: TypeScript everywhere
7. **Testable**: Small units easy to test

### **Lessons from Homepage Refactoring**

We successfully reduced the homepage from 666 → 243 lines using:
- Section extraction
- Configuration-driven rendering
- Modular components

We'll apply the same principles to detail pages, but with:
- More complex nesting (tabs within sections)
- Lazy loading (for performance)
- Dynamic content (social feeds, events)

---

## ✅ KEY DECISIONS & ANSWERS

### **Q: Is it OK for different detail pages to have different information?**
**A: YES! It's essential.** A restaurant needs a menu, but a landmark doesn't. An event needs a schedule, but a beach doesn't. Our architecture handles this elegantly through:
- **Universal core** (9 sections every page has)
- **Type-specific extensions** (conditional rendering)
- **Data-driven display** (only show sections with data)

### **Q: Can we handle this technically?**
**A: Absolutely!** We use:
- **Config-driven sections** (like homepage SectionRenderer)
- **Conditional rendering** based on type and data availability
- **Shared components** for universal sections
- **Type-specific components** for unique needs
- **Lazy loading** for performance

### **Q: What's the pattern?**
**A: Hybrid approach:**
```
Every Detail Page:
├── Universal Core (9 sections)
│   ├── Gallery, Header, Title, Stats
│   ├── Description, Practical Info
│   └── Reviews, Similar, Action Button
│
└── Type-Specific Extensions (varies)
    ├── Destinations: Events, Cuisine, Language, Safety
    ├── Restaurants: Menu, Reservations, Dietary
    ├── Events: Schedule, Tickets, Venue
    ├── Activities: Duration, Difficulty, Included
    └── Accommodations: Rooms, Amenities, Rules
```

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Universal Sections (Start Here)**
Build the 9 sections that EVERY detail page needs:
1. ✅ Image Gallery (done)
2. ✅ Header (done)
3. ✅ Title + Location (done)
4. ✅ Quick Stats (done)
5. ⏳ Description Section
6. ⏳ Practical Info Section
7. ⏳ Reviews Section
8. ⏳ Similar Items Section
9. ⏳ Action Button

### **Phase 2: Flexible System**
Create the config-driven rendering system:
1. ⏳ `detail-sections.config.ts`
2. ⏳ Section registry
3. ⏳ Conditional renderer
4. ⏳ Type detection

### **Phase 3: Type-Specific Sections**
Add sections as needed per type:
1. ⏳ Destination-specific (8 sections)
2. ⏳ Restaurant-specific (7 sections)
3. ⏳ Event-specific (7 sections)
4. ⏳ Activity-specific (7 sections)
5. ⏳ Accommodation-specific (7 sections)

---

**Last Updated**: November 1, 2025 (V2 - Added Type-Specific Architecture)  
**Status**: Comprehensive Blueprint Complete - Ready for Implementation  
**Next Step**: Phase 1 - Build Universal Sections (Description, Practical Info, Reviews)  
**Architecture**: Flexible, scalable, type-aware, data-driven
