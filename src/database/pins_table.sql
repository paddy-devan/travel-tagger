-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for pins
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting pins (users can only see pins for trips they own)
CREATE POLICY pins_select_policy ON pins
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create policy for inserting pins
CREATE POLICY pins_insert_policy ON pins
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create policy for updating pins
CREATE POLICY pins_update_policy ON pins
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create policy for deleting pins
CREATE POLICY pins_delete_policy ON pins
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX pins_trip_id_idx ON pins(trip_id); 