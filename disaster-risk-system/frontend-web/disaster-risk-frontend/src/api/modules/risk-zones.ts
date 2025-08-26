import { request, paginatedRequest } from '../index'
import type { RiskZone, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 风险区域API
export const riskZonesApi = {
  // 获取风险区域列表
  getRiskZones: (params?: QueryParams & {
    disaster_type_id?: number
    risk_level_min?: number
    risk_level_max?: number
  }): Promise<PaginatedResponse<RiskZone>> => {
    return paginatedRequest.get('/risk-zones', { params })
  },

  // 获取风险区域详情
  getRiskZone: (id: number): Promise<ApiResponse<RiskZone>> => {
    return request.get(`/risk-zones/${id}`)
  },

  // 根据编码获取风险区域
  getRiskZoneByCode: (code: string): Promise<ApiResponse<RiskZone>> => {
    return request.get(`/risk-zones/code/${code}`)
  },

  // 创建风险区域
  createRiskZone: (data: Partial<RiskZone>): Promise<ApiResponse<RiskZone>> => {
    return request.post('/risk-zones', data)
  },

  // 更新风险区域
  updateRiskZone: (id: number, data: Partial<RiskZone>): Promise<ApiResponse<RiskZone>> => {
    return request.put(`/risk-zones/${id}`, data)
  },

  // 删除风险区域
  deleteRiskZone: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/risk-zones/${id}`)
  },

  // 获取风险区域统计信息
  getRiskZoneStats: (): Promise<ApiResponse<{
    total: number
    byDisasterType: Record<string, number>
    byRiskLevel: Record<number, number>
    averageRiskLevel: number
  }>> => {
    return request.get('/risk-zones/stats')
  },

  // 根据位置查找风险区域
  getRiskZonesByLocation: (params: {
    latitude: number
    longitude: number
    radius?: number
  }): Promise<ApiResponse<RiskZone[]>> => {
    return request.get('/risk-zones/location', { params })
  },

  // 查找附近的风险区域
  getNearbyRiskZones: (params: {
    latitude: number
    longitude: number
    radius?: number
    limit?: number
  }): Promise<ApiResponse<RiskZone[]>> => {
    return request.get('/risk-zones/nearby', { params })
  },

  // 根据灾害类型获取风险区域
  getRiskZonesByDisasterType: (disasterTypeId: number): Promise<ApiResponse<RiskZone[]>> => {
    return request.get(`/risk-zones/disaster-type/${disasterTypeId}`)
  },

  // 根据风险等级获取风险区域
  getRiskZonesByRiskLevel: (params: {
    min_level?: number
    max_level?: number
  }): Promise<ApiResponse<RiskZone[]>> => {
    return request.get('/risk-zones/risk-level', { params })
  },

  // 获取区域边界框
  getRiskZoneBounds: (id: number): Promise<ApiResponse<{
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
  }>> => {
    return request.get(`/risk-zones/${id}/bounds`)
  },

  // 查找重叠的风险区域
  getOverlappingRiskZones: (data: {
    geometry: any
    exclude_id?: number
  }): Promise<ApiResponse<RiskZone[]>> => {
    return request.post('/risk-zones/overlapping', data)
  },

  // 导出风险区域数据
  exportRiskZones: (params?: QueryParams): Promise<Blob> => {
    return request.download('/risk-zones/export', {
      params
    })
  }
}