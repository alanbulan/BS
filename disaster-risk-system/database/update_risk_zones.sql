-- Update null fields in risk_zones table
UPDATE risk_zones SET 
  elevation_max = CASE 
    WHEN elevation_avg IS NOT NULL THEN elevation_avg + 50 
    ELSE 100 
  END,
  elevation_min = CASE 
    WHEN elevation_avg IS NOT NULL THEN elevation_avg - 50 
    ELSE 0 
  END,
  slope_max = 30.0,
  land_use_type = 'Urban Construction Land',
  vegetation_coverage = 0.65,
  administrative_level = 'County Level',
  responsible_department = 'Emergency Management Bureau',
  emergency_contact = '{"phone": "12345678901", "email": "emergency@local.gov.cn"}'
WHERE 
  elevation_max IS NULL OR 
  elevation_min IS NULL OR 
  slope_max IS NULL OR 
  land_use_type IS NULL OR 
  vegetation_coverage IS NULL OR 
  administrative_level IS NULL OR 
  responsible_department IS NULL OR 
  emergency_contact IS NULL;

-- Check update results
SELECT id, name, elevation_max, elevation_min, slope_max, land_use_type, vegetation_coverage, administrative_level, responsible_department, emergency_contact FROM risk_zones LIMIT 5;