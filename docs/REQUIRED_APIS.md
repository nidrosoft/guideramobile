# Guidera - Required APIs & Services

This document lists all APIs and services required for Guidera's full end-to-end functionality, organized by priority.

---

## 🔴 HIGH PRIORITY (Required for MVP)

These APIs are essential for core booking and trip functionality.

### 1. Stripe - Payment Processing
- **Purpose:** Process payments, manage subscriptions, handle refunds
- **Signup:** https://dashboard.stripe.com/register
- **Pricing:** 2.9% + $0.30 per transaction
- **Free Tier:** Yes (test mode unlimited)
- **Integration Status:** Database tables ready, needs API keys

### 2. Amadeus - Flights & Hotels
- **Purpose:** Search and book flights, hotels (primary provider)
- **Signup:** https://developers.amadeus.com/register
- **Pricing:** Free tier (2,000 calls/mo) → Pay-per-use
- **Free Tier:** Yes
- **Integration Status:** Adapter implemented (`amadeus-adapter.ts`)

### 3. Google Maps Platform
- **Purpose:** Places API, Geocoding, Maps display
- **Signup:** https://console.cloud.google.com/google/maps-apis
- **Pricing:** $200 free credit/month
- **Free Tier:** Yes
- **Integration Status:** API key configured in app.json

### 4. Anthropic (Claude AI)
- **Purpose:** AI content generation (packing lists, safety guides, cultural tips)
- **Signup:** https://console.anthropic.com/
- **Pricing:** ~$15/million input tokens, ~$75/million output tokens
- **Free Tier:** No (but low cost for moderate usage)
- **Integration Status:** ✅ Already configured and working

---

## 🟡 MEDIUM PRIORITY (Required for Full Booking)

These APIs enable complete booking functionality across all travel categories.

### 5. Kiwi.com - Budget Flights
- **Purpose:** Virtual interlining for cheapest flight combinations
- **Signup:** https://partners.kiwi.com/
- **Pricing:** Affiliate commission model
- **Free Tier:** Yes (affiliate program)
- **Integration Status:** Adapter implemented (`kiwi-adapter.ts`)

### 6. GetYourGuide - Tours & Activities
- **Purpose:** Book tours, activities, and experiences
- **Signup:** https://partner.getyourguide.com/
- **Pricing:** Affiliate commission (8-10%)
- **Free Tier:** Yes (affiliate program)
- **Integration Status:** Adapter implemented (`getyourguide-adapter.ts`)

### 7. Cartrawler - Car Rentals
- **Purpose:** Search and book rental cars worldwide
- **Signup:** https://www.cartrawler.com/partners/
- **Pricing:** Contact for pricing (B2B)
- **Free Tier:** No
- **Integration Status:** Adapter implemented (`cartrawler-adapter.ts`)

### 8. Tomorrow.io - Weather API
- **Purpose:** Weather forecasts, severe weather alerts for trips
- **Signup:** https://www.tomorrow.io/weather-api/
- **Pricing:** Free tier → $99/month (Growth)
- **Free Tier:** Yes (1,000 calls/day)
- **Integration Status:** Types defined, needs integration

### 9. Firebase Cloud Messaging (FCM)
- **Purpose:** Push notifications for alerts, reminders
- **Signup:** https://console.firebase.google.com/
- **Pricing:** Free
- **Free Tier:** Yes (unlimited)
- **Integration Status:** Database tables ready, needs setup

---

## 🟢 LOW PRIORITY (Enhanced Features)

These APIs add advanced features but aren't required for core functionality.

### 10. Riskline - Travel Safety
- **Purpose:** Real-time travel advisories, safety alerts by destination
- **Signup:** https://www.riskline.com/contact/
- **Pricing:** ~$500/month (enterprise)
- **Free Tier:** No
- **Integration Status:** Types defined, needs integration

### 11. Mapbox - Offline Maps
- **Purpose:** Offline map downloads, turn-by-turn navigation
- **Signup:** https://account.mapbox.com/auth/signup/
- **Pricing:** Free tier → Pay-per-use
- **Free Tier:** Yes (50,000 map loads/month)
- **Integration Status:** Not yet integrated

### 12. CurrencyLayer - Currency Conversion
- **Purpose:** Real-time exchange rates for budget calculations
- **Signup:** https://currencylayer.com/signup
- **Pricing:** Free tier → $9.99/month
- **Free Tier:** Yes (100 requests/month)
- **Integration Status:** Not yet integrated

### 13. Google Cloud Translation
- **Purpose:** Translate content for international users
- **Signup:** https://console.cloud.google.com/apis/library/translate.googleapis.com
- **Pricing:** $20 per million characters
- **Free Tier:** Yes (500,000 chars/month)
- **Integration Status:** i18n system ready, API not integrated

### 14. Expedia EPS Rapid - Hotels (Backup)
- **Purpose:** Alternative hotel inventory
- **Signup:** https://developers.expediagroup.com/
- **Pricing:** Enterprise (contact sales)
- **Free Tier:** Sandbox available
- **Integration Status:** Adapter implemented (`expedia-adapter.ts`)

### 15. Duffel - Flights (Backup)
- **Purpose:** Alternative flight booking API
- **Signup:** https://duffel.com/
- **Pricing:** $1-3 per booking
- **Free Tier:** Sandbox available
- **Integration Status:** Adapter implemented (`duffel-adapter.ts`)

---

## 🔵 OPTIONAL (Future Enhancements)

### 16. xAI (Grok) - AI Fallback
- **Purpose:** Backup AI model for content generation
- **Signup:** https://x.ai/
- **Pricing:** TBD
- **Integration Status:** Fallback configured in edge function

### 17. Google AI (Gemini) - AI Fallback
- **Purpose:** Budget AI option for simple tasks
- **Signup:** https://aistudio.google.com/
- **Pricing:** Free tier available
- **Integration Status:** Fallback configured in edge function

### 18. AeroDataBox - Flight Tracking
- **Purpose:** Real-time flight status, delays, gate changes
- **Signup:** https://rapidapi.com/aelodata-aelodata-default/api/aerodatabox
- **Pricing:** Free tier → $10/month
- **Free Tier:** Yes (100 requests/month)
- **Integration Status:** Not yet integrated

### 19. iDenfy - Identity Verification
- **Purpose:** KYC verification for trusted travelers
- **Signup:** https://www.idenfy.com/
- **Pricing:** Pay-per-verification (~$1-2)
- **Free Tier:** No
- **Integration Status:** UI ready, API not integrated

### 20. ImageKit - Image Storage
- **Purpose:** Image optimization and CDN delivery
- **Signup:** https://imagekit.io/registration/
- **Pricing:** Free tier → $49/month
- **Free Tier:** Yes (20GB bandwidth/month)
- **Integration Status:** Not yet integrated

---

## Quick Start Checklist

### Week 1 - Core Setup
- [ ] **Stripe** - Create account, get API keys
- [ ] **Amadeus** - Register for Self-Service APIs
- [ ] **Google Maps** - Enable APIs, get API key
- [ ] ✅ **Anthropic** - Already configured

### Week 2 - Booking Providers
- [ ] **Kiwi.com** - Apply for affiliate partnership
- [ ] **GetYourGuide** - Apply for affiliate program
- [ ] **Cartrawler** - Contact for B2B partnership

### Week 3 - Supporting Services
- [ ] **Tomorrow.io** - Create account for weather
- [ ] **Firebase** - Set up FCM for push notifications
- [ ] **CurrencyLayer** - Create account for exchange rates

### Week 4+ - Enhanced Features
- [ ] **Riskline** - Contact for enterprise pricing
- [ ] **Mapbox** - Set up for offline maps
- [ ] **AeroDataBox** - Set up for flight tracking

---

## Environment Variables to Add

Once you have the API keys, add them to Supabase secrets:

```bash
# Supabase CLI commands to add secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set AMADEUS_API_KEY=xxx
supabase secrets set AMADEUS_API_SECRET=xxx
supabase secrets set GOOGLE_MAPS_API_KEY=xxx
supabase secrets set KIWI_API_KEY=xxx
supabase secrets set GETYOURGUIDE_API_KEY=xxx
supabase secrets set CARTRAWLER_API_KEY=xxx
supabase secrets set TOMORROW_API_KEY=xxx
supabase secrets set CURRENCYLAYER_API_KEY=xxx
supabase secrets set RISKLINE_API_KEY=xxx
```

---

## Estimated Monthly Costs

| Usage Level | 1K MAU | 10K MAU | 100K MAU |
|-------------|--------|---------|----------|
| Booking APIs | $50 | $300 | $2,000 |
| AI (Anthropic) | $20 | $150 | $1,000 |
| Maps | $0 | $50 | $500 |
| Safety (Riskline) | $500 | $500 | $1,000 |
| Weather | $0 | $99 | $299 |
| **Total** | **~$600** | **~$1,100** | **~$4,800** |

*Note: Stripe fees are transaction-based (2.9% + $0.30) and not included above.*

---

## Support & Documentation Links

| API | Documentation |
|-----|---------------|
| Stripe | https://stripe.com/docs |
| Amadeus | https://developers.amadeus.com/self-service |
| Google Maps | https://developers.google.com/maps/documentation |
| Anthropic | https://docs.anthropic.com/ |
| Kiwi.com | https://docs.kiwi.com/ |
| GetYourGuide | https://partner.getyourguide.com/en/resources |
| Tomorrow.io | https://docs.tomorrow.io/ |
| Firebase | https://firebase.google.com/docs/cloud-messaging |
| Mapbox | https://docs.mapbox.com/ |

---

*Last Updated: January 2025*
