# Cursor Prompt: Build Marketing & Email Campaigns Module

Copy everything below the line and paste it into Cursor as a single prompt.

---

## PROMPT START

Build the complete **Marketing & Email Campaigns** module for the Guidera admin panel. This module owns: User Segmentation (50+ filters), Saved Segments, Email Campaign Builder, Campaign Analytics, Cohort Analysis, and Popular Searches. It works alongside the Notifications module (built separately) — Marketing creates segments and campaigns, Notifications handles push/in-app delivery.

The admin panel is a **Next.js 15 app** using **Tailwind CSS + shadcn/ui** with a dark theme. It connects to **Supabase** (project ID: `pkydmdygctojtfzbqcud`) using the **service_role key** (server-side only, never exposed client-side).

### HOW MARKETING & NOTIFICATIONS RELATE

- **Marketing** (this prompt) owns: Segment Builder, Saved Segments, Email Campaigns, Campaign Analytics, Cohort Analysis, Popular Searches
- **Notifications** (separate module, already built) owns: Compose & Send push/in-app, Alert Center, Push Management, Scheduled Queue, Templates
- **Shared table:** `admin_saved_segments` — Marketing creates/edits segments, Notifications reads them via a dropdown in the Compose page
- **Shared table:** `admin_notification_sends` — When Marketing sends a campaign, it creates a record here so Notifications can show it in send history
- **Connection flow:** Marketing builds a segment → attaches an email campaign → sends it. If the campaign also needs push, Marketing routes to Notifications Compose with the segment pre-selected.

---

### EXISTING INFRASTRUCTURE (DO NOT RECREATE — USE THESE)

#### 1. Email Provider: Resend API (Already Configured)

Resend is already set up and working. The API key is stored in Supabase secrets as `RESEND_API_KEY`.

**Verified sender addresses on `guidera.one` domain:**
- `Guidera <noreply@guidera.one>` — Transactional emails
- `Guidera Support <support@guidera.one>` — Support confirmations
- `Guidera Reports <noreply@guidera.one>` — Internal reports
- `Guidera Emergency <emergency@guidera.one>` — SOS alerts

**For marketing emails, use:** `Guidera <hello@guidera.one>` (register this sender in Resend dashboard)

**Existing edge functions that send email via Resend:**
- `send-notification` — SOS emergency emails (`{ type: "email", to, subject, body }`)
- `notify-issue-report` — Issue report team + user confirmation emails
- `send-crash-report` — Crash report emails to team

**Resend API call pattern (already proven):**
```typescript
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: 'Guidera <hello@guidera.one>',
    to: ['user@example.com'],
    subject: 'Your subject',
    html: '<div>HTML content</div>',
    reply_to: 'support@guidera.one',
  }),
});
const result = await res.json(); // { id: "email_id_123" }
```

Resend also supports:
- **Batch send:** POST `/emails/batch` — up to 100 emails per request
- **Tags:** `tags: [{ name: "campaign_id", value: "abc123" }]` for tracking
- **Headers:** Custom `List-Unsubscribe` header for CAN-SPAM compliance

#### 2. Database Tables (Already Exist)

**`profiles`** — 17 users. The segmentation source. Key fields:
```
-- Demographics
id, first_name, last_name, email, phone, date_of_birth, gender, ethnicity,
nationality, country_of_residence, city, country, country_code, timezone,
languages_spoken, primary_language, profession, industry, religion

-- Account Status
membership_type ('free'|'premium'|'pro'), membership_expires_at,
is_verified, identity_verified, email_verified, phone_verified,
onboarding_completed, onboarding_step, created_at, last_seen_at, deleted_at

-- Travel Profile (from travel_preferences JSONB + dedicated columns)
travel_preferences (JSONB: { styles: [], interests: [], accessibility_needs: [], dietary_restrictions: [] }),
activity_level, food_adventurousness, cuisine_preferences, packing_style,
morning_person, crowd_comfort, photography_level, international_trips_count,
countries_visited (text[]), bargaining_comfort, spice_tolerance

-- Financial
preferred_currency, payment_preference, credit_cards (JSONB)

-- Health
medical_conditions (text[]), allergies (text[]), blood_type, medications (text[])

-- Travel Documents
passport_country, passport_expiry, has_drivers_license, has_global_entry, has_tsa_precheck,
insurance_provider, insurance_type

-- Settings
privacy_settings (JSONB), security_settings (JSONB),
preferences (JSONB: { notifications: { push, email, sms, deal_alerts, safety_alerts, ... }, currency, language, ... })
```

**`trips`** — 22 trips. For behavioral segmentation (trip count per user).

**`ai_chat_sessions`** — 9 sessions. For AI usage segmentation.

**`deal_clicks`** — Deal engagement tracking.

**`community_posts`** — Community activity.

**`group_members`** — Group membership.

**`buddy_connections`** — Buddy connections.

**`partner_applications`** — Local Guide applications.

**`saved_items`** — Saved destinations/deals/experiences.

**`deal_notifications`** — Price alerts.

**`user_devices`** — 9 devices. For push-enabled segmentation.

**`user_notification_preferences`** — Per-user opt-in/out (push, email, SMS).

**`popular_searches`** — Trending search terms.

**`admin_saved_segments`** — Shared with Notifications (already created by Notifications prompt):
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL,
description text,
filters jsonb NOT NULL DEFAULT '{}',
user_count integer DEFAULT 0,
created_by text,
last_used_at timestamptz,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()
```

**`admin_notification_sends`** — Shared with Notifications (already created):
```sql
id, title, body, icon, image_url, action_url, category, priority, channels,
targeting_mode, targeting_details, segment_id, total_recipients,
push_sent, push_delivered, email_sent, in_app_sent,
status, scheduled_for, sent_at, created_by, created_at
```

---

### WHAT TO BUILD

#### Page 1: Marketing Dashboard (`/admin/marketing`)

Overview dashboard with:
- **KPI Cards:**
  - Total Users / Active Users (last 30d) / New Users (this week)
  - Email campaigns sent (this month) / Avg open rate / Avg click rate
  - Total segments created / Most used segment
  - Churn risk users (inactive 30d+)
- **Quick Actions:** "Create Segment", "New Email Campaign", "View Cohorts"
- **Recent Campaigns:** Last 10 email campaigns with status, recipients, open rate
- **Segment Health:** Top 5 segments with user count trends (growing/shrinking)

#### Page 2: Segment Builder (`/admin/marketing/segments`)

This is the **full 50+ attribute segmentation engine** — the power tool for targeting.

**Layout:** Left panel = filter builder, Right panel = live results preview

**Filter Categories (collapsible accordion sections):**

**Demographics:**
| Filter | Type | Source |
|--------|------|--------|
| Age Range | Dual slider (18-80) | Computed from `profiles.date_of_birth` |
| Gender | Multi-select checkboxes | `profiles.gender` distinct values |
| Ethnicity | Multi-select dropdown | `profiles.ethnicity` distinct values |
| Nationality | Multi-select dropdown | `profiles.nationality` distinct values |
| Country of Residence | Multi-select dropdown | `profiles.country_of_residence` distinct values |
| City | Multi-select dropdown | `profiles.city` distinct values |
| Language | Multi-select dropdown | `profiles.languages_spoken` array values |
| Profession | Text search | `profiles.profession` ILIKE |
| Industry | Multi-select dropdown | `profiles.industry` distinct values |

**Account & Status:**
| Filter | Type | Source |
|--------|------|--------|
| Membership Tier | Checkboxes: Free, Premium, Pro | `profiles.membership_type` |
| Verification Status | Checkboxes: Verified, Unverified | `profiles.is_verified` |
| Identity Verified | Checkboxes: Yes, No | `profiles.identity_verified` |
| Email Verified | Checkboxes: Yes, No | `profiles.email_verified` |
| Onboarding | Checkboxes: Completed, Incomplete | `profiles.onboarding_completed` |
| Signup Date | Date range picker | `profiles.created_at` |
| Last Active | Dropdown: Today, This Week, This Month, 30d Inactive, 90d Inactive, Churned (180d+) | `profiles.last_seen_at` |

**Behavior (requires JOINs):**
| Filter | Type | Source |
|--------|------|--------|
| Trip Count | Range slider (0-50) | `COUNT(*) FROM trips WHERE user_id = profiles.id` |
| AI Chat Sessions | Range slider (0-50) | `COUNT(*) FROM ai_chat_sessions WHERE user_id = profiles.id` |
| Deal Clicks | Range slider (0-100) | `COUNT(*) FROM deal_clicks WHERE user_id = profiles.id` |
| Community Posts | Range slider (0-50) | `COUNT(*) FROM community_posts WHERE author_id = profiles.id` |
| Is in a Group | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM group_members WHERE user_id = profiles.id)` |
| Has Buddy Connections | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM buddy_connections WHERE ...)` |
| Is Local Guide Applicant | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM partner_applications WHERE user_id = profiles.id)` |
| Has Saved Items | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM saved_items WHERE user_id = profiles.id)` |
| Has Price Alerts | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM deal_notifications WHERE user_id = profiles.id)` |

**Travel Profile:**
| Filter | Type | Source |
|--------|------|--------|
| Activity Level | Dropdown: sedentary, light, moderate, active, extreme | `profiles.activity_level` |
| Food Adventurousness | Dropdown | `profiles.food_adventurousness` |
| Packing Style | Dropdown: light, normal, heavy, overpacker | `profiles.packing_style` |
| Morning Person | Checkbox: Yes, No | `profiles.morning_person` |
| Crowd Comfort | Dropdown | `profiles.crowd_comfort` |
| Photography Level | Dropdown | `profiles.photography_level` |
| International Trips | Range slider (0-100) | `profiles.international_trips_count` |
| Countries Visited Count | Range slider (0-200) | `array_length(profiles.countries_visited, 1)` |
| Bargaining Comfort | Dropdown | `profiles.bargaining_comfort` |
| Has Travel Preferences | Checkbox | `profiles.travel_preferences IS NOT NULL AND profiles.travel_preferences != '{}'` |

**Engagement & Notifications:**
| Filter | Type | Source |
|--------|------|--------|
| Push Enabled | Checkbox: Yes, No | `EXISTS (SELECT 1 FROM user_devices WHERE user_id = profiles.id AND push_enabled = true)` |
| Email Opted In | Checkbox: Yes, No | `user_notification_preferences.email_enabled` |
| SMS Opted In | Checkbox: Yes, No | `user_notification_preferences.sms_enabled` |

**Geographic:**
| Filter | Type | Source |
|--------|------|--------|
| Continent | Multi-select: Africa, Asia, Europe, North America, South America, Oceania, Antarctica | Derived from `profiles.country` using a country-to-continent map |
| Timezone | Multi-select dropdown | `profiles.timezone` distinct values |

**Right Panel — Live Results:**
- **User count** updating in real-time as filters change (debounced 500ms)
- **User preview table** showing first 20 matching users: Avatar, Name, Email, Country, Membership, Last Active
- **AND/OR logic toggle** at the top (default: AND — all filters must match)

**Actions:**
- **Save Segment** — Name, description, save filters as JSON to `admin_saved_segments`
- **Export CSV** — Download matching users as CSV (name, email, country, membership, last active, trip count)
- **Send Email** — Route to Email Campaign Composer with this segment pre-selected
- **Send Push** — Route to Notifications Compose (`/admin/notifications/compose?segmentId=xxx`)

#### Page 3: Saved Segments Library (`/admin/marketing/segments/saved`)

Table of all saved segments:
- Columns: Name, Description, User Count, Filters (summary), Last Used, Created At
- User count auto-refreshes (re-run the filter query every time page loads)
- Click row → opens Segment Builder pre-filled with this segment's filters
- **Actions per segment:** Edit, Duplicate, Delete, Send Email, Send Push, Export CSV

#### Page 4: Email Campaign Builder (`/admin/marketing/campaigns/compose`)

Full email composer — like Mailchimp/Brevo but built-in.

**Section A: Audience**
- **Saved Segment** dropdown (from `admin_saved_segments`)
- **All Users** option
- **Specific User(s)** — multi-select search
- Live recipient count + warning if any users have `email_enabled = false`
- Show "X users will receive this email (Y opted out of email)"

**Section B: Email Content**

- **Campaign Name** — Internal name for tracking (not shown to users), max 100 chars
- **From Name** — Dropdown: "Guidera", "Guidera Travel", "Guidera Deals", "Guidera Community" (all use `@guidera.one`)
- **From Address** — Dropdown: `hello@guidera.one`, `deals@guidera.one`, `community@guidera.one`, `noreply@guidera.one`
- **Reply-To** — Default: `support@guidera.one`, editable
- **Subject Line** — Text input, max 120 chars, with character counter. Supports `{{first_name}}` placeholder.
- **Preview Text** — Text input, max 160 chars (the gray text shown after subject in inbox)
- **Email Body** — Rich HTML editor with these options:
  1. **Template Gallery** — Pre-built templates (see templates below)
  2. **Custom HTML** — Raw HTML editor with syntax highlighting
  3. **Simple Editor** — WYSIWYG with heading, bold, italic, link, image, button, divider

**Pre-built Email Templates:**

1. **Welcome / Onboarding**
   - Hero image, welcome message, CTA to complete profile
   - Variables: `{{first_name}}`

2. **Trip Inspiration**
   - Featured destination card with image, description
   - Variables: `{{first_name}}`, `{{destination_name}}`, `{{destination_image}}`

3. **Deal Alert**
   - Deal card with price, discount %, CTA
   - Variables: `{{first_name}}`, `{{deal_title}}`, `{{deal_price}}`, `{{deal_url}}`

4. **Community Update**
   - New groups, events, activities in their area
   - Variables: `{{first_name}}`, `{{city}}`

5. **Re-engagement**
   - "We miss you" message with personalized stats
   - Variables: `{{first_name}}`, `{{trips_count}}`, `{{days_inactive}}`

6. **Product Update / Announcement**
   - Feature announcement with screenshots
   - Variables: `{{first_name}}`

7. **Plain Text**
   - Simple text-only email (high deliverability)
   - Variables: `{{first_name}}`

All templates share a common wrapper:
```html
<!-- Common header: Guidera logo -->
<!-- Template-specific content -->
<!-- Common footer: Unsubscribe link, Guidera address, social links -->
```

**The unsubscribe link** should point to: `https://guidera.one/unsubscribe?userId={{user_id}}&token={{unsubscribe_token}}`
(For now, generate a simple HMAC token from userId + secret. The unsubscribe handler sets `user_notification_preferences.email_enabled = false`.)

**Variable Replacement:** Before sending, replace `{{first_name}}` with the actual user's first_name from `profiles`, `{{user_id}}` with their ID, etc. If a variable is empty, use a sensible fallback (e.g., "Traveler" for empty first_name).

**Section C: Delivery**
- **Send Now** or **Schedule** (date/time picker with timezone)
- **Send Test Email** — Send to a specific email address (admin's own) to preview

**Section D: Preview**
- **Desktop Preview** — Shows email in a desktop inbox mockup (600px wide)
- **Mobile Preview** — Shows email in a phone frame (320px wide)
- Both update live as you edit

**Section E: Confirm & Send**
- Summary: "Sending to X users via email from hello@guidera.one"
- Estimated send time (Resend processes ~100/sec)
- **Send** / **Schedule** button with confirmation dialog

#### Page 5: Campaign History (`/admin/marketing/campaigns`)

Table of all sent campaigns:
- Columns: Campaign Name, Subject, Segment, Recipients, Sent, Delivered, Opened, Clicked, Failed, Sent At, Status
- Click row → Campaign Detail view with:
  - Full email preview
  - Delivery stats chart (sent → delivered → opened → clicked funnel)
  - Per-user delivery status table
  - Resend failed emails button

#### Page 6: Cohort Analysis (`/admin/marketing/cohorts`)

**Signup Cohort Retention:**
- Heatmap table: rows = signup week/month, columns = weeks since signup
- Cell = % of cohort still active (had `last_seen_at` within that week)
- Source: `profiles.created_at` for cohort, `profiles.last_seen_at` for activity

**Feature Adoption Funnels:**
- Funnel 1: Signup → Complete Onboarding → Create First Trip → Create Second Trip
- Funnel 2: Signup → Browse Deals → Click Deal → Save Deal
- Funnel 3: Signup → Join Group → Send Message → Create Post
- Funnel 4: Signup → Use AI Chat → Generate Snapshot → Plan Trip
- Each funnel shows: count at each step, drop-off %, conversion rate
- Source: Count from respective tables filtered by user cohort

**Monetization Funnel:**
- Free → Premium → Pro conversion rates
- Avg time to convert
- Source: `profiles.membership_type` + `profiles.created_at`

#### Page 7: Popular Searches (`/admin/marketing/searches`)

Table from `popular_searches`:
- Columns: Search Term, Search Count, Last Searched, Category
- Filters: By date range, by category
- Chart: Top 20 searches as horizontal bar chart
- Geographic breakdown: Searchees by user country (if joined with profiles)

---

### NEW DATABASE TABLES NEEDED

```sql
-- Email campaigns (the campaign definition + results)
CREATE TABLE admin_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                           -- internal campaign name
  subject text NOT NULL,                        -- email subject line
  preview_text text,                            -- inbox preview text
  from_name text DEFAULT 'Guidera',             -- sender display name
  from_address text DEFAULT 'hello@guidera.one',
  reply_to text DEFAULT 'support@guidera.one',
  html_content text NOT NULL,                   -- full HTML email body
  template_id text,                             -- which template was used
  segment_id uuid REFERENCES admin_saved_segments(id),
  targeting_mode text NOT NULL,                 -- 'all' | 'segment' | 'specific'
  targeting_details jsonb DEFAULT '{}',         -- { userIds: [...] } for specific
  total_recipients integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  emails_delivered integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  emails_clicked integer DEFAULT 0,
  emails_bounced integer DEFAULT 0,
  emails_failed integer DEFAULT 0,
  status text DEFAULT 'draft',                  -- 'draft' | 'sending' | 'sent' | 'scheduled' | 'failed'
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual email send records (one per recipient per campaign)
CREATE TABLE admin_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES admin_email_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  email text NOT NULL,
  resend_email_id text,                         -- Resend's email ID for tracking
  status text DEFAULT 'pending',                -- 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_email_sends_campaign ON admin_email_sends(campaign_id);
CREATE INDEX idx_email_sends_user ON admin_email_sends(user_id);

-- Email templates (reusable HTML templates)
CREATE TABLE admin_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,                    -- 'welcome', 'deal-alert', 're-engagement', etc.
  description text,
  category text DEFAULT 'general',              -- 'onboarding' | 'marketing' | 'transactional' | 'engagement'
  subject_template text NOT NULL,               -- with {{variable}} placeholders
  html_template text NOT NULL,                  -- full HTML with {{variable}} placeholders
  preview_text_template text,
  available_variables text[] DEFAULT '{}',       -- ['first_name', 'city', 'destination_name', ...]
  thumbnail_url text,                           -- preview image of the template
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### NEW EDGE FUNCTION NEEDED

Create `admin-send-email-campaign` edge function:

```typescript
// supabase/functions/admin-send-email-campaign/index.ts
//
// Accepts: {
//   campaignId: uuid,            -- references admin_email_campaigns
//   testEmail?: string           -- if provided, send only to this address (test mode)
// }
//
// Flow:
// 1. Load campaign from admin_email_campaigns
// 2. Load segment filters → query profiles to get recipients
// 3. Filter out users where email_enabled = false (from user_notification_preferences)
// 4. Filter out users where deleted_at IS NOT NULL
// 5. For each recipient:
//    a. Replace {{variables}} in subject + HTML (first_name, city, user_id, unsubscribe_token)
//    b. INSERT into admin_email_sends with status 'pending'
// 6. Batch send via Resend /emails/batch (100 per batch)
// 7. Update admin_email_sends with resend_email_id + status
// 8. Update admin_email_campaigns with totals (emails_sent, etc.)
// 9. Also INSERT into admin_notification_sends (shared table with Notifications) for cross-module visibility
// 10. Return { success, totalSent, totalFailed }
//
// For test mode: Skip steps 2-4, just send to testEmail with sample data
```

Create `admin-email-webhook` edge function (for Resend delivery tracking):

```typescript
// supabase/functions/admin-email-webhook/index.ts
//
// Resend sends webhooks for: email.sent, email.delivered, email.opened, 
// email.clicked, email.bounced, email.complained
//
// Flow:
// 1. Verify webhook signature (Resend signs webhooks with a secret)
// 2. Extract resend_email_id from payload
// 3. UPDATE admin_email_sends SET status + timestamp based on event type
// 4. UPDATE admin_email_campaigns aggregate counts
// 5. Return 200 OK
```

Deploy both with `--no-verify-jwt` (webhooks don't send JWTs).

Register the webhook URL in Resend dashboard: `https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/admin-email-webhook`

---

### NEXT.JS API ROUTES NEEDED

```
POST   /api/marketing/segments              -- Create saved segment
GET    /api/marketing/segments              -- List all saved segments
GET    /api/marketing/segments/[id]         -- Get segment by ID
PUT    /api/marketing/segments/[id]         -- Update segment
DELETE /api/marketing/segments/[id]         -- Delete segment
POST   /api/marketing/segments/count        -- Count users matching filters (body: { filters })
POST   /api/marketing/segments/preview      -- Preview users matching filters (first 20)
POST   /api/marketing/segments/export       -- Export segment as CSV

POST   /api/marketing/campaigns             -- Create email campaign
GET    /api/marketing/campaigns             -- List all campaigns
GET    /api/marketing/campaigns/[id]        -- Get campaign detail + per-user stats
PUT    /api/marketing/campaigns/[id]        -- Update draft campaign
DELETE /api/marketing/campaigns/[id]        -- Delete draft campaign
POST   /api/marketing/campaigns/[id]/send   -- Trigger send (calls edge function)
POST   /api/marketing/campaigns/[id]/test   -- Send test email

GET    /api/marketing/templates             -- List email templates
POST   /api/marketing/templates             -- Create template
PUT    /api/marketing/templates/[id]        -- Update template
DELETE /api/marketing/templates/[id]        -- Delete template

GET    /api/marketing/cohorts               -- Get cohort retention data
GET    /api/marketing/cohorts/funnel        -- Get funnel data (query param: funnel_type)

GET    /api/marketing/searches              -- Get popular searches with filters
```

All routes use `createClient` from `@supabase/supabase-js` with the service role key.

---

### SEGMENT FILTER QUERY BUILDER

The API route `/api/marketing/segments/count` and `/preview` must translate the filters JSON into a Supabase query. The filters JSON structure:

```typescript
interface SegmentFilters {
  // Demographics
  age_min?: number;              // computed: date_of_birth <= today - age_min years
  age_max?: number;
  gender?: string[];             // IN filter
  ethnicity?: string[];
  nationality?: string[];
  country_of_residence?: string[];
  city?: string[];
  languages?: string[];          // ANY overlap with languages_spoken array
  profession_search?: string;    // ILIKE '%search%'
  industry?: string[];
  
  // Account
  membership_type?: string[];    // ['free', 'premium', 'pro']
  is_verified?: boolean;
  identity_verified?: boolean;
  email_verified?: boolean;
  onboarding_completed?: boolean;
  signup_after?: string;         // ISO date
  signup_before?: string;
  last_active_days?: number;     // last_seen_at >= now() - interval 'X days'
  inactive_days?: number;        // last_seen_at <= now() - interval 'X days'
  
  // Travel Profile
  activity_level?: string[];
  food_adventurousness?: string[];
  packing_style?: string[];
  morning_person?: boolean;
  crowd_comfort?: string[];
  photography_level?: string[];
  international_trips_min?: number;
  international_trips_max?: number;
  countries_visited_min?: number;
  
  // Behavior (requires subqueries)
  trip_count_min?: number;
  trip_count_max?: number;
  ai_sessions_min?: number;
  deal_clicks_min?: number;
  community_posts_min?: number;
  is_in_group?: boolean;
  has_buddy_connections?: boolean;
  is_guide_applicant?: boolean;
  has_saved_items?: boolean;
  has_price_alerts?: boolean;
  
  // Engagement
  push_enabled?: boolean;
  email_opted_in?: boolean;
  sms_opted_in?: boolean;
  
  // Geographic
  continent?: string[];          // map to countries, then filter
  timezone?: string[];
  
  // Logic
  match_mode?: 'all' | 'any';   // AND vs OR (default: 'all')
}
```

Build the query using Supabase's `.from('profiles').select()` with chained `.eq()`, `.in()`, `.gte()`, `.lte()`, `.ilike()`, `.overlaps()` etc.

For behavioral filters (trip_count, ai_sessions, etc.), use raw SQL via `supabase.rpc()` or build a Postgres function that accepts the filters JSON and returns matching user IDs.

**Recommended approach:** Create a Postgres function `get_segment_users(filters jsonb)` that handles the complex JOINs server-side for better performance:

```sql
CREATE OR REPLACE FUNCTION get_segment_users(filters jsonb, result_limit int DEFAULT 1000)
RETURNS TABLE(user_id uuid) AS $$
  -- Build dynamic query based on filters
  -- Handle JOINs for behavioral filters
  -- Return matching user IDs
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_segment_users(filters jsonb)
RETURNS bigint AS $$
  SELECT count(*) FROM get_segment_users(filters, 999999);
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### COUNTRY TO CONTINENT MAP

Use this mapping for the continent filter:

```typescript
const CONTINENT_COUNTRIES: Record<string, string[]> = {
  'Africa': ['Algeria', 'Angola', 'Benin', 'Botswana', ...],
  'Asia': ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'UAE', 'Uzbekistan', 'Vietnam', 'Yemen'],
  'Europe': ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia', 'Bulgaria', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom', 'Vatican City'],
  'North America': ['Antigua', 'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica', 'Cuba', 'Dominica', 'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Saint Kitts', 'Saint Lucia', 'Saint Vincent', 'Trinidad and Tobago', 'United States', 'US', 'USA'],
  'South America': ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
  'Oceania': ['Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'],
};
```

---

### UI/UX REQUIREMENTS

- **Dark theme** consistent with admin panel (dark-900 backgrounds, dark-700 borders, brand-500 teal accent)
- **shadcn/ui components**: Button, Input, Textarea, Select, Checkbox, RadioGroup, Slider, DatePicker, Dialog, Table, Badge, Card, Tabs, Accordion, Sheet
- **Responsive** but desktop-first
- Filter changes debounced 500ms before re-querying user count
- Live preview updates as email content is edited
- Template gallery as a grid of cards with thumbnail + name
- Cohort heatmap uses color gradient (green → yellow → red based on retention %)
- Funnel charts as horizontal bars with step labels and drop-off percentages
- Campaign detail page shows a proper delivery funnel visualization
- Loading states on all async operations
- Success/error toast notifications
- Confirmation dialogs before sending campaigns ("Send to X users?")
- CSV export downloads immediately via browser (no email delivery of CSV)

---

### ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkydmdygctojtfzbqcud.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard → Settings → API>
RESEND_API_KEY=<already in Supabase secrets — also add to Next.js .env for direct API calls>
```

---

### FILE STRUCTURE

```
app/admin/marketing/
├── page.tsx                        -- Marketing dashboard
├── segments/
│   ├── page.tsx                    -- Segment builder
│   └── saved/
│       └── page.tsx                -- Saved segments library
├── campaigns/
│   ├── page.tsx                    -- Campaign history
│   ├── compose/
│   │   └── page.tsx                -- Email campaign composer
│   └── [id]/
│       └── page.tsx                -- Campaign detail + analytics
├── cohorts/
│   └── page.tsx                    -- Cohort analysis + funnels
├── searches/
│   └── page.tsx                    -- Popular searches

app/api/marketing/
├── segments/
│   ├── route.ts                    -- GET (list) + POST (create)
│   ├── [id]/route.ts               -- GET + PUT + DELETE
│   ├── count/route.ts              -- POST: count matching users
│   ├── preview/route.ts            -- POST: preview matching users
│   └── export/route.ts             -- POST: CSV export
├── campaigns/
│   ├── route.ts                    -- GET (list) + POST (create)
│   ├── [id]/
│   │   ├── route.ts                -- GET + PUT + DELETE
│   │   ├── send/route.ts           -- POST: trigger campaign send
│   │   └── test/route.ts           -- POST: send test email
├── templates/
│   └── route.ts                    -- CRUD
├── cohorts/
│   └── route.ts                    -- GET: cohort + funnel data
├── searches/
│   └── route.ts                    -- GET: popular searches

components/marketing/
├── SegmentBuilder.tsx              -- Full filter UI with accordion sections
├── FilterSection.tsx               -- Single collapsible filter category
├── FilterControl.tsx               -- Renders appropriate input for filter type
├── SegmentPreviewPanel.tsx         -- Right panel: user count + preview table
├── SavedSegmentsTable.tsx          -- Table for saved segments
├── EmailComposer.tsx               -- Main email composer orchestrator
├── EmailContentEditor.tsx          -- Subject, preview text, body editor
├── TemplateGallery.tsx             -- Grid of email templates
├── HtmlEditor.tsx                  -- Raw HTML editor with syntax highlighting
├── EmailPreview.tsx                -- Desktop + mobile preview frames
├── CampaignHistoryTable.tsx        -- Campaign list table
├── CampaignDetail.tsx              -- Single campaign analytics view
├── DeliveryFunnel.tsx              -- Sent→Delivered→Opened→Clicked funnel chart
├── CohortHeatmap.tsx               -- Retention heatmap
├── FunnelChart.tsx                 -- Feature adoption funnel
├── PopularSearchesChart.tsx        -- Bar chart for trending searches
├── AudiencePicker.tsx              -- Shared: segment dropdown + all users + specific users

lib/
├── supabase-admin.ts               -- createClient with service_role key
├── segment-query-builder.ts        -- Translates filters JSON → Supabase query
├── email-variable-replacer.ts      -- Replaces {{variables}} in templates
├── continent-map.ts                -- Country → continent mapping
├── unsubscribe-token.ts            -- HMAC token generation for unsubscribe links
```

---

### TESTING

1. **Segment Builder:** Create a segment "US Premium Users" → verify user count matches manual SQL query
2. **Save Segment:** Save the segment → verify it appears in Saved Segments AND in Notifications Compose dropdown
3. **Email Template:** Create a campaign using "Deal Alert" template with `{{first_name}}` → verify variable replacement in test email
4. **Send Test:** Send test email to your own address → verify it arrives with correct content + unsubscribe link
5. **Send Campaign:** Send to a 2-person segment → verify both emails arrive, `admin_email_sends` records created, `admin_email_campaigns` counts updated
6. **Webhook Tracking:** After Resend delivers, verify `admin_email_sends.status` updates to 'delivered' then 'opened'
7. **Cohort Heatmap:** Verify retention percentages match expected values from raw SQL
8. **CSV Export:** Export a segment → verify CSV contains correct columns and data
9. **Cross-module:** Verify campaign send creates a record in `admin_notification_sends` visible in Notifications history

## PROMPT END
