-- Update null fields in monitoring_stations table
UPDATE monitoring_stations SET 
  maintenance_schedule = '{"frequency": "monthly", "next_date": "2024-03-01"}',
  data_transmission_interval = 60
WHERE 
  maintenance_schedule IS NULL OR 
  data_transmission_interval IS NULL;

-- Check update results
SELECT id, station_id, name, maintenance_schedule, data_transmission_interval FROM monitoring_stations LIMIT 5;