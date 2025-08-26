// 监测站点类型 API
import { request } from '../index'
import type { ApiResponse } from '../../types'
import type { MonitoringStationType } from '../../types'

export const monitoringStationTypesApi = {
  // 获取类型列表（支持仅活跃）
  getTypes: (activeOnly = true): Promise<ApiResponse<MonitoringStationType[]>> => {
    const params = activeOnly ? { only_active: 'true' } : undefined
    return request.get('/monitoring-station-types', { params })
  },
  // 创建类型（专家/管理员）
  createType: (data: Partial<MonitoringStationType>): Promise<ApiResponse<MonitoringStationType>> => {
    return request.post('/monitoring-station-types', data)
  },
  // 更新类型（专家/管理员）
  updateType: (id: number, data: Partial<MonitoringStationType>): Promise<ApiResponse<MonitoringStationType>> => {
    return request.put(`/monitoring-station-types/${id}`, data)
  },
  // 删除类型（管理员）
  deleteType: (id: number): Promise<ApiResponse<null>> => {
    return request.delete(`/monitoring-station-types/${id}`)
  },
  // 使用统计（专家/管理员）
  getUsageStats: (): Promise<ApiResponse<Array<{ code: string; count: number }>>> => {
    return request.get('/monitoring-station-types/stats/usage')
  }
}