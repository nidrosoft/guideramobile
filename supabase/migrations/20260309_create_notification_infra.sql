-- ============================================================================
-- NOTIFICATION INFRASTRUCTURE TABLES
-- Supports push notifications, in-app alerts, and user device management
-- ============================================================================

-- User Devices — stores push tokens for each user's device
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);

-- Alerts — unified notification/alert storage
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('trip', 'safety', 'financial', 'social', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  channels_requested TEXT[] DEFAULT ARRAY['push', 'in_app'],
  channels_delivered TEXT[] DEFAULT ARRAY[]::TEXT[],
  batch_id UUID,
  is_batched BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'batched', 'delivered', 'read', 'actioned', 'failed', 'expired')),
  scheduled_for TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  trip_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON alerts(user_id) WHERE status IN ('delivered', 'pending') AND read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_pending ON alerts(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_alerts_user_category ON alerts(user_id, category);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  -- Category preferences (JSONB for flexibility)
  category_preferences JSONB DEFAULT '{
    "trip": {"enabled": true, "channels": ["push", "in_app"]},
    "safety": {"enabled": true, "channels": ["push", "in_app", "email"]},
    "financial": {"enabled": true, "channels": ["push", "in_app"]},
    "social": {"enabled": true, "channels": ["push", "in_app"]},
    "system": {"enabled": true, "channels": ["push", "in_app", "email"]}
  }',
  -- Granular type preferences (override category defaults)
  type_preferences JSONB DEFAULT '{}',
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Notification Jobs (for trip lifecycle notifications)
CREATE TABLE IF NOT EXISTS scheduled_notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trip_id UUID,
  booking_id UUID,
  alert_type_code VARCHAR(50) NOT NULL,
  alert_data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sched_notif_pending ON scheduled_notification_jobs(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sched_notif_trip ON scheduled_notification_jobs(trip_id) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notification_jobs ENABLE ROW LEVEL SECURITY;

-- user_devices: users can manage their own devices
CREATE POLICY "Users manage own devices" ON user_devices
  FOR ALL USING (user_id = auth.uid());

-- alerts: users can read their own alerts
CREATE POLICY "Users read own alerts" ON alerts
  FOR SELECT USING (user_id = auth.uid());

-- alerts: users can update their own alerts (mark as read/actioned)
CREATE POLICY "Users update own alerts" ON alerts
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- alerts: service role can insert (for edge functions)
CREATE POLICY "Service role insert alerts" ON alerts
  FOR INSERT WITH CHECK (true);

-- user_notification_preferences: users manage their own prefs
CREATE POLICY "Users manage own prefs" ON user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- scheduled_notification_jobs: service role only
CREATE POLICY "Service role manage jobs" ON scheduled_notification_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for alerts table (for live in-app updates)
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
