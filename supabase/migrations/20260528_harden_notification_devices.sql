-- Phase 0 launch hardening:
-- Keep one active row per Expo push token so dispatch does not fan out the
-- same physical device across stale users/devices.

WITH ranked_devices AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY push_token
      ORDER BY coalesce(last_active_at, created_at) DESC, created_at DESC, id DESC
    ) AS token_rank
  FROM public.user_devices
  WHERE push_token IS NOT NULL
    AND trim(push_token) <> ''
)
UPDATE public.user_devices AS devices
SET
  is_active = false,
  push_enabled = false
FROM ranked_devices
WHERE devices.id = ranked_devices.id
  AND ranked_devices.token_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS user_devices_active_push_token_key
  ON public.user_devices (push_token)
  WHERE push_token IS NOT NULL
    AND trim(push_token) <> ''
    AND is_active = true;
