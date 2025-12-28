# 🚀 GUIDERA LANDING PAGE - COMPLETE SPECIFICATION

> **Purpose**: System prompt for building the Guidera landing page
> **Target**: Series A fundraising ($5M) - YC-backed startup
> **Tone**: Premium, trustworthy, innovative, human-centered
> **Goal**: Drive app downloads, waitlist signups, and investor confidence

---

## 📋 TABLE OF CONTENTS

1. [Design System](#design-system)
2. [Technical Stack](#technical-stack)
3. [Navigation](#navigation)
4. [Section 1: Hero](#section-1-hero)
5. [Section 2: Social Proof Bar](#section-2-social-proof-bar)
6. [Section 3: The Problem](#section-3-the-problem)
7. [Section 4: The Solution](#section-4-the-solution)
8. [Section 5: Core Features](#section-5-core-features)
9. [Section 6: How It Works](#section-6-how-it-works)
10. [Section 7: App Showcase](#section-7-app-showcase)
11. [Section 8: Testimonials](#section-8-testimonials)
12. [Section 9: Security & Trust](#section-9-security--trust)
13. [Section 10: Pricing](#section-10-pricing)
14. [Section 11: FAQ](#section-11-faq)
15. [Section 12: Final CTA](#section-12-final-cta)
16. [Section 13: Footer](#section-13-footer)
17. [Animations & Interactions](#animations--interactions)

---

## 🎨 DESIGN SYSTEM

### Brand Colors
```css
--primary: #7257FF;           /* Main brand purple */
--primary-dark: #5336E2;      /* Darker purple */
--primary-darker: #2E1E7C;    /* Deepest purple */
--primary-light: #9B85FF;     /* Light purple */
--primary-subtle: #F0EDFF;    /* Very light purple */

--gradient-primary: linear-gradient(135deg, #7257FF 0%, #5336E2 50%, #2E1E7C 100%);
--gradient-hero: linear-gradient(180deg, #7257FF 0%, #2E1E7C 100%);

--white: #FFFFFF;
--background: #F4F6F7;
--text-primary: #111827;
--text-secondary: #6B7280;
--border: #E5E7EB;

--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Typography
```css
--font-primary: 'Inter', -apple-system, sans-serif;
--font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;

/* Sizes: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36), 5xl(48), 6xl(60), 7xl(72) */
```

### Icons
**Library**: Iconsax (`iconsax-react`)
- Bold variant for primary actions
- Outline variant for secondary elements

---

## 🛠️ TECHNICAL STACK

```json
{
  "framework": "Next.js 14+ (App Router)",
  "styling": "Tailwind CSS",
  "animations": "Framer Motion",
  "icons": "iconsax-react",
  "3d": "Three.js / React Three Fiber (optional)",
  "forms": "React Hook Form + Zod",
  "deployment": "Vercel"
}
```

---

## 🧭 NAVIGATION

**Fixed header** - 72px height, transparent on hero, white with blur on scroll

```
[Logo]     Features  How It Works  Pricing  About     [Download App]
```

- Logo: Guidera wordmark, 32px height
- Links: Medium weight, hover primary color
- CTA: Primary gradient button with download icon
- Mobile: Hamburger → full-screen overlay

---

## 🦸 SECTION 1: HERO

### Layout
Full viewport height, gradient background (#7257FF → #2E1E7C)

### Content

**YC Badge** (top center):
```
[YC Logo] Backed by Y Combinator
```

**Headline** (H1):
```
Travel Smarter.
Explore Fearlessly.
```
- Font: 72px desktop, 48px mobile, extrabold
- Animation: Words fade in sequentially

**Subheadline**:
```
Your AI-powered travel companion that plans, protects, and personalizes every journey.
```
- Font: 20px, normal weight, 85% white opacity

**CTA Buttons**:
```
[📱 Download App]        [Join 50,000+ Waitlist →]
```
- Primary: White bg, primary text, shadow
- Secondary: Transparent, white border

**Phone Mockup**:
- 3D iPhone showing app home screen
- Floating animation (subtle up/down)
- Parallax on mouse move
- Glow effect behind

**Scroll Indicator**: Bouncing arrow at bottom

### Animation Sequence
0.0s → Background | 0.2s → YC badge | 0.4s → "Travel Smarter" | 0.6s → "Explore Fearlessly" | 0.8s → Subheadline | 1.0s → CTAs | 1.2s → Phone mockup

---

## 🏆 SECTION 2: SOCIAL PROOF BAR

```
Featured in:   [YC] [TechCrunch] [Forbes] [Wired] [Product Hunt]
```

- White background, 32px padding
- Logos: Grayscale, color on hover
- Animation: Logos slide in on scroll

---

## 😫 SECTION 3: THE PROBLEM

### Research-Backed Pain Points
| Problem | Stat | Quote |
|---------|------|-------|
| Planning overwhelm | 78% | "I spent 6 hours planning and I'm still not sure..." |
| Safety anxiety | 65% | "Is this area safe? I have no idea..." |
| Cultural confusion | 71% | "I accidentally offended someone and didn't know why..." |
| Booking fragmentation | 82% | "Why do I need 5 different apps to book one trip?" |
| Language barriers | 69% | "What does this menu even say?" |
| Budget surprises | 74% | "I went way over budget and didn't realize..." |

### Layout
```
                    Sound familiar?

   [Card 1]  [Card 2]  [Card 3]
   [Card 4]  [Card 5]  [Card 6]

              Travel shouldn't be this stressful.
```

- Cards: White bg, shadow, emoji + quote
- Animation: Cards fade up with stagger

---

## 💡 SECTION 4: THE SOLUTION

### Content
```
                    Meet Guidera

        The AI travel companion that handles everything—
        so you can focus on the adventure.

                [App Demo Video/GIF]

      ✓ Plan in minutes, not hours
      ✓ Stay safe with real-time alerts
      ✓ Book everything in one place
      ✓ Never get lost in translation
```

- Demo: 30-60s video or interactive mockup
- Checkmarks: Green TickCircle icons, staggered animation

---

## ⭐ SECTION 5: CORE FEATURES

### 6 Features (Problem → Solution)

| # | Feature | Problem Solved | Icon | Headline |
|---|---------|----------------|------|----------|
| 1 | AI Trip Planning | Planning overwhelm | `MagicStar` | Plan your perfect trip in minutes, not hours |
| 2 | Safety Alerts | Safety anxiety | `ShieldTick` | Travel with confidence, not worry |
| 3 | Cultural Intelligence | Cultural confusion | `Global` | Never accidentally offend again |
| 4 | Unified Booking | Booking fragmentation | `TicketStar` | Flights, hotels, cars, experiences. One app. |
| 5 | AR Translation | Language barriers | `Translate` | Point your camera. Understand everything. |
| 6 | Expense Tracking | Budget surprises | `Wallet` | Know exactly where your money goes |

### Layout (alternating)
```
[Phone Mockup]    [Content: Headline + Description + Bullets]
[Content]         [Phone Mockup]
[Phone Mockup]    [Content]
...
```

- Each feature block: 120px margin between
- Phone: 280px width, shadow, float animation
- Bullets: TickCircle icon + text

---

## 🔄 SECTION 6: HOW IT WORKS

```
              Get started in 3 simple steps

   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │   01    │ ─────── │   02    │ ─────── │   03    │
   │Download │         │Tell us  │         │Start    │
   │the app  │         │about you│         │exploring│
   └─────────┘         └─────────┘         └─────────┘

                  [Download Now — It's Free]
```

- Step cards: Background gray, centered text
- Numbers: 48px, primary color, 20% opacity
- Connector: Dashed line between steps
- Animation: Steps fade in sequentially, numbers count up

---

## 📱 SECTION 7: APP SHOWCASE

```
              See Guidera in action

   [Tab: Home]  [Tab: Planning]  [Tab: Booking]  [Tab: Safety]

                    [Phone Mockup]
                    (shows selected tab)
```

- Tab bar: White pill, active tab has primary bg
- Phone: 3D perspective, screen transitions on tab change
- Auto-rotate tabs every 5 seconds

---

## 💬 SECTION 8: TESTIMONIALS

```
              Loved by travelers worldwide

        ⭐⭐⭐⭐⭐ 4.9 rating  •  50,000+ downloads

   [Card 1]  [Card 2]  [Card 3]
        ← [Prev]  ● ● ●  [Next] →
```

### Sample Testimonials
1. **Sarah M.** 🇺🇸 — "Guidera saved my trip to Japan. The cultural tips helped me avoid so many awkward moments!"
2. **James K.** 🇬🇧 — "The safety alerts literally saved us from walking into a known scam area in Bangkok."
3. **Maria L.** 🇪🇸 — "Finally, one app that does everything. No more 10 tabs open trying to plan a trip."
4. **Priya S.** 🇮🇳 — "Traveling solo as a woman, the safety features give me peace of mind."

- Carousel: 3 visible desktop, 1 mobile
- Cards: Quote + name + country flag
- Auto-advance every 6 seconds

---

## 🔒 SECTION 9: SECURITY & TRUST

```
              Your privacy is our priority

   [🔒 End-to-End]  [🛡️ SOC 2]  [✓ GDPR]  [🌍 No Data Selling]
        Encryption    Compliant   Compliant

        "We never sell your data. Your travel plans stay yours."

                    [Read our Privacy Policy]
```

- Dark background (text-primary)
- Badge cards: Semi-transparent white
- Icons: 48px, primary-light color

---

## 💰 SECTION 10: PRICING

```
              Simple, transparent pricing
            Start free. Upgrade when you're ready.

   ┌─────────────────┐      ┌─────────────────┐
   │      FREE       │      │  ⭐ PREMIUM     │
   │       $0        │      │   $9.99/mo      │
   │    forever      │      │  or $79.99/yr   │
   │                 │      │                 │
   │ ✓ AI planning   │      │ Everything in   │
   │ ✓ Basic booking │      │ Free, plus:     │
   │ ✓ Safety alerts │      │                 │
   │ ✓ Cultural tips │      │ ✓ Unlimited AI  │
   │ ✓ 3 trips/month │      │ ✓ AR translate  │
   │                 │      │ ✓ Offline mode  │
   │ [Get Started]   │      │ ✓ Priority help │
   │                 │      │                 │
   │                 │      │ [Start Trial]   │
   └─────────────────┘      └─────────────────┘

          No ads • Cancel anytime • 24/7 support
```

- Premium card: Primary border, purple shadow, "MOST POPULAR" badge
- Toggle for monthly/yearly pricing

---

## ❓ SECTION 11: FAQ

### Questions (Accordion style)
1. **Is Guidera really free?** — Yes! Free tier includes AI planning, booking, safety alerts, cultural guides.
2. **How does AI trip planning work?** — Analyzes destination, dates, interests, budget → personalized itinerary in seconds.
3. **Is my data safe?** — End-to-end encryption, SOC 2 & GDPR compliant, never sell data.
4. **Can I use Guidera offline?** — Premium users can download trips, maps, translations.
5. **What countries does Guidera support?** — 190+ countries worldwide.
6. **How accurate are safety alerts?** — Aggregated from government sources, local reports, community feedback.
7. **Can I share my trip?** — Yes, share with travel companions for collaboration.
8. **What if I cancel subscription?** — Cancel anytime, keep access until billing period ends.

```
              Still have questions? [Contact us →]
```

---

## 🎯 SECTION 12: FINAL CTA

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                    ║
║              Ready to travel smarter?                              ║
║                                                                    ║
║     Join 50,000+ travelers who've discovered a better way.        ║
║                                                                    ║
║     [Apple App Store]        [Google Play Store]                   ║
║                                                                    ║
║                         — or —                                     ║
║                                                                    ║
║     [Enter your email for early access          ] [Join]           ║
║                                                                    ║
║              ✓ No spam  ✓ Unsubscribe anytime                     ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

- Container: Primary gradient, 32px border radius, large shadow
- App store badges: Official Apple/Google badges
- Email input: White, full-width, pill shape

---

## 🦶 SECTION 13: FOOTER

```
[Guidera Logo]                              [Twitter] [Instagram] [LinkedIn]

Product          Company          Legal           Download
─────────        ─────────        ─────────       ─────────
Features         About Us         Privacy         App Store
Pricing          Careers          Terms           Play Store
Safety           Press Kit        Cookies
Blog             Contact          GDPR

─────────────────────────────────────────────────────────────────────
© 2025 Guidera Inc. All rights reserved.        Made with ❤️ for travelers
```

- Dark background
- 4-column grid (collapses on mobile)
- Social icons: Twitter, Instagram, LinkedIn, TikTok

---

## ✨ ANIMATIONS & INTERACTIONS

### Global
- **Scroll animations**: Fade up + slide (Framer Motion `whileInView`)
- **Stagger children**: 0.1s delay between items
- **Hover states**: Scale 1.02-1.05, shadow increase
- **Page transitions**: Smooth scroll behavior

### Specific
- **Hero phone**: Float (translateY 10px, 4s infinite), parallax on mouse
- **Numbers**: Count up animation (0 → target)
- **Testimonial carousel**: Auto-advance, swipe support
- **FAQ accordion**: Height animation, icon rotation
- **CTA buttons**: Scale + shadow on hover
- **Background orbs**: Slow drift, color shift

### Performance
- Lazy load images below fold
- Intersection Observer for scroll animations
- Debounce scroll events
- Preload critical fonts

---

## 📱 RESPONSIVE BREAKPOINTS

```css
--mobile: 640px;
--tablet: 768px;
--laptop: 1024px;
--desktop: 1280px;
```

### Mobile Adjustments
- Hero headline: 48px → 36px
- Feature blocks: Stack vertically
- Pricing cards: Stack vertically
- Testimonials: 1 card visible
- Footer: 2-column → 1-column

---

## 🔍 SEO & META

```html
<title>Guidera - AI Travel Companion | Plan, Book, Explore Safely</title>
<meta name="description" content="Your AI-powered travel companion. Plan trips in minutes, stay safe with real-time alerts, book everything in one place. Backed by Y Combinator.">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

---

## 📊 ANALYTICS

Track these events:
- `hero_cta_click` (download/waitlist)
- `feature_section_view`
- `pricing_plan_click`
- `faq_expand`
- `email_signup_submit`
- `app_store_click`
- `scroll_depth` (25%, 50%, 75%, 100%)

---

## 🎯 KEY MESSAGING SUMMARY

**Primary Message**: Guidera is the AI travel companion that handles everything—planning, safety, booking, translation—so you can focus on the adventure.

**Proof Points**:
- Backed by Y Combinator
- 50,000+ users
- 4.9 star rating
- 190+ countries

**Emotional Hook**: Travel shouldn't be stressful. With Guidera, it isn't.

**Call to Action**: Download free or join waitlist.

---

*Document Version: 1.0*
*Created: December 2024*
*For: Guidera Series A Landing Page*
