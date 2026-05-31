# Connect Launch Seed Policy

Connect starter content is intentionally official and labeled. The launch seed does **not** create fake travelers, fake conversations, fake DMs, fake reviews, or fake live Pulse activity.

## Seed Actors

- `Guidera Team`: official product/community account for announcements and starter guidance.
- `Guidera Assistant`: clearly labeled AI assistant account for future official group replies only.
- `Community Ambassador`: Guidera-managed staff profiles by region.

All seed actors use:

- `profiles.profile_kind` set to `system` or `staff`
- `profiles.is_synthetic = true`
- `profiles.synthetic_label` set to the visible label
- `profiles.synthetic_metadata.disclosure` explaining what the account is

## Seed Content

The v1 seed creates:

- Official starter groups across welcome, US, Europe, Africa, Asia, solo, family, digital nomad, food etiquette, budget, women travelers, and luxury travel interests.
- Pinned official posts that disclose Guidera ownership and invite real member participation.
- A small set of official upcoming events with only the organizer as an attendee.

## Product Rules

- System/staff profiles should be excluded from buddy suggestions, “nearby travelers,” live Pulse maps, and any user ranking that implies real traveler activity.
- AI Assistant replies must be labeled in the UI before enabling automated replies.
- Super admin tooling should manage official groups by editing normal `groups` rows with `is_official = true`, `origin = 'official'`, and a seed rank.
- Do not inflate `member_count`, `attendee_count`, comment counts, saves, or reactions beyond rows that actually exist.

## Local Seed

Run the full local Supabase seed path from `supabase/seed.sql`, which imports:

```sql
\i ./seeds/connect_launch_v1.sql
```

For remote production or staging, apply the `connect_official_seed_foundations` migration first, then run `supabase/seeds/connect_launch_v1.sql` once. It is idempotent.
