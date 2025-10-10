-- 为海淀香山风险区添加监测站

INSERT INTO monitoring_stations (station_id, name, location, station_type, is_active, zone_id, installation_date)
VALUES 
  ('BJ009', '香山坡面监测站', ST_SetSRID(ST_MakePoint(116.192, 39.993), 4326), 'slope', true, 9, CURRENT_DATE),
  ('BJ010', '香山土壤湿度站', ST_SetSRID(ST_MakePoint(116.194, 39.991), 4326), 'soil_moisture', true, 9, CURRENT_DATE),
  ('BJ011', '香山地下水站', ST_SetSRID(ST_MakePoint(116.190, 39.995), 4326), 'groundwater', true, 9, CURRENT_DATE),
  ('BJ012', '香山气象站', ST_SetSRID(ST_MakePoint(116.193, 39.992), 4326), 'weather', true, 9, CURRENT_DATE)
ON CONFLICT (station_id) DO NOTHING;

-- 验证插入结果
SELECT station_id, name, station_type, zone_id 
FROM monitoring_stations 
WHERE zone_id = 9 
ORDER BY station_id;


