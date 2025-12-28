# GUIDERA LANDING PAGE - AI SYSTEM PROMPT

You are building a premium landing page for **Guidera**, an AI-powered travel companion app that is backed by Y Combinator and raising a $5M Series A round. This landing page must convey trust, innovation, and premium quality.

---

## CRITICAL CONTEXT

**What Guidera Is:**
Guidera is a travel super-app that uses AI to handle the entire travel lifecycle:
- **AI Trip Planning**: Generate personalized day-by-day itineraries in seconds
- **Real-Time Safety Alerts**: Color-coded danger zones, scam warnings, emergency SOS
- **Cultural Intelligence**: Do's and don'ts, etiquette tips, local customs
- **Unified Booking**: Flights, hotels, cars, experiences in one place
- **AR Translation**: Point camera at menus/signs for instant translation
- **Expense Tracking**: Real-time budget monitoring with currency conversion

**Target Audience:**
- Frequent travelers (25-45 years old)
- Solo travelers concerned about safety
- Business travelers needing efficiency
- Adventure seekers wanting authentic experiences
- Families planning complex trips

**Business Goal:**
Convert visitors to app downloads or waitlist signups. Build investor confidence.

---

## DESIGN REQUIREMENTS

### Colors (Use exactly these)
```
Primary Purple: #7257FF
Dark Purple: #5336E2
Darkest Purple: #2E1E7C
Light Purple: #9B85FF
Subtle Purple: #F0EDFF

Background: #F4F6F7
White: #FFFFFF
Text Primary: #111827
Text Secondary: #6B7280
Border: #E5E7EB

Success Green: #10B981
Warning Amber: #F59E0B
Error Red: #EF4444
Info Blue: #3B82F6

Hero Gradient: linear-gradient(135deg, #7257FF 0%, #5336E2 50%, #2E1E7C 100%)
```

### Typography
- **Display Font**: Plus Jakarta Sans (headlines)
- **Body Font**: Inter (everything else)
- **Hero Headline**: 72px desktop, 48px mobile, font-weight 800
- **Section Titles**: 48px desktop, 36px mobile, font-weight 700
- **Body Text**: 16-18px, font-weight 400, line-height 1.6

### Icons
**Use Iconsax library** (`iconsax-react`):
- `MagicStar` - AI features
- `ShieldTick` - Safety
- `Global` - Cultural
- `TicketStar` - Booking
- `Translate` - Translation
- `Wallet` - Expenses
- `Import` - Download
- `TickCircle` - Checkmarks
- `ArrowRight` - CTAs
- `Add/Minus` - FAQ accordion

### Spacing
- Section padding: 120px vertical (80px mobile)
- Max content width: 1200px
- Card padding: 32-40px
- Element gaps: 16-24px

### Border Radius
- Cards: 24px
- Buttons: 9999px (pill)
- Inputs: 9999px (pill)
- Small elements: 12px

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
--shadow-purple: 0 20px 40px -10px rgba(114,87,255,0.3);
```

---

## PAGE SECTIONS (Build in this order)

### 1. NAVIGATION
- Fixed position, 72px height
- Transparent on hero, white with backdrop-blur on scroll
- Logo left, links center, CTA button right
- Links: Features, How It Works, Pricing, About
- CTA: "Download App" with gradient background
- Mobile: Hamburger menu with full-screen overlay

### 2. HERO SECTION
**Background**: Purple gradient with subtle grid pattern overlay

**Content (centered)**:
1. YC Badge: Small pill showing "Backed by Y Combinator" with YC logo
2. Headline: "Travel Smarter. Explore Fearlessly." (two lines)
3. Subheadline: "Your AI-powered travel companion that plans, protects, and personalizes every journey."
4. Two CTAs side by side:
   - Primary: "Download App" (white bg, purple text)
   - Secondary: "Join 50,000+ Waitlist →" (transparent, white border)
5. Scroll indicator at bottom

**Phone Mockup**: 
- Position: Right side on desktop, below CTAs on mobile
- 3D iPhone frame showing app home screen
- Floating animation (subtle Y translation)
- Purple glow behind

**Animations**:
- Staggered fade-in: badge → headline → subheadline → CTAs → phone
- Phone floats continuously
- Background has slow-moving gradient orbs

### 3. SOCIAL PROOF BAR
- White background, subtle border bottom
- Text: "Featured in" followed by logos
- Logos: YC, TechCrunch, Forbes, Wired, Product Hunt
- Logos are grayscale, color on hover
- Optional: Infinite marquee scroll

### 4. THE PROBLEM SECTION
**Purpose**: Create emotional resonance with pain points

**Title**: "Sound familiar?"

**6 Cards in 3x2 grid** (each card has emoji + quote):
1. 😩 "I spent 6 hours planning and I'm still not sure..."
2. 😰 "Is this area safe? I have no idea..."
3. 😕 "I accidentally offended someone and didn't know why..."
4. 😤 "Why do I need 5 different apps to book one trip?"
5. 🤷 "What does this menu even say?"
6. 💸 "I went way over budget and didn't realize..."

**Closing**: "Travel shouldn't be this stressful."

**Style**: Cards have white bg, shadow, hover lift effect

### 5. THE SOLUTION SECTION
**Title**: "Meet Guidera" (gradient text on "Guidera")

**Subheadline**: "The AI travel companion that handles everything—so you can focus on the adventure."

**Demo Area**: Video embed or animated phone mockup showing app in action

**4 Value Props with checkmarks**:
- ✓ Plan in minutes, not hours
- ✓ Stay safe with real-time alerts
- ✓ Book everything in one place
- ✓ Never get lost in translation

### 6. CORE FEATURES SECTION
**Title**: "Everything you need. One app."

**6 Feature Blocks** (alternating layout: image left/right):

**Feature 1 - AI Trip Planning**
- Icon: MagicStar
- Headline: "Plan your perfect trip in minutes, not hours"
- Description: "Tell our AI where you want to go, your travel style, and budget. Get a complete day-by-day itinerary in seconds."
- Bullets: Personalized recommendations, Smart scheduling, Budget optimization
- Visual: Phone showing AI generating itinerary

**Feature 2 - Safety Alerts**
- Icon: ShieldTick
- Headline: "Travel with confidence, not worry"
- Description: "Get instant alerts about unsafe areas, scams, and emergencies. Our AI monitors your location and keeps you informed."
- Bullets: Color-coded danger zones, Real-time alerts, One-tap SOS
- Visual: Phone showing safety map

**Feature 3 - Cultural Intelligence**
- Icon: Global
- Headline: "Never accidentally offend again"
- Description: "Learn the do's and don'ts before you arrive. Cultural insights, etiquette tips, and local customs for every destination."
- Bullets: Etiquette guides, Tipping customs, Dress codes
- Visual: Phone showing Do's & Don'ts cards

**Feature 4 - Unified Booking**
- Icon: TicketStar
- Headline: "Flights, hotels, cars, experiences. One app."
- Description: "Stop juggling multiple apps. Book everything in one place, see your entire trip at a glance."
- Bullets: Compare prices, Bundle deals, Easy modifications
- Visual: Phone showing booking flow

**Feature 5 - AR Translation**
- Icon: Translate
- Headline: "Point your camera. Understand everything."
- Description: "Scan menus, signs, and documents in any language. Instant translations right on your screen."
- Bullets: Real-time camera translation, Menu scanning, 100+ languages
- Visual: Phone showing AR camera translating menu

**Feature 6 - Expense Tracking**
- Icon: Wallet
- Headline: "Know exactly where your money goes"
- Description: "Track every expense in real-time. Set budgets, scan receipts, get insights."
- Bullets: Auto currency conversion, Receipt scanning, Budget alerts
- Visual: Phone showing expense dashboard

### 7. HOW IT WORKS SECTION
**Title**: "Get started in 3 simple steps"

**3 Step Cards** connected by dashed lines:
1. **01 - Download** "Available on iOS and Android. Free to download." (Icon: Import)
2. **02 - Personalize** "2-minute preference setup. Travel style, interests, budget." (Icon: UserEdit)
3. **03 - Explore** "Your AI companion is ready. Plan your first trip!" (Icon: Map1)

**CTA**: "Download Now — It's Free"

### 8. APP SHOWCASE SECTION
**Title**: "See Guidera in action"

**Tab Bar**: Home | Planning | Booking | Safety | AR | Expenses

**Interactive Phone Mockup**: Shows different screens based on selected tab
- Auto-rotate through tabs every 5 seconds
- Smooth crossfade transitions

### 9. TESTIMONIALS SECTION
**Title**: "Loved by travelers worldwide"

**Stats**: ⭐⭐⭐⭐⭐ 4.9 rating • 50,000+ downloads • 120+ countries

**Carousel of testimonial cards** (3 visible on desktop):
1. Sarah M. 🇺🇸 - "Guidera saved my trip to Japan. The cultural tips helped me avoid so many awkward moments!"
2. James K. 🇬🇧 - "The safety alerts literally saved us from walking into a known scam area in Bangkok."
3. Maria L. 🇪🇸 - "Finally, one app that does everything. No more 10 tabs open trying to plan a trip."
4. Yuki T. 🇯🇵 - "The AR menu translator is magic. I could finally order food in Italy without pointing and hoping!"
5. David R. 🇦🇺 - "As a business traveler, the expense tracking alone is worth it. But the AI planning? Game changer."
6. Priya S. 🇮🇳 - "Traveling solo as a woman, the safety features give me peace of mind."

### 10. SECURITY & TRUST SECTION
**Background**: Dark (#111827)

**Title**: "Your privacy is our priority"

**4 Trust Badges**:
- 🔒 End-to-End Encryption
- 🛡️ SOC 2 Compliant
- ✓ GDPR Compliant
- 🌍 No Data Selling

**Statement**: "We never sell your data. Your travel plans stay yours."

**Link**: "Read our Privacy Policy →"

### 11. PRICING SECTION
**Title**: "Simple, transparent pricing"
**Subtitle**: "Start free. Upgrade when you're ready."

**Two Cards**:

**FREE ($0 forever)**:
- ✓ AI trip planning (3 trips/month)
- ✓ Basic booking
- ✓ Safety alerts
- ✓ Cultural guides
- CTA: "Get Started Free"

**PREMIUM ($9.99/mo or $79.99/yr)** - "MOST POPULAR" badge:
- Everything in Free, plus:
- ✓ Unlimited AI plans
- ✓ AR translation
- ✓ Offline mode
- ✓ Priority support
- ✓ Advanced expense tracking
- CTA: "Start 7-Day Free Trial"

**Footer**: "No ads • Cancel anytime • 24/7 support"

### 12. FAQ SECTION
**Title**: "Frequently asked questions"

**Accordion items**:
1. Is Guidera really free?
2. How does the AI trip planning work?
3. Is my data safe?
4. Can I use Guidera offline?
5. What countries does Guidera support?
6. How accurate are the safety alerts?
7. Can I share my trip with others?
8. What if I need to cancel my subscription?

**Footer**: "Still have questions? Contact us →"

### 13. FINAL CTA SECTION
**Container**: Purple gradient, rounded corners, large shadow

**Content**:
- Headline: "Ready to travel smarter?"
- Subheadline: "Join 50,000+ travelers who've discovered a better way."
- App Store badges (Apple + Google)
- Email signup: "Enter your email for early access" + "Join Waitlist" button
- Note: "✓ No spam ✓ Unsubscribe anytime"

### 14. FOOTER
**Dark background**

**4 Columns**:
- Product: Features, Pricing, Safety, Blog
- Company: About Us, Careers, Press Kit, Contact
- Legal: Privacy, Terms, Cookies, GDPR
- Download: App Store, Play Store

**Bottom**: © 2025 Guidera Inc. | Social icons (Twitter, Instagram, LinkedIn, TikTok)

---

## ANIMATION GUIDELINES

### Scroll Animations (Framer Motion)
```jsx
// Fade up on scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>
```

### Stagger Children
```jsx
// Parent
variants={{
  visible: { transition: { staggerChildren: 0.1 } }
}}

// Child
variants={{
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}}
```

### Hover Effects
- Buttons: scale 1.02-1.05, shadow increase
- Cards: translateY -4px, shadow increase
- Links: color transition to primary

### Specific Animations
- Hero phone: `animate={{ y: [0, -10, 0] }}` with 4s duration, infinite
- Numbers: Count up from 0 to target
- FAQ: Height animation on expand/collapse
- Testimonial carousel: Auto-advance every 6 seconds

---

## RESPONSIVE DESIGN

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adjustments
- Hero: Stack vertically, phone below CTAs
- Features: Stack image above content
- Pricing: Stack cards vertically
- Footer: 2 columns then 1 column
- Navigation: Hamburger menu

---

## PERFORMANCE REQUIREMENTS

1. **Lighthouse Score**: Target 90+ on all metrics
2. **Images**: Use Next.js Image component, WebP format
3. **Fonts**: Preload critical fonts
4. **Animations**: Use `will-change` sparingly, prefer transform/opacity
5. **Lazy Loading**: Load below-fold content on scroll
6. **Bundle Size**: Code split by section

---

## FORMS & INTERACTIONS

### Email Signup
- Validate email format
- Show loading state on submit
- Success: "You're on the list! Check your email."
- Error: "Something went wrong. Please try again."
- Store in database/email service

### App Store Links
- Detect device (iOS/Android)
- Show appropriate store badge
- Track clicks for analytics

---

## SEO REQUIREMENTS

```html
<title>Guidera - AI Travel Companion | Plan, Book, Explore Safely</title>
<meta name="description" content="Your AI-powered travel companion. Plan trips in minutes, stay safe with real-time alerts, book everything in one place. Backed by Y Combinator. Free download.">
<meta property="og:title" content="Guidera - Travel Smarter. Explore Fearlessly.">
<meta property="og:description" content="The AI travel companion that handles everything—planning, safety, booking, translation—so you can focus on the adventure.">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

---

## FINAL CHECKLIST

Before launch, verify:
- [ ] All animations smooth at 60fps
- [ ] Mobile responsive on all sections
- [ ] Forms working with validation
- [ ] App store links correct
- [ ] Analytics tracking events
- [ ] SEO meta tags complete
- [ ] Lighthouse score 90+
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Accessibility (keyboard nav, screen readers)
- [ ] Legal pages linked (Privacy, Terms)

---

**Remember**: This landing page represents a YC-backed company raising $5M. Every pixel matters. Make it premium, trustworthy, and conversion-focused.
