import { request, paginatedRequest } from '../index'
import type { DisasterType, QueryParams, ApiResponse, PaginatedResponse } from '../../types'

// 灾害类型管理API
export const disasterTypesApi = {
  // 获取灾害类型列表
  getDisasterTypes: (params?: QueryParams): Promise<PaginatedResponse<DisasterType>> => {
    return paginatedRequest.get('/disaster-types', { params })
  },

  // 获取灾害类型详情
  getDisasterType: (id: number): Promise<ApiResponse<DisasterType>> => {
    return request.get(`/disaster-types/${id}`)
  },

  // 创建灾害类型
  createDisasterType: (data: Partial<DisasterType>): Promise<ApiResponse<DisasterType>> => {
    return request.post('/disaster-types', data)
  },

  // 更新灾害类型
  updateDisasterType: (id: number, data: Partial<DisasterType>): Promise<ApiResponse<DisasterType>> => {
    return request.put(`/disaster-types/${id}`, data)
  },

  // 删除灾害类型
  deleteDisasterType: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/disaster-types/${id}`)
  },

  // 切换灾害类型状态
  toggleDisasterTypeStatus: (id: number, isActive: boolean): Promise<ApiResponse<DisasterType>> => {
    return request.patch(`/disaster-types/${id}/status`, { is_active: isActive })
  },

  // 获取灾害类型统计信息
  getDisasterTypeStats: (): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    byRiskLevel: Record<string, number>
  }>> => {
    return request.get('/disaster-types/stats')
  },

  // 根据风险等级获取灾害类型
  getDisasterTypesByRiskLevel: (riskLevel: number): Promise<ApiResponse<DisasterType[]>> => {
    return request.get(`/disaster-types/risk-level/${riskLevel}`)
  }
}