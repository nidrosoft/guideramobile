-- ============================================================================
-- DEPARTURE ADVISORIES TABLE
-- Stores calculated departure advisory results and user feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS departure_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trip reference
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID,
  
  -- Flight info
  flight_number VARCHAR(10) NOT NULL,
  departure_airport VARCHAR(10) NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  
  -- User location at time of calculation
  user_location_lat DECIMAL(10,7),
  user_location_lng DECIMAL(10,7),
  
  -- Calculated result
  leave_by_time TIMESTAMPTZ,
  total_minutes_needed INTEGER,
  breakdown JSONB,
  transport_options JSONB,
  risk_levels JSONB,
  reasoning TEXT,
  flight_status JSONB,
  confidence VARCHAR(10) DEFAULT 'medium',
  
  -- Calculation metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User feedback
  user_rating VARCHAR(20), -- 'perfect', 'too_early', 'too_late', 'didnt_go'
  rated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for upsert
  UNIQUE(trip_id, flight_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_departure_advisories_trip ON departure_advisories(trip_id);
CREATE INDEX IF NOT EXISTS idx_departure_advisories_flight ON departure_advisories(flight_number, departure_time);
CREATE INDEX IF NOT EXISTS idx_departure_advisories_rating ON departure_advisories(user_rating) WHERE user_rating IS NOT NULL;

-- RLS policies
ALTER TABLE departure_advisories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own advisories (via trip ownership)
CREATE POLICY "Users can read own advisories" ON departure_advisories
  FOR SELECT USING (
    trip_id IN (SELECT id FROM trips WHERE owner_id = auth.uid())
  );

-- Allow service role full access (for edge function)
CREATE POLICY "Service role full access" ON departure_advisories
  FOR ALL USING (true) WITH CHECK (true);
