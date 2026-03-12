-- Deal & Affiliate Tables
-- Supports: deal clicks, saved deals, price alerts, deal cache, affiliate config

-- Affiliate configuration per provider
CREATE TABLE IF NOT EXISTS affiliate_config (
  provider TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  deal_types TEXT[] NOT NULL DEFAULT '{}',
  affiliate_id TEXT,
  link_template TEXT,
  commission_model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deal clicks — tracks every redirect to an external provider
CREATE TABLE IF NOT EXISTS deal_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  provider TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  deal_snapshot JSONB NOT NULL DEFAULT '{}',
  price_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  search_session_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT,
  campaign TEXT,
  user_confirmed_booking BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deal_clicks_user ON deal_clicks(user_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_clicks_provider ON deal_clicks(provider, clicked_at DESC);

-- Saved deals — user bookmarks
CREATE TABLE IF NOT EXISTS saved_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  provider TEXT NOT NULL,
  deal_snapshot JSONB NOT NULL DEFAULT '{}',
  affiliate_url TEXT,
  price_at_save NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_price NUMERIC(10,2),
  price_currency TEXT NOT NULL DEFAULT 'USD',
  price_changed BOOLEAN NOT NULL DEFAULT false,
  price_change_pct NUMERIC(5,2),
  route_key TEXT,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_deals_user ON saved_deals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_deals_route ON saved_deals(route_key);

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  route_key TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'price_drop' CHECK (alert_type IN ('price_drop', 'any_change', 'target_price')),
  target_price NUMERIC(10,2),
  current_price NUMERIC(10,2),
  lowest_seen_price NUMERIC(10,2),
  highest_seen_price NUMERIC(10,2),
  price_checks_count INTEGER NOT NULL DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  notification_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active, route_key);

-- Deal cache — background-scanned deals
CREATE TABLE IF NOT EXISTS deal_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  route_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  date_range TEXT,
  deal_data JSONB NOT NULL DEFAULT '{}',
  price_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  deal_score NUMERIC(5,2),
  deal_badges TEXT[] NOT NULL DEFAULT '{}',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_deal_cache_type ON deal_cache(deal_type, deal_score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_cache_route ON deal_cache(route_key);
CREATE INDEX IF NOT EXISTS idx_deal_cache_expiry ON deal_cache(expires_at);

-- User deal matches — personalized deal recommendations
CREATE TABLE IF NOT EXISTS user_deal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  deal_title TEXT NOT NULL,
  deal_subtitle TEXT,
  deal_image_url TEXT,
  price_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  original_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  deal_badges TEXT[] NOT NULL DEFAULT '{}',
  booking_url TEXT,
  provider TEXT,
  relevance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours')
);

CREATE INDEX IF NOT EXISTS idx_user_deal_matches_user ON user_deal_matches(user_id, relevance_score DESC);

-- Price history — tracks prices over time for route_keys
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key TEXT NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('flight', 'hotel', 'car', 'experience')),
  provider TEXT NOT NULL,
  price_amount NUMERIC(10,2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_route ON price_history(route_key, recorded_at DESC);

-- RLS Policies

ALTER TABLE deal_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deal_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_config ENABLE ROW LEVEL SECURITY;

-- deal_clicks: users can read and insert their own
CREATE POLICY deal_clicks_select ON deal_clicks FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY deal_clicks_insert ON deal_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY deal_clicks_update ON deal_clicks FOR UPDATE USING (user_id = auth.uid());

-- saved_deals: users manage their own
CREATE POLICY saved_deals_select ON saved_deals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY saved_deals_insert ON saved_deals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY saved_deals_delete ON saved_deals FOR DELETE USING (user_id = auth.uid());

-- price_alerts: users manage their own
CREATE POLICY price_alerts_select ON price_alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY price_alerts_insert ON price_alerts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY price_alerts_update ON price_alerts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY price_alerts_delete ON price_alerts FOR DELETE USING (user_id = auth.uid());

-- deal_cache: public read
CREATE POLICY deal_cache_select ON deal_cache FOR SELECT USING (true);

-- user_deal_matches: users read their own
CREATE POLICY user_deal_matches_select ON user_deal_matches FOR SELECT USING (user_id = auth.uid());

-- price_history: public read
CREATE POLICY price_history_select ON price_history FOR SELECT USING (true);

-- affiliate_config: public read
CREATE POLICY affiliate_config_select ON affiliate_config FOR SELECT USING (true);

-- Seed default affiliate configs
INSERT INTO affiliate_config (provider, display_name, deal_types, is_active, priority) VALUES
  ('kiwi', 'Kiwi.com', ARRAY['flight'], true, 10),
  ('booking', 'Booking.com', ARRAY['hotel'], true, 10),
  ('google_flights', 'Google Flights', ARRAY['flight'], true, 5),
  ('rentalcars', 'Rentalcars.com', ARRAY['car'], true, 10),
  ('viator', 'Viator', ARRAY['experience'], true, 10),
  ('getyourguide', 'GetYourGuide', ARRAY['experience'], true, 8)
ON CONFLICT (provider) DO NOTHING;
