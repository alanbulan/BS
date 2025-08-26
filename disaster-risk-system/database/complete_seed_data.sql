-- Complete test data insertion script with all required tables
-- UTF-8 encoding

-- Insert disaster types first (required by other tables)
INSERT INTO disaster_types (name, name_en, description, base_risk_level, warning_threshold, color_code, icon_url) VALUES
('landslide', 'Landslide', 'Gravity-induced movement of soil or rock mass down a slope', 3, '{"level1": 10, "level2": 20, "level3": 30, "level4": 40, "level5": 50}', '#FF6B35', '/icons/landslide.svg'),
('debris_flow', 'Debris Flow', 'Fast-moving landslide containing water, rock, soil, and debris', 4, '{"level1": 15, "level2": 25, "level3": 35, "level4": 45, "level5": 55}', '#8B4513', '/icons/debris-flow.svg'),
('earthquake', 'Earthquake', 'Sudden release of energy in the Earth crust creating seismic waves', 5, '{"level1": 3.0, "level2": 4.0, "level3": 5.0, "level4": 6.0, "level5": 7.0}', '#DC143C', '/icons/earthquake.svg'),
('flash_flood', 'Flash Flood', 'Sudden flooding of low-lying areas due to intense rainfall', 3, '{"level1": 50, "level2": 100, "level3": 150, "level4": 200, "level5": 250}', '#4169E1', '/icons/flash-flood.svg'),
('rockfall', 'Rockfall', 'Sudden detachment and fall of rock fragments from steep slopes', 2, '{"level1": 5, "level2": 10, "level3": 15, "level4": 20, "level5": 25}', '#A0522D', '/icons/rockfall.svg'),
('subsidence', 'Ground Subsidence', 'Gradual settling or sudden sinking of the ground surface', 2, '{"level1": 2, "level2": 5, "level3": 10, "level4": 15, "level5": 20}', '#708090', '/icons/subsidence.svg');

-- Insert test users
INSERT INTO users (username, email, phone, password_hash, location, role) VALUES
('admin', 'admin@disaster.com', '13800138000', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.4074 39.9042)', 4326), 'admin'),
('zhangsan', 'zhangsan@test.com', '13800138001', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.3074 39.8042)', 4326), 'user'),
('lisi', 'lisi@test.com', '13800138002', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.5074 39.7042)', 4326), 'expert'),
('wangwu', 'wangwu@test.com', '13800138003', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.2074 39.6042)', 4326), 'user'),
('zhaoliu', 'zhaoliu@test.com', '13800138004', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.6074 40.0042)', 4326), 'expert');

-- Insert test risk zones (Beijing mountain areas)
INSERT INTO risk_zones (name, code, geometry, disaster_type_id, base_risk_level, population_density, elevation_avg, elevation_max, elevation_min, slope_avg, slope_max, geological_structure, land_use_type, vegetation_coverage, administrative_level, responsible_department, emergency_contact, is_monitored) VALUES
('Fangshan Shidu Scenic Area', 'BJ_FS_SD', ST_GeomFromText('POLYGON((115.6 39.6, 115.8 39.6, 115.8 39.8, 115.6 39.8, 115.6 39.6))', 4326), 1, 3, 150.5, 280.0, 450.0, 120.0, 25.5, 45.0, '{"rock_type": "limestone", "fault_density": "medium", "weathering_degree": "strong", "soil_type": "clay"}', 'tourism', 0.75, 'district', 'Fangshan Emergency Management Bureau', '{"phone": "010-69314000", "contact": "Director Zhang", "email": "emergency@fangshan.gov.cn"}', true),
('Mentougou Miaofeng Mountain', 'BJ_MTG_MFS', ST_GeomFromText('POLYGON((116.0 39.9, 116.2 39.9, 116.2 40.1, 116.0 40.1, 116.0 39.9))', 4326), 1, 4, 89.2, 450.0, 680.0, 200.0, 35.2, 55.0, '{"rock_type": "granite", "fault_density": "high", "weathering_degree": "medium", "soil_type": "sandy_loam"}', 'forest', 0.85, 'district', 'Mentougou Emergency Management Bureau', '{"phone": "010-69842464", "contact": "Director Li", "email": "emergency@mtg.gov.cn"}', true),
('Huairou Yanqi Lake', 'BJ_HR_YQH', ST_GeomFromText('POLYGON((116.6 40.3, 116.8 40.3, 116.8 40.5, 116.6 40.5, 116.6 40.3))', 4326), 2, 2, 120.8, 180.0, 320.0, 80.0, 15.8, 30.0, '{"rock_type": "gneiss", "fault_density": "low", "weathering_degree": "slight", "soil_type": "loam"}', 'water', 0.65, 'district', 'Huairou Emergency Management Bureau', '{"phone": "010-69681888", "contact": "Director Wang", "email": "emergency@huairou.gov.cn"}', true),
('Yanqing Badaling', 'BJ_YQ_BDL', ST_GeomFromText('POLYGON((115.9 40.3, 116.1 40.3, 116.1 40.5, 115.9 40.5, 115.9 40.3))', 4326), 3, 3, 95.3, 520.0, 780.0, 300.0, 28.7, 50.0, '{"rock_type": "sandstone", "fault_density": "medium", "weathering_degree": "medium", "soil_type": "rocky"}', 'tourism', 0.70, 'district', 'Yanqing Emergency Management Bureau', '{"phone": "010-69143322", "contact": "Director Zhao", "email": "emergency@yanqing.gov.cn"}', true),
('Miyun Reservoir Area', 'BJ_MY_SK', ST_GeomFromText('POLYGON((116.8 40.3, 117.0 40.3, 117.0 40.5, 116.8 40.5, 116.8 40.3))', 4326), 4, 2, 78.9, 160.0, 280.0, 90.0, 12.5, 25.0, '{"rock_type": "metamorphic", "fault_density": "low", "weathering_degree": "slight", "soil_type": "alluvial"}', 'water', 0.80, 'district', 'Miyun Emergency Management Bureau', '{"phone": "010-69042345", "contact": "Director Chen", "email": "emergency@miyun.gov.cn"}', true);

-- Insert monitoring stations
INSERT INTO monitoring_stations (station_id, name, location, station_type, equipment_info, installation_date, maintenance_schedule, data_transmission_interval, zone_id) VALUES
('BJ001', 'Shidu Rainfall Station', ST_GeomFromText('POINT(115.7 39.7)', 4326), 'rainfall', '{"model": "RG-100", "accuracy": "0.1mm", "range": "0-999mm", "manufacturer": "HuaYun Tech", "serial_number": "RG100-2023001"}', '2023-01-15', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 300, 1),
('BJ002', 'Miaofeng Slope Station', ST_GeomFromText('POINT(116.1 40.0)', 4326), 'slope', '{"model": "SG-200", "accuracy": "0.01mm", "range": "±50mm", "manufacturer": "Geo Instruments", "serial_number": "SG200-2023002"}', '2023-02-20', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 600, 2),
('BJ003', 'Yanqi Groundwater Station', ST_GeomFromText('POINT(116.7 40.4)', 4326), 'groundwater', '{"model": "WL-300", "accuracy": "1cm", "range": "0-30m", "manufacturer": "Hydro Instruments", "serial_number": "WL300-2023003"}', '2023-03-10', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 1800, 3),
('BJ004', 'Badaling Seismic Station', ST_GeomFromText('POINT(116.0 40.4)', 4326), 'seismic', '{"model": "ES-400", "accuracy": "0.001g", "range": "0-2g", "manufacturer": "Seismic Equipment Co", "serial_number": "ES400-2023004"}', '2023-04-05', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 60, 4),
('BJ005', 'Miyun Water Level Station', ST_GeomFromText('POINT(116.9 40.4)', 4326), 'water_level', '{"model": "WL-500", "accuracy": "1mm", "range": "0-50m", "manufacturer": "Hydro Instruments", "serial_number": "WL500-2023005"}', '2023-05-12', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 900, 5),
('BJ006', 'Fangshan Weather Station', ST_GeomFromText('POINT(115.75 39.75)', 4326), 'weather', '{"model": "WS-600", "accuracy": "0.1°C, 1%RH", "range": "-40~80°C, 0~100%RH", "manufacturer": "Weather Equipment Co", "serial_number": "WS600-2023006"}', '2023-06-18', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 300, 1),
('BJ007', 'Mentougou Wind Station', ST_GeomFromText('POINT(116.15 40.05)', 4326), 'wind', '{"model": "WD-700", "accuracy": "0.1m/s, 1°", "range": "0-60m/s, 0-360°", "manufacturer": "Weather Equipment Co", "serial_number": "WD700-2023007"}', '2023-07-22', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 300, 2),
('BJ008', 'Huairou Soil Moisture Station', ST_GeomFromText('POINT(116.75 40.45)', 4326), 'soil_moisture', '{"model": "SM-800", "accuracy": "1%", "range": "0-100%", "manufacturer": "Soil Instruments Co", "serial_number": "SM800-2023008"}', '2023-08-15', '{"daily": "data check", "weekly": "equipment cleaning", "monthly": "calibration", "quarterly": "full maintenance"}', 1800, 3);

-- Insert shelters
INSERT INTO shelters (name, location, address, capacity, current_occupancy, shelter_type, facilities, contact_info, access_routes, elevation, safety_level, operating_hours, special_requirements) VALUES
('Fangshan Sports Center', ST_GeomFromText('POINT(115.9 39.7)', 4326), 'No.11 Government Street, Fangshan District, Beijing', 2000, 0, 'permanent', '{"medical": true, "food": true, "water": true, "power": true, "communication": true, "heating": true, "air_conditioning": true, "restrooms": true, "parking": true}', '{"phone": "010-69314000", "contact": "Fangshan Emergency Management Bureau", "emergency_phone": "010-69314001"}', '{"main_route": "Beijing-Hong Kong-Macao Expressway-Fangshan Exit-Government Street", "backup_route": "National Highway 107-Fangshan Urban Area-Government Street"}', 45.0, 5, '{"normal": "24 hours open", "emergency": "immediate opening"}', 'No special requirements'),
('Mentougou No.1 Middle School', ST_GeomFromText('POINT(116.1 39.9)', 4326), 'No.65 Xinqiao Street, Mentougou District, Beijing', 1500, 0, 'school', '{"medical": false, "food": true, "water": true, "power": true, "communication": true, "heating": true, "air_conditioning": false, "restrooms": true, "parking": true}', '{"phone": "010-69842464", "contact": "Mentougou Education Committee", "emergency_phone": "010-69842465"}', '{"main_route": "Fushi Road-Mentougou Urban Area-Xinqiao Street", "backup_route": "National Highway 108-Mentougou-Xinqiao Street"}', 180.0, 4, '{"normal": "coordination required", "emergency": "open within 2 hours"}', 'Need to clear teaching equipment in advance'),
('Yanqi Lake Conference Center', ST_GeomFromText('POINT(116.7 40.4)', 4326), 'Yanqi Lake Ecological Development Demonstration Zone, Huairou District, Beijing', 3000, 0, 'temporary', '{"medical": true, "food": true, "water": true, "power": true, "communication": true, "heating": true, "air_conditioning": true, "restrooms": true, "parking": true}', '{"phone": "010-69681888", "contact": "Huairou District Government", "emergency_phone": "010-69681889"}', '{"main_route": "Beijing-Chengde Expressway-Huairou Exit-Yanqi Lake", "backup_route": "National Highway 101-Huairou-Yanqi Lake"}', 160.0, 5, '{"normal": "reservation required", "emergency": "immediate opening"}', 'High-end conference facilities, need protection'),
('Yanqing Sports Center', ST_GeomFromText('POINT(116.0 40.4)', 4326), 'No.1 Hunan Road, Yanqing District, Beijing', 1800, 0, 'sports', '{"medical": true, "food": false, "water": true, "power": true, "communication": true, "heating": true, "air_conditioning": true, "restrooms": true, "parking": true}', '{"phone": "010-69143322", "contact": "Yanqing Sports Bureau", "emergency_phone": "010-69143323"}', '{"main_route": "Beijing-Tibet Expressway-Yanqing Exit-Hunan Road", "backup_route": "National Highway 110-Yanqing Urban Area-Hunan Road"}', 520.0, 4, '{"normal": "coordination required", "emergency": "open within 4 hours"}', 'Sports facilities need protection'),
('Miyun Exhibition Center', ST_GeomFromText('POINT(116.9 40.4)', 4326), 'No.88 Xinnan Road, Miyun District, Beijing', 2500, 0, 'exhibition', '{"medical": false, "food": false, "water": true, "power": true, "communication": true, "heating": true, "air_conditioning": true, "restrooms": true, "parking": true}', '{"phone": "010-69042345", "contact": "Miyun District Government", "emergency_phone": "010-69042346"}', '{"main_route": "Beijing-Chengde Expressway-Miyun Exit-Xinnan Road", "backup_route": "National Highway 101-Miyun Urban Area-Xinnan Road"}', 160.0, 4, '{"normal": "reservation required", "emergency": "open within 6 hours"}', 'Exhibition facilities need clearing');

-- Insert road network data
INSERT INTO road_network (road_id, name, geometry, road_type, road_class, width, surface_type, max_speed, is_bidirectional, elevation_profile, slope_grade, bridge_tunnel_info, maintenance_status, traffic_capacity, is_emergency_route) VALUES
('G108_001', 'Beijing-Kunming Expressway Fangshan Section', ST_GeomFromText('LINESTRING(115.8 39.6, 115.9 39.7, 116.0 39.8)', 4326), 'highway', 1, 24.0, 'asphalt', 120, true, '{"start_elevation": 45, "end_elevation": 180, "max_elevation": 200, "min_elevation": 40}', 3.5, '{"bridges": 2, "tunnels": 0, "bridge_info": [{"name": "Fangshan Bridge", "length": 500}]}', 'good', 8000, true),
('S210_001', 'Provincial Road 210 Mentougou Section', ST_GeomFromText('LINESTRING(116.0 39.9, 116.1 40.0, 116.2 40.1)', 4326), 'arterial', 2, 12.0, 'asphalt', 80, true, '{"start_elevation": 180, "end_elevation": 450, "max_elevation": 500, "min_elevation": 160}', 8.2, '{"bridges": 1, "tunnels": 1, "tunnel_info": [{"name": "Miaofeng Mountain Tunnel", "length": 800}]}', 'fair', 3000, true),
('X015_001', 'County Road 015 Huairou Section', ST_GeomFromText('LINESTRING(116.6 40.3, 116.7 40.4, 116.8 40.5)', 4326), 'collector', 3, 8.0, 'concrete', 60, true, '{"start_elevation": 160, "end_elevation": 180, "max_elevation": 200, "min_elevation": 150}', 2.1, '{"bridges": 0, "tunnels": 0}', 'good', 1500, false),
('G110_001', 'National Highway 110 Yanqing Section', ST_GeomFromText('LINESTRING(115.9 40.3, 116.0 40.4, 116.1 40.5)', 4326), 'highway', 1, 20.0, 'asphalt', 100, true, '{"start_elevation": 520, "end_elevation": 680, "max_elevation": 750, "min_elevation": 500}', 6.8, '{"bridges": 3, "tunnels": 2, "bridge_info": [{"name": "Badaling Bridge", "length": 300}]}', 'excellent', 6000, true),
('S101_001', 'Provincial Road 101 Miyun Section', ST_GeomFromText('LINESTRING(116.8 40.3, 116.9 40.4, 117.0 40.5)', 4326), 'arterial', 2, 14.0, 'asphalt', 80, true, '{"start_elevation": 160, "end_elevation": 200, "max_elevation": 220, "min_elevation": 140}', 1.8, '{"bridges": 1, "tunnels": 0, "bridge_info": [{"name": "Miyun Reservoir Bridge", "length": 600}]}', 'good', 4000, true);

-- Insert escape routes
INSERT INTO escape_routes (route_id, start_point, end_point, route_geometry, distance_meters, estimated_time_minutes, difficulty_level, elevation_gain, route_conditions, waypoints, alternative_routes, safety_score, weather_dependency, accessibility_info, last_verified_date, verification_status) VALUES
('ESC_001', ST_GeomFromText('POINT(115.7 39.7)', 4326), ST_GeomFromText('POINT(115.9 39.7)', 4326), ST_GeomFromText('LINESTRING(115.7 39.7, 115.8 39.7, 115.9 39.7)', 4326), 2500, 35, 2, 135.0, '{"surface": "paved", "lighting": "partial", "shelter": "available", "water": "available"}', '[{"lat": 39.7, "lng": 115.75, "description": "Transfer Point 1"}, {"lat": 39.7, "lng": 115.85, "description": "Transfer Point 2"}]', '[{"route_id": "ESC_001_ALT1", "description": "Alternative Route 1"}]', 8.5, '{"rain": "moderate_impact", "snow": "high_impact", "wind": "low_impact"}', '{"wheelchair": false, "elderly": true, "children": true}', '2024-01-15', 'verified'),
('ESC_002', ST_GeomFromText('POINT(116.1 40.0)', 4326), ST_GeomFromText('POINT(116.1 39.9)', 4326), ST_GeomFromText('LINESTRING(116.1 40.0, 116.1 39.95, 116.1 39.9)', 4326), 1200, 18, 3, 270.0, '{"surface": "gravel", "lighting": "none", "shelter": "limited", "water": "none"}', '[{"lat": 39.95, "lng": 116.1, "description": "Transfer Point"}]', '[{"route_id": "ESC_002_ALT1", "description": "Alternative Route 1"}]', 7.8, '{"rain": "high_impact", "snow": "very_high_impact", "wind": "moderate_impact"}', '{"wheelchair": false, "elderly": false, "children": false}', '2024-02-20', 'verified'),
('ESC_003', ST_GeomFromText('POINT(116.7 40.4)', 4326), ST_GeomFromText('POINT(116.7 40.4)', 4326), ST_GeomFromText('LINESTRING(116.7 40.4, 116.7 40.4)', 4326), 800, 12, 1, 20.0, '{"surface": "paved", "lighting": "full", "shelter": "available", "water": "available"}', '[]', '[]', 9.2, '{"rain": "low_impact", "snow": "moderate_impact", "wind": "low_impact"}', '{"wheelchair": true, "elderly": true, "children": true}', '2024-03-10', 'verified'),
('ESC_004', ST_GeomFromText('POINT(116.0 40.4)', 4326), ST_GeomFromText('POINT(116.0 40.3)', 4326), ST_GeomFromText('LINESTRING(116.0 40.4, 116.0 40.35, 116.0 40.3)', 4326), 1500, 25, 2, 200.0, '{"surface": "mixed", "lighting": "partial", "shelter": "available", "water": "limited"}', '[{"lat": 40.35, "lng": 116.0, "description": "Rest Point"}]', '[{"route_id": "ESC_004_ALT1", "description": "Mountain Alternative"}]', 8.0, '{"rain": "moderate_impact", "snow": "high_impact", "wind": "moderate_impact"}', '{"wheelchair": false, "elderly": true, "children": true}', '2024-04-05', 'verified'),
('ESC_005', ST_GeomFromText('POINT(116.9 40.4)', 4326), ST_GeomFromText('POINT(116.85 40.35)', 4326), ST_GeomFromText('LINESTRING(116.9 40.4, 116.875 40.375, 116.85 40.35)', 4326), 1800, 28, 2, 40.0, '{"surface": "paved", "lighting": "full", "shelter": "available", "water": "available"}', '[{"lat": 40.375, "lng": 116.875, "description": "Scenic Point"}]', '[]', 8.8, '{"rain": "low_impact", "snow": "moderate_impact", "wind": "low_impact"}', '{"wheelchair": true, "elderly": true, "children": true}', '2024-05-12', 'verified');

-- Insert simulated monitoring data (recent data)
INSERT INTO monitoring_data (station_id, data_type, value, unit, timestamp, quality_flag, raw_data, processed_data) VALUES
-- Rainfall data
('BJ001', 'rainfall', 15.5, 'mm', NOW() - INTERVAL '3 hours', 1, '{"raw_value": 15.5, "sensor_status": "normal"}', '{"hourly_rate": 5.2, "cumulative_24h": 45.8}'),
('BJ001', 'rainfall', 22.3, 'mm', NOW() - INTERVAL '2 hours', 1, '{"raw_value": 22.3, "sensor_status": "normal"}', '{"hourly_rate": 7.4, "cumulative_24h": 68.1}'),
('BJ001', 'rainfall', 8.7, 'mm', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 8.7, "sensor_status": "normal"}', '{"hourly_rate": 8.7, "cumulative_24h": 76.8}'),
('BJ001', 'rainfall', 12.1, 'mm', NOW(), 1, '{"raw_value": 12.1, "sensor_status": "normal"}', '{"hourly_rate": 12.1, "cumulative_24h": 88.9}'),
-- Slope displacement data
('BJ002', 'slope_displacement', 2.3, 'mm', NOW() - INTERVAL '3 hours', 1, '{"raw_value": 2.3, "sensor_status": "normal"}', '{"rate_mm_per_hour": 0.1, "cumulative_displacement": 45.6}'),
('BJ002', 'slope_displacement', 2.8, 'mm', NOW() - INTERVAL '2 hours', 1, '{"raw_value": 2.8, "sensor_status": "normal"}', '{"rate_mm_per_hour": 0.5, "cumulative_displacement": 48.4}'),
('BJ002', 'slope_displacement', 3.1, 'mm', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 3.1, "sensor_status": "normal"}', '{"rate_mm_per_hour": 0.3, "cumulative_displacement": 51.5}'),
('BJ002', 'slope_displacement', 3.5, 'mm', NOW(), 1, '{"raw_value": 3.5, "sensor_status": "normal"}', '{"rate_mm_per_hour": 0.4, "cumulative_displacement": 55.0}'),
-- Groundwater level data
('BJ003', 'groundwater_level', 12.5, 'm', NOW() - INTERVAL '3 hours', 1, '{"raw_value": 12.5, "sensor_status": "normal"}', '{"change_rate": 0.1, "seasonal_variation": "normal"}'),
('BJ003', 'groundwater_level', 12.8, 'm', NOW() - INTERVAL '2 hours', 1, '{"raw_value": 12.8, "sensor_status": "normal"}', '{"change_rate": 0.15, "seasonal_variation": "normal"}'),
('BJ003', 'groundwater_level', 13.2, 'm', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 13.2, "sensor_status": "normal"}', '{"change_rate": 0.2, "seasonal_variation": "rising"}'),
('BJ003', 'groundwater_level', 13.6, 'm', NOW(), 1, '{"raw_value": 13.6, "sensor_status": "normal"}', '{"change_rate": 0.2, "seasonal_variation": "rising"}'),
-- Seismic data
('BJ004', 'seismic_acceleration', 0.002, 'g', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 0.002, "sensor_status": "normal"}', '{"magnitude_estimate": 1.2, "frequency_analysis": "normal"}'),
('BJ004', 'seismic_acceleration', 0.001, 'g', NOW() - INTERVAL '30 minutes', 1, '{"raw_value": 0.001, "sensor_status": "normal"}', '{"magnitude_estimate": 0.8, "frequency_analysis": "normal"}'),
('BJ004', 'seismic_acceleration', 0.003, 'g', NOW(), 1, '{"raw_value": 0.003, "sensor_status": "normal"}', '{"magnitude_estimate": 1.5, "frequency_analysis": "normal"}'),
-- Water level data
('BJ005', 'water_level', 158.5, 'm', NOW() - INTERVAL '2 hours', 1, '{"raw_value": 158.5, "sensor_status": "normal"}', '{"capacity_percentage": 78.5, "inflow_rate": 12.3}'),
('BJ005', 'water_level', 158.8, 'm', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 158.8, "sensor_status": "normal"}', '{"capacity_percentage": 78.8, "inflow_rate": 18.0}'),
('BJ005', 'water_level', 159.2, 'm', NOW(), 1, '{"raw_value": 159.2, "sensor_status": "normal"}', '{"capacity_percentage": 79.2, "inflow_rate": 24.0}'),
-- Weather data
('BJ006', 'temperature', 18.5, '°C', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 18.5, "sensor_status": "normal"}', '{"heat_index": 18.5, "trend": "stable"}'),
('BJ006', 'humidity', 65.2, '%', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 65.2, "sensor_status": "normal"}', '{"dew_point": 11.8, "comfort_level": "comfortable"}'),
('BJ006', 'temperature', 19.2, '°C', NOW(), 1, '{"raw_value": 19.2, "sensor_status": "normal"}', '{"heat_index": 19.2, "trend": "rising"}'),
('BJ006', 'humidity', 62.8, '%', NOW(), 1, '{"raw_value": 62.8, "sensor_status": "normal"}', '{"dew_point": 11.5, "comfort_level": "comfortable"}'),
-- Wind data
('BJ007', 'wind_speed', 3.2, 'm/s', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 3.2, "sensor_status": "normal"}', '{"gust_speed": 4.8, "beaufort_scale": 2}'),
('BJ007', 'wind_direction', 225, '°', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 225, "sensor_status": "normal"}', '{"direction_name": "SW", "stability": "stable"}'),
('BJ007', 'wind_speed', 2.8, 'm/s', NOW(), 1, '{"raw_value": 2.8, "sensor_status": "normal"}', '{"gust_speed": 4.2, "beaufort_scale": 2}'),
('BJ007', 'wind_direction', 230, '°', NOW(), 1, '{"raw_value": 230, "sensor_status": "normal"}', '{"direction_name": "SW", "stability": "stable"}'),
-- Soil moisture data
('BJ008', 'soil_moisture', 45.6, '%', NOW() - INTERVAL '2 hours', 1, '{"raw_value": 45.6, "sensor_status": "normal"}', '{"saturation_level": "moderate", "infiltration_rate": 2.3}'),
('BJ008', 'soil_moisture', 48.2, '%', NOW() - INTERVAL '1 hour', 1, '{"raw_value": 48.2, "sensor_status": "normal"}', '{"saturation_level": "moderate", "infiltration_rate": 1.8}'),
('BJ008', 'soil_moisture', 52.1, '%', NOW(), 1, '{"raw_value": 52.1, "sensor_status": "normal"}', '{"saturation_level": "high", "infiltration_rate": 1.2}');

-- Insert risk assessment results
INSERT INTO risk_assessments (zone_id, assessment_time, current_risk_level, predicted_risk_24h, predicted_risk_72h, contributing_factors, confidence_score, assessment_method, model_version, weather_conditions, historical_comparison, recommendations, created_by) VALUES
(1, NOW() - INTERVAL '1 hour', 2, 3, 2, '{"rainfall": 0.4, "slope": 0.3, "geology": 0.2, "history": 0.1}', 0.85, 'ml_model', 'v1.0', '{"temperature": 18.5, "humidity": 65.2, "rainfall_24h": 88.9, "wind_speed": 3.2}', '{"similar_events": 3, "last_event_date": "2023-07-15", "severity_comparison": "moderate"}', 'Strengthen monitoring and prepare emergency plans', 1),
(2, NOW() - INTERVAL '1 hour', 3, 4, 3, '{"rainfall": 0.3, "slope": 0.5, "geology": 0.15, "history": 0.05}', 0.78, 'ml_model', 'v1.0', '{"temperature": 19.2, "humidity": 62.8, "rainfall_24h": 45.2, "wind_speed": 2.8}', '{"similar_events": 5, "last_event_date": "2023-06-20", "severity_comparison": "high"}', 'Issue warning and consider evacuation', 1),
(3, NOW() - INTERVAL '1 hour', 1, 2, 1, '{"rainfall": 0.2, "slope": 0.1, "geology": 0.4, "history": 0.3}', 0.92, 'ml_model', 'v1.0', '{"temperature": 20.1, "humidity": 58.5, "rainfall_24h": 12.3, "wind_speed": 1.5}', '{"similar_events": 1, "last_event_date": "2022-08-10", "severity_comparison": "low"}', 'Continue routine monitoring', 1),
(4, NOW() - INTERVAL '1 hour', 2, 2, 3, '{"seismic": 0.6, "geology": 0.3, "history": 0.1}', 0.88, 'ml_model', 'v1.0', '{"temperature": 16.8, "humidity": 70.2, "seismic_activity": 1.5}', '{"similar_events": 2, "last_event_date": "2023-04-12", "severity_comparison": "moderate"}', 'Monitor seismic activity closely', 1),
(5, NOW() - INTERVAL '1 hour', 1, 1, 2, '{"water_level": 0.5, "rainfall": 0.3, "geology": 0.2}', 0.90, 'ml_model', 'v1.0', '{"temperature": 19.5, "humidity": 68.1, "water_level": 159.2}', '{"similar_events": 0, "last_event_date": null, "severity_comparison": "low"}', 'Normal monitoring of water level changes', 1);

-- Insert warning information
INSERT INTO warnings (warning_id, zone_id, disaster_type_id, warning_level, title, content, affected_area, estimated_affected_population, issue_time, effective_time, expiry_time, issuing_authority, contact_info, recommended_actions, evacuation_required, shelter_recommendations, status) VALUES
('WARN_001', 2, 1, 3, 'Mentougou Miaofeng Mountain Landslide Orange Warning', 'Due to continuous rainfall, there is a high risk of landslides in the Miaofeng Mountain area. Local residents and tourists should pay attention to safety and avoid dangerous areas.', ST_GeomFromText('POLYGON((116.0 39.9, 116.2 39.9, 116.2 40.1, 116.0 40.1, 116.0 39.9))', 4326), 1500, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', 'Beijing Emergency Management Bureau', '{"phone": "010-12345", "email": "emergency@beijing.gov.cn", "website": "www.beijing.gov.cn/emergency"}', '["Avoid steep mountain areas", "Pay attention to official warning information", "Prepare emergency supplies", "Ensure communication is smooth"]', false, '[{"name": "Mentougou No.1 Middle School", "distance": "2.5km", "capacity": 1500}]', 'active'),
('WARN_002', 1, 1, 2, 'Fangshan Shidu Scenic Area Landslide Yellow Warning', 'Due to recent heavy rainfall, some mountains in Shidu Scenic Area have landslide risks. Tourists should pay attention to safety.', ST_GeomFromText('POLYGON((115.6 39.6, 115.8 39.6, 115.8 39.8, 115.6 39.8, 115.6 39.6))', 4326), 800, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '20 hours', 'Fangshan Emergency Management Bureau', '{"phone": "010-69314000", "email": "emergency@fangshan.gov.cn"}', '["Avoid dangerous areas", "Pay attention to mountain changes", "Follow scenic area management instructions"]', false, '[{"name": "Fangshan Sports Center", "distance": "5km", "capacity": 2000}]', 'active');

-- Insert user reports
INSERT INTO user_reports (user_id, location, report_type, disaster_type_id, title, description, severity, images, videos, verification_status, verified_by, verified_at, verification_notes, upvotes, downvotes, is_emergency, response_actions) VALUES
(2, ST_GeomFromText('POINT(115.75 39.72)', 4326), 'disaster_sighting', 1, 'Small landslide found in Shidu Scenic Area', 'Found signs of mountain loosening near Qidu in Shidu Scenic Area, with small rocks falling', 2, '[{"url": "/uploads/landslide_001.jpg", "description": "Mountain loosening photo"}]', '[]', 'verified', 3, NOW() - INTERVAL '1 hour', 'After on-site verification, there is indeed small-scale mountain loosening, warning signs have been set up', 5, 0, false, '[{"action": "Set up warning signs", "time": "2024-01-15 14:30", "responsible": "Scenic Area Management Office"}]'),
(3, ST_GeomFromText('POINT(116.15 40.05)', 4326), 'road_condition', NULL, 'Serious water accumulation on Miaofeng Mountain road', 'Multiple sections of Miaofeng Mountain winding road have serious water accumulation, affecting traffic safety', 3, '[{"url": "/uploads/road_flood_001.jpg", "description": "Road water accumulation photo"}]', '[{"url": "/uploads/road_flood_001.mp4", "description": "Water accumulation video"}]', 'pending', NULL, NULL, NULL, 3, 1, false, '[]'),
(4, ST_GeomFromText('POINT(116.72 40.42)', 4326), 'infrastructure_damage', NULL, 'Yanqi Lake walkway railing damaged', 'Lakeside walkway railing damaged due to wind and rain, posing safety hazards', 2, '[{"url": "/uploads/railing_damage_001.jpg", "description": "Railing damage photo"}]', '[]', 'verified', 1, NOW() - INTERVAL '30 minutes', 'Maintenance team has been arranged to handle', 2, 0, false, '[{"action": "Arrange maintenance", "time": "2024-01-15 15:00", "responsible": "Huairou District Municipal Department"}]'),
(5, ST_GeomFromText('POINT(116.05 40.42)', 4326), 'weather_anomaly', NULL, 'Abnormal strong wind in Badaling area', 'Abnormal strong wind weather appeared in Badaling Great Wall scenic area, with gusts reaching level 8', 3, '[]', '[]', 'verified', 1, NOW() - INTERVAL '2 hours', 'Confirmed by meteorological department, strong wind warning has been issued', 8, 0, true, '[{"action": "Issue strong wind warning", "time": "2024-01-15 13:00", "responsible": "Yanqing District Meteorological Bureau"}]');

-- Insert system configuration
INSERT INTO system_config (config_key, config_value, description, category, is_public) VALUES
('risk_assessment_interval', '3600', 'Risk assessment calculation interval (seconds)', 'assessment', false),
('warning_thresholds', '{"level1": {"rainfall": 50, "slope": 5}, "level2": {"rainfall": 100, "slope": 10}, "level3": {"rainfall": 150, "slope": 15}, "level4": {"rainfall": 200, "slope": 20}, "level5": {"rainfall": 250, "slope": 25}}', 'Warning threshold configuration', 'warning', false),
('map_default_center', '{"lat": 39.9042, "lng": 116.4074, "zoom": 10}', 'Map default center point', 'map', true),
('emergency_contacts', '{"police": "110", "fire": "119", "medical": "120", "emergency_management": "12345"}', 'Emergency contact information', 'emergency', true),
('data_retention_days', '365', 'Data retention days', 'data', false),
('notification_settings', '{"email": true, "sms": true, "push": true, "webhook": false}', 'Notification settings', 'notification', false),
('api_rate_limits', '{"default": 1000, "premium": 5000, "admin": 10000}', 'API rate limits', 'api', false),
('backup_schedule', '{"daily": "02:00", "weekly": "Sunday 03:00", "monthly": "1st 04:00"}', 'Backup schedule', 'system', false);

-- Create useful views
DROP VIEW IF EXISTS v_current_risk_status;
CREATE VIEW v_current_risk_status AS
SELECT 
    rz.name as zone_name,
    rz.code as zone_code,
    dt.name as disaster_type,
    ra.current_risk_level,
    ra.predicted_risk_24h,
    ra.confidence_score,
    ra.assessment_time
FROM risk_zones rz
JOIN risk_assessments ra ON rz.id = ra.zone_id
JOIN disaster_types dt ON rz.disaster_type_id = dt.id
WHERE ra.assessment_time = (
    SELECT MAX(assessment_time) 
    FROM risk_assessments ra2 
    WHERE ra2.zone_id = ra.zone_id
);

DROP VIEW IF EXISTS v_active_warnings;
CREATE VIEW v_active_warnings AS
SELECT 
    w.warning_id,
    w.title,
    w.warning_level,
    rz.name as zone_name,
    dt.name as disaster_type,
    w.issue_time,
    w.expiry_time,
    w.status
FROM warnings w
JOIN risk_zones rz ON w.zone_id = rz.id
JOIN disaster_types dt ON w.disaster_type_id = dt.id
WHERE w.status = 'active' AND w.expiry_time > NOW();

DROP VIEW IF EXISTS v_shelter_capacity;
CREATE VIEW v_shelter_capacity AS
SELECT 
    s.name,
    s.capacity,
    s.current_occupancy,
    (s.capacity - s.current_occupancy) as available_capacity,
    CAST((s.current_occupancy::float / s.capacity * 100) AS DECIMAL(5,2)) as occupancy_rate,
    s.shelter_type,
    s.safety_level
FROM shelters s
WHERE s.is_active = true;

COMMENT ON VIEW v_current_risk_status IS 'Current risk status view';
COMMENT ON VIEW v_active_warnings IS 'Active warning information view';
COMMENT ON VIEW v_shelter_capacity IS 'Shelter capacity status view';