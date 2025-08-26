// 基础API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  success: boolean
  message?: string
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 查询参数类型
export interface QueryParams {
  page?: number
  page_size?: number
  limit?: number
  search?: string
  [key: string]: any
}

// 地图边界类型
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// 灾害类型
export interface DisasterType {
  id: number
  name: string
  name_en?: string
  description?: string
  base_risk_level: number
  warning_threshold?: any
  color_code?: string
  icon_url?: string
  is_active: boolean
  created_at: string
}

// 风险区域
export interface RiskZone {
  id: number
  name: string
  code: string
  geometry: any // GeoJSON POLYGON
  geometry_json?: any // GeoJSON字符串格式
  disaster_type_id: number
  base_risk_level: number
  population_density?: number
  elevation_avg?: number
  elevation_max?: number
  elevation_min?: number
  slope_avg?: number
  slope_max?: number
  geological_structure?: any
  land_use_type?: string
  vegetation_coverage?: number
  administrative_level?: string
  responsible_department?: string
  emergency_contact?: any
  is_monitored: boolean
  created_at: string
  updated_at: string
  disaster_type?: DisasterType
}

// 监测站点类型
export interface MonitoringStationType {
  id: number
  code: string
  name_zh: string
  name_en: string
  description_zh?: string | null
  description_en?: string | null
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

// 监测站点
export interface MonitoringStation {
  id: number
  station_id: string
  name: string
  station_type: string // geological, meteorological, hydrological, environmental
  station_type_name?: string // 监测类型中文名称
  longitude?: number
  latitude?: number
  location?: string // 位置描述
  location_wkt?: string // WKT格式的位置数据
  altitude?: number
  zone_id?: number
  zone_name?: string
  equipment_info?: any
  installation_date?: string
  maintenance_schedule?: any
  data_transmission_interval?: number
  is_active: boolean
  notes?: string
  last_data_time?: string // 最后数据时间
  created_at: string
  updated_at?: string
  risk_zone?: RiskZone
}

// 监测数据
export interface MonitoringData {
  id: number
  station_id: string
  data_type: string
  value: number
  unit?: string
  timestamp: string
  quality_flag: number // 1-5, 数据质量等级
  raw_data?: any
  processed_data?: any
  alert_threshold_min?: number
  alert_threshold_max?: number
  calibration_factor?: number
  device_status?: string // normal, warning, error, offline
  is_anomaly?: boolean
  anomaly_reason?: string
  metadata?: any
  sensor_data?: any
  created_at?: string
  updated_at?: string
  station?: MonitoringStation
  station_name?: string
  station_type?: string
}

// 预警信息
export interface Warning {
  id: number
  warning_id?: string
  zone_id?: number
  disaster_type_id: number
  warning_level: number
  title: string
  content: string
  affected_area?: any // GeoJSON POLYGON
  affected_area_wkt?: string // WKT格式的影响区域数据
  estimated_affected_population?: number
  issue_time: string
  effective_time?: string
  expiry_time?: string
  issuing_authority?: string
  contact_info?: any
  recommended_actions?: any
  evacuation_required?: boolean
  shelter_recommendations?: any
  status: string
  update_sequence?: number
  parent_warning_id?: number
  emergency_measures?: string
  created_at: string
  disaster_type?: DisasterType
  risk_zone?: RiskZone
  zone?: RiskZone
  // 后端查询返回的关联字段
  disaster_type_name?: string
  zone_name?: string
}

// 避难场所
export interface Shelter {
  id: number
  name: string
  location: any // GeoJSON POINT
  address?: string
  capacity: number
  current_occupancy?: number
  shelter_type?: string
  facilities?: any
  contact_info?: any
  access_routes?: any
  elevation?: number
  safety_level?: number
  operating_hours?: any
  special_requirements?: string
  is_active: boolean
  last_inspection_date?: string
  created_at: string
  updated_at: string
}

// 避难所列表项类型（包含后端派生字段）
export interface ShelterListItem extends Shelter {
  shelter_id: number // 后端映射的 ID
  contact_person?: string // 从 contact_info 解析
  contact_phone?: string // 从 contact_info 解析
  management_agency?: string // 从 contact_info 解析
  status?: string // 根据状态计算的派生字段
  notes?: string // 备注
}

// 疏散路线
export interface EscapeRoute {
  id: number
  route_id?: string
  start_point: any // GeoJSON Point
  end_point: any // GeoJSON Point
  route_geometry: any // GeoJSON LineString
  distance_meters: number
  estimated_time_minutes: number
  difficulty_level: number
  elevation_gain?: number
  route_conditions?: any
  waypoints?: any
  alternative_routes?: any
  safety_score: number
  weather_dependency?: any
  accessibility_info?: any
  last_verified_date?: string
  verification_status: string
  created_at: string
  updated_at: string
}

// 道路网络
export interface RoadNetwork {
  id: number
  road_id?: string
  name: string
  road_type: string
  road_class?: number
  geometry: any // GeoJSON
  length?: number
  width?: number
  surface_type?: string
  max_speed?: number
  is_bidirectional?: boolean
  elevation_profile?: any
  slope_grade?: number
  bridge_tunnel_info?: any
  maintenance_status?: string
  traffic_capacity?: number
  capacity?: number
  traffic_flow?: number
  condition_score?: number
  last_maintenance?: string
  disaster_vulnerability?: any
  status?: 'normal' | 'congested' | 'blocked' | 'damaged'
  is_emergency_route?: boolean
  description?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// 风险评估
export interface RiskAssessment {
  id: number
  title: string
  description?: string
  assessment_type: string
  disaster_type_id: number
  risk_zone_id?: number
  assessment_date: string
  assessor_id: number
  methodology?: string
  risk_factors?: any
  vulnerability_analysis?: any
  threat_analysis?: any
  risk_matrix?: any
  overall_risk_score: number
  risk_level: string
  recommendations?: any
  mitigation_measures?: any
  review_date?: string
  status: 'draft' | 'in_review' | 'approved' | 'archived'
  attachments?: any
  created_at: string
  updated_at: string
  disaster_type?: DisasterType
  risk_zone?: RiskZone
  predicted_risk_24h?: number
  predicted_risk_72h?: number
  confidence_score?: number
  assessment_method?: string
  model_version?: string
  contributing_factors?: any
  weather_conditions?: any
  historical_comparison?: any
  zone_name?: string
  current_risk_level?: number
  zone_id?: number
  assessment_time?: string
}

// 用户举报
export interface UserReport {
  id: number
  user_id: number
  location?: any // GeoJSON Point
  report_type: string
  disaster_type_id?: number
  title?: string
  description?: string
  severity: number
  images?: any
  videos?: any
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_by?: number
  verified_at?: string
  verification_notes?: string
  upvotes?: number
  downvotes?: number
  is_emergency?: boolean
  response_actions?: any
  created_at: string
  updated_at: string
}

// 用户
export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  phone?: string
  role: string
  department?: string
  position?: string
  location?: string | null
  avatar_url?: string
  permissions?: any
  last_login?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 系统配置
export interface SystemConfig {
  id: number
  config_key: string
  config_value: any
  description?: string
  category: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// 登录表单
export interface LoginForm {
  username: string
  password: string
  rememberMe?: boolean
}

// 注册表单
export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword?: string
  full_name?: string
  phone?: string
}

// 仪表板统计数据
export interface DashboardStats {
  totalZones: number
  activeWarnings: number
  onlineStations: number
  riskAssessments: number
  totalShelters: number
  totalUsers: number
  totalReports: number
}

// 风险等级统计
export interface RiskLevelStats {
  level1: number
  level2: number
  level3: number
  level4: number
  level5: number
}