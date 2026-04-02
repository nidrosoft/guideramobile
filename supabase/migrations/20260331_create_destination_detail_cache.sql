-- Destination detail cache for instant repeat visits
-- Stores enriched data (POIs, reviews, gallery, AI safety/practical info)
-- TTL managed by the edge function (7 days)

CREATE TABLE IF NOT EXISTS destination_detail_cache (
  destination_id UUID PRIMARY KEY REFERENCES curated_destinations(id) ON DELETE CASCADE,
  detail_data JSONB NOT NULL DEFAULT '{}',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_destination_detail_cache_cached_at 
  ON destination_detail_cache(cached_at);

-- RLS: allow read for authenticated and anon (cache is public data)
ALTER TABLE destination_detail_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read destination detail cache"
  ON destination_detail_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can write destination detail cache"
  ON destination_detail_cache FOR ALL
  USING (true)
  WITH CHECK (true);
