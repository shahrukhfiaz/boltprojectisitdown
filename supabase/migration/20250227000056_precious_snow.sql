/*
  # Initial Schema Setup

  1. New Tables
    - `websites`
      - `id` (uuid, primary key)
      - `url` (text, unique)
      - `status` (text)
      - `last_checked` (timestamptz)
      - `response_time` (integer)
      - `name` (text)
    - `outage_reports`
      - `id` (uuid, primary key)
      - `website_id` (text, references websites)
      - `latitude` (float)
      - `longitude` (float)
      - `timestamp` (timestamptz)
      - `status` (text)
      - `location_city` (text)
      - `location_country` (text)
      - `report_count` (integer)
    - `incidents`
      - `id` (uuid, primary key)
      - `website_id` (text)
      - `website_url` (text)
      - `type` (text)
      - `timestamp` (timestamptz)
      - `ip_address` (text)
      - `location_city` (text)
      - `location_country` (text)
      - `me_too_count` (integer)
      - `related_incident_id` (uuid)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and anonymous users
*/

-- Create websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_checked TIMESTAMPTZ DEFAULT now(),
  response_time INTEGER,
  name TEXT
);

-- Create outage_reports table
CREATE TABLE IF NOT EXISTS outage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'down',
  location_city TEXT,
  location_country TEXT,
  report_count INTEGER DEFAULT 1
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id TEXT NOT NULL,
  website_url TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT NOT NULL,
  location_city TEXT,
  location_country TEXT,
  me_too_count INTEGER DEFAULT 0,
  related_incident_id UUID
);

-- Enable Row Level Security
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE outage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for websites
CREATE POLICY "Allow anonymous read access to websites"
  ON websites
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to websites"
  ON websites
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to websites"
  ON websites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for outage_reports
CREATE POLICY "Allow anonymous read access to outage_reports"
  ON outage_reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to outage_reports"
  ON outage_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to outage_reports"
  ON outage_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for incidents
CREATE POLICY "Allow anonymous read access to incidents"
  ON incidents
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to incidents"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert initial popular websites
INSERT INTO websites (url, status, last_checked, response_time, name)
VALUES
  ('https://google.com', 'up', now(), 125, 'Google'),
  ('https://facebook.com', 'down', now(), null, 'Facebook'),
  ('https://youtube.com', 'up', now(), 180, 'YouTube'),
  ('https://x.com', 'down', now(), null, 'X'),
  ('https://twitter.com', 'down', now(), null, 'Twitter'),
  ('https://instagram.com', 'up', now(), 245, 'Instagram'),
  ('https://amazon.com', 'up', now(), 290, 'Amazon'),
  ('https://netflix.com', 'up', now(), 310, 'Netflix'),
  ('https://reddit.com', 'down', now(), null, 'Reddit'),
  ('https://github.com', 'up', now(), 195, 'GitHub'),
  ('https://microsoft.com', 'up', now(), 185, 'Microsoft'),
  ('https://apple.com', 'up', now(), 165, 'Apple'),
  ('https://zoom.us', 'up', now(), 205, 'Zoom'),
  ('https://discord.com', 'down', now(), null, 'Discord'),
  ('https://spotify.com', 'up', now(), 220, 'Spotify'),
  ('https://cloudflare.com', 'up', now(), 175, 'Cloudflare')
ON CONFLICT (url) DO NOTHING;

-- Insert sample outage reports
INSERT INTO outage_reports (website_id, latitude, longitude, timestamp, status, location_city, location_country, report_count)
VALUES
  ('facebook', 52.5200, 13.4050, now() - interval '2 hours', 'down', 'Berlin', 'Germany', 47),
  ('facebook', 48.8566, 2.3522, now() - interval '5 hours', 'down', 'Paris', 'France', 23),
  ('facebook', 43.6532, -79.3832, now() - interval '1 day', 'down', 'Toronto', 'Canada', 18),
  ('twitter', 37.7749, -122.4194, now() - interval '45 minutes', 'down', 'San Francisco', 'United States', 89),
  ('twitter', 19.0760, 72.8777, now() - interval '12 hours', 'down', 'Mumbai', 'India', 56),
  ('twitter', 35.6762, 139.6503, now() - interval '2 days', 'down', 'Tokyo', 'Japan', 34),
  ('reddit', 41.8781, -87.6298, now() - interval '1 hour', 'down', 'Chicago', 'United States', 76),
  ('reddit', 53.3498, -6.2603, now() - interval '3 days', 'down', 'Dublin', 'Ireland', 53),
  ('discord', 37.7749, -122.4194, now() - interval '6 hours', 'down', 'San Francisco', 'United States', 62),
  ('netflix', 51.5074, -0.1278, now() - interval '8 hours', 'down', 'London', 'United Kingdom', 31)
ON CONFLICT DO NOTHING;

-- Insert sample incidents
INSERT INTO incidents (website_id, website_url, type, timestamp, ip_address, location_city, location_country, me_too_count)
VALUES
  ('google', 'https://google.com', 'slow', now() - interval '6 hours', '192.168.1.1', 'New York', 'United States', 12),
  ('facebook', 'https://facebook.com', 'down', now() - interval '2 hours', '192.168.1.3', 'Berlin', 'Germany', 47),
  ('facebook', 'https://facebook.com', 'slow', now() - interval '5 hours', '192.168.1.4', 'Paris', 'France', 23),
  ('twitter', 'https://twitter.com', 'down', now() - interval '45 minutes', '192.168.1.7', 'San Francisco', 'United States', 89),
  ('reddit', 'https://reddit.com', 'down', now() - interval '1 hour', '192.168.1.16', 'Chicago', 'United States', 76)
ON CONFLICT DO NOTHING;