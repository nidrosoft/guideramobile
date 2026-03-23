# GUIDERA — Pricing & Monetization Strategy

**Date:** March 22, 2026
**Version:** 1.0
**Status:** Draft for Review

---

## Executive Summary

Guidera is not a booking platform — it's an **AI-powered travel intelligence layer** that helps travelers plan, navigate, and experience trips with a level of depth no single competitor offers. Our pricing must reflect three realities:

1. **People don't travel every month** — traditional monthly subscriptions feel wasteful
2. **The value is front-loaded** — most AI usage happens in the 2-4 weeks before a trip
3. **We provide 10x more features** than any single competitor — our pricing should reflect premium value while remaining accessible

---

## Competitive Landscape

| App | Free Tier | Paid Tier | Price | Billing | Key Paywall Features |
|-----|-----------|-----------|-------|---------|---------------------|
| **TripIt** | Basic itinerary | TripIt Pro | $49/yr | Annual only | Real-time alerts, seat tracker, fare refund alerts |
| **Wanderlog** | Basic planning | Wanderlog Pro | $39.99/yr or $17/mo | Monthly / Annual | Offline maps, dark mode, Gmail scanning, export |
| **Roadtrippers** | 1 trip, limited waypoints | Plus | $29.99/yr | Annual only | 150 waypoints, offline maps, no ads, collab |
| **Lambus** | Basic trips | Lambus Pro | ~$5/mo or ~$35/yr + lifetime | Monthly / Annual / Lifetime | Route planning, packing lists, flight updates |
| **Hopper** | Free (transaction-based) | N/A | Per-booking fees | Per use | Price freeze ($2-50), carrot cash, flex options |
| **MindTrip** | Free (AI itineraries) | N/A (ad/affiliate) | Free | N/A | Currently free, monetizes via booking redirects |
| **Sygic Travel** | Basic maps | Premium+ | $29.99/yr | Annual / Lifetime | Offline maps, premium POIs, collections |
| **SAP Concur / TripIt Teams** | N/A | Business | $29/user/mo+ | Monthly per seat | Expense management, policy compliance, team admin |

### Key Insights from Competitive Analysis

1. **No competitor combines AI planning + safety + vision + community + deals** — Guidera is uniquely positioned
2. **$30-50/year is the sweet spot** for individual travel apps
3. **Quarterly billing is virtually nonexistent** — but makes more sense for travel than monthly
4. **Business travel** is a $50B+ market with $25-50/user/month pricing
5. **MindTrip is free** but only does itineraries — no trip hub, no safety, no vision, no community
6. **Lifetime plans** drive initial revenue but kill LTV — use sparingly

---

## Guidera's Value Stack (What Users Get)

Before pricing, let's audit exactly what Guidera delivers that no single competitor matches:

### Tier 1 — Discovery & Inspiration (Explore Tab)
- 12 curated homepage sections (deals, trending, hidden gems, experiences, etc.)
- AI Trip Snapshot (destination intelligence: costs, flights, hotels, experiences)
- Local Experiences (Viator integration)
- Travel Deals with price alerts
- Event discovery

### Tier 2 — Trip Planning & Management
- Trip creation with state machine (Draft → Upcoming → Ongoing → Past)
- Trip collaboration (up to 5 travelers, role-based)
- Boarding pass / ticket scanning (OCR via Claude/Gemini)
- Email import (forward confirmations)
- **Smart Plan: One-tap AI generates 6 modules:**
  - Day-by-day itinerary
  - AI packing list (weather-aware)
  - Safety intelligence (4-API parallel queries)
  - Language kit (120+ phrases with phonetics + TTS)
  - Documents checklist (visa/passport/insurance)
  - Cultural Do's & Don'ts

### Tier 3 — During-Trip Intelligence
- AI Vision (scan menus, landmarks, signs — translate + speak)
- AI Chat Assistant (14 real-time tools: flights, weather, currency, maps, directions)
- City navigation with Mapbox 3D + voice
- Expense tracking with receipt scanning
- Departure Advisor (when-to-leave calculator)
- Travel Journal (block editor with photos)
- Flight compensation claims (EU261, US DOT, APPR)

### Tier 4 — Safety & Emergency
- Safety Intelligence (real-time risk assessment, 4 parallel APIs)
- SOS System (emergency contacts, embassy, police — SMS + email + location)
- Geofencing + check-in system
- Solo female / LGBTQ+ safety filters

### Tier 5 — Community & Social
- Groups, buddy matching, events
- Local Guides (KYC-verified)
- Pulse activities (real-time meetups)
- DM and group chat
- Content posts with reactions

---

## The Pricing Philosophy

### Why NOT Monthly
- Average American takes 2-3 trips/year
- A $9.99/month subscription = $120/year for someone who travels 3x
- Users feel ripped off paying during months they don't travel
- **Churn rate for monthly travel subscriptions: 60-70% within 3 months**

### Why Quarterly Makes Sense
- A trip cycle is typically: 2-4 weeks planning → 1-2 weeks traveling → 1 week post-trip
- That's ~2 months of active use per trip
- **Quarterly billing covers one full trip cycle perfectly**
- Users feel they're paying for a trip, not a calendar month
- Quarterly is rare in the market = **differentiation**

### The "Trip Pass" Mental Model
Instead of "subscription," frame it as a **Trip Pass** — you're buying AI intelligence for your next adventure. This reframes the value from "software access" to "travel companion."

---

## Recommended Pricing Structure

### Tier 1: **Explorer** (Free)
> *"See what Guidera can do"*

**Target:** Casual browsers, first-time users, infrequent travelers

| Feature | Limit |
|---------|-------|
| Explore homepage (all 12 sections) | Unlimited |
| Travel deals browsing + saving | Unlimited |
| Local experiences browsing | Unlimited |
| Trip Snapshot (AI destination preview) | **2 per month** |
| Trip creation | **1 active trip** |
| Basic trip details (dates, destination, notes) | Full |
| Community browsing (read-only groups) | View only |
| AI Chat Assistant | **5 messages/day** |
| Smart Plan generation | **None** |
| AI Vision | **None** |
| Trip collaboration | **None** |
| Expense tracking | **None** |

**Why this works:**
- Trip Snapshots are the gateway drug — 2/month lets them taste the AI
- 1 active trip with no Smart Plan creates natural upgrade motivation
- 5 AI chat messages/day lets them experience the assistant
- They see community content but can't engage deeply
- Deals and experiences are free because they generate affiliate revenue

---

### Tier 2: **Voyager** (Premium Individual)
> *"Your AI travel companion for every trip"*

**Target:** Leisure travelers (2-4 trips/year), couples, families

| Feature | Access |
|---------|--------|
| Everything in Explorer | Unlimited |
| Trip Snapshot | **Unlimited** |
| Active trips | **5 simultaneous** |
| Smart Plan generation (6 AI modules) | **3 per month** (36/yr) |
| AI Chat Assistant | **Unlimited** |
| AI Vision (menu scan, landmark, translation) | **Unlimited** |
| Text-to-Speech (order builder, phrases) | **Unlimited** |
| Trip collaboration (invite up to 5 people) | Full |
| Expense tracking + receipt scanning | Full |
| Travel Journal | Full |
| Departure Advisor | Full |
| Flight compensation claims | Full |
| Safety Intelligence (full 4-API profile) | Full |
| SOS System | Full |
| Language Kit with TTS | Full |
| Community (post, react, join groups, DM) | Full |
| Buddy Matching | Full |
| Offline trip data (itinerary, contacts, docs) | Full |
| Priority customer support | Full |
| Dark mode | Full |

**Pricing:**

| Billing Cycle | Price | Per Month | Savings |
|---------------|-------|-----------|---------|
| **Quarterly** (recommended) | **$14.99 / 3 months** | $5.00/mo | — |
| **Annual** | **$39.99 / year** | $3.33/mo | **33% off** |
| **Monthly** | **$6.99 / month** | $6.99/mo | — |

**Why these prices:**
- **$14.99/quarter** is the hero price — covers one trip cycle, feels affordable
- Cheaper than TripIt Pro ($49/yr) while offering 10x more features
- Comparable to Wanderlog Pro ($40/yr) but includes AI Vision, Safety, Chat, Community
- $6.99/month available for those who want flexibility but positioned as "not the deal"
- **Quarterly is the default/recommended** in the UI — this is the sticky play

**Why quarterly is sticky:**
- User signs up before Trip #1 → uses it heavily → trip ends
- 2 months later, Trip #2 is coming → they're still subscribed → zero friction
- If annual: they might forget the app between trips and feel it was wasted
- If monthly: they cancel after the trip and forget to resubscribe

---

### Tier 3: **Navigator** (Premium Plus / Power Traveler)
> *"For travelers who never stop exploring"*

**Target:** Frequent travelers (5+ trips/year), digital nomads, travel content creators

| Feature | Access |
|---------|--------|
| Everything in Voyager | Unlimited |
| Smart Plan generation | **Unlimited** |
| Active trips | **Unlimited** |
| Trip collaboration | **Up to 10 people** |
| AI generation priority (faster processing) | Yes |
| Advanced expense analytics + charts | Full |
| Export itinerary (PDF, share link) | Full |
| Trip recap (shareable end-of-trip card) | Full |
| Early access to new features | Yes |
| Navigator badge in community | Yes |
| Verified local guide applications | Priority review |

**Pricing:**

| Billing Cycle | Price | Per Month | Savings |
|---------------|-------|-----------|---------|
| **Quarterly** | **$24.99 / 3 months** | $8.33/mo | — |
| **Annual** (recommended) | **$69.99 / year** | $5.83/mo | **30% off** |
| **Monthly** | **$9.99 / month** | $9.99/mo | — |

**Why this tier exists:**
- Power users who generate 10+ Smart Plans/month need unlimited access
- Digital nomads who are always traveling want unlimited trips
- The "badge" in community creates social proof and aspiration
- $69.99/yr is still cheaper than TripIt Pro + Wanderlog Pro combined ($89/yr)

---

### Tier 4: **Business Traveler** (V2 — Post-Launch)
> *"Travel smarter for work"*

**Target:** Business travelers, small teams, executive assistants, travel managers

| Feature | Access |
|---------|--------|
| Everything in Navigator | Unlimited |
| **Business expense categorization** (meals, transport, lodging, client entertainment) | Full |
| **Expense reports** (exportable PDF/CSV) | Full |
| **Per diem tracking** by destination | Full |
| **Receipt auto-categorization** by expense type | Full |
| **Team trip coordination** (shared itineraries, status updates) | Full |
| **Corporate travel policy compliance** (budget limits, preferred vendors) | Full |
| **Multi-currency expense reconciliation** | Full |
| **Calendar integration** (sync with Google/Outlook) | Full |
| **Admin dashboard** (team overview, expense approval) | Full |
| **SSO / Enterprise authentication** | Full |
| **Priority SOS** (dedicated emergency line) | Full |
| **Travel analytics** (spend patterns, savings reports) | Full |

**Pricing:**

| Plan | Price | Billing |
|------|-------|---------|
| **Individual Business** | **$14.99/month** or **$119.99/year** | Monthly or Annual |
| **Team** (5-20 seats) | **$12.99/user/month** | Annual commitment |
| **Enterprise** (20+ seats) | **Custom pricing** | Annual contract |

**Why Business is a separate tier:**
- Corporate travel is a different buying motion (expensed, not personal spend)
- Features like expense reports, per diem, and policy compliance are B2B-specific
- $14.99/month for business is trivially expensable
- Team pricing drives seat expansion (land and expand)
- This tier launches in V2 after core product is validated

---

## Revenue Projections & Unit Economics

### Cost per User (AI infrastructure)

| AI Feature | Avg Cost/Use | Free Tier Cost/User/Mo | Voyager Cost/User/Mo |
|------------|-------------|----------------------|---------------------|
| Trip Snapshot | ~$0.03 | $0.06 (2 uses) | $0.30 (10 uses avg) |
| Smart Plan (6 modules) | ~$0.15 | $0 | $0.45 (3 uses) |
| AI Chat | ~$0.005/msg | $0.025 (5 msgs) | $0.50 (100 msgs avg) |
| AI Vision | ~$0.02/scan | $0 | $0.20 (10 scans avg) |
| TTS | ~$0.01/utterance | $0 | $0.10 (10 uses avg) |
| **Total AI cost** | | **~$0.09/user/mo** | **~$1.55/user/mo** |

### Revenue per User

| Tier | Monthly Rev | Annual Rev | AI Cost/Mo | Gross Margin |
|------|-------------|------------|------------|-------------|
| Explorer (Free) | $0 | $0 | $0.09 | -$0.09 (loss leader) |
| Voyager (Quarterly) | $5.00 | $60 | $1.55 | **69%** |
| Voyager (Annual) | $3.33 | $40 | $1.55 | **53%** |
| Navigator (Annual) | $5.83 | $70 | $2.50 | **57%** |
| Business | $14.99 | $180 | $3.00 | **80%** |

**Target conversion rate:** 8-12% Free → Voyager (industry avg for freemium travel apps: 5-8%)

### Additional Revenue Streams

| Stream | Mechanism | Est. Revenue |
|--------|-----------|-------------|
| **Affiliate commissions** | Viator experiences, hotel/flight redirects, deal clicks | $0.50-2.00/booking |
| **Featured deals** | Travel brands pay for premium placement in Deals section | CPM-based |
| **Local Guide fees** | Guides pay listing fee or commission on bookings | 10-15% commission |
| **Referral program** | Users earn $5 credit, acquisition cost offset | CAC reduction |
| **eSIM partnerships** (V2) | Commission on Airalo/Holafly eSIM sales | $1-3/sale |
| **Travel insurance** (V2) | White-label insurance via Safety module | $2-5/policy |

---

## Conversion Strategy — The "Aha Moments"

### Free → Voyager Conversion Triggers

1. **Trip Snapshot wall** — After 2 free snapshots, show "Unlock unlimited AI snapshots"
2. **Smart Plan tease** — Trip created → show "Generate your AI Smart Plan" → paywall
3. **AI Vision tease** — Camera opened → "AI Vision is a Voyager feature" → free 1st scan
4. **Collaboration block** — Try to invite someone → "Invite travelers with Voyager"
5. **Safety urgency** — Show partial safety score → "Get full safety intel with Voyager"
6. **Trip count limit** — Try to create 2nd trip → upgrade prompt

### Upgrade Flow Design
```
Soft paywall → Show feature benefit → 
  "Start 7-day free trial" (quarterly) or
  "Get 33% off with annual" →
  Apple/Google IAP → Instant access
```

### Trial Strategy
- **7-day free trial** on first Voyager subscription
- Trial includes full Voyager features
- Converts to quarterly ($14.99) unless user switches to annual
- No trial on monthly (monthly is the "I don't want commitment" option)

---

## Pricing Display in App

### Membership Screen Redesign

The current `rewards.service.ts` has 4 tiers (Free/Silver/Gold/Platinum) with placeholder pricing ($9.99/$19.99/$49.99 monthly). This needs to be updated to match the new model:

| Current (rewards.service.ts) | New Model |
|------------------------------|-----------|
| Free / Explorer ($0) | **Explorer** (Free) |
| Silver / Voyager ($9.99/mo) | **Voyager** ($6.99/mo · $14.99/qtr · $39.99/yr) |
| Gold / Navigator ($19.99/mo) | **Navigator** ($9.99/mo · $24.99/qtr · $69.99/yr) |
| Platinum / Elite ($49.99/mo) | **Business** ($14.99/mo · $119.99/yr) — V2 |

### Recommended UI Layout (Membership Screen)

```
┌─────────────────────────────────────┐
│  🌍  You're on Explorer (Free)      │
│  ─────────────────────────────       │
│  Upgrade to unlock AI-powered        │
│  trip planning, vision & more        │
│                                      │
│  ┌── [Quarterly] ──┐  ┌── Annual ──┐│
│  │ $14.99 / 3 mo   │  │ $39.99/yr  ││
│  │ RECOMMENDED      │  │ Save 33%   ││
│  └─────────────────┘  └────────────┘│
│                                      │
│  ✓ Unlimited AI Trip Snapshots       │
│  ✓ Smart Plan (3/mo)                 │
│  ✓ AI Vision & Translation           │
│  ✓ AI Chat Assistant (unlimited)     │
│  ✓ Trip Collaboration (5 people)     │
│  ✓ Safety Intelligence & SOS         │
│  ✓ Expense Tracking                  │
│  ✓ Offline Trip Data                 │
│                                      │
│  [ Start 7-Day Free Trial ]          │
│                                      │
│  Need more? See Navigator →          │
└─────────────────────────────────────┘
```

---

## Family & Group Considerations

### How Collaboration Works with Pricing

| Scenario | Who Pays | What Collaborators Get |
|----------|----------|-----------------------|
| Trip owner is Voyager | Owner pays | Collaborators get **read + edit access** to the shared trip (itinerary, expenses, docs) without their own subscription |
| Collaborator wants AI features | Collaborator pays | Their own AI Chat, Vision, Smart Plans on their trips |
| Family of 4 traveling | 1 Voyager sub | All 4 can view/edit the shared trip. Only the subscriber generates AI content |

**This is the Lambus model** — one subscription benefits the whole trip. This is generous and reduces friction for group travel.

### Future: Family Plan (V2)
- **$59.99/year** for up to 4 family members
- Each member gets their own Voyager-level access
- Shared family trip library
- This targets families where multiple people plan independently

---

## Referral Program (Revenue Accelerator)

| Action | Referrer Gets | Referred Gets |
|--------|--------------|---------------|
| Friend signs up (free) | 100 points | — |
| Friend upgrades to Voyager | **$5 credit** + 500 points | **7-day extended trial** (14 days total) |
| Friend upgrades to Navigator | **$10 credit** | **14-day trial** |

Credits apply to next billing cycle. Points accumulate toward tier badges.

---

## Implementation Roadmap

### Phase 1 — Launch (Now)
- [ ] All features available to all users (open beta period)
- [ ] Soft paywall indicators ("This is a Voyager feature" badges)
- [ ] Usage tracking for snapshots, AI chat, Smart Plans
- [ ] Membership screen shows tiers but upgrade = "Coming Soon"

### Phase 2 — Paywall Activation (4-6 weeks post-launch)
- [ ] Integrate RevenueCat or Stripe for Apple/Google IAP
- [ ] Enforce free tier limits (2 snapshots, 1 trip, 5 chat/day)
- [ ] Enable 7-day free trial for Voyager quarterly
- [ ] A/B test quarterly vs annual as default selection
- [ ] Referral program live

### Phase 3 — Business Tier (V2)
- [ ] Business expense categorization & reports
- [ ] Team admin dashboard
- [ ] Calendar integration
- [ ] SSO / enterprise auth
- [ ] Per diem tracking
- [ ] Team pricing page

### Phase 4 — Revenue Optimization
- [ ] Affiliate revenue tracking (Viator, hotel redirects)
- [ ] Featured deals program for brands
- [ ] eSIM partnership integration
- [ ] Travel insurance white-label
- [ ] Family plan launch
- [ ] Annual price testing ($34.99 vs $39.99 vs $44.99)

---

## Summary — The Pricing at a Glance

| Tier | Price | Best For | Smart Plans | AI Chat | AI Vision |
|------|-------|----------|-------------|---------|-----------|
| **Explorer** | Free | Casual browsers | None | 5/day | None |
| **Voyager** | $14.99/qtr · $39.99/yr | Leisure travelers | 3/mo | Unlimited | Unlimited |
| **Navigator** | $24.99/qtr · $69.99/yr | Frequent travelers | Unlimited | Unlimited | Unlimited |
| **Business** | $14.99/mo · $119.99/yr | Corporate travel | Unlimited | Unlimited | Unlimited |

### Why This Wins

1. **Quarterly billing** = sticky (covers a trip cycle, no wasted months)
2. **$39.99/year** undercuts TripIt Pro ($49) while offering 10x the features
3. **Free tier is generous enough** to hook users but limited enough to convert
4. **Collaboration is free for group members** = viral growth
5. **Business tier** taps into $50B+ corporate travel market
6. **Affiliate revenue** means even free users generate income
7. **No lifetime plan** = sustainable recurring revenue

---

*This pricing strategy should be validated with user testing data from the beta period. Track which features users engage with most, where they hit paywalls, and what conversion rates look like before finalizing prices.*
