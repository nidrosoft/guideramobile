# Guidera Landing Page — Build Specification

> **Purpose:** This document is a complete system prompt for building the Guidera product landing page. Hand this to Cursor/any AI coding assistant and it should produce a stunning, production-ready landing page.

---

## BRAND IDENTITY

**Product Name:** Guidera  
**Tagline:** Travel like you belong there.  
**Category:** AI-Powered Travel Intelligence Platform  
**Stage:** Pre-launch — 10,000+ waitlist signups  
**Tone:** Premium, confident, warm, futuristic but human. Think Stripe meets Airbnb meets Apple. Not corporate. Not gimmicky. Aspirational but grounded.  
**Primary Color:** `#3FC39E` (teal/emerald green)  
**Gradient:** `#3FC39E → #2D9A7A`  
**Dark Background:** `#0A0A0A` to `#121212`  
**Typography:** Inter or equivalent premium sans-serif  

---

## TECH STACK FOR THE LANDING PAGE

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **3D/Visual effects:** Consider subtle particle effects, gradient mesh backgrounds, or glassmorphism elements
- **Deployment:** Vercel
- **Form:** Waitlist email capture → Supabase `waitlist` table or simple API endpoint

---

## DESIGN PHILOSOPHY

This is NOT a template landing page. This is a **product experience** compressed into a scroll. Every section should feel like opening the app itself.

**Principles:**
1. **Dark-first design** — Deep black/charcoal backgrounds with luminous accents. The teal `#3FC39E` should glow against the dark like a notification from the future.
2. **Cinematic pacing** — Each scroll section reveals a new capability with dramatic timing. Sections should feel like scenes in a film, not bullet points on a slide.
3. **Interactive proof** — Don't just describe features. Show mockups that feel alive. Phone frames with animated UI. Cards that tilt on hover. Itineraries that type themselves out.
4. **Social proof woven in** — Not a testimonial section at the bottom. Micro-proof scattered throughout: "10,000+ travelers on the waitlist", traveler avatars, satisfaction metrics.
5. **One CTA, repeated** — "Join the Waitlist" is the only action. It appears in the hero, mid-page, and footer. Email input field. No friction.

---

## PAGE STRUCTURE (Top to Bottom)

---

### SECTION 1: HERO — "The First 5 Seconds"

**Layout:** Full viewport height. Dark background. Centered content.

**Headline (large, bold, multi-line):**
```
The travel app that knows
where you're going
before you do.
```

**Sub-headline (softer, smaller):**
```
Guidera uses AI to plan your entire trip — from a personalized day-by-day
itinerary to cultural do's and don'ts, real-time safety alerts, and a
packing list that knows your profession, your allergies, and the weather.
One tap. Your whole trip. Intelligently handled.
```

**CTA:** Email input + "Join 10,000+ on the Waitlist" button (teal gradient)

**Visual:** A floating phone mockup (iPhone 15 Pro frame) showing the Guidera app's trip detail screen — the hero image of a destination with the Trip Hub plugins visible below. The phone should have a subtle 3D tilt/parallax on mouse move. Behind the phone, a soft radial gradient glow in teal.

**Micro-proof badge** below CTA:
```
✦ 10,847 travelers already waiting  ·  Launching 2026
```

**Navigation bar** (sticky, transparent → solid on scroll):
- Logo (left)
- Links: Features · How It Works · Community · Pricing
- "Join Waitlist" button (right)

---

### SECTION 2: THE PROBLEM — "Travel is Broken"

**Layout:** Dark background. Left-aligned text with subtle animated icons on the right.

**Section label (small, uppercase, teal):** `THE PROBLEM`

**Headline:**
```
You use 7 apps to plan one trip.
And none of them talk to each other.
```

**Body (3 pain-point cards, horizontally scrollable on mobile):**

Card 1:
```
📋 Itinerary in Google Docs
     Hotel confirmation in email
     Flight times on another app
     Packing list in Notes
     Budget in a spreadsheet
     
     Sound familiar?
```

Card 2:
```
🌍 You land in a new country.
     You don't know the customs.
     You don't know what's safe.
     You don't know what to pack
     for the weather next Tuesday.
     
     You're winging it.
```

Card 3:
```
👥 Your travel buddy has different
     flight times, a different hotel,
     and zero idea what you planned.
     
     Syncing = a group chat nightmare.
```

**Transition text (centered, glowing teal):**
```
What if one app handled all of it — and actually knew you?
```

---

### SECTION 3: THE SOLUTION — "Meet Guidera"

**Layout:** Dramatic reveal. The word "Guidera" should animate in with a glow effect. Dark → slight gradient shift.

**Section label:** `THE SOLUTION`

**Headline:**
```
One app. Your entire trip.
Intelligently planned.
```

**Body:**
```
Guidera is the first travel platform that combines AI trip planning,
real-time intelligence, booking management, and a global traveler
community — all in one place. It doesn't just organize your trip.
It understands you.
```

**Visual:** An animated demo showing the "Generate Smart Plan" button being tapped → the Trip Hub filling in with all 7 plugins (Trip Planner, Packing, Journal, Expenses, Compensation, Do's & Don'ts, Safety) — each icon lighting up sequentially with a satisfying animation.

---

### SECTION 4: KILLER FEATURE #1 — "AI Smart Plan"

**Layout:** Split — phone mockup left, text right. Alternate sides for each feature section.

**Section label:** `AI-POWERED`

**Headline:**
```
One tap. Seven modules.
Your trip, completely handled.
```

**Body:**
```
Tap "Generate Smart Plan" and Guidera's AI engine builds your
entire trip management system in seconds. It reads your profile —
your nationality, your diet, your health conditions, your profession,
your travel style — and creates:
```

**Feature bullets (with icons, each on its own line, animated stagger-in):**

```
📅  Day-by-Day Itinerary
    Restaurants, landmarks, hidden gems — scheduled around your bookings
    with real travel times between stops.

🧳  Smart Packing List
    Weather-aware. Profession-aware. Allergy-aware. Knows you need a
    tripod if you're a photographer and a prayer mat if you observe.

📖  Travel Journal
    Capture photos, voice notes, and memories as you go. Your trip story,
    beautifully preserved day by day.

💰  Expense Tracker
    Set a budget. Log spending by category. See where your money goes
    without touching a spreadsheet.

🛡️  Compensation Tracker
    Flight delayed 3 hours? Baggage lost? Guidera knows your rights
    and tracks your claim automatically.

🙏  Cultural Do's & Don'ts
    What to wear. How to greet. What never to do. Generated for YOUR
    destination, YOUR trip type, YOUR background.

🚨  Safety Hub
    Emergency numbers. Embassy info. Scam alerts. Area safety ratings.
    An SOS button. And a preparation checklist before you leave.
```

**Visual accent:** Each feature should have a small phone-screen mockup snippet showing the actual UI for that plugin.

---

### SECTION 5: KILLER FEATURE #2 — "It Actually Knows You"

**Section label:** `PERSONALIZATION ENGINE`

**Headline:**
```
Not generic travel tips.
Your travel tips.
```

**Body:**
```
Guidera builds a Travel DNA — a living profile of who you are as a
traveler. Your nationality, languages, dietary needs, health conditions,
religious observance, activity level, profession, packing style, and
budget preferences. Every piece of content the AI generates is filtered
through YOUR identity.
```

**Interactive visual concept:** A "Travel DNA" card that morphs/personalizes as different traveler personas are shown:

```
Persona 1: "Amina, 28 · Nigerian-American · Muslim · Photographer · Budget traveler"
→ Shows: halal restaurants, modest dress tips, camera gear in packing list, mosque locations

Persona 2: "Carlos, 35 · Mexican · Couple · Luxury · Foodie"  
→ Shows: fine dining reservations, romantic spots, premium hotel deals, wine customs

Persona 3: "Yuki, 22 · Japanese · Solo · Adventure · First-time traveler"
→ Shows: hostel deals, safety alerts, beginner phrasebook, travel insurance reminder
```

**Key stat (large, centered):**
```
"The same destination. Three completely different plans.
Because no two travelers are the same."
```

---

### SECTION 6: KILLER FEATURE #3 — "Scan. Import. Done."

**Section label:** `TRIP IMPORT`

**Headline:**
```
Already booked? Just scan it.
```

**Body:**
```
Take a photo of your boarding pass, hotel confirmation, or car rental
receipt. Guidera's AI vision reads it instantly and creates your trip —
flights, hotels, dates, confirmation numbers, everything. No typing.

Or connect your email and we'll find your bookings automatically.
```

**Visual:** An animated sequence showing:
1. A boarding pass photo being "scanned"
2. Data extracting with a glowing outline effect
3. A trip card appearing with all the details filled in

---

### SECTION 7: KILLER FEATURE #4 — "Never Travel Alone"

**Section label:** `COMMUNITY`

**Headline:**
```
10 million travelers.
Zero strangers.
```

**Body:**
```
Guidera isn't just an app. It's a global community of travelers
who help each other. Find travel buddies heading to the same destination.
Join destination groups. Meet locals who know the hidden spots.
Connect with verified local guides who show you the real city.
```

**Feature bullets:**
```
🗺️  Live Map — See who's nearby and open to meeting
👥  Travel Groups — Join by destination, interest, or trip dates  
🤝  Buddy Matching — AI matches you with compatible travelers
🎫  Local Events — Meetups, tours, and experiences organized by the community
🏅  Verified Guides — Locals who've passed identity verification
💬  Real-Time Chat — Group chats, DMs, and meetup coordination
```

**Visual:** A map view mockup with traveler avatars clustered around a destination, with connection lines between matched travelers.

---

### SECTION 8: KILLER FEATURE #5 — "Deals That Know You"

**Section label:** `INTELLIGENCE ENGINE`

**Headline:**
```
Your heritage. Your holidays.
Your deals.
```

**Body:**
```
Most travel apps show the same deals to everyone. Guidera's intelligence
engine scans thousands of flights, hotels, and experiences — and ranks
every single one against YOUR profile.

A Nigerian-American in Houston sees flights to Lagos during Detty December.
A French couple in Paris sees romantic getaways to Santorini.
A budget backpacker sees hostels, not five-star resorts.
```

**Visual:** A deal card UI that morphs to show different personalized results for different user profiles.

**Key stat:**
```
"We scan 50+ providers. You see only what matters to you."
```

---

### SECTION 9: REAL-TIME INTELLIGENCE — "Your Trip's Nervous System"

**Section label:** `REAL-TIME`

**Headline:**
```
Guidera watches your trip
so you don't have to.
```

**Feature grid (2x3 cards):**

```
✈️  Flight Tracking          🌦️  Weather Alerts
    Gate changes, delays,         Rain tomorrow?
    cancellations — instant.      We'll adjust your plan.

💱  Currency Rates            🚨  Safety Alerts  
    Live exchange rates           Travel advisories and
    for your destination.         area safety updates.

⏰  Smart Reminders           📋  Document Checker
    "Leave now to make           Passport expiring?
    your 5 PM tour."             Visa needed? We'll tell you.
```

---

### SECTION 10: AR NAVIGATION (Futuristic Teaser)

**Section label:** `COMING SOON`

**Headline:**
```
Point your phone.
See the way.
```

**Body:**
```
Lost in the airport? Point your camera and follow the AR arrows to your
gate. Exploring a new city? See restaurant ratings, landmark info, and
directions overlaid on the real world. Navigation reimagined.
```

**Visual:** A phone showing an AR camera view with floating directional arrows and POI labels overlaid on a city street scene. This should feel futuristic and aspirational.

---

### SECTION 11: SOCIAL PROOF / WAITLIST MOMENTUM

**Layout:** Dark background with a subtle particle effect or floating traveler avatars.

**Headline:**
```
10,847 travelers are already waiting.
```

**Sub-headline:**
```
From 127 countries. Solo travelers, families, digital nomads,
honeymooners, and business travelers. All waiting for the same thing:
a travel app that actually gets it.
```

**Visual elements:**
- A world map with glowing dots representing waitlist signups
- Scrolling avatar strip of diverse traveler profile photos (stock/generated)
- Country flags floating subtly

**CTA (large):** Email input + "Reserve My Spot" button

---

### SECTION 12: PRICING TEASER

**Layout:** Clean, centered. Two cards side by side.

**Section label:** `PRICING`

**Headline:**
```
Free to start. Premium to unlock everything.
```

**Cards:**

**Free Plan:**
```
Guidera Free
$0 / forever

✓  1 AI Smart Plan per year
✓  Trip management & bookings
✓  Community access
✓  Basic packing list
✓  Cultural tips
✓  Safety alerts

[Join Waitlist]
```

**Premium Plan:**
```
Guidera Pro
$9.99/mo or $79.99/yr

✓  Unlimited AI Smart Plans
✓  Full Trip Hub (all 7 modules)
✓  Real-time flight tracking
✓  AR Navigation
✓  Priority deal alerts
✓  Offline trip access
✓  Premium support

Save 33% annually

[Join Waitlist — Get 3 Months Free]
```

**Note:** Add a small badge on the Pro card: "Early waitlist members get 3 months free"

---

### SECTION 13: FOOTER CTA — "The Final Push"

**Layout:** Full-width dark section with the teal gradient glow behind text.

**Headline (large):**
```
Stop planning trips.
Start living them.
```

**Sub-headline:**
```
Join 10,000+ travelers who are done with scattered itineraries,
missed connections, and winging it in foreign countries.
Guidera handles the chaos. You handle the adventure.
```

**CTA:** Email input + "Join the Waitlist" button

**Below CTA:**
```
🔒 No spam. Unsubscribe anytime. We respect your inbox like we respect your travel style.
```

---

### SECTION 14: FOOTER

**Layout:** Standard footer with logo, links, and social.

**Columns:**
- **Product:** Features · Pricing · Roadmap · Changelog
- **Company:** About · Blog · Careers · Press
- **Legal:** Privacy Policy · Terms of Service · Cookie Policy
- **Connect:** Twitter/X · Instagram · TikTok · Discord

**Bottom bar:**
```
© 2026 Guidera Inc. · Made with ❤️ for travelers everywhere
```

---

## ANIMATION & INTERACTION NOTES

1. **Hero phone mockup:** Subtle 3D tilt following cursor position (CSS perspective transform). On mobile, gentle auto-rotate.
2. **Section reveals:** Each section fades + slides up as user scrolls into view (Framer Motion `whileInView`).
3. **Feature bullets:** Stagger animation — each bullet appears 100ms after the previous one.
4. **Smart Plan demo:** Animated sequence where 7 plugin icons light up one by one in a circle pattern.
5. **Travel DNA card:** Auto-cycles between 3 personas every 4 seconds, with a smooth crossfade.
6. **Scan animation:** A "scanning" laser line sweeps across a boarding pass image, then data points fly out.
7. **World map:** SVG world map with pulsing dots that slowly accumulate over time.
8. **Scroll progress:** A thin teal progress bar at the very top of the page showing scroll completion.
9. **Hover effects:** Cards tilt slightly on hover (3D transform). Buttons glow on hover.
10. **Loading state:** A brief animated Guidera logo before the page renders (optional, for dramatic effect).

---

## RESPONSIVE BEHAVIOR

- **Desktop (1200px+):** Full experience with side-by-side layouts, large phone mockups, and 3D effects.
- **Tablet (768-1199px):** Stacked layouts where needed, slightly smaller phone mockups.
- **Mobile (< 768px):** Fully stacked. Phone mockups become full-width cards. Horizontal scroll sections become vertical cards. All animations simplified for performance.

---

## SEO & META

```html
<title>Guidera — Travel Like You Belong There</title>
<meta name="description" content="The AI-powered travel app that plans your entire trip — from a personalized itinerary to safety alerts, packing lists, and a global traveler community. Join 10,000+ on the waitlist." />
<meta property="og:title" content="Guidera — Travel Like You Belong There" />
<meta property="og:description" content="One tap. Your whole trip. Intelligently handled. AI itineraries, smart packing, cultural guidance, real-time alerts, and a community of 10M+ travelers." />
<meta property="og:image" content="/og-image.jpg" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## WAITLIST FORM BEHAVIOR

- **Input:** Email address field
- **Validation:** Client-side email format check
- **On submit:**
  1. POST to `/api/waitlist` → Insert into Supabase `waitlist` table (email, timestamp, referral source)
  2. Show success state: "You're in! 🎉 Check your email for a confirmation."
  3. Optionally trigger a welcome email via Resend/Postmark
- **Duplicate handling:** If email already exists, show: "You're already on the list! We'll notify you at launch."
- **Referral tracking:** Append `?ref=` query param for tracking sources

---

## FINAL NOTES

- The landing page should load in under 2 seconds. Optimize images (WebP), lazy-load below-fold sections, minimize JS bundle.
- All phone mockups should use a realistic iPhone 15 Pro frame. Screenshots from the actual app are ideal; if not available, use high-fidelity mock screenshots matching the app's dark/light UI.
- The overall feeling should be: "This isn't just another travel app. This is what travel apps should have been all along."
- Every word of copy should earn its place. No filler. No "leverage synergies." Real human language for real travelers.
