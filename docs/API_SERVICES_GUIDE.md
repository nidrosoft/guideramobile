# 🌐 Guidera API Services Guide

> **Purpose**: Comprehensive guide to all external API services needed for Guidera
> **Created**: December 28, 2025
> **Last Updated**: December 28, 2025
> **Status**: Research Complete (2025-2026 Data)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Categories](#api-categories)
3. [Booking APIs](#1-booking-apis)
4. [Safety & Travel Advisory APIs](#2-safety--travel-advisory-apis)
5. [Weather APIs](#3-weather-apis)
6. [Translation & Language APIs](#4-translation--language-apis)
7. [Currency Exchange APIs](#5-currency-exchange-apis)
8. [AI/LLM APIs](#6-aillm-apis)
9. [Maps & Navigation APIs](#7-maps--navigation-apis)
10. [Payment Processing APIs](#8-payment-processing-apis)
11. [Visa & Passport APIs](#9-visa--passport-apis)
12. [Flight Tracking APIs](#10-flight-tracking-apis)
13. [Places & Destination APIs](#11-places--destination-apis)
14. [Push Notification Services](#12-push-notification-services)
15. [Image Storage & CDN](#13-image-storage--cdn)
16. [Recommended Stack](#recommended-api-stack)
17. [Cost Estimation](#cost-estimation)
18. [Implementation Priority](#implementation-priority)

---

## Overview

Guidera is a comprehensive AI-powered travel companion app that requires integration with multiple external APIs to deliver its full feature set. This document outlines all required API services, compares top providers, and recommends the optimal stack for global coverage.

### Key Requirements
- **Global Coverage**: Must work in Africa, Europe, Asia, Americas, Middle East
- **Budget-Conscious Users**: Price comparison and finding cheapest options is critical
- **Reliability**: High uptime for booking and safety-critical features
- **Unified Where Possible**: Prefer single providers that offer multiple services
- **Fallback Strategy**: Primary + backup providers for critical services

---

## API Categories

| Category | Primary Use | Critical Level |
|----------|-------------|----------------|
| Booking (Flights/Hotels/Cars/Experiences) | Core revenue feature | 🔴 Critical |
| Safety & Travel Advisories | User safety | 🔴 Critical |
| AI/LLM | Trip planning, recommendations | 🔴 Critical |
| Payment Processing | Revenue collection | 🔴 Critical |
| Maps & Navigation | AR navigation, directions | 🟠 High |
| Weather | Trip planning, safety | 🟠 High |
| Flight Tracking | Real-time updates | 🟠 High |
| Translation | Communication feature | 🟡 Medium |
| Currency Exchange | Budget tracking | 🟡 Medium |
| Visa/Passport | Trip preparation | 🟡 Medium |
| Places/Destinations | Content & discovery | 🟡 Medium |
| Push Notifications | Engagement | 🟢 Standard |
| Image Storage/CDN | User content | 🟢 Standard |

---

## 1. Booking APIs

### 🎯 Requirement
Unified API for flights, hotels, car rentals, and experiences with global coverage and competitive pricing. **Priority: Finding the cheapest options for budget-conscious travelers.**

### Top 3 Unified Providers (2025-2026)

#### 1. **Amadeus** ⭐ RECOMMENDED PRIMARY
| Aspect | Details |
|--------|---------|
| **Coverage** | 1.5M+ hotels, 400+ airlines, car rentals, 300k+ activities |
| **Regions** | Excellent: Europe, Middle East, Africa, Asia-Pacific, Americas |
| **Products** | Flights, Hotels, Cars, Transfers, Tours & Activities (all in one) |
| **Pricing** | Custom volume-based; per-transaction fees; freemium for testing |
| **Strengths** | Most complete unified option, AI-driven recommendations, 24/7 support |
| **Best For** | Primary backbone for all booking types with single integration |

```
APIs Needed:
- Flight Offers Search API
- Flight Offers Price API  
- Flight Create Orders API
- Hotel Search API (1.5M+ properties)
- Hotel Booking API
- Transfer Search API
- Tours and Activities API
- Airport & City Search API
- Airline Code Lookup API
```

#### 2. **Kiwi.com** ⭐ BEST FOR CHEAPEST FLIGHTS
| Aspect | Details |
|--------|---------|
| **Coverage** | Global flights + trains/buses via virtual interlining |
| **Unique Feature** | **Virtual Interlining** - combines non-partner airlines for cheapest routes |
| **Pricing** | Revenue share / commission per booking |
| **Strengths** | Best for finding unconventional cheap combinations, multimodal |
| **Best For** | Budget travelers wanting absolute cheapest options |

#### 3. **Duffel** (Modern GDS Alternative)
| Aspect | Details |
|--------|---------|
| **Coverage** | 400+ airlines via NDC direct connections |
| **Pricing** | Pay-per-use (~$0.005/search) |
| **Strengths** | Developer-friendly, modern API, fast search, no legacy GDS overhead |
| **Best For** | Startups wanting modern airline retailing without GDS complexity |

### Flight APIs (For Cheapest Price Discovery)

| Provider | Best For | Coverage | Pricing Model |
|----------|----------|----------|---------------|
| **Skyscanner API** | Price comparison & cheap flight discovery | Global consumer coverage | Free tier + affiliate |
| **Kiwi.com API** | Virtual interlining, cheapest combinations | Global + multimodal | Revenue share |
| **Duffel** | Modern NDC, direct airline prices | 400+ carriers | Pay-per-use |
| **FlightAPI.io** | Quick integration, real-time prices | Multi-vendor | Usage-based |
| **Travelfusion** | Low-cost carriers (LCCs) | 400+ carriers, strong EU/Asia | Custom |

### Hotel APIs (2025-2026)

| Provider | Coverage | Rate Type | Best For |
|----------|----------|-----------|----------|
| **Expedia EPS Rapid API** | 700k+ properties | Retail OTA rates | Consumer apps, fast integration |
| **Booking.com Partner API** | Millions of listings | Retail competitive | Europe, urban markets |
| **Hotelbeds (APItude)** | 180k+ hotels | Wholesale net rates | Higher margins, leisure |
| **Agoda Partner API** | 1M+ properties | Competitive APAC | Asia-Pacific focus |
| **RateHawk API** | 1.5M+ properties | B2B discounted | Extra inventory, margins |

### Experiences & Activities APIs (2025-2026)

| Provider | Coverage | Strengths | Commission |
|----------|----------|-----------|------------|
| **Viator (TripAdvisor)** | 300k+ experiences | Largest inventory, reviews | 20-30% |
| **GetYourGuide** | Hand-picked quality | Best UX, 24h cancel, AI curation | 20-30% |
| **Klook** | Strong Asia + bundles | Cheapest prices, Gen-Z focused | 20-30% |

### 💡 Recommendation (2025-2026)
```
UNIFIED BACKBONE:
  Primary: Amadeus (flights + hotels + cars + activities)
  
CHEAPEST FLIGHTS:
  Primary: Kiwi.com (virtual interlining for budget travelers)
  Fallback: Skyscanner (price comparison)
  Modern: Duffel (NDC direct)
  
HOTELS:
  Primary: Expedia EPS Rapid API (consumer-friendly)
  Supplement: Hotelbeds (wholesale margins)
  
EXPERIENCES:
  Primary: Viator (largest inventory)
  Supplement: GetYourGuide (quality) + Klook (Asia)
```

---

## 2. Safety & Travel Advisory APIs

### 🎯 Requirement
Real-time travel advisories, crime data, health alerts, natural disasters, emergency services globally.

### Top 3 Providers (2025-2026)

#### 1. **Riskline** ⭐ RECOMMENDED PRIMARY
| Aspect | Details |
|--------|---------|
| **Coverage** | 220+ countries, 260+ cities |
| **Features** | Travel advisories, crime/security risk levels, health alerts, disaster warnings, emergency info |
| **New in 2025** | **Travel Search v2** - entry rules, passport/ID requirements, vaccine recommendations, safety insights |
| **Pricing** | Tiered SaaS ($$-$$$); API or embeddable widget |
| **Strengths** | Designed for travel platforms, 24/7 monitoring, normalized safety scores |

#### 2. **Safeture**
| Aspect | Details |
|--------|---------|
| **Coverage** | Global risk and location data |
| **Features** | Location-based alerts, risk maps, health/security alerts, critical event monitoring |
| **Pricing** | Per-user / enterprise contracts |
| **Strengths** | Strong location correlation + push alerts, B2B/duty-of-care features |

#### 3. **Crisis24 (GardaWorld)**
| Aspect | Details |
|--------|---------|
| **Coverage** | Global with 27 threat categories |
| **Features** | Country/city threat assessments, real-time monitoring, geofenced alerts, evacuation support |
| **Pricing** | Enterprise contracts |
| **Strengths** | 1.2M+ medical/logistics providers network, high-end security + assistance |

### Government & Open Data Sources (Free)
| Source | Coverage | Data Type |
|--------|----------|-----------|
| **US State Dept Travel Advisories** | Global | Safety levels, alerts (JSON/RSS) |
| **UK FCDO** | Global | Travel advice |
| **WHO Disease Outbreak News** | Global | Health alerts |
| **CDC Travel Health Notices** | Global | Health advisories |
| **GDACS** | Global | Natural disaster alerts |
| **USGS** | Global | Earthquake data |
| **NOAA** | Global | Weather/storm alerts |

### 💡 Recommendation (2025-2026)
```
Primary: Riskline (Travel Search v2 API - designed for travel apps)
Supplement: Direct government feeds (US State Dept, WHO, CDC, GDACS)
Enterprise/Assistance: Crisis24 or International SOS (for premium features)
```

---

## 3. Weather APIs

### 🎯 Requirement
Current conditions, 7-14 day forecasts, severe weather alerts, historical data for trip planning.

### Top 3 Providers (2025-2026)

#### 1. **Tomorrow.io** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Features** | Real-time (80+ data layers, ~500 parameters), hyperlocal forecasts, severe alerts, historical data, air quality, road risk |
| **Forecast** | Up to 14 days |
| **Coverage** | Global |
| **Pricing** | Tiered SaaS: free trial → self-serve → enterprise |
| **Strengths** | Best all-in-one for travel apps, impact-based insights, "weather intelligence" |

#### 2. **OpenWeatherMap**
| Aspect | Details |
|--------|---------|
| **Features** | Real-time from 40k+ stations, 5-16 day forecasts, alerts, maps |
| **Forecast** | Up to 16 days (paid) |
| **Coverage** | Global |
| **Pricing** | Freemium; generous free tier; paid tiers by volume |
| **Strengths** | Best budget option, well-documented, multi-language SDKs |

#### 3. **Visual Crossing**
| Aspect | Details |
|--------|---------|
| **Features** | Real-time, timeline forecasts, 50+ years historical data |
| **Forecast** | Up to 15 days |
| **Coverage** | Global |
| **Pricing** | Cost-effective tiered subscriptions |
| **Strengths** | Best for historical data, seasonal analysis, "best time to visit" features |

### Other Notable Options (2025)
| Provider | Best For | Notes |
|----------|----------|-------|
| **Meteomatics** | High-precision (90m resolution) | 1800+ parameters, enterprise |
| **Stormglass** | Maritime/coastal travel | Surf, sailing, cruises |

### 💡 Recommendation (2025-2026)
```
Primary: Tomorrow.io (best features, impact alerts)
Budget/Fallback: OpenWeatherMap (freemium, reliable)
Historical/Analytics: Visual Crossing (50+ years data)
```

---

## 4. Translation & Language APIs

### 🎯 Requirement
Real-time text translation (100+ languages), speech-to-text/text-to-speech, camera OCR, offline capability.

### Top 3 Providers (2025-2026)

#### 1. **Google Cloud Translation** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Languages** | 130+ |
| **Features** | Real-time text, STT/TTS (via Speech APIs), Camera OCR (via Vision/ML Kit), offline packs |
| **Accuracy** | 80-90% general; strong for menus/signs |
| **Pricing** | ~$20/million chars; 500K free/month; docs $0.08/page |
| **Strengths** | Best all-rounder, ML Kit for offline, proven in Google Translate app |

#### 2. **Microsoft Azure Translator**
| Aspect | Details |
|--------|---------|
| **Languages** | 100+ |
| **Features** | Real-time text, STT/TTS (via Speech Services), OCR (via Computer Vision), multi-party conversation mode |
| **Pricing** | ~$10/million chars; 2M free/month |
| **Strengths** | Cheaper than Google, excellent for group tours/conversations, Teams integration |

#### 3. **DeepL**
| Aspect | Details |
|--------|---------|
| **Languages** | 30-40 (mainly European) |
| **Features** | Real-time text, document translation |
| **Accuracy** | Highest quality for European language pairs |
| **Pricing** | $10.49-$68.99/user/month (Pro); enterprise custom |
| **Strengths** | Best quality for itineraries, marketing text, formal content |
| **Limitations** | No native OCR, no offline, no STT/TTS |

### Other Options (2025)
| Provider | Best For | Notes |
|----------|----------|-------|
| **Lingvanex** | On-premise/secure deployments | 100+ languages, custom glossaries |

### 💡 Recommendation (2025-2026)
```
Primary: Google Cloud Translation + Speech + Vision/ML Kit (complete stack)
Budget Alternative: Microsoft Azure Translator (cheaper, generous free tier)
Premium Text: DeepL (high-quality European translations for content)
```

---

## 5. Currency Exchange APIs

### 🎯 Requirement
Real-time exchange rates, historical rates, 150+ currencies including crypto, high reliability.

### Top 3 Providers (2025-2026)

#### 1. **CurrencyLayer** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Currencies** | 168+ fiat |
| **Updates** | High-frequency real-time |
| **Features** | Real-time, 19+ years historical, multi-currency conversion |
| **Pricing** | Free trial; tiered by requests/frequency |
| **Strengths** | Industry standard reliability, source switching |

#### 2. **Open Exchange Rates**
| Aspect | Details |
|--------|---------|
| **Currencies** | 200+ fiat |
| **Updates** | Live (hourly free, near real-time paid) |
| **Features** | Real-time, historical, time-series, blended algorithm |
| **Pricing** | Free tier; tiered subscriptions |
| **Strengths** | Broadest coverage, great developer ecosystem |

#### 3. **Fixer.io**
| Aspect | Details |
|--------|---------|
| **Currencies** | 170+ fiat |
| **Updates** | Every 60 seconds |
| **Features** | Real-time, historical, time-series |
| **Pricing** | Free (1K calls/month); paid from ~$14.99/mo |
| **Strengths** | Fastest updates, most trusted for accuracy |

### For Crypto + Fiat Combined
| Provider | Best For | Notes |
|----------|----------|-------|
| **CurrencyFreaks** | Fiat + crypto in one API | Crypto wallets, hybrid payments |
| **Polygon.io** | Trading-grade streaming | Forex + crypto + equities |

### 💡 Recommendation (2025-2026)
```
Primary: CurrencyLayer or Open Exchange Rates (fiat)
Crypto Addition: CurrencyFreaks or Polygon.io
Budget: ExchangeRate-API or ExchangeRate.host
```

---

## 6. AI/LLM APIs

### 🎯 Requirement
Itinerary generation, personalized recommendations, cultural context/tips, conversational trip planning.

### Top 3 Providers (2025-2026)

#### 1. **Anthropic Claude 3.5** ⭐ RECOMMENDED for Content
| Aspect | Details |
|--------|---------|
| **Models** | Claude 3.5 Sonnet, Claude 3.5 Opus, Haiku |
| **Context Window** | 200K-1M tokens |
| **Strengths** | Best for long itineraries, nuanced cultural context, safe travel advice, human-like explanations |
| **Pricing** | Sonnet: mid-range (~$3-15/M tokens); Opus: premium |
| **Best For** | Itinerary generation, cultural tips, conversational planning, document analysis |

#### 2. **OpenAI GPT-4o / o-series** ⭐ RECOMMENDED for Tools
| Aspect | Details |
|--------|---------|
| **Models** | GPT-4o, GPT-4.1, GPT-4.5, o1, o3 (reasoning) |
| **Context Window** | 128K-1M tokens |
| **Strengths** | Best tool-calling, multi-step planning, multi-modal (images/audio), strongest ecosystem |
| **Pricing** | GPT-4o: ~$1-15/M tokens; o3: ~$8-40/M tokens |
| **Best For** | API orchestration, booking integrations, complex fare rules, agentic workflows |

#### 3. **Google Gemini 2.0/2.5**
| Aspect | Details |
|--------|---------|
| **Models** | Gemini 2.0/2.5 Pro, Flash, Ultra |
| **Context Window** | 128K-1M tokens |
| **Strengths** | Massive context, excellent multi-modal, Google ecosystem (Maps, Calendar), cheapest large-context |
| **Pricing** | Flash: very cheap; Pro: mid-range |
| **Best For** | Long guidebooks, Google Maps integration, high-volume chat |

### Other Notable Models (2025)
| Model | Best For | Notes |
|-------|----------|-------|
| **Meta Llama 4** | Privacy-sensitive, self-hosted | Open-source, 128K-millions context |
| **DeepSeek V3** | Budget generation | Lower cost than proprietary |
| **Cohere Embed** | Embeddings/RAG | Cost-effective vector search |

### 💡 Recommendation (2025-2026)
```
HYBRID APPROACH:
  Primary Chat/Content: Claude 3.5 Sonnet (long itineraries, cultural tips)
  Tool Calling/Agents: GPT-4o or o3 (booking API orchestration)
  High-Volume/Budget: Gemini 2.0 Flash (FAQs, quick responses)
  Embeddings/Search: Cohere Embed or OpenAI Embeddings
  
ARCHITECTURE:
  - Claude for user-facing content generation
  - GPT-4o for tool-calling and API orchestration
  - Cheaper models (Flash, 4-mini) for high-volume, simple tasks
```

---

## 7. Maps & Navigation APIs

### 🎯 Requirement
Turn-by-turn navigation, POI search, offline maps, AR navigation support, global coverage.

### Top 3 Providers (2025-2026)

#### 1. **Google Maps Platform** ⭐ RECOMMENDED for POI
| Aspect | Details |
|--------|---------|
| **Features** | Navigation SDK, Directions API, Places API (best POI), Street View, EV chargers, transit |
| **Coverage** | Excellent global (200+ countries) |
| **Pricing** | Per-request with monthly free credit (~$200) |
| **Strengths** | Best POI database, ratings, photos, reviews, transit data |
| **AR** | Live View in Google app; 3D/ARCore pieces for custom |

#### 2. **Mapbox** ⭐ RECOMMENDED for Navigation/Offline
| Aspect | Details |
|--------|---------|
| **Features** | Turn-by-turn SDK, offline tile packs, offline routing/search, custom styles |
| **Coverage** | Global (OSM + commercial data) |
| **Pricing** | MAU-based for mobile; generous free tiers |
| **Strengths** | Best offline support, design control, AR via Vision SDK |

#### 3. **HERE Maps**
| Aspect | Details |
|--------|---------|
| **Features** | Full turn-by-turn SDK, lane guidance, offline routing, truck routing |
| **Coverage** | Strong Europe, good global |
| **Pricing** | Freemium; transaction-based; enterprise contracts |
| **Strengths** | Rock-solid offline, automotive-grade, used by car OEMs |

### 💡 Recommendation (2025-2026)
```
HYBRID APPROACH:
  POI/Search/Discovery: Google Maps Platform (best data)
  Navigation/Offline: Mapbox Navigation SDK (best offline)
  AR Navigation: Mapbox + ARKit/ARCore (custom implementation)
  Fallback: HERE Maps (automotive-grade, offline-heavy regions)
  
NOTE: Many travel apps use Google for POI + Mapbox/HERE for navigation
```

---

## 8. Payment Processing APIs

### 🎯 Requirement
Multi-currency (100+), multiple payment methods, PCI compliance, global coverage (Africa, Asia, Europe, Americas).

### Top 3 Providers (2025-2026)

#### 1. **Stripe** ⭐ RECOMMENDED for Startups
| Aspect | Details |
|--------|---------|
| **Currencies** | 135+ |
| **Methods** | Cards, Apple Pay, Google Pay, iDEAL, Klarna, Alipay, SEPA, Boleto, Pix, etc. |
| **Coverage** | Strong: US, Europe; Expanding: Asia, LatAm, some Africa |
| **Pricing** | ~2.5-3.5% + fixed fee; volume discounts available |
| **Strengths** | Best developer UX, fastest integration, Radar fraud tools, Connect for payouts |

#### 2. **Adyen** ⭐ RECOMMENDED for Scale
| Aspect | Details |
|--------|---------|
| **Currencies** | 150+ |
| **Methods** | Cards, wallets, deep local method coverage globally |
| **Coverage** | Excellent: Europe, Americas, APAC, improving Africa |
| **Pricing** | Interchange++ (negotiated); often better at scale |
| **Strengths** | Travel industry leader (airlines, OTAs), best global acquiring, multi-acquirer routing |

#### 3. **Checkout.com**
| Aspect | Details |
|--------|---------|
| **Currencies** | 150+ |
| **Methods** | Cards, wallets, local methods |
| **Coverage** | Strong: EMEA, APAC, LatAm, Africa/Middle East |
| **Pricing** | IC++ or custom blended |
| **Strengths** | Cross-border focus, high-risk verticals like travel |

### Regional Specialists (2025)
| Provider | Best For | Notes |
|----------|----------|-------|
| **Africa PSPs** | Mobile money (M-Pesa, Airtel, MTN) | Pair with global PSP |
| **LatAm PSPs** | Pix, Boleto, OXXO, installments | Better local acquiring |
| **Payment Orchestration** | Multi-PSP routing | Dynamic routing for optimization |

### 💡 Recommendation (2025-2026)
```
STARTUP PHASE:
  Primary: Stripe (fastest integration, best DX)
  PayPal: Braintree integration
  
SCALE PHASE:
  Primary: Adyen (travel industry leader, IC++ pricing)
  Supplement: Regional PSPs for Africa/LatAm
  
TRAVEL-SPECIFIC:
  - Negotiate "travel" rates (highlight low chargeback controls)
  - Use 3DS2 for SCA compliance
  - Consider payment orchestration at high volume
```

---

## 9. Visa & Passport APIs

### 🎯 Requirement
Visa requirements between countries, passport validity, entry restrictions, transit visas.

### Top 3 Providers (2025-2026)

#### 1. **Travel Buddy AI Visa API** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Coverage** | 200+ passports, 210 destinations |
| **Features** | Visa requirements, passport validity rules, stay lengths, embassy/eVisa links |
| **Updates** | Daily |
| **Pricing** | Free tier available; paid scaling |
| **Strengths** | Developer-friendly, comprehensive, playground for testing |

#### 2. **Passport Index API**
| Aspect | Details |
|--------|---------|
| **Coverage** | 199 passports, 227 destinations |
| **Features** | Visa-free lists, real-time updates, conditions |
| **Pricing** | Request-based |
| **Strengths** | Real-time, flexible, good for rankings |

#### 3. **IATA Timatic** (Enterprise)
| Aspect | Details |
|--------|---------|
| **Coverage** | Comprehensive (used by airlines) |
| **Features** | Full visa/passport/health requirements, transit rules |
| **Pricing** | Enterprise (custom quotes, ~$0.01-0.10/query) |
| **Strengths** | Industry standard, most accurate, used by all airlines |

### 💡 Recommendation (2025-2026)
```
Primary: Travel Buddy AI Visa API (free tier, comprehensive)
Rankings: Passport Index API (visa-free scores)
Enterprise/Accuracy: IATA Timatic (when scaling)
```

---

## 10. Flight Tracking APIs

### 🎯 Requirement
Real-time flight status, historical data, airport info, global airline coverage.

### Top 3 Providers (2025-2026)

#### 1. **FlightAware AeroAPI** ⭐ RECOMMENDED Enterprise
| Aspect | Details |
|--------|---------|
| **Features** | Real-time tracking, delays, cancellations, gate changes, historical data, airport info, Firehose streaming |
| **Coverage** | All airlines globally |
| **Pricing** | Custom enterprise plans |
| **Strengths** | High reliability, trusted by enterprises/governments, analytics |

#### 2. **Cirium (FlightStats)**
| Aspect | Details |
|--------|---------|
| **Features** | Real-time status, predictions, weather integration, push notifications |
| **Coverage** | Extensive global |
| **Pricing** | Enterprise solutions |
| **Strengths** | Industry leader, multilingual, multiple APIs for robustness |

#### 3. **AeroDataBox** ⭐ RECOMMENDED Budget
| Aspect | Details |
|--------|---------|
| **Features** | Status, delays, schedules, airport info |
| **Coverage** | Global |
| **Pricing** | Affordable (via RapidAPI) |
| **Strengths** | Best for SMBs/startups, easy REST integration, quick setup |

### 💡 Recommendation (2025-2026)
```
Startup/Budget: AeroDataBox (affordable, good coverage)
Enterprise/Reliability: FlightAware AeroAPI or Cirium
```

---

## 11. Places & Destination APIs

### 🎯 Requirement
Destination descriptions, photos, reviews/ratings, opening hours, categories.

### Top 3 Providers (2025-2026)

#### 1. **Google Places API** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Features** | Descriptions, high-quality photos, ratings (1-5), hours, contact, strong categories |
| **Coverage** | Excellent (200+ countries) |
| **Pricing** | ~$2-17/1k requests (New Places: $2.50/1k) |
| **Strengths** | Best overall POI database, reviews, photos |

#### 2. **Foursquare Places API**
| Aspect | Details |
|--------|---------|
| **Features** | Detailed venue tips, user photos, ratings, hours, 400+ categories |
| **Coverage** | Global (urban focus) |
| **Pricing** | Free tier (500 calls/day); paid from $99/mo |
| **Strengths** | Most granular categories, good for discovery |

#### 3. **TripAdvisor Content API**
| Aspect | Details |
|--------|---------|
| **Features** | Rich travel guides, POI descriptions, extensive reviews, photos |
| **Coverage** | Global (200k+ attractions) |
| **Pricing** | Custom enterprise (contact sales) |
| **Strengths** | Best travel-specific reviews and guides |

### 💡 Recommendation (2025-2026)
```
Primary: Google Places API (best coverage, photos, ratings)
Reviews/Guides: TripAdvisor Content API
Categories/Discovery: Foursquare Places API
```

---

## 12. Push Notification Services

### 🎯 Requirement
Cross-platform (iOS/Android), rich notifications, segmentation, analytics.

### Top 3 Providers (2025-2026)

#### 1. **Firebase Cloud Messaging (FCM)** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Platforms** | iOS, Android, Web |
| **Features** | Rich notifications, topic-based segmentation, delivery metrics |
| **Pricing** | Free (unlimited) |
| **Strengths** | Free, reliable, Google ecosystem, basic for most apps |

#### 2. **OneSignal** ⭐ RECOMMENDED for Marketing
| Aspect | Details |
|--------|---------|
| **Platforms** | iOS, Android, Web |
| **Features** | Rich media, ML timing, A/B testing, detailed analytics, in-app messaging |
| **Pricing** | Free to 10K users; paid from ~$99/mo |
| **Strengths** | User-friendly, multi-channel, best segmentation |

#### 3. **Pusher Beams**
| Aspect | Details |
|--------|---------|
| **Platforms** | iOS, Android, Web |
| **Features** | Rich notifications, interest-based filtering, delivery tracking |
| **Pricing** | Free sandbox; paid from ~$29/mo |
| **Strengths** | Real-time, low latency, scalable, end-to-end encryption |

### Other Notable Options (2025)
| Provider | Best For | Notes |
|----------|----------|-------|
| **Knock** | Orchestration layer | Integrates with FCM/APNs/Expo |
| **EngageLab** | Global/high-volume | OEM support (Huawei, etc.) |

### 💡 Recommendation (2025-2026)
```
Primary: Firebase Cloud Messaging (free, reliable, sufficient for most)
Marketing/Segmentation: OneSignal (A/B testing, ML timing)
Real-time: Pusher Beams (low latency)
```

---

## 13. Image Storage & CDN

### 🎯 Requirement
Image upload/storage, transformation/optimization, global CDN, cost-effective for millions of images.

### Top 3 Providers (2025-2026)

#### 1. **Cloudflare Images** ⭐ RECOMMENDED for Cost
| Aspect | Details |
|--------|---------|
| **Features** | Storage, real-time transforms (resize, AVIF/WebP), global CDN |
| **Pricing** | $5/mo base + $0.40/100k stored images; no transfer fees with R2 |
| **Strengths** | Best cost for UGC at scale, predictable pricing |
| **Limitations** | Limited advanced transforms vs Cloudinary |

#### 2. **ImageKit** ⭐ BEST VALUE
| Aspect | Details |
|--------|---------|
| **Features** | 50+ transforms, real-time processing, use your own storage (S3) |
| **Pricing** | ~40% cheaper than Cloudinary; usage-based |
| **Strengths** | Flexible, global processing, cost-effective scaling |

#### 3. **Cloudinary**
| Aspect | Details |
|--------|---------|
| **Features** | Upload, storage, rich transforms, AI auto-optimization, DAM, CDN |
| **Pricing** | Usage-based (credits); higher at scale |
| **Strengths** | Best features for UGC (AI tagging, moderation, face-aware cropping) |
| **Limitations** | Most expensive at high volume |

### Other Options (2025)
| Provider | Best For | Notes |
|----------|----------|-------|
| **AWS S3 + CloudFront** | Custom control | ~$0.023/GB storage; needs Lambda for transforms |
| **Bunny CDN/Optimizer** | Budget | $9.50/mo, fast |

### 💡 Recommendation (2025-2026)
```
Budget/Scale: Cloudflare Images + R2 (lowest cost, predictable)
Value: ImageKit (40% cheaper than Cloudinary, flexible)
Features: Cloudinary (if budget allows for AI/DAM features)
```

---

## Recommended API Stack (2025-2026)

### 🏆 Primary Stack (Recommended)

| Category | Primary Provider | Fallback | Notes |
|----------|-----------------|----------|-------|
| **Booking (Unified)** | Amadeus | Travelport | 1.5M+ hotels, 400+ airlines |
| **Cheapest Flights** | Kiwi.com | Skyscanner | Virtual interlining |
| **Hotels** | Expedia EPS Rapid | Hotelbeds | Consumer-friendly |
| **Experiences** | Viator | GetYourGuide + Klook | 300k+ activities |
| **Safety** | Riskline | Gov feeds (US/UK/WHO) | Travel Search v2 |
| **Weather** | Tomorrow.io | OpenWeatherMap | Impact alerts |
| **Translation** | Google Cloud | Microsoft Azure | 130+ languages |
| **Currency** | CurrencyLayer | Open Exchange Rates | 168+ currencies |
| **AI/LLM** | Claude 3.5 (content) + GPT-4o (tools) | Gemini Flash | Hybrid approach |
| **Maps/Navigation** | Google (POI) + Mapbox (nav) | HERE Maps | Best of both |
| **Payments** | Stripe | Adyen (at scale) | Travel-optimized |
| **Visa/Passport** | Travel Buddy AI | IATA Timatic | 200+ passports |
| **Flight Tracking** | AeroDataBox | FlightAware | Budget-friendly |
| **Places/POI** | Google Places | Foursquare + TripAdvisor | Best coverage |
| **Push Notifications** | Firebase Cloud Messaging | OneSignal | Free unlimited |
| **Image Storage** | Cloudflare Images | ImageKit | Best cost |

---

## Cost Estimation (2025-2026)

### Monthly Cost Estimates (10,000 MAU)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Amadeus (Booking) | $200-500 (transaction-based) |
| Kiwi.com (Flights) | Revenue share (commission) |
| Riskline (Safety) | $100-300 |
| Tomorrow.io (Weather) | $50-150 |
| Google Translation | $50-100 |
| CurrencyLayer | Free-$50 |
| AI/LLM (Claude + GPT-4o) | $300-800 |
| Mapbox + Google Maps | $100-300 |
| Stripe (2.5-3.5% of GMV) | Variable |
| Visa API | Free-$50 |
| Flight Tracking | $50-100 |
| Google Places | $100-200 |
| FCM | Free |
| Cloudflare Images | $20-50 |
| **Total Estimate** | **$1,000-2,500/month** |

### At Scale (100,000 MAU)
Expect 5-10x increase, with volume discounts on enterprise APIs.
Consider: Adyen for payments, IATA Timatic for visa, FlightAware for tracking.

---

## Implementation Priority (2025-2026)

### Phase 1: MVP (Weeks 1-4)
1. ⬜ Amadeus (Flight + Hotel search)
2. ⬜ Kiwi.com (cheapest flight discovery)
3. ⬜ Google Places API
4. ⬜ GPT-4o (trip planning + tool calling)
5. ⬜ Stripe (payments)
6. ⬜ Firebase Cloud Messaging
7. ⬜ Mapbox (basic maps + offline)

### Phase 2: Core Features (Weeks 5-8)
1. ⬜ Tomorrow.io (weather)
2. ⬜ Riskline (safety - Travel Search v2)
3. ⬜ Google Translation
4. ⬜ CurrencyLayer
5. ⬜ AeroDataBox (flight tracking)
6. ⬜ Travel Buddy Visa API

### Phase 3: Enhanced Features (Weeks 9-12)
1. ⬜ Claude 3.5 (enhanced AI content)
2. ⬜ Viator (experiences)
3. ⬜ Expedia EPS Rapid (hotels)
4. ⬜ Cloudflare Images
5. ⬜ OneSignal (advanced notifications)

### Phase 4: Scale & Optimize (Ongoing)
1. ⬜ Adyen (payment optimization)
2. ⬜ FlightAware (enterprise tracking)
3. ⬜ IATA Timatic (visa accuracy)
4. ⬜ Multi-GDS setup (Amadeus + Travelport)
5. ⬜ Regional PSPs (Africa, LatAm)

---

## API Integration Architecture (2025-2026)

```
┌─────────────────────────────────────────────────────────────────┐
│                         GUIDERA APP                              │
│                    (React Native / Expo)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Auth      │  │  Database   │  │   Storage   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │              EDGE FUNCTIONS                       │           │
│  │  (API Orchestration, Caching, Rate Limiting)     │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  BOOKING APIs   │ │   AI/LLM APIs   │ │  UTILITY APIs   │
│  ─────────────  │ │  ─────────────  │ │  ─────────────  │
│  • Amadeus      │ │  • GPT-4o       │ │  • Tomorrow.io  │
│  • Kiwi.com     │ │  • Claude 3.5   │ │  • Google Trans │
│  • Viator       │ │  • Gemini Flash │ │  • CurrencyLayer│
│  • Expedia EPS  │ │  • Cohere       │ │  • Riskline     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MAPS/NAV      │ │  TRACKING APIs  │ │  CONTENT APIs   │
│  ─────────────  │ │  ─────────────  │ │  ─────────────  │
│  • Google Maps  │ │  • AeroDataBox  │ │  • Google Places│
│  • Mapbox       │ │  • FlightAware  │ │  • TripAdvisor  │
│  • HERE         │ │  • Travel Buddy │ │  • Foursquare   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT GATEWAY                             │
│                    Stripe / Adyen                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Sign up for API accounts** (start with free tiers)
2. **Create API service layer** in `src/services/api/`
3. **Implement caching** for frequently accessed data
4. **Set up rate limiting** to stay within quotas
5. **Create fallback logic** for critical APIs
6. **Monitor usage** and optimize as needed

---

## Key Insights for Budget-Conscious Users

### Finding the Cheapest Options

For Guidera's target audience (budget-conscious travelers), these APIs are specifically designed to find the cheapest options:

1. **Kiwi.com** - Virtual interlining combines non-partner airlines for cheapest routes
2. **Skyscanner** - Price comparison and "Everywhere" search for flexible travelers
3. **Hotelbeds** - Wholesale net rates allow markup control for better margins
4. **Klook** - Often cheapest for Asia experiences

### Cost Optimization Strategies

1. **Cache aggressively** - Weather, currency, and safety data don't change frequently
2. **Use free tiers** - FCM, Travel Buddy AI, OpenWeatherMap have generous free tiers
3. **Batch requests** - Combine multiple API calls where possible
4. **Implement fallbacks** - Use cheaper APIs for non-critical features
5. **Negotiate volume discounts** - Most providers offer better rates at scale

---

*Document Version: 2.0*
*Last Updated: December 28, 2025*
*Research Sources: Perplexity AI (2025-2026 data), Official API Documentation*
