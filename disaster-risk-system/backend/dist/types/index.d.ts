export interface Point {
    type: 'Point';
    coordinates: [number, number];
}
export interface LineString {
    type: 'LineString';
    coordinates: [number, number][];
}
export interface Polygon {
    type: 'Polygon';
    coordinates: [number, number][][];
}
export interface User {
    id: number;
    username: string;
    email: string;
    phone?: string;
    full_name?: string;
    department?: string;
    position?: string;
    password_hash: string;
    location?: Point;
    avatar_url?: string;
    permissions?: any;
    last_login?: Date;
    is_active: boolean;
    role: 'user' | 'admin' | 'expert';
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserData {
    username: string;
    email: string;
    phone?: string;
    full_name?: string;
    department?: string;
    position?: string;
    password: string;
    location?: Point;
    avatar_url?: string;
    permissions?: any;
    role?: 'user' | 'admin' | 'expert';
}
export interface UpdateUserData {
    username?: string;
    email?: string;
    phone?: string;
    full_name?: string;
    department?: string;
    position?: string;
    location?: Point;
    avatar_url?: string;
    permissions?: any;
    last_login?: Date;
    is_active?: boolean;
    role?: 'user' | 'admin' | 'expert';
}
export interface DisasterType {
    id: number;
    name: string;
    name_en?: string;
    description?: string;
    base_risk_level: number;
    warning_threshold?: any;
    color_code?: string;
    icon_url?: string;
    is_active: boolean;
    created_at: Date;
}
export interface RiskZone {
    id: number;
    name: string;
    code: string;
    geometry?: Polygon;
    disaster_type_id: number;
    base_risk_level: number;
    population_density?: number;
    elevation_avg?: number;
    elevation_max?: number;
    elevation_min?: number;
    slope_avg?: number;
    slope_max?: number;
    geological_structure?: any;
    land_use_type?: string;
    vegetation_coverage?: number;
    administrative_level?: string;
    responsible_department?: string;
    emergency_contact?: any;
    is_monitored: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateRiskZoneData {
    name: string;
    code: string;
    geometry?: Polygon;
    disaster_type_id: number;
    base_risk_level: number;
    population_density?: number;
    elevation_avg?: number;
    elevation_max?: number;
    elevation_min?: number;
    slope_avg?: number;
    slope_max?: number;
    geological_structure?: any;
    land_use_type?: string;
    vegetation_coverage?: number;
    administrative_level?: string;
    responsible_department?: string;
    emergency_contact?: any;
    is_monitored?: boolean;
}
export interface UpdateRiskZoneData {
    name?: string;
    code?: string;
    geometry?: Polygon;
    disaster_type_id?: number;
    base_risk_level?: number;
    population_density?: number;
    elevation_avg?: number;
    elevation_max?: number;
    elevation_min?: number;
    slope_avg?: number;
    slope_max?: number;
    geological_structure?: any;
    land_use_type?: string;
    vegetation_coverage?: number;
    administrative_level?: string;
    responsible_department?: string;
    emergency_contact?: any;
    is_monitored?: boolean;
}
export interface MonitoringData {
    id: number;
    station_id: string;
    data_type: string;
    value: number;
    unit?: string;
    timestamp: Date;
    quality_flag: number;
    raw_data?: any;
    processed_data?: any;
    alert_threshold_min?: number;
    alert_threshold_max?: number;
    calibration_factor?: number;
    device_status?: string;
    created_at?: Date;
}
export interface MonitoringStation {
    id: number;
    station_id: string;
    name: string;
    location?: Point;
    station_type: string;
    monitoring_type?: string;
    address?: string;
    elevation?: number;
    equipment_info?: any;
    installation_date?: Date;
    installation_status?: string;
    maintenance_schedule?: any;
    data_transmission_interval?: number;
    power_source?: string;
    communication_method?: string;
    contact_info?: any;
    technical_specs?: any;
    is_active: boolean;
    zone_id?: number;
    last_maintenance_date?: Date;
    next_maintenance_date?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface RiskAssessment {
    id: number;
    zone_id: number;
    assessment_time: Date;
    current_risk_level: number;
    predicted_risk_24h?: number;
    predicted_risk_72h?: number;
    contributing_factors?: any;
    confidence_score?: number;
    assessment_method?: string;
    model_version?: string;
    weather_conditions?: any;
    historical_comparison?: any;
    recommendations?: string;
    created_by?: number;
}
export interface Shelter {
    id: number;
    name: string;
    location?: Point;
    address?: string;
    capacity: number;
    current_occupancy: number;
    shelter_type?: string;
    facilities?: any;
    contact_info?: any;
    access_routes?: any;
    elevation?: number;
    safety_level?: number;
    operating_hours?: any;
    special_requirements?: string;
    is_active: boolean;
    last_inspection_date?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface UserReport {
    id: number;
    user_id: number;
    user?: {
        id: number;
        username: string;
        full_name?: string;
        role?: string;
        department?: string;
        avatar_url?: string;
    };
    location?: Point;
    report_type: string;
    disaster_type_id?: number;
    title?: string;
    description?: string;
    severity?: number;
    images?: any;
    videos?: any;
    verification_status: string;
    verified_by?: number;
    verified_by_user?: {
        id: number;
        username: string;
        full_name?: string;
        role?: string;
        department?: string;
    };
    verified_at?: Date;
    verification_notes?: string;
    upvotes: number;
    downvotes: number;
    is_emergency: boolean;
    response_actions?: any;
    created_at: Date;
    updated_at: Date;
}
export interface Warning {
    id: number;
    warning_id?: string;
    zone_id?: number;
    disaster_type_id?: number;
    warning_level?: number;
    title: string;
    content: string;
    affected_area?: Polygon;
    estimated_affected_population?: number;
    issue_time: Date;
    effective_time?: Date;
    expiry_time?: Date;
    issuing_authority?: string;
    contact_info?: any;
    recommended_actions?: any;
    evacuation_required: boolean;
    shelter_recommendations?: any;
    status: string;
    update_sequence: number;
    parent_warning_id?: number;
    created_at: Date;
}
export interface TimeRangeQuery {
    start_time?: Date;
    end_time?: Date;
}
export interface LocationQuery {
    latitude: number;
    longitude: number;
    radius?: number;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface RoadNetwork {
    id: number;
    road_id: string;
    road_name: string;
    geometry: LineString;
    road_type: string;
    road_condition: string;
    width_meters?: number;
    speed_limit?: number;
    condition_score?: number;
    is_emergency_route: boolean;
    is_accessible: boolean;
    maintenance_status?: string;
    last_inspection?: Date;
    traffic_capacity?: number;
    surface_type?: string;
    slope_grade?: number;
    bridge_info?: any;
    tunnel_info?: any;
    weather_restrictions?: any;
    emergency_contact?: any;
    created_at: Date;
    updated_at: Date;
}
export interface EscapeRoute {
    id: number;
    route_id?: string;
    start_point?: Point;
    end_point?: Point;
    route_geometry?: LineString;
    distance_meters?: number;
    estimated_time_minutes?: number;
    difficulty_level?: number;
    elevation_gain?: number;
    route_conditions?: any;
    waypoints?: any;
    alternative_routes?: any;
    safety_score?: number;
    weather_dependency?: any;
    accessibility_info?: any;
    last_verified_date?: Date;
    verification_status: string;
    created_at: Date;
    updated_at: Date;
}
export interface SystemConfig {
    id: number;
    config_key: string;
    config_value: string;
    description?: string;
    category: string;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface QueryResult {
    rows: any[];
    rowCount: number | null;
    command: string;
}
//# sourceMappingURL=index.d.ts.map