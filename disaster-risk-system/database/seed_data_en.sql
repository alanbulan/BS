-- Test data insertion script (English version to avoid encoding issues)

-- Insert test users
INSERT INTO users (username, email, phone, password_hash, location, role) VALUES
('admin', 'admin@disaster.com', '13800138000', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.4074 39.9042)', 4326), 'admin'),
('zhangsan', 'zhangsan@test.com', '13800138001', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.3074 39.8042)', 4326), 'user'),
('lisi', 'lisi@test.com', '13800138002', '$2b$10$rOzJqQZQZQZQZQZQZQZQZu', ST_GeomFromText('POINT(116.5074 39.7042)', 4326), 'expert');

-- Insert test risk zones (Beijing mountain areas)
INSERT INTO risk_zones (name, code, geometry, disaster_type_id, base_risk_level, population_density, elevation_avg, slope_avg, geological_structure) VALUES
('Fangshan Shidu Scenic Area', 'BJ_FS_SD', ST_GeomFromText('POLYGON((115.6 39.6, 115.8 39.6, 115.8 39.8, 115.6 39.8, 115.6 39.6))', 4326), 1, 3, 150.5, 280.0, 25.5, '{"rock_type": "limestone", "fault_density": "medium", "weathering_degree": "strong"}'),
('Mentougou Miaofeng Mountain', 'BJ_MTG_MFS', ST_GeomFromText('POLYGON((116.0 39.9, 116.2 39.9, 116.2 40.1, 116.0 40.1, 116.0 39.9))', 4326), 1, 4, 89.2, 450.0, 35.2, '{"rock_type": "granite", "fault_density": "high", "weathering_degree": "medium"}'),
('Huairou Yanqi Lake', 'BJ_HR_YQH', ST_GeomFromText('POLYGON((116.6 40.3, 116.8 40.3, 116.8 40.5, 116.6 40.5, 116.6 40.3))', 4326), 2, 2, 120.8, 180.0, 15.8, '{"rock_type": "gneiss", "fault_density": "low", "weathering_degree": "slight"}');

-- Insert monitoring stations
INSERT INTO monitoring_stations (station_id, name, location, station_type, equipment_info, installation_date, zone_id) VALUES
('BJ001', 'Shidu Rainfall Station', ST_GeomFromText('POINT(115.7 39.7)', 4326), 'rainfall', '{"model": "RG-100", "accuracy": "0.1mm", "range": "0-999mm"}', '2023-01-15', 1),
('BJ002', 'Miaofeng Slope Station', ST_GeomFromText('POINT(116.1 40.0)', 4326), 'slope', '{"model": "SG-200", "accuracy": "0.01mm", "range": "±50mm"}', '2023-02-20', 2),
('BJ003', 'Yanqi Groundwater Station', ST_GeomFromText('POINT(116.7 40.4)', 4326), 'groundwater', '{"model": "WL-300", "accuracy": "1cm", "range": "0-30m"}', '2023-03-10', 3);

-- Insert shelters
INSERT INTO shelters (name, location, address, capacity, shelter_type, facilities, contact_info, safety_level) VALUES
('Fangshan Sports Center', ST_GeomFromText('POINT(115.9 39.7)', 4326), 'No.11 Government Street, Fangshan District, Beijing', 2000, 'permanent', '{"medical": true, "food": true, "water": true, "power": true, "communication": true}', '{"phone": "010-69314000", "contact": "Fangshan Emergency Management Bureau"}', 5),
('Mentougou No.1 Middle School', ST_GeomFromText('POINT(116.1 39.9)', 4326), 'No.65 Xinqiao Street, Mentougou District, Beijing', 1500, 'school', '{"medical": false, "food": true, "water": true, "power": true, "communication": true}', '{"phone": "010-69842464", "contact": "Mentougou Education Committee"}', 4),
('Yanqi Lake Conference Center', ST_GeomFromText('POINT(116.7 40.4)', 4326), 'Yanqi Lake Ecological Development Zone, Huairou District, Beijing', 3000, 'temporary', '{"medical": true, "food": true, "water": true, "power": true, "communication": true}', '{"phone": "010-69681888", "contact": "Huairou District Government"}', 5);

-- Insert road network data
INSERT INTO road_network (road_id, name, geometry, road_type, road_class, width, surface_type, max_speed, is_emergency_route) VALUES
('G108_001', 'Beijing-Kunming Highway Fangshan Section', ST_GeomFromText('LINESTRING(115.8 39.6, 115.9 39.7, 116.0 39.8)', 4326), 'highway', 1, 24.0, 'asphalt', 120, true),
('S210_001', 'Provincial Road 210 Mentougou Section', ST_GeomFromText('LINESTRING(116.0 39.9, 116.1 40.0, 116.2 40.1)', 4326), 'arterial', 2, 12.0, 'asphalt', 80, true),
('X015_001', 'County Road 015 Huairou Section', ST_GeomFromText('LINESTRING(116.6 40.3, 116.7 40.4, 116.8 40.5)', 4326), 'collector', 3, 8.0, 'concrete', 60, false);

-- Insert escape routes
INSERT INTO escape_routes (route_id, start_point, end_point, route_geometry, distance_meters, estimated_time_minutes, difficulty_level, safety_score) VALUES
('ESC_001', ST_GeomFromText('POINT(115.7 39.7)', 4326), ST_GeomFromText('POINT(115.9 39.7)', 4326), ST_GeomFromText('LINESTRING(115.7 39.7, 115.8 39.7, 115.9 39.7)', 4326), 2500, 35, 2, 8.5),
('ESC_002', ST_GeomFromText('POINT(116.1 40.0)', 4326), ST_GeomFromText('POINT(116.1 39.9)', 4326), ST_GeomFromText('LINESTRING(116.1 40.0, 116.1 39.95, 116.1 39.9)', 4326), 1200, 18, 3, 7.8),
('ESC_003', ST_GeomFromText('POINT(116.7 40.4)', 4326), ST_GeomFromText('POINT(116.7 40.4)', 4326), ST_GeomFromText('LINESTRING(116.7 40.4, 116.7 40.4)', 4326), 800, 12, 1, 9.2);

-- Insert simulated monitoring data
INSERT INTO monitoring_data (station_id, data_type, value, unit, timestamp) VALUES
('BJ001', 'rainfall', 15.5, 'mm', NOW() - INTERVAL '1 hour'),
('BJ001', 'rainfall', 22.3, 'mm', NOW() - INTERVAL '30 minutes'),
('BJ001', 'rainfall', 8.7, 'mm', NOW()),
('BJ002', 'slope_displacement', 2.3, 'mm', NOW() - INTERVAL '1 hour'),
('BJ002', 'slope_displacement', 2.8, 'mm', NOW() - INTERVAL '30 minutes'),
('BJ002', 'slope_displacement', 3.1, 'mm', NOW()),
('BJ003', 'groundwater_level', 12.5, 'm', NOW() - INTERVAL '1 hour'),
('BJ003', 'groundwater_level', 12.8, 'm', NOW() - INTERVAL '30 minutes'),
('BJ003', 'groundwater_level', 13.2, 'm', NOW());

-- Insert risk assessment results
INSERT INTO risk_assessments (zone_id, assessment_time, current_risk_level, predicted_risk_24h, predicted_risk_72h, contributing_factors, confidence_score, assessment_method) VALUES
(1, NOW(), 2, 3, 2, '{"rainfall": 0.4, "slope": 0.3, "geology": 0.2, "history": 0.1}', 0.85, 'ml_model_v1.0'),
(2, NOW(), 3, 4, 3, '{"rainfall": 0.3, "slope": 0.5, "geology": 0.15, "history": 0.05}', 0.78, 'ml_model_v1.0'),
(3, NOW(), 1, 2, 1, '{"rainfall": 0.2, "slope": 0.1, "geology": 0.4, "history": 0.3}', 0.92, 'ml_model_v1.0');

-- Insert warning information
INSERT INTO warnings (warning_id, zone_id, disaster_type_id, warning_level, title, content, issue_time, effective_time, expiry_time, issuing_authority) VALUES
('WARN_001', 2, 1, 3, 'Mentougou Miaofeng Mountain Landslide Orange Warning', 'Due to continuous rainfall, there is a high risk of landslides in the Miaofeng Mountain area. Local residents and tourists are advised to pay attention to safety and avoid dangerous areas.', NOW(), NOW(), NOW() + INTERVAL '24 hours', 'Beijing Emergency Management Bureau');

-- Insert user reports
INSERT INTO user_reports (user_id, location, report_type, disaster_type_id, title, description, severity, verification_status) VALUES
(2, ST_GeomFromText('POINT(115.75 39.72)', 4326), 'disaster_sighting', 1, 'Small landslide found in Shidu Scenic Area', 'Signs of loose mountain body found near the 7th crossing of Shidu Scenic Area, with small rocks falling', 2, 'verified'),
(3, ST_GeomFromText('POINT(116.15 40.05)', 4326), 'road_condition', NULL, 'Serious water accumulation on Miaofeng Mountain road', 'Multiple water accumulations on Miaofeng Mountain winding road, affecting traffic safety', 3, 'pending');

COMMIT;

-- Create useful views
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

CREATE VIEW v_shelter_capacity AS
SELECT 
    s.name,
    s.capacity,
    s.current_occupancy,
    (s.capacity - s.current_occupancy) as available_capacity,
    ROUND((s.current_occupancy::float / s.capacity * 100), 2) as occupancy_rate,
    s.shelter_type,
    s.safety_level
FROM shelters s
WHERE s.is_active = true;

COMMENT ON VIEW v_current_risk_status IS 'Current risk status view';
COMMENT ON VIEW v_active_warnings IS 'Active warning information view';
COMMENT ON VIEW v_shelter_capacity IS 'Shelter capacity status view';