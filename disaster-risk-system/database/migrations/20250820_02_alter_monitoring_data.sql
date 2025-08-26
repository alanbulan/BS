-- Migration: Alter monitoring_data to add alert/calibration/device_status/created_at
BEGIN;

-- Add extended columns to monitoring_data
ALTER TABLE monitoring_data
  ADD COLUMN IF NOT EXISTS alert_threshold_min DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS alert_threshold_max DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS calibration_factor DOUBLE PRECISION DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS device_status VARCHAR(50) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Time-series indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_data_timestamp ON monitoring_data (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_station_type ON monitoring_data (station_id, data_type, timestamp DESC);

COMMIT;