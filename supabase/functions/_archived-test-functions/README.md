# Archived test / debug edge functions

These are **test and diagnostic** edge functions that are **not used by the app**
(no client code calls them). They are kept here as an archive so we can redeploy
them later if needed, instead of losing the source.

This folder is prefixed with `_` so the Supabase CLI does **not** treat it as a
deployable function (same convention as `_shared`). The functions below are still
deployed on the backend (project `pkydmdygctojtfzbqcud`) — nothing was deleted.

| File | Backend slug | verify_jwt | Purpose |
|------|--------------|-----------|---------|
| `test-trip-services.ts` | `test-trip-services` | true | Verifies trips schema + CRUD + triggers (creates & deletes throwaway test rows). |
| `test-ai-generation.ts` | `test-ai-generation` | false | Exercises `ai-generation` for all trip modules against a hardcoded Japan test trip. |
| `debug-hotels.ts` | `debug-hotels` | false | Diagnostic probe for the Booking.com / RapidAPI hotel API. |
| `debug-serp-hotels.ts` | `debug-serp-hotels` | true | Already disabled — returns HTTP 410. |

## To remove one from the backend later
```bash
supabase functions delete <slug>
```

## To redeploy one from this archive
```bash
# copy it back into a function dir first, then deploy
mkdir -p supabase/functions/<slug>
cp supabase/functions/_archived-test-functions/<file>.ts supabase/functions/<slug>/index.ts
supabase functions deploy <slug> --no-verify-jwt   # or without the flag if verify_jwt was true
```

Archived on 2026-06-12.
