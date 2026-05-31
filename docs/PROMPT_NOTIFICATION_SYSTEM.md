# Cursor Prompt: Build Admin Notification Center

Copy everything below the line and paste it into Cursor as a single prompt.

---

## PROMPT START

Build a complete **Admin Notification Center** for the Guidera admin panel. This is the **delivery engine** — compose, send, schedule, and track push notifications, in-app notifications, and emails. It does NOT own segmentation/cohorts/campaigns (those live in a separate Marketing section that shares saved segments with this module).

The admin panel is a **Next.js 15 app** using **Tailwind CSS + shadcn/ui** with a dark theme. It connects to **Supabase** (project ID: `pkydmdygctojtfzbqcud`) using the **service_role key** (server-side only, never exposed client-side).

### HOW NOTIFICATIONS & MARKETING RELATE

- **Marketing & Segmentation** (separate section, built separately) owns: Segment Builder (50+ filters), Saved Segments library, Cohort Analysis, Campaign tracking, Popular Searches
- **Notifications & Alerts** (this prompt) owns: Compose & Send, Alert Center (history), Push Management, Scheduled Queue, Templates
- **Connection:** The Compose page has a "Pick Saved Segment" dropdown that reads from the `admin_saved_segments` table (created by Marketing). It also has quick "All Users" and "Specific User" targeting and a simplified inline filter for one-off sends.

---

### EXISTING INFRASTRUCTURE (DO NOT RECREATE — USE THESE)

#### 1. Database Tables (already exist in Supabase)

**`alerts`** — The main notification table. The mobile app subscribes to this via Supabase Realtime.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
alert_type_id   uuid REFERENCES alert_types(id)
alert_type_code text NOT NULL          -- e.g. 'deal_alert', 'trip_reminder', 'admin_broadcast'
category_code   text NOT NULL          -- 'trip' | 'safety' | 'financial' | 'social' | 'system'
user_id         uuid NOT NULL REFERENCES profiles(id)
trip_id         uuid REFERENCES trips(id)
title           text NOT NULL
body            text NOT NULL
icon            text                   -- icon name (e.g. 'Notification', 'TicketStar', 'Airplane')
image_url       text                   -- optional image to show in notification
context         jsonb DEFAULT '{}'     -- arbitrary metadata
action_url      text                   -- deep link (e.g. '/deals/123', '/trip/456')
priority        integer DEFAULT 5      -- 1-10, 8+ bypasses quiet hours
channels_requested text[] DEFAULT ARRAY['push']  -- 'push', 'in_app', 'email'
channels_delivered text[] DEFAULT '{}'
batch_id        uuid REFERENCES alert_batches(id)
is_batched      boolean DEFAULT false
status          text DEFAULT 'pending' -- 'pending' | 'delivered' | 'read' | 'actioned' | 'failed'
scheduled_for   timestamptz            -- null = send immediately
delivered_at    timestamptz
read_at         timestamptz
actioned_at     timestamptz
expires_at      timestamptz
created_at      timestamptz DEFAULT now()
```

**`alert_types`** — Notification templates with configurable channels and batching.
```sql
id                  uuid PRIMARY KEY
code                text UNIQUE NOT NULL  -- e.g. 'flight_delay', 'price_drop', 'admin_broadcast'
category_id         uuid REFERENCES alert_categories(id)
name                text NOT NULL
description         text
title_template      text NOT NULL         -- supports {{variable}} placeholders
body_template       text NOT NULL
action_template     text                  -- deep link template
icon                text
priority_level      integer DEFAULT 5
allowed_channels    text[] DEFAULT ARRAY['push', 'in_app']
default_channel     text DEFAULT 'push'
can_batch           boolean DEFAULT false
batch_window_minutes integer DEFAULT 30
max_batch_size      integer DEFAULT 10
batch_title_template text
is_active           boolean DEFAULT true
```

**`alert_categories`** — Category grouping with icons/colors.
```sql
id             uuid PRIMARY KEY
code           text UNIQUE NOT NULL  -- 'trip', 'safety', 'financial', 'social', 'system'
name           text NOT NULL
description    text
icon           text
color          text
priority_base  integer DEFAULT 5
is_active      boolean DEFAULT true
```

**`alert_batches`** — Tracks broadcast/bulk send jobs.
```sql
id              uuid PRIMARY KEY
user_id         uuid NOT NULL REFERENCES profiles(id)
alert_type_code text NOT NULL
alert_count     integer DEFAULT 0
title           text
channels        text[]
status          text DEFAULT 'collecting'  -- 'collecting' | 'sending' | 'sent' | 'failed'
deliver_at      timestamptz NOT NULL
delivered_at    timestamptz
created_at      timestamptz DEFAULT now()
```

**`user_devices`** — Expo push tokens for each user's devices.
```sql
id              uuid PRIMARY KEY
user_id         uuid NOT NULL REFERENCES profiles(id)
device_id       text NOT NULL
device_name     text
device_type     text
device_model    text
os_version      text
app_version     text
push_token      text            -- Expo push token (ExponentPushToken[xxx])
push_enabled    boolean DEFAULT true
platform        text            -- 'ios' | 'android'
is_active       boolean DEFAULT true
last_active_at  timestamptz
created_at      timestamptz DEFAULT now()
```

**`user_notification_preferences`** — Per-user opt-in/out and quiet hours.
```sql
id                      uuid PRIMARY KEY
user_id                 uuid NOT NULL REFERENCES profiles(id)
notifications_enabled   boolean DEFAULT true
quiet_hours_enabled     boolean DEFAULT false
quiet_hours_start       time DEFAULT '22:00'
quiet_hours_end         time DEFAULT '08:00'
quiet_hours_timezone    text DEFAULT 'UTC'
category_preferences    jsonb DEFAULT '{}'   -- { "trip": { "enabled": true }, "social": { "enabled": false } }
type_preferences        jsonb DEFAULT '{}'
push_enabled            boolean DEFAULT true
email_enabled           boolean DEFAULT true
sms_enabled             boolean DEFAULT false
```

**`profiles`** — User profiles (17 users). Key fields for segmentation:
```
id, first_name, last_name, email, phone, city, country, country_code, timezone,
membership_type ('free'|'premium'|'pro'), is_verified, identity_verified,
onboarding_completed, ethnicity, nationality, country_of_residence,
languages_spoken, profession, industry, activity_level, food_adventurousness,
cuisine_preferences, packing_style, morning_person, crowd_comfort,
photography_level, international_trips_count, countries_visited,
date_of_birth, gender, created_at, last_seen_at, deleted_at
```

**`scheduled_notification_jobs`** — For scheduling future sends.
```sql
id              uuid PRIMARY KEY
user_id         uuid NOT NULL REFERENCES profiles(id)
trip_id         uuid REFERENCES trips(id)
booking_id      uuid
alert_type_code varchar NOT NULL
alert_data      jsonb DEFAULT '{}'
scheduled_for   timestamptz NOT NULL
status          varchar DEFAULT 'pending'  -- 'pending' | 'processing' | 'completed' | 'failed'
processed_at    timestamptz
error           text
created_at      timestamptz DEFAULT now()
```

#### 2. Existing Edge Function: `send-notification`

**URL:** `https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/send-notification`
**Auth:** Service role key in Authorization header
**Already deployed and working.**

Actions it supports:
- `{ action: "send_to_user", userId, title, body, typeCode, category, data, actionUrl, priority, channels, tripId }` — Creates alert + sends push immediately
- `{ action: "dispatch_pending" }` — Processes all pending alerts and sends push via Expo Push API
- `{ action: "process_scheduled" }` — Processes scheduled_notification_jobs that are due
- `{ type: "email", to, subject, body }` — Sends email via Resend API (already configured with RESEND_API_KEY)

The function already:
- Batches Expo push in chunks of 100
- Respects quiet hours (priority >= 8 bypasses)
- Respects category preferences
- Marks alerts as delivered with channels_delivered

#### 3. Mobile App (React Native / Expo)

The mobile app has `useNotifications` hook (`src/hooks/useNotifications.ts`) that:
- Queries `alerts` table WHERE `user_id = currentUser` AND `status IN ('delivered', 'read', 'actioned')`
- Subscribes to Supabase Realtime on the `alerts` table for INSERT events
- Shows unread count badge on the notification bell
- When a new alert is INSERTed with status 'delivered', it appears instantly in the app

**This means: any row inserted into `alerts` with status 'delivered' will automatically appear in the user's notification center in real-time. No additional mobile work needed.**

#### 4. Email: Resend API

Already configured. The `send-notification` edge function already handles `{ type: "email" }`. Resend API key is in Supabase secrets as `RESEND_API_KEY`. Sender: `Guidera Emergency <emergency@guidera.one>`.

---

### WHAT TO BUILD

Build these pages/components in the admin panel:

#### Page 1: Notification Center Dashboard (`/admin/notifications`)

A dashboard showing:
- **KPI Cards:** Total sent (today/week/month), delivery rate, open rate (read_at not null / total), active price alerts, scheduled pending
- **Recent Notifications:** Table showing last 50 alerts with columns: User, Title, Category, Channels, Status, Sent At
- **Quick Actions:** "Compose New", "View Scheduled", "Manage Templates"

#### Page 2: Compose Notification (`/admin/notifications/compose`)

This is the main composer — like OneSignal's message builder. It has these sections:

**Section A: Audience Targeting**
Radio buttons for targeting mode:
1. **All Users** — Broadcast to everyone (show total user count)
2. **Specific User** — Search/select a single user by name or email (autocomplete search against `profiles`)
3. **Saved Segment** — Dropdown that reads from `admin_saved_segments` table. Shows segment name + user count. If no segments exist yet, show "No saved segments — create them in Marketing > Segments"
4. **Quick Filter** — A simplified inline filter for one-off sends. Only includes these 5 most-used filters:
   - **Country** — dropdown multi-select from distinct `country` values in `profiles`
   - **Membership** — checkbox: Free, Premium, Pro (from `profiles.membership_type`)
   - **Last Active** — dropdown: Today, This Week, This Month, 30+ Days Inactive (computed from `profiles.last_seen_at`)
   - **Verification** — checkbox: Verified, Unverified (from `profiles.is_verified`)
   - **Onboarding** — checkbox: Completed, Incomplete (from `profiles.onboarding_completed`)

For all modes, show a **live user count** as the selection changes (debounced 500ms query against `profiles`).

Note: The full 50+ attribute segment builder lives in the Marketing section (`/admin/marketing/segments`). This Notifications composer only has the quick filter for convenience. For complex targeting, admins create a segment in Marketing first, then pick it here via "Saved Segment".

**Section B: Notification Content**

- **Icon Picker** — Grid of ~20 icon options with visual preview. Icons should map to iconsax icon names used in the app:
  `Notification, TicketStar, Airplane, Calendar, DollarCircle, Heart, Location, Shield, People, Gift, Flash, Star, Cup, Briefcase, Map1, Camera, Music, ShoppingBag, Lamp, MessageText`
  Show each as a colored circle with the icon name. The selected icon name gets stored in `alerts.icon`.

- **Title** — Text input, max 60 characters, with character counter. This is the push notification title.

- **Message Body** — Textarea, max 200 characters, with character counter. This is the push notification body.

- **Image URL** (optional) — Text input for an image URL to include. Preview the image if provided. Stored in `alerts.image_url`.

- **Deep Link** (optional) — Dropdown + text input for the action URL. Predefined options:
  - `/deals/[id]` — Link to a specific deal
  - `/trip/[id]` — Link to a specific trip  
  - `/events/[id]` — Link to a specific event
  - `/destinations/[id]` — Link to a destination
  - `/community` — Community tab
  - `/account/rewards` — Rewards page
  - Custom URL — free text input

- **Category** — Dropdown: trip, safety, financial, social, system (stored in `alerts.category_code`)

- **Priority** — Slider 1-10 with labels: 1-3 Low, 4-6 Normal, 7-8 High, 9-10 Critical (8+ bypasses quiet hours)

**Section C: Delivery Options**

- **Channels** — Checkboxes: Push Notification, In-App Notification, Email
  - If Email is checked, show additional fields:
    - Email Subject (defaults to Title)
    - Email Body (rich text, defaults to Message Body)

- **Schedule** — Radio: Send Now / Schedule for Later
  - If Schedule: Date/time picker with timezone selector

**Section D: Preview**

Live preview panel showing:
- **Phone mockup** showing how the push notification will look (title, body, icon)
- **In-app mockup** showing how it appears in the notification center
- **Email preview** if email channel is selected

**Section E: Confirm & Send**

- Summary card: "Sending to X users via push + in-app"
- **Send / Schedule** button
- Confirmation modal: "Are you sure you want to send this notification to X users?"

**On Send, the backend logic should:**

1. Query `profiles` matching the segment filters to get user IDs
2. For each user:
   a. INSERT a row into `alerts` with all the composed fields, `status: 'pending'`
   b. If email channel is selected, call `send-notification` edge function with `{ type: "email", to: user.email, subject, body: emailHtml }`
3. Call `send-notification` edge function with `{ action: "dispatch_pending" }` to process all the pending alerts and send push notifications
4. Log the broadcast in `alert_batches` table

If scheduled: INSERT into `scheduled_notification_jobs` instead, with the composed data in `alert_data` JSONB. The existing cron job will pick it up at the scheduled time.

#### Page 3: Notification History (`/admin/notifications/history`)

Full table of all sent notifications with:
- Filters: By category, by channel, by status, by date range, by user
- Columns: Title, Body (truncated), Category, User(s), Channels, Status, Sent At, Read At
- Click row to see full details
- Export to CSV

#### Page 4: Scheduled Notifications (`/admin/notifications/scheduled`)

Table of upcoming scheduled notifications from `scheduled_notification_jobs` WHERE `status = 'pending'`:
- Columns: Title, Target, Scheduled For, Created By, Status
- Actions: Edit, Cancel (delete), Send Now

#### Page 5: Notification Templates (`/admin/notifications/templates`)

CRUD interface for `alert_types` table:
- List all templates with name, category, channels, priority
- Create/edit form: name, code, title_template, body_template, icon, priority, channels, batching settings
- Templates support `{{variable}}` placeholders (e.g., `{{first_name}}`, `{{destination}}`, `{{deal_title}}`)

#### Page 6: Device Management (`/admin/notifications/devices`)

Table of all registered devices from `user_devices` table:
- Columns: User (join profiles), Device Model, Platform (iOS/Android), OS Version, App Version, Push Enabled, Last Active
- Filters: By platform, by push_enabled status, by last_active_at
- Actions: Send test push to specific device, deactivate device
- Stats cards: Total devices, iOS vs Android split, Push enabled %, Avg app version

Note: Saved Segments live in Marketing (`/admin/marketing/segments`), not here. The Notifications composer reads from them via a dropdown.

---

### NEW DATABASE TABLES NEEDED

Create one table for saved segments (shared between Marketing and Notifications):

```sql
CREATE TABLE admin_saved_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}',  -- { "country": ["US","UK"], "membership_type": ["premium"], "last_active_days": 30, ... }
  user_count integer DEFAULT 0,
  created_by text,  -- admin identifier
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Create one table for tracking broadcast/campaign sends:

```sql
CREATE TABLE admin_notification_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  icon text,
  image_url text,
  action_url text,
  category text NOT NULL,
  priority integer DEFAULT 5,
  channels text[] DEFAULT ARRAY['push', 'in_app'],
  targeting_mode text NOT NULL,  -- 'all' | 'user' | 'segment' | 'quick_filter'
  targeting_details jsonb DEFAULT '{}',  -- { segment_id, userId, filters }
  segment_id uuid REFERENCES admin_saved_segments(id),
  total_recipients integer DEFAULT 0,
  push_sent integer DEFAULT 0,
  push_delivered integer DEFAULT 0,
  email_sent integer DEFAULT 0,
  in_app_sent integer DEFAULT 0,
  status text DEFAULT 'draft',  -- 'draft' | 'sending' | 'sent' | 'scheduled' | 'failed'
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz DEFAULT now()
);
```

Also add an `admin_broadcast` type to `alert_types` if it doesn't exist:

```sql
INSERT INTO alert_types (code, name, title_template, body_template, icon, priority_level, allowed_channels, default_channel)
VALUES ('admin_broadcast', 'Admin Broadcast', '{{title}}', '{{body}}', 'Notification', 5, ARRAY['push', 'in_app', 'email'], 'push')
ON CONFLICT (code) DO NOTHING;
```

---

### NEW EDGE FUNCTION NEEDED

Create `admin-broadcast-notification` edge function:

```typescript
// supabase/functions/admin-broadcast-notification/index.ts
// 
// Accepts: { 
//   title, body, icon, imageUrl, actionUrl, category, priority, 
//   channels: ['push', 'in_app', 'email'],
//   targeting: { mode: 'all' | 'user' | 'segment', userId?, filters? },
//   emailSubject?, emailBody?,
//   scheduleFor?: ISO string (null = immediate)
// }
//
// Flow:
// 1. Build user query from targeting.filters against profiles table
// 2. Batch insert into alerts table (chunks of 100)
// 3. If email channel: batch send via Resend API
// 4. Call send-notification with { action: 'dispatch_pending' } to fire push
// 5. Log to alert_batches
// 6. Return { success, totalUsers, pushSent, emailSent, inAppSent }
```

Use `SUPABASE_SERVICE_ROLE_KEY` (already in Supabase secrets) to bypass RLS.
Use `RESEND_API_KEY` (already in Supabase secrets) for email.
Deploy with `--no-verify-jwt` since admin panel will authenticate its own requests.

---

### NEXT.JS API ROUTES NEEDED

Create these server-side API routes (they call Supabase with service_role key):

1. **`POST /api/notifications/send`** — Calls `admin-broadcast-notification` edge function
2. **`GET /api/notifications/history`** — Queries `alerts` with filters, pagination
3. **`GET /api/notifications/sends`** — Queries `admin_notification_sends` (broadcast history)
4. **`GET /api/notifications/scheduled`** — Queries `scheduled_notification_jobs`
5. **`POST /api/notifications/cancel-scheduled`** — Deletes a scheduled job
6. **`GET /api/notifications/audience-count`** — Queries `profiles` with filters OR loads saved segment, returns count
7. **`GET /api/notifications/segments`** — READ ONLY: Lists `admin_saved_segments` for the composer dropdown (CRUD lives in Marketing)
8. **`CRUD /api/notifications/templates`** — CRUD for `alert_types`
9. **`GET /api/notifications/devices`** — Queries `user_devices` with filters, pagination
10. **`POST /api/notifications/test-push`** — Send test push to a specific device token

All routes should use `createClient` from `@supabase/supabase-js` with the service role key from environment variables.

---

### UI/UX REQUIREMENTS

- **Dark theme** consistent with the admin panel (dark-900 backgrounds, dark-700 borders, brand-500 teal accent)
- **shadcn/ui components**: Button, Input, Textarea, Select, Checkbox, RadioGroup, Slider, DatePicker, Dialog, Table, Badge, Card, Tabs
- **Responsive** but primarily designed for desktop
- Character counters on title (60 max) and body (200 max)
- Live segment user count updates as filters change (debounced 500ms)
- Phone preview mockup updates in real-time as you type
- Success/error toast notifications after send
- Loading states on all async operations
- Confirmation dialog before sending to prevent accidental broadcasts

### ICON REFERENCE

The mobile app uses `iconsax-react-native`. For the admin panel icon picker, use a simple grid of labeled colored circles. The icon name string is what gets stored in `alerts.icon` and the mobile app resolves it to the actual iconsax component. Available icons to show in picker:

```
Notification, TicketStar, Airplane, Calendar, DollarCircle, Heart, Location, 
Shield, People, Gift, Flash, Star, Cup, Briefcase, Map1, Camera, Music, 
ShoppingBag, Lamp, MessageText, Warning2, InfoCircle, TickCircle, CloseCircle,
Timer, Crown, Medal, Magicpen, Routing, Global
```

---

### ENVIRONMENT VARIABLES (for the Next.js admin panel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://pkydmdygctojtfzbqcud.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<get from Supabase dashboard → Settings → API>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from Supabase dashboard → Settings → API>
```

The service role key must ONLY be used in server-side code (API routes, server components). Never in client components.

---

### FILE STRUCTURE

```
app/admin/notifications/
├── page.tsx                    -- Dashboard (KPIs + recent sends + quick actions)
├── compose/
│   └── page.tsx                -- Compose & send notification
├── history/
│   └── page.tsx                -- Alert history (all individual alerts)
├── sends/
│   └── page.tsx                -- Broadcast/campaign send history (admin_notification_sends)
├── scheduled/
│   └── page.tsx                -- Scheduled notifications queue
├── templates/
│   └── page.tsx                -- Notification templates CRUD (alert_types)
├── devices/
│   └── page.tsx                -- Registered devices management

app/api/notifications/
├── send/route.ts               -- POST: send/broadcast
├── history/route.ts            -- GET: query alerts
├── sends/route.ts              -- GET: query admin_notification_sends
├── scheduled/route.ts          -- GET + DELETE: scheduled jobs
├── audience-count/route.ts     -- GET: count users matching filters or segment
├── segments/route.ts           -- GET (read-only): list saved segments for composer dropdown
├── templates/route.ts          -- CRUD: alert types
├── devices/route.ts            -- GET: query user_devices
├── test-push/route.ts          -- POST: send test push to specific device

components/notifications/
├── ComposeForm.tsx             -- Main composer form (orchestrates all sub-components)
├── AudienceTargeting.tsx       -- All Users / Specific User / Saved Segment / Quick Filter
├── QuickFilterBar.tsx          -- Simplified 5-filter inline bar (country, membership, last active, verified, onboarding)
├── ContentEditor.tsx           -- Title, body, icon, image, deeplink
├── DeliveryOptions.tsx         -- Channels, schedule
├── NotificationPreview.tsx     -- Phone/in-app/email preview mockups
├── IconPicker.tsx              -- Icon selection grid
├── AlertHistoryTable.tsx       -- Table for individual alerts
├── SendHistoryTable.tsx        -- Table for broadcast sends
├── ScheduledTable.tsx          -- Table for scheduled queue
├── DevicesTable.tsx            -- Table for registered devices
├── TemplateForm.tsx            -- Template create/edit form

lib/
├── supabase-admin.ts           -- createClient with service_role key (server-side only)
```

---

### TESTING

After building, test with:
1. Send a push + in-app notification to a single user → verify it appears in the mobile app's notification center in real-time
2. Send a broadcast to all users → verify all 17 users receive it
3. Schedule a notification for 2 minutes from now → verify it sends automatically
4. Build a segment (e.g., country = "US", membership = "premium") → verify correct user count
5. Send an email notification → verify email arrives via Resend

## PROMPT END
