-- Migration: Alter monitoring_stations to add extended fields and timestamps
BEGIN;

-- Ensure trigger function exists for updated_at maintenance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add extended columns to monitoring_stations
ALTER TABLE monitoring_stations
  ADD COLUMN IF NOT EXISTS address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS elevation DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS installation_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS power_source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS communication_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_info JSONB,
  ADD COLUMN IF NOT EXISTS technical_specs JSONB,
  ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
  ADD COLUMN IF NOT EXISTS next_maintenance_date DATE,
  ADD COLUMN IF NOT EXISTS monitoring_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Spatial index (ensure exists)
CREATE INDEX IF NOT EXISTS idx_monitoring_stations_location ON monitoring_stations USING GIST (location);

-- Create updated_at trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_monitoring_stations'
  ) THEN
    CREATE TRIGGER set_timestamp_monitoring_stations
    BEFORE UPDATE ON monitoring_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

COMMIT;