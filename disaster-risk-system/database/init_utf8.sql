-- Smart Geological Disaster Risk Assessment System Database Initialization Script

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 1. Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    location GEOMETRY(POINT, 4326),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Disaster types table
CREATE TABLE disaster_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    description TEXT,
    base_risk_level INTEGER CHECK (base_risk_level BETWEEN 1 AND 5),
    warning_threshold JSONB,
    color_code VARCHAR(7),
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Risk zones table
CREATE TABLE risk_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    geometry GEOMETRY(POLYGON, 4326),
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    base_risk_level INTEGER CHECK (base_risk_level BETWEEN 1 AND 5),
    population_density FLOAT,
    elevation_avg FLOAT,
    elevation_max FLOAT,
    elevation_min FLOAT,
    slope_avg FLOAT,
    slope_max FLOAT,
    geological_structure JSONB,
    land_use_type VARCHAR(50),
    vegetation_coverage FLOAT,
    administrative_level VARCHAR(50),
    responsible_department VARCHAR(100),
    emergency_contact JSONB,
    is_monitored BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Monitoring stations table
CREATE TABLE monitoring_stations (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location GEOMETRY(POINT, 4326),
    station_type VARCHAR(50) NOT NULL,
    equipment_info JSONB,
    installation_date DATE,
    maintenance_schedule JSONB,
    data_transmission_interval INTEGER,
    is_active BOOLEAN DEFAULT true,
    zone_id INTEGER REFERENCES risk_zones(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Real-time monitoring data table
CREATE TABLE monitoring_data (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES monitoring_stations(station_id),
    data_type VARCHAR(50) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(20),
    timestamp TIMESTAMP NOT NULL,
    quality_flag INTEGER DEFAULT 1,
    raw_data JSONB,
    processed_data JSONB
);

-- 6. Risk assessment results table
CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES risk_zones(id),
    assessment_time TIMESTAMP NOT NULL,
    current_risk_level INTEGER CHECK (current_risk_level BETWEEN 1 AND 5),
    predicted_risk_24h INTEGER CHECK (predicted_risk_24h BETWEEN 1 AND 5),
    predicted_risk_72h INTEGER CHECK (predicted_risk_72h BETWEEN 1 AND 5),
    contributing_factors JSONB,
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    assessment_method VARCHAR(50),
    model_version VARCHAR(20),
    weather_conditions JSONB,
    historical_comparison JSONB,
    recommendations TEXT,
    created_by INTEGER REFERENCES users(id)
);

-- 7. Shelters table
CREATE TABLE shelters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location GEOMETRY(POINT, 4326),
    address TEXT,
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    shelter_type VARCHAR(50),
    facilities JSONB,
    contact_info JSONB,
    access_routes JSONB,
    elevation FLOAT,
    safety_level INTEGER CHECK (safety_level BETWEEN 1 AND 5),
    operating_hours JSONB,
    special_requirements TEXT,
    is_active BOOLEAN DEFAULT true,
    last_inspection_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Road network table
CREATE TABLE road_network (
    id SERIAL PRIMARY KEY,
    road_id VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    geometry GEOMETRY(LINESTRING, 4326),
    road_type VARCHAR(50),
    road_class INTEGER,
    width FLOAT,
    surface_type VARCHAR(50),
    max_speed INTEGER,
    is_bidirectional BOOLEAN DEFAULT true,
    elevation_profile JSONB,
    slope_grade FLOAT,
    bridge_tunnel_info JSONB,
    maintenance_status VARCHAR(50),
    traffic_capacity INTEGER,
    is_emergency_route BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Escape routes table
CREATE TABLE escape_routes (
    id SERIAL PRIMARY KEY,
    route_id VARCHAR(50) UNIQUE,
    start_point GEOMETRY(POINT, 4326),
    end_point GEOMETRY(POINT, 4326),
    route_geometry GEOMETRY(LINESTRING, 4326),
    distance_meters FLOAT,
    estimated_time_minutes INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    elevation_gain FLOAT,
    route_conditions JSONB,
    waypoints JSONB,
    alternative_routes JSONB,
    safety_score FLOAT CHECK (safety_score BETWEEN 0 AND 10),
    weather_dependency JSONB,
    accessibility_info JSONB,
    last_verified_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. User reports table
CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    location GEOMETRY(POINT, 4326),
    report_type VARCHAR(50) NOT NULL,
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    title VARCHAR(200),
    description TEXT,
    severity INTEGER CHECK (severity BETWEEN 1 AND 5),
    images JSONB,
    videos JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_emergency BOOLEAN DEFAULT false,
    response_actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Warnings table
CREATE TABLE warnings (
    id SERIAL PRIMARY KEY,
    warning_id VARCHAR(50) UNIQUE,
    zone_id INTEGER REFERENCES risk_zones(id),
    disaster_type_id INTEGER REFERENCES disaster_types(id),
    warning_level INTEGER CHECK (warning_level BETWEEN 1 AND 5),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    affected_area GEOMETRY(POLYGON, 4326),
    estimated_affected_population INTEGER,
    issue_time TIMESTAMP NOT NULL,
    effective_time TIMESTAMP,
    expiry_time TIMESTAMP,
    issuing_authority VARCHAR(100),
    contact_info JSONB,
    recommended_actions JSONB,
    evacuation_required BOOLEAN DEFAULT false,
    shelter_recommendations JSONB,
    status VARCHAR(20) DEFAULT 'active',
    update_sequence INTEGER DEFAULT 1,
    parent_warning_id INTEGER REFERENCES warnings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. System configuration table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_risk_zones_geometry ON risk_zones USING GIST (geometry);
CREATE INDEX idx_monitoring_stations_location ON monitoring_stations USING GIST (location);
CREATE INDEX idx_shelters_location ON shelters USING GIST (location);
CREATE INDEX idx_road_network_geometry ON road_network USING GIST (geometry);
CREATE INDEX idx_escape_routes_geometry ON escape_routes USING GIST (route_geometry);
CREATE INDEX idx_user_reports_location ON user_reports USING GIST (location);
CREATE INDEX idx_warnings_affected_area ON warnings USING GIST (affected_area);

-- Create time indexes
CREATE INDEX idx_monitoring_data_timestamp ON monitoring_data (timestamp DESC);
CREATE INDEX idx_risk_assessments_time ON risk_assessments (assessment_time DESC);
CREATE INDEX idx_warnings_issue_time ON warnings (issue_time DESC);

-- Create other useful indexes
CREATE INDEX idx_monitoring_data_station_type ON monitoring_data (station_id, data_type, timestamp);
CREATE INDEX idx_risk_assessments_zone ON risk_assessments (zone_id, assessment_time DESC);
CREATE INDEX idx_user_reports_status ON user_reports (verification_status, created_at DESC);

-- Insert initial disaster types
INSERT INTO disaster_types (name, name_en, description, base_risk_level, color_code) VALUES
('Landslide', 'Landslide', 'Mass movement of rock, earth or debris down a slope', 3, '#FF6B35'),
('Debris Flow', 'Debris Flow', 'Fast-moving landslide containing water, rock, soil and debris', 4, '#8B4513'),
('Earthquake', 'Earthquake', 'Sudden release of energy in the Earth crust', 5, '#DC143C'),
('Flash Flood', 'Flash Flood', 'Sudden flooding of low-lying areas', 3, '#4169E1'),
('Rockfall', 'Rockfall', 'Detachment and fall of rock from a cliff or steep slope', 3, '#B8860B'),
('Ground Subsidence', 'Ground Subsidence', 'Gradual settling of the ground surface', 2, '#9932CC');

-- Insert system configuration
INSERT INTO system_config (config_key, config_value, description, category, is_public) VALUES
('risk_assessment_interval', '{"minutes": 30}', 'Risk assessment calculation interval', 'assessment', false),
('warning_thresholds', '{"level1": 0.2, "level2": 0.4, "level3": 0.6, "level4": 0.8, "level5": 0.9}', 'Warning threshold configuration', 'warning', false),
('map_default_center', '{"lat": 39.9042, "lng": 116.4074, "zoom": 10}', 'Default map center (Beijing)', 'map', true),
('emergency_contacts', '{"police": "110", "fire": "119", "medical": "120", "disaster": "12350"}', 'Emergency contact numbers', 'emergency', true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_zones_updated_at BEFORE UPDATE ON risk_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shelters_updated_at BEFORE UPDATE ON shelters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_road_network_updated_at BEFORE UPDATE ON road_network FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escape_routes_updated_at BEFORE UPDATE ON escape_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_reports_updated_at BEFORE UPDATE ON user_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();