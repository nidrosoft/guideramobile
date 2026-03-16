# Guidera Community — Complete User Journeys

## Overview

The Guidera Community is a trust-based social layer inside the travel app where two types of users interact: **Locals/Guides** who offer knowledge, guidance, and listings, and **Travelers** who browse, connect, and engage with communities in their destination cities. The system is built on a multi-layered verification and reputation model inspired by Waze's community voting, Onfido's identity verification, and Facebook Groups' social dynamics — all tailored for the unique trust requirements of international travel.

---

## JOURNEY A: Becoming a Local Guide

This is the complete flow for someone who wants to present themselves as a trusted local, create or join a community, and offer guidance or listings to travelers.

---

### Phase 1: Starting as a Regular User

Every guide starts as a regular Guidera user. There is no separate "guide app" — the guide functionality is unlocked from within the same app.

**Step 1 — Standard Signup**
The user downloads Guidera and creates an account through the normal auth flow (phone number + OTP verification). At this point, they're a standard traveler user with access to all browsing, booking, and discovery features.

**Step 2 — Discovering the Community Tab**
The user navigates to the **Community** tab in the main navigation. Here they see an overview of active communities in various cities, trending posts, and a prominent banner or card that says something like:

> "Know your city inside out? Help travelers explore safely. **Become a Local Guide →**"

This is the entry point. The user taps it.

**Step 3 — The Guide Interest Form**
Before any verification begins, the user fills out a lightweight profile that captures their intent and expertise. This is NOT the verification step — this is just gathering context so the system (and future travelers) understands what this person offers.

The form collects:
- **City/Region**: Where are you based? (e.g., Medellín, Colombia)
- **Languages Spoken**: English, Spanish, French, etc.
- **Areas of Expertise** (multi-select): Nightlife & Entertainment, Historical & Cultural Tours, Food & Dining, Safety & Navigation, Outdoor & Adventure, Real Estate & Rentals, Business & Networking, Dating & Social Etiquette, Shopping & Markets, Transportation & Logistics
- **Short Bio**: 150-word description of who they are and how they help (e.g., "Born and raised in Medellín. I've been showing visitors the real side of the city for 5 years — the safe spots, the hidden restaurants, and the neighborhoods tourists don't usually find.")
- **Optional Credentials**: Tourism board certifications, business licenses, language certifications, etc. (upload photos)
- **Profile Photo**: Required, used for the community profile

After submission, the user sees: "Great! To become a verified guide, you'll need to verify your identity. This protects both you and the travelers you'll help."

---

### Phase 2: Identity Verification

This is the trust foundation. No one appears in the community as a guide without completing this.

**Step 4 — Onfido Identity Verification Flow**
The user is taken through the Onfido (Entrust) SDK integration directly within the app. The process:

1. **Select ID Type**: The user chooses their government-issued ID — national ID card (cédula), passport, or driver's license
2. **Capture ID**: The user photographs the front (and back if applicable) of their ID document
3. **Selfie/Video Verification**: The user takes a live selfie or short video. Onfido's AI compares the face on the ID to the live capture
4. **Document Authenticity Check**: Onfido's AI analyzes the document for signs of tampering, forgery, or manipulation
5. **Processing**: The verification takes 6–60 seconds depending on the provider. The user sees a loading state with a message like "Verifying your identity... this usually takes less than a minute"

**Possible Outcomes:**
- **✅ Verified**: Face matches ID, document is authentic. User proceeds to next step.
- **❌ Failed**: Mismatch or suspicious document. User is notified and can retry with a different document or contact support.
- **⏳ Manual Review**: Edge cases get flagged for manual review (blurry photo, unusual document). User is told "We're reviewing your submission — you'll hear back within 24 hours."

**Step 5 — Country-Specific Background Check (Where Available)**
After identity verification passes, the system checks if a background check is available for the user's country.

*For countries WITH accessible criminal records systems (Colombia, Brazil, US, UK, EU countries, etc.):*
The user is prompted to consent to a background check. They see a clear explanation of what's being checked and why. For Colombia, this would pull from the National Police (Policía Nacional) database. The user provides their cédula number and consents.

*For countries WITHOUT accessible background check systems:*
The system skips this step and instead applies a "Pending Community Verification" status. The user is informed that their trust level will build through community interaction, vouches, and reviews. They start at a lower trust tier but can progress.

**Step 6 — Verification Status Assigned**
Based on what checks were completed, the user receives their initial trust badge:

- **🟢 Verified Identity** — Passed Onfido face+ID check only (available everywhere)
- **🔵 Background Cleared** — Passed Onfido + country-specific criminal records check
- **⚪ Pending Review** — Submitted but awaiting manual review

The user sees their badge on a confirmation screen with a message like: "You're now a Verified Local Guide in Medellín! Travelers can find you in the Community section. Build your reputation by helping travelers and earning vouches."

---

### Phase 3: Building a Guide Profile

**Step 7 — Complete Profile Setup**
Now that the user is verified, they build out their public-facing guide profile. This is what travelers will see when browsing the community.

The profile includes:
- **Display Name** (from ID verification — cannot be changed, ensures real identity)
- **Profile Photo** (from signup, can be updated)
- **Verification Badges** (automatically displayed — not editable)
- **City/Region**
- **Languages**
- **Expertise Tags** (from the interest form)
- **Bio**
- **Availability Status**: Available Now, Available This Week, Busy, Away
- **Response Time**: Auto-calculated based on messaging behavior
- **Portfolio Section**: Photos of places they recommend, tours they've given, etc.
- **Listings Section** (optional): Properties for rent, tours offered, services available — more on this below
- **Reviews & Ratings**: Empty at first, populated by travelers after interactions
- **Vouch Count**: How many other verified users have vouched for them
- **Member Since**: Date they became a verified guide

**Step 8 — Optional: Add Listings**
A verified guide can add listings to their profile. These are NOT bookable through Guidera — they're visibility-only. The guide is essentially advertising what they have available, and transactions happen directly between the guide and the traveler.

Listing types:
- **Property Rental**: "I have a 2-bedroom apartment in El Poblado available for short-term rental" — with photos, description, neighborhood, approximate price range
- **Tour/Experience**: "I offer a 4-hour walking tour of Comuna 13 including street food stops" — with description, duration, what's included, price range
- **Service**: "I can arrange airport pickup and safe transportation" — description and pricing
- **Recommendation Post**: "My top 10 restaurants in Medellín that tourists never find" — a content piece, not a transactable listing

Each listing includes a "Message to Inquire" button that opens the in-app DM with the guide. No prices are processed through Guidera. The platform tracks that a conversation happened (for safety and reputation) but doesn't handle payment.

---

### Phase 4: Joining or Creating a Community

At this point, the guide has a verified profile and possibly some listings. Now they can participate in or create communities.

**Step 9 — Browsing Existing Communities**
The guide navigates to the Community tab and sees communities organized by city. For Medellín, they might see:
- "Americans in Medellín" (8,200 members)
- "Medellín Nightlife Insiders" (3,400 members)
- "Digital Nomads Colombia" (12,000 members)
- "Medellín Safety & Navigation" (5,600 members)
- "Colombia Real Estate for Expats" (2,100 members)

Each community card shows: name, member count, description snippet, activity level (posts per week), and the community's trust rating (average of verified members).

The guide can tap to preview any community — see recent posts, the admin team, pinned content — and then choose to **Join**.

**Step 10 — Joining a Community**
Joining can work in two ways depending on how the community admin configured it:
- **Open Join**: Anyone with a Guidera account can join (travelers and guides alike)
- **Verified Only**: Only users who have passed at least Onfido identity verification can join
- **Approval Required**: The community admin manually approves each join request

Once joined, the guide can post, comment, vote, and interact like any member.

**Step 11 — Creating a New Community**
If no suitable community exists, the guide can create one. The creation flow:

1. **Community Name**: e.g., "Trusted Guides Medellín"
2. **City/Region**: Where this community is based
3. **Category**: Travel Safety, Nightlife, Food & Dining, Real Estate, Culture, General, etc.
4. **Description**: What this community is about and who it's for
5. **Cover Photo**: Visual branding for the community
6. **Join Rules**: Open / Verified Only / Approval Required
7. **Posting Rules**: Anyone can post / Only verified members / Only admins
8. **Community Guidelines**: Text field for rules (e.g., "No spam, no scams, respect all members")

**Requirements to create a community:**
- Must be a verified guide (minimum Onfido identity verification)
- Must have been on the platform for at least 30 days
- Must not have any community violations

The creator automatically becomes the **Community Admin** with the ability to:
- Approve/deny join requests
- Remove members
- Pin posts
- Assign moderator roles to other verified members
- Edit community settings

---

### Phase 5: The Vouch System (Ongoing Reputation)

This is the Waze-inspired layer that builds trust over time.

**How Vouching Works:**

Any verified guide can "vouch" for another verified guide. A vouch is a public endorsement that says "I know this person and trust them." Vouching has rules:

- You can only vouch for someone you've interacted with on the platform (the system checks for message history or being in the same community for at least 30 days)
- Each user can vouch for a maximum of 10 people (this prevents vouch-spamming)
- If someone you vouched for gets reported or banned, your own trust score takes a hit (skin in the game — this is the key mechanism)
- Vouches are public — travelers can see "Vouched by: Maria R. (Trusted Guide), Carlos M. (Background Cleared)"
- You can withdraw a vouch at any time

**Community Voting on Content:**

Inside communities, all members (travelers and guides) can:
- **Upvote/Downvote posts** — like Reddit, useful content rises
- **React to comments** — helpful, not helpful, outdated, verified (if they can confirm the info)
- **Flag content** — spam, misleading, dangerous, scam
- **Rate guides after interaction** — 1-5 stars + written review after a DM conversation or meetup

**Trust Score Progression:**

Based on all these signals, a guide's trust tier evolves:

| Tier | Badge | Requirements |
|------|-------|-------------|
| **Verified Local** | 🟢 Green Shield | Onfido identity verification passed |
| **Background Cleared** | 🔵 Blue Shield | Onfido + country criminal records check |
| **Trusted Guide** | 🟡 Gold Shield | Background Cleared + 10 positive reviews + 3 vouches + 90 days active |
| **Community Ambassador** | 🟣 Purple Shield | Trusted Guide + 50 positive reviews + 10 vouches + community admin/moderator + 0 violations |

Each tier is visibly displayed on the guide's profile, on their posts, and in search results. Travelers can filter guides by trust tier.

---

### Phase 6: Ongoing Activity

Once fully set up, the guide's ongoing activities include:
- **Posting in communities**: Tips, recommendations, warnings, updates
- **Responding to DMs from travelers**: Answering questions, arranging meetups
- **Updating listings**: New properties, tour availability, seasonal offers
- **Earning reviews**: After each traveler interaction
- **Collecting vouches**: From other verified guides
- **Maintaining reputation**: Keeping ratings high, responding promptly

---

## JOURNEY B: The Traveler Browsing Communities

This is the complete flow for someone who is using Guidera as a travel app and wants to tap into the local community for help, guidance, and connections.

---

### Phase 1: Discovery

**Step 1 — Entering the Community Tab**
The traveler is planning a trip to Medellín, Colombia. They've already been using Guidera for flights and hotels. They tap the **Community** tab in the main navigation.

**Step 2 — Community Landing Page**
The landing page is personalized based on the traveler's upcoming trip (if they have one booked) or their browsing history. They see:

**Header Section:**
- "Explore the Medellín Community" (or their destination)
- Subtitle: "Connect with verified locals who can help you navigate, explore, and stay safe"

**Featured Sections:**
- **Top Verified Guides** — A horizontal scroll of the highest-rated, most-vouched guides in that city, showing their photo, name, badge, expertise tags, rating, and a "Message" button
- **Active Communities** — Grid/list of communities sorted by member count and activity, each showing name, member count, recent activity, and a preview of the latest post
- **Trending Posts** — The most upvoted content from all communities in that city in the past week
- **Listings** — A section showing available rentals, tours, and services from verified guides

**Filter Bar:**
The traveler can filter everything by:
- **Category**: Safety, Nightlife, Food, Real Estate, Culture, Adventure, etc.
- **Trust Level**: Show only Trusted Guides (Gold+), show all verified, show everyone
- **Language**: Filter guides who speak English, Spanish, French, etc.
- **Availability**: Available now, available this week
- **Sort By**: Highest rated, most vouches, most responsive, newest

---

### Phase 2: Exploring Communities

**Step 3 — Browsing a Community**
The traveler taps "Americans in Medellín" (8,200 members). They see:

**Community Header:**
- Community name, cover photo, member count, creation date
- Admin team (with their verification badges)
- Community description and guidelines
- "Join" button (or "Request to Join" if approval required)

**Content Feed:**
The main feed shows posts from community members, sorted by relevance (a mix of recency and upvotes). Each post shows:
- **Author**: Name, profile photo, verification badge, expertise tags
- **Post Content**: Text, photos, links
- **Engagement**: Upvote/downvote count, comment count
- **Timestamp**
- **Tags/Category**: What the post is about

Example posts the traveler might see:
- "⚠️ PSA: Avoid taking taxis from the airport that aren't registered. Use the official taxi stand or InDrive app. Last week a tourist got overcharged $200." — Posted by Carlos M. 🟡 Trusted Guide, 47 upvotes
- "Best sunset spot in Medellín that nobody talks about — Cerro de las Tres Cruces. Go before 5pm, bring water, and don't bring flashy jewelry. Totally safe during the day." — Posted by Maria R. 🟣 Community Ambassador, 112 upvotes
- "Does anyone know a good dentist in El Poblado that speaks English?" — Posted by Jake T. (regular member), 8 comments

**Step 4 — Interacting Without Joining**
The traveler can READ all public community content without joining. They can see posts, comments, ratings, and guide profiles. However, to interact (post, comment, upvote, DM), they must join the community.

**Step 5 — Joining the Community**
The traveler taps "Join." If it's an open community, they're in immediately. If approval is required, their request goes to the admin. Once joined, they can:
- Post questions or share their own experiences
- Comment on other posts
- Upvote/downvote content
- DM any member directly

---

### Phase 3: Finding and Evaluating a Guide

**Step 6 — Browsing Individual Guide Profiles**
The traveler sees Carlos M.'s helpful post about airport taxis and taps his profile. They see:

**Guide Profile Page:**
- **Header**: Photo, name, verification badge (🟡 Trusted Guide)
- **Trust Details**: "Identity Verified ✓ | Background Cleared ✓ | Vouched by 7 guides | 4.8★ from 34 reviews"
- **Bio**: "Born in Medellín, lived here 32 years. Former hospitality manager. I help visitors navigate safely, find genuine local experiences, and avoid tourist traps."
- **Expertise**: Safety & Navigation, Nightlife & Entertainment, Food & Dining
- **Languages**: English (Fluent), Spanish (Native)
- **Response Time**: "Usually responds within 1 hour"
- **Availability**: Available This Week
- **Vouches**: Clickable list showing who vouched and their own badges — "Vouched by: Maria R. 🟣, Diego S. 🔵, Ana P. 🟡..." 
- **Reviews**: Scrollable feed of traveler reviews with star ratings and text
- **Listings**: Carlos has a listing for "Private Medellín Night Tour — Safe spots, rooftop bars, and salsa clubs with a local who knows every bouncer" (4 hours, $50-70 range, 4.9★)
- **Community Activity**: "Active in: Americans in Medellín, Medellín Nightlife Insiders, Medellín Safety & Navigation"
- **Action Buttons**: "Message Carlos" | "Save Profile"

**Step 7 — Reading Reviews and Vouches**
The traveler reads through Carlos's reviews:
- "Carlos literally saved our trip. He told us which neighborhoods to avoid at night and took us to restaurants we never would have found. 10/10" — Sarah K., visited March 2026
- "Super responsive and honest. Told us straight up when our plan was a bad idea instead of just going along with it." — Mike D., visited January 2026
- "Met up with Carlos for his night tour. He knows everyone — got us into places with no line. Felt completely safe the entire time." — Jess L., visited February 2026

The traveler also checks Carlos's vouches and sees they're from other high-trust guides, not random accounts.

**Step 8 — Evaluating Trust**
At this point, the traveler has multiple trust signals to evaluate:
- ✅ Onfido-verified identity (real person, real ID)
- ✅ Background cleared (no criminal record in Colombia)
- ✅ 7 vouches from other verified guides (skin-in-the-game endorsements)
- ✅ 4.8 stars from 34 reviews (consistent positive feedback)
- ✅ Active in 3 communities (engaged, not a ghost profile)
- ✅ 1-hour response time (reliable communicator)
- ✅ Been on the platform for 8 months (not brand new)

This is significantly more trust signal than any current travel platform provides.

---

### Phase 4: Connecting and Communicating

**Step 9 — Initiating a DM**
The traveler taps "Message Carlos" and is taken to the in-app messaging interface. All communication happens within Guidera — no sharing of personal phone numbers or WhatsApp until both parties choose to.

The traveler sends: "Hey Carlos! I'm coming to Medellín with 3 friends next month. We're looking for someone who can show us around safely — nightlife, food, maybe some day trips. Saw your night tour listing too. Are you available March 15-22?"

**Step 10 — In-App Conversation**
Carlos responds within the app. The conversation is tracked by Guidera for safety purposes (this is disclosed to both parties in the Terms of Service). The chat supports:
- Text messages
- Photo sharing (Carlos sends photos of places he recommends)
- Voice messages
- Location sharing (when appropriate)
- Listing links (Carlos can share his tour listing directly in chat)

If at any point the traveler feels uncomfortable, they can:
- **Block** the guide (immediate, no notification to the guide)
- **Report** the guide (goes to Guidera safety team for review)
- **Flag the conversation** for review

**Step 11 — Arranging a Meetup (If Applicable)**
If the traveler and guide decide to meet in person, the app encourages (but doesn't force) safety protocols:
- **Suggested meetup locations**: Guidera can suggest well-known public spots near the traveler's hotel
- **Share trip with contacts**: One-tap to share your live location with emergency contacts
- **Check-in prompts**: After a meetup is scheduled, the app sends periodic "Are you safe?" check-ins
- **SOS button**: Always accessible, connects to local emergency services with GPS

---

### Phase 5: Post-Interaction

**Step 12 — Leaving a Review**
After the meetup or after a meaningful DM exchange, the traveler receives a prompt to review the guide:
- **Star Rating**: 1-5 stars
- **Written Review**: Free text describing their experience
- **Tags**: "Helpful," "Trustworthy," "Knowledgeable," "Responsive," "Great Communicator"
- **Would you recommend this guide?**: Yes / No

The review is posted to the guide's profile and factors into their trust score. The guide can respond to the review publicly (like Airbnb host responses).

**Step 13 — Vouching (If the Traveler is Also a Guide)**
If the traveler happens to also be a verified guide in another city, they can vouch for Carlos, adding to his vouch count and cross-city reputation.

**Step 14 — Ongoing Community Engagement**
The traveler might:
- Stay in the "Americans in Medellín" community even after their trip, sharing their own tips
- Join other city communities for future trips
- Eventually become a guide themselves in their home city, creating a network effect

---

## Feature Comparison: Community vs. Guide vs. Listing

| Feature | Regular User | Verified Guide | Community Admin |
|---------|-------------|----------------|-----------------|
| Browse communities | ✅ | ✅ | ✅ |
| Join communities | ✅ | ✅ | ✅ |
| Read posts & comments | ✅ | ✅ | ✅ |
| Post & comment | ✅ (after joining) | ✅ | ✅ |
| Upvote/downvote | ✅ (after joining) | ✅ | ✅ |
| DM other users | ✅ | ✅ | ✅ |
| Create listings | ❌ | ✅ | ✅ |
| Receive vouches | ❌ | ✅ | ✅ |
| Give vouches | ❌ | ✅ | ✅ |
| Trust badge displayed | ❌ | ✅ | ✅ |
| Appear in "Find a Guide" | ❌ | ✅ | ✅ |
| Create a community | ❌ | ✅ (30-day minimum) | Already admin |
| Moderate community | ❌ | ❌ (unless assigned) | ✅ |
| Leave reviews on guides | ✅ | ✅ | ✅ |
| Receive reviews | ❌ | ✅ | ✅ |

---

## Listing Visibility Model (No Transactions)

The community marketplace is visibility-only. Guidera does NOT process payments for guide services or property rentals. Here's exactly how it works:

**What the guide posts:**
- Title, description, photos
- Category: Property Rental / Tour or Experience / Service / Recommendation
- Price range (approximate, e.g., "$50-70 per person")
- Availability window
- Location (neighborhood-level, not exact address)

**What the traveler sees:**
- All of the above, plus the guide's trust badge and rating
- A "Message to Inquire" button (opens in-app DM)
- Number of inquiries this listing has received

**What happens next:**
- Traveler and guide discuss details in DM
- They agree on terms privately
- Payment happens outside Guidera (cash, Zelle, bank transfer, whatever they agree on)
- Guidera keeps a record that the conversation happened (for safety/dispute context)
- After the interaction, the traveler is prompted to leave a review

**Why no in-app transactions (for now):**
- Reduces regulatory burden (payment processing across 50+ countries is complex)
- Avoids Guidera being liable for service quality
- Keeps the platform light and social, not transactional
- Can be added later as the platform matures and trust systems are proven

---

## Safety Infrastructure Summary

Throughout both journeys, these safety systems are active:

**Identity Layer:**
- Onfido face + document verification for all guides
- Country-specific background checks where available
- Watchlist & sanctions screening (global)

**Reputation Layer:**
- Star ratings from travelers
- Written reviews (public)
- Vouch system with skin-in-the-game consequences
- Community upvotes/downvotes on content
- Trust tier badges visible everywhere

**Communication Layer:**
- All messaging within the app (trackable)
- No external contact sharing required
- Block and report functionality
- Conversation flagging for safety review

**Real-Time Safety Layer:**
- Suggested public meetup locations
- Live location sharing with emergency contacts
- Periodic "Are you safe?" check-ins
- SOS button with GPS coordinates to local emergency services

**Moderation Layer:**
- Community admins can remove members and content
- Guidera safety team reviews flagged content and reports
- Automatic flagging of suspicious patterns (new guide with sudden burst of perfect reviews, etc.)
- Zero tolerance for verified scam or safety violations (permanent ban + law enforcement referral if applicable)

---

## Key Metrics to Track

**Trust & Safety:**
- Verification completion rate (what % of guide applicants complete Onfido?)
- Average trust tier distribution (how many at each level?)
- Report rate per 1,000 interactions
- False positive rate on flags
- Response time to safety reports

**Engagement:**
- Communities created per month
- Average community size
- Posts per community per week
- DM conversations initiated (traveler → guide)
- Listing views and inquiry rate

**Reputation:**
- Average guide rating
- Vouches given per verified guide
- Review completion rate (what % of travelers leave a review after interaction?)
- Trust tier progression rate (how long to go from Verified to Trusted?)

**Growth:**
- Guide-to-traveler ratio per city
- Cross-city guide activity (guides who are also travelers elsewhere)
- Community member retention (still active after 90 days?)
- Organic community discovery (how do travelers find communities?)
