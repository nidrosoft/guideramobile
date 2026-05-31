-- Fix the chicken-and-egg in the `profiles_insert_new` RLS policy.
--
-- PROBLEM:
--   The existing INSERT policy was: `WITH CHECK (requesting_user_id() = id)`
--   where `requesting_user_id()` looks up a profile row by
--   `clerk_id = auth.jwt()->>'sub'` and returns its `id` (UUID).
--
--   But when a new user signs up for the first time, no profile row exists
--   yet. `requesting_user_id()` can't find one, returns NULL, the policy
--   check `NULL = <uuid>` evaluates to NULL (not TRUE), and Postgres rejects
--   the INSERT with error 42501 ("new row violates row-level security
--   policy for table \"profiles\"").
--
--   Net effect: profile creation always failed for brand-new users via
--   Apple/Google/Facebook/email SSO, causing an onboarding loop.
--
-- FIX:
--   Replace the INSERT policy with one that checks the JWT claim directly
--   (no function call, no chicken-and-egg). Also add an UPDATE policy so
--   the legacy orphan-linking path in profileSync can attach a Clerk id
--   to a pre-Clerk profile (matched by email or phone).

-- ─── 1. Replace INSERT policy ─────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_insert_new ON profiles;
DROP POLICY IF EXISTS profiles_insert_self ON profiles;

CREATE POLICY profiles_insert_self ON profiles
  FOR INSERT
  WITH CHECK (clerk_id = auth.jwt()->>'sub');

-- ─── 2. Add orphan-linking UPDATE policy ──────────────────────────────────
-- The existing `profiles_update_own` policy uses `requesting_user_id() = id`
-- which is correct for normal updates by an established user. But if a
-- pre-Clerk profile row (clerk_id IS NULL) exists, profileSync.ts tries to
-- attach the new clerk_id to it via UPDATE. That update needs its own
-- policy because `requesting_user_id()` returns NULL for rows with no
-- clerk_id. Scope the policy tightly: only rows where clerk_id IS NULL
-- AND the email or phone matches the caller's JWT claims.
DROP POLICY IF EXISTS profiles_link_orphan ON profiles;

CREATE POLICY profiles_link_orphan ON profiles
  FOR UPDATE
  USING (
    clerk_id IS NULL
    AND (
      email = auth.jwt()->>'email'
      OR phone = auth.jwt()->>'phone_number'
    )
  )
  WITH CHECK (clerk_id = auth.jwt()->>'sub');

-- Note: profiles_select_all (USING true) and profiles_update_own
-- (requesting_user_id() = id) are intentionally left alone — they already
-- work correctly once a profile row exists.
