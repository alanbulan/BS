-- 为缺失监测站的风险区域添加监测站

-- 昌平十三陵景区 (zone_id=6)
INSERT INTO monitoring_stations (station_id, name, location, station_type, is_active, zone_id, installation_date)
VALUES 
  ('BJ013', '十三陵坡面站', ST_SetSRID(ST_MakePoint(116.22, 40.22), 4326), 'slope', true, 6, CURRENT_DATE),
  ('BJ014', '十三陵雨量站', ST_SetSRID(ST_MakePoint(116.23, 40.23), 4326), 'rainfall', true, 6, CURRENT_DATE)
ON CONFLICT (station_id) DO NOTHING;

-- 平谷金海湖 (zone_id=7)
INSERT INTO monitoring_stations (station_id, name, location, station_type, is_active, zone_id, installation_date)
VALUES 
  ('BJ015', '金海湖水位站', ST_SetSRID(ST_MakePoint(117.22, 40.22), 4326), 'water_level', true, 7, CURRENT_DATE),
  ('BJ016', '金海湖气象站', ST_SetSRID(ST_MakePoint(117.23, 40.23), 4326), 'weather', true, 7, CURRENT_DATE)
ON CONFLICT (station_id) DO NOTHING;

-- 石景山八大处 (zone_id=8)
INSERT INTO monitoring_stations (station_id, name, location, station_type, is_active, zone_id, installation_date)
VALUES 
  ('BJ017', '八大处坡面站', ST_SetSRID(ST_MakePoint(116.19, 39.96), 4326), 'slope', true, 8, CURRENT_DATE),
  ('BJ018', '八大处地震站', ST_SetSRID(ST_MakePoint(116.20, 39.97), 4326), 'seismic', true, 8, CURRENT_DATE)
ON CONFLICT (station_id) DO NOTHING;

-- 顺义潮白河 (zone_id=10)
INSERT INTO monitoring_stations (station_id, name, location, station_type, is_active, zone_id, installation_date)
VALUES 
  ('BJ019', '潮白河水位站', ST_SetSRID(ST_MakePoint(116.65, 40.13), 4326), 'water_level', true, 10, CURRENT_DATE),
  ('BJ020', '潮白河土壤站', ST_SetSRID(ST_MakePoint(116.66, 40.14), 4326), 'soil_moisture', true, 10, CURRENT_DATE)
ON CONFLICT (station_id) DO NOTHING;

-- 验证所有站点
SELECT 
  rz.name as zone_name, 
  COUNT(ms.id) as station_count,
  STRING_AGG(ms.station_id, ', ') as stations
FROM risk_zones rz
LEFT JOIN monitoring_stations ms ON rz.id = ms.zone_id
GROUP BY rz.id, rz.name
ORDER BY rz.id;


