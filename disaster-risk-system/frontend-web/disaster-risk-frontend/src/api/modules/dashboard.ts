import { request } from "../index";
import type { ApiResponse } from '../../types';

// 仪表板统计数据接口
export interface DashboardStats {
  totalZones: number
  activeWarnings: number
  onlineStations: number
  riskAssessments: number
  totalShelters: number
  totalUsers: number
  totalReports: number
}

// 风险等级统计接口
export interface RiskLevelStats {
  level1: number
  level2: number
  level3: number
  level4: number
  level5: number
  total: number
}

// 系统状态接口
export interface SystemStatus {
  monitoring: {
    status: 'normal' | 'warning' | 'error'
    onlineStations: number
    totalStations: number
    lastUpdateTime: string
  }
  warning: {
    status: 'normal' | 'warning' | 'error'
    activeWarnings: number
    totalWarnings: number
    lastIssueTime: string
  }
  dataSync: {
    status: 'normal' | 'warning' | 'error'
    lastSyncTime: string
    syncInterval: number
  }
  mapService: {
    status: 'normal' | 'warning' | 'error'
    responseTime: number
    availability: number
  }
}

// 最近预警接口
export interface RecentWarning {
  id: number
  warning_id: string
  title: string
  content: string
  warning_level: number
  zone_id: number
  zone_name: string
  disaster_type_id: number
  disaster_type_name: string
  issue_time: string
  effective_time: string
  expiry_time: string
  status: 'active' | 'expired' | 'cancelled'
  issuing_authority: string
  estimated_affected_population: number
  evacuation_required: boolean
}

// 监测站点状态统计接口
export interface StationStats {
  total: number
  online: number
  offline: number
  warning: number
  maintenance: number
}

// 灾害类型统计接口
export interface DisasterTypeStats {
  id: number
  name: string
  name_en: string
  total_zones: number
  active_warnings: number
  risk_level_avg: number
  color_code: string
}

// 仪表板API
export const dashboardApi = {
  // 获取仪表板统计数据
  getStats: (): Promise<ApiResponse<DashboardStats>> => {
    return request.get('/dashboard/stats')
  },

  // 获取风险等级分布
  getRiskLevelStats: (): Promise<ApiResponse<RiskLevelStats>> => {
    return request.get('/dashboard/risk-levels')
  },

  // 获取最近预警
  getRecentWarnings: (limit = 10): Promise<ApiResponse<RecentWarning[]>> => {
    return request.get('/dashboard/warnings/recent', { params: { limit } })
  },

  // 获取系统状态
  getSystemStatus: (): Promise<ApiResponse<SystemStatus>> => {
    return request.get('/dashboard/system-status')
  },

  // 获取监测站点状态统计
  getStationStats: (): Promise<ApiResponse<StationStats>> => {
    return request.get('/dashboard/station-stats')
  },

  // 获取灾害类型统计
  getDisasterTypeStats: (): Promise<ApiResponse<DisasterTypeStats[]>> => {
    return request.get('/dashboard/disaster-type-stats')
  },

  // 获取实时监测数据概览
  getMonitoringOverview: (): Promise<ApiResponse<any>> => {
    return request.get('/dashboard/monitoring-overview')
  },

  // 获取风险评估趋势
  getRiskTrends: (days = 7): Promise<ApiResponse<any[]>> => {
    return request.get('/dashboard/risk-trends', { params: { days } })
  }
};