-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  google_maps_id TEXT,
  nickname TEXT NOT NULL,
  visited_flag BOOLEAN DEFAULT FALSE,
  category TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  parent_pin_id UUID REFERENCES pins(id) ON DELETE SET NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_trip_id ON pins(trip_id);
CREATE INDEX IF NOT EXISTS idx_pins_parent_pin_id ON pins(parent_pin_id);

-- Create RLS policies for security

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- Users can only read their own user data
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own user data
CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only read their own trips
CREATE POLICY trips_select_policy ON trips
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own trips
CREATE POLICY trips_insert_policy ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own trips
CREATE POLICY trips_update_policy ON trips
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own trips
CREATE POLICY trips_delete_policy ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only read pins from their own trips
CREATE POLICY pins_select_policy ON pins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = pins.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can only insert pins to their own trips
CREATE POLICY pins_insert_policy ON pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = pins.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can only update pins from their own trips
CREATE POLICY pins_update_policy ON pins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = pins.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can only delete pins from their own trips
CREATE POLICY pins_delete_policy ON pins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = pins.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
BEFORE UPDATE ON pins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 